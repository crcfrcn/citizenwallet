#!/usr/bin/env node
const directEntry = process.argv[1] === import.meta.filename && !process.execArgv.some(argument => /^(?:-e|-p|--eval|--print)(?:=|$)/u.test(argument));
const inlineTestEntry = directEntry && Boolean(process.env.NODE_TEST_CONTEXT) && process.argv.length === 2;
// 本产品独立拥有资源需求、工程准备与编译；公开回执仅提供验真资源，不提供执行命令。
import {spawn} from 'node:child_process';
import {checkFixedWork,clearFixedWork,fixedWork,withFixedWork,taskScope,trackWorkProcess,workEnvironment} from './target.mjs';
import {inflateSync,deflateSync} from 'node:zlib';
import {AsyncLocalStorage} from 'node:async_hooks';
import {Socket} from 'node:net';
import {rmSync,mkdtempSync,constants,fstatSync,readSync,chmodSync,closeSync,openSync,renameSync,readlinkSync,unlinkSync,copyFileSync,existsSync,lstatSync,mkdirSync,readFileSync,readdirSync,realpathSync,symlinkSync,writeFileSync} from 'node:fs';
import {basename,dirname,isAbsolute,join,parse,relative,resolve,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomBytes,X509Certificate} from 'node:crypto';

const {fixtureWork,removeFixture,writeFixture,copyFixture}=process.env.NODE_TEST_CONTEXT&&process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)?await import('./target-fixtures.mjs'):{};
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const contract=JSON.parse(readFileSync(join(root,'scripts/flows.json'),'utf8'));
const product=contract.product_id, prefix=product.toUpperCase();
const inside=(base,path)=>{const r=relative(base,path);return r===''||!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep);};
const fail=message=>{throw Error(product+' Build：'+message);};
export function checkWork(work) { return checkFixedWork(work); }

// 产品自己拥有target工作边界；测试与独立入口也不借用调用方的全局缓存。
export function productTarget(platform) {
 platformContract(platform);
 return join(root,'target');
}
export function temporaryRoot(platform=Object.keys(contract.platforms)[0],scope='test') {
 if(!['test','tmp','build','ci','release','publish'].includes(scope))fail('临时目录职责无效');
 platformContract(platform);return checkFixedWork(fixedWork(scope==='test'?'test':'build'),{create:true});
}
// 测试继承当前平台现场；独立执行没有任务身份时才选产品首个平台。
export const testRoot=platform=>{
 const workflow=String(process.env.GITHUB_WORKFLOW||'').split('.');
 const local=process.env.TMPDIR?relative(join(root,'target'),resolve(process.env.TMPDIR)).split(sep)[0]:undefined;
 const inherited=workflow[0]===product&&Object.hasOwn(contract.platforms,workflow[1])?workflow[1]
  :Object.hasOwn(contract.platforms,local)?local:undefined;
 return temporaryRoot(platform||inherited||Object.keys(contract.platforms)[0],'test');
};
// 远端Runner基础设施仍归GitHub；本产品步骤的可写临时目录归准确平台流程target。
export function remoteEnvironment(environment=process.env) {
 const [id,platform,flow,...extra]=String(environment.GITHUB_WORKFLOW||'').split('.');
 if(id!==product||extra.length||!Object.hasOwn(contract.platforms,platform)||!['ci','release'].includes(flow))fail('远端临时目录缺少准确产品平台流程身份');
 const temporary=temporaryRoot(platform,flow,null);
 return {...environment,RUNNER_TEMP:temporary,TMPDIR:temporary,TMP:temporary,TEMP:temporary};
}

// 展开来源根由本产品指定，调用者不识别任何产品来源名称。
export function resourceSourceRoot(name,work){checkWork(work);if(!/^[a-z][a-z0-9_]*$/u.test(name))fail('来源名称无效');return join(work,'git-sources',name);}
// 清理只针对当前执行拥有的工作根；工具全部退出后删除并回读，固定根本身保留。
export function clearWork(work) { return clearFixedWork(work); }

export function platformContract(platform) {
 if(!Object.hasOwn(contract.platforms,platform))fail('平台未声明');
 return contract.platforms[platform];
}

export function requirements(platform,work) {
 checkWork(work);const declared=platformContract(platform);
 const locks=declared.locks.map(value=>({...value})),sources=[],archives=[];
 // 钱包只消费本仓Pub与Rust锁，不声明或展开其他产品SDK来源。
 for(const lock of locks){const file=join(root,lock.path);if(!existsSync(file)||!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink())fail('原始锁缺失或带链接：'+lock.path);lock.sha256=createHash('sha256').update(readFileSync(file)).digest('hex');}
 return {schema:1,product_id:product,platform,tools:declared.tools,locks,sources,archives};
}

export function resourceEnvironment(platform,work,receipt,base={}) {
 checkWork(work);const declared=platformContract(platform);
 if(!receipt||receipt.schema!==1||receipt.product_id!==product||receipt.platform!==platform||receipt.work!==work||receipt.offline!==true
  ||!receipt.tools||!receipt.dependencies||!receipt.archives)fail('资源回执身份无效');
 const env={PLATFORM:platform,HOME:work,USERPROFILE:work,USER:base.USER,LOGNAME:base.LOGNAME,LANG:'zh_CN.UTF-8',LC_ALL:'en_US.UTF-8',
  ...receipt.environment,TMPDIR:join(work,'tmp')+sep,TMP:join(work,'tmp'),TEMP:join(work,'tmp'),XDG_CACHE_HOME:join(work,'cache'),XDG_CONFIG_HOME:join(work,'config'),
  CARGO_TARGET_DIR:join(work,'work/cargo-target'),CARGO_NET_OFFLINE:'true',CARGO_INCREMENTAL:'1',
  npm_config_offline:'true',npm_config_audit:'false',npm_config_fund:'false'};
 const allowedEnvironment=new Set(['PRODUCT_WORK_DIR','PRODUCT_BASH_BIN','PRODUCT_RSYNC_BIN','PATH','DEVELOPER_DIR','SDKROOT','DART_EXECUTABLE','XCODEBUILD','XATTR','CODESIGN','SECURITY','XCRUN','XCODE_SELECT','CC','CXX','SWIFT','OTOOL','INSTALL_NAME_TOOL','LIPO','MAKE','AR','RANLIB','NM','STRIP','LLVM_NM','LD','LDCXX','CARGO_TARGET_AARCH64_APPLE_DARWIN_LINKER','ANDROID_HOME','ANDROID_SDK_ROOT','ANDROID_NDK_HOME','ANDROID_USER_HOME','ANDROID_EMULATOR_HOME','GRADLE_INIT_SCRIPT','GRADLE_USER_HOME']);
 if(Object.keys(receipt.environment||{}).some(key=>!allowedEnvironment.has(key)))fail('资源回执包含未声明环境或注入变量');
 // 固定xattr只允许iOS回执的官方准确路径，不能扩大系统PATH或接受替代入口。
 if(env.XATTR!==undefined&&(platform!=='ios'||env.XATTR!=='/usr/bin/xattr'))fail('iOS固定xattr回执无效');
 for(const tool of declared.tools) {
  const value=receipt.tools[tool.id];
  if(!value||value.version!==tool.version||typeof value.path!=='string'||!isAbsolute(value.path)||resolve(value.path)!==value.path)fail('缺少准确版本的工具：'+tool.id);
  const s=lstatSync(value.path);if(!s.isFile()||s.isSymbolicLink()||!(s.mode&0o111)||realpathSync(value.path)!==value.path)fail('工具入口必须是普通执行器：'+tool.id);
 }
 const aliases={node:'NODE',git:'GIT',flutter:'FLUTTER',rust:'RUSTC',python:'PYTHON',java:'JAVA',gradle:'GRADLE',
  cmake:'CMAKE',cocoapods:'POD',protoc:'PROTOC',zig:'ZIG','worker-build':'WORKER_BUILD','wasm-bindgen':'WASM_BINDGEN_BIN','wasm-opt':'WASM_OPT_BIN',esbuild:'ESBUILD_BIN',
  perl:'PERL',m4:'M4',bison:'BISON',flex:'FLEX',tcl:'TCLSH',gettext:'GETTEXT',openssl:'OPENSSL'};
 for(const [id,name]of Object.entries(aliases))if(receipt.tools[id])env[name]=receipt.tools[id].path;
 // 产品声明的语言工具先于Xcode附带工具；POSIX旧Shell只通过验真GNU投影替换。
 const paths=Object.entries(receipt.tools).filter(([id])=>!['posix','xcode'].includes(id)).map(([,value])=>dirname(value.path));
 env.PATH=[...new Set([...paths,...(env.PATH||'').split(':')].filter(Boolean))].join(':');
 if(env.GIT)env.PRODUCT_GIT_BIN=env.GIT;
 if(env.RUSTC)env.CARGO=join(dirname(env.RUSTC),'cargo');
 if(env.FLUTTER){env.FLUTTER_ROOT=dirname(dirname(env.FLUTTER));env.DART_EXECUTABLE=join(env.FLUTTER_ROOT,'bin/cache/dart-sdk/bin/dart');}
 if(env.PYTHON)env.PYTHONHOME=dirname(dirname(env.PYTHON));
 if(env.JAVA)env.JAVA_HOME=dirname(dirname(env.JAVA));
 if(env.OPENSSL)env.TUYU_OPENSSL_PREFIX=dirname(dirname(env.OPENSSL));
 const own=receipt.dependencies.own||{};
 // 原始锁要求的目录必须显式交付，不能落入用户默认缓存。
 for(const lock of declared.locks){const key={npm:'npmCache',pub:'pubCache',cargo:'cargoHome'}[lock.ecosystem];if(key&&!own[key])fail('缺少原始锁依赖回执：'+lock.ecosystem);}
 for(const [key,name]of [['npmCache','npm_config_cache'],['pubCache','PUB_CACHE'],['cargoHome','CARGO_HOME']])if(own[key]){
  checkDependency(work,own[key]);env[name]=own[key];
 }
 env[prefix+'_WORK_DIR']=work;env[prefix+'_BUILD_WORK_DIR']=join(work,'work');env[prefix+'_DEPENDENCY_DIR']=join(work,'dependencies');
 env[prefix+'_BUILD_DIR']=join(work,'work/flutter');env[prefix+'_ARTIFACT_DIR']=work;env[prefix+'_OFFLINE']='true';
 env.BUILD_DIR=join(work,'work/flutter');env[prefix+'_NODE_BIN']=env.NODE;
 env[prefix+'_PROJECT_ROOT']=join(work,'source-view',root.replace(/^\/+/u,''));
 env.PRODUCT_SOURCE_DIR=env[prefix+'_PROJECT_ROOT'];
 if(env.GRADLE)env[prefix+'_GRADLE_BIN']=env.GRADLE;
 if(env.XCODEBUILD)env.CITIZENWALLET_XCODEBUILD_BIN=env.XCODEBUILD;
 env.GRADLE_USER_HOME=join(work,'dependencies/gradle');env.CP_HOME_DIR=join(work,'dependencies/cocoapods');
 env[prefix+'_PUB_OFFLINE']='true';env.GRADLE_OPTS='-Dorg.gradle.project.android.builder.sdkDownload=false';
 return env;
}
function checkDependency(work,path){if(!isAbsolute(path)||resolve(path)!==path||!inside(work,path)||path===work||!lstatSync(path).isDirectory()||realpathSync(path)!==path)fail('依赖回执越界或无效');}
// 工程输入复制到本轮真实目录，保证包解析与写入均不进入正式源码；内部链接映射到同轮副本。
export function createView(source,destination,work) {
 if(realpathSync(source)!==source||!lstatSync(source).isDirectory()||!isAbsolute(destination)||resolve(destination)!==destination||inside(destination,source))fail('工程输入与输出边界无效');
 // 本仓target属于合法输出边界，但只允许当前已验真工作根内的准确工程副本。
 if(work!==undefined){checkWork(work);if(source!==root||destination!==join(work,'source-view',source.replace(/^\/+/u,'')))fail('工程副本不属于当前任务');}
 else if(inside(source,destination))fail('工程输入与输出边界无效');
 let parent=dirname(destination);while(!existsSync(parent))parent=dirname(parent);
 if(!lstatSync(parent).isDirectory()||realpathSync(parent)!==parent)fail('工程输出经过链接');
 if(lstatSync(destination,{throwIfNoEntry:false}))fail('本轮工程已存在');mkdirSync(destination,{recursive:true,mode:0o700});
 const generated=new Set(['.git','.dart_tool','.gradle','.symlinks','Pods','build','target','node_modules','ephemeral','.cache','.DS_Store','swiftpm','dist','tsconfig.tsbuildinfo']);
 function visit(from,to){for(const name of readdirSync(from).sort()){if(generated.has(name))continue;const a=join(from,name),b=join(to,name),s=lstatSync(a);
  if(s.isDirectory()){mkdirSync(b);visit(a,b);}else if(s.isFile()){copyFileSync(a,b);}
  else if(s.isSymbolicLink()){const target=realpathSync(a);if(!inside(source,target)||!lstatSync(target).isFile())fail('源码链接越界');symlinkSync(join(destination,relative(source,target)),b);}else fail('源码文件类型无效');
 }}visit(source,destination);return destination;
}
// 归档坐标只接受本产品当前锁；完整性在build前核验，prepare允许稍后展开的锁。
export async function checkArchives(platform,work,receipt,complete=false) {
 const requested=(await requirements(platform,work)).archives;
 const expected=new Map(requested.map(value=>[value.group+'@'+value.name,value]));const seen=new Set();
 for(const [group,items]of Object.entries(receipt.archives)){
  if(!Array.isArray(items))fail('归档回执类型无效');
  for(const item of items){const key=group+'@'+item.name,wanted=expected.get(key);
   if(!wanted||seen.has(key)||['url','version','sha256'].some(key=>item[key]!==wanted[key])||typeof item.path!=='string'||!isAbsolute(item.path)||resolve(item.path)!==item.path||!inside(work,item.path))fail('归档回执与产品锁不一致');
   seen.add(key);const info=lstatSync(item.path);if(!info.isFile()||info.isSymbolicLink()||realpathSync(item.path)!==item.path||!info.size||createHash('sha256').update(readFileSync(item.path)).digest('hex')!==wanted.sha256)fail('锁定归档原件无效');
  }
 }
 if(complete&&seen.size!==expected.size)fail('缺少产品锁定归档回执');
}
// Android资源解析与正式编译共用这一份工程配置，资源阶段之前就交付SDK和真实版本。
export function prepareAndroidProjectInputs(work,env) {
 checkWork(work);const project=join(work,'source-view',root.replace(/^\/+/u,''));
 if(env[prefix+'_WORK_DIR']!==work||env[prefix+'_PROJECT_ROOT']!==project||realpathSync(project)!==project)fail('Android工程配置不属于当前任务');
 const values=[env.ANDROID_HOME,env.FLUTTER_ROOT];
 for(const path of values)if(typeof path!=='string'||!isAbsolute(path)||resolve(path)!==path||/[\x00-\x1f]/u.test(path)||realpathSync(path)!==path||!lstatSync(path).isDirectory())fail('Android工程缺少验真SDK目录');
 const versions=[...readStoreSource(project,'pubspec.yaml').toString('utf8').matchAll(/^version:[ \t]*([0-9]+\.[0-9]+\.[0-9]+)(?:\+([0-9]+))?[ \t]*$/gmu)];
 if(versions.length!==1)fail('Android工程版本声明不唯一或无效');
 const code=versions[0][2]||'1';if(!/^[1-9][0-9]*$/u.test(code)||Number(code)>2147483647)fail('Android工程版本编号无效');
 const property=value=>value.split('').map(char=>char.charCodeAt(0)>126?'\\u'+char.charCodeAt(0).toString(16).padStart(4,'0'):/[\\:=#!\s]/u.test(char)?'\\'+char:char).join('');
 const content=[['sdk.dir',values[0]],['flutter.sdk',values[1]],['flutter.buildMode','release'],['flutter.versionName',versions[0][1]],['flutter.versionCode',code]].map(([key,value])=>key+'='+property(value)).join('\n')+'\n';
 const file=join(project,'android/local.properties');
 if(realpathSync(dirname(file))!==dirname(file))fail('Android工程配置经过链接');
 const info=lstatSync(file,{throwIfNoEntry:false});if(info){if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||readFileSync(file,'utf8')!==content)fail('Android工程配置漂移');}
 else writeFileSync(file,content,{flag:'wx',mode:0o600});return file;
}
// 图标、工程准备、原生签名与索引同步统一属于本仓构建入口。
const platformIcons=(()=>{
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
const crcTable=Array.from({length:256},(_,n)=>{
 for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;
 return n>>>0;
});
function crc(bytes){let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
function chunk(type,data){
 const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(type,4);data.copy(b,8);
 b.writeUInt32BE(crc(b.subarray(4,-4)),b.length-4);return b;
}
function paeth(a,b,c){const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;}

// 只支持本仓原件实际采用的非隔行8位RGB/RGBA，格式改变时明确失败。
function decodePNG(bytes){
 if(!bytes.subarray(0,8).equals(signature))throw Error('图标不是PNG');
 let width,height,channels;const data=[],color=[];
 for(let at=8;at<bytes.length;){
  const size=bytes.readUInt32BE(at),type=bytes.toString('ascii',at+4,at+8),body=bytes.subarray(at+8,at+8+size);
  if(at+12+size>bytes.length||crc(bytes.subarray(at+4,at+8+size))!==bytes.readUInt32BE(at+8+size))throw Error('PNG块损坏');
  if(type==='IHDR'){
   width=body.readUInt32BE(0);height=body.readUInt32BE(4);channels=body[9]===2?3:body[9]===6?4:0;
   if(body[8]!==8||!channels||body[10]||body[11]||body[12]||!width||!height||width>4096||height>4096)throw Error('图标PNG格式不支持');
  }else if(type==='IDAT')data.push(body);
  else if(['sRGB','gAMA','cHRM','iCCP'].includes(type))color.push(chunk(type,body));
  else if(type==='tRNS')throw Error('RGB透明色键格式不支持');
  at+=size+12;
 }
 if(!channels||!data.length)throw Error('PNG缺少图片数据');
 const stride=width*channels,raw=inflateSync(Buffer.concat(data),{maxOutputLength:(stride+1)*height});
 if(raw.length!==(stride+1)*height)throw Error('PNG像素长度错误');
 const pixels=Buffer.alloc(stride*height);
 for(let y=0;y<height;y++){
  const filter=raw[y*(stride+1)];if(filter>4)throw Error('PNG滤波格式错误');
  for(let x=0;x<stride;x++){
   const i=y*stride+x,a=x>=channels?pixels[i-channels]:0,b=y?pixels[i-stride]:0,c=y&&x>=channels?pixels[i-stride-channels]:0;
   const predictor=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
   pixels[i]=(raw[y*(stride+1)+x+1]+predictor)&255;
  }
 }
 return {width,height,channels,pixels,color};
}

// 面积采样与预乘透明度避免小尺寸锯齿及透明边缘黑边；禁止放大低清原件。
function resizePNG(source,width,height=width){
 const {channels,pixels}=source;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>source.width||height>source.height)throw Error('图标尺寸无效或需要放大原件');
 const raw=Buffer.alloc((width*channels+1)*height),sx=source.width/width,sy=source.height/height;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const left=x*sx,right=(x+1)*sx,top=y*sy,bottom=(y+1)*sy,sums=[0,0,0];let alpha=0,area=0;
  for(let yy=Math.floor(top);yy<Math.ceil(bottom)&&yy<source.height;yy++)for(let xx=Math.floor(left);xx<Math.ceil(right)&&xx<source.width;xx++){
   const weight=(Math.min(xx+1,right)-Math.max(xx,left))*(Math.min(yy+1,bottom)-Math.max(yy,top));
   const i=(yy*source.width+xx)*channels,a=channels===4?pixels[i+3]/255:1;
   area+=weight;alpha+=a*weight;for(let c=0;c<3;c++)sums[c]+=pixels[i+c]*a*weight;
  }
  const out=y*(width*channels+1)+1+x*channels;
  for(let c=0;c<3;c++)raw[out+c]=alpha?Math.round(sums[c]/alpha):0;
  if(channels===4)raw[out+3]=Math.round(255*alpha/area);
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=channels===4?6:2;
 return Buffer.concat([signature,chunk('IHDR',header),...source.color,chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}

function ordinary(path,directory=false){
 const info=lstatSync(path);if(info.isSymbolicLink()||realpathSync(path)!==path||(directory?!info.isDirectory():!info.isFile()||info.nlink!==1))throw Error('图标路径必须是无链接普通文件或目录：'+path);
}
function clearOutput(path){
 const info=lstatSync(path,{throwIfNoEntry:false});if(!info)return;
 function check(at){ordinary(at,true);for(const name of readdirSync(at)){const p=join(at,name);if(lstatSync(p).isDirectory())check(p);else ordinary(p);}}
 check(path);rmSync(path,{recursive:true});
}
function generatePlatformIcons(project,platform){
 if(!['ios','android'].includes(platform)||!isAbsolute(project)||resolve(project)!==project)throw Error('图标生成平台或工程无效');
 const parts=relative(join(root,'target'),project).split(sep);
 if(!['build','test'].includes(parts[0])||!parts.includes('source-view')||parts.includes('..'))throw Error('图标只能生成到当前build或test的target工程');
 ordinary(project,true);ordinary(join(project,'icons'),true);
 if(platform==='android'){
  const directory=join(project,'android/resources');ordinary(directory,true);
  const inputs=readdirSync(directory).map(name=>{
   const match=/^(drawable(?:-v21)?|mipmap-anydpi-v26|values(?:-en|-night)?)_([a-z][a-z0-9_]*\.xml)$/u.exec(name);
   if(!match)throw Error('Android资源原件名称无效：'+name);
   const input=join(directory,name);ordinary(input);return {match,bytes:readFileSync(input)};
  });
  const resources=join(project,'android/app/res');
  for(let at=dirname(resources);at!==project;at=dirname(at))if(lstatSync(at,{throwIfNoEntry:false}))ordinary(at,true);
  clearOutput(resources);
  for(const {match,bytes}of inputs){const file=join(resources,match[1],match[2]);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,bytes);}
 }
 const output=join(project,platform,'build',platform==='ios'?'Assets.xcassets':'generated-icons');
 for(let at=dirname(output);at!==project;at=dirname(at))if(lstatSync(at,{throwIfNoEntry:false}))ordinary(at,true);
 const load=name=>{const path=join(project,'icons',name);ordinary(path);return {bytes:readFileSync(path),image:decodePNG(readFileSync(path))};};
 const launch=load('launch-logo.png');
 const app=load(platform==='ios'?'app-icon.png':'android-launcher.png');
 const foreground=platform==='android'?load('android-foreground.png'):undefined;
 const manifests=platform==='ios'?['AppIcon.appiconset','CitizenLaunchLogo.imageset'].map(name=>{
  const path=join(project,'ios/resources',name==='AppIcon.appiconset'?'AppIcon.json':'CitizenLaunchLogo.json');ordinary(path);return [name,JSON.parse(readFileSync(path,'utf8'))];
 }):[];
 clearOutput(output);mkdirSync(output,{recursive:true});
 const emit=(path,master,size)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,size===master.image.width&&size===master.image.height?master.bytes:resizePNG(master.image,size));};
 if(platform==='android'){
  for(const [density,scale]of [['mdpi',1],['hdpi',1.5],['xhdpi',2],['xxhdpi',3],['xxxhdpi',4]]){
   const dir=join(output,'mipmap-'+density);
   emit(join(dir,'ic_launcher.png'),app,48*scale);
   emit(join(dir,'ic_launcher_foreground.png'),foreground,108*scale);
   emit(join(dir,'launch_image.png'),launch,120*scale);
  }
 }else{
  for(const [name,manifest]of manifests){
   const dir=join(output,name);mkdirSync(dir,{recursive:true});const emitted=new Set();
   for(const item of manifest.images){
    if(!/^[\w@.-]+\.png$/u.test(item.filename))throw Error('图标文件名无效');
    const size=name==='AppIcon.appiconset'?Math.round(Number(item.size.split('x')[0])*Number(item.scale[0])):160*Number(item.scale[0]);
    if(!emitted.has(item.filename)){emit(join(dir,item.filename),name==='AppIcon.appiconset'?app:launch,size);emitted.add(item.filename);}
   }
   writeFileSync(join(dir,'Contents.json'),JSON.stringify(manifest,null,2)+'\n');
  }
 }
 return output;
}

return {decodePNG,resizePNG,generatePlatformIcons};
})();
export const {decodePNG,resizePNG,generatePlatformIcons}=platformIcons;

export const ANALYSIS_OPTIONS_SOURCE="# 本产品独立维护的 Flutter 分析规则。\ninclude: package:flutter_lints/flutter.yaml\n\nanalyzer:\n  exclude:\n    - \"**/*.g.dart\"\n\nlinter:\n  rules:\n    use_build_context_synchronously: true\n";
export const BUILD_SHELL_SOURCES=Object.freeze({"wallet":"#!/usr/bin/env bash\n# 在本产品target内准确任务工程生成本机优化安装包；本脚本不启动、不安装产品。\n#\n# 用法：node scripts/build.mjs wallet <ios|android>\n#\n# 目标平台是必填参数，不做任何自动探测：探测总要在失败时选一个回落，\n# 而回落的那一端会被当成用户想编的那一端。每个调用方必须明确传入目标平台。\n#\n# 调用方交付本产品target内任务工程；独立准备同样使用本产品target。\nset -euo pipefail\nCITIZENWALLET_DIR=\"${CITIZENWALLET_SOURCE_ROOT:?缺少所属产品源码根}\"\nPLATFORM=\"${1:?缺少目标平台，用法：$0 <ios|android>}\"\nPREPARE_ONLY=false\nif [[ \"$PLATFORM\" == prepare-ios || \"$PLATFORM\" == prepare-android ]]; then\n  PREPARE_ONLY=true\n  PLATFORM=\"${PLATFORM#prepare-}\"\nfi\n[[ \"$PLATFORM\" == ios || \"$PLATFORM\" == android ]] \\\n  || { echo \"本机目标平台只接受 ios 或 android：$PLATFORM\" >&2; exit 1; }\n\n# 所有独立入口的工具临时状态归本产品target；宿主已交付的产品工作根继续归当前任务。\nPRODUCT_TEMP_SOURCE=\"$CITIZENWALLET_DIR\"\nPRODUCT_TARGET_TEMP_ROOT=\"$(\"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$PRODUCT_TEMP_SOURCE/scripts/build.mjs\" temporary-root \"${PLATFORM:-${platform:-}}\" 'ios')\" || exit 1\nif [[ -z \"${PRODUCT_WORK_DIR:-}\" && \"${TMPDIR:-}\" != \"$PRODUCT_TEMP_SOURCE/target/\"* ]]; then\n  export TMPDIR=\"$PRODUCT_TARGET_TEMP_ROOT/\"\nfi\nCITIZENWALLET_WORK_DIR=\"${CITIZENWALLET_WORK_DIR:-$PRODUCT_TARGET_TEMP_ROOT}\"\n# 源码根只读；两个端的Flutter、Pods和Gradle状态分别写入当前产品工作目录。\n# 中文注释：检出目录名称由调用方选择；产品身份只取普通 pubspec 文件中的唯一包名。\npython3 - \"$CITIZENWALLET_DIR\" <<'CHECK_SOURCE'\nfrom pathlib import Path\nimport re\nimport sys\nsource = Path(sys.argv[1])\nmanifest = source / 'pubspec.yaml'\nif manifest.is_symlink() or not manifest.is_file():\n    raise SystemExit('citizenwallet本机Build源码身份无效')\nnames = re.findall(r'^name:[ \\t]*([^\\r\\n]+?)[ \\t]*$', manifest.read_text(), re.MULTILINE)\nif names != ['citizenwallet']:\n    raise SystemExit('citizenwallet本机Build源码身份无效')\nCHECK_SOURCE\n# 写入前先绑定本产品、真实平台、当前工作根和准确工程；拒绝链接或其它任务路径。\nCREATE_PROJECT=false\nif [[ \"$PREPARE_ONLY\" == true && -z \"${CITIZENWALLET_PROJECT_ROOT:-}\" ]]; then\n  CREATE_PROJECT=true\n  export CITIZENWALLET_PROJECT_ROOT=\"$CITIZENWALLET_WORK_DIR/source-view\"\nfi\npython3 - \"$CITIZENWALLET_DIR\" \"$PLATFORM\" \"$CITIZENWALLET_WORK_DIR\" \"${CITIZENWALLET_PROJECT_ROOT:-}\" \"$PREPARE_ONLY\" <<'CHECK_PROJECT'\nfrom pathlib import Path\nimport sys\nsource, platform, work, project, preparing = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3]), Path(sys.argv[4]), sys.argv[5]\nif not work.is_absolute() or work.resolve() != work:\n    raise SystemExit('产品工作目录必须为无链接规范绝对路径')\ntry:\n    parts = work.relative_to(source / 'target').parts\nexcept ValueError:\n    parts = ()\nif not parts or parts[0] not in {'build', 'test'}:\n    raise SystemExit('产品工作目录只允许本产品target/build或target/test')\nexpected = work / 'source-view' / str(source).lstrip('/')\nif not project.is_absolute() or project.resolve() != project or not (project == expected or preparing == 'true' and project == work / 'source-view'):\n    raise SystemExit('平台工程不属于当前任务')\nCHECK_PROJECT\n# 准备入口使用同一target边界；没有交付工程时只创建当前任务的准确空副本。\nif [[ \"$CREATE_PROJECT\" == true ]]; then\n  python3 - \"$CITIZENWALLET_DIR\" \"$CITIZENWALLET_PROJECT_ROOT\" <<'CREATE_VIEW'\nfrom pathlib import Path\nimport shutil\nimport sys\nsource = Path(sys.argv[1]).resolve(strict=True)\ntarget = Path(sys.argv[2])\nif target.exists() or target.is_symlink():\n    raise SystemExit('CitizenWallet本轮新工程必须为空目标')\nexcluded = {'.git', '.dart_tool', '.gradle', '.symlinks', 'Pods', 'build', 'target', 'node_modules', 'ephemeral', '.DS_Store', 'swiftpm'}\ngenerated = {'local.properties', 'Generated.xcconfig', 'flutter_export_environment.sh', '.flutter-plugins-dependencies', 'GeneratedPluginRegistrant.java', 'GeneratedPluginRegistrant.h', 'GeneratedPluginRegistrant.m', 'GeneratedPluginRegistrant.swift'}\ndef visit(src, dst):\n    dst.mkdir(parents=True)\n    for child in sorted(src.iterdir()):\n        if child.name in excluded or child.name in generated:\n            continue\n        output = dst / child.name\n        if child.is_dir() and not child.is_symlink():\n            visit(child, output)\n        else:\n            resolved = child.resolve(strict=True)\n            if not resolved.is_relative_to(source) or not resolved.is_file():\n                raise SystemExit('源码文件链接越界或不是普通文件')\n            shutil.copy2(resolved, output)\nvisit(source, target)\nCREATE_VIEW\nfi\nexport CITIZENWALLET_PROJECT_ROOT=\"${CITIZENWALLET_PROJECT_ROOT:?必须提供本轮CitizenWallet Flutter工程根}\"\n[[ -d \"$CITIZENWALLET_PROJECT_ROOT\" && -f \"$CITIZENWALLET_PROJECT_ROOT/pubspec.yaml\" ]] \\\n  || { echo 'CitizenWallet Flutter 产品目录无效' >&2; exit 1; }\nBUILD_WORK_DIR=\"${CITIZENWALLET_BUILD_WORK_DIR:-$CITIZENWALLET_WORK_DIR/work}\"\nDEPENDENCY_WORK_DIR=\"${CITIZENWALLET_DEPENDENCY_DIR:-$CITIZENWALLET_WORK_DIR/dependencies}\"\nBUILD_DIR=\"${CITIZENWALLET_BUILD_DIR:-$BUILD_WORK_DIR/flutter}\"\nARTIFACT_ROOT=\"${CITIZENWALLET_ARTIFACT_DIR:-$CITIZENWALLET_WORK_DIR}\"\n# Pub始终向工程根写.dart_tool；build-dir不能改变这个位置。先解析真实路径，\n# 拒绝工程根、.dart_tool及Kotlin持久目录链接把生成状态导回产品源码，再允许任何写入。\npython3 - \"$CITIZENWALLET_WORK_DIR\" \"$CITIZENWALLET_PROJECT_ROOT\" \"$CITIZENWALLET_PROJECT_ROOT/.dart_tool\" \"$CITIZENWALLET_WORK_DIR\" \"$BUILD_WORK_DIR\" \"$BUILD_WORK_DIR/kotlin-project\" \"$DEPENDENCY_WORK_DIR\" \"$BUILD_DIR\" \"$ARTIFACT_ROOT\" <<'CHECK_OUTPUTS'\nfrom pathlib import Path\nimport sys\nwork = Path(sys.argv[1]).resolve()\nfor value in sys.argv[2:]:\n    raw = Path(value)\n    target = raw.resolve()\n    if not raw.is_absolute() or raw != target or not (target == work or work in target.parents):\n        raise SystemExit(f'CitizenWallet可写目录必须属于当前任务且不得经过链接：{value}')\nCHECK_OUTPUTS\n# 固定平台布局只装配到本轮工程；逐层拒绝目录链接，禁止生成物回写源目录。\npython3 - \"$CITIZENWALLET_DIR\" \"$CITIZENWALLET_PROJECT_ROOT\" \"$PLATFORM\" \"$PREPARE_ONLY\" <<'PREPARE_PLATFORM'\nfrom pathlib import Path\nimport os\nimport shutil\nimport sys\nsource = Path(sys.argv[1]).resolve(strict=True)\nproject = Path(sys.argv[2])\nif project.resolve() != project or not any(project.is_relative_to(source / 'target' / scope) for scope in ('build', 'test')):\n    raise SystemExit('平台工程必须属于本产品build或test且不得经过链接')\npairs = [('ios/tests/RunnerTests.swift', 'ios/RunnerTests.swift'), ('ios/project/Runner.xcscheme', 'ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme'), ('ios/project/Runner.xcworkspacedata', 'ios/Runner.xcworkspace/contents.xcworkspacedata'), ('ios/native/placeholder.m', 'ios/signer/placeholder.m'), ('ios/native/citizenwallet_signer.podspec', 'ios/signer/citizenwallet_signer.podspec'), ('ios/tests/RunnerUITests.xctestplan', 'ios/RunnerUITests/RunnerUITests.xctestplan'), ('ios/tests/ImportWalletUITests.swift', 'ios/RunnerUITests/ImportWalletUITests.swift'), ('ios/tests/CreateWalletUITests.swift', 'ios/RunnerUITests/CreateWalletUITests.swift'), ('ios/source/Runner-Bridging-Header.h', 'ios/Runner/Runner-Bridging-Header.h'), ('ios/source/HardwareSecretvaultPlugin.swift', 'ios/Runner/HardwareSecretvaultPlugin.swift'), ('ios/resources/InfoPlist.xcstrings', 'ios/Runner/InfoPlist.xcstrings'), ('ios/source/AppDelegate.swift', 'ios/Runner/AppDelegate.swift'), ('ios/source/Info.plist', 'ios/Runner/Info.plist'), ('ios/source/SceneDelegate.swift', 'ios/Runner/SceneDelegate.swift'), ('ios/project/Runner.pbxproj', 'ios/Runner.xcodeproj/project.pbxproj'), ('ios/config/Debug.xcconfig', 'ios/Flutter/Debug.xcconfig'), ('ios/config/Release.xcconfig', 'ios/Flutter/Release.xcconfig'), ('ios/config/AppFrameworkInfo.plist', 'ios/Flutter/AppFrameworkInfo.plist'), ('ios/resources/AppIcon.json', 'ios/IconAssets/AppIcon.appiconset/Contents.json'), ('ios/resources/CitizenLaunchLogo.json', 'ios/IconAssets/CitizenLaunchLogo.imageset/Contents.json'), ('ios/project/project.xcworkspacedata', 'ios/Runner.xcodeproj/project.xcworkspace/contents.xcworkspacedata'), ('ios/project/ProjectWorkspaceChecks.plist', 'ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist'), ('ios/project/ProjectWorkspaceSettings.xcsettings', 'ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/WorkspaceSettings.xcsettings'), ('ios/resources/CitizenLaunchScreen.storyboard', 'ios/Runner/Base.lproj/CitizenLaunchScreen.storyboard'), ('ios/resources/Main.storyboard', 'ios/Runner/Base.lproj/Main.storyboard'), ('ios/project/RunnerWorkspaceChecks.plist', 'ios/Runner.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist'), ('ios/project/RunnerWorkspaceSettings.xcsettings', 'ios/Runner.xcworkspace/xcshareddata/WorkspaceSettings.xcsettings')] if sys.argv[3] == 'ios' else [\n    ('android/gradle-wrapper.properties', 'android/gradle/wrapper/gradle-wrapper.properties'),\n    ('android/settings.gradle.kts', 'android/settings.gradle.kts')]\nif sys.argv[3] == 'android':\n    import re\n    resources = source / 'android/resources'\n    if not resources.is_dir() or resources.is_symlink():\n        raise SystemExit('缺少普通Android资源原件目录')\n    for resource in sorted(resources.iterdir()):\n        match = re.fullmatch(r'(drawable(?:-v21)?|mipmap-anydpi-v26|values(?:-en|-night)?)_([a-z][a-z0-9_]*\\.xml)', resource.name)\n        if not match:\n            raise SystemExit('Android资源原件名称无效：' + resource.name)\n        pairs.append(('android/resources/' + resource.name, 'android/app/res/' + match[1] + '/' + match[2]))\n# 先完成所有输入验真，避免缺少工具时留下半套平台入口。\n# 本轮Xcode工程和Android settings已由准备阶段改写；装配继续核验本轮普通文件。\ninputs = [(project / origin if origin in ('ios/project/Runner.pbxproj', 'android/settings.gradle.kts') and (project / origin).is_file() else source / origin, destination) for origin, destination in pairs]\nfor relative in ('android/gradlew', 'android/gradlew.bat', 'android/gradle'):\n    if (source / relative).exists() or (source / relative).is_symlink():\n        raise SystemExit('产品源码残留Wrapper副本：' + relative)\nif sys.argv[3] == 'android' and sys.argv[4] == 'true':\n    # 远端直接运行Wrapper；原件来自该流程已安装的Flutter，不从产品取得或下载。\n    raw = os.environ.get('FLUTTER_ROOT', '')\n    flutter = Path(raw)\n    if not raw or not flutter.is_absolute() or not flutter.is_dir() or flutter.resolve() != flutter:\n        raise SystemExit('必须提供无链接的Flutter工具根')\n    for name in ('gradlew', 'gradlew.bat', 'gradle/wrapper/gradle-wrapper.jar'):\n        src = flutter / 'bin/cache/artifacts/gradle_wrapper' / name\n        if src.resolve() != src or not src.is_file() or src.stat().st_size == 0:\n            raise SystemExit('Flutter Wrapper原件缺失或为链接：' + name)\n        inputs.append((src, 'android/' + name))\nfor src, destination in inputs:\n    dst = project / destination\n    origin = str(src)\n    if not src.is_file() or src.is_symlink() or src.resolve() != src:\n        raise SystemExit('缺少普通平台输入：' + origin)\n    parent = dst.parent\n    while parent != project:\n        if parent.is_symlink():\n            raise SystemExit('平台目标祖先不得为链接：' + destination)\n        parent = parent.parent\n    if dst.is_symlink():\n        if dst.resolve(strict=True) != src:\n            raise SystemExit('平台入口来源不符：' + destination)\n        dst.unlink()\n    elif dst.exists():\n        if not dst.is_file() or dst.read_bytes() != src.read_bytes():\n            raise SystemExit('平台入口重复或内容漂移：' + destination)\n        continue\n    dst.parent.mkdir(parents=True, exist_ok=True)\n    shutil.copy2(src, dst)\n    if destination == 'android/gradlew':\n        dst.chmod(0o755)\nPREPARE_PLATFORM\n\"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$CITIZENWALLET_DIR/scripts/build.mjs\" icons \"$CITIZENWALLET_PROJECT_ROOT\" \"$PLATFORM\"\nif [[ \"$PREPARE_ONLY\" == true ]]; then\n  printf '%s\\n' \"$CITIZENWALLET_PROJECT_ROOT\"\n  exit 0\nfi\n# CocoaPods 会改写工程锁文件；先确认工程与工作目录均在当前任务target内，再把\n# 指向源码的锁文件链接原子替换为工程普通文件，禁止本机 Build 回写源码。\nif [[ \"$PLATFORM\" == ios ]]; then\n  python3 - \"$CITIZENWALLET_DIR/ios/Podfile.lock\" \"$CITIZENWALLET_PROJECT_ROOT/ios/Podfile.lock\" <<'DETACH_IOS_LOCK'\nfrom pathlib import Path\nimport os\nimport tempfile\nimport sys\n\nsource = Path(sys.argv[1]).resolve(strict=True)\nproject_lock = Path(sys.argv[2])\nif project_lock.is_symlink():\n    if project_lock.resolve(strict=True) != source:\n        raise SystemExit('CitizenWallet iOS工程锁文件链接目标不是本产品源码')\n    fd, temporary = tempfile.mkstemp(prefix='Podfile.lock.', dir=project_lock.parent)\n    try:\n        with os.fdopen(fd, 'wb') as output:\n            output.write(source.read_bytes())\n        os.replace(temporary, project_lock)\n    finally:\n        if os.path.exists(temporary):\n            os.unlink(temporary)\nDETACH_IOS_LOCK\nfi\ncd \"$CITIZENWALLET_PROJECT_ROOT\"\nexport CITIZENWALLET_BUILD_DIR=\"$BUILD_DIR\"\nexport CITIZENWALLET_NATIVE_ANDROID_DIR=\"${CITIZENWALLET_NATIVE_ANDROID_DIR:-$BUILD_WORK_DIR/native/android}\"\nexport CITIZENWALLET_NATIVE_IOS_DIR=\"${CITIZENWALLET_NATIVE_IOS_DIR:-$BUILD_WORK_DIR/native/ios}\"\nexport CARGO_TARGET_DIR=\"${CARGO_TARGET_DIR:-$BUILD_WORK_DIR/cargo}\"\nexport XDG_CONFIG_HOME=\"${XDG_CONFIG_HOME:-$DEPENDENCY_WORK_DIR/flutter-config}\"\nexport PUB_CACHE=\"${PUB_CACHE:-$DEPENDENCY_WORK_DIR/pub}\"\nexport GRADLE_USER_HOME=\"$DEPENDENCY_WORK_DIR/gradle\"\nexport CP_HOME_DIR=\"$DEPENDENCY_WORK_DIR/cocoapods\"\nexport TMPDIR=\"$CITIZENWALLET_WORK_DIR/tmp/\"\nexport FLUTTER_SUPPRESS_ANALYTICS=true COCOAPODS_DISABLE_STATS=true\nexport CITIZENWALLET_GRADLE_INIT_SCRIPT=\"${CITIZENWALLET_GRADLE_INIT_SCRIPT:-$CITIZENWALLET_WORK_DIR/gradle.init.gradle}\"\nexport CITIZENWALLET_FLUTTER_GRADLE_BUILD_DIR=\"${CITIZENWALLET_FLUTTER_GRADLE_BUILD_DIR:-$BUILD_WORK_DIR/flutter-gradle-plugin}\"\nmkdir -p \"$XDG_CONFIG_HOME\" \"$TMPDIR\" \"$CITIZENWALLET_FLUTTER_GRADLE_BUILD_DIR\"\n# Flutter Gradle 插件原件只读；其 Kotlin 会话与编译状态必须写入本轮工作目录。\nprintf '%s\\n' \\\n  'gradle.beforeProject { project ->' \\\n  '    def source = System.getenv(\"CITIZENWALLET_FLUTTER_GRADLE_ROOT\")' \\\n  '    def output = System.getenv(\"CITIZENWALLET_FLUTTER_GRADLE_BUILD_DIR\")' \\\n  '    if (source && output && project.rootDir.canonicalPath == new File(source).canonicalPath) {' \\\n  '        def suffix = project.path == \":\" ? \"root\" : project.path.substring(1).replace(\":\", \"/\")' \\\n  '        project.layout.buildDirectory.set(new File(output, suffix))' \\\n  '        project.extensions.extraProperties.set(\"kotlin.project.persistent.dir\", new File(output, suffix + \"/kotlin-project\").path)' \\\n  '    }' \\\n  '}' >\"$CITIZENWALLET_GRADLE_INIT_SCRIPT\"\n# Flutter只接受相对产品根的build-dir配置；把本轮绝对目录换算为相对路径，\n# 不能写死为产品源码下的cache/build，也不能在产品根生成build。\nFLUTTER_BUILD_RELATIVE=\"$(python3 -c 'import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))' \"$BUILD_DIR\" \"$CITIZENWALLET_PROJECT_ROOT\")\"\nflutter config --build-dir=\"$FLUTTER_BUILD_RELATIVE\" >/dev/null\n\nPUB_GET_ARGS=(--enforce-lockfile)\nGRADLE_ARGS=(--no-daemon)\ncase \"${CITIZENWALLET_PUB_OFFLINE:-false}\" in\n  true|false) ;;\n  *) echo 'CITIZENWALLET_PUB_OFFLINE只接受true或false' >&2; exit 1 ;;\nesac\nPUB_OFFLINE=\"${CITIZENWALLET_PUB_OFFLINE:-false}\"\ncase \"${CITIZENWALLET_OFFLINE:-false}\" in\n  true) PUB_OFFLINE=true; GRADLE_ARGS+=(--offline); export CARGO_NET_OFFLINE=true ;;\n  false) ;;\n  *) echo 'CITIZENWALLET_OFFLINE只接受true或false' >&2; exit 1 ;;\nesac\n# 任务级Pub预装只约束Pub；原整体离线开关仍同时约束Pub、Gradle和Cargo。\nif [[ \"$PUB_OFFLINE\" == true ]]; then PUB_GET_ARGS+=(--offline); fi\n\n# Flutter 版本及依赖配置由产品工程自行决定。\n\n# Flutter在缓存工程生成配置和插件清单；Gradle只从公民钱包真实android根启动，\n# 项目缓存、依赖缓存、编译物和临时文件继续使用当前Android任务缓存。\n# Kotlin持久状态不受--project-cache-dir控制，必须另传官方工程属性避免源码生成.kotlin。\nbuild_android_release() {\n  local properties flutter_command flutter_sdk android_sdk gradle_bin\n  local flutter_version dart_defines link_target java_home expected_gradle_version actual_gradle_version\n  gradle_bin=\"${CITIZENWALLET_GRADLE_BIN:?Android Build必须提供绝对Gradle工具路径}\"\n  [[ \"$gradle_bin\" == /* && -f \"$gradle_bin\" && -x \"$gradle_bin\" ]] \\\n    || { echo \"Android Gradle工具无效：$gradle_bin\" >&2; return 1; }\n  properties=\"$CITIZENWALLET_PROJECT_ROOT/android/local.properties\"\n  flutter_command=\"$(command -v flutter)\"\n  while [[ -L \"$flutter_command\" ]]; do\n    link_target=\"$(readlink \"$flutter_command\")\"\n    [[ \"$link_target\" == /* ]] || link_target=\"$(cd \"$(dirname \"$flutter_command\")\" && pwd -P)/$link_target\"\n    flutter_command=\"$link_target\"\n  done\n  flutter_sdk=\"$(cd \"$(dirname \"$flutter_command\")/..\" && pwd -P)\"\n  android_sdk=\"${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}\"\n  # JDK选择属于CitizenWallet产品流程：保留调用方选择；本机未传入时使用\n  # Android Studio随包JBR。Gradle自行报告工具错误，不增加外部前置门禁。\n  java_home=\"${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}\"\n  # Wrapper属性仍是产品的Gradle版本真源；调用方给出的工具必须与它完全一致。\n  expected_gradle_version=\"$(sed -nE 's@^distributionUrl=.*gradle-([0-9][0-9.]*)-bin\\.zip$@\\1@p' \\\n    \"$CITIZENWALLET_DIR/android/gradle-wrapper.properties\")\"\n  [[ -n \"$expected_gradle_version\" ]] || { echo 'Android Gradle版本声明无效' >&2; return 1; }\n  actual_gradle_version=\"$(JAVA_HOME=\"$java_home\" \"$gradle_bin\" --version | sed -n 's/^Gradle //p' | head -n 1)\"\n  [[ \"$actual_gradle_version\" == \"$expected_gradle_version\" ]] \\\n    || { echo 'Android Gradle工具版本与钱包锁定版本不一致' >&2; return 1; }\n  # 完整prepare已写入验真SDK与原始版本，资源解析和编译消费同一普通配置。\n  [[ -f \"$properties\" && ! -L \"$properties\" ]] \\\n    || { echo 'Android工程缺少完整prepare交付的local.properties' >&2; return 1; }\n  flutter_version=\"$(flutter --version --machine)\"\n  dart_defines=\"$(printf '%s' \"$flutter_version\" | python3 -c '\nimport base64, json, sys\nvalue = json.load(sys.stdin)\nfields = (\n    (\"FLUTTER_VERSION\", \"frameworkVersion\"),\n    (\"FLUTTER_CHANNEL\", \"channel\"),\n    (\"FLUTTER_GIT_URL\", \"repositoryUrl\"),\n    (\"FLUTTER_FRAMEWORK_REVISION\", \"frameworkRevision\"),\n    (\"FLUTTER_ENGINE_REVISION\", \"engineRevision\"),\n    (\"FLUTTER_DART_VERSION\", \"dartSdkVersion\"),\n)\nprint(\",\".join(base64.b64encode(f\"{name}={value[key]}\".encode()).decode() for name, key in fields))\n')\"\n  (\n    cd \"$CITIZENWALLET_PROJECT_ROOT/android\"\n    # 调用方提供同一已验真 Gradle 工具，任务目录只承载依赖和编译状态，不再下载工具分发包。\n    ANDROID_HOME=\"$android_sdk\" ANDROID_SDK_ROOT=\"$android_sdk\" JAVA_HOME=\"$java_home\" PATH=\"$java_home/bin:$PATH\" \\\n    CITIZENWALLET_FLUTTER_GRADLE_ROOT=\"$flutter_sdk/packages/flutter_tools/gradle\" \\\n    FLUTTER_ROOT=\"$flutter_sdk\" \"$gradle_bin\" \"${GRADLE_ARGS[@]}\" --stacktrace --no-problems-report \\\n      --init-script \"$CITIZENWALLET_GRADLE_INIT_SCRIPT\" \\\n      --project-cache-dir \"$BUILD_WORK_DIR/gradle-project\" \\\n      -Pkotlin.project.persistent.dir=\"$BUILD_WORK_DIR/kotlin-project\" \\\n      -Ptarget-platform=android-arm64 \\\n      -Ptarget=lib/main.dart \\\n      -Pbase-application-name=android.app.Application \\\n      -Pdart-defines=\"$dart_defines\" \\\n      -Pdart-obfuscation=false \\\n      -Ptrack-widget-creation=true \\\n      -Ptree-shake-icons=true \\\n      assembleRelease\n  )\n}\n\n# 仅清理当前工作目录中的候选包，不触碰源码或另一端。\nclean_platform_build_outputs() {\n  case \"$PLATFORM\" in\n    ios) rm -rf \"$BUILD_DIR/ios/iphoneos/Runner.app\" ;;\n    android) rm -f \"$BUILD_DIR/app/outputs/flutter-apk/\"*.apk ;;\n  esac\n  mkdir -p \"$BUILD_DIR\"\n}\n\n# 仅选择 Xcode 报告的一台可用 iOS 真机；不在无设备或多设备时回落模拟器。\nrun_ios_ui_tests() {\n  local xcodebuild_bin destinations device_id\n  xcodebuild_bin=\"${CITIZENWALLET_XCODEBUILD_BIN:?iOS Build必须提供绝对Xcode工具路径}\"\n  [[ \"$xcodebuild_bin\" == /* && -f \"$xcodebuild_bin\" && -x \"$xcodebuild_bin\" ]] \\\n    || { echo 'iOS Xcode工具无效' >&2; return 1; }\n  destinations=\"$(\"$xcodebuild_bin\" -workspace \"$CITIZENWALLET_PROJECT_ROOT/ios/Runner.xcworkspace\" \\\n    -scheme Runner -configuration Release -showdestinations)\"\n  device_id=\"$(printf '%s\\n' \"$destinations\" | python3 -c '\nimport re, sys\navailable = sys.stdin.read().split(\"Ineligible destinations\", 1)[0]\nids = re.findall(r\"\\{\\s*platform:iOS,\\s*arch:arm64,\\s*id:([0-9A-Fa-f-]+),\", available)\nif len(ids) != 1 or not re.fullmatch(r\"[0-9A-Fa-f]{8}-[0-9A-Fa-f-]{16,}\", ids[0]):\n    raise SystemExit(\"iOS UI测试需要唯一可用真机\")\nprint(ids[0])\n')\"\n  # 测试计划关闭自动屏幕采集，避免触发钱包既有录屏保护；Release 测试应用与编译物均留在调用方工作根。\n  \"$xcodebuild_bin\" test \\\n    -workspace \"$CITIZENWALLET_PROJECT_ROOT/ios/Runner.xcworkspace\" \\\n    -scheme Runner -configuration Release \\\n    -destination \"platform=iOS,id=$device_id\" \\\n    -only-testing:RunnerUITests -parallel-testing-enabled NO \\\n    -collect-test-diagnostics never \\\n    -derivedDataPath \"$BUILD_WORK_DIR/xcode-ui\" \\\n    -resultBundlePath \"$BUILD_WORK_DIR/ios-ui-tests.xcresult\"\n}\n\n\n# 已跟踪的 pallet_registry.dart 是构建输入；本机编译不得回写共享源码索引。\n\necho \"==> 清理 ${PLATFORM} 平台构建产物...\"\nclean_platform_build_outputs\necho \"==> 获取依赖...\"\nflutter pub get \"${PUB_GET_ARGS[@]}\"\n# 已登记 Node 在当前任务目录运行钱包自身的构建合同测试；失败同样阻止平台编译。\nnode_bin=\"${CITIZENWALLET_NODE_BIN:?本机Build必须提供绝对Node工具路径}\"\n[[ \"$node_bin\" == /* && -f \"$node_bin\" && -x \"$node_bin\" ]] \\\n  || { echo '本机Build的Node工具无效' >&2; exit 1; }\n\"$node_bin\" --test \"$CITIZENWALLET_DIR/test/release_manifest.test.mjs\"\n# 本机钱包 Build 与 CI 使用同一套单元和组件测试。先在本轮target Cargo 目录\n# 编译宿主 FFI 动态库，再运行 Flutter 测试；测试失败立即阻止后续平台编译与安装。\necho \"==> 编译宿主签名库并运行钱包测试...\"\n\"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$CITIZENWALLET_DIR/scripts/build.mjs\" native host\n# 测试缓存留在当前任务工程视图，避免相对路径重复拼接越界。\nflutter config --build-dir=test-build >/dev/null\nflutter test --no-pub\nflutter config --build-dir=\"$FLUTTER_BUILD_RELATIVE\" >/dev/null\n# Isar 与 QR 生成文件已经纳入仓库。本机四端编译只消费同一份源码，禁止两个平台在\n# 构建过程中同时运行 build_runner 改写源文件。\n\n# sr25519 原生签名库(schnorrkel)。签名、派生、验签全走它，缺库会在运行时才炸，\n# 所以必须先于 flutter build 产出；实现来自 citizenwallet/rust/source/sr25519.rs，\n# 由公民钱包独立维护。\necho \"==> 编译原生签名库（${PLATFORM}）...\"\n# 使用所属产品构建入口的绝对路径，工作目录切换后仍定位同一实现。\n\"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$CITIZENWALLET_DIR/scripts/build.mjs\" native \"$PLATFORM\"\n\n# 本脚本编译并运行既有测试；完整Build由产品入口继续签名验真、安装和回读。\n# `--release`只是本机优化配置，不表示或触发正式Release流程。\necho \"==> 编译本机优化安装包...\"\nif [[ \"$PLATFORM\" == ios ]]; then\n  flutter build ios --release\n  echo \"==> 在唯一真机运行 Release UI 测试...\"\n  run_ios_ui_tests\n  IOS_APP=\"$BUILD_DIR/ios/iphoneos/Runner.app\"\n  \"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$CITIZENWALLET_DIR/scripts/build.mjs\" native verify-ios-package \"$IOS_APP\"\n  echo \"\"\n  echo \"==> iOS Release编译和真机测试完成，继续签名验真、安装及回读。\"\nelif [[ \"$PLATFORM\" == android ]]; then\n  build_android_release\n  ANDROID_APK=\"$BUILD_DIR/app/outputs/flutter-apk/app-release.apk\"\n  [[ -f \"$ANDROID_APK\" ]] || {\n    echo \"Android 本机无私钥 APK 不存在\" >&2\n    exit 1\n  }\n  \"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$CITIZENWALLET_DIR/scripts/build.mjs\" native verify-android-package \"$ANDROID_APK\"\n  # 未签名APK仅留在本轮工作根；产品完整入口随后使用已有身份签名、安装和回读。\n  mkdir -p \"$ARTIFACT_ROOT\"\n  cp \"$ANDROID_APK\" \"$ARTIFACT_ROOT/android.apk\"\n  echo \"==> Android未签名APK编译完成，继续使用已有身份签名、安装及回读。\"\nfi\n","native":"#!/usr/bin/env bash\n# 编译 CitizenWallet 冷钱包原生密码学库，放到 Flutter 能自动打包的位置。\n#\n# sr25519签名实现只属于citizenwallet/rust/source/sr25519.rs。\n# 本库是冷端FFI外壳，永久离线且不需要链。\n#\n# 前置条件：当前Rust编译器已具备目标平台标准库；本脚本只读检查，不自动安装。\n#\n# 用法：\n#   node scripts/build.mjs native            # 编译所有平台\n#   node scripts/build.mjs native android    # 仅 Android\n#   node scripts/build.mjs native ios        # 仅 iOS\n#   node scripts/build.mjs native macos      # 仅 macOS（flutter test 用）\nset -euo pipefail\n\nWALLET_DIR=\"${CITIZENWALLET_SOURCE_ROOT:?缺少所属产品源码根}\"\nRUST_DIR=\"$WALLET_DIR/rust\"\nLIB_NAME=\"libcitizenwallet_signer\"\nTARGET=\"${1:-all}\"\n\n# 宿主与平台库同属本轮产品工作根；独立调用也使用本产品声明的平台target。\n# 复用公开工作根校验，禁止旧“整棵源码外”规则误拒绝已验真的target任务。\nCITIZENWALLET_WORK_DIR=\"$(\"${PRODUCT_NODE_BIN:-${NODE:-node}}\" --input-type=module - \"$WALLET_DIR/scripts/build.mjs\" \"${CITIZENWALLET_WORK_DIR:-${PRODUCT_WORK_DIR:-}}\" \"$TARGET\" \"${PLATFORM:-${platform:-}}\" <<'CHECK_WORK'\nimport {pathToFileURL} from 'node:url';\nimport {dirname,join,relative,sep} from 'node:path';\nconst [entry,provided,target,explicit]=process.argv.slice(2);\nconst {checkWork,productTarget,temporaryRoot}=await import(pathToFileURL(entry));\nconst requested=target==='android'||target==='verify-android-package'?'android':target==='ios'||target==='verify-ios-package'?'ios':undefined;\nconst platform=explicit||requested||'ios';\nif(requested&&requested!==platform)throw Error('原生目标与当前任务平台不符');\nconst work=provided?checkWork(provided):temporaryRoot(platform,'tmp');\nif(!work.startsWith(productTarget(platform)+sep))throw Error('原生工作根与当前任务平台不符');\nprocess.stdout.write(work+'\\n');\nCHECK_WORK\n)\" || exit 1\nCITIZENWALLET_NATIVE_WORK_DIR=\"${CITIZENWALLET_NATIVE_WORK_DIR:-$CITIZENWALLET_WORK_DIR/work/native}\"\nexport CARGO_TARGET_DIR=\"${CARGO_TARGET_DIR:-$CITIZENWALLET_NATIVE_WORK_DIR/cargo-target}\"\nexport CITIZENWALLET_NATIVE_ANDROID_DIR=\"${CITIZENWALLET_NATIVE_ANDROID_DIR:-$CITIZENWALLET_NATIVE_WORK_DIR/android}\"\nexport CITIZENWALLET_NATIVE_IOS_DIR=\"${CITIZENWALLET_NATIVE_IOS_DIR:-$CITIZENWALLET_NATIVE_WORK_DIR/ios}\"\n# 全部原生产物与临时状态在编译前一次验真，不允许源码、其它任务或链接写入。\nexport TMPDIR=\"${TMPDIR:-$CITIZENWALLET_WORK_DIR/tmp/}\"\npython3 - \"$CITIZENWALLET_WORK_DIR\" \"$CITIZENWALLET_NATIVE_WORK_DIR\" \"$CARGO_TARGET_DIR\" \"$CITIZENWALLET_NATIVE_ANDROID_DIR\" \"$CITIZENWALLET_NATIVE_IOS_DIR\" \"$TMPDIR\" <<'CHECK_TARGET'\nfrom pathlib import Path\nimport sys\nwork = Path(sys.argv[1])\nfor value in sys.argv[2:]:\n    target = Path(value)\n    if not target.is_absolute() or target.resolve() != target or not target.is_relative_to(work) or target == work:\n        raise SystemExit('原生产物与临时目录必须属于当前任务且不得经过链接：' + value)\nCHECK_TARGET\nmkdir -p \"$TMPDIR\"\n\nensure_target() {\n  local target=\"$1\" target_lib\n  # 只检查当前Rust编译器已有的目标库；缺失即停止，构建不得自动安装工具。\n  target_lib=\"$(rustc --print target-libdir --target \"$target\")\" || return 1\n  [[ \"$target_lib\" == /* && -d \"$target_lib\" ]] \\\n    || { echo \"错误: Rust目标库目录无效：$target\" >&2; return 1; }\n  local core_libraries=(\"$target_lib\"/libcore-*.rlib)\n  local std_libraries=(\"$target_lib\"/libstd-*.rlib)\n  [[ -f \"${core_libraries[0]}\" && -f \"${std_libraries[0]}\" ]] \\\n    || { echo \"错误: 当前Rust缺少已安装目标库：${target}；构建停止\" >&2; return 1; }\n}\n\n# 4个sr25519 C符号必须齐全，禁止交付额外用途钥符号，否则 Dart 侧 lookupFunction 会在运行时才失败。\n# 注意平台差异：ELF 用 -D，Mach-O 用 -g，用错标志会误判为 0。\nverify_symbols() {\n  local lib=\"$1\"\n  local nm_flag=\"$2\"\n  local nm_bin\n  nm_bin=\"$(command -v llvm-nm || true)\"\n  if [ -z \"$nm_bin\" ]; then\n    local sdk_home=\"${ANDROID_HOME:-$HOME/Library/Android/sdk}\"\n    nm_bin=\"$(ls \"$sdk_home\"/ndk/*/toolchains/llvm/prebuilt/*/bin/llvm-nm 2>/dev/null | tail -1 || true)\"\n  fi\n  if [ -z \"$nm_bin\" ]; then\n    echo \"错误: 未找到 llvm-nm，不能验证原生库导出符号。\"\n    return 1\n  fi\n  local signer_count removed_export_count\n  signer_count=\"$(\"$nm_bin\" \"$nm_flag\" \"$lib\" 2>/dev/null | grep -c 'citizen_sr25519' || true)\"\n  removed_export_count=\"$(\"$nm_bin\" \"$nm_flag\" \"$lib\" 2>/dev/null | grep -c 'account_crypto_' || true)\"\n  if [ \"$signer_count\" != \"4\" ] || [ \"$removed_export_count\" != \"0\" ]; then\n    echo \"错误: $lib 符号不完整（citizen_sr25519_*=$signer_count/4, 禁用导出=$removed_export_count/0）\"\n    return 1\n  fi\n  echo \"    符号检查通过：citizen_sr25519_*=4, 禁用导出=0\"\n}\n\nverify_android_package() {\n  local package=\"$1\" expected=\"${CITIZENWALLET_NATIVE_ANDROID_DIR:?缺少CitizenWallet Android原生库目录}/arm64-v8a/$LIB_NAME.so\" entry temporary packaged\n  [[ -f \"$package\" ]] || { echo \"错误: Android 包不存在：$package\"; return 1; }\n  [[ -f \"$expected\" ]] || { echo \"错误: Android 原生库不存在：$expected\"; return 1; }\n  case \"$package\" in\n    *.apk) entry=\"lib/arm64-v8a/$LIB_NAME.so\" ;;\n    *.aab) entry=\"base/lib/arm64-v8a/$LIB_NAME.so\" ;;\n    *) echo \"错误: 只支持校验 APK/AAB：$package\"; return 1 ;;\n  esac\n  # 中文注释：Android 打包会剥离调试段，不能按原文件字节比对；从最终包提取后验证\n  # ELF 架构和真实导出符号，缺失、错 ABI 或错误库都会在上传前失败。\n  temporary=\"$(mktemp -d)\"\n  packaged=\"$temporary/$LIB_NAME.so\"\n  unzip -p \"$package\" \"$entry\" > \"$packaged\" || { rm -rf \"$temporary\"; return 1; }\n  [[ -s \"$packaged\" ]] || { rm -rf \"$temporary\"; echo \"错误: Android 包内原生库为空：$entry\"; return 1; }\n  file \"$packaged\" | grep -Eq 'ARM aarch64|ARM64' || {\n    rm -rf \"$temporary\"; echo \"错误: Android 包内原生库不是 arm64：$entry\"; return 1;\n  }\n  verify_symbols \"$packaged\" -D || { rm -rf \"$temporary\"; return 1; }\n  rm -rf \"$temporary\"\n  if unzip -Z1 \"$package\" | grep -E \"(^|/)lib/(armeabi-v7a|x86|x86_64)/$LIB_NAME\\\\.so$\"; then\n    echo \"错误: Android 包含未支持 ABI 的原生库。\"; return 1\n  fi\n  echo \"Android 包原生库门禁通过：$entry\"\n}\n\nverify_ios_package() {\n  local app_bundle=\"$1\" executable nm_bin symbols\n  executable=\"$app_bundle/Runner\"\n  [[ -f \"$executable\" ]] || { echo \"错误: iOS Runner 不存在：$executable\"; return 1; }\n  [[ \"$(lipo -archs \"$executable\")\" = \"arm64\" ]] || {\n    echo \"错误: iOS 真机包必须且只能包含 arm64：$(lipo -archs \"$executable\")\"; return 1;\n  }\n  nm_bin=\"$(xcrun --find llvm-nm)\"\n  symbols=\"$(\"$nm_bin\" -gU \"$executable\" 2>/dev/null | awk '{print $NF}' | sed 's/^_//' || true)\"\n  [[ \"$(printf '%s\\n' \"$symbols\" | grep -c '^citizen_sr25519_' || true)\" = \"4\" ]] || {\n    echo \"错误: iOS Runner 的 citizen_sr25519_* 符号不完整。\"; return 1;\n  }\n  [[ \"$(printf '%s\\n' \"$symbols\" | grep -c '^account_crypto_' || true)\" = \"0\" ]] || {\n    echo \"错误: iOS Runner包含禁用的用途钥导出。\"; return 1;\n  }\n  echo \"iOS 包原生库门禁通过：arm64与4个sr25519 FFI符号完整，禁用导出为零\"\n}\n\nbuild_android() {\n  echo \"\"\n  echo \"=== 编译 Android (arm64-v8a) ===\"\n  ensure_target aarch64-linux-android\n\n  local ndk_home=\"${ANDROID_NDK_HOME:-}\"\n  if [ -z \"$ndk_home\" ]; then\n    local sdk_home=\"${ANDROID_HOME:-$HOME/Library/Android/sdk}\"\n    ndk_home=\"$(ls -d \"$sdk_home/ndk/\"* 2>/dev/null | sort -V | tail -1 || true)\"\n  fi\n  if [ -z \"$ndk_home\" ] || [ ! -d \"$ndk_home\" ]; then\n    echo \"错误: 未找到 Android NDK。请设置 ANDROID_NDK_HOME 或通过 Android Studio 安装 NDK。\"\n    return 1\n  fi\n  echo \"使用 NDK: $ndk_home\"\n\n  local toolchain=\"\"\n  case \"$(uname -s)\" in\n    Darwin)\n      toolchain=\"$ndk_home/toolchains/llvm/prebuilt/darwin-x86_64\"\n      if [ ! -d \"$toolchain\" ]; then\n        toolchain=\"$ndk_home/toolchains/llvm/prebuilt/darwin-aarch64\"\n      fi\n      ;;\n    Linux)\n      toolchain=\"$ndk_home/toolchains/llvm/prebuilt/linux-x86_64\"\n      ;;\n    *)\n      echo \"错误: 当前系统不支持自动定位 Android NDK toolchain: $(uname -s)\"\n      return 1\n      ;;\n  esac\n  if [ ! -d \"$toolchain\" ]; then\n    echo \"错误: 未找到 Android NDK toolchain: $toolchain\"\n    return 1\n  fi\n\n  export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER=\"$toolchain/bin/aarch64-linux-android24-clang\"\n  export CC_aarch64_linux_android=\"$toolchain/bin/aarch64-linux-android24-clang\"\n  export AR_aarch64_linux_android=\"$toolchain/bin/llvm-ar\"\n\n  cd \"$RUST_DIR\"\n  cargo build --release --target aarch64-linux-android\n\n  # CitizenWallet Android 唯一支持 arm64-v8a；禁止重新生成任何 32 位或 x86 ABI。\n  local arm64_dest=\"${CITIZENWALLET_NATIVE_ANDROID_DIR:?缺少CitizenWallet Android原生库目录}/arm64-v8a\"\n  mkdir -p \"$arm64_dest\"\n  cp \"$CARGO_TARGET_DIR/aarch64-linux-android/release/$LIB_NAME.so\" \"$arm64_dest/\"\n  echo \"Android arm64-v8a: $arm64_dest/$LIB_NAME.so ($(wc -c < \"$arm64_dest/$LIB_NAME.so\" | tr -d ' ') bytes)\"\n  verify_symbols \"$arm64_dest/$LIB_NAME.so\" -D\n}\n\nbuild_ios() {\n  echo \"\"\n  echo \"=== 编译 iOS (arm64 真机) ===\"\n  ensure_target aarch64-apple-ios\n\n  # 宿主测试继承macOS SDK；真机目标必须切到同一已供给Xcode的iphoneos SDK。\n  # xcrun只读定位已安装SDK，不下载，不改变全流程或宿主的SDKROOT。\n  local ios_sdk\n  ios_sdk=\"$(\"${XCRUN:-xcrun}\" --sdk iphoneos --show-sdk-path)\" || return 1\n  [[ \"$ios_sdk\" == /* && -d \"$ios_sdk\" ]] \\\n    || { echo \"错误: 已供给Xcode缺少iOS SDK\" >&2; return 1; }\n  cd \"$RUST_DIR\"\n  # 真机Cargo明确消费资源回执的Clang，不从PATH寻找cc或其它版本。\n  local ios_clang=\"${CC:?缺少已验真Xcode的Clang入口}\"\n  [[ \"$ios_clang\" == /* && -f \"$ios_clang\" && -x \"$ios_clang\" && ! -L \"$ios_clang\" ]] \\\n    || { echo \"错误: 缺少已供给Clang规范绝对入口\" >&2; return 1; }\n  SDKROOT=\"$ios_sdk\" CARGO_TARGET_AARCH64_APPLE_IOS_LINKER=\"$ios_clang\" \\\n    CC_aarch64_apple_ios=\"$ios_clang\" cargo build --release --target aarch64-apple-ios\n\n  # iOS 用**静态库**而非 dylib：裸 .dylib 需嵌入 + 单独签名，且 App Store 要求\n  # 动态库必须包在 .framework 里；静态库直接链进 App 二进制，无这些坑。\n  # 符号经 podspec 的 -force_load 保留，Dart 侧用 DynamicLibrary.process() 取。\n  local dest=\"${CITIZENWALLET_NATIVE_IOS_DIR:?缺少CitizenWallet iOS原生库目录}\"\n  mkdir -p \"$dest\"\n  cp \"$CARGO_TARGET_DIR/aarch64-apple-ios/release/$LIB_NAME.a\" \"$dest/\"\n  echo \"iOS arm64: $dest/$LIB_NAME.a ($(wc -c < \"$dest/$LIB_NAME.a\" | tr -d ' ') bytes)\"\n  verify_symbols \"$dest/$LIB_NAME.a\" \"\"\n}\n\nbuild_host() {\n  echo \"\"\n  echo \"=== 编译宿主平台动态库 (flutter test 用) ===\"\n  cd \"$RUST_DIR\"\n  # host 调试库给 Dart FFI / flutter test 直接 dlopen；release profile 已设\n  # strip=false，本机 dyld 不会报 LINKEDIT 对齐错误。\n  cargo build --release\n\n  # 宿主扩展名：macOS 产 .dylib，Linux 产 .so；Dart 侧 native_sr25519.dart 按同一规则取。\n  local host_ext\n  case \"$(uname -s)\" in\n    Darwin) host_ext=dylib ;;\n    *)      host_ext=so ;;\n  esac\n  local host_lib=\"$CARGO_TARGET_DIR/release/$LIB_NAME.$host_ext\"\n  echo \"宿主库: $host_lib ($(wc -c < \"$host_lib\" | tr -d ' ') bytes)\"\n  verify_symbols \"$host_lib\" -g\n}\n\ncase \"$TARGET\" in\n  android) build_android ;;\n  ios)     build_ios ;;\n  host|macos|linux) build_host ;;\n  verify-android-package)\n    [[ \"$#\" -eq 2 ]] || { echo \"用法: $0 verify-android-package <apk|aab>\"; exit 1; }\n    verify_android_package \"$2\"\n    exit 0\n    ;;\n  verify-ios-package)\n    [[ \"$#\" -eq 2 ]] || { echo \"用法: $0 verify-ios-package <Runner.app>\"; exit 1; }\n    verify_ios_package \"$2\"\n    exit 0\n    ;;\n  all)\n    build_android\n    build_ios\n    build_host\n    ;;\n  *)\n    echo \"用法: $0 [android|ios|macos|all|verify-android-package|verify-ios-package]\"\n    exit 1\n    ;;\nesac\n\necho \"\"\necho \"=== 编译完成 ===\"\necho \"flutter build / flutter run 会自动把 native library 打包进 App。\"\n","sync":"#!/usr/bin/env bash\n# 把 runtime 的 pallet_index / call_index 全量回写到冷钱包的 pallet_registry.dart。\n#\n# 名字→数字的映射永远以 citizenchain/runtime 为唯一真源。冷钱包离线签名，索引一旦\n# 与链端脱节，签出来的交易会被链上按另一个 pallet 解码——这类事故没有任何编译期信号。\n#\n# 本脚本是该同步逻辑的唯一实现。此前存在两份副本（build.mjs wallet 与\n# CitizenWallet 的 iOS/Android 独立 CI），且覆盖范围不同：本地同步 20 个 pallet，旧 CI 只同步 3 个。\n# 加 iOS job 会继续复制逻辑，因此收敛到这里；三个 CI 调用点与本地入口共用同一份全集。\n#\n# 用法：node scripts/build.mjs sync [仓库根目录]\n#   省略参数时使用所属产品源码根的父目录。\nset -euo pipefail\n\nREPO_ROOT=\"${1:-$(dirname \"${CITIZENWALLET_SOURCE_ROOT:?缺少所属产品源码根}\")}\"\nRUNTIME_LIB=\"$REPO_ROOT/citizenchain/runtime/src/lib.rs\"\nREGISTRY=\"$REPO_ROOT/citizenwallet/lib/signing/pallet_registry.dart\"\nTRANSFER_PALLET=\"$REPO_ROOT/citizenchain/runtime/transaction/multisig/src/lib.rs\"\nJOINT_VOTE_PALLET=\"$REPO_ROOT/citizenchain/runtime/votingengine/joint-vote/src/lib.rs\"\n\nfor required in \"$RUNTIME_LIB\" \"$REGISTRY\" \"$TRANSFER_PALLET\" \"$JOINT_VOTE_PALLET\"; do\n  [[ -f \"$required\" ]] || { echo \"缺少同步所需文件：$required\" >&2; exit 1; }\ndone\n\n# 全量按 pallet【名字】从 runtime construct_runtime! 抽取 pallet_index，逐一回写对应 Dart\n# 常量。必须覆盖 registry 里全部 pallet 常量——「只同步 3 个、其余手改」造成的半同步漂移\n# 正是改号事故的来源。\nsync_pallet() {\n  # $1 = runtime `pub type` 名称, $2 = Dart 常量名\n  local idx\n  idx=$(grep -B1 \"pub type $1 =\" \"$RUNTIME_LIB\" \\\n    | grep -o 'pallet_index([0-9]*)' | grep -o '[0-9]*')\n  [[ -n \"$idx\" ]] || { echo \"未找到 $1 pallet_index\" >&2; exit 1; }\n  sed -i '' -e \"s/${2} = [0-9]*/${2} = $idx/\" \"$REGISTRY\" 2>/dev/null \\\n    || sed -i -e \"s/${2} = [0-9]*/${2} = $idx/\" \"$REGISTRY\"\n  echo \"    $1 -> $2 = $idx\"\n}\n\n# call_index 稳定(D2 保留语义分带),只同步 runtime 里会漂移的 3 个业务 call。\nsync_call() {\n  # $1 = pallet 源文件, $2 = fn 名, $3 = Dart 常量名\n  local idx\n  idx=$(grep -B2 \"fn $2\" \"$1\" | grep -o 'call_index([0-9]*)' | grep -o '[0-9]*')\n  [[ -n \"$idx\" ]] || { echo \"未找到 $2 call_index\" >&2; exit 1; }\n  sed -i '' -e \"s/${3} = [0-9]*/${3} = $idx/\" \"$REGISTRY\" 2>/dev/null \\\n    || sed -i -e \"s/${3} = [0-9]*/${3} = $idx/\" \"$REGISTRY\"\n  echo \"    $2 -> $3 = $idx\"\n}\n\necho \"==> 同步 runtime pallet/call 索引...\"\n\n# 顺序无所谓，逐个按名同步(与 construct_runtime! 一一对应)。\nsync_pallet OnchainTransaction  onchainTransactionPallet\nsync_pallet VotingEngine        votingEnginePallet\nsync_pallet CitizenIdentity     citizenIdentityPallet\nsync_pallet InternalVote        internalVotePallet\nsync_pallet JointVote           jointVotePallet\nsync_pallet MultisigTransfer    multisigTransferPallet\nsync_pallet RuntimeUpgrade      runtimeUpgradePallet\nsync_pallet ResolutionDestroy   resolutionDestroPallet\nsync_pallet GrandpaKeyChange    grandpaKeyChangePallet\nsync_pallet ResolutionIssuance  resolutionIssuancePallet\nsync_pallet OnchainIssuance     onchainIssuancePallet\nsync_pallet LegislationYuan     legislationYuanPallet\nsync_pallet LegislationVote     legislationVotePallet\nsync_pallet OffchainTransaction offchainTransactionPallet\nsync_pallet PersonalManage      personalManagePallet\nsync_pallet PersonalAdmins      personalAdminsPallet\nsync_pallet PublicAdmins        publicAdminsPallet\nsync_pallet PrivateAdmins       privateAdminsPallet\nsync_pallet PublicManage        publicManagePallet\nsync_pallet PrivateManage       privateManagePallet\n\nsync_call \"$TRANSFER_PALLET\"   propose_transfer  proposeTransferCall\n# 联合投票内部投票阶段:JointVote::cast_admin\nsync_call \"$JOINT_VOTE_PALLET\" cast_admin        jointVoteCall\n# 联合公投阶段:JointVote::cast_referendum\nsync_call \"$JOINT_VOTE_PALLET\" cast_referendum   castReferendumCall\n"});

export async function runEmbeddedBuild(command,args,environment=process.env,cwd=process.cwd(),options={}) {
 const work=environment.CITIZENWALLET_WORK_DIR||environment.PRODUCT_WORK_DIR||temporaryRoot(undefined,'build');checkWork(work);
 return withFixedWork(taskScope(work),()=>embeddedBuildTask(command,args,{...environment,CITIZENWALLET_WORK_DIR:work},cwd,options),{environment});
}
async function embeddedBuildTask(command,args,environment=process.env,cwd=process.cwd(),options={}) {
 if(!Object.hasOwn(BUILD_SHELL_SOURCES,command))fail('未知构建子步骤');
 const requested=String(args[0]||'').replace(/^prepare-/, '').replace(/^verify-/, '').replace(/-package$/, '');
 const platform=Object.hasOwn(contract.platforms,requested)?requested:Object.keys(contract.platforms)[0];
 const shell=environment.PRODUCT_BASH_BIN||environment.PRODUCT_TEST_SHELL||'/bin/bash';
 const directory=join(environment.CITIZENWALLET_WORK_DIR,'embedded');mkdirSync(directory,{recursive:true});
 const script=join(directory,'implementation.sh');
 const state=executions.getStore()||{};
 return executions.run(state,async()=>{
  try {
   writeFileSync(script,BUILD_SHELL_SOURCES[command],{flag:'wx',mode:0o700});
   return await runBuildProcess(shell,[script,...args],{...environment,
    CITIZENWALLET_SOURCE_ROOT:root,PRODUCT_NODE_BIN:environment.PRODUCT_NODE_BIN||environment.NODE||process.execPath},cwd,options);
  } finally {if(!state.unconfirmed)rmSync(directory,{recursive:true,force:true});}
 });
}

export async function prepare(platform,work,receipt,base) {
 const env=resourceEnvironment(platform,work,receipt,base),source=root;
 for(const name of ['work','tmp','cache','config','dependencies','stage'])mkdirSync(join(work,name),{recursive:true,mode:0o700});
 await checkArchives(platform,work,receipt);
 createView(source,env[prefix+'_PROJECT_ROOT'],work);
 generatePlatformIcons(env[prefix+'_PROJECT_ROOT'],platform);
 if(platform==='android'){
  prepareAndroidProjectInputs(work,env);
  const project=env[prefix+'_PROJECT_ROOT'];
  await run(env.FLUTTER,['config','--build-dir='+relative(project,env.BUILD_DIR)],env,project);
  // Pub原件已供给；这里只离线生成当前工程插件清单，供第二轮Maven资源解析使用。
  await run(env.FLUTTER,['pub','get','--offline','--enforce-lockfile'],env,project);
 }
 return {schema:1,product_id:product,platform,work};
}

// 只恢复本轮隔离HOME中的自动签名可见性；不导出私钥、不改宿主搜索列表、不生成身份。
export async function prepareIOSSigningHome(work,env,base) {
 checkWork(work);if(typeof base?.HOME!=='string'||!isAbsolute(base.HOME)||realpathSync(base.HOME)!==base.HOME||inside(join(root,'target'),base.HOME))fail('iOS签名宿主HOME无效');
 const call=(args,environment=env)=>runBuildProcess(env.SECURITY,args,environment,work,{capture:true,timeout:60000});
 const response=await call(['list-keychains','-d','user'],{...env,HOME:base.HOME,USERPROFILE:base.HOME});
 const keychains=[...response.stdout.matchAll(/^\s*"([^"\r\n]+)"\s*$/gmu)].map(m=>m[1]);
 if(!keychains.length||keychains.some(p=>!isAbsolute(p)||resolve(p)!==p||realpathSync(p)!==p||!lstatSync(p).isFile()))fail('既有签名钥匙串边界无效');
 mkdirSync(join(work,'Library/Preferences'),{recursive:true,mode:0o700});await call(['list-keychains','-d','user','-s',...keychains]);
 const verifier=await nativeVerifier(work,env),project=join(env.CITIZENWALLET_PROJECT_ROOT,'ios/project/Runner.pbxproj');
 const request={operation:'ios.signing-home',work,home:base.HOME,project},identity=await verifier(request);
 const valid=(await call(['find-identity','-v','-p','codesigning'])).stdout;
 const fingerprints=new Set([...valid.matchAll(/^\s*\d+\) ([A-F0-9]{40}) "Apple Development:[^"\r\n]*"\s*$/gmu)].map(m=>m[1]));
 const pem=(await call(['find-certificate','-a','-p'])).stdout;
 const certificates=new Map();for(const text of pem.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/gu)||[]){const certificate=new X509Certificate(text);if(fingerprints.has(certificate.fingerprint.replaceAll(':',''))&&certificate.subject.split('\n').includes('OU='+identity.team))certificates.set(certificate.fingerprint,certificate);}
 if(certificates.size!==1)fail('钱包团队有效Apple Development身份必须唯一，禁止另选或生成');
 const certificate=[...certificates.values()][0];await verifier({...request,certificate:certificate.raw.toString('base64')});
 const state=executions.getStore();if(state)state.iosSigningCertificate=certificate.raw.toString('base64');
}

export async function build(platform,work,receipt,base) {
 const env=resourceEnvironment(platform,work,receipt,base),declared=platformContract(platform);
 await checkArchives(platform,work,receipt,true);
 const shell=receipt.tools.bash?.path;
 if(!shell)fail('缺少显式Shell资源');
 const project=env[prefix+'_PROJECT_ROOT'];
 if(platform==='ios')await prepareIOSSigningHome(work,env,base);

  // 钱包只使用本仓锁与本仓签名库，两个平台各自完整执行产品测试及Release候选编译。
  await runEmbeddedBuild('wallet',[platform],{...env,PRODUCT_BASH_BIN:shell},project);

 return completeBuild(platform,work,receipt,env);
}

// 产品自有Security.framework验真器源码，只在本轮工作目录编译。
export const IOS_VERIFIER_SOURCE=[
 "import Foundation",
 "import Security",
 "import CryptoKit",
 "import Darwin",
 "struct SecurityFailure: Error { let message: String }",
 "enum ProductFileIdentity {",
 " static func identity(_ url: URL, directory: Bool) throws -> [UInt64] {",
 "  guard url.path == url.standardizedFileURL.path, url.path == url.resolvingSymlinksInPath().path else { throw SecurityFailure(message: \"产品路径经过链接\") }",
 "  var info = stat()",
 "  guard lstat(url.path, &info) == 0, (info.st_mode & S_IFMT) == (directory ? S_IFDIR : S_IFREG), directory || info.st_nlink == 1 else { throw SecurityFailure(message: \"产品路径类型或链接无效\") }",
 "  return [UInt64(info.st_dev),UInt64(info.st_ino)]",
 " }",
 "}",
 "enum ProductIOSContract {",
 "    static func iosReleaseSettings(_ project: [String: Any]) throws -> [String: Any] {",
 "        guard let objects = project[\"objects\"] as? [String: [String: Any]],",
 "              let rootID = project[\"rootObject\"] as? String, let root = objects[rootID],",
 "              let targets = root[\"targets\"] as? [String] else { throw SecurityFailure(message: \"iOS 工程结构无效\") }",
 "        func settings(_ object: [String: Any]) throws -> [String: Any] {",
 "            guard let listID = object[\"buildConfigurationList\"] as? String,",
 "                  let ids = objects[listID]?[\"buildConfigurations\"] as? [String] else {",
 "                throw SecurityFailure(message: \"iOS 工程缺少 Release 配置\")",
 "            }",
 "            let release = ids.compactMap { objects[$0] }.filter { $0[\"name\"] as? String == \"Release\" }",
 "            guard release.count == 1, let values = release[0][\"buildSettings\"] as? [String: Any] else {",
 "                throw SecurityFailure(message: \"iOS 工程 Release 配置不唯一\")",
 "            }",
 "            return values",
 "        }",
 "        let applications = targets.compactMap { objects[$0] }.filter {",
 "            $0[\"name\"] as? String == \"Runner\" && $0[\"productType\"] as? String == \"com.apple.product-type.application\"",
 "        }",
 "        guard applications.count == 1 else { throw SecurityFailure(message: \"iOS Runner 产品目标缺失或不唯一\") }",
 "        return try settings(root).merging(settings(applications[0])) { _, target in target }",
 "    }",
 "",
 "    static func iosVersion(_ value: String) throws -> [UInt64] {",
 "        guard value.range(of: \"^[0-9]+(?:\\\\.[0-9]+){0,2}$\", options: .regularExpression) != nil else {",
 "            throw SecurityFailure(message: \"iOS 应用版本格式无效\")",
 "        }",
 "        let parts = value.split(separator: \".\").compactMap { UInt64($0) }",
 "        guard parts.count == value.split(separator: \".\").count else { throw SecurityFailure(message: \"iOS 应用版本超出范围\") }",
 "        return parts + Array(repeating: 0, count: 3 - parts.count)",
 "    }",
 "",
 "    static func iosEntitlements(profile: [String: Any], team: String, bundleID: String,",
 "                                device: String, requested: [String: Any], now: Date) throws -> [String: Any] {",
 "        guard profile[\"TeamIdentifier\"] as? [String] == [team],",
 "              let prefixes = profile[\"ApplicationIdentifierPrefix\"] as? [String], prefixes.count == 1,",
 "              prefixes[0].range(of: \"^[A-Z0-9]{10}$\", options: .regularExpression) != nil,",
 "              let expiry = profile[\"ExpirationDate\"] as? Date, expiry > now,",
 "              let creation = profile[\"CreationDate\"] as? Date, creation <= now,",
 "              (profile[\"Platform\"] as? [String])?.contains(\"iOS\") == true,",
 "              (profile[\"ProvisionedDevices\"] as? [String])?.contains(device) == true,",
 "              let allowed = profile[\"Entitlements\"] as? [String: Any] else {",
 "            throw SecurityFailure(message: \"iOS profile 的团队、期限、平台或设备不匹配\")",
 "        }",
 "        let prefix = prefixes[0] + \".\"",
 "        let applicationID = prefix + bundleID",
 "        func resolve(_ value: Any) throws -> Any {",
 "            if let string = value as? String {",
 "                if string == \"$(APS_ENVIRONMENT)\",",
 "                   let aps = allowed[\"aps-environment\"] as? String,",
 "                   [\"development\", \"production\"].contains(aps) { return aps }",
 "                let resolved = string.replacingOccurrences(of: \"$(AppIdentifierPrefix)\", with: prefix)",
 "                    .replacingOccurrences(of: \"$(TeamIdentifierPrefix)\", with: team + \".\")",
 "                    .replacingOccurrences(of: \"$(PRODUCT_BUNDLE_IDENTIFIER)\", with: bundleID)",
 "                guard !resolved.contains(\"$(\"), !resolved.contains(\"${\") else {",
 "                    throw SecurityFailure(message: \"iOS entitlement 存在未解析的工程变量\")",
 "                }",
 "                return resolved",
 "            }",
 "            if let array = value as? [Any] { return try array.map(resolve) }",
 "            if let object = value as? [String: Any] { return try object.mapValues(resolve) }",
 "            return value",
 "        }",
 "        var entitlements = try requested.mapValues(resolve)",
 "        for (key, value) in [\"application-identifier\": applicationID, \"com.apple.developer.team-identifier\": team] {",
 "            if let existing = entitlements[key] {",
 "                guard let existing = existing as? String, existing == value else {",
 "                    throw SecurityFailure(message: \"iOS entitlement 产品身份不一致或类型无效\")",
 "                }",
 "            }",
 "            entitlements[key] = value",
 "        }",
 "        guard entitlements[\"get-task-allow\"] as? Bool != true else {",
 "            throw SecurityFailure(message: \"iOS Release 候选禁止调试权限\")",
 "        }",
 "        // Local device installation uses the profile's own signing class. An",
 "        // Apple Development profile requires this grant; distribution profiles",
 "        // keep it false. Product entitlements still cannot request it directly.",
 "        entitlements[\"get-task-allow\"] = allowed[\"get-task-allow\"] as? Bool == true",
 "        func permits(_ permitted: Any, _ actual: Any) -> Bool {",
 "            if let pattern = permitted as? String, let value = actual as? String {",
 "                if pattern.hasSuffix(\"*\"), !pattern.dropLast().contains(\"*\") { return value.hasPrefix(String(pattern.dropLast())) }",
 "                return pattern == value",
 "            }",
 "            if let permittedArray = permitted as? [Any], let actualArray = actual as? [Any] {",
 "                return actualArray.allSatisfy { entry in permittedArray.contains { permits($0, entry) } }",
 "            }",
 "            if let permittedObject = permitted as? [String: Any], let actualObject = actual as? [String: Any] {",
 "                return actualObject.allSatisfy { key, value in permittedObject[key].map { permits($0, value) } ?? false }",
 "            }",
 "            if let a = actual as? NSNumber, let p = permitted as? NSNumber,",
 "               CFGetTypeID(a) == CFBooleanGetTypeID(), CFGetTypeID(p) == CFBooleanGetTypeID() {",
 "                return !a.boolValue || p.boolValue",
 "            }",
 "            return (permitted as? NSObject)?.isEqual(actual) == true",
 "        }",
 "        // Profile 是授权上限，不将未请求的能力整份授予应用。",
 "        for (key, value) in entitlements {",
 "            guard let permitted = allowed[key], permits(permitted, value) else {",
 "                throw SecurityFailure(message: \"iOS profile 未授权工程请求的 entitlement\")",
 "            }",
 "        }",
 "        return entitlements",
 "    }",
 "",
 "    static func iosSignedEntitlementsMatch(_ actual: [String: Any], expected: [String: Any]) -> Bool {",
 "        var normalized = actual",
 "        // Security.framework synthesizes these aliases even when codesign receives",
 "        // only the canonical entitlement. Accept exact duplicates only; all other",
 "        // extra capabilities or value drift remain fatal.",
 "        for (aliasKey, canonicalKey) in [",
 "            (\"com.apple.application-identifier\", \"application-identifier\"),",
 "            (\"com.apple.developer.aps-environment\", \"aps-environment\"),",
 "        ] {",
 "            if let alias = normalized.removeValue(forKey: aliasKey) {",
 "                guard let canonical = normalized[canonicalKey],",
 "                      NSDictionary(object: alias, forKey: \"value\" as NSString)",
 "                        .isEqual(to: [\"value\": canonical]) else { return false }",
 "            }",
 "        }",
 "        return NSDictionary(dictionary: normalized).isEqual(to: expected)",
 "    }",
 "}",
 "",
 "struct ProductVerifier {",
 " private let fileManager = FileManager.default",
 "    private func appleRoots() throws -> [SecCertificate] {",
 "        // 仅从只读系统根钥匙串取 Apple 根，不接受用户添加的同名根证书。",
 "        var keychain: SecKeychain?",
 "        guard SecKeychainOpen(\"/System/Library/Keychains/SystemRootCertificates.keychain\", &keychain) == errSecSuccess, let keychain else {",
 "            throw SecurityFailure(message: \"无法读取 Apple 系统信任根\")",
 "        }",
 "        var result: CFTypeRef?",
 "        let query: [String: Any] = [kSecClass as String: kSecClassCertificate,",
 "            kSecMatchSearchList as String: [keychain], kSecMatchLimit as String: kSecMatchLimitAll,",
 "            kSecReturnRef as String: true]",
 "        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess, let certificates = result as? [SecCertificate] else {",
 "            throw SecurityFailure(message: \"Apple 系统信任根不可用\")",
 "        }",
 "        let roots = certificates.filter {",
 "            [\"Apple Root CA\", \"Apple Root CA - G2\", \"Apple Root CA - G3\"].contains(SecCertificateCopySubjectSummary($0) as String? ?? \"\")",
 "        }",
 "        guard !roots.isEmpty else { throw SecurityFailure(message: \"缺少 Apple 系统信任根\") }",
 "        return roots",
 "    }",
 "",
 "    private func decodeIOSProfile(_ data: Data, roots: [SecCertificate]) throws -> [String: Any] {",
 "        guard !data.isEmpty, data.count <= 16 * 1024 * 1024 else { throw SecurityFailure(message: \"iOS profile 大小无效\") }",
 "        var decoder: CMSDecoder?",
 "        guard CMSDecoderCreate(&decoder) == errSecSuccess, let decoder else { throw SecurityFailure(message: \"无法创建 CMS 验证器\") }",
 "        let updated = data.withUnsafeBytes { CMSDecoderUpdateMessage(decoder, $0.baseAddress!, $0.count) }",
 "        var count = 0",
 "        guard updated == errSecSuccess, CMSDecoderFinalizeMessage(decoder) == errSecSuccess,",
 "              CMSDecoderGetNumSigners(decoder, &count) == errSecSuccess, count == 1 else {",
 "            throw SecurityFailure(message: \"iOS profile CMS 签名结构无效\")",
 "        }",
 "        var status = CMSSignerStatus(rawValue: 0)!",
 "        var trust: SecTrust?",
 "        var result: OSStatus = errSecSuccess",
 "        guard CMSDecoderCopySignerStatus(decoder, 0, SecPolicyCreateBasicX509(), false, &status, &trust, &result) == errSecSuccess,",
 "              status == .valid, let trust,",
 "              SecTrustSetAnchorCertificates(trust, roots as CFArray) == errSecSuccess,",
 "              SecTrustSetAnchorCertificatesOnly(trust, true) == errSecSuccess,",
 "              SecTrustSetNetworkFetchAllowed(trust, false) == errSecSuccess,",
 "              SecTrustEvaluateWithError(trust, nil),",
 "              let chain = SecTrustCopyCertificateChain(trust) as? [SecCertificate], chain.count == 3,",
 "              SecCertificateCopySubjectSummary(chain[0]) as String? == \"Apple iPhone OS Provisioning Profile Signing\",",
 "              SecCertificateCopySubjectSummary(chain[1]) as String? == \"Apple iPhone Certification Authority\" else {",
 "            throw SecurityFailure(message: \"iOS profile 不是有效的 Apple 签名授权\")",
 "        }",
 "        var content: CFData?",
 "        guard CMSDecoderCopyContent(decoder, &content) == errSecSuccess, let content,",
 "              let profile = try PropertyListSerialization.propertyList(from: content as Data, format: nil) as? [String: Any] else {",
 "            throw SecurityFailure(message: \"iOS profile 内容无效\")",
 "        }",
 "        return profile",
 "    }",
 "",
 "    private func iosTree(_ app: URL) throws -> [URL] {",
 "        _ = try ProductFileIdentity.identity(app, directory: true)",
 "        var enumerationFailed = false",
 "        guard let enumerator = fileManager.enumerator(at: app, includingPropertiesForKeys: [.isDirectoryKey], errorHandler: { _, _ in",
 "            enumerationFailed = true",
 "            return false",
 "        }) else {",
 "            throw SecurityFailure(message: \"无法读取 iOS 应用内容\")",
 "        }",
 "        var urls: [URL] = []",
 "        for case let url as URL in enumerator {",
 "            let directory = try url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory == true",
 "            _ = try ProductFileIdentity.identity(url, directory: directory)",
 "            urls.append(url)",
 "            guard urls.count <= 100_000 else { throw SecurityFailure(message: \"iOS 应用内容数量异常\") }",
 "        }",
 "        guard !enumerationFailed else { throw SecurityFailure(message: \"iOS 应用目录枚举失败，禁止使用不完整内容\") }",
 "        return urls.sorted { $0.path < $1.path }",
 "    }",
 "",
 "    private func iosTreeDigest(_ app: URL) throws -> String {",
 "        var hash = SHA256()",
 "        for url in try iosTree(app) {",
 "            hash.update(data: Data(url.path.dropFirst(app.path.count).utf8))",
 "            hash.update(data: Data([0]))",
 "            if try url.resourceValues(forKeys: [.isRegularFileKey]).isRegularFile == true {",
 "                hash.update(data: try Data(contentsOf: url, options: .mappedIfSafe))",
 "            }",
 "        }",
 "        return hash.finalize().map { String(format: \"%02x\", $0) }.joined()",
 "    }",
 "",
 "    private func iosInfo(_ app: URL, bundleID: String) throws -> (version: String, build: String) {",
 "        let url = app.appendingPathComponent(\"Info.plist\")",
 "        _ = try ProductFileIdentity.identity(url, directory: false)",
 "        guard let info = try PropertyListSerialization.propertyList(from: Data(contentsOf: url), format: nil) as? [String: Any],",
 "              info[\"CFBundleIdentifier\"] as? String == bundleID,",
 "              info[\"CFBundlePackageType\"] as? String == \"APPL\",",
 "              (info[\"CFBundleSupportedPlatforms\"] as? [String])?.contains(\"iPhoneOS\") == true,",
 "              let executable = info[\"CFBundleExecutable\"] as? String, !executable.isEmpty,",
 "              !executable.contains(\"/\"), executable != \".\", executable != \"..\",",
 "              let version = info[\"CFBundleShortVersionString\"] as? String,",
 "              let build = info[\"CFBundleVersion\"] as? String else {",
 "            throw SecurityFailure(message: \"iOS 候选产品、平台或版本身份无效\")",
 "        }",
 "        _ = try ProductFileIdentity.identity(app.appendingPathComponent(executable), directory: false)",
 "        _ = try ProductIOSContract.iosVersion(version)",
 "        _ = try ProductIOSContract.iosVersion(build)",
 "        return (version, build)",
 "    }",
 "",
 "    private func iosCodeInformation(_ url: URL) throws -> [String: Any] {",
 "        var code: SecStaticCode?",
 "        guard SecStaticCodeCreateWithPath(url as CFURL, [], &code) == errSecSuccess, let code,",
 "              SecStaticCodeCheckValidity(code, SecCSFlags(rawValue: kSecCSStrictValidate | kSecCSCheckAllArchitectures), nil) == errSecSuccess else {",
 "            throw SecurityFailure(message: \"iOS 签名严格验证失败\")",
 "        }",
 "        var information: CFDictionary?",
 "        guard SecCodeCopySigningInformation(code, SecCSFlags(rawValue: kSecCSSigningInformation), &information) == errSecSuccess,",
 "              let information = information as? [String: Any] else {",
 "            throw SecurityFailure(message: \"iOS 签名信息无法读取\")",
 "        }",
 "        return information",
 "    }",
 "",
 "    private func validateIOSCode(_ url: URL, team: String, certificate: Data,",
 "                                 entitlements: [String: Any]? = nil) throws {",
 "        let information = try iosCodeInformation(url)",
 "        guard",
 "              information[kSecCodeInfoTeamIdentifier as String] as? String == team,",
 "              let certificates = information[kSecCodeInfoCertificates as String] as? [SecCertificate], let leaf = certificates.first,",
 "              SecCertificateCopyData(leaf) as Data == certificate else {",
 "            throw SecurityFailure(message: \"iOS 产品签名团队或证书不一致\")",
 "        }",
 "        if let entitlements {",
 "            guard let actual = information[kSecCodeInfoEntitlementsDict as String] as? [String: Any],",
 "                  ProductIOSContract.iosSignedEntitlementsMatch(actual, expected: entitlements) else {",
 "                throw SecurityFailure(message: \"iOS 产品签名 entitlement 与工程授权不一致\")",
 "            }",
 "        }",
 "    }",
 "",
 "    /// 产品Build已经完成签名；产品验证内嵌profile、证书链与实际代码签名，不读取签名私钥。",
 "    private func iosProductSigning(_ app: URL, team: String, bundleID: String, device: String,",
 "                                   requested: [String: Any]) throws -> (certificate: Data, entitlements: [String: Any]) {",
 "        let roots = try appleRoots()",
 "        let profileURL = app.appendingPathComponent(\"embedded.mobileprovision\")",
 "        _ = try ProductFileIdentity.identity(profileURL, directory: false)",
 "        let profileData = try Data(contentsOf: profileURL)",
 "        let profile = try decodeIOSProfile(profileData, roots: roots)",
 "        let entitlements = try ProductIOSContract.iosEntitlements(",
 "            profile: profile, team: team, bundleID: bundleID, device: device,",
 "            requested: requested, now: Date())",
 "        let information = try iosCodeInformation(app)",
 "        guard information[kSecCodeInfoTeamIdentifier as String] as? String == team,",
 "              let certificates = information[kSecCodeInfoCertificates as String] as? [SecCertificate],",
 "              let leaf = certificates.first,",
 "              let allowed = profile[\"DeveloperCertificates\"] as? [Data],",
 "              allowed.contains(SecCertificateCopyData(leaf) as Data),",
 "              let actual = information[kSecCodeInfoEntitlementsDict as String] as? [String: Any],",
 "              ProductIOSContract.iosSignedEntitlementsMatch(actual, expected: entitlements) else {",
 "            throw SecurityFailure(message: \"iOS 产品签名与内嵌 profile 不一致\")",
 "        }",
 "        var trust: SecTrust?",
 "        guard let policy = SecPolicyCreateWithProperties(kSecPolicyAppleCodeSigning, nil),",
 "              SecTrustCreateWithCertificates(certificates as CFArray, policy, &trust) == errSecSuccess,",
 "              let trust,",
 "              SecTrustSetAnchorCertificates(trust, roots as CFArray) == errSecSuccess,",
 "              SecTrustSetAnchorCertificatesOnly(trust, true) == errSecSuccess,",
 "              SecTrustSetNetworkFetchAllowed(trust, false) == errSecSuccess,",
 "              SecTrustEvaluateWithError(trust, nil) else {",
 "            throw SecurityFailure(message: \"iOS 产品签名证书链无效\")",
 "        }",
 "        return (SecCertificateCopyData(leaf) as Data, entitlements)",
 "    }",
 "",
 "",
 " func signingHome(work: URL, home: URL, project: URL, certificate: Data?) throws -> [String: Any] {",
 "  _ = try ProductFileIdentity.identity(work, directory: true)",
 "  _ = try ProductFileIdentity.identity(home, directory: true)",
 "  _ = try ProductFileIdentity.identity(project, directory: false)",
 "  guard let objects = try PropertyListSerialization.propertyList(from: Data(contentsOf: project), format: nil) as? [String: Any] else { throw SecurityFailure(message: \"产品工程无效\") }",
 "  let settings = try ProductIOSContract.iosReleaseSettings(objects)",
 "  guard let team = settings[\"DEVELOPMENT_TEAM\"] as? String, let bundle = settings[\"PRODUCT_BUNDLE_IDENTIFIER\"] as? String,",
 "        team.range(of: \"^[A-Z0-9]{10}$\", options: .regularExpression) != nil,",
 "        bundle.range(of: \"^[A-Za-z0-9-]+(?:\\\\.[A-Za-z0-9-]+)+$\", options: .regularExpression) != nil else { throw SecurityFailure(message: \"产品签名身份无效\") }",
 "  guard let certificate else { return [\"team\": team] }",
 "  let roots = try appleRoots(), destination = work.appendingPathComponent(\"Library/Developer/Xcode/UserData/Provisioning Profiles\")",
 "  try fileManager.createDirectory(at: destination, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])",
 "  let folders = [\"Library/Developer/Xcode/UserData/Provisioning Profiles\", \"Library/MobileDevice/Provisioning Profiles\"]",
 "  var installed = Set<String>(), application = false",
 "  for folder in folders {",
 "   let directory = home.appendingPathComponent(folder)",
 "   guard fileManager.fileExists(atPath: directory.path) else { continue }",
 "   _ = try ProductFileIdentity.identity(directory, directory: true)",
 "   for url in try fileManager.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil).filter({ $0.pathExtension == \"mobileprovision\" }) {",
 "    _ = try ProductFileIdentity.identity(url, directory: false)",
 "    let bytes = try Data(contentsOf: url)",
 "    guard let profile = try? decodeIOSProfile(bytes, roots: roots),",
 "          let expires = profile[\"ExpirationDate\"] as? Date, expires > Date(),",
 "          profile[\"TeamIdentifier\"] as? [String] == [team],",
 "          let entitlements = profile[\"Entitlements\"] as? [String: Any],",
 "          entitlements[\"com.apple.developer.team-identifier\"] as? String == team,",
 "          entitlements[\"get-task-allow\"] as? Bool == true,",
 "          let allowed = profile[\"DeveloperCertificates\"] as? [Data], allowed.contains(certificate),",
 "          let identifier = entitlements[\"application-identifier\"] as? String,",
 "          let uuid = profile[\"UUID\"] as? String, UUID(uuidString: uuid) != nil else { continue }",
 "    let targets = [bundle, bundle + \".RunnerTests\", bundle + \".RunnerUITests\", bundle + \".RunnerUITests.xctrunner\"]",
 "    func matches(_ target: String) -> Bool {",
 "     let expected = team + \".\" + target",
 "     return identifier == expected || identifier.hasSuffix(\".*\") && expected.hasPrefix(String(identifier.dropLast()))",
 "    }",
 "    guard targets.contains(where: matches) else { continue }",
 "    if matches(bundle) { application = true }",
 "    if installed.insert(uuid).inserted {",
 "     let output = destination.appendingPathComponent(uuid + \".mobileprovision\")",
 "     guard !fileManager.fileExists(atPath: output.path) else { throw SecurityFailure(message: \"本轮profile路径已存在\") }",
 "     try bytes.write(to: output, options: .withoutOverwriting)",
 "     try fileManager.setAttributes([.posixPermissions: 0o600], ofItemAtPath: output.path)",
 "    }",
 "   }",
 "  }",
 "  guard application else { throw SecurityFailure(message: \"既有唯一开发身份没有有效钱包授权profile\") }",
 "  return [\"ready\": true]",
 " }",
 " func verify(app: URL, project: URL, device: String, certificate: Data? = nil) throws -> [String: Any] {",
 "  _ = try ProductFileIdentity.identity(project, directory: false)",
 "  guard let objects = try PropertyListSerialization.propertyList(from: Data(contentsOf: project), format: nil) as? [String: Any] else { throw SecurityFailure(message: \"产品工程无效\") }",
 "  let settings = try ProductIOSContract.iosReleaseSettings(objects)",
 "  guard let bundle = settings[\"PRODUCT_BUNDLE_IDENTIFIER\"] as? String, let team = settings[\"DEVELOPMENT_TEAM\"] as? String,",
 "        bundle.range(of: \"^[A-Za-z0-9-]+(?:\\\\.[A-Za-z0-9-]+)+$\", options: .regularExpression) != nil,",
 "        team.range(of: \"^[A-Z0-9]{10}$\", options: .regularExpression) != nil else { throw SecurityFailure(message: \"产品签名身份无效\") }",
 "  var requested: [String: Any] = [:]",
 "  if let path = settings[\"CODE_SIGN_ENTITLEMENTS\"] as? String, !path.isEmpty {",
 "   guard !path.hasPrefix(\"/\"), !path.split(separator: \"/\").contains(\"..\"), !path.contains(\"$\") else { throw SecurityFailure(message: \"产品entitlement路径无效\") }",
 "   let base = project.pathExtension == \"pbxproj\" && project.deletingLastPathComponent().pathExtension == \"xcodeproj\" ? project.deletingLastPathComponent().deletingLastPathComponent() : project.deletingLastPathComponent()",
 "   let url = base.appendingPathComponent(path); _ = try ProductFileIdentity.identity(url, directory: false)",
 "   guard let values = try PropertyListSerialization.propertyList(from: Data(contentsOf: url), format: nil) as? [String: Any] else { throw SecurityFailure(message: \"产品entitlement无效\") }; requested = values",
 "  }",
 "  let version = try iosInfo(app, bundleID: bundle), tree = try iosTree(app)",
 "  guard !tree.contains(where: { [\"appex\",\"app\",\"xpc\"].contains($0.pathExtension) }) else { throw SecurityFailure(message: \"嵌套应用缺少独立签名声明\") }",
 "  let signing = try iosProductSigning(app, team: team, bundleID: bundle, device: device, requested: requested)",
 "  if let certificate, certificate != signing.certificate { throw SecurityFailure(message: \"编译签名身份与本轮唯一开发身份不一致\") }",
 "  for code in tree.filter({ [\"framework\",\"dylib\"].contains($0.pathExtension) }) { try validateIOSCode(code, team: team, certificate: signing.certificate) }",
 "  try validateIOSCode(app, team: team, certificate: signing.certificate, entitlements: signing.entitlements)",
 "  guard try iosInfo(app, bundleID: bundle) == version else { throw SecurityFailure(message: \"产品版本漂移\") }",
 "  return [\"version\":version.version,\"build\":version.build,\"bundle_id\":bundle,\"team\":team,\"sha256\":try iosTreeDigest(app)]",
 " }",
 "}",
 "// 独立执行使用产品自己的安全存储；调用方可用专用宿主通道提供等价开发材料能力。",
 "func development(_ product: String, value: Data?) throws -> Data? {",
 " let service = product + \" Development\", account = \"development:DEV_KEY\"",
 " let query: [String: Any] = [kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:service,kSecAttrAccount as String:account]",
 " func read() throws -> Data? { var output: CFTypeRef?; let status = SecItemCopyMatching(query.merging([kSecReturnData as String:true]) {_,v in v} as CFDictionary,&output)",
 "  if status == errSecItemNotFound { return nil }; guard status == errSecSuccess, let data = output as? Data else { throw SecurityFailure(message: \"产品开发材料读取失败\") }; return data }",
 " if let current = try read() { return current }",
 " guard let value else { return nil }",
 " let status = SecItemAdd(query.merging([kSecValueData as String:value,kSecAttrAccessible as String:kSecAttrAccessibleWhenUnlockedThisDeviceOnly]) {_,v in v} as CFDictionary,nil)",
 " guard status == errSecSuccess || status == errSecDuplicateItem else { throw SecurityFailure(message: \"产品开发材料存储失败\") }",
 " guard let stored = try read() else { throw SecurityFailure(message: \"产品开发材料写后回读缺失\") }; return stored",
 "}",
 "do {",
 " let bytes = FileHandle.standardInput.readDataToEndOfFile()",
 " guard bytes.count <= 128 * 1024, let request = try JSONSerialization.jsonObject(with: bytes) as? [String:Any], let operation = request[\"operation\"] as? String else { throw SecurityFailure(message: \"产品安全输入无效\") }",
 " let result: Any",
 " if operation == \"ios.signing-home\", let work = request[\"work\"] as? String, let home = request[\"home\"] as? String, let project = request[\"project\"] as? String {",
 "  result = try ProductVerifier().signingHome(work: URL(fileURLWithPath: work), home: URL(fileURLWithPath: home), project: URL(fileURLWithPath: project), certificate: (request[\"certificate\"] as? String).flatMap { Data(base64Encoded: $0) })",
 " } else if operation == \"ios.verify\", let app = request[\"app\"] as? String, let project = request[\"project\"] as? String, let device = request[\"device\"] as? String {",
 "  result = try ProductVerifier().verify(app: URL(fileURLWithPath:app),project:URL(fileURLWithPath:project),device:device,certificate:(request[\"certificate\"] as? String).flatMap { Data(base64Encoded:$0) })",
 " } else if [\"development.read\",\"development.create\"].contains(operation), let product = request[\"product_id\"] as? String, product.range(of:\"^[a-z][a-z0-9-]*$\",options:.regularExpression) != nil {",
 "  var value = (request[\"value\"] as? String).flatMap { Data(base64Encoded:$0) }; defer { if var bytes = value { bytes.resetBytes(in:0..<bytes.count) }; value = nil }",
 "  guard operation != \"development.create\" || value != nil else { throw SecurityFailure(message:\"开发材料缺失\") }",
 "  var stored = try development(product,value:value); defer { if var bytes = stored { bytes.resetBytes(in:0..<bytes.count) }; stored = nil }",
 "  result = [\"value\":stored?.base64EncodedString() as Any? ?? NSNull()]",
 " } else { throw SecurityFailure(message:\"产品安全操作未声明\") }",
 " // JSON按字段名固定排序，安装前后全字段比较不受Dictionary跨进程顺序影响。",
 " FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject:result, options: [.sortedKeys]))",
 "} catch {",
 " // 不输出Security错误上下文、请求或材料；调用方只取得失败事实。",
 " FileHandle.standardError.write(Data(\"产品安全验真失败\\n\".utf8)); exit(1)",
 "}"
].join('\n');

// 包标识来自本产品唯一原始Android配置，不从调用方登记或另一端推导。
// 商店身份属于本产品：只读原始Release工程，不依赖控制台、发布声明或外部工具。
function storePath(base,name) {
 if(typeof base!=='string'||!isAbsolute(base)||resolve(base)!==base||realpathSync(base)!==base)fail('商店身份源码根不是准确物理目录');
 if(typeof name!=='string'||!name||name.includes('\\')||/[\x00-\x1f\x7f]/u.test(name)||name.split('/').some(v=>!v||v==='.'||v==='..'))fail('商店身份源码路径无效');
 const path=join(base,name);
 let ancestor=parse(path).root;
 for(const part of relative(ancestor,dirname(path)).split(sep)){
  ancestor=join(ancestor,part);if(!lstatSync(ancestor).isDirectory()||realpathSync(ancestor)!==ancestor)fail('商店身份源码父目录不安全');
 }
 return path;
}
export function readStoreSource(base,name) {
 const path=storePath(base,name),before=lstatSync(path);
 if(!before.isFile()||before.nlink!==1||before.size<=0||before.size>1_048_576)fail('商店身份源码不是有界独占普通文件');
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const opened=fstatSync(fd);
  if(!opened.isFile()||opened.nlink!==1||opened.dev!==before.dev||opened.ino!==before.ino||opened.size!==before.size)fail('商店身份源码打开期间变化');
  const data=Buffer.alloc(opened.size);let offset=0;
  while(offset<data.length){let count;try{count=readSync(fd,data,offset,data.length-offset,offset);}catch(error){if(error.code==='EINTR')continue;throw error;}if(count<=0)fail('商店身份源码读取失败');offset+=count;}
  const after=fstatSync(fd),current=lstatSync(storePath(base,name));
  const same=value=>value.isFile()&&value.nlink===1&&['dev','ino','size','mtimeMs','ctimeMs'].every(key=>value[key]===opened[key]);
  if(data.length!==opened.size||!same(after)||!same(current))fail('商店身份源码读取期间变化');
  return data;
 }finally{closeSync(fd);}
}
// OpenStep工程由产品自己的解析器读取。拒绝重复键、未闭合语法、过深结构和尾随内容。
export function iosStoreBundleID(text) {
 if(typeof text!=='string'||Buffer.byteLength(text)>1_048_576)fail('iOS商店工程超过边界');
 let offset=0,count=0;
 const bad=()=>fail('iOS商店工程语法无效');
 const next=()=>{
  while(offset<text.length){
   if(/\s/u.test(text[offset])){offset++;continue;}
   if(text.startsWith('//',offset)){const end=text.indexOf('\n',offset+2);offset=end<0?text.length:end+1;continue;}
   if(text.startsWith('/*',offset)){const end=text.indexOf('*/',offset+2);if(end<0)bad();offset=end+2;continue;}
   break;
  }
  if(++count>100_000)bad();if(offset===text.length)return null;
  const first=text[offset++];if('{}()=;,'.includes(first))return {symbol:first};
  if(first==='"'){
   let value='';while(offset<text.length){const c=text[offset++];if(c==='"')return {value};
    if(c==='\\'){
     if(offset===text.length)bad();const escaped=text[offset++];
     if(/[0-7]/u.test(escaped)){let octal=escaped;for(let n=0;n<2&&/[0-7]/u.test(text[offset]||'x');n++)octal+=text[offset++];value+=String.fromCharCode(parseInt(octal,8));}
     else if(escaped==='U'){const hex=text.slice(offset,offset+4);if(!/^[0-9a-fA-F]{4}$/u.test(hex))bad();value+=String.fromCharCode(parseInt(hex,16));offset+=4;}
     else if(Object.hasOwn({n:'\n',r:'\r',t:'\t','"':'"','\\':'\\'},escaped))value+=({n:'\n',r:'\r',t:'\t','"':'"','\\':'\\'})[escaped];else bad();
    }else value+=c;
   }bad();
  }
  const start=offset-1;while(offset<text.length&&!/\s/u.test(text[offset])&&!('{}()=;,"'.includes(text[offset]))&&!text.startsWith('/*',offset)&&!text.startsWith('//',offset))offset++;
  return {value:text.slice(start,offset)};
 };
 let token=next();const take=()=>{const value=token;token=next();return value;};
 const expect=symbol=>{if(token?.symbol!==symbol)bad();take();};
 const value=depth=>{
  if(depth>64||!token)bad();
  if(token.symbol==='{'){
   take();const object=Object.create(null);
   while(token?.symbol!=='}'){if(typeof token?.value!=='string')bad();const key=take().value;if(Object.hasOwn(object,key))bad();expect('=');object[key]=value(depth+1);expect(';');}
   take();return object;
  }
  if(token.symbol==='('){take();const array=[];while(token?.symbol!==')'){array.push(value(depth+1));if(token?.symbol===',')take();else if(token?.symbol!==')')bad();}take();return array;}
  if(typeof token.value!=='string')bad();return take().value;
 };
 const document=value(0);if(token!==null)bad();
 const objects=document?.objects,project=objects?.[document.rootObject];
 if(!objects||project?.isa!=='PBXProject'||!Array.isArray(project.targets))fail('iOS商店主工程无效');
 const targets=project.targets.map(id=>objects[id]).filter(v=>v?.isa==='PBXNativeTarget'&&v.name==='Runner'&&v.productType==='com.apple.product-type.application');
 if(targets.length!==1)fail('iOS商店Runner目标不唯一');
 const release=owner=>{
  const list=objects[owner.buildConfigurationList];if(list?.isa!=='XCConfigurationList'||!Array.isArray(list.buildConfigurations))fail('iOS商店配置列表无效');
  const configurations=list.buildConfigurations.map(id=>objects[id]).filter(v=>v?.isa==='XCBuildConfiguration'&&v.name==='Release');
  if(configurations.length!==1||!configurations[0].buildSettings||Array.isArray(configurations[0].buildSettings)||typeof configurations[0].buildSettings!=='object')fail('iOS商店Release配置不唯一');
  return configurations[0].buildSettings;
 };
 const bundle={...release(project),...release(targets[0])}.PRODUCT_BUNDLE_IDENTIFIER;
 if(typeof bundle!=='string'||/[\r\n]/u.test(bundle)||!/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/u.test(bundle))fail('iOS商店应用标识无效');
 return bundle;
}
export function androidStorePackageName(text) {
 const matches=[...text.matchAll(/\bapplicationId\s*(?:=\s*)?["']([A-Za-z0-9_.]+)["']/gu)];
 if(matches.length!==1||!/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/u.test(matches[0][1]))fail('Android应用标识无效');return matches[0][1];
}
export function storeIdentity() {
 const source=root,choose=names=>{
  const found=names.filter(name=>{try{lstatSync(storePath(root,name));return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}});
  if(found.length!==1||found[0]!==names[0])fail('商店身份原始工程缺失、路径过时或不唯一');return found[0];
 };
 const names=['scripts/flows.json','scripts/build.mjs',
  choose(['project/Runner.pbxproj','Runner.xcodeproj/project.pbxproj','Runner.pbxproj'].map(name=>relative(root,join(source,'ios',name)))),
  choose(['build.gradle.kts','build.gradle'].map(name=>relative(root,join(source,'android/app',name))))];
 const data=names.map(name=>readStoreSource(root,name)),sha=data=>createHash('sha256').update(data).digest('hex');
 const declared=JSON.parse(data[0]);
 if(declared.schema!==1||declared.product_id!==product||declared.entry!=='scripts/build.mjs')fail('商店身份公开入口不一致');
 const receipt={schema:1,product_id:product,bundle_id:iosStoreBundleID(data[2].toString('utf8')),package_name:androidStorePackageName(data[3].toString('utf8')),
  source_files:names.map((path,n)=>({path,sha256:sha(data[n])}))};
 if(names.some((name,n)=>sha(readStoreSource(root,name))!==receipt.source_files[n].sha256))fail('商店身份源码在解析期间变化');
 return receipt;
}

export function androidPackageName() {
 const directory=join(root,'android/app');const paths=['build.gradle.kts','build.gradle'].map(n=>join(directory,n)).filter(existsSync);
 if(paths.length!==1)fail('Android应用工程不唯一');
 return androidStorePackageName(readFileSync(paths[0],'utf8'));
}
export function androidUSBSerials(text) {
 const lines=text.trim().split(/\r?\n/u);if(lines.shift()!=='List of devices attached')fail('ADB设备列表无效');
 const serials=[],seen=new Set();for(const line of lines.filter(Boolean)){
  const parts=line.trim().split(/\s+/u),serial=parts[0];if(!parts.some(x=>x.startsWith('usb:')))continue;
  if(parts[1]!=='device'||!serial||serial.includes(':')||serial.startsWith('emulator-')||!/^[A-Za-z0-9._-]+$/u.test(serial)||seen.has(serial))fail('USB设备状态或身份无效');
  seen.add(serial);serials.push(serial);
 }if(serials.length<2)fail('多台USB目标回读不一致');return serials;
}
export function androidInstalledPath(result) {
 if(result.code===1&&!result.stdout.trim()&&!result.stderr.trim())return null;
 if(result.code!==0||result.stderr.trim()||!/^package:\/data\/app\/[A-Za-z0-9_./=+~-]+\/base\.apk\s*$/u.test(result.stdout)||result.stdout.includes('..'))fail('Android安装路径回读无效');
 return result.stdout.trim().slice('package:'.length);
}
export function androidCertificate(text) {
 const matches=[...text.matchAll(/Signer #\d+ certificate SHA-256 digest:\s*([a-fA-F0-9]{64})/gu)];
 if(matches.length!==1||!text.includes('Verified using v2 scheme (APK Signature Scheme v2): true'))fail('Android签名证书或v2验真失败');return matches[0][1].toLowerCase();
}
async function nativeVerifier(work,env) {
 if(typeof env.SWIFT!=='string'||basename(env.SWIFT)!=='swiftc')fail('安全验真器必须使用登记Xcode的Swift编译器');
 const state=executions.getStore();if(state?.verifier)return state.verifier;
 const dir=join(work,'product-verifier');mkdirSync(dir,{mode:0o700});const source=join(dir,'verify.swift'),binary=join(dir,'verify');
 writeFileSync(source,IOS_VERIFIER_SOURCE,{flag:'wx',mode:0o600});
 await run(env.SWIFT,['-O','-module-cache-path',join(work,'cache/swift'),'-framework','Security','-framework','CryptoKit',source,'-o',binary],env,work);
 const digest=outputDigest(binary);
 const verify=async request=>{if(outputDigest(binary)!==digest)fail('产品安全验真器发生变化');return JSON.parse((await runBuildProcess(binary,[],env,work,{capture:true,input:JSON.stringify(request),timeout:300000})).stdout);};
 if(state)state.verifier=verify;return verify;
}
async function developmentMaterial(work,env,value) {
 const operation=value===undefined?'development.read':'development.create',host=await productHost();
 if(host)return host(operation,value);
 const verifier=await nativeVerifier(work,env);return (await verifier({operation,product_id:product,...(value===undefined?{}:{value})})).value;
}
export function parseAndroidSigning(encoded) {
 if(typeof encoded!=='string'||encoded.length>128*1024)fail('开发签名材料无效');const bytes=Buffer.from(encoded,'base64');
 try{const fields={};for(const raw of bytes.toString('utf8').split(/\r?\n/u)){const line=raw.trim();if(!line||line.startsWith('#'))continue;const at=line.indexOf('='),key=line.slice(0,at).trim(),value=line.slice(at+1).trim();if(at<1||!['keystore','password','alias','keyPassword'].includes(key)||Object.hasOwn(fields,key)||!value)fail('开发签名字段无效');fields[key]=value;}
  const keystore=Buffer.from(fields.keystore||'','base64');if(keystore.length<1024||keystore.length>64*1024||!fields.password||Buffer.byteLength(fields.password)>1024||Buffer.byteLength(fields.keyPassword||fields.password)>1024||!/^[A-Za-z0-9._-]{1,128}$/u.test(fields.alias||'development')){keystore.fill(0);fail('开发签名材料缺失');}
  return {keystore,password:fields.password,alias:fields.alias||'development',keyPassword:fields.keyPassword||fields.password};
 }finally{bytes.fill(0);}
}
export function androidSigningTools(receipt,env,definitions) {
 // SDK组件带path，CMake引用仅带tool；签名从验真ADB回执所属SDK原件取工具，编译视图不参与选择。
 const buildTools=definitions.filter(x=>typeof x.path==='string'&&x.path.startsWith('build-tools;'));if(buildTools.length!==1)fail('Android签名工具版本不唯一');
 const signer=join(dirname(dirname(receipt.tools.android.path)),...buildTools[0].path.split(';'),'apksigner'),analyzer=join(dirname(receipt.tools['android-sdk'].path),'apkanalyzer'),adb=receipt.tools.android.path,keytool=join(dirname(env.JAVA),'keytool');
 for(const file of [signer,analyzer,adb,keytool]){const s=lstatSync(file);if(!s.isFile()||!(s.mode&0o111)||realpathSync(file)!==file)fail('Android签名安装工具入口无效');}
 return {signer,analyzer,adb,keytool};
}
async function completeAndroid(platform,work,receipt,env) {
 const packageName=androidPackageName();
 const definitions=(await import('./resources.mjs')).resourceDeclarations().android;
 const {signer,analyzer,adb,keytool}=androidSigningTools(receipt,env,definitions);
 const call=(file,args,extra={})=>runBuildProcess(file,args,{...env,...extra},work,{capture:true,timeout:600000});
 const candidate=join(work,'android.apk'),signed=join(work,'android.signed.apk');
 if(existsSync(signed)||!lstatSync(candidate).isFile()||realpathSync(candidate)!==candidate)fail('Android本轮候选无效');
 const manifest=async(apk,field)=>(await call(analyzer,['manifest',field,apk])).stdout.trim();
 const inspect=async(apk,certificate)=>{
  if(await manifest(apk,'application-id')!==packageName||await manifest(apk,'debuggable')!=='false')fail('Android候选产品或Release配置无效');
  const version={name:await manifest(apk,'version-name'),code:await manifest(apk,'version-code')};if(!version.name||version.name.length>128||!/^[1-9]\d*$/u.test(version.code))fail('Android候选版本无效');
  if(certificate&&androidCertificate((await call(signer,['verify','--verbose','--print-certs',apk])).stdout)!==certificate)fail('Android安装证书不一致');return version;
 };
 const version=await inspect(candidate),unsigned=await runBuildProcess(signer,['verify','--print-certs',candidate],env,work,{capture:true,accepted:[0,1],timeout:300000});
 if(unsigned.code!==1||!(unsigned.stdout+unsigned.stderr).includes('DOES NOT VERIFY'))fail('Android候选必须是未签名Release包');
 let encoded=await developmentMaterial(work,env);
 if(encoded===null)fail('已有Android签名材料缺失，禁止生成替代身份');
 const signing=parseAndroidSigning(encoded);encoded='';const temporary=join(work,'android-signing.keystore');
 try{
  writeFileSync(temporary,signing.keystore,{flag:'wx',mode:0o600});signing.keystore.fill(0);
  await call(signer,['sign','--ks',temporary,'--ks-pass','env:PRODUCT_STORE_PASSWORD','--key-pass','env:PRODUCT_KEY_PASSWORD','--ks-key-alias',signing.alias,'--out',signed,candidate],{PRODUCT_STORE_PASSWORD:signing.password,PRODUCT_KEY_PASSWORD:signing.keyPassword});
 }finally{signing.keystore.fill(0);signing.password='';signing.keyPassword='';if(existsSync(temporary)&&!executions.getStore()?.unconfirmed)unlinkSync(temporary);}
 const certificate=androidCertificate((await call(signer,['verify','--verbose','--print-certs',signed])).stdout);
 if(JSON.stringify(await inspect(signed,certificate))!==JSON.stringify(version))fail('Android签名后版本漂移');const digest=outputDigest(signed);
 const install=async(target,index)=>{
  if(outputDigest(signed)!==digest)fail('Android安装前签名产物改变');
  const result=await call(adb,[...target,'install','-r',signed]);if(!result.stdout.split(/\r?\n/u).includes('Success'))fail('Android安装失败');
  await readback(target,index);
 };
 const readback=async(target,index)=>{
  const result=await runBuildProcess(adb,[...target,'shell','pm','path',packageName],env,work,{capture:true,accepted:[0,1],timeout:300000}),path=androidInstalledPath(result);
  if(!path)fail('Android安装后包缺失');const file=join(work,'installed-after-'+index+'.apk');
  if(existsSync(file))fail('Android回读路径已存在');await call(adb,[...target,'pull',path,file]);
  if(realpathSync(file)!==file||JSON.stringify(await inspect(file,certificate))!==JSON.stringify(version))fail('Android安装后产品、证书或版本不一致');
 };
 await saveMobileArtifact(platform,work,signed);
 if(outputDigest(signed)!==digest)fail('Android安装前签名产物改变');
 const first=await runBuildProcess(adb,['-d','install','-r',signed],env,work,{capture:true,accepted:[0,1],timeout:300000});
 if(first.code===0&&first.stdout.split(/\r?\n/u).includes('Success'))await readback(['-d'],0);
 else{
  if(first.code!==1||!first.stderr.includes('more than one device'))fail('ADB直接USB安装失败');
  const serials=androidUSBSerials((await call(adb,['devices','-l'])).stdout);let failures=0;
  for(let i=0;i<serials.length;i++){executions.getStore()?.signal?.throwIfAborted();try{await install(['-s',serials[i]],i);}catch{executions.getStore()?.signal?.throwIfAborted();failures++;}}
  if(failures)fail('Android USB安装或回读失败'+failures+'/'+serials.length+'，已尝试全部设备');
 }
 renameSync(signed,join(work,'android.apk'));
 process.stderr.write('本机移动产物已签名验真；设备安装及产品身份、版本回读通过\n');
}
export function iosDeviceCandidates(response) {
 if(response?.info?.outcome!=='success'||!Array.isArray(response?.result?.devices))fail('iOS设备列表无效');
 const candidates=response.result.devices.filter(d=>d?.properties?.hardware?.reality==='physical'&&d.properties.hardware.platform==='iOS'&&d.properties.connection?.pairingState==='paired'&&d.properties.state?.developerModeStatus?.enabled?.mode===1);
 for(const d of candidates)if(!/^[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/u.test(d.identifier)||!/^(?:[a-fA-F0-9]{40}|[a-fA-F0-9]{8}-[a-fA-F0-9]{16})$/u.test(d.properties.hardware.udid))fail('iOS物理设备身份无效');
 return candidates.map(d=>({identifier:d.identifier,udid:d.properties.hardware.udid}));
}
export function iosInstalled(response,device,bundle) {
 const result=response?.result;
 if(response?.info?.outcome!=='success'||result?.deviceIdentifier!==device||result.matchingBundleIdentifier!==bundle||!Array.isArray(result.apps)||result.apps.length>1)fail('iOS安装回读设备或过滤身份无效');
 if(!result.apps.length)return null;const app=result.apps[0];if(app.bundleIdentifier!==bundle||typeof app.version!=='string'||typeof app.bundleVersion!=='string')fail('iOS应用版本回读无效');return {version:app.version,build:app.bundleVersion};
}
export function iosVersion(value) {if(typeof value!=='string'||!/^\d+(?:\.\d+){0,2}$/u.test(value))fail('iOS版本无效');return [...value.split('.').map(BigInt),0n,0n].slice(0,3);}
async function completeIOS(platform,work,receipt,env) {
 const signal=executions.getStore()?.signal,helper=await nativeVerifier(work,env),projectCandidates=['project/Runner.pbxproj','Runner.xcodeproj/project.pbxproj','Runner.pbxproj'].map(n=>join(root,'ios',n)).filter(existsSync);
 if(projectCandidates.length!==1||projectCandidates[0]!==join(root,'ios/project/Runner.pbxproj'))fail('iOS原始工程缺失、路径过时或不唯一');const project=projectCandidates[0],app=join(env.BUILD_DIR,'ios/iphoneos/Runner.app');
 // 直接消费本轮编译器生成的App，不打包、不解包、不保存另一份归档。
 if(!inside(work,app)||realpathSync(app)!==app||!lstatSync(app).isDirectory())fail('iOS编译App不属于本轮工作根');
 const appDigest=outputDigest(app);
 let sequence=0;
 // devicectl官方入口可能是无签名启动脚本；只接受本轮Xcode所定位且Apple签名通过的真实执行器。
 const found=(await runBuildProcess(env.XCRUN,['--find','devicectl'],env,work,{capture:true,timeout:60000})).stdout.trim();
 const installed='/Library/Developer/PrivateFrameworks/CoreDevice.framework/Versions/A/Resources/bin/devicectl';
 const tool=realpathSync(existsSync(installed)?installed:found);
 if(!tool.startsWith(env.DEVELOPER_DIR+'/')&&tool!==installed)fail('devicectl不属于当前Apple工具边界');
 await runBuildProcess(env.CODESIGN,['--verify','--strict','-R','=anchor apple',tool],env,work,{capture:true,timeout:60000});
 const deviceCall=async(args,seconds=120)=>{
  const file=join(work,'device-'+(++sequence)+'.json');
  await runBuildProcess(tool,[...args,'--json-output',file,'--omit-deprecated-fields-in-json','--timeout',String(seconds)],env,work,{capture:true,timeout:(seconds+10)*1000});
  if(realpathSync(file)!==file||!lstatSync(file).isFile()||lstatSync(file).size>4*1024*1024)fail('iOS设备结果文件无效');
  const response=JSON.parse(readFileSync(file,'utf8'));unlinkSync(file);if(response?.info?.outcome!=='success')fail('iOS设备命令失败');return response;
 };
 const findDevice=async()=>{
  for(let attempt=0;attempt<8;attempt++){
   signal?.throwIfAborted();const candidates=iosDeviceCandidates(await deviceCall(['list','devices'],5)),reachable=[];
   for(const d of candidates){let response;try{response=await deviceCall(['device','info','details','--device',d.identifier],5);}catch{signal?.throwIfAborted();continue;}
    const found=response.result,properties=found?.properties;
    if(found?.identifier!==d.identifier||properties?.hardware?.udid!==d.udid||properties.hardware.reality!=='physical'||properties.hardware.platform!=='iOS'||properties.connection?.pairingState!=='paired'||properties.state?.developerModeStatus?.enabled?.mode!==1)fail('iOS主动探测设备身份漂移');reachable.push(d);
   }
   if(reachable.length>1)fail('多台可用iOS真机无法确定安装设备');if(reachable.length===1)return reachable[0];
   if(attempt<7)await pauseBuild(2000,signal);
  }fail('iOS真机等待就绪超时');
 };
 const certificate=executions.getStore()?.iosSigningCertificate;if(!certificate)fail('本轮唯一iOS自动签名身份没有完成前置验真');
 const device=await findDevice(),prepared=await helper({operation:'ios.verify',app,project,device:device.udid,certificate});
 const before=iosInstalled(await deviceCall(['device','info','apps','--device',device.identifier,'--include-all-apps','--bundle-id',prepared.bundle_id]),device.identifier,prepared.bundle_id);
 const less=(a,b)=>{for(let i=0;i<3;i++){if(a[i]<b[i])return true;if(a[i]>b[i])return false;}return false;};
 if(before&&(less(iosVersion(prepared.version),iosVersion(before.version))||!less(iosVersion(prepared.version),iosVersion(before.version))&&!less(iosVersion(before.version),iosVersion(prepared.version))&&less(iosVersion(prepared.build),iosVersion(before.build))))fail('iOS禁止降级安装');
 const refreshed=await findDevice();if(JSON.stringify(refreshed)!==JSON.stringify(device)||JSON.stringify(await helper({operation:'ios.verify',app,project,device:device.udid,certificate}))!==JSON.stringify(prepared))fail('iOS安装前设备或签名产物漂移');
 if(outputDigest(app)!==appDigest)fail('iOS安装前App改变');
 await deviceCall(['device','install','app','--device',device.identifier,app]);
 const after=iosInstalled(await deviceCall(['device','info','apps','--device',device.identifier,'--include-all-apps','--bundle-id',prepared.bundle_id]),device.identifier,prepared.bundle_id);
 if(!after||after.version!==prepared.version||after.build!==prepared.build)fail('iOS安装后产品或版本回读不一致');
 if(outputDigest(app)!==appDigest||JSON.stringify(await helper({operation:'ios.verify',app,project,device:device.udid,certificate}))!==JSON.stringify(prepared))fail('iOS安装期间签名产物漂移');
 process.stderr.write('本机移动产物已签名验真；设备安装及产品身份、版本回读通过\n');
}
function pauseBuild(ms,signal){signal?.throwIfAborted();return new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(Error('产品任务已取消'));};const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();});}
async function saveMobileArtifact(platform,work,path) {
 const declared=platformContract(platform);if(declared.files.length!==1)fail('移动候选登记不唯一');
 const publicPath=join(work,declared.files[0]);
 if(path!==publicPath){unlinkSync(publicPath);copyFileSync(path,publicPath);}
 const host=await productHost();
 if(host)await host('artifact',[{path:publicPath,sha256:outputDigest(publicPath)}]);
}
async function completeMobile(platform,work,receipt,env) {
 executions.getStore()?.signal?.throwIfAborted();if(platform.endsWith('android'))await completeAndroid(platform,work,receipt,env);else await completeIOS(platform,work,receipt,env);
}

// 每次调用拥有自己的取消和进程集合，导入API并发也不能共享执行状态。
const executions=new AsyncLocalStorage();
export async function runBuildProcess(file,args,env,cwd=root,{capture=false,input,accepted=[0],timeout=7200000,signal=executions.getStore()?.signal,passHost=false,streamError=false,streamOutput=false}={}) {
 signal?.throwIfAborted();
 return new Promise((ok,reject)=>{
  const child=spawn(file,args,{cwd,env:workEnvironment(env),detached:true,stdio:['pipe','pipe','pipe',...(passHost?[3]:[])]});
  trackWorkProcess(child.pid);
  let stdout=[],stderr=[],bytes=0,reason,settled=false;
  const stop=()=>{try{process.kill(-child.pid,'SIGTERM');}catch(error){if(error.code!=='ESRCH')reason='无法取消产品工具进程组';}};
  let killer;
  const terminate=()=>{stop();clearTimeout(killer);killer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}},1500);};
  const forced=setTimeout(()=>{reason='产品工具超时';terminate();},timeout);forced.unref();
  const abort=()=>{reason='产品任务已取消';terminate();};
  signal?.addEventListener('abort',abort,{once:true});
  const consume=(chunk,out)=>{bytes+=chunk.length;if(bytes>16*1024*1024){reason='产品工具输出超限';terminate();return;}out.push(chunk);if(!capture)process.stderr.write(chunk);};
  child.stdout.on('data',chunk=>{consume(chunk,stdout);if(capture&&streamOutput)process.stdout.write(chunk);});child.stderr.on('data',chunk=>{if(capture&&streamError)process.stderr.write(chunk);else consume(chunk,stderr);});
  child.stdin.on('error',()=>{reason='产品工具输入失败';stop();});
  child.once('error',()=>{reason='产品工具无法启动';});
  child.once('close',async(code,termination)=>{
   clearTimeout(forced);clearTimeout(killer);
   // 主进程close不代表后代退出；未退出的同组工具必须停止并确认，之后才能清理材料。
   const alive=()=>{if(!child.pid)return false;try{process.kill(-child.pid,0);return true;}catch(error){return error.code!=='ESRCH';}};
   if(alive()){reason??='产品工具退出后仍有后代';stop();for(let n=0;n<15&&alive();n++)await new Promise(r=>setTimeout(r,100));if(alive())try{process.kill(-child.pid,'SIGKILL');}catch{};for(let n=0;n<15&&alive();n++)await new Promise(r=>setTimeout(r,100));}
   if(alive()){reason='产品工具后代退出未确认，保留工作目录';const state=executions.getStore();if(state)state.unconfirmed=true;}
   signal?.removeEventListener('abort',abort);clearTimeout(killer);
   if(signal?.aborted)reason='产品任务已取消';
   if(settled)return;settled=true;
   if(reason||termination||!accepted.includes(code))reject(Error(reason||'产品工具执行失败'));
   else ok({stdout:Buffer.concat(stdout).toString('utf8'),stderr:Buffer.concat(stderr).toString('utf8'),code});
  });
  child.stdin.end(input);
 });
}
const run=async(file,args,env,cwd=root,capture=false)=>(await runBuildProcess(file,args,env,cwd,{capture})).stdout;

export function outputDigest(path) {
 const hash=createHash('sha256');const base=path;
 function visit(file){const info=lstatSync(file);const name=relative(base,file);
  if(info.isSymbolicLink()){const real=realpathSync(file);if(!inside(base,real))fail('输出链接越界');hash.update(JSON.stringify([name,'link',readlinkSync(file)])+'\n');}
  else if(info.isDirectory()){hash.update(JSON.stringify([name,'directory'])+'\n');for(const child of readdirSync(file).sort())visit(join(file,child));}
  else if(info.isFile()&&info.nlink===1){hash.update(JSON.stringify([name,'file',Boolean(info.mode&0o111),info.size])+'\n');hash.update(readFileSync(file));}
  else fail('输出包含特殊文件或硬链接');
 }visit(path);return hash.digest('hex');
}
// 摘要只读执行源码；所属根技术文档及target等运行数据不改变编译身份。
function sourceDigest() {
 const hash=createHash('sha256'),rootData=new Set(['cache','target','rely','tools','tasks','TATA.md','MAP.md','CODEX.md','CLAUDE.md','README.md','CitizenWallet.md']);
 const generated=new Set(['.git','node_modules','.dart_tool','.gradle','.symlinks','Pods','build','target','ephemeral','.cache','.DS_Store']);
 function visit(path){for(const name of readdirSync(path).sort()){
  if(generated.has(name)||path===root&&rootData.has(name))continue;
  const file=join(path,name),info=lstatSync(file);hash.update(relative(root,file)+'\n');
  if(info.isDirectory())visit(file);else if(info.isFile()){hash.update(String(Boolean(info.mode&0o111)));hash.update(readFileSync(file));}
  else if(info.isSymbolicLink()){const real=realpathSync(file);if(!inside(root,real))fail('产品源码链接越界');hash.update(readlinkSync(file));}
  else fail('产品源码特殊输入未声明');
 }}visit(root);return hash.digest('hex');
}

export async function execute(platform,work,request={},options={}) {
 checkWork(work);
 return withFixedWork(taskScope(work),()=>executeTask(platform,work,request,options),{environment:options.environment||process.env,retain:request.resource_mode==='provided'||(options.environment||process.env).PRODUCT_HOST_FD==='3'});
}
async function executeTask(platform,work,request={},options={}) {
 checkWork(work);platformContract(platform);
 if(!inside(productTarget(platform),work)||work===productTarget(platform))fail('执行工作根与当前产品平台不一致');
 options.signal?.throwIfAborted();
 if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).some(k=>!['schema','product_id','platform','work','run_id','program_digest','resource_mode'].includes(k))
  ||request.schema!==undefined&&request.schema!==1||request.run_id!==undefined&&!/^[1-9][0-9]{8}$/u.test(request.run_id)||request.program_digest!==undefined&&!/^[a-f0-9]{64}$/u.test(request.program_digest)
  ||request.resource_mode!==undefined&&request.resource_mode!=='provided'
  ||request.product_id!==undefined&&request.product_id!==product||request.platform!==undefined&&request.platform!==platform||request.work!==undefined&&request.work!==work)fail('公开Build请求身份或字段无效');
 chmodSync(work,0o700);
 const lock=join(work,'.product-build.lock'),resultFile=join(work,'build-result.json');
 if(existsSync(resultFile))fail('本轮完整Build已有结果，禁止复用旧终态');
 const handle=openSync(lock,'wx',0o600);closeSync(handle);
 const cancellation=new AbortController(),abort=()=>cancellation.abort();options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();
 const state={signal:cancellation.signal,cancellation,host:options.host,unconfirmed:false,finished:false};
 try{return await executions.run(state,async()=>{
  const initial=sourceDigest(),stages=options.stages||{requirements,resources:(...args)=>import('./resources.mjs').then(m=>m.resources(...args)),prepare,build};
  const unchanged=()=>{state.signal.throwIfAborted();if(sourceDigest()!==initial)fail('产品源码或锁在执行期间改变');};
  const resourcesOptions={signal:state.signal,offline:Boolean(options.offline),environment:options.environment||process.env};
  if(request.resource_mode==='provided'){
   state.resourceClient=options.resourceClient||createResourceSupplyClient(new Socket({fd:4,readable:true,writable:true}),{product_id:product,platform,work,run_id:request.run_id},state.signal);
   resourcesOptions.supply=async previous=>{const plan=requirements(platform,work),digest=createHash('sha256').update(JSON.stringify(plan)).digest('hex');return state.resourceClient({requirements_digest:digest,previous});};
  }
  await stages.requirements(platform,work);unchanged();
  let receipt=await stages.resources(platform,work,request,resourcesOptions);unchanged();
  await stages.prepare(platform,work,receipt,resourcesOptions.environment);unchanged();
  await stages.requirements(platform,work);
  receipt=await stages.resources(platform,work,receipt,resourcesOptions);unchanged();
  const result=await stages.build(platform,work,receipt,resourcesOptions.environment);unchanged();
  checkBuildResult(result,platform,work,request.run_id);
  writeFileSync(resultFile,JSON.stringify(result)+'\n',{flag:'wx',mode:0o600});return result;
 });}catch(error){if(String(error?.message).includes('退出未确认'))state.unconfirmed=true;throw error;}finally{state.finished=true;state.socket?.destroy();options.signal?.removeEventListener('abort',abort);state.resourceClient?.close?.();if(!state.unconfirmed){unlinkSync(lock);if(request.resource_mode!=='provided')clearWork(work);}}
}
export function checkBuildResult(value,platform,work,runId) {
 const declared=platformContract(platform);
 if(!value||Object.keys(value).sort().join(',')!==(runId?'completion,files,platform,product_id,run_id,schema,work':'completion,files,platform,product_id,schema,work')
  ||value.schema!==1||value.product_id!==product||value.platform!==platform||value.work!==work||value.completion!==declared.completion
  ||runId&&value.run_id!==runId||!Array.isArray(value.files)||value.files.length!==declared.files.length)fail('完整Build结果身份或完成方式无效');
 for(let n=0;n<value.files.length;n++){const entry=value.files[n],file=join(work,declared.files[n]);
  if(Object.keys(entry).sort().join(',')!=='path,sha256'||entry.path!==file||!inside(work,file)||realpathSync(file)!==file||!/^[a-f0-9]{64}$/u.test(entry.sha256)||outputDigest(file)!==entry.sha256)fail('完整Build产物摘要或边界无效');}
 return value;
}
async function completeBuild(platform,work,receipt,env) {
 const declared=platformContract(platform);
 if(declared.completion==='device-install')await completeMobile(platform,work,receipt,env);
 if(declared.completion==='macos-artifact')for(const name of declared.files)await run(env.CODESIGN,['--verify','--deep','--strict',join(work,name)],env);
 const result={schema:1,product_id:product,platform,work,completion:declared.completion,
  files:declared.files.map(name=>{const path=join(work,name);if(!inside(work,path)||realpathSync(path)!==path)fail('Build候选越界');return {path,sha256:outputDigest(path)};})};
 if(receipt.run_id)result.run_id=receipt.run_id;return checkBuildResult(result,platform,work,receipt.run_id);
}

// 全双工宿主通道只传开发签名材料，不与stdout结果、stderr日志或资源回执混用。
async function productHost() {
 const supplied=executions.getStore()?.host;if(supplied)return supplied;
 if(process.env.PRODUCT_HOST_FD===undefined)return null;
 if(process.env.PRODUCT_HOST_FD!=='3')fail('宿主通道描述符无效');
 const socket=new Socket({fd:3,readable:true,writable:true}),pending=new Map();let buffer='',sequence=0;
 socket.on('data',chunk=>{buffer+=chunk.toString('utf8');if(Buffer.byteLength(buffer)>128*1024){socket.destroy();return;}
  let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);try{const reply=JSON.parse(line),entry=pending.get(reply.id);if(!entry)throw Error();pending.delete(reply.id);clearTimeout(entry.timer);if(reply.ok!==true)entry.reject(Error('开发签名材料宿主操作失败'));else entry.resolve(reply.value);}catch{socket.destroy();}}});
 const close=()=>{const state=executions.getStore();if(state&&!state.finished)state.cancellation?.abort();for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(Error('产品宿主通道中断'));}pending.clear();};socket.on('error',close);socket.on('close',close);socket.unref();
 const host=(operation,value)=>new Promise((resolve,reject)=>{if(!['development.read','development.create','artifact'].includes(operation))return reject(Error('宿主能力未授权'));
  const id=String(++sequence),timer=setTimeout(()=>{pending.delete(id);reject(Error('开发材料操作超时'));socket.destroy();},30000);
  pending.set(id,{resolve,reject,timer});socket.write(JSON.stringify({id,operation,...(value===undefined?{}:operation==='artifact'?{files:value}:{value})})+'\n');});
 executions.getStore().host=host;executions.getStore().socket=socket;return host;
}
// 资源供给使用独立公开通道，不传签名材料；每轮请求绑定同一真实任务。
export function createResourceSupplyClient(stream,identity,signal){
 let buffer='',sequence=0,pending=null,closed=false;
 const reject=message=>{closed=true;if(pending){clearTimeout(pending.timer);pending.reject(Error(message));pending=null;}stream.destroy();};
 const abort=()=>reject('资源供给已取消');
 signal?.addEventListener('abort',abort,{once:true});
 stream.setEncoding?.('utf8');
 stream.on('data',chunk=>{buffer+=chunk.toString();if(Buffer.byteLength(buffer)>2*1024**2)return reject('资源供给回执超限');
  let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);
   try{const reply=JSON.parse(line);if(!pending||reply.id!==pending.id||Object.keys(reply).sort().join(',')!==(reply.ok===true?'id,ok,value':'error,id,ok'))throw Error();
    const entry=pending;pending=null;clearTimeout(entry.timer);if(reply.ok!==true){entry.reject(Error(reply.error));reject('资源供给失败');return;}entry.resolve(reply.value);
   }catch{reject('资源供给帧或请求身份无效');return;}
  }
 });
 stream.on('error',()=>reject('资源供给通道失败'));stream.on('end',()=>reject('资源供给通道中断'));stream.on('close',()=>reject('资源供给通道中断'));
 const request=value=>new Promise((resolve,rejectPromise)=>{if(closed||pending||signal?.aborted)return rejectPromise(Error('资源供给不可用，禁止独立下载'));
  const id=String(++sequence),timer=setTimeout(()=>reject('资源供给超时'),7200000);pending={id,timer,resolve,reject:rejectPromise};
  stream.write(JSON.stringify({...value,id,operation:'prepare',identity})+'\n');
 });
 request.close=()=>{signal?.removeEventListener('abort',abort);reject('资源供给已关闭');};return request;
}

// 模块先完成初始化，资源模块才能反向导入本文件的唯一校验；异步CLI在独立Promise中执行。
async function runCLI(){
 const [operation,,flag,work]=process.argv.slice(2);
 if(['execute','resources','prepare','build'].includes(operation)&&flag==='--work'){
  checkWork(work);
  return withFixedWork(taskScope(work),()=>runCommand(),{environment:process.env,retain:process.env.PRODUCT_HOST_FD==='3'||process.env.PRODUCT_RESOURCE_FD==='4'});
 }
 return runCommand();
}
async function runCommand(){
 const [command,platform,option,work,...extra]=process.argv.slice(2);
 if(command==='analysis-options') {
  if(process.argv.length!==3)fail('分析规则入口不接受参数');
  process.stdout.write(ANALYSIS_OPTIONS_SOURCE);
 } else if(command==='icons') {
  if(process.argv.length!==5)fail('图标入口必须指定工程和平台');
  generatePlatformIcons(platform,option);
 } else if(Object.hasOwn(BUILD_SHELL_SOURCES,command)) {
  const cancellation=new AbortController();for(const name of ['SIGTERM','SIGINT'])process.once(name,()=>cancellation.abort());
  const result=await runEmbeddedBuild(command,process.argv.slice(3),process.env,process.cwd(),{
   capture:true,streamError:true,streamOutput:true,signal:cancellation.signal,accepted:Array.from({length:256},(_,index)=>index)});
  process.exitCode=result.code;
 } else if(command==='store-identity') {
  if(process.argv.length!==3)fail('商店身份只读入口不接受参数');
  process.stdout.write(JSON.stringify(storeIdentity())+'\n');
 } else if(command==='temporary-root') {
  if(work!==undefined||extra.length)fail('临时入口参数无效');
  const host=process.platform==='darwin'?'macos':process.platform==='win32'?'windows':process.platform==='linux'?(process.arch==='arm64'?'linux-arm':process.arch==='x64'?'linux-amd':undefined):undefined;
  const fallback=option?.endsWith('macos')?option.slice(0,-5)+host:option;
  const chosen=Object.hasOwn(contract.platforms,platform)?platform
   :platform&&option?.endsWith('-'+platform)&&Object.hasOwn(contract.platforms,option)?option
   :Object.hasOwn(contract.platforms,'host-'+platform)?'host-'+platform:!platform?(Object.hasOwn(contract.platforms,fallback)?fallback:option):platform;
  platformContract(chosen);process.stdout.write(temporaryRoot(chosen,'tmp')+'\n');
 } else {

 if(!['requirements','resources','prepare','build','execute'].includes(command)||option!=='--work'||extra.some(x=>x!=='--offline')||extra.length>1||extra.length&&!['resources','execute'].includes(command))fail('固定入口参数无效');
 checkWork(work);
 if(command==='requirements')process.stdout.write(JSON.stringify(requirements(platform,work))+'\n');
 else{
  const cancellation=new AbortController();for(const name of ['SIGTERM','SIGINT'])process.once(name,()=>cancellation.abort());
  let input='';for await(const chunk of process.stdin){input+=chunk;if(Buffer.byteLength(input)>2*1024*1024)fail('公开输入超限');}
  const request=input?JSON.parse(input):{},options={environment:process.env,signal:cancellation.signal,offline:extra.includes('--offline')};
  let result;
  if(command==='execute'&&request.resource_mode==='provided'){
   if(process.env.PRODUCT_RESOURCE_FD!=='4')fail('资源供给通道缺失，禁止独立下载');
   result=await execute(platform,work,request,options);
  }else if(command==='execute'){
   const {bootstrapNode}=await import('./resources.mjs');const node=await bootstrapNode(work,options);
   if(createHash('sha256').update(readFileSync(process.execPath)).digest('hex')!==createHash('sha256').update(readFileSync(node.path)).digest('hex')){
    const environment=Object.fromEntries(['HOME','USER','LOGNAME','LANG','LC_ALL','PRODUCT_TOOL_ROOT','PRODUCT_DEPENDENCY_ROOT','PRODUCT_HOST_FD','PRODUCT_WORK_LEASE'].filter(k=>typeof process.env[k]==='string').map(k=>[k,process.env[k]]));
    result=JSON.parse((await runBuildProcess(node.path,[fileURLToPath(import.meta.url),command,platform,option,work,...extra],workEnvironment(environment),root,{capture:true,streamError:true,input:JSON.stringify(request),signal:cancellation.signal,passHost:environment.PRODUCT_HOST_FD==='3'})).stdout);
   }else result=await execute(platform,work,request,options);
  }else if(command==='resources')result=await (await import('./resources.mjs')).resources(platform,work,request,options);
  else result=await executions.run({signal:cancellation.signal},()=>command==='prepare'?prepare(platform,work,request,process.env):build(platform,work,request,process.env));
  process.stdout.write(JSON.stringify(result)+'\n');
 }
}
}

// CLI拒绝必须真实失败，不能留成未完成顶层await或输出成功回执。
if(!inlineTestEntry&&directEntry){
 void runCLI().catch(error=>{console.error(error);process.exitCode=1;});
}

// 内嵌测试：正式实现之后，仅由 node --test 直接运行本文件时注册。
if (inlineTestEntry) {
  void (async () => {
// 产品独立入口：真实只读需求、资源身份、路径隔离与锁定归档失败关闭。
const {test} = await import('node:test');
const {createHash} = await import('node:crypto');
const {spawnSync} = await import('node:child_process');
const { default: assert } = await import('node:assert/strict');
const {copyFileSync,linkSync,existsSync,lstatSync,mkdtempSync,readFileSync,readdirSync,realpathSync,rmSync,mkdirSync,symlinkSync,writeFileSync,chmodSync} = await import('node:fs');
const { testRoot: tmpdir } = await import('./build.mjs');
const {dirname,join,resolve} = await import('node:path');
const {iosStoreBundleID,androidStorePackageName,readStoreSource,storeIdentity,contract,requirements,resourceEnvironment,checkWork,productTarget,createView,prepare,prepareAndroidProjectInputs,checkArchives} = await import('./build.mjs');

const {decodePNG,resizePNG,generatePlatformIcons} = await import('./build.mjs');

const sandbox=fixtureWork;
const root=resolve(import.meta.dirname,'..'),base=root;
const fixture=work=>{
 const platform=Object.keys(contract.platforms).find(value=>value.endsWith('android'))||Object.keys(contract.platforms)[0];
 const own={};for(const value of contract.platforms[platform].locks){const key={npm:'npmCache',pub:'pubCache',cargo:'cargoHome'}[value.ecosystem];if(key){own[key]=join(work,key);mkdirSync(own[key]);}}
 return {schema:1,product_id:contract.product_id,platform,work,offline:true,
 tools:Object.fromEntries(contract.platforms[platform].tools.map(tool=>[tool.id,{version:tool.version,path:process.execPath}])),
 dependencies:{own},archives:{},environment:{}};
};
test('每个平台从自身原始锁只读提出需求；缺失原始Pod锁按源码事实拒绝',async()=>{
 const work=sandbox();try{for(const platform of Object.keys(contract.platforms)){
  const before=readdirSync(work),apple=platform.endsWith('ios')?'ios':platform.endsWith('macos')?'macos':null;
  if(apple&&existsSync(join(base,apple,'Podfile'))&&!existsSync(join(base,apple,'Podfile.lock'))){
   await assert.rejects(async()=>requirements(platform,work),/CocoaPods原始锁缺失/);
  }else{
   const result=await requirements(platform,work);assert.equal(result.product_id,contract.product_id);
   assert.equal(result.platform,platform);assert.equal(result.schema,1);
   assert.ok(result.tools.every(value=>value.id&&value.version));
   assert.ok(result.locks.every(value=>['cargo','pub','npm','cocoapods'].includes(value.ecosystem)));
  }
  assert.deepEqual(readdirSync(work),before);
 }}finally{removeFixture(work,{recursive:true});}
});
test('平台、源码内工作根和链接工作根在任何写入前拒绝',async()=>{
 const work=sandbox();try{
  await assert.rejects(async()=>requirements('unknown',work),/平台/);
  assert.throws(()=>checkWork(root),/本产品target/);
  mkdirSync(join(work,'actual'));symlinkSync(join(work,'actual'),join(work,'linked'));
  assert.throws(()=>checkWork(join(work,'linked')),/固定目录/);
 }finally{removeFixture(work,{recursive:true});}
});
test('资源回执隔离产品、平台、工作根，准确工具版本且禁止注入',()=>{
 const work=sandbox();try{
  const receipt=fixture(work),platform=receipt.platform;
  assert.throws(()=>resourceEnvironment(platform,work,{...receipt,product_id:'another'}),/身份/);
  assert.throws(()=>resourceEnvironment(platform,work,{...receipt,offline:false}),/身份/);
  assert.throws(()=>resourceEnvironment(platform,work,{...receipt,tools:{}}),/工具/);
  assert.throws(()=>resourceEnvironment(platform,work,{...receipt,environment:{NODE_OPTIONS:'--inspect'}}),/注入/);
  const id=Object.keys(receipt.tools)[0];assert.throws(()=>resourceEnvironment(platform,work,{...receipt,tools:{...receipt.tools,[id]:{...receipt.tools[id],version:'wrong'}}}),/版本/);
  const env=resourceEnvironment(platform,work,receipt,{HOME:'/home',TOKEN:'private',INJECTED_CONTEXT:'/private'});
  assert.equal(env.LC_ALL,'en_US.UTF-8');
  assert.equal(env.TOKEN,undefined);assert.equal(env.INJECTED_CONTEXT,undefined);assert.equal(env.CARGO_NET_OFFLINE,'true');
  assert.equal(env[contract.product_id.toUpperCase()+'_WORK_DIR'],work);
 }finally{removeFixture(work,{recursive:true});}
});
test('原始锁需要的依赖必须显式交付，不能使用用户默认缓存',()=>{
 const work=sandbox();try{
  const receipt=fixture(work),own=receipt.dependencies.own;
  for(const key of Object.keys(own)){const missing={...own};delete missing[key];
   assert.throws(()=>resourceEnvironment(receipt.platform,work,{...receipt,dependencies:{own:missing}}),/依赖回执/);}
  const key=Object.keys(own)[0];if(key){
   const linked=join(work,'linked');symlinkSync(own[key],linked);
   assert.throws(()=>resourceEnvironment(receipt.platform,work,{...receipt,dependencies:{own:{...own,[key]:linked}}}),/依赖回执/);
  }
 }finally{removeFixture(work,{recursive:true});}
});
test('工程复制在同轮解析包并隔离写入，内部链接重新指向副本',()=>{
 const work=sandbox();try{
  const source=join(work,'input'),output=join(work,'view');mkdirSync(source);
  writeFixture(join(source,'package.json'),'{"name":"input"}');
  writeFixture(join(source,'code.js'),'source');symlinkSync('code.js',join(source,'linked.js'));
  mkdirSync(join(source,'node_modules'));writeFixture(join(source,'node_modules/old'),'generated');
  createView(source,output);writeFixture(join(output,'package.json'),'{"name":"generated"}');
  assert.equal(readFileSync(join(source,'package.json'),'utf8'),'{"name":"input"}');
  assert.equal(realpathSync(join(output,'linked.js')),join(output,'code.js'));
  assert.equal(existsSync(join(output,'node_modules')),false);
  assert.throws(()=>createView(source,output),/已存在/);
 }finally{removeFixture(work,{recursive:true});}
});
test('工程输出的父链接和输入外部链接均拒绝，不能写入第三方目录',()=>{
 const work=sandbox();try{
  const source=join(work,'source'),external=join(work,'external');mkdirSync(source);mkdirSync(external);
  writeFixture(join(source,'code'),'source');symlinkSync(external,join(work,'linked'));
  assert.throws(()=>createView(source,join(work,'linked/view')),/链接/);assert.deepEqual(readdirSync(external),[]);
  symlinkSync('/etc/passwd',join(source,'outside'));
  assert.throws(()=>createView(source,join(work,'bad-view')),/越界/);
 }finally{removeFixture(work,{recursive:true});}
});
test('未经本产品锁声明的归档回执不能用于编译',async()=>{
 const work=sandbox();try{
  const receipt=fixture(work);
  // 同一工具回执不能为归档注入增加来源；验证在任何暂存写入前结束。
  await assert.rejects(checkArchives(receipt.platform,work,{...receipt,archives:{injected:[{name:'unknown',version:'1.0.0',url:'https://example.invalid/archive',sha256:'a'.repeat(64),path:join(work,'missing')}]}}),/产品锁/);
 }finally{removeFixture(work,{recursive:true});}
});

// 真实命令行只读自身入口；清除私有环境与工具搜索路径，不能从控制台补齐执行条件。
test('独立命令行从自身声明输出JSON，未知平台失败且不写工作根',async()=>{
 const work=sandbox();try{
  for(const platform of Object.keys(contract.platforms)){
   const before=readdirSync(work),result=spawnSync(process.execPath,[join(root,'scripts/build.mjs'),'requirements',platform,'--work',work],{env:{HOME:work,LANG:'C',LC_ALL:'C'},encoding:'utf8'});
   const apple=platform.endsWith('ios')?'ios':platform.endsWith('macos')?'macos':null;
   if(apple&&existsSync(join(base,apple,'Podfile'))&&!existsSync(join(base,apple,'Podfile.lock'))){assert.notEqual(result.status,0);assert.match(result.stderr,/CocoaPods原始锁缺失/);}
   else{assert.equal(result.status,0,result.stderr);const value=JSON.parse(result.stdout);assert.equal(value.product_id,contract.product_id);assert.equal(value.platform,platform);}
   assert.deepEqual(readdirSync(work),before);
  }
  const invalid=spawnSync(process.execPath,[join(root,'scripts/build.mjs'),'requirements','unknown','--work',work],{env:{HOME:work},encoding:'utf8'});
  assert.notEqual(invalid.status,0);assert.match(invalid.stderr,/平台/);
 }finally{removeFixture(work,{recursive:true});}
});

// 钱包只声明自己的Pub与Rust来源，SDK账户和原生库不是钱包构建依赖。
test('钱包资源不展开其他产品来源',async()=>{const work=sandbox();try{for(const platform of Object.keys(contract.platforms)){const value=await requirements(platform,work);assert.deepEqual(value.sources,[]);assert.deepEqual(value.archives,[]);assert.equal(value.locks.some(lock=>lock.source_package),false);}}finally{removeFixture(work,{recursive:true});}});

// 完整入口控制边界：替身只替换耗时阶段，不调用真实编译或用户安全存储。
test('产品独立execute完成全部自有阶段后才返回唯一结果',async()=>{
 const {execute,outputDigest}=await import('./build.mjs');const work=sandbox(),platform=Object.keys(contract.platforms)[0],declared=contract.platforms[platform],calls=[];
 try{
  const result={schema:1,product_id:contract.product_id,platform,work,completion:declared.completion,run_id:'123456789',files:[]};
  const stages={requirements:async()=>{calls.push('requirements');},resources:async()=>{calls.push('resources');return {};},prepare:async()=>{calls.push('prepare');},build:async()=>{
   calls.push('build');for(const name of declared.files){const path=join(work,name);mkdirSync(dirname(path),{recursive:true});writeFixture(path,'isolated-candidate-fixture');result.files.push({path,sha256:outputDigest(path)});}return result;
  }};
  assert.deepEqual(await execute(platform,work,{run_id:'123456789'},{stages}),result);
  assert.deepEqual(calls,['requirements','resources','prepare','requirements','resources','build']);
  assert.deepEqual(readdirSync(work),[], '独立执行结束必须彻底清空现场');
  result.files=[]; calls.length=0;
  assert.deepEqual(await execute(platform,work,{run_id:'123456789'},{stages}),result);
  assert.deepEqual(readdirSync(work),[], '下一轮结束仍须清空现场');
 }finally{removeFixture(work,{recursive:true});}
});
test('失败、取消、并发和伪造终态不能复用工作根或留下成功回执',async()=>{
 const {execute}=await import('./build.mjs'),platform=Object.keys(contract.platforms)[0];
 for(const failure of ['resources','prepare','build','identity','cancel']){
  const work=sandbox(),abort=new AbortController(),calls=[];
  try{
   const stages={requirements:()=>{},resources:async()=>{calls.push('resources');if(failure==='resources')throw Error('fixture failure');return {};},prepare:async()=>{calls.push('prepare');if(failure==='prepare')throw Error('fixture failure');if(failure==='cancel')abort.abort();},build:async()=>{calls.push('build');if(failure==='build')throw Error('fixture failure');return {schema:1,product_id:'forged'};}};
   await assert.rejects(execute(platform,work,{}, {stages,signal:abort.signal}));
   assert.equal(existsSync(join(work,'build-result.json')),false);assert.equal(existsSync(join(work,'.product-build.lock')),false);
   if(['resources','prepare','cancel'].includes(failure))assert.equal(calls.includes('build'),false);
  }finally{removeFixture(work,{recursive:true});}
 }
 const work=sandbox();try{writeFixture(join(work,'.product-build.lock'),'owned');await assert.rejects(execute(platform,work,{}));assert.equal(readFileSync(join(work,'.product-build.lock'),'utf8'),'owned');}finally{rmSync(join(work,'.product-build.lock'),{force:true});removeFixture(work,{recursive:true});}
});

test('Android签名入口使用真实混合SDK声明，CMake引用不阻断且工具异常拒绝',async()=>{
 const {androidSigningTools}=await import('./build.mjs'),{resourceDeclarations}=await import('./resources.mjs');
 const definitions=resourceDeclarations().android,component=definitions.find(x=>x.path==='build-tools;36.0.0');
 assert.ok(component);assert.ok(definitions.some(x=>x.tool&&!Object.hasOwn(x,'path')));
 const work=sandbox();try{
  const sdk=join(work,'sdk'),signer=join(sdk,...component.path.split(';'),'apksigner'),manager=join(sdk,'cmdline-tools/22.0/bin/sdkmanager'),analyzer=join(dirname(manager),'apkanalyzer'),adb=join(sdk,'platform-tools/adb'),java=join(work,'java/bin/java'),keytool=join(dirname(java),'keytool');
  for(const file of [signer,manager,analyzer,adb,java,keytool]){mkdirSync(dirname(file),{recursive:true});writeFixture(file,'#!/bin/sh\nexit 0\n',{mode:0o700});}
  const receipt={tools:{'android-sdk':{path:manager},android:{path:adb}}},env={ANDROID_HOME:sdk,JAVA:java};
  assert.deepEqual(androidSigningTools(receipt,env,definitions),{signer,analyzer,adb,keytool});
  const view=join(work,'android-sdk-view');mkdirSync(view);symlinkSync(join(sdk,'build-tools'),join(view,'build-tools'));
  assert.deepEqual(androidSigningTools(receipt,{...env,ANDROID_HOME:view},definitions),{signer,analyzer,adb,keytool});
  assert.throws(()=>androidSigningTools(receipt,env,definitions.filter(x=>x!==component)),/版本不唯一/);
  assert.throws(()=>androidSigningTools(receipt,env,[...definitions,component]),/版本不唯一/);
  chmodSync(signer,0o600);assert.throws(()=>androidSigningTools(receipt,env,definitions),/工具入口无效/);chmodSync(signer,0o700);
  rmSync(analyzer);symlinkSync(manager,analyzer);assert.throws(()=>androidSigningTools(receipt,env,definitions),/工具入口无效/);
 }finally{removeFixture(work,{recursive:true});}
});
test('Android多USB、包路径、证书和开发材料异常由产品拒绝',async()=>{
 const {androidUSBSerials,androidInstalledPath,androidCertificate,parseAndroidSigning}=await import('./build.mjs');
 assert.deepEqual(androidUSBSerials('List of devices attached\nA device usb:1\nB device usb:2\nemulator-1 device transport_id:3\n'),['A','B']);
 for(const list of ['List of devices attached\nA offline usb:1\nB device usb:2','List of devices attached\nA device usb:1\nA device usb:2','List of devices attached\nA device usb:1'])assert.throws(()=>androidUSBSerials(list));
 assert.equal(androidInstalledPath({code:1,stdout:'',stderr:''}),null);
 assert.equal(androidInstalledPath({code:0,stdout:'package:/data/app/abc/base.apk\n',stderr:''}),'/data/app/abc/base.apk');
 for(const value of [{code:1,stdout:'',stderr:'device offline'},{code:0,stdout:'package:/data/app/../base.apk',stderr:''},{code:0,stdout:'package:/data/app/a/base.apk\npackage:/data/app/b/base.apk',stderr:''}])assert.throws(()=>androidInstalledPath(value));
 const cert='a'.repeat(64);assert.equal(androidCertificate('Verified using v2 scheme (APK Signature Scheme v2): true\nSigner #1 certificate SHA-256 digest: '+cert),cert);
 assert.throws(()=>androidCertificate('Signer #1 certificate SHA-256 digest: '+cert));assert.throws(()=>parseAndroidSigning(Buffer.from('keystore=bad\npassword=fixture').toString('base64')));
});
test('iOS设备、过滤包标识、bundleVersion与版本比较归产品',async()=>{
 const {iosDeviceCandidates,iosInstalled,iosVersion}=await import('./build.mjs');
 const identifier='12345678-1234-1234-1234-123456789abc',udid='12345678-123456789abcdef0',bundle='fixture.product';
 const device={identifier,properties:{hardware:{reality:'physical',platform:'iOS',udid},connection:{pairingState:'paired'},state:{developerModeStatus:{enabled:{mode:1}}}}};
 assert.deepEqual(iosDeviceCandidates({info:{outcome:'success'},result:{devices:[device]}}),[{identifier,udid}]);
 assert.deepEqual(iosDeviceCandidates({info:{outcome:'success'},result:{devices:[{...device,properties:{...device.properties,hardware:{...device.properties.hardware,reality:'virtual'}}}]}}),[]);
 const readback={info:{outcome:'success'},result:{deviceIdentifier:identifier,matchingBundleIdentifier:bundle,apps:[{bundleIdentifier:bundle,version:'1.2',bundleVersion:'3'}]}};
 assert.deepEqual(iosInstalled(readback,identifier,bundle),{version:'1.2',build:'3'});
 assert.throws(()=>iosInstalled(readback,'wrong-device',bundle));assert.throws(()=>iosInstalled({...readback,result:{...readback.result,apps:[{bundleIdentifier:bundle,version:'1.2',buildVersion:'3'}]}},identifier,bundle));
 assert.deepEqual(iosVersion('1.2'),iosVersion('1.2.0'));assert.throws(()=>iosVersion('1.2-beta'));
});

// 原控制台profile/entitlement用例迁到产品Swift验真器；最终统一验收交付已验真的Xcode环境。
const iosContractFixture=[
 "import XCTest",
 "final class ProductIOSContractTests: XCTestCase {",
 "    @objc func testProductIOSReleaseSettingsRequireUniqueRunnerAndRelease() throws {",
 "        // 工程级设置允许被唯一 Runner Release 覆盖；Debug 或其它目标不能成为签名配置来源。",
 "        let objects: [String: [String: Any]] = [",
 "            \"project\": [\"targets\": [\"runner\"], \"buildConfigurationList\": \"project-list\"],",
 "            \"runner\": [\"name\": \"Runner\", \"productType\": \"com.apple.product-type.application\", \"buildConfigurationList\": \"runner-list\"],",
 "            \"project-list\": [\"buildConfigurations\": [\"project-release\"]],",
 "            \"runner-list\": [\"buildConfigurations\": [\"runner-debug\", \"runner-release\"]],",
 "            \"project-release\": [\"name\": \"Release\", \"buildSettings\": [\"DEVELOPMENT_TEAM\": \"PROJECT001\", \"SDKROOT\": \"iphoneos\"]],",
 "            \"runner-release\": [\"name\": \"Release\", \"buildSettings\": [\"DEVELOPMENT_TEAM\": \"RUNNER0001\", \"PRODUCT_BUNDLE_IDENTIFIER\": \"com.example.local\"]],",
 "            \"runner-debug\": [\"name\": \"Debug\", \"buildSettings\": [\"DEVELOPMENT_TEAM\": \"DEBUG00001\"]],",
 "        ]",
 "        let values = try ProductIOSContract.iosReleaseSettings([\"rootObject\": \"project\", \"objects\": objects])",
 "        XCTAssertEqual(values[\"DEVELOPMENT_TEAM\"] as? String, \"RUNNER0001\")",
 "        XCTAssertEqual(values[\"PRODUCT_BUNDLE_IDENTIFIER\"] as? String, \"com.example.local\")",
 "        XCTAssertEqual(values[\"SDKROOT\"] as? String, \"iphoneos\")",
 "        var missingRunner = objects",
 "        missingRunner[\"project\"]?[\"targets\"] = [String]()",
 "        XCTAssertThrowsError(try ProductIOSContract.iosReleaseSettings([\"rootObject\": \"project\", \"objects\": missingRunner]))",
 "        for list in [\"project-list\", \"runner-list\"] {",
 "            var missingRelease = objects",
 "            missingRelease[list]?[\"buildConfigurations\"] = [String]()",
 "            XCTAssertThrowsError(try ProductIOSContract.iosReleaseSettings([\"rootObject\": \"project\", \"objects\": missingRelease]))",
 "            var duplicateRelease = objects",
 "            duplicateRelease[\"extra-release\"] = [\"name\": \"Release\", \"buildSettings\": [:] as [String: Any]]",
 "            duplicateRelease[list]?[\"buildConfigurations\"] = [list == \"project-list\" ? \"project-release\" : \"runner-release\", \"extra-release\"]",
 "            XCTAssertThrowsError(try ProductIOSContract.iosReleaseSettings([\"rootObject\": \"project\", \"objects\": duplicateRelease]))",
 "        }",
 "        var duplicateRunner = objects",
 "        duplicateRunner[\"runner-two\"] = objects[\"runner\"]",
 "        duplicateRunner[\"project\"]?[\"targets\"] = [\"runner\", \"runner-two\"]",
 "        XCTAssertThrowsError(try ProductIOSContract.iosReleaseSettings([\"rootObject\": \"project\", \"objects\": duplicateRunner]))",
 "    }",
 "",
 "    private func localIOSProfile() -> [String: Any] {",
 "        [\"TeamIdentifier\": [\"TEAMTEST01\"], \"ApplicationIdentifierPrefix\": [\"TEAMTEST01\"],",
 "         \"CreationDate\": Date(timeIntervalSince1970: 1), \"ExpirationDate\": Date(timeIntervalSince1970: 1000),",
 "         \"Platform\": [\"iOS\"], \"ProvisionedDevices\": [\"device-one\"],",
 "         \"Entitlements\": [\"application-identifier\": \"TEAMTEST01.com.example.*\",",
 "             \"com.apple.developer.team-identifier\": \"TEAMTEST01\", \"get-task-allow\": true,",
 "             \"keychain-access-groups\": [\"TEAMTEST01.*\"], \"aps-environment\": \"development\"]]",
 "    }",
 "",
 "    @objc func testProductIOSProfileOnlyGrantsRequestedCapabilities() throws {",
 "        let values = try ProductIOSContract.iosEntitlements(profile: localIOSProfile(), team: \"TEAMTEST01\",",
 "            bundleID: \"com.example.local\", device: \"device-one\", requested: [:], now: Date(timeIntervalSince1970: 100))",
 "        XCTAssertNil(values[\"aps-environment\"])",
 "        XCTAssertEqual(values[\"application-identifier\"] as? String, \"TEAMTEST01.com.example.local\")",
 "        XCTAssertEqual(values[\"get-task-allow\"] as? Bool, true)",
 "        XCTAssertNil(values[\"keychain-access-groups\"])",
 "        let requested: [String: Any] = [",
 "            \"keychain-access-groups\": [\"$(AppIdentifierPrefix)$(PRODUCT_BUNDLE_IDENTIFIER)\"],",
 "            \"aps-environment\": \"$(APS_ENVIRONMENT)\"]",
 "        let requestedValues = try ProductIOSContract.iosEntitlements(profile: localIOSProfile(), team: \"TEAMTEST01\",",
 "            bundleID: \"com.example.local\", device: \"device-one\", requested: requested, now: Date(timeIntervalSince1970: 100))",
 "        XCTAssertEqual(requestedValues[\"keychain-access-groups\"] as? [String], [\"TEAMTEST01.com.example.local\"])",
 "        XCTAssertEqual(requestedValues[\"aps-environment\"] as? String, \"development\")",
 "        var distribution = localIOSProfile()",
 "        var distributionEntitlements = try XCTUnwrap(distribution[\"Entitlements\"] as? [String: Any])",
 "        distributionEntitlements[\"get-task-allow\"] = false",
 "        distribution[\"Entitlements\"] = distributionEntitlements",
 "        let distributionValues = try ProductIOSContract.iosEntitlements(profile: distribution, team: \"TEAMTEST01\",",
 "            bundleID: \"com.example.local\", device: \"device-one\", requested: [:], now: Date(timeIntervalSince1970: 100))",
 "        XCTAssertEqual(distributionValues[\"get-task-allow\"] as? Bool, false)",
 "    }",
 "",
 "    @objc func testProductIOSSignedEntitlementsAcceptOnlyExactSecurityFrameworkAliases() {",
 "        let expected: [String: Any] = [\"application-identifier\": \"TEAMTEST01.com.example.local\",",
 "            \"aps-environment\": \"development\",",
 "            \"com.apple.developer.team-identifier\": \"TEAMTEST01\", \"get-task-allow\": false]",
 "        var actual = expected",
 "        actual[\"com.apple.application-identifier\"] = \"TEAMTEST01.com.example.local\"",
 "        actual[\"com.apple.developer.aps-environment\"] = \"development\"",
 "        XCTAssertTrue(ProductIOSContract.iosSignedEntitlementsMatch(actual, expected: expected))",
 "        actual[\"com.apple.application-identifier\"] = \"TEAMTEST01.com.other\"",
 "        XCTAssertFalse(ProductIOSContract.iosSignedEntitlementsMatch(actual, expected: expected))",
 "        actual = expected",
 "        actual[\"com.apple.developer.aps-environment\"] = \"production\"",
 "        XCTAssertFalse(ProductIOSContract.iosSignedEntitlementsMatch(actual, expected: expected))",
 "        actual = expected",
 "        actual[\"unexpected-capability\"] = true",
 "        XCTAssertFalse(ProductIOSContract.iosSignedEntitlementsMatch(actual, expected: expected))",
 "    }",
 "",
 "    @objc func testProductIOSProfileRejectsWrongIdentityDeviceExpiryAndPermissions() throws {",
 "        for (key, value) in [(\"TeamIdentifier\", [\"OTHERTEAM1\"] as Any), (\"ProvisionedDevices\", [\"other-device\"] as Any),",
 "                             (\"ExpirationDate\", Date(timeIntervalSince1970: 99) as Any), (\"CreationDate\", Date(timeIntervalSince1970: 101) as Any),",
 "                             (\"Platform\", [\"macOS\"] as Any)] {",
 "            var profile = localIOSProfile()",
 "            profile[key] = value",
 "            XCTAssertThrowsError(try ProductIOSContract.iosEntitlements(profile: profile, team: \"TEAMTEST01\",",
 "                bundleID: \"com.example.local\", device: \"device-one\", requested: [:], now: Date(timeIntervalSince1970: 100)))",
 "        }",
 "        for requested: [String: Any] in [[\"get-task-allow\": true], [\"not-authorized\": true],",
 "            [\"application-identifier\": \"TEAMTEST01.com.other.app\"], [\"application-identifier\": 7],",
 "            [\"com.apple.developer.team-identifier\": [\"TEAMTEST01\"]], [\"keychain-access-groups\": [\"OTHERTEAM1.app\"]]] {",
 "            XCTAssertThrowsError(try ProductIOSContract.iosEntitlements(profile: localIOSProfile(), team: \"TEAMTEST01\",",
 "                bundleID: \"com.example.local\", device: \"device-one\", requested: requested, now: Date(timeIntervalSince1970: 100)))",
 "        }",
 "    }",
 "",
 "    @objc func testProductIOSProfileRejectsUnknownEntitlementVariables() throws {",
 "        XCTAssertThrowsError(try ProductIOSContract.iosEntitlements(",
 "            profile: localIOSProfile(), team: \"TEAMTEST01\", bundleID: \"com.example.local\",",
 "            device: \"device-one\", requested: [\"aps-environment\": \"$(UNKNOWN_ENVIRONMENT)\"],",
 "            now: Date(timeIntervalSince1970: 100)))",
 "    }",
 "",
 "}",
].join('\n');
test('安全验真JSON跨进程按键排序，字段变化仍改变回执',()=>{
 const work=sandbox();
 try{
  const swift=process.env.PRODUCT_TEST_SWIFT,developer=process.env.PRODUCT_TEST_DEVELOPER_DIR;
  assert.ok(swift&&developer,'JSON验收须使用产品已登记Xcode');
  assert.ok(realpathSync(swift).startsWith(realpathSync(developer)+'/'));
  const main=IOS_VERIFIER_SOURCE.indexOf('\ndo {\n let bytes = FileHandle.standardInput');assert.ok(main>0);
  const writers=IOS_VERIFIER_SOURCE.split('\n').filter(line=>line.includes('FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject:result'));
  assert.equal(writers.length,1);
  const source=join(work,'json.swift'),binary=join(work,'json');
  // 使用产品真实Swift验真器及实际输出语句；只将请求入口换成无机密字段夹具。
  writeFixture(source,IOS_VERIFIER_SOURCE.slice(0,main)+'\nlet result = try JSONSerialization.jsonObject(with: FileHandle.standardInput.readDataToEndOfFile())\n'+writers[0]+'\n');
  const compiled=spawnSync(swift,['-module-cache-path',join(work,'module-cache'),'-framework','Security','-framework','CryptoKit',source,'-o',binary],{encoding:'utf8',env:process.env});
  assert.equal(compiled.status,0,compiled.stderr);
  const base={version:'1.0',build:'1',bundle_id:'fixture.wallet',team:'FIXTURE001',sha256:'fixture-digest'};
  const fixtures=[base,...Object.keys(base).map(key=>({...base,[key]:base[key]+'-changed'}))];
  const outputs=[];
  for(const value of fixtures){
   const runs=[];
   for(let index=0;index<4;index++){
    const entries=Object.entries(value);if(index%2)entries.reverse();
    const checked=spawnSync(binary,[],{input:JSON.stringify(Object.fromEntries(entries)),encoding:'utf8',env:process.env,timeout:10000});
    assert.equal(checked.status,0,checked.stderr);const parsed=JSON.parse(checked.stdout);
    assert.deepEqual(parsed,value);assert.deepEqual(Object.keys(parsed),Object.keys(value).sort());runs.push(checked.stdout);
   }
   assert.equal(new Set(runs).size,1);outputs.push(runs[0]);
  }
  assert.equal(new Set(outputs).size,fixtures.length);
 }finally{removeFixture(work,{recursive:true});}
});
test('资源供给后的平台装配保留本轮settings并拒绝链接和越界',async()=>{
 const work=sandbox(),source=root,project=join(work,'source-view',source.replace(/^\/+/,''));
 try{
  const python=process.env.PRODUCT_TEST_PYTHON;assert.ok(python,'平台装配回归须交付登记Python');
  createView(source,project,work);
  const marker="<<'PREPARE_PLATFORM'\n",script=BUILD_SHELL_SOURCES.wallet.split(marker)[1]?.split('\nPREPARE_PLATFORM\n')[0];assert.ok(script);
  const assemble=(target=project)=>spawnSync(python,['-',source,target,'android','false'],{input:script,encoding:'utf8',env:process.env});
  let checked=assemble();assert.equal(checked.status,0,checked.stderr);
  const settings=join(project,'android/settings.gradle.kts'),before=readFileSync(join(source,'android/settings.gradle.kts'));
  const sdk=join(work,'fixture-sdk'),plugin=join(sdk,'packages/flutter_tools/gradle');mkdirSync(join(plugin,'src'),{recursive:true});
  for(const name of ['settings.gradle.kts','build.gradle.kts'])writeFixture(join(plugin,name),'// 原件夹具，仅验证准备配方\n');
  const gradle=join(work,'fixture-gradle/bin/gradle');mkdirSync(dirname(gradle),{recursive:true});
  writeFixture(gradle,'#!'+process.execPath+'\n// 资源命令夹具；不执行编译或下载。\n');chmodSync(gradle,0o700);
  const {prepareGradleResources}=await import('./resources.mjs');
  assert.ok(process.env.PRODUCT_TEST_SHELL,'平台装配回归须交付登记Shell');
  const library={installed:new Map([['gradle',{path:gradle}],['flutter',{path:join(sdk,'bin/flutter')}],['java',{path:join(work,'fixture-java/bin/java')}],['bash',{path:process.env.PRODUCT_TEST_SHELL}]])};
  await prepareGradleResources(work,{library,offline:true},{},{PRODUCT_WORK_DIR:work,PATH:dirname(process.execPath)});
  const prepared=readFileSync(settings,'utf8');assert.notDeepEqual(Buffer.from(prepared),before);assert.ok(prepared.includes('includeBuild('+JSON.stringify(join(project,'flutter-gradle'))+')'));
  // 执行真实Python平台装配两次，供给产物保持原字节，原始源码也保持只读。
  for(let i=0;i<2;i++){checked=assemble();assert.equal(checked.status,0,checked.stderr);assert.equal(readFileSync(settings,'utf8'),prepared);assert.deepEqual(readFileSync(join(source,'android/settings.gradle.kts')),before);}
  rmSync(settings);symlinkSync(join(source,'android/settings.gradle.kts'),settings);checked=assemble();assert.notEqual(checked.status,0);assert.match(checked.stderr,/普通平台输入|入口来源不符/);
  rmSync(settings);writeFixture(settings,prepared);checked=assemble(source);assert.notEqual(checked.status,0);assert.match(checked.stderr,/必须属于本产品build或test/);
 }finally{removeFixture(work,{recursive:true});}
});

test('产品Security验真器拒绝错误Release配置、profile授权和entitlement变量',async()=>{
 const {IOS_VERIFIER_SOURCE}=await import('./build.mjs'),work=sandbox();
 try{
  const swift=process.env.PRODUCT_TEST_SWIFT,developer=process.env.PRODUCT_TEST_DEVELOPER_DIR;
  assert.ok(swift&&developer,'统一验收须显式交付产品锁定Xcode的PRODUCT_TEST_SWIFT和PRODUCT_TEST_DEVELOPER_DIR');
  // 官方swift入口是包内链接；核验规范目标属于同一Xcode并具执行权限。
  const actualSwift=realpathSync(swift);assert.ok(actualSwift.startsWith(realpathSync(developer)+'/'));
  assert.ok(swift.startsWith(developer+'/'));assert.ok(lstatSync(actualSwift).isFile()&&(lstatSync(actualSwift).mode&0o111));
  const main=IOS_VERIFIER_SOURCE.indexOf('\ndo {\n let bytes = FileHandle.standardInput');assert.ok(main>0);
  const source=join(work,'ios-contract.swift'),bundle=join(work,'IOSVerifierTests.xctest'),binary=join(bundle,'Contents/MacOS/IOSVerifierTests'),frameworks=join(developer,'Platforms/MacOSX.platform/Developer/Library/Frameworks');
  mkdirSync(join(bundle,'Contents/MacOS'),{recursive:true});
  writeFixture(join(bundle,'Contents/Info.plist'),'<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>IOSVerifierTests</string><key>CFBundleIdentifier</key><string>test.product.ios-verifier</string><key>CFBundlePackageType</key><string>BNDL</string></dict></plist>');
  writeFixture(source,IOS_VERIFIER_SOURCE.slice(0,main)+'\n'+iosContractFixture);
  const compiler=join(developer,'Toolchains/XcodeDefault.xctoolchain/usr/bin/swiftc');
  assert.ok(realpathSync(compiler).startsWith(realpathSync(developer)+'/'));
  const compiled=spawnSync(compiler,['-emit-library','-module-name','IOSVerifierTests','-module-cache-path',join(work,'module-cache'),'-F',frameworks,'-I',join(developer,'Platforms/MacOSX.platform/Developer/usr/lib'),'-L',join(developer,'Platforms/MacOSX.platform/Developer/usr/lib'),'-Xlinker','-rpath','-Xlinker',join(developer,'Platforms/MacOSX.platform/Developer/usr/lib'),'-framework','Security','-framework','CryptoKit','-framework','XCTest','-Xlinker','-rpath','-Xlinker',frameworks,source,'-o',binary],{encoding:'utf8',env:process.env});
  assert.equal(compiled.status,0,compiled.stderr);
  // Apple XCTest由同一登记Xcode的正式runner加载真实测试Bundle，不能使用其它平台的XCTMain。
  const runner=join(developer,'usr/bin/xctest');assert.ok(realpathSync(runner).startsWith(realpathSync(developer)+'/'));
  const trusted=spawnSync('/usr/bin/codesign',['--verify','--strict','--all-architectures',runner],{encoding:'utf8',env:process.env});assert.equal(trusted.status,0,trusted.stderr);
  const checked=spawnSync(runner,[bundle],{encoding:'utf8',env:process.env,timeout:60000});assert.equal(checked.status,0,checked.stdout+checked.stderr);
  assert.match(checked.stdout+checked.stderr,/Executed 5 tests, with 0 failures/u);
 }finally{removeFixture(work,{recursive:true});}
});

test('产品取消等待工具进程组退出，不提前交付结果',async()=>{
 const {runBuildProcess}=await import('./build.mjs'),work=sandbox(),abort=new AbortController();let polling,deadline;
 try{
  const pidFile=join(work,'descendant.pid');
  const script="const fs=require('node:fs'),{spawn}=require('node:child_process');const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(process.argv[1],String(child.pid));setInterval(()=>{},1000);";
  const execution=runBuildProcess(process.execPath,['-e',script,pidFile],process.env,work,{capture:true,signal:abort.signal,timeout:5000});
  polling=setInterval(()=>{if(existsSync(pidFile))abort.abort();},20);deadline=setTimeout(()=>abort.abort(),2000);
  await assert.rejects(execution,/取消/);assert.ok(existsSync(pidFile));const pid=Number(readFileSync(pidFile,'utf8'));
  assert.throws(()=>process.kill(pid,0),error=>error.code==='ESRCH');
 }finally{clearInterval(polling);clearTimeout(deadline);removeFixture(work,{recursive:true});}
});

// 覆盖独立入口、单/多平台物理边界和源码输入排除，统一测试阶段才执行。
test('本仓target由当前平台声明决定，外部或链接工作根不能越界',()=>{
 for(const platform of Object.keys(contract.platforms)){
  const expected=join(root,'target');
  assert.equal(productTarget(platform),expected);
 }
 assert.throws(()=>productTarget('undeclared-platform'));
 assert.throws(()=>checkWork(join(root,'..','foreign-work')),/target/);
 assert.throws(()=>checkWork(join(root,'target')),/target/);
 const work=sandbox();try{assert.equal(checkWork(work),work);assert.throws(()=>checkWork(join(work,'nested')),/固定目录/);}finally{removeFixture(work,{recursive:true,force:true});}
});

// 只读身份命令在空PATH、无控制台环境下工作，来源仍为本产品原始工程。
const storeProject=(bundle='ios.fixture')=>`{
 objects = {
  P = { isa = PBXProject; targets = (T,); buildConfigurationList = PC; };
  T = { isa = PBXNativeTarget; name = Runner; productType = "com.apple.product-type.application"; buildConfigurationList = TC; };
  PC = { isa = XCConfigurationList; buildConfigurations = (PR,); };
  TC = { isa = XCConfigurationList; buildConfigurations = (TR,); };
  PR = { isa = XCBuildConfiguration; name = Release; buildSettings = { PRODUCT_BUNDLE_IDENTIFIER = ios.project; }; };
  TR = { isa = XCBuildConfiguration; name = Release; buildSettings = { PRODUCT_BUNDLE_IDENTIFIER = "${bundle}"; }; };
 }; rootObject = P;
}`;
test('商店身份解析真实Runner Release覆盖关系并拒绝歧义、重复键和非法标识',()=>{
 assert.equal(iosStoreBundleID(storeProject()),'ios.fixture');
 assert.equal(iosStoreBundleID(storeProject().replace('PRODUCT_BUNDLE_IDENTIFIER = "ios.fixture";','OTHER = "a\\ntext";')),'ios.project');
 for(const value of [storeProject().replace('targets = (T,)','targets = (T,T,)'),storeProject().replace('buildConfigurations = (TR,)','buildConfigurations = (TR,TR,)'),
  storeProject().replace('name = Release;','name = Debug;'),storeProject().replace('rootObject = P;','rootObject = P; rootObject = P;'),
  storeProject('$(BUNDLE_ID)'),storeProject('ios.bad_'),storeProject()+'garbage',storeProject().slice(0,-1),'/* never closed',
  '{a = '+ '('.repeat(66)+'x'+')'.repeat(66)+';}'])assert.throws(()=>iosStoreBundleID(value));
 assert.equal(androidStorePackageName('applicationId = "com.example.fixture"'),'com.example.fixture');
 assert.equal(androidStorePackageName("applicationId 'com.example.fixture'"),'com.example.fixture');
 for(const value of ['', 'applicationId="bad"','applicationId="1.bad"','applicationId="com.example.a";applicationId="com.example.b"'])assert.throws(()=>androidStorePackageName(value));
});
test('商店身份源码有界读取拒绝符号链接、父路径链接、硬链接及越界路径',()=>{
 const work=sandbox();try{
  writeFixture(join(work,'plain'),'plain');assert.equal(readStoreSource(work,'plain').toString(),'plain');
  symlinkSync(join(work,'plain'),join(work,'alias'));assert.throws(()=>readStoreSource(work,'alias'));
  mkdirSync(join(work,'directory'));writeFixture(join(work,'directory/file'),'data');symlinkSync(join(work,'directory'),join(work,'linked'));
  assert.throws(()=>readStoreSource(work,'linked/file'));
  linkSync(join(work,'plain'),join(work,'hard'));assert.throws(()=>readStoreSource(work,'plain'));
  writeFixture(join(work,'empty'),'');writeFixture(join(work,'large'),Buffer.alloc(1_048_577));
  for(const value of ['empty','large','../plain','/plain','directory//file','directory/./file','directory/../plain','bad\\path'])assert.throws(()=>readStoreSource(work,value));
 }finally{removeFixture(work,{recursive:true});}
});
test('公开只读身份回执验真真实配置，无环境回退、不接受参数且不写原始文件',()=>{
 const entry=join(root,'scripts/build.mjs'),before=storeIdentity();
 const invoke=args=>spawnSync(process.execPath,[entry,...args],{encoding:'utf8',env:{HOME:process.env.HOME,LANG:'C',PATH:'',NODE_OPTIONS:'',NODE_PATH:''}});
 const result=invoke(['store-identity']);assert.equal(result.status,0,result.stderr);const receipt=JSON.parse(result.stdout);
 assert.deepEqual(receipt,before);assert.deepEqual(Object.keys(receipt).sort(),['bundle_id','package_name','product_id','schema','source_files']);
 assert.equal(receipt.product_id,contract.product_id);assert.equal(receipt.source_files.length,4);
 for(const file of receipt.source_files)assert.equal(createHash('sha256').update(readStoreSource(root,file.path)).digest('hex'),file.sha256);
 assert.notEqual(invoke(['store-identity','ios']).status,0);assert.deepEqual(storeIdentity(),before);
});
test('公开只读身份命令拒绝缺失或重复原始工程，配置变化由产品回执表达',()=>{
 const work=sandbox();try{
  for(const name of ['scripts','ios/project','android/app'])mkdirSync(join(work,name),{recursive:true});
  copyFixture(join(root,'scripts/build.mjs'),join(work,'scripts/build.mjs'));
  writeFixture(join(work,'scripts/flows.json'),JSON.stringify({schema:1,product_id:contract.product_id,entry:'scripts/build.mjs',platforms:{ios:{}}}));
  const project=join(work,'ios/project/Runner.pbxproj'),gradle=join(work,'android/app/build.gradle.kts');
  writeFixture(project,storeProject());writeFixture(gradle,'applicationId = "com.example.fixture"');
  const run=()=>spawnSync(process.execPath,[join(work,'scripts/build.mjs'),'store-identity'],{encoding:'utf8',env:{PATH:'',HOME:process.env.HOME,NODE_OPTIONS:'',NODE_PATH:''}});
  const first=run();assert.equal(first.status,0,first.stderr);assert.equal(JSON.parse(first.stdout).bundle_id,'ios.fixture');
  writeFixture(project,storeProject('ios.changed'));const changed=run();assert.equal(changed.status,0,changed.stderr);
  assert.equal(JSON.parse(changed.stdout).bundle_id,'ios.changed');assert.notDeepEqual(JSON.parse(changed.stdout).source_files,JSON.parse(first.stdout).source_files);
  writeFixture(join(work,'ios/Runner.pbxproj'),storeProject());assert.notEqual(run().status,0);rmSync(join(work,'ios/Runner.pbxproj'));
  writeFixture(join(work,'android/app/build.gradle'),'applicationId "com.example.duplicate"');assert.notEqual(run().status,0);
  rmSync(join(work,'android/app/build.gradle'));rmSync(project);assert.notEqual(run().status,0);
  writeFixture(join(work,'ios/Runner.pbxproj'),storeProject());assert.notEqual(run().status,0);rmSync(join(work,'ios/Runner.pbxproj'));
  writeFixture(project,storeProject());rmSync(gradle);writeFixture(join(work,'android/app/build.gradle'),'applicationId "com.example.legacy"');assert.notEqual(run().status,0);
 }finally{removeFixture(work,{recursive:true});}
});


// 复制本产品真实入口到自有测试现场；只替换资源供给边界，反向导入和CLI子进程真实执行。
test('CLI异步资源可反向导入唯一校验，正常参数和离线失败均准确收口',()=>{
 const area=sandbox();
 try{
  const source=join(area,'source'),scripts=join(source,'scripts'),file=join(scripts,'build.mjs');
  const platform=Object.keys(contract.platforms)[0];
  const work=join(source,'target','build');
  mkdirSync(scripts,{recursive:true});mkdirSync(work,{recursive:true});
  writeFixture(file,readFileSync(join(root,'scripts/build.mjs')));
  for(const name of ['target.mjs','target-fixtures.mjs'])writeFixture(join(scripts,name),readFileSync(join(root,'scripts',name)));
  writeFixture(join(scripts,'flows.json'),JSON.stringify(contract));
  const provider=[
   "import {writeFileSync,chmodSync} from 'node:fs';",
   "import {join} from 'node:path';",
   "const refuse = false;",
   "export async function bootstrapNode(work,options){",
   " const owner=await import('./build.mjs');owner.checkWork(work);",
   " writeFileSync(join(work,'bootstrap.json'),JSON.stringify({offline:options.offline,work}));",
   " if(refuse&&options.offline)throw Error('合成离线缺少锁定资源');",
   " return {path:process.execPath};",
   "}",
   "export async function resources(platform,work,request,options){",
   " const owner=await import('./build.mjs');owner.checkWork(work);owner.platformContract(platform);",
   " if(refuse&&options.offline)throw Error('合成离线缺少锁定资源');",
   " return {schema:1,product_id:owner.contract.product_id,platform,work,offline:options.offline,request};",
   "}",
  ].join('\n');
  writeFixture(join(scripts,'resources.mjs'),provider);
  const env={HOME:area,LANG:'C',PATH:''},marker=join(work,'bootstrap.json');
  const options={cwd:source,env,input:'{}',encoding:'utf8',timeout:5000,maxBuffer:1024*1024};
  const check=(result,status)=>{
   assert.equal(result.error,undefined);assert.equal(result.signal,null);assert.equal(result.status,status);
   assert.doesNotMatch(result.stderr,/unsettled top-level await/u);
  };
  // 普通模块导入不启动CLI；结果来自当前入口完整正文，不截取/重写其控制结构。
  const imported=spawnSync(process.execPath,['--input-type=module','--eval',
   "import {pathToFileURL} from 'node:url';await import(pathToFileURL("+JSON.stringify(file)+"));process.stdout.write('module-ready\\n');"],options);
  check(imported,0);assert.equal(imported.stdout,'module-ready\n');assert.deepEqual(readdirSync(work),[]);
  const input=JSON.stringify({schema:1,product_id:contract.product_id,platform,work});
  for(const offline of [false,true]){
   const result=spawnSync(process.execPath,[file,'resources',platform,'--work',work,...(offline?['--offline']:[])],{...options,input});
   check(result,0);
   assert.deepEqual(JSON.parse(result.stdout),{schema:1,product_id:contract.product_id,platform,work,offline,request:JSON.parse(input)});
  }
  // execute先真实完成反向导入和Node选择，再由原请求校验拒绝，不能以假Build成功代替。
  const invalid=spawnSync(process.execPath,[file,'execute',platform,'--work',work,'--offline'],{...options,input:'{"schema":99}'});
  check(invalid,1);assert.equal(invalid.stdout,'');assert.match(invalid.stderr,/公开Build请求身份或字段无效/u);
  assert.equal(existsSync(marker),false,'失败的真实入口必须清除引导材料');
  for(const extra of [['--offline','--offline'],['--unknown']]){
   const result=spawnSync(process.execPath,[file,'execute',platform,'--work',work,...extra],options);
   check(result,1);assert.equal(result.stdout,'');assert.match(result.stderr,/固定入口参数无效/u);assert.equal(existsSync(marker),false);
  }
  const malformed=spawnSync(process.execPath,[file,'resources',platform,'--work',work],{...options,input:'{'});
  check(malformed,1);assert.equal(malformed.stdout,'');assert.match(malformed.stderr,/SyntaxError/u);
  const unknown=spawnSync(process.execPath,[file,'resources','unknown','--work',work],options);
  check(unknown,1);assert.match(unknown.stderr,/平台未声明/u);
  writeFixture(join(scripts,'resources.mjs'),provider.replace('const refuse = false;','const refuse = true;'));
  for(const command of ['execute','resources']){
   const result=spawnSync(process.execPath,[file,command,platform,'--work',work,'--offline'],options);
   check(result,1);assert.equal(result.stdout,'');assert.match(result.stderr,/合成离线缺少锁定资源/u);
  }
  assert.equal(existsSync(join(work,'.product-build.lock')),false);
  assert.equal(existsSync(join(work,'build-result.json')),false);
 }finally{rmSync(area,{recursive:true,force:true});}
});

test('产品Flutter视图排除生成目录并独立承接本轮写入',async t=>{
 const {createView}=await import('./build.mjs');
 const {realpath,mkdtemp,mkdir,writeFile,symlink,readFile,rm}=await import('node:fs/promises');
 const root=await realpath(await mkdtemp(join(tmpdir(),'owned-flutter-view-')));t.after(()=>rm(root,{recursive:true,force:true}));
 const source=join(root,'source');await mkdir(join(source,'lib'),{recursive:true});await mkdir(join(source,'build'));
 await writeFile(join(source,'pubspec.yaml'),'name: fixture');await writeFile(join(source,'lib/main.dart'),'source');
 await writeFile(join(source,'build/old'),'old');await symlink('main.dart',join(source,'lib/linked.dart'));
 const outputs=[join(root,'ios-view'),join(root,'android-view')];
 for(const output of outputs)createView(source,output);
 assert.equal(await realpath(join(outputs[0],'lib/linked.dart')),join(outputs[0],'lib/main.dart'));
 await writeFile(join(outputs[0],'pubspec.yaml'),'generated');
 assert.equal(await readFile(join(source,'pubspec.yaml'),'utf8'),'name: fixture');
 assert.equal(await readFile(join(outputs[1],'pubspec.yaml'),'utf8'),'name: fixture');
 assert.equal(existsSync(join(outputs[0],'build')),false);
 assert.throws(()=>createView(source,outputs[0]),/已存在/);
});


// 测试通道使用内存双工流；不下载、编译或接触开发材料。
const {EventEmitter} = await import('node:events');
const {createResourceSupplyClient,execute,outputDigest,checkBuildResult} = await import('./build.mjs');
function resourcePipe(){const a=new EventEmitter(),b=new EventEmitter();for(const [one,other]of [[a,b],[b,a]]){one.setEncoding=()=>{};one.write=data=>{queueMicrotask(()=>other.emit('data',data));return true;};one.destroy=()=>{if(one.destroyed)return;one.destroyed=true;one.emit('close');};}return [a,b];}
test('公开资源客户端串行绑定两次需求，错序回执、并发和取消直接失败',async()=>{
 const identity={product_id:'citizenwallet',platform:'android',work:'/fixture',run_id:'123456789'},[client,provider]=resourcePipe(),supply=createResourceSupplyClient(client,identity);let seq=0;
 provider.on('data',line=>{const request=JSON.parse(line);assert.deepEqual(request.identity,identity);assert.equal(request.id,String(++seq));const reply=JSON.stringify({id:request.id,ok:true,value:{stage:seq}})+'\n';client.emit('data',reply.slice(0,4));client.emit('data',reply.slice(4));});
 assert.deepEqual(await supply({requirements_digest:'a'.repeat(64),previous:{}}),{stage:1});assert.deepEqual(await supply({requirements_digest:'a'.repeat(64),previous:{}}),{stage:2});supply.close();
 const [one]=resourcePipe(),bad=createResourceSupplyClient(one,identity),pending=bad({previous:{}});one.emit('data',JSON.stringify({id:'2',ok:true,value:{}})+'\n');await assert.rejects(pending,/帧或请求身份/);await assert.rejects(bad({}),/禁止独立下载/);
 const [two]=resourcePipe(),abort=new AbortController(),cancelled=createResourceSupplyClient(two,identity,abort.signal),waiting=cancelled({});await assert.rejects(cancelled({}),/禁止独立下载/);abort.abort();await assert.rejects(waiting,/取消/);cancelled.close();
});
test('供给模式在prepare前后使用同一资源通道；失败停止且不执行build',async()=>{
 for(const failing of [false,true]){const work=fixtureWork();try{
  const receipt=fixture(work),seen=[],request={schema:1,product_id:contract.product_id,platform:'android',work,run_id:'123456789',resource_mode:'provided'};
  const resourceClient=async message=>{seen.push('supply');assert.match(message.requirements_digest,/^[a-f0-9]{64}$/u);if(failing)throw Error('supply unavailable');return receipt;};resourceClient.close=()=>seen.push('closed');
  const stages={requirements:()=>seen.push('requirements'),resources:async(_,__,previous,options)=>{assert.equal(typeof options.supply,'function');return options.supply(previous);},prepare:()=>seen.push('prepare'),build:()=>{seen.push('build');const file=join(work,contract.platforms.android.files[0]);writeFixture(file,'fixture');return {schema:1,product_id:contract.product_id,platform:'android',work,run_id:request.run_id,completion:contract.platforms.android.completion,files:[{path:file,sha256:outputDigest(file)}]};}};
  if(failing){await assert.rejects(execute('android',work,request,{stages,resourceClient}),/supply unavailable/);assert.deepEqual(seen,['requirements','supply','closed']);}
  else{await execute('android',work,request,{stages,resourceClient});assert.deepEqual(seen,['requirements','supply','prepare','requirements','supply','build','closed']);}
 }finally{removeFixture(work,{recursive:true,force:true});}}
});
test('iOS需求包含原始Pod锁摘要，供给CLI缺少专用通道不得自举下载',()=>{
 const work=sandbox();try{const plan=requirements('ios',work),pod=plan.locks.find(x=>x.ecosystem==='cocoapods');assert.equal(pod.path,'ios/Podfile.lock');assert.equal(pod.sha256,createHash('sha256').update(readFileSync(join(base,pod.path))).digest('hex'));
 const request={schema:1,product_id:contract.product_id,platform:'android',work,resource_mode:'provided'},result=spawnSync(process.execPath,[join(root,'scripts/build.mjs'),'execute','android','--work',work],{input:JSON.stringify(request),encoding:'utf8',env:{HOME:work,LANG:'C',PATH:''}});
 assert.notEqual(result.status,0);assert.match(result.stderr,/资源供给通道缺失/);assert.deepEqual(readdirSync(work),[]);
 }finally{removeFixture(work,{recursive:true,force:true});}
});


// 在真实本仓target结构内复制源码，证明不会递归复制target或写回源码；不执行工具和编译。
test('双端工程准备只允许当前target工作根的准确副本并排除整棵target',async()=>{
 for(const platform of Object.keys(contract.platforms)){
  const work=fixtureWork();
  try{
   const receipt=fixture(work);receipt.platform=platform;receipt.tools=Object.fromEntries(contract.platforms[platform].tools.map(tool=>[tool.id,{version:tool.version,path:process.execPath}]));
   if(platform==='android'){
    const flutter=join(work,'fixture-flutter/bin/flutter'),sdk=join(work,'fixture-sdk');mkdirSync(dirname(flutter),{recursive:true});mkdirSync(sdk);
    writeFixture(flutter,'#!'+process.execPath+'\n'+"import fs from 'node:fs';\nconst args=process.argv.slice(2),cwd=process.cwd();\nif(!fs.existsSync(cwd+'/android/local.properties'))throw Error('resource-before-config');\nif(args[0]==='pub'&&args.join(' ')==='pub get --offline --enforce-lockfile')fs.writeFileSync(cwd+'/.flutter-plugins-dependencies',JSON.stringify({plugins:{android:[]}}));\nelse if(!(args[0]==='config'&&args[1]?.startsWith('--build-dir=')))throw Error('unexpected-tool-operation');\nfs.appendFileSync(process.env.CITIZENWALLET_WORK_DIR+'/prepare-operations.jsonl',JSON.stringify({args,cwd,home:process.env.HOME})+String.fromCharCode(10));\n");chmodSync(flutter,0o700);receipt.tools.flutter.path=flutter;receipt.environment.ANDROID_HOME=sdk;
   }
   const source=base,destination=join(work,'source-view',source.replace(/^\/+/u,'')),before=readFileSync(join(source,'pubspec.yaml'));
   writeFixture(join(work,'must-not-copy'),'target-marker');
   assert.throws(()=>createView(source,destination),/边界/);assert.equal(existsSync(destination),false);
   await prepare(platform,work,receipt,{});
   if(platform==='android'){
    const operations=readFileSync(join(work,'prepare-operations.jsonl'),'utf8').trim().split('\n').map(JSON.parse);assert.equal(operations.length,2);assert.ok(operations.every(x=>x.cwd===destination&&x.home===work));
    assert.equal(existsSync(join(destination,'.flutter-plugins-dependencies')),true);
    const env=resourceEnvironment(platform,work,receipt,{}),properties=prepareAndroidProjectInputs(work,env);assert.match(readFileSync(properties,'utf8'),/^flutter.versionName=/mu);
    assert.throws(()=>prepareAndroidProjectInputs(work,{...env,CITIZENWALLET_PROJECT_ROOT:base}),/当前任务/);
    const sdkLink=join(work,'linked-sdk');symlinkSync(env.ANDROID_HOME,sdkLink);assert.throws(()=>prepareAndroidProjectInputs(work,{...env,ANDROID_HOME:sdkLink}),/SDK目录/);
    const pubspec=join(destination,'pubspec.yaml');writeFixture(pubspec,'version: 1.0.0+1\nversion: 2.0.0+2\n');assert.throws(()=>prepareAndroidProjectInputs(work,env),/不唯一/);writeFixture(pubspec,before);
    rmSync(pubspec);const linkedManifest=join(work,'linked-manifest');writeFixture(linkedManifest,before);symlinkSync(linkedManifest,pubspec);assert.throws(()=>prepareAndroidProjectInputs(work,env),/独占普通文件/);rmSync(pubspec);writeFixture(pubspec,before);
    const additional=join(work,'hardlink-properties');linkSync(properties,additional);assert.throws(()=>prepareAndroidProjectInputs(work,env),/漂移/);rmSync(additional);
    writeFixture(properties,'drift');assert.throws(()=>prepareAndroidProjectInputs(work,env),/漂移/);
   }
   assert.throws(()=>createView(source,join(work,'arbitrary'),work),/当前任务/);
   assert.throws(()=>createView(source,join(source,'invalid-source-output'),work),/当前任务/);
   assert.throws(()=>createView(source,destination,source),/target/);
   assert.equal(existsSync(join(destination,'target')),false);
   assert.deepEqual(readFileSync(join(destination,'pubspec.yaml')),before);
   writeFixture(join(destination,'pubspec.yaml'),'isolated-generated');
   assert.deepEqual(readFileSync(join(source,'pubspec.yaml')),before);
   assert.throws(()=>createView(source,destination,work),/已存在/);
  }finally{removeFixture(work,{recursive:true});}
 }
});

// 用实际语言解释器和Xcode目录复现同名入口冲突，成功必须加载自身标准库。
test('图标从集中原件生成双端完整尺寸且相同尺寸共用文件，源码保持只读',()=>{
 const paths=['icons/citizen-logo.png','icons/app-icon.png','icons/launch-logo.png','icons/android-launcher.png','icons/android-foreground.png'];
 const originals=paths.map(path=>readFileSync(join(root,path)));
 for(const platform of ['ios','android']){
  const work=fixtureWork(),project=join(work,'source-view',root.replace(/^\/+/u,''));
  try{
   createView(root,project,work);const output=generatePlatformIcons(project,platform);
   if(platform==='android'){
    let count=0;
    for(const [density,scale]of [['mdpi',1],['hdpi',1.5],['xhdpi',2],['xxhdpi',3],['xxxhdpi',4]]){
     const dir=join(output,'mipmap-'+density);assert.equal(readdirSync(dir).length,3);
     for(const [name,size,channels]of [['ic_launcher.png',48*scale,3],['ic_launcher_foreground.png',108*scale,4],['launch_image.png',120*scale,4]]){
      const decoded=decodePNG(readFileSync(join(dir,name)));assert.equal(decoded.width,size);assert.equal(decoded.height,size);assert.equal(decoded.channels,channels);count++;
     }
    }
    assert.equal(count,15);
    assert.match(readFileSync(join(project,'android/resources/values_icon_aliases.xml'),'utf8'),/name="ic_launcher_round">@mipmap\/ic_launcher/u);
   }else{
    for(const name of ['AppIcon.appiconset','CitizenLaunchLogo.imageset']){
     const dir=join(output,name),manifest=JSON.parse(readFileSync(join(dir,'Contents.json')));
     for(const slot of manifest.images){
      const expected=name==='AppIcon.appiconset'?Math.round(Number(slot.size.split('x')[0])*Number(slot.scale[0])):160*Number(slot.scale[0]);
      const decoded=decodePNG(readFileSync(join(dir,slot.filename)));assert.equal(decoded.width,expected);assert.equal(decoded.height,expected);
     }
     assert.equal(readdirSync(dir).filter(n=>n.endsWith('.png')).length,name==='AppIcon.appiconset'?13:3);
    }
    assert.deepEqual(readFileSync(join(output,'AppIcon.appiconset/Icon-1024.png')),originals[1]);
   }
   const first=readFileSync(join(output,platform==='ios'?'AppIcon.appiconset/Icon-40.png':'mipmap-mdpi/ic_launcher.png'));
   generatePlatformIcons(project,platform);
   assert.deepEqual(readFileSync(join(output,platform==='ios'?'AppIcon.appiconset/Icon-40.png':'mipmap-mdpi/ic_launcher.png')),first);
  }finally{removeFixture(work,{recursive:true});}
 }
 for(let i=0;i<paths.length;i++)assert.deepEqual(readFileSync(join(root,paths[i])),originals[i]);
 assert.equal(existsSync(join(root,'resources')),false);
});

test('图标缩小保留预乘透明边缘且拒绝PNG损坏和放大',()=>{
 const source={width:2,height:2,channels:4,pixels:Buffer.from([255,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0]),color:[]};
 const encoded=resizePNG(source,1),result=decodePNG(encoded);
 assert.deepEqual([...result.pixels],[255,0,0,64]);
 assert.throws(()=>resizePNG(source,3),/放大/);
 encoded[encoded.length-1]^=1;assert.throws(()=>decodePNG(encoded),/损坏/);
});

test('图标生成拒绝源码、跨平台与输出链接，不能删除链接目标',()=>{
 assert.throws(()=>generatePlatformIcons(root,'ios'),/target工程/);
 const work=fixtureWork(),project=join(work,'source-view',root.replace(/^\/+/u,''));
 try{
  createView(root,project,work);assert.throws(()=>generatePlatformIcons(join(root,'target','foreign','source-view'),'android'),/target工程/);
  const external=join(work,'protected');mkdirSync(external);writeFixture(join(external,'keep'),'keep');
  symlinkSync(external,join(project,'ios/build'));
  assert.throws(()=>generatePlatformIcons(project,'ios'),/无链接/);assert.equal(readFileSync(join(external,'keep'),'utf8'),'keep');
 }finally{removeFixture(work,{recursive:true});}
});

test('产品Python先于Xcode附带Python且配置仅归当前任务',()=>{
 const work=sandbox();try{
  const python=process.env.PRODUCT_TEST_PYTHON||process.env.PYTHON,shell=process.env.PRODUCT_TEST_SHELL||process.env.PRODUCT_BASH_BIN,xcode=process.env.PRODUCT_TEST_XCODE||process.env.XCODEBUILD;
  assert.ok(python&&shell&&xcode,'必须交付已验真Python、Shell、Xcode测试入口');
  const receipt=fixture(work);receipt.tools={xcode:receipt.tools.xcode,...receipt.tools};receipt.tools.xcode.path=xcode;
  receipt.tools.python.path=python;receipt.tools.bash.path=shell;
  const env=resourceEnvironment(receipt.platform,work,receipt,{HOME:'/user-home'});
  const result=spawnSync(shell,['-c',`exec python3 -c 'import encodings,json,os,sys;print(json.dumps(dict(executable=os.path.realpath(sys.executable),home=os.environ["HOME"])))'`],{cwd:work,env,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout),{executable:realpathSync(python),home:work});assert.equal(env.USERPROFILE,work);
 }finally{removeFixture(work,{recursive:true});}
});

// 固定工具字段只归需要它的iOS流程；控制台和独立入口使用同一产品校验。
test('xattr回执仅允许iOS的准确官方入口，其他平台和替代路径拒绝',()=>{
 const work=sandbox();try{
  const receipt=fixture(work),platform=receipt.platform;
  assert.throws(()=>resourceEnvironment(platform,work,{...receipt,environment:{XATTR:'/tmp/xattr'}}),/xattr/);
  if(platform!=='ios')assert.throws(()=>resourceEnvironment(platform,work,{...receipt,environment:{XATTR:'/usr/bin/xattr'}}),/xattr/);
  const ios=contract.platforms.ios;if(ios){const tools=Object.fromEntries(ios.tools.map(t=>[t.id,{version:t.version,path:process.execPath}]));
   const value={...receipt,platform:'ios',tools,environment:{XATTR:'/usr/bin/xattr'}};
   for(const lock of ios.locks){const key={npm:'npmCache',pub:'pubCache',cargo:'cargoHome'}[lock.ecosystem];if(key&&!value.dependencies.own[key]){value.dependencies.own[key]=join(work,key);mkdirSync(value.dependencies.own[key]);}}
   assert.equal(resourceEnvironment('ios',work,value).XATTR,'/usr/bin/xattr');
   assert.throws(()=>resourceEnvironment('ios',work,{...value,environment:{XATTR:'/usr/bin/../bin/xattr'}}),/xattr/);
  }
 }finally{removeFixture(work,{recursive:true,force:true});}
});

// 完整安装回执仍约束产品身份，App树变化仍可被原有摘要回验发现。
test('iOS无ZIP声明仍要求完整安装结果，App树字节或内部链接变化改变摘要',()=>{
 const work=sandbox();try{const app=join(work,'Runner.app');mkdirSync(app);writeFixture(join(app,'Runner'),'signed-fixture');symlinkSync('Runner',join(app,'Current'));const before=outputDigest(app);writeFixture(join(app,'Runner'),'changed');assert.notEqual(outputDigest(app),before);
 const value={schema:1,product_id:contract.product_id,platform:'ios',work,completion:'device-install',files:[]};assert.equal(checkBuildResult(value,'ios',work),value);assert.throws(()=>checkBuildResult({...value,completion:'compile-only'},'ios',work),/完成方式/);assert.throws(()=>checkBuildResult({...value,files:[{path:join(work,'ios.app.zip'),sha256:'a'.repeat(64)}]},'ios',work),/完成方式/);
 }finally{removeFixture(work,{recursive:true,force:true});}
});

test('合并构建入口输出原有分析规则且拒绝多余参数',()=>{
 const result=spawnSync(process.execPath,[import.meta.filename,'analysis-options'],{encoding:'utf8',env:{PATH:'',HOME:process.env.HOME}});
 assert.equal(result.status,0,result.stderr);
 assert.equal(result.stdout,'# 本产品独立维护的 Flutter 分析规则。\ninclude: package:flutter_lints/flutter.yaml\n\nanalyzer:\n  exclude:\n    - "**/*.g.dart"\n\nlinter:\n  rules:\n    use_build_context_synchronously: true\n');
 const invalid=spawnSync(process.execPath,[import.meta.filename,'analysis-options','extra'],{encoding:'utf8'});
 assert.equal(invalid.status,1);assert.equal(invalid.stdout,'');assert.match(invalid.stderr,/不接受参数/u);
});

test('合并索引同步入口从显式链源码更新全部Pallet与业务Call',()=>{
 const work=join(tmpdir(),'sync-input');mkdirSync(work,{recursive:true});try{
  const pairs=[['OnchainTransaction','onchainTransactionPallet'],['VotingEngine','votingEnginePallet'],
   ['CitizenIdentity','citizenIdentityPallet'],['InternalVote','internalVotePallet'],['JointVote','jointVotePallet'],
   ['MultisigTransfer','multisigTransferPallet'],['RuntimeUpgrade','runtimeUpgradePallet'],['ResolutionDestroy','resolutionDestroPallet'],
   ['GrandpaKeyChange','grandpaKeyChangePallet'],['ResolutionIssuance','resolutionIssuancePallet'],['OnchainIssuance','onchainIssuancePallet'],
   ['LegislationYuan','legislationYuanPallet'],['LegislationVote','legislationVotePallet'],['OffchainTransaction','offchainTransactionPallet'],
   ['PersonalManage','personalManagePallet'],['PersonalAdmins','personalAdminsPallet'],['PublicAdmins','publicAdminsPallet'],
   ['PrivateAdmins','privateAdminsPallet'],['PublicManage','publicManagePallet'],['PrivateManage','privateManagePallet']];
  const put=(name,source)=>{const file=join(work,name);mkdirSync(dirname(file),{recursive:true});writeFixture(file,source);return file;};
  put('citizenchain/runtime/src/lib.rs',pairs.map(([name],index)=>'#[runtime::pallet_index('+(index+31)+')]\n pub type '+name+' = Pallet;').join('\n'));
  put('citizenchain/runtime/transaction/multisig/src/lib.rs','#[pallet::call_index(7)]\n pub fn propose_transfer() {}\n');
  put('citizenchain/runtime/votingengine/joint-vote/src/lib.rs','#[pallet::call_index(8)]\n pub fn cast_admin() {}\n#[pallet::call_index(9)]\n pub fn cast_referendum() {}\n');
  const calls=[['proposeTransferCall',7],['jointVoteCall',8],['castReferendumCall',9]];
  const registry=put('citizenwallet/lib/signing/pallet_registry.dart',[...pairs.map(([,name])=>name),...calls.map(([name])=>name)].map(name=>'static const int '+name+' = 0;').join('\n')+'\n');
  const shell=process.env.PRODUCT_TEST_SHELL||process.env.PRODUCT_BASH_BIN,grep=process.env.PRODUCT_GREP_BIN,sed=process.env.PRODUCT_SED_BIN,posix=process.env.PRODUCT_TEST_POSIX_BIN;
  assert.ok(shell&&grep&&sed&&posix,'索引同步验收须交付同版Shell、GNU工具和POSIX入口');
  const env={...process.env,PRODUCT_BASH_BIN:shell,PATH:[dirname(grep),dirname(sed),posix,dirname(process.execPath)].join(':')};
  const result=spawnSync(process.execPath,[import.meta.filename,'sync',work],{encoding:'utf8',env});
  assert.equal(result.status,0,result.stderr);
  const expected=[...pairs.map(([,name],index)=>[name,index+31]),...calls].map(([name,index])=>'static const int '+name+' = '+index+';').join('\n')+'\n';
  assert.equal(readFileSync(registry,'utf8'),expected);
  const unchanged=readFileSync(registry,'utf8');rmSync(join(work,'citizenchain/runtime/src/lib.rs'));
  const missing=spawnSync(process.execPath,[import.meta.filename,'sync',work],{encoding:'utf8',env});
  assert.equal(missing.status,1);assert.match(missing.stderr,/缺少同步所需文件/u);assert.equal(readFileSync(registry,'utf8'),unchanged);
 }finally{removeFixture(work,{recursive:true,force:true});}
});
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
