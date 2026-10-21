import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync,existsSync,readdirSync,symlinkSync,chmodSync} from 'node:fs';
import {join,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,automationDisplayName,nextVersion,retainedRuns,candidate,automate,cleanupRuns,run,artifactBaseName,packageProduct,uploadAndroid} from '../scripts/build.mjs';
import {initialVersion,platforms,repository} from '../scripts/config.mjs';
const platform=Object.keys(platforms)[0];
const row=(id,conclusion,status='completed')=>({id,status,conclusion,updated_at:new Date(id*1000).toISOString(),head_sha:'a'.repeat(40),path:'.github/workflows/'+platform+'.yml',head_branch:'main',run_attempt:1,display_title:automationDisplayName(platform,'1.2.3')});
test('配置仅声明和引用，导入不派发、不生成现场',async()=>{
 const config=await import('../scripts/config.mjs');assert.equal(config.describeConfiguration().schema,1);
 const source=readFileSync(join(root,'scripts/config.mjs'),'utf8');assert.doesNotMatch(source,/\b(?:spawn|execFile|fetch|dispatch|readFile|writeFile|nextVersion|cleanupRuns)\s*\(/u);
 assert.equal(Object.hasOwn(config.describeConfiguration().configuration.items[0]||{},'value'),false);
});
test('准确名称和版本边界',()=>{
 assert.match(automationDisplayName(platform,'1.2.3'),/·v1\.2\.3$/u);
 for(const version of ['1.2','01.2.3','1.2.3\n','1.2.3-beta',null])assert.throws(()=>automationDisplayName(platform,version));
 assert.throws(()=>automationDisplayName('other','1.2.3'));
});
test('成功才递增，失败重试沿用候选',()=>{
 assert.equal(nextVersion(platform,[]),initialVersion);assert.equal(nextVersion(platform,[row(1,'success'),row(2,'failure')]),'1.2.4');
 const invalid=row(3,'success');invalid.display_title=automationDisplayName(platform,'1.2.3')+'extra';assert.throws(()=>nextVersion(platform,[invalid]));
});
test('最新成功和失败各一条，活动Run全部保留',()=>{
 const rows=[row(1,'success'),row(2,'failure'),row(3,'success'),row(4,'cancelled'),row(5,null,'in_progress')];assert.deepEqual([...retainedRuns(rows)].sort(),[3,4,5]);
});
test('活动Run阻止新派发，当前CI原Run不误拒绝',async()=>{
 const read=async()=>({workflow_runs:[row(11,null,'queued')]});await assert.rejects(candidate(platform,{read,currentRun:0}),/活动/u);
 assert.equal(await candidate(platform,{read,currentRun:11}),initialVersion);
});
test('派发回执不确定只请求一次',async()=>{
 let calls=0;await assert.rejects(automate(platform,{read:async()=>({workflow_runs:[]}),dispatch:async()=>{calls++;return {};} }),/不确定/u);assert.equal(calls,1);
});
test('旧失败删除后回查，不碰活动和另一类最新记录',async()=>{
 let rows=[row(1,'failure'),row(2,'failure'),row(3,null,'in_progress')];const deleted=[];
 const read=async path=>{
  if(path.startsWith('actions/workflows/'))return {workflow_runs:rows};if(path.startsWith('releases?'))return [];
  const value=rows.find(row=>path==='actions/runs/'+row.id);if(value)return value;throw Object.assign(Error('HTTP 404'),{status:404});
 };
 const result=await cleanupRuns(platform,{read,remove:async path=>{deleted.push(path);rows=rows.filter(row=>path!=='actions/runs/'+row.id);}});
 assert.equal(result.completed,true);assert.deepEqual(deleted,['actions/runs/1']);assert.deepEqual(rows.map(row=>row.id),[2,3]);
});
test('新成功资产未确认时保留旧成功',async()=>{
 let deleted=0;const rows=[row(1,'success'),row(2,'success')];await assert.rejects(cleanupRuns(platform,{read:async path=>path.startsWith('releases?')?[]:{workflow_runs:rows},remove:async()=>{deleted++;}}),/保留旧成功/u);assert.equal(deleted,0);
});
test('真实子进程非零退出和取消均失败',async()=>{
 await assert.rejects(run(process.execPath,['-e','process.exit(7)']),/执行失败/u);
 const controller=new AbortController(),pending=run(process.execPath,['-e','setInterval(()=>{},1000)'],{signal:controller.signal});setTimeout(()=>controller.abort(),50);await assert.rejects(pending);
});
// tee不能掩盖上游测试失败，JSON必须同步进入现场和控制台日志。
test('pipefail保留测试退出码且tee保存原JSON报告',async t=>{
 const parent=join(root,'target/test');mkdirSync(parent,{recursive:true});const work=mkdtempSync(join(parent,'report-')),report=join(work,'flutter-report.jsonl');t.after(()=>rmSync(work,{recursive:true,force:true}));
 const fixture='{"type":"done","success":false}\n';
 await assert.rejects(run('/bin/bash',['-o','pipefail','-c','"$1" -e \'process.stdout.write(process.argv[1]);process.exit(7)\' "$2" | tee "$3"','report-test',process.execPath,fixture,report]),/退出码=7/u);
 assert.equal(readFileSync(report,'utf8'),fixture);
});
// 钱包装配和官网内容回归均使用所属产品临时现场，不访问真实凭据或GitHub。
if(platform!=='web'){
 const {materializeInputs}=await import('../scripts/build.mjs'),{generatePlatformIcons}=await import('../icons/generate.mjs');
 test('普通平台工程、原锁及官方图标完整交付',t=>{
  const parent=join(root,'target/test');mkdirSync(parent,{recursive:true});const work=mkdtempSync(join(parent,'layout-')),project=join(work,'source-view');mkdirSync(project);t.after(()=>rmSync(work,{recursive:true,force:true}));
  for(const name of ['ios','android','icons','Podfile.lock'])cpSync(join(root,name),join(project,name),{recursive:true});materializeInputs(root,project);
  for(const name of ['ios/Runner.xcodeproj/project.pbxproj','ios/Runner/HardwareSecretvaultPlugin.swift','ios/signer/citizenwallet_signer.podspec','android/app/src/test/kotlin/com/crcfrcn/citizenwallet/HardwareSecretvaultPluginTest.kt'])assert.ok(existsSync(join(project,name)),name);
  // 此处验证工程装配；iOS四个机器码导出仍由真实编译入口调用nm验收，工具失败不能通过。
  const xcode=JSON.parse(execFileSync('/usr/bin/plutil',['-convert','json','-o','-',join(project,'ios/Runner.xcodeproj/project.pbxproj')],{encoding:'utf8'})),objects=xcode.objects;
  const runner=Object.values(objects).find(value=>value.isa==='PBXNativeTarget'&&value.name==='Runner');
  const configurations=objects[runner.buildConfigurationList].buildConfigurations.map(id=>objects[id]);
  assert.equal(configurations.find(value=>value.name==='Release').buildSettings.STRIP_STYLE,'non-global');
  assert.equal(configurations.find(value=>value.name==='Debug').buildSettings.STRIP_STYLE,undefined);
  assert.ok(readFileSync(join(project,'ios/Podfile.lock')).equals(readFileSync(join(root,'Podfile.lock'))));
  // 物化工程必须声明Release测试类型，与真实Gradle入口一致。
  assert.match(readFileSync(join(project,'android/app/build.gradle.kts'),'utf8'),/^\s*testBuildType = "release"$/mu);
  const android=generatePlatformIcons(project,'android'),ios=generatePlatformIcons(project,'ios');assert.equal(readdirSync(android).length,5);assert.ok(existsSync(join(ios,'AppIcon.appiconset/Contents.json')));
  assert.throws(()=>generatePlatformIcons(root,'ios'),/target/u);
 });
}else{
 const {whitepaperContent,httpsOptions}=await import('../scripts/build.mjs');
 test('白皮书正文和内嵌图片交付保持',()=>{
  const names=[],result=JSON.parse(whitepaperContent('# 原文\n![图](./assets/one.png)',name=>{names.push(name);return Buffer.from('synthetic');}));assert.deepEqual(names,['one.png']);assert.equal(result.markdown,'# 原文\n![图](data:image/png;base64,c3ludGhldGlj)');
  assert.equal(JSON.parse(whitepaperContent('纯正文',()=>{throw Error('不应读取图片');})).markdown,'纯正文');
 });
 test('HTTPS缺件明确失败，配置不含生成插件',()=>{assert.throws(()=>httpsOptions({}),/HTTPS/u);const source=readFileSync(join(root,'config/vite.config.ts'),'utf8');assert.doesNotMatch(source,/generateBundle|writeFile|whitepaperContent|readFileSync/u);});
}

// 删除中断不能丢失原正式版本的归属；重试继续同一批终态，不重跑业务。
test('删除Tag后Release失败，重试仍清理原Release与Run',async()=>{
 const old=row(1,'failure'),fresh=row(2,'failure');let rows=[old,fresh],tag=true,release=true,failOnce=true;
 const proof={run_id:1,platform},record={id:10,tag_name:old.display_title,target_commitish:old.head_sha,body:'<!-- automation:'+JSON.stringify(proof)+' -->'};
 const missing=()=>{throw Object.assign(Error('HTTP 404'),{status:404});};
 const read=async path=>{if(path.startsWith('actions/workflows/'))return {workflow_runs:rows};if(path.startsWith('releases?'))return release?[record]:[];if(path==='releases/10')return release?record:missing();if(path.startsWith('git/ref/tags/'))return tag?{object:{type:'commit',sha:old.head_sha}}:missing();return rows.find(value=>path==='actions/runs/'+value.id)||missing();};
 const remove=async path=>{if(path.startsWith('git/refs/tags/'))tag=false;else if(path==='releases/10'){if(failOnce){failOnce=false;throw Error('HTTP 503');}release=false;}else if(path==='actions/runs/1')rows=rows.filter(value=>value.id!==1);};
 await assert.rejects(cleanupRuns(platform,{read,remove}),/503/u);assert.equal(tag,false);assert.equal(release,true);assert.equal(rows.length,2);
 assert.deepEqual((await cleanupRuns(platform,{read,remove})).deleted,[1]);assert.equal(release,false);
});

// 用Node内置Mock仅模拟本用例的ps查询拒绝，不修改进程权限。
test('EPERM保留工具原失败与现场，工具退出零也不能冒充收尾成功',async t=>{
 const childProcess=(await import('node:child_process')).default,spawnSync=childProcess.spawnSync;
 t.mock.method(childProcess,'spawnSync',(command,...args)=>command==='/bin/ps'?{error:Object.assign(Error('synthetic ps permission'),{code:'EPERM'}),status:null,stdout:''}:spawnSync(command,...args));
 for(const code of [7,0])await assert.rejects(run(process.execPath,['-e',`process.stderr.write("synthetic-tool-result");process.exit(${code});`]),error=>{
  assert.equal(error.keepWork,true);assert.equal(error.processId>0,true);assert.equal(error.groupId,error.processId);assert.match(error.message,/EPERM/u);
  if(code){assert.match(error.message,/退出码=7/u);assert.match(error.message,/synthetic-tool-result/u);assert.match(error.cause.message,/退出码=7/u);}
  return true;
 });
});

// 无效快照不得成功；真实后代仍在时必须等它完成，才允许消费结果。
test('ps空表和缺少调用进程的结果均保留现场',async t=>{
 const childProcess=(await import('node:child_process')).default;
 for(const stdout of ['', 'invalid', '1 1\n']){
  const mock=t.mock.method(childProcess,'spawnSync',()=>({status:0,stdout}));
  try{await assert.rejects(run(process.execPath,['-e','process.exit(0)']),error=>{assert.equal(error.keepWork,true);assert.match(error.message,/查询结果无效/u);return true;});}finally{mock.mock.restore();}
 }
});
test('真实同组后代完成后才返回工具成功',async t=>{
 const base=join(root,'target/test');mkdirSync(base,{recursive:true});const work=mkdtempSync(join(base,'descendant-')),marker=join(work,'done');t.after(()=>rmSync(work,{recursive:true,force:true}));
 const nested=`setTimeout(()=>{require('node:fs').writeFileSync(${JSON.stringify(marker)},'done');},700);`;
 const source=`require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(nested)}],{stdio:'ignore'}).unref();`;
 await run(process.execPath,['-e',source]);assert.equal(readFileSync(marker,'utf8'),'done');
});


// GitHub传输使用官方REST；删除不能依赖控制台最小PATH中的gh。
test('GitHub REST保留方法、令牌及HTTP状态，不启动命令',async()=>{
 const {github}=await import('../scripts/build.mjs');let called=0;
 assert.equal(await github('actions/runs/1',{method:'DELETE',token:'synthetic',fetchImpl:async(url,options)=>{called++;assert.match(url,/\/actions\/runs\/1$/u);assert.equal(options.method,'DELETE');assert.equal(options.headers.Authorization,'Bearer synthetic');return new Response(null,{status:204});}}),null);
 assert.equal(called,1);
 await assert.rejects(github('actions/runs/1',{fetchImpl:async()=>new Response('',{status:404})}),error=>error.status===404);
});
test('新成功尚未验真不阻挡旧失败实际删除',async()=>{
 let rows=[row(1,'success'),row(2,'failure'),row(3,'success'),row(4,'failure')];const deleted=[];
 const read=async path=>{if(path.startsWith('actions/workflows/'))return {workflow_runs:rows};if(path.startsWith('releases?'))return [];const value=rows.find(value=>path==='actions/runs/'+value.id);if(value)return value;throw Object.assign(Error('HTTP 404'),{status:404});};
 await assert.rejects(cleanupRuns(platform,{read,remove:async path=>{deleted.push(path);rows=rows.filter(value=>path!=='actions/runs/'+value.id);}}),/保留旧成功/u);
 assert.deepEqual(deleted,['actions/runs/2']);assert.deepEqual(rows.map(value=>value.id),[1,3,4]);
});
test('删除后仍存在必须明确清理失败',async()=>{
 const rows=[row(1,'failure'),row(2,'failure')];
 await assert.rejects(cleanupRuns(platform,{read:async path=>path.startsWith('actions/workflows/')?{workflow_runs:rows}:path.startsWith('releases?')?[]:rows[0],remove:async()=>{}}),/旧Run删除未确认/u);
});
// 客户端只派发，工作流自己执行GitHub删除，不向控制台索取清理权限。
test('自动化派发后返回准确Run且不轮询或清理GitHub',async()=>{
 let reads=0,dispatches=0;
 const read=async path=>{assert.ok(path.startsWith('actions/workflows/'));reads++;return {workflow_runs:[]};};
 const receipt=await automate(platform,{read,dispatch:async spec=>{dispatches++;assert.deepEqual(spec,{workflow:platform+'.yml',ref:'main',inputs:{version:initialVersion}});return {workflow_run_id:42};}});
 assert.deepEqual(receipt,{runID:42});assert.equal(reads,1);assert.equal(dispatches,1);
});
test('各平台原工作流末尾用本仓令牌调用清理，不新增Job或重复实现',async()=>{
 const {describeAction}=await import('../scripts/build.mjs');
 for(const target of Object.keys(platforms)){
  assert.throws(()=>describeAction({flow:'cleanup',platform:target}),/尚未声明/u);
  const source=readFileSync(join(root,'.github/workflows',target+'.yml'),'utf8');
  assert.match(source,/permissions:\n  contents: write\n  actions: write/u);
  assert.match(source,/      - name: 清理本平台历史记录\n        if: always\(\)\n        env:\n          GH_TOKEN: \$\{\{ github.token \}\}\n          PRODUCT_RESULT: \$\{\{ job.status \}\}\n        run: node scripts\/build.mjs cleanup "\$PLATFORM"\n$/u);
  assert.equal([...source.matchAll(/^  \w+:\n    name:/gmu)].length,1);
 }
});
test('工作流按真实Job结果保留本轮和活动Run，不改写Run终态',async()=>{
 for(const target of Object.keys(platforms))for(const result of ['success','failure','cancelled']){
  const make=(id,conclusion,status='completed')=>({...row(id,conclusion,status),path:'.github/workflows/'+target+'.yml',display_title:automationDisplayName(target,'1.2.3')});
  const current={...make(3,null,'in_progress'),repository:{full_name:repository},event:'workflow_dispatch'},active=make(4,null,'queued');
  let rows=[make(1,'success'),make(2,'failure'),active];const deleted=[];
  const release={id:10,tag_name:current.display_title,draft:false,prerelease:false,assets:Array.from({length:target==='android'?4:3},()=>({})),body:'<!-- automation:'+JSON.stringify({run_id:3,platform:target})+' -->'};
  const missing=()=>{throw Object.assign(Error('HTTP 404'),{status:404});};
  const read=async path=>{
   if(path.startsWith('actions/workflows/'))return {workflow_runs:rows};
   if(path==='actions/runs/3')return current;
   if(path.startsWith('releases?'))return result==='success'?[release]:[];
   if(path.startsWith('git/ref/tags/'))return {object:{type:'commit',sha:current.head_sha}};
   if(path==='actions/runs/3/artifacts?per_page=100')return {artifacts:[{name:current.display_title,expired:false,size_in_bytes:1}]};
   return rows.find(value=>path==='actions/runs/'+value.id)||missing();
  };
  const receipt=await cleanupRuns(target,{read,remove:async path=>{deleted.push(path);rows=rows.filter(value=>path!=='actions/runs/'+value.id);},currentRun:3,result,sourceSha:current.head_sha,attempt:current.run_attempt});
  assert.equal(receipt.completed,true);assert.deepEqual(deleted,['actions/runs/'+(result==='success'?1:2)]);
  assert.deepEqual([...receipt.kept].sort(),result==='success'?[2,3,4]:[1,3,4]);
  assert.equal(current.status,'in_progress');assert.equal(current.conclusion,null);assert.equal(active.status,'queued');
 }
});
test('本轮输入、仓库、分支、平台、提交及attempt不符均禁止删除',async()=>{
 const current={...row(3,null,'in_progress'),repository:{full_name:repository},event:'workflow_dispatch'};
 for(const invalid of [{id:99},{repository:{full_name:'other/repo'}},{head_branch:'other'},{path:'.github/workflows/other.yml'},{event:'push'},{head_sha:'b'.repeat(40)},{run_attempt:2}]){
  let deleted=0;await assert.rejects(cleanupRuns(platform,{currentRun:3,result:'success',sourceSha:current.head_sha,attempt:1,read:async path=>path.startsWith('actions/workflows/')?{workflow_runs:[]}:{...current,...invalid},remove:async()=>{deleted++;}}),/身份不符/u);assert.equal(deleted,0);
 }
 for(const [currentRun,result]of [[-1,'success'],[3,'unknown'],[0,'failure']])await assert.rejects(cleanupRuns(platform,{currentRun,result,read:async()=>({workflow_runs:[]})}),/输入无效/u);
});
test('清理权限失败真实抛出，不改写本轮状态或触发编译派发',async()=>{
 const current={...row(3,null,'in_progress'),repository:{full_name:repository},event:'workflow_dispatch'},previous=row(1,'failure');
 const read=async path=>path.startsWith('actions/workflows/')?{workflow_runs:[previous]}:path.startsWith('releases?')?[]:path==='actions/runs/3'?current:previous;
 let calls=0;await assert.rejects(cleanupRuns(platform,{read,currentRun:3,result:'failure',remove:async path=>{calls++;assert.equal(path,'actions/runs/1');throw Object.assign(Error('HTTP 403'),{status:403});}}),/HTTP 403/u);
 assert.equal(calls,1);assert.equal(current.status,'in_progress');assert.equal(current.conclusion,null);
});



// 安装回归只使用本仓合成附件和设备回执，不接触真实手机或正式包。
const {latestInstallAsset,ensureInstallPackage,downloadInstallAsset,installProduct,describeAction}=await import('../scripts/build.mjs');
function installFixture(t,selectedPlatform='android'){
 const parent=join(root,'target/test');mkdirSync(parent,{recursive:true});const base=mkdtempSync(join(parent,'installation-'));t.after(()=>rmSync(base,{recursive:true,force:true}));
 const bytes=Buffer.from('synthetic signed package'),latest={...row(1,'success'),display_title:automationDisplayName(selectedPlatform,'1.2.3'),path:'.github/workflows/'+selectedPlatform+'.yml',run_number:42};
 const asset={id:100,name:artifactBaseName(selectedPlatform,'1.2.3')+(selectedPlatform==='ios'?'.ipa':'.apk'),size:bytes.length,digest:'sha256:'+createHash('sha256').update(bytes).digest('hex')};
 const release={tag_name:latest.display_title,target_commitish:latest.head_sha,draft:false,prerelease:false,assets:[asset]};
 const read=async path=>{if(path.startsWith('actions/workflows/'))return {workflow_runs:[latest,{...latest,id:2,conclusion:'failure',updated_at:new Date(3000).toISOString(),display_title:automationDisplayName(selectedPlatform,'1.2.4')}]};if(path.startsWith('releases/tags/'))return release;if(path.startsWith('git/ref/tags/'))return {object:{type:'commit',sha:latest.head_sha}};throw Error('不允许的合成读取');};
 return {base,bytes,latest,asset,release,read,selected:{asset,platform:selectedPlatform,version:'1.2.3',buildNumber:'42',path:join(base,asset.name)}};
}
test('缺包下载、最新复用、内容损坏替换，文件直接归指定target现场',async t=>{
 const f=installFixture(t);let downloads=0;const download=async(asset,path)=>{downloads++;assert.equal(dirname(path),f.base);writeFileSync(path,f.bytes);};
 const messages=[],options={base:f.base,read:f.read,download,notify:message=>messages.push(message)};
 const first=await ensureInstallPackage('android',options);assert.equal(dirname(first.path),f.base);assert.equal(basename(first.path),f.asset.name);assert.equal(downloads,1);
 await ensureInstallPackage('android',options);assert.equal(downloads,1);
 writeFileSync(first.path,'broken');await ensureInstallPackage('android',options);assert.equal(downloads,2);assert.ok(readFileSync(first.path).equals(f.bytes));
 assert.deepEqual(readdirSync(f.base),[f.asset.name]);assert.match(messages[0],/下载最新正式包/u);assert.match(messages[1],/直接安装/u);assert.match(messages[2],/下载最新正式包/u);
});
test('下载校验失败保留原包，不留下半包或提前删除旧版',async t=>{
 const f=installFixture(t),old=join(f.base,artifactBaseName('android','1.2.2')+'.apk');writeFileSync(old,'old');writeFileSync(f.selected.path,'previous');
 await assert.rejects(ensureInstallPackage('android',{base:f.base,read:f.read,download:async(_asset,path)=>writeFileSync(path,'bad')}),/摘要不一致/u);
 assert.equal(readFileSync(old,'utf8'),'old');assert.equal(readFileSync(f.selected.path,'utf8'),'previous');assert.equal(readdirSync(f.base).some(name=>name.endsWith('.part')),false);
});
test('新包验真后只删除同平台旧包，保留另一平台',async t=>{
 const f=installFixture(t),old=join(f.base,artifactBaseName('android','1.2.2')+'.apk'),other=join(f.base,artifactBaseName('ios','1.2.2')+'.ipa');writeFileSync(old,'old');writeFileSync(other,'other');
 await ensureInstallPackage('android',{base:f.base,read:f.read,download:async(_asset,path)=>writeFileSync(path,f.bytes)});
 assert.equal(existsSync(old),false);assert.equal(readFileSync(other,'utf8'),'other');
});
test('草稿、错误Tag、缺失摘要、重复或越界附件均拒绝',async t=>{
 for(const mutate of [f=>{f.release.draft=true;},f=>{f.release.target_commitish='b'.repeat(40);},f=>{f.asset.digest='';},f=>{f.release.assets.push({...f.asset,id:101});},f=>{f.asset.name='../escape.apk';}]){
  const f=installFixture(t);mutate(f);await assert.rejects(latestInstallAsset('android',{read:f.read}));
 }
});
test('安装包链接不能被覆盖或当成最新包使用',async t=>{
 const f=installFixture(t),outside=join(f.base,'source');writeFileSync(outside,f.bytes);symlinkSync(outside,f.selected.path);
 await assert.rejects(ensureInstallPackage('android',{base:f.base,read:f.read,download:()=>assert.fail('不得下载覆盖链接')}),/独立普通文件/u);assert.ok(readFileSync(outside).equals(f.bytes));
});
test('官方附件重定向不转发令牌，禁止HTTP下载',async t=>{
 const f=installFixture(t),path=join(f.base,'download.part');let calls=0;
 await downloadInstallAsset(f.asset,path,{token:'synthetic',fetchImpl:async(_url,options)=>{calls++;if(calls===1){assert.equal(options.headers.Authorization,'Bearer synthetic');return new Response(null,{status:302,headers:{location:'https://release-assets.githubusercontent.com/synthetic'}});}assert.equal(options.headers,undefined);return new Response(f.bytes);}});
 assert.ok(readFileSync(path).equals(f.bytes));assert.equal(calls,2);
 await assert.rejects(downloadInstallAsset(f.asset,path+'.bad',{fetchImpl:async()=>new Response(null,{status:302,headers:{location:'http://example.invalid/file'}})}),/下载地址无效/u);
});
function androidTool(f,calls,{devices='synthetic-device\tdevice',wrongIdentity=false,wrongReadback=false,failInstall=false}={}){
 return async(command,args)=>{
  calls.push([basename(command),...args]);
  if(basename(command)==='apkanalyzer')return args[1]==='application-id'?(wrongIdentity?'other.app':'com.crcfrcn.citizenwallet'):args[1]==='version-name'?'1.2.3':'42';
  if(basename(command)==='apksigner')return '';
  if(args[0]==='-d'&&args[1]==='get-serialno'){const rows=devices.split('\n').map(row=>row.trim().split(/\s+/u)).filter(row=>row.length===2&&row[1]==='device'&&!row[0].startsWith('emulator-')&&!row[0].includes(':'));if(rows.length!==1)throw Error('adb没有唯一USB设备');return rows[0][0];}
  if(args.includes('install')){if(failInstall)throw Error('合成安装失败');return 'Success';}
  if(args.includes('dumpsys'))return wrongReadback?'versionCode=41 versionName=1.2.2':'versionCode=42 minSdk=24\n versionName=1.2.3';
  throw Error('不允许的合成工具调用');
 };
}
test('Android保留数据安装并回读版本，零设备、多设备、身份与回读异常均失败',async t=>{
 for(const options of [{},{devices:''},{devices:'one\tdevice\ntwo\tdevice'},{devices:'emulator-5554\tdevice'},{devices:'192.0.2.1:5555\tdevice'},{wrongIdentity:true},{wrongReadback:true},{failInstall:true}]){
  const f=installFixture(t),calls=[],invoke=()=>installProduct('android',{prepare:async()=>f.selected,execute:androidTool(f,calls,options),notify:()=>{}});
  if(Object.keys(options).length)await assert.rejects(invoke());else {assert.equal((await invoke()).completed,true);assert.ok(calls.some(args=>args[0]==='adb'&&args[1]==='-d'&&args[2]==='install'&&args[3]==='-r'));assert.ok(calls.some(args=>args[0]==='adb'&&args[1]==='-d'&&args.includes('dumpsys')));}
  if(options.wrongIdentity||Object.hasOwn(options,'devices'))assert.equal(calls.some(args=>args.includes('install')),false);
  assert.equal(calls.some(args=>args.includes('uninstall')||(args.includes('install')&&args.slice(args.indexOf('install')+1).includes('-d'))),false);assert.equal(existsSync(join(root,'target/.citizenwallet-android.lock')),false);
 }
});
test('iOS使用官方安装和版本回读；签名、安装或回读失败不冒充成功',async t=>{
 for(const failure of ['', 'signature','installation','readback','no-device','multiple','wireless','unpaired','unavailable','simulator']){
  const f=installFixture(t,'ios'),calls=[];
  const execute=async(command,args)=>{
   calls.push([basename(command),...args]);
   if(args[0]==='devicectl'&&args[1]==='list'){
    const device={identifier:'synthetic-device',properties:{hardware:{platform:'iOS',reality:failure==='simulator'?'simulated':'physical'},connection:{state:failure==='unavailable'?'unavailable':'connected',pairingState:failure==='unpaired'?'unpaired':'paired',transportType:failure==='wireless'?'network':'wired'}}};
    return JSON.stringify({result:{devices:failure==='no-device'?[]:failure==='multiple'?[device,{...device,identifier:'second-device'}]:[device]}});
   }
   if(command==='/usr/bin/unzip'&&args[0]==='-Z')return 'Payload/Runner.app/Info.plist';
   if(command==='/usr/bin/unzip'){mkdirSync(join(args.at(-1),'Payload/Runner.app'),{recursive:true});return '';}
   if(command==='/usr/bin/plutil')return JSON.stringify({CFBundleIdentifier:'ios.citizenwallet',CFBundleShortVersionString:'1.2.3',CFBundleVersion:'42'});
   if(command==='/usr/bin/codesign'){if(failure==='signature')throw Error('合成签名失败');return '';}
   if(args.includes('install')){if(failure==='installation')throw Error('合成安装失败');return '';}
   if(args.includes('apps'))return JSON.stringify({result:{apps:[{bundleIdentifier:'ios.citizenwallet',version:failure==='readback'?'1.2.2':'1.2.3',bundleVersion:'42'}]}});
   throw Error('不允许的合成工具调用');
  };
  const invoke=()=>installProduct('ios',{prepare:async()=>f.selected,execute,notify:()=>{}});
  if(failure)await assert.rejects(invoke());else assert.equal((await invoke()).completed,true);
  if(['signature','no-device','multiple','wireless','unpaired','unavailable','simulator'].includes(failure))assert.equal(calls.some(args=>args.includes('install')),false);
  assert.equal(existsSync(join(root,'target/.citizenwallet-ios.lock')),false);
 }

});


// 执行真实工作流的附件回读片段；本仓假GitHub沿用官方文件名及默认分支行为，不访问网络。
test('两平台准确SHA、ASCII附件及中文label生效，损坏附件和默认分支均失败并撤回候选',async t=>{
 for(const target of ['ios','android'])for(const failure of ['', 'corrupt', 'default-target']){
  const parent=join(root,'target/test');mkdirSync(parent,{recursive:true});const work=mkdtempSync(join(parent,'release-'));t.after(()=>rmSync(work,{recursive:true,force:true}));
  const version='1.2.3',title=automationDisplayName(target,version),base=artifactBaseName(target,version),output=join(work,'artifact');mkdirSync(output);
  for(const suffix of target==='ios'?['ipa']:['apk','aab'])writeFileSync(join(output,base+'.'+suffix),'synthetic '+suffix);
  const settings={PRODUCT_WORK:work,PRODUCT_VERSION:version,GITHUB_RUN_ID:'42',GITHUB_RUN_ATTEMPT:'1',GITHUB_RUN_NUMBER:'42',GITHUB_SHA:'a'.repeat(40)},saved=Object.fromEntries(Object.keys(settings).map(key=>[key,process.env[key]]));
  try{Object.assign(process.env,settings);await packageProduct(target);}finally{for(const [key,value]of Object.entries(saved))if(value===undefined)delete process.env[key];else process.env[key]=value;}
  const names=readdirSync(output).sort(),proof=JSON.parse(readFileSync(join(work,'proof.json')));
  assert.equal(names.length,target==='ios'?3:4);assert.ok(names.every(name=>/^[A-Za-z0-9._-]+$/u.test(name)));
  for(const asset of proof.assets){assert.equal(asset.label,title+'.'+asset.name.split('.').at(-1));assert.equal(asset.sha256,createHash('sha256').update(readFileSync(join(output,asset.name))).digest('hex'));}
  const source=join(work,'gh.mjs'),state=join(work,'state.json'),server=join(work,'server');mkdirSync(server);writeFileSync(state,JSON.stringify({tag:false,release:null}));
  writeFileSync(source,`
import {readFileSync,writeFileSync,copyFileSync,readdirSync,rmSync,statSync} from 'node:fs';
import {join,basename} from 'node:path';
const args=process.argv.slice(2),path=process.env.MOCK_STATE,server=process.env.MOCK_SERVER,state=JSON.parse(readFileSync(path));
const save=()=>writeFileSync(path,JSON.stringify(state)),emit=value=>process.stdout.write(JSON.stringify(value));
if(args[0]==='api'){
 const route=args.find(value=>value.startsWith('repos/'));
 if(args.includes('POST')){state.tag=true;save();emit({});}
 else if(args.includes('DELETE')){state.tag=false;save();emit({});}
 else if(route.includes('/releases/tags/'))emit(state.release);
 else if(route.includes('/git/ref/tags/'))emit({object:{type:'commit',sha:process.env.GITHUB_SHA}});
 else throw Error('不允许的合成API');
}else if(args[0]==='release'&&args[1]==='create'){
 const assets=[];
 for(const input of args.slice(3).filter(value=>value.includes('#'))){const [file,label]=input.split('#');const name=basename(file).replace(/[^A-Za-z0-9._-]/gu,'').replace(/^\\.+|\\.+$/gu,'');copyFileSync(file,join(server,name));assets.push({name,label,size:statSync(file).size});}
 state.release={name:args[2],tag_name:args[2],target_commitish:args.includes('--target')?args[args.indexOf('--target')+1]:'main',draft:true,prerelease:false,assets,body:readFileSync(args[args.indexOf('--notes-file')+1],'utf8')};save();
}else if(args[0]==='release'&&args[1]==='download'){
 const destination=args[args.indexOf('--dir')+1];for(const name of readdirSync(server))copyFileSync(join(server,name),join(destination,name));if(process.env.MOCK_CORRUPT==='1')writeFileSync(join(destination,readdirSync(server)[0]),'corrupt');
}else if(args[0]==='release'&&args[1]==='edit'){state.release.draft=false;save();}
else if(args[0]==='release'&&args[1]==='view'){if(!state.release)process.exit(1);emit({body:state.release.body});}
else if(args[0]==='release'&&args[1]==='delete'){state.release=null;state.tag=false;save();}
else throw Error('不允许的合成GitHub命令');
`);
  const executable=join(work,'gh');writeFileSync(executable,['#!/bin/sh','exec "$NODE_BINARY" "$MOCK_SOURCE" "$@"',''].join(String.fromCharCode(10)));chmodSync(executable,0o700);
  const workflow=readFileSync(join(root,'.github/workflows',target+'.yml'),'utf8'),start=workflow.indexOf('      - name: 创建正式Tag和Release并逐件回读'),end=workflow.indexOf('\n      - ',start+1),block=workflow.slice(start,end),marker='        run: |'+String.fromCharCode(10);
  let script=block.slice(block.indexOf(marker)+marker.length).split(String.fromCharCode(10)).map(line=>line.startsWith('          ')?line.slice(10):line).join(String.fromCharCode(10));
  if(failure==='default-target'){assert.ok(script.includes('--target "$GITHUB_SHA"'));script=script.replace('--target "$GITHUB_SHA"','');}
  const options={env:{...settings,PLATFORM:target,GITHUB_REPOSITORY:'crcfrcn/citizenwallet',NODE_BINARY:process.execPath,MOCK_SOURCE:source,MOCK_STATE:state,MOCK_SERVER:server,MOCK_CORRUPT:failure==='corrupt'?'1':'0',PATH:work+':'+dirname(process.execPath)+':'+process.env.PATH},capture:true};
  if(failure){await assert.rejects(run('/bin/bash',['-c',script],options),/执行失败/u);const result=JSON.parse(readFileSync(state));assert.equal(result.release,null);assert.equal(result.tag,false);}
  else{await run('/bin/bash',['-c',script],options);const result=JSON.parse(readFileSync(state));assert.equal(result.release.draft,false);assert.equal(result.release.target_commitish,settings.GITHUB_SHA);assert.deepEqual(result.release.assets.map(asset=>asset.name).sort(),names);for(const asset of result.release.assets)assert.equal(asset.label,title+'.'+asset.name.split('.').at(-1));}
 }
});

// 旧push与派发记录属于同一平台历史；候选版本不能因此读取无版本的旧成功记录。
test('清理覆盖旧push及分页，候选仍只查派发，活动记录全部保留',async()=>{
 for(const target of Object.keys(platforms)){
  const make=(id,conclusion,event='workflow_dispatch',status='completed')=>({...row(id,conclusion,status),path:'.github/workflows/'+target+'.yml',event,repository:{full_name:repository}});
  let rows=[make(1,'failure','push'),make(2,'success'),make(3,'failure'),make(4,null,'push','in_progress')];const deleted=[],queries=[];
  const missing=()=>{throw Object.assign(Error('HTTP 404'),{status:404});};
  const read=async path=>{
   if(path.startsWith('actions/workflows/')){
    queries.push(path);const url=new URL('https://api.github.com/'+path);assert.equal(url.searchParams.get('branch'),'main');
    if(url.searchParams.has('event')){assert.equal(url.searchParams.get('event'),'workflow_dispatch');return {workflow_runs:[]};}
    const legacy=Array.from({length:100},(_,index)=>({...make(100+index,'failure','push'),updated_at:new Date(0).toISOString()})).filter(row=>!deleted.includes('actions/runs/'+row.id));
    const all=[...legacy,...rows],page=Number(url.searchParams.get('page'));return {workflow_runs:all.slice((page-1)*100,page*100)};
   }
   if(path.startsWith('releases?'))return [];
   const legacy=/^actions\/runs\/(\d+)$/u.exec(path);if(legacy&&Number(legacy[1])>=100&&Number(legacy[1])<200)return deleted.includes(path)?missing():make(Number(legacy[1]),'failure','push');
   return rows.find(value=>path==='actions/runs/'+value.id)||missing();
  };
  const result=await cleanupRuns(target,{read,remove:async path=>{deleted.push(path);rows=rows.filter(value=>path!=='actions/runs/'+value.id);}});
  assert.equal(result.completed,true);assert.equal(deleted.length,101);assert.ok(deleted.includes('actions/runs/1'));assert.deepEqual(rows.map(row=>row.id),[2,3,4]);assert.deepEqual([...result.kept].sort(),[2,3,4]);
  assert.equal(await candidate(target,{read,currentRun:0}),initialVersion);assert.ok(queries.at(-1).includes('event=workflow_dispatch'));
 }
});
test('清理拒绝其他仓库、平台或分支记录，不删除归属不符对象',async()=>{
 for(const invalid of [{path:'.github/workflows/other.yml'},{head_branch:'other'},{repository:{full_name:'other/repo'}}]){
  let deleted=0;await assert.rejects(cleanupRuns(platform,{read:async()=>({workflow_runs:[{...row(1,'failure'),...invalid}]}),remove:async()=>{deleted++;}}),/归属不符/u);assert.equal(deleted,0);
 }
});

// 蓝色按钮只启动所属产品的独立安装进程，不取得控制台GitHub凭据或运行编译。
test('两平台按钮沿公民App方式声明独立install子进程',()=>{
 for(const platform of ['ios','android']){
  const declared=describeAction({flow:'build',platform});assert.equal(declared.command,process.execPath);assert.deepEqual(declared.args,[join(root,'scripts/build.mjs'),'install',platform]);assert.equal(declared.cwd,root);
  assert.deepEqual(Object.keys(declared.env).sort(),['HOME','PATH']);assert.equal(declared.env.PATH,'/usr/bin:/bin');assert.equal(declared.env.HOME,process.env.HOME);assert.equal(declared.repository,undefined);assert.equal(declared.launch,undefined);
 }
});
test('独立install失败沿真实进程退出码交付，不输出伪造退出事件',async()=>{
 await assert.rejects(run(process.execPath,[join(root,'scripts/build.mjs'),'install','invalid'],{env:{NODE_TEST_CONTEXT:''},capture:true}),error=>{assert.match(error.message,/退出码=1/u);assert.match(error.message,/产品平台或版本无效/u);return true;});
});

// 执行真实上传步骤，Apple工具仅用本仓合成命令模拟，不读取现有凭据或访问Apple。
test('iOS验收成功后上传同一IPA，上传失败与缺少凭据均失败且私钥现场清理',async t=>{
 const workflow=readFileSync(join(root,'.github/workflows/ios.yml'),'utf8'),start=workflow.indexOf('      - name: 上传正式IPA到App Store Connect'),end=workflow.indexOf('\n      - ',start+1),block=workflow.slice(start,end),marker='        run: |\n';
 assert.ok(start>workflow.indexOf('      - name: 创建正式Tag和Release并逐件回读'));assert.ok(end>start);assert.doesNotMatch(block,/continue-on-error|if: always/u);
 const script=block.slice(block.indexOf(marker)+marker.length).split('\n').map(line=>line.startsWith('          ')?line.slice(10):line).join('\n');
 for(const failure of ['', 'upload','APP_STORE_KEY_ID','APP_STORE_ISSUER_ID','APP_STORE_PRIVATE_KEY']){
  const parent=join(root,'target/test');mkdirSync(parent,{recursive:true});const work=mkdtempSync(join(parent,'appstore-'));t.after(()=>rmSync(work,{recursive:true,force:true}));
  const signing=join(work,'signing');mkdirSync(signing);mkdirSync(join(work,'artifact'));
  const ipa=join(work,'artifact',artifactBaseName('ios','1.2.3')+'.ipa');writeFileSync(ipa,'synthetic IPA');
  const source=join(work,'upload.mjs'),argsFile=join(work,'args.json');
  writeFileSync(source,`import {readFileSync,writeFileSync} from 'node:fs';import assert from 'node:assert/strict';import {join} from 'node:path';assert.equal(readFileSync(join(process.env.API_PRIVATE_KEYS_DIR,'AuthKey_'+process.env.APP_STORE_KEY_ID+'.p8'),'utf8'),'synthetic-not-a-private-key\\n');writeFileSync(process.env.MOCK_ARGUMENTS,JSON.stringify(process.argv.slice(2)));process.exit(Number(process.env.MOCK_EXIT));`);
  const executable=join(work,'xcrun');writeFileSync(executable,'#!/bin/sh\nexec "$NODE_BINARY" "$MOCK_SOURCE" "$@"\n');chmodSync(executable,0o700);
  const env={PRODUCT_WORK:work,PRODUCT_VERSION:'1.2.3',APP_STORE_KEY_ID:'SYNTHETIC',APP_STORE_ISSUER_ID:'synthetic-issuer',APP_STORE_PRIVATE_KEY:'synthetic-not-a-private-key',NODE_BINARY:process.execPath,MOCK_SOURCE:source,MOCK_ARGUMENTS:argsFile,MOCK_EXIT:failure==='upload'?'7':'0',PATH:work+':'+dirname(process.execPath)+':'+process.env.PATH};
  if(failure.startsWith('APP_STORE_'))env[failure]='';
  if(failure)await assert.rejects(run('/bin/bash',['-c',script],{env,capture:true}));else await run('/bin/bash',['-c',script],{env,capture:true});
  assert.equal(existsSync(join(signing,'appstore')),false);
  if(failure.startsWith('APP_STORE_'))assert.equal(existsSync(argsFile),false);
  else assert.deepEqual(JSON.parse(readFileSync(argsFile)),['altool','--upload-package',ipa,'--api-key','SYNTHETIC','--api-issuer','synthetic-issuer','--wait','--output-format','json']);
  assert.equal(readFileSync(ipa,'utf8'),'synthetic IPA');
 }
});

test('钱包两平台不再声明独立发布动作或发布文件',()=>{
 for(const platform of ['ios','android'])assert.throws(()=>describeAction({flow:'publish',platform}),/尚未声明/u);
 assert.equal(existsSync(join(root,'scripts/publish.mjs')),false);
 const config=readFileSync(join(root,'scripts/config.mjs'),'utf8');assert.match(config,/"name": "PLAY_KEY"/u);
 const workflow=readFileSync(join(root,'.github/workflows/android.yml'),'utf8');
 assert.ok(workflow.indexOf('      - name: Google官方认证')>workflow.indexOf('      - name: 创建正式Tag和Release并逐件回读'));
 assert.match(workflow,/google-github-actions\/auth@[a-f0-9]{40}/u);assert.match(workflow,/create_credentials_file: false/u);
 assert.match(workflow,/access_token_scopes: https:\/\/www.googleapis.com\/auth\/androidpublisher/u);
 assert.match(workflow,/run: node scripts\/build.mjs upload android/u);
});

// 只模拟Google官方HTTP回执；不使用真实账号、不访问商店、不改变发布轨道。
test('Google上传同一验收AAB并提交后回读，缺配置或任一步失败均不能报成功',async t=>{
 for(const failure of ['', 'token','proof','http','network','version','digest','commit','receipt','readback','cleanup']){
  const parent=join(root,'target/test');mkdirSync(parent,{recursive:true});const work=mkdtempSync(join(parent,'google-'));t.after(()=>rmSync(work,{recursive:true,force:true}));
  const version='1.2.3',name=artifactBaseName('android',version)+'.aab',bytes=Buffer.from('synthetic AAB'),digest=createHash('sha256').update(bytes).digest('hex');mkdirSync(join(work,'artifact'));writeFileSync(join(work,'artifact',name),bytes);
  writeFileSync(join(work,'proof.json'),JSON.stringify({product_id:'citizenwallet',platform:'android',version,source_sha:'a'.repeat(40),run_id:12,assets:[{name,size:bytes.length,sha256:failure==='proof'?'0'.repeat(64):digest}]}));
  const calls=[];let edits=0;
  const fetchImpl=async(url,options)=>{
   const endpoint=new URL(url);assert.equal(endpoint.protocol,'https:');assert.equal(endpoint.hostname,'androidpublisher.googleapis.com');assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer synthetic-token');
   calls.push([options.method,endpoint.pathname,endpoint.search]);
   const reply=value=>new Response(JSON.stringify(value),{status:200,headers:{'content-type':'application/json'}});
   if(options.method==='DELETE')return failure==='cleanup'?new Response(null,{status:503}):new Response(null,{status:204});
   if(options.method==='POST'&&endpoint.pathname.endsWith('/edits')){assert.equal(options.body,'{}');return reply({id:String(++edits)});}
   if(options.method==='POST'&&endpoint.pathname.endsWith('/bundles')){
    assert.deepEqual(options.body,bytes);assert.equal(options.headers['Content-Type'],'application/octet-stream');assert.equal(endpoint.search,'?uploadType=media');
    if(failure==='network')throw Error('synthetic network failure');if(failure==='http')return new Response(null,{status:403});
    return reply({versionCode:failure==='version'?43:42,sha256:failure==='digest'?'0'.repeat(64):digest});
   }
   if(options.method==='POST'&&endpoint.pathname.endsWith(':commit')){
    assert.equal(endpoint.search,'?changesInReviewBehavior=ERROR_IF_IN_REVIEW');assert.equal(options.body,undefined);
    if(failure==='commit')return new Response(null,{status:400});return reply({id:failure==='receipt'?'99':'1'});
   }
   if(options.method==='GET'&&endpoint.pathname.endsWith('/2/bundles'))return reply({bundles:[{versionCode:42,sha256:failure==='readback'?'0'.repeat(64):digest}]});
   assert.fail('出现未声明的Google请求');
  };
  const invoke=()=>uploadAndroid({token:failure==='token'?'':'synthetic-token',fetchImpl,work,version,number:'42',runID:'12',sourceSha:'a'.repeat(40)});
  if(failure)await assert.rejects(invoke);else assert.deepEqual(await invoke(),{uploaded:true,platform:'android',version,buildNumber:'42'});
  if(['token','proof'].includes(failure))assert.equal(calls.length,0);
  else if(['http','network','version','digest','commit','receipt'].includes(failure))assert.equal(calls.at(-1)[1].endsWith('/edits/1'),true);
  else assert.deepEqual(calls.map(value=>value[0]),['POST','POST','POST','POST','GET','DELETE']);
  assert.equal(calls.some(value=>value[1].includes('/tracks')),false);assert.deepEqual(readFileSync(join(work,'artifact',name)),bytes);
 }
});

test('商店上传失败只撤回本轮准确候选，保留失败Run和日志且不占用重试版本',async()=>{
 for(const target of ['ios','android'])for(const failure of ['', 'attempt','source','title','tag','delete']){
  const current={...row(3,null,'in_progress'),repository:{full_name:repository},event:'workflow_dispatch',path:'.github/workflows/'+target+'.yml',display_title:automationDisplayName(target,'1.2.3')},previous={...row(1,'success'),path:current.path};
  const proof={run_id:current.id,platform:target,run_attempt:failure==='attempt'?2:1,source_sha:failure==='source'?'b'.repeat(40):current.head_sha};
  const release={id:10,target_commitish:current.head_sha,tag_name:failure==='title'?'other':current.display_title,body:'<!-- automation:'+JSON.stringify(proof)+' -->'};
  let present=true,tag=true;const deleted=[];
  const missing=()=>{throw Object.assign(Error('HTTP 404'),{status:404});};
  const read=async path=>{
   if(path.startsWith('actions/workflows/'))return {workflow_runs:[previous,current]};
   if(path==='actions/runs/3')return current;
   if(path.startsWith('releases?'))return present?[release]:[];
   if(path==='releases/10')return present?release:missing();
   if(path.startsWith('git/ref/tags/'))return tag?{object:{type:'commit',sha:failure==='tag'?'b'.repeat(40):current.head_sha}}:missing();
   assert.fail('不应读取或删除本轮日志、Artifact或其他Run');
  };
  const remove=async path=>{
   if(failure==='delete')throw Error('HTTP 403');deleted.push(path);
   if(path.startsWith('git/refs/tags/'))tag=false;else if(path==='releases/10')present=false;else assert.fail('禁止删除本轮Run或日志');
  };
  const invoke=()=>cleanupRuns(target,{read,remove,currentRun:3,result:'failure',sourceSha:current.head_sha,attempt:1});
  if(failure){await assert.rejects(invoke);assert.equal(deleted.length,0);}
  else{const receipt=await invoke();assert.equal(receipt.completed,true);assert.deepEqual(receipt.deleted,[]);assert.deepEqual([...receipt.kept].sort(),[1,3]);assert.equal(present,false);assert.equal(tag,false);}
  assert.equal(current.status,'in_progress');assert.equal(current.conclusion,null);
 }
});
