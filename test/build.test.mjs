import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync,existsSync,readdirSync,symlinkSync} from 'node:fs';
import {join,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {root,automationDisplayName,nextVersion,retainedRuns,candidate,automate,cleanupRuns,run} from '../scripts/build.mjs';
import {initialVersion,platforms} from '../scripts/config.mjs';
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
 let calls=0;await assert.rejects(automate(platform,{read:async()=>({workflow_runs:[]}),dispatch:async()=>{calls++;return {};},notify:()=>{}}),/不确定/u);assert.equal(calls,1);
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
test('Run终态先于清理交付，清理失败不丢失真实失败',async t=>{
 const previous=row(1,'failure'),current=row(2,'failure'),events=[];let terminal=false;
 const read=async path=>path.startsWith('actions/workflows/')?{workflow_runs:[previous]}:path.startsWith('releases?')?[]:path==='actions/runs/2'?current:previous;
 t.mock.method(globalThis,'fetch',async(_url,options)=>{assert.equal(options.method,'DELETE');assert.equal(terminal,true);return new Response('',{status:403});});
 await assert.rejects(automate(platform,{read,dispatch:async()=>({workflow_run_id:2}),notify:value=>{events.push(value);if(value.event==='run'&&value.run.status==='completed')terminal=true;}}),/HTTP 403/u);
 assert.equal(events.find(value=>value.event==='run').run.conclusion,'failure');
 assert.match(Buffer.from(events.find(value=>value.event==='output').data,'base64').toString(),/清理未完成/u);
});


// 安装回归只使用本仓合成附件和设备回执，不接触真实手机或正式包。
const {latestInstallAsset,ensureInstallPackage,downloadInstallAsset,installProduct,describeAction}=await import('../scripts/build.mjs');
function installFixture(t,selectedPlatform='android'){
 const parent=join(root,'target/test');mkdirSync(parent,{recursive:true});const base=mkdtempSync(join(parent,'installation-'));t.after(()=>rmSync(base,{recursive:true,force:true}));
 const bytes=Buffer.from('synthetic signed package'),latest={...row(1,'success'),display_title:automationDisplayName(selectedPlatform,'1.2.3'),path:'.github/workflows/'+selectedPlatform+'.yml',run_number:42};
 const asset={id:100,name:latest.display_title+(selectedPlatform==='ios'?'.ipa':'.apk'),size:bytes.length,digest:'sha256:'+createHash('sha256').update(bytes).digest('hex')};
 const release={tag_name:latest.display_title,target_commitish:latest.head_sha,draft:false,prerelease:false,assets:[asset]};
 const read=async path=>{if(path.startsWith('actions/workflows/'))return {workflow_runs:[latest,{...latest,id:2,conclusion:'failure',updated_at:new Date(3000).toISOString(),display_title:automationDisplayName(selectedPlatform,'1.2.4')}]};if(path.startsWith('releases/tags/'))return release;if(path.startsWith('git/ref/tags/'))return {object:{type:'commit',sha:latest.head_sha}};throw Error('不允许的合成读取');};
 return {base,bytes,latest,asset,release,read,selected:{asset,platform:selectedPlatform,version:'1.2.3',buildNumber:'42',path:join(base,asset.name)}};
}
test('缺包下载、最新复用、内容损坏替换，文件直接归指定target现场',async t=>{
 const f=installFixture(t);let downloads=0;const download=async(asset,path)=>{downloads++;assert.equal(dirname(path),f.base);writeFileSync(path,f.bytes);};
 const options={base:f.base,read:f.read,download};
 const first=await ensureInstallPackage('android',options);assert.equal(dirname(first.path),f.base);assert.equal(basename(first.path),f.asset.name);assert.equal(downloads,1);
 await ensureInstallPackage('android',options);assert.equal(downloads,1);
 writeFileSync(first.path,'broken');await ensureInstallPackage('android',options);assert.equal(downloads,2);assert.ok(readFileSync(first.path).equals(f.bytes));
 assert.deepEqual(readdirSync(f.base),[f.asset.name]);
});
test('下载校验失败保留原包，不留下半包或提前删除旧版',async t=>{
 const f=installFixture(t),old=join(f.base,automationDisplayName('android','1.2.2')+'.apk');writeFileSync(old,'old');writeFileSync(f.selected.path,'previous');
 await assert.rejects(ensureInstallPackage('android',{base:f.base,read:f.read,download:async(_asset,path)=>writeFileSync(path,'bad')}),/摘要不一致/u);
 assert.equal(readFileSync(old,'utf8'),'old');assert.equal(readFileSync(f.selected.path,'utf8'),'previous');assert.equal(readdirSync(f.base).some(name=>name.endsWith('.part')),false);
});
test('新包验真后只删除同平台旧包，保留另一平台',async t=>{
 const f=installFixture(t),old=join(f.base,automationDisplayName('android','1.2.2')+'.apk'),other=join(f.base,automationDisplayName('ios','1.2.2')+'.ipa');writeFileSync(old,'old');writeFileSync(other,'other');
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
  if(args[0]==='devices')return 'List of devices attached\n'+devices;
  if(args.includes('install')){if(failInstall)throw Error('合成安装失败');return 'Success';}
  if(args.includes('dumpsys'))return wrongReadback?'versionCode=41 versionName=1.2.2':'versionCode=42 minSdk=24\n versionName=1.2.3';
  throw Error('不允许的合成工具调用');
 };
}
test('Android保留数据安装并回读版本，零设备、多设备、身份与回读异常均失败',async t=>{
 for(const options of [{},{devices:''},{devices:'one\tdevice\ntwo\tdevice'},{wrongIdentity:true},{wrongReadback:true},{failInstall:true}]){
  const f=installFixture(t),calls=[],invoke=()=>installProduct('android',{prepare:async()=>f.selected,execute:androidTool(f,calls,options),notify:()=>{}});
  if(Object.keys(options).length)await assert.rejects(invoke());else {assert.equal((await invoke()).completed,true);assert.ok(calls.some(args=>args.includes('install')&&args.includes('-r')));}
  if(options.wrongIdentity||Object.hasOwn(options,'devices'))assert.equal(calls.some(args=>args.includes('install')),false);
  assert.equal(calls.some(args=>args.includes('uninstall')||args.includes('-d')),false);assert.equal(existsSync(join(root,'target/.citizenwallet-android.lock')),false);
 }
});
test('iOS使用官方安装和版本回读；签名、安装或回读失败不冒充成功',async t=>{
 for(const failure of ['', 'signature','installation','readback']){
  const f=installFixture(t,'ios'),calls=[];
  const execute=async(command,args)=>{
   calls.push([basename(command),...args]);
   if(args[0]==='devicectl'&&args[1]==='list')return JSON.stringify({result:{devices:[{identifier:'synthetic-device',properties:{hardware:{platform:'iOS',reality:'physical'},connection:{state:'connected',pairingState:'paired'}}}]}});
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
  if(failure==='signature')assert.equal(calls.some(args=>args.includes('install')),false);
  assert.equal(existsSync(join(root,'target/.citizenwallet-ios.lock')),false);
 }
 const declared=describeAction({flow:'build',platform:'ios'});assert.equal(typeof declared.launch,'function');assert.equal(declared.command,undefined);
});
