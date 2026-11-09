// 按官方要求或推荐实现；必需的工具依赖有就复用，没有就下载；使用最简单的实现方式；本脚本只允许放编译构建代码和注释，禁止增加无关内容，禁止增加复杂的校验阻断。
// config.mjs：只负责配置声明；build.mjs：只负责编译构建实现和必要注释；*.yml：负责全部GitHub流程，包括版本、作业编排、发布及历史清理。
import childProcess,{spawn} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,copyFileSync,cpSync,rmSync,readdirSync,lstatSync,realpathSync,chmodSync,existsSync,rmdirSync,openSync,closeSync,writeSync,renameSync,accessSync,constants,statSync} from 'node:fs';
import {join,dirname,resolve,relative,sep,basename,isAbsolute,delimiter} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {homedir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {tools,repository,platforms} from './config.mjs';
export const root=fileURLToPath(new URL('../',import.meta.url));
// 初始版号只来自产品pubspec；正式版本由本平台成功Release及来源Run确定。
function initialBuild(){
 const match=/^version:\s*([^+\s]+)(?:\+(\d+))?/mu.exec(readFileSync(join(root,'pubspec.yaml'),'utf8'));
 return {version:match[1],buildNumber:match[2]||'1'};
}
async function readGitHub(route){
 const env={...process.env,PATH:[process.env.PATH,'/opt/homebrew/bin','/usr/local/bin'].filter(Boolean).join(':'),
  GH_HOST:'github.com',GH_PROMPT_DISABLED:'1',GH_NO_UPDATE_NOTIFIER:'1',GH_DEBUG:''};
 return JSON.parse(childProcess.execFileSync('gh',['api','repos/'+repository+route],
  {env,encoding:'utf8',timeout:30000,maxBuffer:16*1024*1024}));
}
export async function selectRelease(platform,read=readGitHub){
 displayName(platform,initialBuild().version);
 const releases=[];
 for(let page=1;;page++){
  const rows=await read('/releases?per_page=100&page='+page);releases.push(...rows);
  if(rows.length<100)break;
 }
 const prefix=productTitle+'·'+platforms[platform]+'·v';
 for(const release of releases.filter(row=>row.draft===false&&row.prerelease===false&&row.tag_name?.startsWith(prefix))
  .sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at))||b.id-a.id)){
  let proof;try{proof=JSON.parse(/<!-- automation:([^\n]*) -->/u.exec(release.body)?.[1]);}catch{continue;}
  if(proof?.product_id!=='citizenwallet'||proof.platform!==platform)continue;
  displayName(platform,proof.version);
  if(proof.schema!==1||release.tag_name!==prefix+proof.version||!Number.isSafeInteger(proof.run_id)||proof.run_id<=0)throw Error('公民钱包正式版本记录无效');
  const run=await read('/actions/runs/'+proof.run_id);
  if(run.status!=='completed'||run.conclusion!=='success')continue;
  if(run.path!=='.github/workflows/'+platform+'.yml'||run.head_branch!=='main'||run.event!=='workflow_dispatch'
   ||run.head_sha!==proof.source_sha||run.run_attempt!==proof.run_attempt||!Number.isSafeInteger(run.run_number)||run.run_number<=0)throw Error('公民钱包正式版本与成功Run不符');
  return {version:proof.version,buildNumber:String(run.run_number)};
 }
 return null;
}
const controller=new AbortController();
// Apple嵌套代码及权限由本产品交付，不让安装器猜测产品结构。
export function appleSigning(app, entitlements = null) {
 const targets=[];
 const visit=directory=>{for(const name of readdirSync(directory).sort()){
  const file=join(directory,name),info=lstatSync(file);
  if(info.isSymbolicLink())continue;
  if(info.isDirectory())visit(file);
  if(name.endsWith('.framework')||name.endsWith('.dylib')||name.endsWith('.appex'))targets.push({path:relative(app,file).split(sep).join('/'),entitlements:null});
 }};
 visit(app);return [...targets,{path:'.',entitlements}];
}

export function displayName(platform,version){
 if(!Object.hasOwn(platforms,platform)||typeof version!=='string'||version.length>64||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(version))throw Error('产品平台或版本无效');
 return productTitle+'·'+platforms[platform]+'·v'+version;
}
// GitHub附件文件名使用稳定ASCII；中文名称只作为Run/Tag/Release及附件label显示。
export function artifactBaseName(platform,version){displayName(platform,version);return 'citizenwallet-'+platform+'-v'+version;}

export function insideTarget(path){const base=join(root,'target');return typeof path==='string'&&resolve(path)===path&&path.startsWith(base+sep);}
function directory(path){
 if(!insideTarget(path))throw Error('任务目录必须归本产品target');
 for(let at=path;at!==resolve(root);at=dirname(at))if(existsSync(at)&&lstatSync(at).isSymbolicLink())throw Error('任务目录经过链接');
 mkdirSync(path,{recursive:true});if(realpathSync(path)!==path)throw Error('任务目录经过链接');return path;
}
function task(kind,platform){displayName(platform,initialBuild().version);return mkdtempSync(join(directory(join(root,'target',kind)),platform+'-'));}
function put(path,bytes){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes,{mode:0o600});}
function copy(from,to){mkdirSync(dirname(to),{recursive:true});cpSync(from,to,{recursive:true,verbatimSymlinks:true});}
function sourceView(work,names){
 const project=join(work,'source-view');mkdirSync(project);
 for(const name of names)copy(join(root,name),join(project,name));return project;
}
// 每次调用拥有独立进程组；取消或未退出的后代禁止提前清场。
export async function run(command,args,{cwd=root,env={},capture=false,input,signal=controller.signal}={}){
 signal.throwIfAborted();const environment={...process.env,...env};delete environment.GH_TOKEN;delete environment.GITHUB_TOKEN;
 const tool=basename(command);
 return new Promise((ok,fail)=>{
  const child=spawn(command,args,{cwd,env:environment,detached:true,stdio:[input===undefined?'ignore':'pipe',capture?'pipe':process.stderr,'pipe']});
  let output='',diagnostic='',failure,timer;
  const kill=name=>{try{process.kill(-child.pid,name);}catch{}};
  const stop=()=>{kill('SIGTERM');timer??=setTimeout(()=>kill('SIGKILL'),2000);};signal.addEventListener('abort',stop,{once:true});
  child.stdout?.on('data',bytes=>{output+=bytes;if(output.length>32*1024**2){failure=Error('工具输出超限');stop();}});
  child.stderr.on('data',bytes=>{diagnostic=(diagnostic+bytes).slice(-8000);process.stderr.write(bytes);});
  child.once('error',error=>{failure=error;});child.stdin?.on('error',()=>{});if(input!==undefined)child.stdin?.end(input);
  child.once('close',async(code,termination)=>{
   signal.removeEventListener('abort',stop);
   // 先保留工具本身的失败；退出确认异常不能覆盖原诊断，也不能触发清场。
   const original=failure||((code!==0||termination||signal.aborted)?Error(tool+'执行失败，退出码='+code+'，信号='+(termination||'无')+(diagnostic?'：'+diagnostic.trim():'')):undefined);
   const unconfirmed=(message,cause)=>{
    clearTimeout(timer);
    const error=Error((original?original.message+'；':'')+message+'，pid='+child.pid+'，pgid='+child.pid,{cause:original||cause});
    error.keepWork=true;error.processId=child.pid;error.groupId=child.pid;error.status=Number(/HTTP (\d{3})/u.exec(diagnostic)?.[1])||undefined;return fail(error);
   };
   if(child.pid)for(let attempt=0;attempt<60;attempt++){
    // ps只读本轮进程组；有效快照必须包含调用进程，空表和查询失败不能视为退出。
    const snapshot=childProcess.spawnSync('/bin/ps',['-axo','pid=,pgid='],{encoding:'utf8',env:environment,timeout:5000,maxBuffer:4*1024**2});
    if(snapshot.error||snapshot.status!==0)return unconfirmed('进程组查询失败：'+(snapshot.error?.code||snapshot.status),snapshot.error);
    const rows=snapshot.stdout.trim().split('\n').map(line=>line.trim().split(/\s+/u));
    if(!rows.length||rows.some(row=>row.length!==2||row.some(value=>!/^\d+$/u.test(value)))||!rows.some(row=>Number(row[0])===process.pid))return unconfirmed('进程组查询结果无效');
    if(!rows.some(row=>Number(row[1])===child.pid))break;
    if(attempt===59)return unconfirmed('工具后代退出未确认，保留本轮现场');
    await new Promise(done=>setTimeout(done,100));
   }
   clearTimeout(timer);
   if(original){original.status=Number(/HTTP (\d{3})/u.exec(diagnostic)?.[1])||undefined;return fail(original);}
   ok(output.trim());
  });
 });
}
function nodeCheck(){if(process.versions.node!==tools.node)throw Error('Node版本不符合本产品声明');}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

// 产品只拥有编译与GitHub自动化；本机安装由控制台统一执行。

const productTitle='公民钱包';
const assetCount=platform=>platform==='ios'?3:4;
import {generatePlatformIcons} from '../icons/generate.mjs';
const nativeName='libcitizenwallet_signer';
export function materializeInputs(source,project){
 for(const platform of ['ios','android']){
  const data=JSON.parse(readFileSync(join(source,platform,'inputs.json'),'utf8'));
  for(const [path,lines]of Object.entries(data.files)){
   if(path.startsWith('/')||path.split('/').some(value=>!value||value==='.'||value==='..')||!Array.isArray(lines))throw Error('平台输入路径无效');
   put(join(project,platform,path),lines.join(''));
  }
 }
 const move=(from,to)=>copy(join(project,from),join(project,to));
 move('ios/Runner.pbxproj','ios/Runner.xcodeproj/project.pbxproj');
 for(const file of ['AppDelegate.swift','HardwareSecretvaultPlugin.swift'])move('ios/'+file,'ios/Runner/'+file);
 for(const file of ['Info.plist','Runner-Bridging-Header.h'])move('ios/source/'+file,'ios/Runner/'+file);
 for(const file of ['Main.storyboard','CitizenLaunchScreen.storyboard'])move('ios/resources/'+file,'ios/Runner/Base.lproj/'+file);
 move('ios/resources/InfoPlist.xcstrings','ios/Runner/InfoPlist.xcstrings');move('ios/AppIcon.json','ios/resources/AppIcon.json');
 for(const file of ['Debug.xcconfig','Release.xcconfig','AppFrameworkInfo.plist'])move('ios/config/'+file,'ios/Flutter/'+file);
 move('ios/project/Runner.xcscheme','ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme');
 move('ios/project/Runner.xcworkspacedata','ios/Runner.xcworkspace/contents.xcworkspacedata');
 move('ios/project/project.xcworkspacedata','ios/Runner.xcodeproj/project.xcworkspace/contents.xcworkspacedata');
 move('ios/project/citizenwallet_signer.podspec','ios/signer/citizenwallet_signer.podspec');
 move('ios/WalletUITests.swift','ios/RunnerUITests/WalletUITests.swift');move('ios/tests/RunnerUITests.xctestplan','ios/RunnerUITests/RunnerUITests.xctestplan');
 move('Podfile.lock','ios/Podfile.lock');
 move('android/App.gradle.kts','android/app/build.gradle.kts');
 move('android/MainActivity.kt','android/app/src/main/kotlin/com/crcfrcn/citizenwallet/MainActivity.kt');
 move('android/source/AndroidManifest.xml','android/app/src/main/AndroidManifest.xml');
 move('android/app/HardwareSecretvaultPluginTest.kt','android/app/src/test/kotlin/com/crcfrcn/citizenwallet/HardwareSecretvaultPluginTest.kt');
 move('android/gradle-wrapper.properties','android/gradle/wrapper/gradle-wrapper.properties');
 for(const entry of readdirSync(join(project,'android/resources'))){const parts=/^(drawable(?:-v21)?|mipmap-anydpi-v26|values(?:-en|-night)?)_(.+)$/u.exec(entry);if(!parts)throw Error('Android资源名称无效');move('android/resources/'+entry,'android/app/src/main/res/'+parts[1]+'/'+parts[2]);}
 return project;
}
function flutterExecutable(env=process.env){return join(env.FLUTTER_ROOT||join(root,'target/cache/flutter'),'bin/flutter');}

function executable(path){
 try{accessSync(path,constants.X_OK);return statSync(path).isFile();}catch{return false;}
}
function entries(path){
 try{return readdirSync(path);}catch(error){if(error.code==='ENOENT'||error.code==='ENOTDIR')return [];throw error;}
}
function metadata(path,parse){
 try{return parse(readFileSync(path,'utf8'));}catch(error){if(error.code==='ENOENT'||error.code==='ENOTDIR'||error instanceof SyntaxError)return;throw error;}
}

// 本机从真实安装位置选择原声明版本；先读现有元数据，避免探测时启动下载器。
export async function localTools(platform,{home=homedir(),source=root,input=process.env,report=()=>{}}={}){
 if(!Object.hasOwn(platforms,platform))throw Error('产品平台无效');
 const cache=join(source,'target/cache');
 const bins=(input.PATH||'').split(delimiter).filter(isAbsolute).concat('/opt/homebrew/bin','/usr/local/bin','/usr/bin','/bin');
 const candidates=values=>[...new Set(values.filter(value=>value&&isAbsolute(value)))];
 const workspace=dirname(resolve(source));
 const installed=entries(workspace).map(name=>join(workspace,name,'target/cache'));
 const errors=[];
 const select=async(name,paths,probe)=>{
  const found=[];
  for(const path of candidates(paths)){
   const version=await probe(path);
   if(version===true){report('复用 '+name+' '+path);return path;}
   if(version)found.push(path+'（'+version+'）');
  }
  errors.push(name+'，已查 '+candidates(paths).join('、')+(found.length?'，发现 '+found.join('、'):''));
 };
 const flutter=await select('Flutter '+tools.flutter,[
  input.FLUTTER_ROOT,...bins.map(bin=>{
   const path=join(bin,'flutter');return executable(path)?dirname(dirname(realpathSync(path))):undefined;
  }),
  join(home,'flutter'),join(home,'development/flutter'),join(home,'Developer/flutter'),'/opt/homebrew/share/flutter','/usr/local/share/flutter',
  ...['fvm/versions','.fvm/versions'].map(path=>join(home,path,tools.flutter)),
  ...entries('/opt/homebrew/Caskroom/flutter').map(version=>join('/opt/homebrew/Caskroom/flutter',version,'flutter')),
  join(cache,'flutter'),...installed.map(path=>join(path,'flutter')),
 ],path=>{
  const folder=join(path,'bin/cache');
  if(!executable(join(path,'bin/flutter')))return;
  const version=metadata(join(folder,'flutter.version.json'),text=>JSON.parse(text).frameworkVersion);
  if(version!==tools.flutter)return version||'版本未准备';
  const required=['flutter_tools.snapshot',platform+'-sdk.stamp','macos-sdk.stamp'];
  if(platform==='android')required.push(...gradleWrapper.map(file=>'artifacts/gradle_wrapper/'+file));
  return executable(join(folder,'dart-sdk/bin/dart'))&&required.every(file=>existsSync(join(folder,file)))||version+'，组件不齐';
 });
 const host=process.arch==='arm64'?'aarch64-apple-darwin':'x86_64-apple-darwin';
 const target=platform==='ios'?'aarch64-apple-ios':'aarch64-linux-android';
 const rust=await select('Rust '+tools.rust+' / '+target,[
  input.RUSTUP_HOME,join(home,'.rustup'),join(cache,'rustup'),...installed.map(path=>join(path,'rustup')),
 ],async path=>{
  const toolchain=join(path,'toolchains',tools.rust+'-'+host);
  if(!executable(join(toolchain,'bin/cargo'))||!executable(join(toolchain,'bin/rustc')))return;
  const version=(await run(join(toolchain,'bin/rustc'),['--version'],{capture:true})).split(' ')[1];
  if(version!==tools.rust)return version||'版本未知';
  return entries(join(toolchain,'lib/rustlib',target,'lib')).some(name=>name.startsWith('libstd-'))||tools.rust+'，缺 '+target;
 });
 const env={FLUTTER_ROOT:flutter,RUSTUP_HOME:rust};
 const rustBin=rust?join(rust,'toolchains',tools.rust+'-'+host,'bin'):undefined;
 let podBin;
 if(platform==='ios'){
  const pod=await select('CocoaPods '+tools.cocoapods,[
   ...(input.GEM_HOME?[join(input.GEM_HOME,'bin/pod')]:[]),...bins.map(bin=>join(bin,'pod')),
   join(cache,'gems/bin/pod'),...installed.map(path=>join(path,'gems/bin/pod')),
  ],async path=>{
   if(!executable(path))return;
   const gemHome=dirname(dirname(path));
   const gemEnv=existsSync(join(gemHome,'specifications','cocoapods-'+tools.cocoapods+'.gemspec'))?{GEM_HOME:gemHome}:{};
   let version;
   try{version=await run(path,['--version'],{env:{...gemEnv,PATH:bins.join(delimiter)},capture:true});}
   catch{controller.signal.throwIfAborted();return '无法读取版本';}
   if(version===tools.cocoapods){Object.assign(env,gemEnv);return true;}
   return version;
  });
  if(pod)podBin=dirname(pod);
 }else{
  const sdks=[
   input.ANDROID_HOME,input.ANDROID_SDK_ROOT,join(home,'Library/Android/sdk'),
  ];
  env.ANDROID_HOME=await select('Android SDK / Build Tools '+tools.buildTools,sdks,
   path=>executable(join(path,'platform-tools/adb'))&&executable(join(path,'build-tools',tools.buildTools,'apksigner'))&&
   executable(join(path,'cmdline-tools/latest/bin/apkanalyzer'))&&
   existsSync(join(path,'platforms/android-'+tools.buildTools.split('.')[0],'android.jar'))||undefined);
  env.ANDROID_NDK_HOME=await select('Android NDK '+tools.ndk,[
   input.ANDROID_NDK_HOME,...candidates([env.ANDROID_HOME,...sdks]).map(path=>join(path,'ndk',tools.ndk)),
  ],path=>{
   const version=metadata(join(path,'source.properties'),text=>/^Pkg.Revision\s*=\s*(\S+)/mu.exec(text)?.[1]);
   return version===tools.ndk&&executable(join(path,'toolchains/llvm/prebuilt/darwin-x86_64/bin/aarch64-linux-android24-clang'))||version;
  });
  const jvms=[join(home,'Library/Java/JavaVirtualMachines'),'/Library/Java/JavaVirtualMachines'];
  env.JAVA_HOME=await select('Android JDK',[input.JAVA_HOME,'/Applications/Android Studio.app/Contents/jbr/Contents/Home',
   ...jvms.flatMap(folder=>entries(folder).map(name=>join(folder,name,'Contents/Home')))],
   path=>executable(join(path,'bin/java'))||undefined);
  env.GRADLE_USER_HOME=await select('Gradle '+tools.gradle,[
   input.GRADLE_USER_HOME,join(home,'.gradle'),join(cache,'gradle'),...installed.map(path=>join(path,'gradle')),
  ],path=>{
   const distribution='gradle-'+tools.gradle+'-bin',folder=join(path,'wrapper/dists',distribution);
   return entries(folder).some(key=>existsSync(join(folder,key,distribution+'.zip.ok'))&&
    executable(join(folder,key,'gradle-'+tools.gradle,'bin/gradle')))||undefined;
  });
 }
 if(errors.length)throw Error('本机缺少公民钱包声明的工具或组件，须先取得本次下载授权：\n'+errors.join('\n'));
 env.CARGO_HOME=input.CARGO_HOME||join(home,'.cargo');
 env.PUB_CACHE=input.PUB_CACHE||join(home,'.pub-cache');
 env.PATH=candidates([rustBin,podBin,dirname(process.execPath),...bins]).join(delimiter);
 return env;
}

export async function progress(phase,operation,write=line=>process.stdout.write(line)){
 const started=Date.now();
 const log=text=>write(new Date().toISOString()+' '+phase+' '+text+'\n');
 const elapsed=()=>Math.floor((Date.now()-started)/1000)+'秒';
 log('开始');
 const timer=setInterval(()=>log('进行中 '+elapsed()),15000);
 try{const result=await operation();log('完成 '+elapsed());return result;}
 catch(error){log('失败 '+elapsed());throw error;}
 finally{clearInterval(timer);}
}
const silentProgress=(_phase,operation)=>operation();
const gradleWrapper=['gradlew','gradlew.bat','gradle/wrapper/gradle-wrapper.jar'];
async function flutterCheck(env){
 const result=JSON.parse(await run(flutterExecutable(env),['--version','--machine'],{env,capture:true}));if(result.frameworkVersion!==tools.flutter)throw Error('Flutter版本不符合本产品声明');
}
function environment(work,installed){
 // 工具与包复用本仓现有缓存，缓存并发由官方工具管理；每端可写工程和临时文件仍归自己的work。
 const base=directory(join(root,'target/cache'));
 const env={PUB_CACHE:join(base,'pub'),GRADLE_USER_HOME:join(base,'gradle'),CARGO_TARGET_DIR:join(base,'rust'),CARGO_HOME:join(base,'cargo'),RUSTUP_HOME:join(base,'rustup'),RUSTUP_TOOLCHAIN:tools.rust,CARGO_INCREMENTAL:'1',TMPDIR:directory(join(work,'tmp')),FLUTTER_ROOT:join(base,'flutter'),FLUTTER_SUPPRESS_ANALYTICS:'true',DART_SUPPRESS_ANALYTICS:'true',CI:'true',ANDROID_USER_HOME:directory(join(work,'android-user')),CP_HOME_DIR:join(base,'cocoapods'),GEM_HOME:join(base,'gems'),GEM_SPEC_CACHE:join(base,'gem-specs'),XDG_CACHE_HOME:directory(join(work,'xdg-cache')),XDG_CONFIG_HOME:directory(join(work,'xdg-config'))};
 if(installed){
  for(const key of ['GEM_HOME','GEM_SPEC_CACHE'])delete env[key];
  Object.assign(env,installed);
 }
 directory(env.CP_HOME_DIR);
 if(!installed)for(const key of ['PUB_CACHE','CARGO_HOME','RUSTUP_HOME','GEM_HOME','GEM_SPEC_CACHE'])directory(env[key]);
 return env;
}
async function prepareTools(work,platform,env){
 // 官方发行件直接展开到本产品缓存；不借用旧资源库或修订工具源码。
 if(!existsSync(flutterExecutable(env))){
  const archive=join(work,'flutter.zip');await run('curl',['--fail','--location','--retry','3','--output',archive,'https://storage.googleapis.com/flutter_infra_release/releases/stable/macos/flutter_macos_arm64_'+tools.flutter+'-stable.zip'],{env});
  await run('/usr/bin/ditto',['-x','-k',archive,dirname(env.FLUTTER_ROOT)],{env});rmSync(archive);
 }
 await flutterCheck(env);
 const host=process.arch==='arm64'?'aarch64-apple-darwin':'x86_64-apple-darwin',bin=join(env.RUSTUP_HOME,'toolchains',tools.rust+'-'+host,'bin');
 if(!existsSync(join(bin,'cargo')))await run('rustup',['toolchain','install',tools.rust,'--profile','minimal','--no-self-update'],{env});
 env.PATH=[bin,join(env.GEM_HOME,'bin'),dirname(process.execPath),process.env.PATH||'/usr/bin:/bin'].join(':');
 if(platform==='ios'){
  if(!existsSync(join(env.GEM_HOME,'bin/pod')))await run('gem',['install','cocoapods','--version',tools.cocoapods,'--no-document','--install-dir',env.GEM_HOME],{env});
  if(await run(join(env.GEM_HOME,'bin/pod'),['--version'],{env,capture:true})!==tools.cocoapods)throw Error('CocoaPods版本不符合声明');
 }else if(!process.env.ANDROID_HOME)throw Error('调用方未交付官方Android SDK路径');
}

async function prepare(work,platform,env){
 const project=sourceView(work,['lib','test','icons','signing','ios','android','pubspec.yaml','pubspec.lock','Podfile.lock']);
 materializeInputs(root,project);
 put(join(project,'analysis_options.yaml'),'include: package:flutter_lints/flutter.yaml\nanalyzer:\n  exclude:\n    - "**/*.g.dart"\n');
 if(platform==='android'){
  const sdk=env.ANDROID_HOME||process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;if(!sdk)throw Error('缺少官方Android SDK');
  const property=value=>value.replaceAll('\\','\\\\').replaceAll(':','\\:').replaceAll('=','\\=');
  put(join(project,'android/local.properties'),'sdk.dir='+property(sdk)+'\nflutter.sdk='+property(dirname(dirname(flutterExecutable(env))))+'\n');
  const wrapper=join(dirname(dirname(flutterExecutable(env))),'bin/cache/artifacts/gradle_wrapper');
  for(const file of gradleWrapper)copy(join(wrapper,file),join(project,'android',file));chmodSync(join(project,'android/gradlew'),0o700);
 }
 const iconOutput=generatePlatformIcons(project,platform);
 if(platform==='android')for(const name of readdirSync(iconOutput))copy(join(iconOutput,name),join(project,'android/app/src/main/res',name));
 // Pub 复用已有缓存，缺失依赖按原锁补齐。
 await run(flutterExecutable(env),['pub','get','--enforce-lockfile'],{cwd:project,env});
 if(!readFileSync(join(project,'pubspec.lock')).equals(readFileSync(join(root,'pubspec.lock'))))throw Error('Pub原锁改变');
 return project;
}
export async function native(target,project,work,env){
 const manifest=join(project,'signing/Cargo.toml');let triple,extra={};
 const ndk=target==='android'?(env.ANDROID_NDK_HOME||process.env.ANDROID_NDK_HOME||join(process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT||'','ndk',tools.ndk)):undefined;
 if(target==='ios'){triple='aarch64-apple-ios';extra.SDKROOT=await run('xcrun',['--sdk','iphoneos','--show-sdk-path'],{env,capture:true});}
 else if(target==='android'){
  triple='aarch64-linux-android';
  if(!readFileSync(join(ndk,'source.properties'),'utf8').includes('Pkg.Revision = '+tools.ndk))throw Error('NDK版本不符合声明');
  const bin=join(ndk,'toolchains/llvm/prebuilt',process.platform==='darwin'?'darwin-x86_64':'linux-x86_64','bin');
  extra={CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER:join(bin,'aarch64-linux-android24-clang'),CC_aarch64_linux_android:join(bin,'aarch64-linux-android24-clang'),AR_aarch64_linux_android:join(bin,'llvm-ar'),CARGO_TARGET_AARCH64_LINUX_ANDROID_RUSTFLAGS:'-C link-arg=-Wl,-z,max-page-size=16384 -C link-arg=-Wl,-soname,libcitizenwallet_signer.so'};
 }
 else if(target!=='host')throw Error('未知原生目标');
 if(triple&&process.env.GITHUB_ACTIONS==='true')await run('rustup',['target','add','--toolchain',tools.rust,triple],{env});
 // 官方crate-type覆盖仅生成当前消费者需要的库，不额外生成另一种链接产物。
 await run('cargo',['rustc','--lib','--crate-type',target==='ios'?'staticlib':'cdylib','--locked','--release','--manifest-path',manifest,...(triple?['--target',triple]:[])],{env:{...env,...extra},cwd:project});
 const file=join(env.CARGO_TARGET_DIR,...(triple?[triple]:[]),'release',nativeName+(target==='ios'?'.a':target==='android'?'.so':process.platform==='darwin'?'.dylib':'.so'));
 // iOS验收已生成的机器码符号，官方选项避免Apple nm解析Rust上游bitcode；四个导出断言不变。
 const symbols=await run(target==='android'?join(ndk,'toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-nm'):'nm',target==='android'?['-D','--defined-only',file]:['-g',...(target==='ios'?['--no-llvm-bc']:[]),file],{env,capture:true});
 for(const name of ['derive_hard','public_key','sign','verify'])if(!new RegExp('(?:^|\\s)_?citizen_sr25519_'+name+'(?:\\s|$)','mu').test(symbols))throw Error('原生签名导出缺失：'+name);
 if(target==='ios'){const output=directory(join(work,'native/ios'));copy(file,join(output,basename(file)));env.CITIZENWALLET_NATIVE_IOS_DIR=output;}
 if(target==='android'){
  const output=directory(join(work,'native/android/arm64-v8a'));copy(file,join(output,basename(file)));env.CITIZENWALLET_NATIVE_ANDROID_DIR=dirname(output);
  const readelf=join(ndk,'toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-readelf');
  const headers=await run(readelf,['-lW',file],{env,capture:true});const loads=headers.split('\n').filter(line=>/^\s*LOAD\s/u.test(line));if(!loads.length||loads.some(line=>parseInt(line.trim().split(/\s+/u).at(-1),16)<16384))throw Error('Android签名库不满足16KB对齐');
 }
 return file;
}
export async function testProduct(platform='android',{installed,stage=silentProgress}={}){
 nodeCheck();
 if(!installed&&process.env.GITHUB_ACTIONS!=='true')installed=await localTools(platform);
 await stage('构建脚本回归',()=>run(process.execPath,['--test','test/build.test.mjs'],{cwd:root}));
 const work=task('test',platform),env=environment(work,installed);let safe=true;
 try{
  if(!installed)await prepareTools(work,platform,env);
  const project=await stage('测试工程与原锁依赖准备',()=>prepare(work,platform,env));
  await stage('Rust 回归与宿主签名库构建',async()=>{
   await run('cargo',['test','--locked','--manifest-path',join(project,'signing/Cargo.toml')],{cwd:project,env});
   await native('host',project,work,env);
  });
  const packageFile=join(project,'.dart_tool/package_config.json'),packages=JSON.parse(readFileSync(packageFile)),entry=packages.packages.find(value=>value.name==='isar_community_flutter_libs');
  if(!entry)throw Error('原锁缺少Isar宿主测试库');const packageRoot=fileURLToPath(new URL(entry.rootUri,pathToFileURL(packageFile)));
  env.ISAR_CORE_LIB_PATH=join(work,'libisar.dylib');copy(join(packageRoot,'macos/libisar.dylib'),env.ISAR_CORE_LIB_PATH);
  await stage('Flutter 静态检查',()=>run(flutterExecutable(env),['analyze','--fatal-infos','--fatal-warnings','--no-pub'],{cwd:project,env}));
  // 官方JSON报告同时交付控制台和本轮现场；pipefail保留Flutter退出码，失败保留报告取证。
  const report=join(work,'flutter-report.jsonl');let finished;
  try{
   await stage('Flutter 回归',()=>run('/bin/bash',['-o','pipefail','-c','"$1" test --no-pub --concurrency=1 --fail-fast --reporter=json | tee "$2"','wallet-test',flutterExecutable(env),report],{cwd:project,env}));
   const events=readFileSync(report,'utf8').split('\n').filter(Boolean).map(JSON.parse),done=events.filter(value=>value.type==='done');finished=events.filter(value=>value.type==='testDone');
   if(done.length!==1||done[0].success!==true||!finished.length||finished.some(value=>value.skipped||value.result!=='success'))throw Error('Flutter测试失败、跳过或不完整');
  }catch(error){error.keepWork=true;error.message+='；Flutter报告：'+report;throw error;}
  if(platform==='android')await stage('Android 原生回归',()=>run(join(project,'android/gradlew'),['testReleaseUnitTest','--no-daemon'],{cwd:join(project,'android'),env}));
  return {tests:finished.length,platform};
 }catch(error){safe=!error.keepWork;throw error;}finally{if(safe)rmSync(work,{recursive:true,force:true});}
}
export async function buildProduct(platform,{consume,installed,stage=silentProgress}={}){
 nodeCheck();const formal=process.env.GITHUB_ACTIONS==='true';
 if(!installed&&!formal)installed=await localTools(platform);
 const selected=formal?{version:process.env.PRODUCT_VERSION,buildNumber:process.env.GITHUB_RUN_NUMBER}:
  await stage('核对本机产物版本',()=>selectRelease(platform))||initialBuild();
 displayName(platform,selected.version);
 const supplied=process.env.PRODUCT_WORK;if(supplied&&!insideTarget(supplied))throw Error('编译现场不属于本产品target');
 const work=supplied?directory(supplied):task('build',platform),env=environment(work,installed);let safe=true,complete=false;
 try{
  if(!installed)await prepareTools(work,platform,env);
  const project=await stage('编译工程与原锁依赖准备',()=>prepare(work,platform,env));
  await stage('目标平台原生库构建',()=>native(platform,project,work,env));
  const version=selected.version,number=selected.buildNumber;
  const args=['--release','--build-name',version,'--build-number',number,'--no-pub'];const output=directory(join(work,'artifact')),title=artifactBaseName(platform,version);
  if(platform==='android'){
   if(formal&&!process.env.ANDROID_KEY_PROPERTIES)throw Error('正式Android签名输入缺失');
   for(const [format,path,suffix]of [['apk','flutter-apk/app-release.apk','apk'],['appbundle','bundle/release/app-release.aab','aab']]){
    await stage('编译 '+format.toUpperCase(),()=>run(flutterExecutable(env),['build',format,'--target-platform','android-arm64',...args],{cwd:project,env}));
    copy(join(project,'build/app/outputs',path),join(output,title+'.'+suffix));
   }
  }else{
   if(formal){
    if(!process.env.IOS_EXPORT_OPTIONS||!process.env.IOS_PROFILE_UUID||!process.env.IOS_SIGNING_CERTIFICATE)throw Error('正式Apple导出配置缺失');
    const pbx=join(project,'ios/Runner.xcodeproj/project.pbxproj'),json=join(work,'project.json');await run('plutil',['-convert','json','-o',json,pbx],{env});
    const document=JSON.parse(readFileSync(json));for(const object of Object.values(document.objects))if(object.name==='Release'&&object.buildSettings?.PRODUCT_BUNDLE_IDENTIFIER==='ios.citizenwallet')Object.assign(object.buildSettings,{CODE_SIGN_STYLE:'Manual',PROVISIONING_PROFILE_SPECIFIER:process.env.IOS_PROFILE_UUID,CODE_SIGN_IDENTITY:process.env.IOS_SIGNING_CERTIFICATE});
    put(json,JSON.stringify(document));await run('plutil',['-convert','xml1','-o',pbx,json],{env});
    await run(flutterExecutable(env),['build','ipa','--export-options-plist',process.env.IOS_EXPORT_OPTIONS,...args],{cwd:project,env});
    const dir=join(project,'build/ios/ipa'),files=readdirSync(dir).filter(name=>name.endsWith('.ipa'));if(files.length!==1)throw Error('IPA缺失或不唯一');copy(join(dir,files[0]),join(output,title+'.ipa'));
   }else{await stage('编译 iOS App',()=>run(flutterExecutable(env),['build','ios','--no-codesign',...args],{cwd:project,env}));copy(join(project,'build/ios/iphoneos/Runner.app'),join(output,title+'.app'));}
  }
  complete=true;if(consume)await consume({work,output,env});return {work,output};
 }catch(error){safe=!error.keepWork;throw error;}finally{if(safe&&!complete)rmSync(work,{recursive:true,force:true});}
}
export async function packageProduct(platform){
 const work=process.env.PRODUCT_WORK;if(!insideTarget(work))throw Error('正式产物现场无效');const output=join(work,'artifact'),version=process.env.PRODUCT_VERSION,title=artifactBaseName(platform,version);
 const expected=platform==='ios'?['ipa']:['apk','aab'];for(const suffix of expected)if(lstatSync(join(output,title+'.'+suffix)).size<=0)throw Error('正式产物为空');
 const proof={schema:1,product_id:'citizenwallet',platform,version,run_id:Number(process.env.GITHUB_RUN_ID),run_attempt:Number(process.env.GITHUB_RUN_ATTEMPT),source_sha:process.env.GITHUB_SHA};
 proof.assets=expected.map(suffix=>{const name=title+'.'+suffix,bytes=readFileSync(join(output,name));return {name,label:displayName(platform,version)+'.'+suffix,size:bytes.length,sha256:sha(bytes)};});
 put(join(output,title+'.json'),JSON.stringify(proof,null,2)+'\n');
 put(join(output,title+'.sha256'),readdirSync(output).sort().map(name=>sha(readFileSync(join(output,name)))+'  '+name).join('\n')+'\n');put(join(work,'proof.json'),JSON.stringify(proof));
 return {output};
}
// 从 Play Console 单独推出内测后回查。自动化不提交 edit，以免夹带后台待审项。
export async function verifyAndroidInternal({token=process.env.PLAY_ACCESS_TOKEN,fetchImpl=fetch,
 pause=()=>delay(10000,undefined,{signal:controller.signal}),work=process.env.PRODUCT_WORK,version=process.env.PRODUCT_VERSION,
 number=process.env.GITHUB_RUN_NUMBER,runID=process.env.GITHUB_RUN_ID,sourceSha=process.env.GITHUB_SHA}={}){
 displayName('android',version);
 if(!insideTarget(work)||!token||!/^\d+$/u.test(number||'')||!/^\d+$/u.test(runID||'')||!/^([a-f0-9]{40})$/u.test(sourceSha||''))throw Error('Google上传输入缺失或无效');
 const name=artifactBaseName('android',version)+'.aab',path=join(work,'artifact',name),info=lstatSync(path);
 if(!info.isFile()||info.isSymbolicLink()||info.size<1)throw Error('Google上传AAB无效');
 const bytes=readFileSync(path),digest=sha(bytes),proof=JSON.parse(readFileSync(join(work,'proof.json'))),asset=proof.assets?.find(value=>value.name===name);
 if(proof.product_id!=='citizenwallet'||proof.platform!=='android'||proof.version!==version||String(proof.run_id)!==runID||proof.source_sha!==sourceSha||asset?.sha256!==digest||asset.size!==bytes.length)throw Error('Google上传AAB与本轮验收不一致');
 const app='https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.crcfrcn.citizenwallet';
 const base=app+'/edits';
 async function request(method,url){
  const response=await fetchImpl(url,{method,redirect:'error',
   signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)]),
   headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(method==='POST'?{body:'{}'}:{})});
  if(!response.ok)throw Error('Google Play 内测回查 '+method+' '+new URL(url).pathname+' HTTP '+response.status);
  return response.status===204?null:response.json();
 }
 for(let attempt=0;attempt<120;attempt++){
  if(attempt)await pause();
  const readback=await request('POST',base);
  if(typeof readback.id!=='string'||!/^\d+$/u.test(readback.id))throw Error('Google回读编辑编号无效');
  const url=base+'/'+readback.id;
  try{
   // 新 edit 是已部署状态的快照，只读取后丢弃。
   const track=await request('GET',url+'/tracks/internal');
   if(track.track!=='internal')throw Error('Google Play 返回的轨道不是内部轨道');
   if(!track.releases?.some(row=>row.status==='completed'&&row.versionCodes?.some(code=>String(code)===number)))continue;
   const result=await request('GET',url+'/bundles'),matches=result.bundles?.filter(value=>String(value.versionCode)===number);
   if(matches?.length!==1||matches[0].sha256!==digest)throw Error('Google已保存AAB回读不符');
   return {verified:true,platform:'android',version,buildNumber:number};
  }finally{await request('DELETE',url);}
 }
 throw Error('Google Play 本轮内测回查超时：尚未推出');
}
// ===== 控制台本机编译：node scripts/build.mjs compile ios|android =====
// 本块只交付现有本机工具的环境，并复用上方唯一buildProduct执行官方编译，不复制编译流程。
// stdout实时交付进度及独立TATA_COMPILE回执；stdin EOF后清理本轮产物。
// 签名、设备安装和版本回读归控制台原生安装器；本块不派发GitHub或执行商店上传。
export async function compile(platform){
 if(process.env.GITHUB_ACTIONS==='true')throw Error('本机编译入口不接受GitHub环境');
 nodeCheck();displayName(platform,initialBuild().version);
 const installed=await progress('检查本机工具',()=>localTools(platform,{
  report:line=>process.stdout.write(new Date().toISOString()+' '+line+'\n'),
 }));
 // 本机更新前执行所属完整回归，真实扫码解码、中文审阅与签名失败不能进入设备安装。
 await testProduct(platform,{installed,stage:progress});
 let owned;
 try{await buildProduct(platform,{installed,stage:progress,consume:async({work,output})=>{
  owned=work;const suffix=platform==='ios'?'.app':'.apk',files=readdirSync(output).filter(name=>name.endsWith(suffix));
  if(files.length!==1)throw Error('本机编译产物缺失或不唯一');
  const sdk=installed.ANDROID_HOME,androidTools=platform==='android'?{adb:join(sdk,'platform-tools/adb'),
   apksigner:join(sdk,'build-tools',tools.buildTools,'apksigner'),apkanalyzer:join(sdk,'cmdline-tools/latest/bin/apkanalyzer')}:{};
  const receipt=await progress('核对交付产物',()=>({schema:1,product_id:'citizenwallet',platform,work,artifact:join(output,files[0]),tools:androidTools,signing:platform==='ios'?appleSigning(join(output,files[0])):[],
   environment:platform==='android'?{JAVA_HOME:installed.JAVA_HOME,ANDROID_HOME:sdk}:{}}));
  process.stdout.write('TATA_COMPILE '+JSON.stringify(receipt)+'\n');
  for await(const part of process.stdin)if(part.length)throw Error('编译消费通道只接受EOF');controller.signal.throwIfAborted();
 }});}finally{if(owned)rmSync(owned,{recursive:true,force:true});}
}
// ===== 控制台本机编译结束；下方为产品CLI命令选择 =====

async function main(){
 const [command,platform='android',...extra]=process.argv.slice(2);if(extra.length)throw Error('参数过多');
 if(command==='compile')return compile(platform);
 if(command==='verify-internal'&&platform==='android')return verifyAndroidInternal();
 if(command==='test')return testProduct(platform);if(command==='build')return buildProduct(platform);if(command==='package')return packageProduct(platform);
 throw Error('未知产品命令');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)&&!process.env.NODE_TEST_CONTEXT){
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>controller.abort());
 try{const result=await main();process.stdout.write(typeof result==='string'?result+'\n':JSON.stringify(result)+'\n');}catch(error){console.error(error.message);process.exitCode=1;}
}
