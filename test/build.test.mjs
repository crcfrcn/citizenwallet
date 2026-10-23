import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync,existsSync,readdirSync,symlinkSync,chmodSync} from 'node:fs';
import {join,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {root,displayName,run,artifactBaseName,packageProduct,uploadAndroid} from '../scripts/build.mjs';
import {describeAction} from '../scripts/config.mjs';
import {initialVersion,platforms,repository} from '../scripts/config.mjs';
const platform=Object.keys(platforms)[0];
test('配置仅声明和引用，导入不派发、不生成现场',async()=>{
 const config=await import('../scripts/config.mjs');assert.equal(config.describeConfiguration().schema,1);
 const source=readFileSync(join(root,'scripts/config.mjs'),'utf8');assert.doesNotMatch(source,/\b(?:spawn|execFile|fetch|dispatch|readFile|writeFile)\s*\(/u);
 assert.equal(Object.hasOwn(config.describeConfiguration().configuration.items[0]||{},'value'),false);
});
test('准确名称和版本边界',()=>{
 assert.match(displayName(platform,'1.2.3'),/·v1\.2\.3$/u);
 for(const version of ['1.2','01.2.3','1.2.3\n','1.2.3-beta',null])assert.throws(()=>displayName(platform,version));
 assert.throws(()=>displayName('other','1.2.3'));
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

// 客户端只派发，工作流自己执行GitHub删除，不向控制台索取清理权限。

test('各平台Workflow独立生成版本和清理，配置只声明数据',()=>{
 for(const target of Object.keys(platforms)){
  assert.deepEqual(describeAction({flow:'release',platform:target}),{repository,workflow:target+'.yml',ref:'main',inputs:{}});
  const source=readFileSync(join(root,'.github/workflows',target+'.yml'),'utf8');assert.match(source,/gh run delete/u);assert.match(source,/github\.run_number/u);
 }
});

// 本机安装已归控制台；产品公开流程不得恢复安装或下载入口。
test('产品只声明自动化和测试，拒绝旧build安装入口',async()=>{
 const {describeAction}=await import('../scripts/config.mjs');
 assert.throws(()=>describeAction({flow:'build',platform:'android'}),/未声明/u);
 assert.throws(()=>describeAction({flow:'install',platform:'ios'}),/未声明/u);
 const declaration=describeAction({flow:'release',platform:'android'});assert.equal(declaration.repository,repository);
});

// 执行真实工作流的附件回读片段；本仓假GitHub沿用官方文件名及默认分支行为，不访问网络。
test('两平台准确SHA、ASCII附件及中文label生效，损坏附件和默认分支均失败并撤回候选',async t=>{
 for(const target of ['ios','android'])for(const failure of ['', 'corrupt', 'default-target']){
  const parent=join(root,'target/test');mkdirSync(parent,{recursive:true});const work=mkdtempSync(join(parent,'release-'));t.after(()=>rmSync(work,{recursive:true,force:true}));
  const version='1.2.3',title=displayName(target,version),base=artifactBaseName(target,version),output=join(work,'artifact');mkdirSync(output);
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
 for(const platform of ['ios','android'])assert.throws(()=>describeAction({flow:'publish',platform}),/未声明/u);
 assert.equal(existsSync(join(root,'scripts/publish.mjs')),false);
 // 商店凭据复用控制台现有受保护自定义配置，不重复声明或沿用失效账号。
 const config=readFileSync(join(root,'scripts/config.mjs'),'utf8');assert.doesNotMatch(config,/PLAY_KEY|GOOGLE_PLAY_SERVICE_ACCOUNT/u);
 const workflow=readFileSync(join(root,'.github/workflows/android.yml'),'utf8');
 assert.match(workflow,/credentials_json: \$\{\{ secrets\.GOOGLE_PLAY_SERVICE_ACCOUNT \}\}/u);assert.doesNotMatch(workflow,/secrets\.PLAY_KEY\b/u);
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
