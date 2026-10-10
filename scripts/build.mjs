#!/usr/bin/env node
const directEntry = process.argv[1] === import.meta.filename && !process.execArgv.some(argument => /^(?:-e|-p|--eval|--print)(?:=|$)/u.test(argument));
const inlineTestEntry = directEntry && Boolean(process.env.NODE_TEST_CONTEXT) && process.argv.length === 2;
// 本产品独立拥有资源需求、工程准备与编译；公开回执仅提供验真资源，不提供执行命令。
import {spawn,spawnSync} from 'node:child_process';
import {inflateSync,deflateSync} from 'node:zlib';
import {generatePlatformIcons} from '../icons/generate.mjs';
import {AsyncLocalStorage} from 'node:async_hooks';
import {Socket} from 'node:net';
import {rmSync,mkdtempSync,constants,fstatSync,readSync,chmodSync,closeSync,openSync,renameSync,readlinkSync,unlinkSync,copyFileSync,existsSync,lstatSync,mkdirSync,readFileSync,readdirSync,realpathSync,symlinkSync,writeFileSync} from 'node:fs';
import {basename,dirname,isAbsolute,join,parse,relative,resolve,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomBytes,X509Certificate} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const contract={
  "schema": 1,
  "product_id": "citizenwallet",
  "entry": "scripts/build.mjs",
  "platforms": {
    "ios": {
      "tools": [
        {
          "id": "git",
          "version": "2.54.0"
        },
        {
          "id": "node",
          "version": "25.2.1"
        },
        {
          "id": "flutter",
          "version": "3.47.2"
        },
        {
          "id": "python",
          "version": "3.14.3"
        },
        {
          "id": "cocoapods",
          "version": "1.17.0"
        },
        {
          "id": "xcode",
          "version": "27.0"
        },
        {
          "id": "rust",
          "version": "1.97.1"
        },
        {
          "id": "posix",
          "version": "27.0"
        },
        {
          "id": "bash",
          "version": "5.3.20"
        },
        {
          "id": "grep",
          "version": "3.12"
        },
        {
          "id": "sed",
          "version": "4.10"
        }
      ],
      "locks": [
        {
          "ecosystem": "pub",
          "path": "pubspec.lock"
        },
        {
          "ecosystem": "cargo",
          "path": "rust/Cargo.lock"
        },
        {
          "ecosystem": "cocoapods",
          "path": "ios/Podfile.lock"
        }
      ],
      "completion": "device-install",
      "files": []
    },
    "android": {
      "tools": [
        {
          "id": "cmake",
          "version": "3.31.6"
        },
        {
          "id": "git",
          "version": "2.54.0"
        },
        {
          "id": "node",
          "version": "25.2.1"
        },
        {
          "id": "flutter",
          "version": "3.47.2"
        },
        {
          "id": "python",
          "version": "3.14.3"
        },
        {
          "id": "java",
          "version": "17.0.20.1"
        },
        {
          "id": "gradle",
          "version": "9.1.0"
        },
        {
          "id": "android",
          "version": "37.0.1"
        },
        {
          "id": "android-sdk",
          "version": "22.0",
          "packages": [
            {
              "path": "platforms;android-35",
              "version": "2"
            }
          ]
        },
        {
          "id": "android-ndk",
          "version": "28.2.13676358"
        },
        {
          "id": "posix",
          "version": "27.0"
        },
        {
          "id": "rust",
          "version": "1.97.1"
        },
        {
          "id": "xcode",
          "version": "27.0"
        },
        {
          "id": "bash",
          "version": "5.3.20"
        },
        {
          "id": "grep",
          "version": "3.12"
        },
        {
          "id": "sed",
          "version": "4.10"
        }
      ],
      "locks": [
        {
          "ecosystem": "pub",
          "path": "pubspec.lock"
        },
        {
          "ecosystem": "cargo",
          "path": "rust/Cargo.lock"
        }
      ],
      "completion": "device-install",
      "files": [
        "android.apk"
      ]
    }
  },
  "resource_entry": "scripts/build.mjs"
};

// 本仓原固定工作根实现与测试归入唯一编译入口。
let resolveResourceReady;
const resourceReady=new Promise(resolve=>{resolveResourceReady=resolve;});
const targetInternals=await (async declaredProduct=>{
// 本产品的固定工作根与占用生命周期；不访问邻仓或调用方临时目录。
const fs=(await import('node:fs')).default;
const {dirname, join, resolve, parse, relative, sep}=await import('node:path');
const {fileURLToPath, pathToFileURL}=await import('node:url');
const {randomUUID}=await import('node:crypto');
const {AsyncLocalStorage}=await import('node:async_hooks');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const product=declaredProduct;
const sessions=new AsyncLocalStorage();
const scopes=new Set(['build','test']);
const fail=message=>{throw Error(product+' target：'+message);};
function fixedWork(scope){
 if(scope==='build'||scope==='test')return join(root,'target',scope);
 if(typeof scope==='string'&&scope.startsWith('build/')){
  const platform=scope.slice(6);if(Object.hasOwn(contract.platforms,platform))return join(root,'target/build',platform);
 }
 fail('工作根用途无效');
}
function isBuildWork(work){return typeof work==='string'&&Object.keys(contract.platforms).some(platform=>work===fixedWork('build/'+platform));}
function validWork(work){return work===fixedWork('test')||isBuildWork(work);}
function directory(path,create=false){
 let at=parse(path).root;
 for(const part of relative(at,path).split(sep)){
  at=join(at,part);
  if(create&&!fs.existsSync(at))try{fs.mkdirSync(at,{mode:0o700});}catch(error){if(error.code!=='EEXIST')throw error;}
  const value=fs.lstatSync(at);if(!value.isDirectory()||value.isSymbolicLink()||fs.realpathSync(at)!==at)fail('工作目录经过链接或非目录');
 }
 return fs.lstatSync(path);
}
function checkFixedWork(work,{create=false}={}){
 if(typeof work!=='string'||!validWork(work))fail('工作根只允许本产品target/build或target/test固定目录');
 directory(work,create);return work;
}
function checkScratchPath(path){
 if(typeof path!=='string'||resolve(path)!==path||![fixedWork('test'),...Object.keys(contract.platforms).map(platform=>fixedWork('build/'+platform))].some(work=>path===work||path.startsWith(work+sep)))fail('内部物化目录越出本产品固定工作根');
 directory(path);return path;
}
function fixedScratch(prefix){
 const path=resolve(prefix.replace(/-$/,''));checkScratchPath(dirname(path));
 fs.mkdirSync(path,{mode:0o700});return directory(path)&&path;
}
function assertTargetTopology(){
 const target=join(root,'target');if(!fs.existsSync(target))return;
 directory(target);
 for(const name of fs.readdirSync(target))if(!scopes.has(name))fail('target含非固定目录或根部生成文件：'+name);
 for(const name of fs.readdirSync(target))directory(join(target,name));
}
function regular(path){const value=fs.lstatSync(path);if(!value.isFile()||value.isSymbolicLink()||value.nlink!==1||value.size>65536)fail('任务标记不是准确普通文件');return value;}
function readOwner(work){const path=join(work,'.active.json');if(!fs.existsSync(path))return null;regular(path);let value;try{value=JSON.parse(fs.readFileSync(path,'utf8'));}catch{fail('任务标记损坏，禁止清场');}
 if(value.schema!==1||value.product_id!==product||value.work!==work||!Number.isSafeInteger(value.pid)||value.pid<1||typeof value.nonce!=='string'||!Array.isArray(value.groups)||!value.groups.every(pid=>Number.isSafeInteger(pid)&&pid>1))fail('任务标记身份无效');return value;
}
function alive(pid,group=false){try{process.kill(group&&process.platform!=='win32'?-pid:pid,0);return true;}catch(error){if(error.code==='ESRCH')return false;return true;}}
function writeOwner(owner){regular(join(owner.work,'.active.json'));fs.writeFileSync(join(owner.work,'.active.json'),JSON.stringify(owner)+'\n',{mode:0o600});}
function writable(path){const value=fs.lstatSync(path);if(value.isDirectory()&&!value.isSymbolicLink()){if(fs.realpathSync(path)!==path)fail('清理路径漂移');fs.chmodSync(path,value.mode|0o700);for(const name of fs.readdirSync(path))writable(join(path,name));}}
function removeTree(path){
 const state=fs.lstatSync(path);
 if(state.isSymbolicLink()){fs.unlinkSync(path);return;}
 if(state.isDirectory()){if(fs.realpathSync(path)!==path)fail('清理目录漂移');fs.chmodSync(path,state.mode|0o700);for(const name of fs.readdirSync(path))removeTree(join(path,name));fs.rmdirSync(path);return;}
 fs.unlinkSync(path);
}
// 清场由本产品确认资源供给与配方后代已经退出。
function assertSupplyExited(work){
 for(const name of ['.supply-active.json','.resource-active.json']){
  const file=join(work,name);if(!fs.existsSync(file))continue;regular(file);const record=JSON.parse(fs.readFileSync(file,'utf8'));
  if(!Number.isSafeInteger(record.pid)||record.pid<2||!Array.isArray(record.groups)||record.groups.some(pid=>!Number.isSafeInteger(pid)||pid<2))fail('资源退出记录无效');
  if((record.pid!==process.pid&&alive(record.pid))||record.groups.some(pid=>alive(pid,true)))fail('资源工具退出未确认');
 }
}
function empty(work,keep=[]){
 assertSupplyExited(work);
 const before=directory(work);
 for(const name of fs.readdirSync(work)){if(keep.includes(name))continue;const path=join(work,name);removeTree(path);}
 const after=directory(work);if(before.dev!==after.dev||before.ino!==after.ino||fs.readdirSync(work).some(name=>!keep.includes(name)))fail('固定工作目录未完全清空或被替换');
}
function short(work,action){const path=isBuildWork(work)?join(fixedWork('build'),'.claim-'+relative(fixedWork('build'),work)):join(work,'.claim.lock');try{fs.mkdirSync(path,{mode:0o700});}catch(error){if(error.code!=='EEXIST')throw error;
 const record=join(path,'owner.json');let holder=null;
 if(fs.existsSync(record)){regular(record);try{holder=JSON.parse(fs.readFileSync(record,'utf8'));}catch{fail('领取锁损坏');}}
 const active=readOwner(work);
 if(holder?(holder.work!==work||!Number.isSafeInteger(holder.pid)||alive(holder.pid)):(Date.now()-fs.lstatSync(path).mtimeMs<30000))fail('固定工作目录正在领取或收尾');
 if(active&&(alive(active.pid)||active.groups.some(pid=>alive(pid,true))))fail('固定工作目录仍有活跃进程');
 writable(path);fs.rmSync(path,{recursive:true});fs.mkdirSync(path,{mode:0o700});}
 fs.writeFileSync(join(path,'owner.json'),JSON.stringify({pid:process.pid,work})+'\n',{flag:'wx',mode:0o600});
 const before=directory(path);try{return action();}finally{const after=directory(path);if(before.dev!==after.dev||before.ino!==after.ino)fail('领取锁漂移');fs.unlinkSync(join(path,'owner.json'));fs.rmdirSync(path);}}
function clearFixedWork(work){
 checkFixedWork(work);const session=sessions.getStore(),owner=readOwner(work);
 if(owner&&!(owner.state==='retained'&&owner.pid===process.pid)&&(!session||session.owner.work!==work||session.owner.nonce!==owner.nonce))fail('固定工作目录属于其他活跃任务');
 if(owner&&owner.groups.some(pid=>alive(pid,true)))fail('工具后代退出未确认，禁止清场');
 if(fs.existsSync(join(work,'.product-build.lock')))fail('产品编译进程仍持有守卫，禁止清场');
 const value=short(work,()=>{empty(work,owner&&!(owner.state==='retained'&&owner.pid===process.pid)?['.active.json','.claim.lock']:['.claim.lock']);if(isBuildWork(work)&&fs.readdirSync(work).length===0)fs.rmdirSync(work);});return value;
}
function remoteIdentity(env){return env.GITHUB_ACTIONS==='true'&&env.GITHUB_REPOSITORY?.split('/')[1]===product&&env.GITHUB_RUN_ID&&env.GITHUB_RUN_ATTEMPT?env.GITHUB_RUN_ID+':'+env.GITHUB_RUN_ATTEMPT+':'+env.GITHUB_JOB:null;}
function claimFixedWork(scope,{environment=process.env,retain=false,run_id}={}){
 const work=checkFixedWork(fixedWork(scope),{create:true}),remote=remoteIdentity(environment),current=sessions.getStore();
 if(current?.owner.work===work){if(run_id){const owner=readOwner(work);if(owner?.nonce!==current.owner.nonce||owner.run_id&&owner.run_id!==run_id)fail('编译任务编号不一致');owner.run_id=run_id;writeOwner(owner);current.owner=owner;}return {...current,nested:true};}
 const token=environment.PRODUCT_WORK_LEASE;
 return short(work,()=>{
  const previous=readOwner(work);
  if(previous){
   if(token===previous.nonce&&alive(previous.pid))return {owner:previous,nested:true,retain};
   if(previous.groups.some(pid=>alive(pid,true)))fail('上轮工具进程仍运行，禁止领取');
   if(previous.state==='retained')fail('结果尚未由调用方消费，禁止覆盖');
   if(remote&&previous.remote===remote&&!alive(previous.pid)){
    const owner={...previous,pid:process.pid,state:'running',groups:[],nonce:randomUUID()};writeOwner(owner);return {owner,retain:true};
   }
   if(alive(previous.pid))fail('固定工作目录已有活跃任务');
  }
  if(fs.existsSync(join(work,'.product-build.lock')))fail('产品守卫尚未释放，禁止覆盖');
  empty(work,['.claim.lock']);
  const owner={schema:1,product_id:product,work,pid:process.pid,nonce:randomUUID(),groups:[],state:'running',remote,...(run_id?{run_id}:{})};
  fs.writeFileSync(join(work,'.active.json'),JSON.stringify(owner)+'\n',{flag:'wx',mode:0o600});return {owner,retain};
 });
}
function trackFixedProcess(work,pid){
 if(!pid||!validWork(work))return;
 const owner=readOwner(work);if(!owner)return;
 if(owner.pid!==process.pid&&!(alive(owner.pid)&&process.env.PRODUCT_WORK_LEASE===owner.nonce))fail('工具进程不能写入其他任务');
 if(!owner.groups.includes(pid)){owner.groups.push(pid);writeOwner(owner);}
}
function trackWorkProcess(pid){
 const session=sessions.getStore();if(!session||!pid)return;
 const owner=readOwner(session.owner.work);if(owner?.nonce!==session.owner.nonce)fail('任务所有权漂移');
 if(!owner.groups.includes(pid)){owner.groups.push(pid);writeOwner(owner);}
}
function workEnvironment(environment=process.env){
 const session=sessions.getStore();if(!session)return environment;
 const work=session.owner.work,result={...environment,PRODUCT_WORK_LEASE:session.owner.nonce};
 for(const [key,name]of Object.entries({TMPDIR:'tmp',TMP:'tmp',TEMP:'tmp',CARGO_TARGET_DIR:'cargo',CARGO_HOME:'dependencies/cargo-home',npm_config_cache:'dependencies/npm',PUB_CACHE:'dependencies/pub',GRADLE_USER_HOME:'dependencies/gradle',XDG_CACHE_HOME:'cache',XDG_CONFIG_HOME:'config',CLANG_MODULE_CACHE_PATH:'cache/clang',SWIFT_MODULECACHE_PATH:'cache/swift'})){
  const supplied=result[key];
  if(supplied!==undefined&&typeof supplied!=='string')fail('可写环境目录无效：'+key);
  const local=supplied&&(resolve(supplied)===work||resolve(supplied).startsWith(work+sep));
  result[key]=local?supplied:join(work,name);directory(resolve(result[key]),true);
 }
 return result;
}
function retainWork(){const session=sessions.getStore();if(!session)fail('缺少当前任务');session.retain=true;}
function releaseFixedWork(session,{unsafe=false}={}){
 if(session.nested)return;
 const work=session.owner.work;
 const value=short(work,()=>{
  const owner=readOwner(work);if(owner?.nonce!==session.owner.nonce)fail('任务所有权漂移');
  const groups=owner.groups.filter(pid=>alive(pid,true));
  if(unsafe||groups.length){writeOwner({...owner,groups,state:'unsafe'});fail('工具后代退出未确认，保留守卫并禁止任务完成');}
  if(session.retain){writeOwner({...owner,groups:[],state:owner.remote?'remote':'retained'});return;}
  if(fs.existsSync(join(work,'.product-build.lock')))fail('产品编译守卫未释放，禁止完成');
  empty(work,['.claim.lock']);if(isBuildWork(work))fs.rmdirSync(work);
 });return value;
}
function withFixedWorkSync(scope,action,options={}){
 const session=claimFixedWork(scope,options);let unsafe=false;
 try{return sessions.run(session,()=>action(session.owner.work,session));}
 catch(error){unsafe=String(error?.message).includes('退出未确认');throw error;}
 finally{releaseFixedWork(session,{unsafe});}
}
async function withFixedWork(scope,action,options={}){
 const session=claimFixedWork(scope,options);let unsafe=false;
 try{return await sessions.run(session,()=>action(session.owner.work,session));}
 catch(error){unsafe=String(error?.message).includes('退出未确认');throw error;}
 finally{releaseFixedWork(session,{unsafe});}
}
// 调用方在消费结果且产品进程退出后，只能收尾这个产品的准确固定目录。
function finishFixedWork(work,{run_id,forceRemote=false}={}){
 if(run_id&&validWork(work)&&!fs.existsSync(work))return;
 checkFixedWork(work);
 const value=short(work,()=>{
  const owner=readOwner(work);if(run_id&&!owner)return;if(run_id&&!owner.remote&&owner.run_id!==run_id)fail('编译收尾任务编号不一致');if(owner){
   if((alive(owner.pid)&&!(owner.pid===process.pid&&owner.state==='retained'))||owner.groups.some(pid=>alive(pid,true)))fail('产品进程退出未确认');
   if(owner.remote&&!forceRemote&&owner.remote!==remoteIdentity(process.env))fail('远端任务身份不符');
  }
  if(fs.existsSync(join(work,'.product-build.lock')))fail('产品守卫尚未释放');
  if(run_id&&fs.existsSync(join(work,'build-result.json'))){regular(join(work,'build-result.json'));if(JSON.parse(fs.readFileSync(join(work,'build-result.json'),'utf8')).run_id!==run_id)fail('结果任务编号不符');}
  empty(work,['.claim.lock']);if(isBuildWork(work))fs.rmdirSync(work);
 });return value;
}
function taskScope(work){checkFixedWork(work);return work===fixedWork('test')?'test':'build/'+relative(fixedWork('build'),work);}

// 内嵌测试：正式实现之后，仅由 node --test 直接运行本文件时注册。
if (process.env.NODE_TEST_CONTEXT && process.argv.length === 2 && !process.execArgv.some(value=>/^(?:-e|--eval(?:=|$)|--input-type(?:=|$))/u.test(value)) && process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL((await import('node:path')).resolve(process.argv[1])).href) {
// 本产品真实固定目录入口的领取、并发拒绝、失败收尾与恢复验收。
const {default:test} = await import('node:test');
const {default:assert} = await import('node:assert/strict');
const {default:fs} = await import('node:fs');
const {join} = await import('node:path');
const {execFileSync} = await import('node:child_process');

const root=join(import.meta.dirname,'..');
const isEmpty=()=>assert.deepEqual(fs.readdirSync(fixedWork('test')),[]);

// 各平台并发领取自己的工作根，正常退出后只删除本平台目录。
test('平台编译现场独立领取且结束删除',async()=>{
 const platforms=Object.keys(contract.platforms).slice(0,2),joined=[];let release;const both=new Promise(resolve=>{release=resolve;});
 await Promise.all(platforms.map(platform=>withFixedWork('build/'+platform,async work=>{
  fs.writeFileSync(join(work,'platform'),platform);joined.push(platform);if(joined.length===platforms.length)release();
  await both;assert.equal(fs.readFileSync(join(work,'platform'),'utf8'),platform);
 })));
 assert.deepEqual(joined.sort(),platforms.sort());for(const platform of platforms)assert.equal(fs.existsSync(fixedWork('build/'+platform)),false);
});
test('调度回执收尾只删除当前钱包平台目录',async()=>{
 const ios=fixedWork('build/ios'),android=fixedWork('build/android');
 await withFixedWork('build/ios',async work=>fs.writeFileSync(join(work,'fixture'),'ios'),{retain:true,run_id:'123456789'});
 await withFixedWork('build/android',async work=>fs.writeFileSync(join(work,'fixture'),'android'),{retain:true,run_id:'223456789'});
 finishFixedWork(ios,{run_id:'123456789'});
 assert.equal(fs.existsSync(ios),false);assert.equal(fs.readFileSync(join(android,'fixture'),'utf8'),'android');
 finishFixedWork(android,{run_id:'223456789'});assert.equal(fs.existsSync(android),false);
});
test('同平台第二个进程立即拒绝，另一个平台可同时执行',async()=>{
 const module=join(import.meta.dirname,'build.mjs');
 await withFixedWork('build/ios',async ios=>{
  const code='import {withFixedWork} from '+JSON.stringify(module)+';await withFixedWork("build/ios",()=>{});';
  assert.throws(()=>execFileSync(process.execPath,['--input-type=module','-e',code],{env:{PATH:process.env.PATH},stdio:['ignore','pipe','pipe']}),/领取|活跃/);
  await withFixedWork('build/android',async android=>{assert.notEqual(android,ios);fs.writeFileSync(join(android,'fixture'),'android');});
  assert.equal(fs.readFileSync(join(ios,'.active.json'),'utf8').includes('ios'),true);
 });
 assert.equal(fs.existsSync(fixedWork('build/ios')),false);assert.equal(fs.existsSync(fixedWork('build/android')),false);
});

test('固定根拒绝任意任务目录、平台目录和外部临时根',()=>{
 for(const path of [join(root,'target'),join(root,'target/test/other'),join(root,'target/macos/test'),join(root,'target/build/run-123'),'/tmp/test'])assert.throws(()=>checkFixedWork(path),/固定目录/);
});
test('成功入口清空全部现场并保留固定目录',async()=>{
 await withFixedWork('test',async work=>{fs.mkdirSync(join(work,'dependencies'));fs.writeFileSync(join(work,'dependencies/fixture'),'input');fs.chmodSync(join(work,'dependencies'),0o555);});isEmpty();assertTargetTopology();
});
test('失败入口同样清空，不由测试代替被测入口清理',async()=>{
 await assert.rejects(withFixedWork('test',async work=>{fs.writeFileSync(join(work,'partial'),'partial');throw Error('synthetic failure');}),/synthetic failure/);isEmpty();
});
test('第二个真实进程不能领取活跃固定根或清理前一任务',async()=>{
 await withFixedWork('test',async work=>{
  fs.writeFileSync(join(work,'sentinel'),'owned');
  const module=join(import.meta.dirname,'build.mjs');
  assert.throws(()=>execFileSync(process.execPath,['--input-type=module','-e','import {withFixedWork} from '+JSON.stringify(module)+'; await withFixedWork("test",()=>{});'],{env:{PATH:process.env.PATH},stdio:['ignore','pipe','pipe']}),/活跃任务/);
  assert.equal(fs.readFileSync(join(work,'sentinel'),'utf8'),'owned');
 });isEmpty();
});
test('活跃标记损坏时拒绝覆盖和清理',async()=>{
 await withFixedWork('test',async work=>{const path=join(work,'.active.json'),bytes=fs.readFileSync(path);fs.writeFileSync(path,'{}');try{assert.throws(()=>finishFixedWork(work),/身份无效/);}finally{fs.writeFileSync(path,bytes);}});isEmpty();
});
test('嵌套内部步骤使用同一个任务，外层结束才清空',async()=>{
 await withFixedWork('test',async work=>{await withFixedWork('test',async inner=>{assert.equal(inner,work);fs.writeFileSync(join(work,'nested'),'owned');});assert.equal(fs.readFileSync(join(work,'nested'),'utf8'),'owned');});isEmpty();
});

test('真实工具超时和取消后停止进程组并清场',async()=>{
 const {runResourceProcess}=await resourceReady;
 const run=(work,signal,timeout)=>runResourceProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{cwd:work,env:{PATH:process.env.PATH,PRODUCT_WORK_DIR:work},signal,timeout});
 for(const kind of ['timeout','cancel']){await assert.rejects(withFixedWork('test',async work=>{fs.writeFileSync(join(work,'partial'),'partial');const abort=new AbortController();const timer=kind==='cancel'?setTimeout(()=>abort.abort(Error('synthetic cancel')),50):null;try{await run(work,abort.signal,kind==='timeout'?50:10000);}finally{clearTimeout(timer);}}),/超时|取消|synthetic cancel|失败/);isEmpty();}
});

test('清场删除断开的链接且不跟随链接删除其它固定根',async()=>{
 await withFixedWork('test',async testWork=>{const keep=join(testWork,'keep');fs.writeFileSync(keep,'protected');await withFixedWork('build/'+Object.keys(contract.platforms)[0],async buildWork=>{fs.symlinkSync(keep,join(buildWork,'external'));fs.symlinkSync(join(buildWork,'missing'),join(buildWork,'broken'));});assert.equal(fs.readFileSync(keep,'utf8'),'protected');assert.equal(fs.existsSync(fixedWork('build/'+Object.keys(contract.platforms)[0])),false);});isEmpty();
});

test('实际任务被强制终止后下一轮在同一固定根恢复并清场',async()=>{
 const {spawn}=await import('node:child_process');
 const module=join(import.meta.dirname,'build.mjs');
 const code='import {withFixedWork} from '+JSON.stringify(module)+';import fs from "node:fs";await withFixedWork("test",async work=>{fs.writeFileSync(work+"/interrupted","partial");process.stdout.write("ready");await new Promise(()=>{setInterval(()=>{},1000);});});';
 const child=spawn(process.execPath,['--input-type=module','-e',code],{env:{PATH:process.env.PATH},stdio:['ignore','pipe','pipe']});
 const finished=new Promise(resolve=>child.once('close',(code,signal)=>resolve({code,signal})));
 try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('任务领取超时')),5000);child.once('error',reject);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});});child.kill('SIGKILL');assert.equal((await finished).signal,'SIGKILL');
  assert.equal(fs.readFileSync(join(fixedWork('test'),'interrupted'),'utf8'),'partial');
  await withFixedWork('test',async work=>{assert.equal(fs.existsSync(join(work,'interrupted')),false);fs.writeFileSync(join(work,'next'),'new task');});isEmpty();
 }finally{child.kill('SIGKILL');await finished;}
});

}

// 本产品收尾拒绝异任务与仍存活的资源后代。
if(process.env.NODE_TEST_CONTEXT&&process.argv.length===2&&process.argv[1]===import.meta.filename){
 const {test}=await import('node:test'),{default:assert}=await import('node:assert/strict'),{spawn}=await import('node:child_process');
 test('收尾必须匹配本轮编号并等待资源后代退出',async()=>{
  const work=fixedWork('test');await withFixedWork('test',()=>withFixedWork('test',async()=>{fs.writeFileSync(join(work,'keep'),'owned');},{run_id:'owned-run'}),{retain:true});
  assert.throws(()=>finishFixedWork(work,{run_id:'other-run'}),/任务编号/);assert.equal(fs.readFileSync(join(work,'keep'),'utf8'),'owned');
  const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{detached:true,stdio:'ignore'}),closed=new Promise(resolve=>child.once('close',resolve));
  const marker=join(work,'.supply-active.json');fs.writeFileSync(marker,JSON.stringify({pid:process.pid,groups:[child.pid]}));
  try{assert.throws(()=>finishFixedWork(work,{run_id:'owned-run'}),/退出未确认/);assert.equal(fs.readFileSync(join(work,'keep'),'utf8'),'owned');}
  finally{process.kill(-child.pid,'SIGTERM');await closed;fs.writeFileSync(marker,JSON.stringify({pid:process.pid,groups:[]}));finishFixedWork(work,{run_id:'owned-run'});}
  assert.deepEqual(fs.readdirSync(work),[]);
 });
}

return {fixedWork,checkFixedWork,checkScratchPath,fixedScratch,assertTargetTopology,clearFixedWork,claimFixedWork,trackFixedProcess,trackWorkProcess,workEnvironment,retainWork,releaseFixedWork,withFixedWorkSync,withFixedWork,finishFixedWork,taskScope};
})(contract.product_id);
export const {fixedWork,checkFixedWork,checkScratchPath,fixedScratch,assertTargetTopology,clearFixedWork,claimFixedWork,trackFixedProcess,trackWorkProcess,workEnvironment,retainWork,releaseFixedWork,withFixedWorkSync,withFixedWork,finishFixedWork,taskScope}=targetInternals;
export const finishBuild=finishFixedWork;

// 本仓原资源配方与测试归入同一编译入口，供独立执行和控制台供给复用。
const resourceInternals=await (async()=>{
const {fixedScratch}=targetInternals;
const {trackWorkProcess, workEnvironment, checkScratchPath}=targetInternals;
const directEntry = process.argv[1] === import.meta.filename && !process.execArgv.some(argument => /^(?:-e|-p|--eval|--print)(?:=|$)/u.test(argument));
const inlineTestEntry = directEntry && Boolean(process.env.NODE_TEST_CONTEXT) && process.argv.length === 2;
// 产品拥有资源需求和准备配方；独立执行自行获取，明确供给模式由宿主准备保存并交付。
const {AsyncLocalStorage}=await import('node:async_hooks');
const {writeFileSync: writeGroupRecord}=await import('node:fs');
const supplyGroups=new Map();
const {createHash, randomUUID}=await import('node:crypto');
const {existsSync, readFileSync, realpathSync, lstatSync, readdirSync, constants}=await import('node:fs');
const {lstat, realpath, readdir, readlink, symlink, copyFile, readFile, writeFile, mkdir, mkdtemp, rename, rm: removeResourcePath, chmod, open}=await import('node:fs/promises');
const {dirname, join, resolve, relative, isAbsolute, sep, parse, win32, posix}=await import('node:path');
const {fileURLToPath, pathToFileURL}=await import('node:url');
const {homedir}=await import('node:os');
const {gunzipSync, inflateRawSync}=await import('node:zlib');
const {spawn}=await import('node:child_process');
const {createRequire}=await import('node:module');
const exec=runResourceProcess,execute=exec;
// 工具返回只在主进程和整组后代退出后完成；未确认的输入目录禁止后续清理或改权限。
const retainedResourceRoots=new Set();
function retainedResourcePath(path) {
 const value=resolve(String(path));
 return [...retainedResourceRoots].some(root=>value===root||value.startsWith(root+sep)||root.startsWith(value+sep));
}
async function rm(path,options) {
 if(retainedResourcePath(path))throw Error('资源工具退出未确认，保留工作目录');
 return removeResourcePath(path,options);
}
function runResourceProcess(command,args,{signal,maxBuffer=8*1024**2,timeout=3600000,encoding='utf8',quietOutput=false,...options}={}) {
 const supplied=resourceSupplies.getStore();if(supplied&&!supplied.preparingTool){if(typeof supplied.runCommand!=='function')fail('供给未交付执行能力');return supplied.runCommand(command,args,{...options,maxBuffer,timeout,encoding,quietOutput,signal});}

 signal?.throwIfAborted();
 if(!Number.isSafeInteger(maxBuffer)||maxBuffer<=0||!Number.isSafeInteger(timeout)||timeout<=0)throw Error('资源进程边界参数无效');
 return new Promise((ok,reject)=>{
  const child=spawn(command,args,{...options,env:workEnvironment(options.env),detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
  trackWorkProcess(child.pid);
  const supply=resourceSupplies.getStore(),groups=supply?.work?(supplyGroups.get(supply.work)||new Set()):null;
  const record=()=>{if(groups)writeGroupRecord(join(supply.work,'.resource-active.json'),JSON.stringify({pid:process.pid,groups:[...groups]})+'\n');};
  if(groups&&Number.isSafeInteger(child.pid)){supplyGroups.set(supply.work,groups);groups.add(child.pid);record();}
  const output=[],errors=[];let bytes=0,done=false,closed=false,failure=null,probe=null,force=null,limit=null;
  const groupExists=()=>{
   if(process.platform==='win32')return !closed;
   if(!child.pid)return false;
   try{process.kill(-child.pid,0);return true;}catch(error){if(error.code==='ESRCH')return false;return true;}
  };
  const stop=hard=>{
   if(!child.pid)return;
   // 进程组已接收信号时立即返回，禁止同轮再次向组内主进程发送相同信号。
   if(process.platform!=='win32')try{process.kill(-child.pid,hard?'SIGKILL':'SIGTERM');return;}catch(error){if(error.code!=='ESRCH'){failure=Error('资源工具取消无法确认');return;}}
   if(!closed)try{child.kill(hard?'SIGKILL':'SIGTERM');}catch{failure=Error('资源工具取消无法确认');}
  };
  const finish=(error,result)=>{
   if(done)return;done=true;if(groups&&closed&&!groupExists()){groups.delete(child.pid);record();}clearTimeout(timer);clearTimeout(force);clearTimeout(limit);clearTimeout(probe);signal?.removeEventListener('abort',cancel);
   error?reject(error):ok(result);
  };
  const retain=()=>{
   for(const path of [options.cwd,options.env?.PRODUCT_WORK_DIR])if(typeof path==='string'&&isAbsolute(path))retainedResourceRoots.add(resolve(path));
   finish(Error('资源工具退出未确认，保留工作目录'));
  };
  const confirm=()=>{
   if(done)return;
   if(closed&&!groupExists()) {
    const stdout=Buffer.concat(output),stderr=Buffer.concat(errors);
    finish(failure,{stdout:encoding==='buffer'?stdout:stdout.toString(encoding),stderr:encoding==='buffer'?stderr:stderr.toString(encoding)});return;
   }
   probe=setTimeout(confirm,50);
  };
  const requestStop=error=>{
   if(done||force!==null)return;failure=error;stop(false);
   force=setTimeout(()=>stop(true),8000);limit=setTimeout(retain,12000);
   if(probe===null)confirm();
  };
  const cancel=()=>requestStop(signal.reason instanceof Error?signal.reason:Error('资源进程已取消'));
  const timer=setTimeout(()=>requestStop(Error('资源进程超时')),timeout);
  signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  for(const [stream,parts]of [[child.stdout,output],[child.stderr,errors]])stream.on('data',chunk=>{
   if(done)return;bytes+=chunk.length;
   if(bytes>maxBuffer){requestStop(Error('资源进程输出超限'));return;}
   parts.push(chunk);if(!quietOutput)process.stderr.write(chunk);
  });
  child.once('error',()=>{if(!child.pid){closed=true;finish(Error('资源工具无法启动'));}else requestStop(Error('资源工具进程错误'));});
  child.once('close',(code,termination)=>{
   closed=true;
   if(!failure&&(code!==0||termination))failure=Error('资源工具失败');
   if(groupExists())requestStop(failure||Error('资源工具后代未结束'));
   if(probe===null)confirm();
  });
 });
}
const resourceSupplies=new AsyncLocalStorage();
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fail=message=>{throw Error('产品资源：'+message);};
const safePath=value=>typeof value==='string'&&value.length>0&&!isAbsolute(value)&&!/[\\\x00-\x1f]/u.test(value)&&value.split('/').every(x=>x&&x!=='.'&&x!=='..');
const inside=(base,path)=>path.startsWith(base+sep);
const stat=async path=>lstat(path).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
async function regular(path){const s=await lstat(path);if(!s.isFile()||s.isSymbolicLink()||s.nlink!==1||await realpath(path)!==path)fail('非独占普通文件：'+path);return s;}
async function directory(path,create=false){if(!isAbsolute(path)||resolve(path)!==path||path===parse(path).root)fail('目录不是准确绝对路径');let at=parse(path).root;for(const name of relative(at,path).split(sep)){at=join(at,name);if(create&&!await stat(at))await mkdir(at,{mode:0o700}).catch(e=>{if(e.code!=='EEXIST')throw e;});const s=await lstat(at);if(!s.isDirectory()||s.isSymbolicLink()||await realpath(at)!==at)fail('目录经过链接或特殊项：'+at);}return path;}
// 普通资源清单保持独占文件要求；工具内部硬链接只由同一扫描器的私有验真现场核对。
async function inventory(base,path=base){return inventoryFiles(base,path);}
function inventoryStatMatches(before,after){
 return ['dev','ino','nlink','mode','uid','gid','size','mtimeMs','ctimeMs','birthtimeMs'].every(key=>before[key]===after[key]);
}
async function inventoryFiles(base,path,toolScan){
 if(toolScan){
  const info=await lstat(path);
  if(!info.isDirectory()||info.isSymbolicLink()||await realpath(path)!==path)fail('工具原件目录边界无效');
  toolScan.entries.push({path,info});
 }
 const files=[];
 for(const name of (await readdir(path)).sort()){
  const file=join(path,name),s=await lstat(file),key=relative(base,file),entry={path:file,info:s};
  if(s.isSymbolicLink()){
   const target=relative(base,await realpath(file));if(!safePath(target))fail('链接越界');
   entry.target=target;files.push({path:key,target});
  }else if(s.isDirectory())files.push({path:key,directory:true},...await inventoryFiles(base,file,toolScan));
  else if(s.isFile()){
   let bytes;
   if(toolScan){
    if(!safePath(key)||await realpath(file)!==file)fail('工具原件文件边界无效');
    const id=s.dev+':'+s.ino;let group=toolScan.hardlinks.get(id);
    if(!group)toolScan.hardlinks.set(id,group={nlink:s.nlink,paths:[]});
    if(group.nlink!==s.nlink)fail('工具清单读取期间硬链接计数变化');
    group.paths.push(file);
    // 不跟随末级链接；打开和读取后均核对同一文件身份，禁止替换或改权限后继续验真。
    const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW);
    try{
     if(!inventoryStatMatches(s,await handle.stat()))fail('工具清单读取期间文件变化');
     bytes=await handle.readFile();
     if(!inventoryStatMatches(s,await handle.stat()))fail('工具清单读取期间文件变化');
    }finally{await handle.close();}
   }else{
    if(s.nlink!==1)fail('共享硬链接');bytes=await readFile(file);
   }
   files.push({path:key,sha256:hash(bytes),executable:Boolean(s.mode&0o111)});
  }else fail('特殊文件');
  if(toolScan&&!s.isDirectory())toolScan.entries.push(entry);
 }
 return files;
}
async function permissions(path,writable){
 if(retainedResourcePath(path))throw Error('资源工具退出未确认，保留工作目录');const s=await lstat(path);if(s.isSymbolicLink())return;if(s.isDirectory()){if(writable)await chmod(path,0o700);for(const name of await readdir(path))await permissions(join(path,name),writable);if(!writable)await chmod(path,0o555);}else await chmod(path,writable?0o600:s.mode&0o111?0o555:0o444);}
function checkedURL(input){const url=new URL(input);if(url.protocol!=='https:'||url.username||url.password||url.hash)fail('来源必须是无凭据HTTPS');return url.href;}
function digestSpec(entry){if(entry.sha256&&/^[a-f0-9]{64}$/u.test(entry.sha256))return ['sha256',Buffer.from(entry.sha256,'hex')];const m=/^(sha256|sha512)-([A-Za-z0-9+/]+={0,2})$/u.exec(entry.integrity||'');if(!m)fail('来源缺少锁定摘要');const b=Buffer.from(m[2],'base64');if(b.toString('base64')!==m[2]||b.length!==({sha256:32,sha512:64}[m[1]]))fail('完整性不是规范摘要');return [m[1],b];}
function verifyBytes(bytes,entry){const [algorithm,digest]=digestSpec(entry);if(!createHash(algorithm).update(bytes).digest().equals(digest))fail('锁定来源摘要不符');return hash(bytes);}
// 不持下载锁。每个候选独占生成，提交使用同对象短锁与排他重命名，竞争者核验同一字节。
// 候选下载、解包和编译归本产品当前target现场；永久原件只在验真提交后接收。
async function resourceWork(work) {
 const owner=await import('./build.mjs');const path=work||owner.temporaryRoot(undefined,'tmp');
 checkScratchPath(path);return directory(join(path,'resource-pending'),true);
}
async function acquireArchive(entry,{store,work,optional,offline=false,fetcher=fetch,signal,maxBytes=4*1024**3}={}){
 const url=checkedURL(entry.url);digestSpec(entry);
 const supplied=resourceSupplies.getStore();if(supplied)return supplied.acquireOriginal(entry,{kind:store===join(supplied.toolRoot,'archives')?'tool':'dependency',offline,signal,maxBytes});
 await directory(store,true);const coordinate=hash(JSON.stringify([url,entry.sha256||entry.integrity]));const target=join(store,coordinate+'.blob');
 const check=async path=>{await regular(path);const b=await readFile(path);if(!b.length||b.length>maxBytes)fail('原件大小超限');verifyBytes(b,entry);return path;};
 if(await stat(target))return check(target);
 // 可选目录只按准确内容摘要读取，绝不读取它的产品白名单或版本登记。
 if(optional&&await stat(optional)){await directory(optional);let digest=entry.sha256;if(!digest&&entry.integrity){const index=join(dirname(optional),'index.json');if(await stat(index)){await regular(index);if((await lstat(index)).size>32*1024**2)fail('可选原件索引超限');const data=await readDependencySupply(optional);digest=data.packages?.flatMap(x=>x.archives||[]).find(x=>x.url===entry.url&&x.integrity===entry.integrity)?.sha256;}}if(digest&&!/^[a-f0-9]{64}$/u.test(digest))fail('可选供给摘要无效');const supplied=digest?join(optional,digest+'.blob'):null;if(supplied&&await stat(supplied)){await check(supplied);const candidate=join(await resourceWork(work),'.'+coordinate+'.'+randomUUID()+'.pending');try{await copyFile(supplied,candidate,constants.COPYFILE_EXCL);await chmod(candidate,0o444);await commitCandidate(candidate,target,{signal,verify:check});return await check(target);}finally{await rm(candidate,{force:true});}}}
 if(offline)fail('离线缺少锁定资源：'+url);signal?.throwIfAborted();let response,current=url;
 for(let i=0;i<=5;i++){response=await fetcher(current,{redirect:'manual',signal,headers:{'Accept-Encoding':'identity'}});if([301,302,303,307,308].includes(response.status)){await response.body?.cancel();if(i===5)fail('来源重定向超限');current=checkedURL(new URL(response.headers.get('location'),current).href);continue;}break;}
 if(!response?.ok||!response.body)fail('来源获取失败：'+url);const length=Number(response.headers.get('content-length'));if(length>maxBytes)fail('来源声明超限');
 const temporary=join(await resourceWork(work),'.'+coordinate+'.'+randomUUID()+'.pending'),h=await open(temporary,'wx',0o600);let bytes=0;const [algorithm,digest]=digestSpec(entry),checksum=createHash(algorithm);
 try{for await(const chunk of response.body){signal?.throwIfAborted();bytes+=chunk.length;if(bytes>maxBytes)fail('来源数据超限');checksum.update(chunk);let offset=0;while(offset<chunk.length){const n=await h.write(chunk,offset,chunk.length-offset);if(!n.bytesWritten)fail('原件写入中断');offset+=n.bytesWritten;}}if(!bytes||!checksum.digest().equals(digest))fail('锁定来源摘要不符');if(length&&!response.headers.get('content-encoding')&&length!==bytes)fail('来源数据不完整');await h.sync();await h.close();signal?.throwIfAborted();await chmod(temporary,0o444);await commitCandidate(temporary,target,{signal,verify:check});return await check(target);}finally{await h.close().catch(()=>{});await rm(temporary,{force:true});await response.body?.cancel().catch(()=>{});}
}
async function downloadTool(entry,target,options){const archive=await acquireArchive(entry,{...options,store:options.store||dirname(target)});await copyFile(archive,target,constants.COPYFILE_EXCL);}
// 解包先解析全部成员并验证闭包，之后才写入；链接不得指向归档外部或成为文件父目录。
async function extractArchive(input,destination,{prefix='',signal,tar,maxBytes=8*1024**3}={}){
 await regular(input);if(await stat(destination))fail('解包目标已存在');let bytes=await readFile(input),entries=[];
 const add=(path,type,data,mode=0o644,target)=>{path=path.replace(/\/$/u,'').replace(/^\.\//u,'');if(path==='.'||!path)return;if(!safePath(path))fail('归档成员越界');if(entries.length>=400000||entries.some(x=>x.path===path))fail('归档成员重复或超限');entries.push({path,type,data,mode,target});};
 if(bytes[0]===0x50&&bytes[1]===0x4b){let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50){end=i;break;}if(end<0)fail('ZIP目录缺失');const count=bytes.readUInt16LE(end+10);let cursor=bytes.readUInt32LE(end+16),total=0;for(let n=0;n<count;n++){signal?.throwIfAborted();if(bytes.readUInt32LE(cursor)!==0x02014b50)fail('ZIP成员无效');const method=bytes.readUInt16LE(cursor+10),size=bytes.readUInt32LE(cursor+24),compressed=bytes.readUInt32LE(cursor+20),nameLength=bytes.readUInt16LE(cursor+28),extra=bytes.readUInt16LE(cursor+30),comment=bytes.readUInt16LE(cursor+32),mode=bytes.readUInt32LE(cursor+38)>>>16,offset=bytes.readUInt32LE(cursor+42),name=bytes.subarray(cursor+46,cursor+46+nameLength).toString('utf8');if(bytes.readUInt16LE(cursor+8)&1||size===0xffffffff||offset===0xffffffff)fail('ZIP加密或Zip64未声明');total+=size;if(total>maxBytes)fail('ZIP解压超限');if(bytes.readUInt32LE(offset)!==0x04034b50)fail('ZIP本地记录无效');const start=offset+30+bytes.readUInt16LE(offset+26)+bytes.readUInt16LE(offset+28),data=bytes.subarray(start,start+compressed),output=method===0?data:method===8?inflateRawSync(data,{maxOutputLength:Math.max(1,size)}):fail('ZIP压缩方式未声明');if(output.length!==size)fail('ZIP长度不符');add(name,name.endsWith('/')?'directory':(mode&0o170000)===0o120000?'symlink':'file',output,mode||0o644,output.toString());cursor+=46+nameLength+extra+comment;}}
 else{if(bytes[0]===0x1f&&bytes[1]===0x8b)bytes=gunzipSync(bytes,{maxOutputLength:maxBytes});else if(bytes[0]===0xfd&&bytes[1]===0x37){if(!tar)fail('XZ需要已验真基础归档工具');fail('XZ应通过受控tar清单提取');}
  const number=b=>{const v=b.toString().replace(/\0.*$/su,'').trim();if(!/^[0-7]*$/u.test(v))fail('TAR数字无效');return parseInt(v||'0',8);};let pax={},global={};
  for(let cursor=0;cursor+512<=bytes.length;){signal?.throwIfAborted();const block=bytes.subarray(cursor,cursor+512);if(block.every(x=>x===0))break;let sum=0;for(let i=0;i<512;i++)sum+=(i>=148&&i<156)?32:block[i];if(sum!==number(block.subarray(148,156)))fail('TAR头摘要不符');const size=number(block.subarray(124,136)),type=String.fromCharCode(block[156]||48),str=(a,b)=>block.subarray(a,b).toString().replace(/\0.*$/su,''),data=bytes.subarray(cursor+512,cursor+512+size);if(data.length!==size||size>maxBytes)fail('TAR内容超限');cursor+=512+Math.ceil(size/512)*512;
   if(type==='x'||type==='g'){const values={};let at=0;while(at<data.length){const space=data.indexOf(32,at),length=Number(data.subarray(at,space).toString());if(!Number.isInteger(length)||length<=space-at+1||at+length>data.length)fail('PAX长度无效');const record=data.subarray(space+1,at+length-1).toString(),eq=record.indexOf('=');if(eq<1)fail('PAX字段无效');values[record.slice(0,eq)]=record.slice(eq+1);at+=length;}if(type==='g')global={...global,...values};else pax=values;continue;}
   if(type==='L'){pax.path=data.toString().replace(/\0.*$/su,'');continue;}if(type==='K'){pax.linkpath=data.toString().replace(/\0.*$/su,'');continue;}
   const attrs={...global,...pax};pax={};if(Object.keys(attrs).some(x=>x.startsWith('GNU.sparse')))fail('TAR稀疏文件未声明');const name=attrs.path||[str(345,500),str(0,100)].filter(Boolean).join('/'),target=attrs.linkpath||str(157,257);if(!['0','5','2','1'].includes(type))fail('TAR特殊成员未声明');add(name,{'0':'file','5':'directory','2':'symlink','1':'hardlink'}[type],data,number(block.subarray(100,108)),target);
  }
 }
 const selected=entries.filter(e=>!prefix||e.path===prefix||e.path.startsWith(prefix+'/')).map(e=>({...e,path:prefix?e.path.slice(prefix.length).replace(/^\//u,''):e.path})).filter(e=>e.path);if(!selected.length)fail('归档根缺失');const table=new Map(selected.map(e=>[e.path,e]));
 for(const entry of selected){let parent=dirname(entry.path);while(parent!=='.'){if(table.has(parent)&&table.get(parent).type!=='directory')fail('归档父目录不是目录');parent=dirname(parent);}if(['symlink','hardlink'].includes(entry.type)){const target=entry.type==='symlink'?posix.normalize(posix.join(posix.dirname(entry.path),entry.target)):prefix?entry.target.replace(new RegExp('^'+prefix+'/'),''):entry.target;if(!safePath(target)||!table.has(target))fail('归档链接越界或缺失');entry.resolved=target;}}
 await mkdir(destination,{mode:0o700});try{for(const entry of selected.filter(x=>['file','directory'].includes(x.type))){signal?.throwIfAborted();const file=join(destination,entry.path);await mkdir(dirname(file),{recursive:true,mode:0o700});if(entry.type==='directory')await mkdir(file,{recursive:true,mode:0o700});else await writeFile(file,entry.data,{flag:'wx',mode:entry.mode&0o111?0o755:0o644});}
 for(const entry of selected.filter(x=>['symlink','hardlink'].includes(x.type))){signal?.throwIfAborted();const file=join(destination,entry.path);await mkdir(dirname(file),{recursive:true});if(entry.type==='hardlink'){const source=table.get(entry.resolved);if(source.type!=='file')fail('硬链接目标不是普通文件');await copyFile(join(destination,entry.resolved),file,constants.COPYFILE_EXCL);}else await symlink(entry.target,file);}await inventory(destination);return destination;}catch(e){await permissions(destination,true);await rm(destination,{recursive:true});throw e;}
}
// XZ由验真POSIX tar处理；双遍清单、无链接父目录与候选物化后的清单一起保护边界。
async function unpack(input,target,{prefix='',signal,foundation}={}){const b=await readFile(input);if(!(b[0]===0xfd&&b[1]===0x37))return extractArchive(input,target,{prefix,signal});const tar=foundation?.tools.tar;if(!tar)fail('XZ缺少已验真tar');const list=await exec(tar,['-tvf',input],{signal,maxBuffer:32*1024**2});if(list.stdout.split('\n').filter(Boolean).some(x=>!/^[-d]/u.test(x)))fail('XZ成员含链接或特殊项');const names=(await exec(tar,['-tf',input],{signal,maxBuffer:32*1024**2})).stdout.split('\n').filter(Boolean);if(names.some(x=>!safePath(x.replace(/\/$/u,'').replace(/^\.\//u,''))))fail('XZ成员越界');await mkdir(target);await exec(tar,['-xkf',input,'--no-same-owner','-C',target],{signal,maxBuffer:2*1024**2});await inventory(target);if(prefix){const child=join(target,prefix),temporary=target+'.root';await directory(child);await rename(child,temporary);await permissions(target,true);await rm(target,{recursive:true});await rename(temporary,target);}return target;}
// 本仓准确工具配方；外部供给登记不能改变这些版本和来源。
const posixRecipe=(()=>{

// 只采集官方macOS发行件中的基础入口；不纳入Git/Python/Ruby等独立登记工具。
const posixNames = Object.freeze([
  'sh', 'bash', 'tar', 'awk', 'sed', 'grep', 'cat', 'chmod', 'cp', 'cut', 'dirname',
  'echo', 'env', 'expr', 'false', 'find', 'head', 'install', 'ln', 'ls', 'mkdir',
  'mktemp', 'mv', 'od', 'paste', 'pwd', 'readlink', 'rm', 'rmdir', 'sleep', 'sort',
  'tail', 'tee', 'test', 'touch', 'tr', 'true', 'uname', 'uniq', 'wc', 'xargs',
  'basename', 'printf', 'date', 'cmp', 'comm', 'dd', 'df', 'du', 'hostname',
  'whoami', 'file', 'stat', 'zip', 'unzip', 'plutil', 'ditto', 'rsync', 'patch',
  'sw_vers', 'chflags', 'cpio', 'gzip', 'gunzip', 'bzip2', 'egrep', 'fgrep',
  'open', 'pgrep', 'pkill', 'lsof', 'zsh', 'ps', 'kill', 'diff', 'yes', 'realpath',
  'which', 'sysctl',
]);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error('受控POSIX工具：' + message); };

function validatePosixTool(tool) {
  if (tool?.id !== 'posix' || tool.command !== 'bash' || !tool.managed
    || !/^\d+\.\d+(?:\.\d+)?$/u.test(tool.version)
    || tool.source !== 'https://opensource.apple.com/'
    || JSON.stringify(tool.requires) !== JSON.stringify(['node', 'xcode'])
    || tool.archive?.kind !== 'apple-posix'
    || tool.archive.url !== tool.source || tool.archive.root !== 'macos-posix-' + tool.version
    || tool.archive.executable !== 'bin/bash' || !/^[a-f0-9]{64}$/u.test(tool.archive.sha256)
    || tool.dependencies || tool.components || tool.archives) fail('官方发行件登记不完整');
}

// 本机基础工具从已声明的系统位置取得实际入口。
async function locatePosixSources({signal,platform=process.platform}={}){
 if(platform!=='darwin')fail('仅限已授权macOS自举');
 const files=[];
 for(const name of posixNames){signal?.throwIfAborted();const entry=['/bin/','/usr/bin/','/usr/sbin/'].map(prefix=>prefix+name).find(existsSync);if(!entry)fail('缺少官方基础入口：'+name);const path=await realpath(entry),info=await lstat(path);if(!info.isFile()||!(info.mode&0o111))fail('系统输入不是普通可执行文件');files.push({name,path});}
 return files;
}

// 采集不是常态回退：只有本次明确授权的bootstrap调用可建立候选，发布仍由工具事务完成。
async function buildPosixTool({ tool, payload, bootstrap = false, run, signal }) {
  validatePosixTool(tool);
  if (bootstrap !== true) fail('缺少本次首次自举授权');
  const files = await locatePosixSources({signal});
  await mkdir(payload); await mkdir(join(payload, 'bin'));
  for (const file of files) {
    const target = join(payload, 'bin', file.name);
    await copyFile(file.path, target);
    // 系统原签名带平台限制；候选建立本机运行签名。
    await run('/usr/bin/codesign', ['--force', '--sign', '-', '--timestamp=none', target],
      { signal, timeout: 60000, env: { PATH: '', LANG: 'C' } });
  }
  // 发布前真实执行文件、归档及Flutter宿主探测；只接受同对象内的sysctl。
  const bin = join(payload, 'bin'), probe = join(payload, '.probe');
  await mkdir(probe);
  try {
    const result = await run(join(bin, 'bash'), ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c',
      'printf "controlled-posix-ok\\n" > input; cp input copy; cmp input copy; awk "{print}" copy | sed -n "1p"; tar -cf check.tar input; tar -tf check.tar; which sysctl; sysctl -n hw.optional.arm64; if which citizen-tool-not-installed > /dev/null 2>&1; then exit 1; fi'],
      { cwd: probe, signal, timeout: 60000, env: { PATH: bin, LANG: 'C' } });
    if (result.stdout !== 'controlled-posix-ok\ninput\n' + join(bin, 'sysctl') + '\n1\n') fail('基础工具真实执行回读不符');
  } finally { await rm(probe, {recursive:true,force:true}); }
}

// 调用方只取得同一只读对象内入口；缺失立即失败，绝不从系统或PATH补齐。
async function controlledPosixTools(library, verify) {
  const tool = library.tools.find(entry => entry.id === 'posix');
  if (!tool) fail('基础工具未登记');
  validatePosixTool(tool);
  const installed = await verify(library, tool);
  if (!installed) fail('请先安装已登记基础工具原件');
  const bin = dirname(installed.path), tools = {};
  for (const name of posixNames) {
    const path = join(bin, name), info = await lstat(path);
    if (!info.isFile() || !(info.mode & 0o111) || await realpath(path) !== path) fail('受控入口失效：' + name);
    tools[name] = path;
  }
  return { bin, tools };
}
return {posixNames,buildPosixTool,controlledPosixTools};})();
const sourceRecipe=(()=>{
const controlledPosixTools=(...args)=>productFoundation(...args);

const fail = message => { throw new Error('官方源码工具：' + message); };
const plain = (value, fields) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).sort().join(',') === [...fields].sort().join(',');
const hash = value => createHash('sha256').update(value).digest('hex');
const sources = Object.freeze({
  bash: version => { const base=version.split('.').slice(0,2).join('.');return ['https://ftp.gnu.org/gnu/bash/bash-'+base+'.tar.gz','bash-'+base,'bin/bash']; },
  grep: version => ['https://ftp.gnu.org/gnu/grep/grep-' + version + '.tar.xz', 'grep-' + version, 'bin/grep'],
  sed: version => ['https://ftp.gnu.org/gnu/sed/sed-' + version + '.tar.xz', 'sed-' + version, 'bin/sed'],
  m4: version => ['https://ftp.gnu.org/gnu/m4/m4-' + version + '.tar.xz', 'm4-' + version, 'bin/m4'],
  bison: version => ['https://ftp.gnu.org/gnu/bison/bison-' + version + '.tar.xz', 'bison-' + version, 'bin/bison'],
  flex: version => ['https://github.com/westes/flex/releases/download/v' + version + '/flex-' + version + '.tar.gz', 'flex-' + version, 'bin/flex'],
  gettext: version => ['https://ftp.gnu.org/gnu/gettext/gettext-' + version + '.tar.gz', 'gettext-' + version, 'bin/msgfmt'],
  tcl: version => ['https://github.com/tcltk/tcl/releases/download/core-' + version.replaceAll('.', '-') + '/tcl' + version + '-src.tar.gz', 'tcl' + version, 'bin/tclsh' + version.split('.').slice(0, 2).join('.')],
  git: version => ['https://www.kernel.org/pub/software/scm/git/git-' + version + '.tar.xz', 'git-' + version, 'bin/git'],
  python: version => ['https://www.python.org/ftp/python/' + version + '/Python-' + version + '.tar.xz', 'Python-' + version, 'bin/python' + version.split('.').slice(0, 2).join('.')],
  perl: version => ['https://www.cpan.org/src/5.0/perl-' + version + '.tar.xz', 'perl-' + version, 'bin/perl'],
  ruby: version => ['https://cache.ruby-lang.org/pub/ruby/' + version.split('.').slice(0, 2).join('.') + '/ruby-' + version + '.tar.gz', 'ruby-' + version, 'bin/ruby'],
  openssl: version => ['https://github.com/openssl/openssl/releases/download/openssl-' + version + '/openssl-' + version + '.tar.gz', 'openssl-' + version, 'bin/openssl'],
  cocoapods: version => ['https://rubygems.org/downloads/cocoapods-' + version + '.gem', '.', 'bin/pod'],
});
const requirements = Object.freeze({
  bash: ['node', 'xcode', 'posix'], grep: ['node', 'xcode', 'posix'], sed: ['node', 'xcode', 'posix'],
  git: ['node', 'xcode', 'perl', 'python', 'gettext'], python: ['node', 'xcode', 'openssl'],
  m4: ['node', 'xcode'], bison: ['node', 'xcode', 'm4'], flex: ['node', 'xcode', 'm4', 'bison'],
  gettext: ['node', 'xcode', 'perl', 'm4', 'bison', 'flex'], tcl: ['node', 'xcode'],
  perl: ['node', 'xcode'], openssl: ['node', 'xcode', 'perl'],
  ruby: ['node', 'xcode', 'openssl'], cocoapods: ['node', 'xcode', 'ruby', 'git'],
});

// 来源、归档根、执行入口和前置对象形成闭集；运行时绝不解析latest或系统同名命令。
function validateSourceTool(tool) {
  const expected = sources[tool?.id]?.(tool.version);
  if (!expected || !tool.managed || !/^\d+\.\d+(?:\.\d+)?$/u.test(tool.version)
    || JSON.stringify(tool.requires) !== JSON.stringify(requirements[tool.id])
    || tool.archive?.kind !== (tool.id === 'cocoapods' ? 'gem' : 'native-source')
    || JSON.stringify([tool.archive.url, tool.archive.root, tool.archive.executable]) !== JSON.stringify(expected)
    || !/^[a-f0-9]{64}$/u.test(tool.archive.sha256)) fail('官方固定归档或工具前置关系不符');
  const patches = tool.upstream_patches ?? [];
  if (!Array.isArray(patches) || tool.id === 'bash' && patches.length !== Number(tool.version.split('.')[2]||0)
    || tool.id !== 'bash' && patches.length) fail('官方源码补丁闭包不符');
  for (const [i, patch] of patches.entries()) {
    if (!plain(patch, ['url', 'sha256']) || !/^[a-f0-9]{64}$/u.test(patch.sha256)
      || patch.url !== 'https://ftp.gnu.org/gnu/bash/bash-'+tool.version.split('.').slice(0,2).join('.')+'-patches/bash'+tool.version.split('.').slice(0,2).join('')+'-' + String(i + 1).padStart(3, '0')) fail('官方Bash补丁顺序或坐标不符');
  }
  const dependencies = tool.dependencies ?? [];
  if (!Array.isArray(dependencies) || new Set(dependencies.map(entry => entry.name)).size !== dependencies.length) fail('依赖身份重复');
  for (const entry of dependencies) {
    if (tool.id === 'cocoapods') {
      if (!plain(entry, ['name', 'version', 'url', 'sha256']) || entry.name === 'cocoapods'
        || !/^[A-Za-z][A-Za-z0-9_-]*$/u.test(entry.name) || !/^\d+(?:\.\d+){1,3}$/u.test(entry.version)
        || entry.url !== 'https://rubygems.org/downloads/' + entry.name + '-' + entry.version + '.gem') fail('CocoaPods依赖必须是固定官方Gem');
    } else if (tool.id === 'ruby') {
      if (!plain(entry, ['name', 'version', 'url', 'sha256', 'root']) || entry.name !== 'libyaml'
        || entry.url !== 'https://pyyaml.org/download/libyaml/yaml-' + entry.version + '.tar.gz'
        || entry.root !== 'yaml-' + entry.version) fail('Ruby YAML依赖来源不符');
    } else if (tool.id === 'python') {
      if (!plain(entry, ['name', 'version', 'url', 'sha256', 'root']) || entry.name !== 'xz'
        || !/^\d+\.\d+\.\d+$/u.test(entry.version)
        || entry.url !== 'https://github.com/tukaani-project/xz/releases/download/v'+entry.version+'/xz-'+entry.version+'.tar.xz'
        || entry.root !== 'xz-'+entry.version) fail('Python LZMA依赖来源不符');
    } else fail('该工具没有独立外部源码依赖');
    if (!/^[a-f0-9]{64}$/u.test(entry.sha256)) fail('源码依赖摘要缺失');
  }
  if (['ruby', 'python'].includes(tool.id) && dependencies.length !== 1
    || tool.id === 'cocoapods' && (!dependencies.length
      || !dependencies.some(entry => entry.name === 'cocoapods-core' && entry.version === tool.version))) {
    fail('工具运行依赖闭包不完整');
  }
  return true;
}

// Perl实际安装目录只来自本轮官方Configure输出，不猜版本目录或架构名称。
function perlRuntimeLibraries(config, finalPayload, payload) {
  const paths=['installprivlib','installarchlib'].map(name=>{
    const values=[...config.matchAll(new RegExp('^'+name+"='([^']*)'$",'gm'))];
    const value=values.length===1?values[0][1]:null;
    if(!value || !value.startsWith(finalPayload+'/') || value!==resolve(value)
      || /[\x00-\x1f]/u.test(value)) fail('Perl官方安装目录声明无效：'+name);
    return join(payload,relative(finalPayload,value));
  });
  if(new Set(paths).size!==2) fail('Perl普通与架构运行库必须准确隔离');
  return paths;
}

async function directory(path) {
  if (!isAbsolute(path) || path !== resolve(path) || await realpath(path) !== path
    || !(await lstat(path)).isDirectory()) fail('候选目录必须是规范真实目录');
}
async function regular(path, executable = false) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || !info.size
    || await realpath(path) !== path || executable && !(info.mode & 0o111)) fail('输入或输出必须是准确普通文件');
}

// 只有此工具对象的候选目录可写；最终前缀固定到已登记摘要，DESTDIR收集后才原子发布。
async function buildSourceTool({ library, tool, source, archive, pending, payload,
  finalPayload, signal, fetcher, exec, verify, apple, bootstrap = false, environment = process.env,
  prepare = prepareSourceDependencies, download = downloadTool }) {
  validateSourceTool(tool);
  const expected = library.pending;
  if (pending !== expected || payload !== join(pending, 'payload')
    || finalPayload !== library.finalPayload
    || archive !== join(pending, 'archive')
    || source !== (tool.archive.kind === 'gem' ? archive : join(pending, 'unpack', tool.archive.root))) fail('候选对象身份不符');
  await directory(pending); await regular(archive);
  if (hash(await readFile(archive)) !== tool.archive.sha256) fail('完整官方归档摘要不符');
  if (tool.archive.kind !== 'gem') await directory(source);
  const installed = {};
  for (const id of tool.requires) {
    const registered = library.tools.find(entry => entry.id === id);
    const result = registered && await verify(library, registered);
    if (!result) fail('缺少已验真前置工具：' + id);
    installed[id] = result.path;
  }
  const foundation = await controlledPosixTools(library, verify, { bootstrap, id: tool.id });
  const selected = await apple(library, { names: ['clang', 'clang++', 'ar', 'make', 'ld', 'nm', 'ranlib', 'strip', 'xcrun', 'otool', 'install_name_tool', 'codesign'], signal });
  const sdkResult = await exec(selected.tools.xcrun, ['--sdk', 'macosx', '--show-sdk-path'], {
    env: { PATH: '', DEVELOPER_DIR: selected.developerDirectory }, signal, timeout: 60_000,
  });
  // xcrun返回包内官方SDK链接；固定到同一包内真实目标，不接纳包外SDK。
  const sdkInput = sdkResult.stdout.trim();
  if (!isAbsolute(sdkInput) || sdkInput !== resolve(sdkInput)) fail('SDK返回路径无效');
  const sdk = await realpath(sdkInput); await directory(sdk);
  if (!sdk.startsWith(selected.developerDirectory + '/')) fail('SDK不属于同一Xcode');
  const work = join(pending, 'probe'), stage = join(work, 'stage');
  await mkdir(work); await mkdir(stage);
  const env = { ...environment, HOME: work, TMPDIR: work, DEVELOPER_DIR: selected.developerDirectory,
    SDKROOT: sdk, MACOSX_DEPLOYMENT_TARGET: library.tools.find(entry=>entry.id==='posix').version,
    PATH: [...new Set([...Object.values(installed).map(dirname), foundation.path,
      dirname(selected.tools.clang), dirname(selected.tools.make)])].join(':'),
    // Clang自带汇编器，避免调用带系统解释器shebang的Xcode as脚本。
    CC: selected.tools.clang, CXX: selected.tools['clang++'], AR: selected.tools.ar,
    CPP: selected.tools.clang + ' -E', LD: selected.tools.ld, AS: selected.tools.clang,
    NM: selected.tools.nm, RANLIB: selected.tools.ranlib, STRIP: selected.tools.strip,
    MAKE: selected.tools.make, PERL: installed.perl ?? '', PYTHON: installed.python ?? '',
    RUBY: installed.ruby ?? '', MAKEINFO: 'true', HELP2MAN: 'true', M4: installed.m4 ?? 'false', BISON: installed.bison ?? 'false',
    YACC: installed.bison ? installed.bison + ' -y' : 'false', FLEX: installed.flex ?? 'false',
    // 官方AC_PROG_LEX用冒号表示未安装Lex，false会误入必须生成扫描器的探测。
    LEX: installed.flex ?? ':', COCOAPODS_DISABLE_STATS: 'true',
  };
  for (const key of Object.keys(env)) if (key.startsWith('DYLD_') || ['NODE_OPTIONS', 'NODE_PATH', 'BASH_ENV', 'ENV', 'SHELLOPTS', 'BASHOPTS', 'CDPATH', 'GLOBIGNORE',
    'PYTHONHOME', 'PYTHONPATH', 'RUBYOPT', 'RUBYLIB', 'GEM_HOME', 'GEM_PATH', 'PERL5OPT', 'PERL5LIB',
    'ARCHFLAGS', 'ARCH', 'CC_FOR_BUILD', 'CXX_FOR_BUILD', 'CROSS_COMPILE', 'LD_PRELOAD', 'LD_LIBRARY_PATH',
    'CFLAGS', 'CXXFLAGS', 'CPPFLAGS', 'LDFLAGS', 'CPATH', 'LIBRARY_PATH', 'PKG_CONFIG_PATH', 'CONFIG_SITE', 'GNUMAKEFLAGS', 'MAKEFLAGS', 'MFLAGS',
    'DESTDIR', 'LD_RUN_PATH', 'CMAKE_TOOLCHAIN_FILE', 'npm_execpath', 'npm_node_execpath', 'NVM_BIN', 'NVM_DIR'].includes(key)) delete env[key];
  // 已验真SDK通过SDKROOT传给Clang，避免Configure把嵌入引号当作路径字节。
  env.CFLAGS = '-O2';
  env.CXXFLAGS = env.CFLAGS;
  env.LDFLAGS = '-Wl,-headerpad_max_install_names';
  env.ARCHFLAGS = '-arch arm64';
  env.SHELL = foundation.tools.sh;
  env.CONFIG_SHELL = foundation.tools.sh;
  env.M4PATH = '';
  env.BISON_PKGDATADIR = installed.bison ? join(dirname(dirname(installed.bison)), 'share/bison') : '';
  env.PKG_CONFIG = 'false';
  env.PKG_CONFIG_LIBDIR = '';
  env.CONFIG_SITE = '';
  const run = (command, args, cwd = tool.id === 'tcl' ? join(source, 'unix') : source, extra = {}) => exec(command, args, {
    cwd, env: { ...env, ...extra }, signal, timeout: 3_600_000, maxBuffer: 8 * 1024 * 1024,
  });
  const originals = await prepare({ library, tool, pending, environment: env, signal, fetcher });
  const upstream = [];
  for (const [i, patch] of (tool.upstream_patches ?? []).entries()) {
    const file = join(pending, 'bash53-' + String(i + 1).padStart(3, '0'));

    await download(patch, file, { fetcher, signal });
    await regular(file);
    if (hash(await readFile(file)) !== patch.sha256) fail('Bash官方补丁原件摘要不符');
    await run(foundation.tools.patch, ['--batch', '--forward', '--fuzz=0', '-p0', '-i', file]);
    upstream.push(file);
  }
  if (tool.id === 'cocoapods') {
    await mkdir(payload); await mkdir(join(payload, 'bin'));
    const manifest = join(work, 'gems.json');
    await writeFile(manifest, JSON.stringify([{ name: 'cocoapods', version: tool.version, file: archive },
      ...tool.dependencies.map(entry => ({ name: entry.name, version: entry.version, file: originals.get(entry.name) }))]), { flag: 'wx' });
    // Ruby读取验真Gem内的真实spec并核对整个运行闭包；无在线解析、系统Gem或忽略版本要求。
    const code = [
      "require 'rubygems'; require 'rubygems/package'; require 'rubygems/installer'; require 'json'; require 'fileutils'",
      "entries = JSON.parse(File.read(ARGV.fetch(0))); home = ARGV.fetch(1)",
      "specs = entries.to_h { |e| s = Gem::Package.new(e.fetch('file')).spec; raise 'Gem identity' unless s.name == e.fetch('name') && s.version.to_s == e.fetch('version') && s.platform == Gem::Platform::RUBY; raise 'Ruby requirement' unless s.required_ruby_version.satisfied_by?(Gem::Version.new(RUBY_VERSION)); [s.name, s] }",
      "specs.each_value { |s| s.runtime_dependencies.each { |d| v = specs[d.name]; raise 'Gem closure' unless v && d.requirement.satisfied_by?(v.version) } }",
      "Gem.use_paths(home, [home]); RbConfig::CONFIG['CC'] = ENV.fetch('CC'); RbConfig::CONFIG['CXX'] = ENV.fetch('CXX'); RbConfig::CONFIG['AR'] = ENV.fetch('AR'); RbConfig::CONFIG['MAKE'] = ENV.fetch('MAKE')",
      "entries.each { |e| Gem::Installer.at(e.fetch('file'), install_dir: home, ignore_dependencies: true, wrappers: false, env_shebang: false, document: [], build_args: ['--disable-system-libffi']).install }",
      // 显式install_dir不更新本进程规格缓存；离线安装后刷新，再逐包回读准确版本。
      "Gem::Specification.reset",
      // 只保留Gem原始脚本与唯一pod包装入口，清除换位后会断开的自动命令链接。
      "specs.each_value { |s| raise 'Gem installed version' unless Gem::Specification.find_by_name(s.name, s.version).version == s.version }; FileUtils.rm_rf(File.join(home, 'cache')); FileUtils.rm_rf(File.join(home, 'bin'))",
    ].join('\n');
    await run(installed.ruby, ['--disable-gems', '-e', code, manifest, join(payload, 'gems')], work,
      { GEM_HOME: join(payload, 'gems'), GEM_PATH: join(payload, 'gems') });
    // 只开放当前CocoaPods与同一受控Ruby自带Gem；不继承外部或用户Gem路径。
    const program = "ENV['GEM_HOME'] = File.expand_path('../gems', File.dirname(ARGV.shift)); ENV['GEM_PATH'] = ENV['GEM_HOME']; ENV['COCOAPODS_DISABLE_STATS'] = 'true'; require 'rubygems'; ENV['GEM_PATH'] = [ENV['GEM_HOME'], Gem.default_dir].join(File::PATH_SEPARATOR); Gem.clear_paths; require 'logger'; load Gem.bin_path('cocoapods', 'pod', " + JSON.stringify(tool.version) + ")";
    const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
    // 运行入口固定安装时已验真的工具路径，确保Git可用并排除调用方PATH。
    const wrapper = '#!' + foundation.tools.sh + '\nunset RUBYOPT RUBYLIB GEM_HOME GEM_PATH DYLD_LIBRARY_PATH DYLD_INSERT_LIBRARIES\n'
      + 'PATH=' + quote(env.PATH) + '\n'
      + 'exec ' + quote(installed.ruby) + ' --disable-gems -e ' + quote(program) + ' "$0" "$@"\n';
    await writeFile(join(payload, 'bin/pod'), wrapper, { flag: 'wx', mode: 0o555 });
  } else {
    let flags = ['--prefix=' + finalPayload];
    if (tool.id === 'ruby') {
      const yaml = join(work, 'yaml'); await mkdir(yaml);
      await run(foundation.tools.tar, ['-xkf', originals.get('libyaml'), '--no-same-owner', '-C', yaml], work);
      const root = join(yaml, tool.dependencies[0].root); await directory(root);
      const prefix = join(work, 'libyaml');
      await run(foundation.tools.sh, [join(root, 'configure'), '--prefix=' + prefix, '--disable-shared'], root);
      await run(selected.tools.make, ['-j8', 'SHELL=' + foundation.tools.sh], root);
      await run(selected.tools.make, ['install', 'SHELL=' + foundation.tools.sh], root);
      flags.push('--with-baseruby=no', '--with-libyaml-dir=' + prefix,
        '--with-openssl-dir=' + dirname(dirname(installed.openssl)), '--disable-install-doc');
    }
    if (tool.id === 'python') {
      // Xcode SDK不提供lzma头文件；仅编译已锁官方liblzma静态库，不借用户或系统缓存。
      const archiveDirectory = join(work, 'xz'); await mkdir(archiveDirectory);
      await run(foundation.tools.tar, ['-xkf', originals.get('xz'), '--no-same-owner', '-C', archiveDirectory], work);
      const root = join(archiveDirectory, tool.dependencies[0].root); await directory(root);
      const prefix = join(work, 'liblzma');
      await run(foundation.tools.sh, [join(root, 'configure'), '--prefix=' + prefix,
        '--disable-shared', '--enable-static', '--with-pic', '--disable-xz', '--disable-xzdec',
        '--disable-lzmadec', '--disable-lzmainfo', '--disable-scripts', '--disable-doc', '--disable-nls'], root);
      await run(selected.tools.make, ['-j8', 'SHELL=' + foundation.tools.sh], root);
      await run(selected.tools.make, ['install', 'SHELL=' + foundation.tools.sh], root);
      await regular(join(prefix, 'include/lzma.h')); await regular(join(prefix, 'lib/liblzma.a'));
      // Python官方configure支持这两个边界变量；静态链接不携带候选运行库路径。
      env.LIBLZMA_CFLAGS = '-I' + join(prefix, 'include');
      env.LIBLZMA_LIBS = join(prefix, 'lib/liblzma.a');
    }
    if (['bison', 'flex', 'bash', 'grep', 'sed'].includes(tool.id)) flags.push('--disable-nls');
    if (tool.id === 'bash') flags.push('--without-bash-malloc');
    if (tool.id === 'grep') flags.push('--disable-perl-regexp');
    // libfl的yylex由消费者扫描器提供；macOS交付静态库，避免共享库链接未定义符号。
    if (tool.id === 'flex') flags.push('--disable-shared');
    if (tool.id === 'gettext') flags.push('--disable-shared', '--disable-java', '--disable-csharp', '--without-emacs');
    if (tool.id === 'tcl') flags.push('--enable-threads', '--enable-shared');
    if (tool.id === 'python') flags.push('--with-openssl=' + dirname(dirname(installed.openssl)), '--with-openssl-rpath=auto');
    if (tool.id === 'perl') {
      await run(foundation.tools.sh, [join(source, 'Configure'), '-des', '-Dprefix=' + finalPayload,
        '-Dcc=' + selected.tools.clang, '-Dld=' + selected.tools.clang, '-Dar=' + selected.tools.ar,
        '-Duseshrplib', '-Dinstallusrbinperl=n', '-Dccflags=' + env.CFLAGS,
        '-Dldflags=' + env.LDFLAGS, '-Dman1dir=none', '-Dman3dir=none']);
    } else if (tool.id === 'openssl') {
      await run(installed.perl, [join(source, 'Configure'), 'darwin64-arm64-cc', '--prefix=' + finalPayload,
        '--openssldir=/private/etc/ssl', 'no-shared']);
    } else if (tool.id !== 'git') await run(foundation.tools.sh, [join(tool.id === 'tcl' ? join(source, 'unix') : source, 'configure'), ...flags]);
    let curlLibrary;
    if (tool.id === 'git') {
      // 官方Makefile允许显式交付CURL输入；固定同一Xcode SDK，不执行未登记curl-config。
      await regular(join(sdk, 'usr/include/curl/curl.h'));
      // Apple SDK的libcurl.tbd是官方链接；只接受同一SDK目录内的真实普通目标。
      curlLibrary = await realpath(join(sdk, 'usr/lib/libcurl.tbd'));
      if (!curlLibrary.startsWith(sdk + '/usr/lib/')) fail('CURL链接输入不属于同一SDK');
      await regular(curlLibrary);
    }
    const makeArgs = tool.id === 'git' ? ['prefix=' + finalPayload,
      'CURL_CFLAGS=-I' + join(sdk, 'usr/include'), 'CURL_LDFLAGS=' + curlLibrary,
      'NO_FINK=YesPlease', 'NO_DARWIN_PORTS=YesPlease', 'NO_HOMEBREW=YesPlease',
      'GETTEXT_PATH=' + join(dirname(installed.gettext), 'gettext'), 'CPPFLAGS=-I' + dirname(dirname(installed.gettext)) + '/include',
      'LDFLAGS=' + env.LDFLAGS + ' -L' + dirname(dirname(installed.gettext)) + '/lib', 'NO_TCLTK=YesPlease', 'PERL_PATH=' + installed.perl, 'PYTHON_PATH=' + installed.python,
      'CC=' + selected.tools.clang, 'AR=' + selected.tools.ar, 'SHELL_PATH=' + foundation.tools.sh, 'SHELL=' + foundation.tools.sh] : ['SHELL=' + foundation.tools.sh];
    await run(selected.tools.make, ['-j8', ...makeArgs]);
    await run(selected.tools.make, ['DESTDIR=' + stage, ...makeArgs,
      tool.id === 'openssl' ? 'install_sw' : 'install']);
    const staged = join(stage, finalPayload.slice(1)); await directory(staged);
    await rename(staged, payload);
  }
  await regular(join(payload, tool.archive.executable), true);
  if (tool.id === 'grep') for (const name of ['egrep', 'fgrep']) {
    const alias = join(payload, 'bin', name);
    const info = await lstat(alias).catch(error => {if (error.code !== 'ENOENT') throw error; return null;});
    if (info) {if (!info.isFile() || info.isSymbolicLink()) fail('上游grep别名不是普通脚本');await rm(alias);}
  }
  if (tool.id === 'bash') {
    // sh是同一个Bash产物的准确普通副本，版本与回执同属唯一工具对象。
    await writeFile(join(payload, 'bin/sh'), await readFile(join(payload, 'bin/bash')), { flag: 'wx', mode: 0o555 });
  }
  if (tool.archive.kind === 'native-source') {
    const walk = async path => {
      const result = [];
      for (const entry of await readdir(path, { withFileTypes: true })) {
        const file = join(path, entry.name);
        if (entry.isDirectory()) result.push(...await walk(file));
        else if (entry.isFile()) result.push(file);
        else if (!entry.isSymbolicLink()) fail('工具输出包含特殊文件');
      }
      return result;
    };
    const binaries = [];
    for (const file of await walk(payload)) {
      const bytes = await readFile(file);
      if (bytes.length >= 32 && bytes.readUInt32LE(0) === 0xfeedfacf) {
        if (bytes.readUInt32LE(4) !== 0x0100000c) fail('源码工具Mach-O架构不是ARM64');
        binaries.push(file);
      }
    }
    if (!binaries.includes(join(payload, tool.archive.executable))) fail('编译没有生成ARM64工具入口');
    const relocated = new Set();
    for (const file of binaries) {
      const identity = await lstat(file), key = identity.dev + ':' + identity.ino;
      if (relocated.has(key)) continue;
      relocated.add(key);
      const listing = await run(selected.tools.otool, ['-L', file], work);
      let ownRuntime = false;
      for (const line of listing.stdout.split('\n').slice(1)) {
        const dependency = line.trim().split(' (')[0];
        if (!dependency) continue;
        if (dependency.startsWith(finalPayload + '/')) {
          ownRuntime = true;
          await run(selected.tools.install_name_tool, ['-change', dependency,
            '@rpath/' + relative(finalPayload, dependency), file], work);
        } else if (isAbsolute(dependency) && !dependency.startsWith('/usr/lib/')
          && !dependency.startsWith('/System/Library/')
          && !Object.values(installed).some(path => dependency.startsWith(dirname(dirname(path)) + '/'))) {
          fail('工具链接到未验真的外部库');
        }
      }
      // 相对工具对象根定位同一候选与最终对象，避免Perl共享库在原子发布前指向不存在的前缀。
      const loader = '@loader_path' + (relative(dirname(file), payload) ? '/' + relative(dirname(file), payload) : '');
      // 仅链接同对象运行库的入口需要新rpath；系统库模块不能平白扩大Mach-O加载命令。
      if (ownRuntime) await run(selected.tools.install_name_tool, ['-add_rpath', loader, file], work);
      if (file.endsWith('.dylib')) await run(selected.tools.install_name_tool, ['-id',
        '@rpath/' + relative(payload, file), file], work);
      await run(selected.tools.codesign, ['--force', '--sign', '-', '--timestamp=none', file], work);
    }
  }

  // 入口版本不能代替运行闭包验收；解释器必须在原子发布前真实加载所需核心与加密模块。
  const executable = join(payload, tool.archive.executable);
  const probe = async (args, extra = {}) => {
    const result = await run(executable, args, work, extra);
    if (result.stdout.trim() !== 'controlled-' + tool.id + '-ok') fail('解释器真实模块探测未返回准确结果');
  };
  if (tool.id === 'python') {
    await probe(['-I', '-c', 'import ssl,zlib,bz2,lzma,sqlite3,ctypes,json; '
      + 'assert ssl.create_default_context().verify_mode == ssl.CERT_REQUIRED; '
      + 'assert ssl.OPENSSL_VERSION.startswith('+JSON.stringify('OpenSSL '+library.tools.find(value=>value.id==='openssl').version+' ')+'); print("controlled-python-ok")'],
    { PYTHONHOME: payload });
  } else if (tool.id === 'perl') {
    const cores=perlRuntimeLibraries(await readFile(join(source,'config.sh'),'utf8'),finalPayload,payload);
    for(const path of cores) await directory(path);
    await regular(join(cores[1],'Config.pm'));
    await probe(['-MConfig', '-MJSON::PP', '-MEncode', '-MFile::Find', '-e',
      'die "Perl version" unless "$^V" eq '+JSON.stringify('v'+tool.version)+'; print "controlled-perl-ok\\n"'],
      {PERL5LIB:cores.join(':')});
  } else if (tool.id === 'ruby') {
    const versions=(await readdir(join(payload,'lib/ruby'))).filter(value=>/^\d+\.\d+\.\d+$/u.test(value));
    if(versions.length!==1)fail('Ruby核心模块版本目录缺失或不唯一');
    const base=join(payload,'lib/ruby',versions[0]); await directory(base);
    const cores=[base];
    for(const entry of await readdir(base,{withFileTypes:true})) {
      if(!entry.isDirectory()) continue;
      const marker=join(base,entry.name,'rbconfig.rb');
      try {await regular(marker);cores.push(join(base,entry.name));}
      catch(error){if(error.code!=='ENOENT')throw error;}
    }
    if(cores.length!==2) fail('Ruby ARM64核心模块目录缺失或不唯一');
    await probe(['--disable-gems', '-rrubygems', '-rpsych', '-ropenssl', '-rjson', '-e',
      'raise "Ruby version" unless RUBY_VERSION == '+JSON.stringify(tool.version)+'; '
      + 'raise "OpenSSL version" unless OpenSSL::OPENSSL_VERSION.start_with?('+JSON.stringify('OpenSSL '+library.tools.find(value=>value.id==='openssl').version+' ')+'); '
      + 'raise "libyaml missing" if Psych.libyaml_version.empty?; puts "controlled-ruby-ok"'],
      {RUBYLIB:cores.join(':'),GEM_HOME:join(payload,'lib/ruby/gems',versions[0]),GEM_PATH:join(payload,'lib/ruby/gems',versions[0])});
  }
  // 保留官方法律全文与原始源码归档；产品需要解释器运行库时可连同其原始许可一起打包。
  if (tool.archive.kind === 'native-source') {
    const legalNames = (await readdir(source)).filter(name => /^(?:COPYING|LICENSE|LICENCE|NOTICE|Artistic|COPYRIGHT|BSDL|GPL|LEGAL)(?:[._-].*)?$/iu.test(name));
    if (!legalNames.length) fail('官方工具源码缺少根许可全文');
    const directory = join(payload, 'licenses'); await mkdir(directory);
    for (const name of legalNames) {
      const file = join(source, name);
      if ((await lstat(file)).isFile()) await writeFile(join(directory, name), await readFile(file), { flag: 'wx', mode: 0o444 });
    }
    if (!(await readdir(directory)).length) fail('工具根许可必须包含真实法律文件');
  }

  if (tool.id === 'tcl') await writeFile(join(payload, 'version.tcl'), 'puts [info patchlevel]\n', { flag: 'wx', mode: 0o444 });
  // 原件与编译输入回执留在唯一工具对象；运行依赖原件仍归rely，不保留第二份Gem缓存。
  await writeFile(join(payload, tool.archive.kind === 'gem' ? 'source.gem' : 'source.archive'),
    await readFile(archive), { flag: 'wx', mode: 0o444 });
  if (upstream.length) {
    const directory = join(payload, 'upstream-patches'); await mkdir(directory);
    for (const [i, file] of upstream.entries()) await writeFile(join(directory, 'bash53-' + String(i + 1).padStart(3, '0')),
      await readFile(file), { flag: 'wx', mode: 0o444 });
    // 原件只保留在回执覆盖的payload内，清除同一安装事务产生的临时重复文件。
    for (const [i, file] of upstream.entries()) {
      await rm(file);
    }
  }
  }
return {buildSourceTool,validateSourceTool};})();
const flutterRecipe=(()=>{

const execute = exec;

const digest = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error('Flutter受控修订：' + message); };
const safePath = value => typeof value === 'string' && value.length > 0 && !isAbsolute(value)
  && !/[\\\x00-\x1f]/u.test(value) && value.split('/').every(part => part && part !== '.' && part !== '..');

// 产品资源阶段先验真共享工具并取得任务目录；这里只生成该任务的配置，不改共享SDK。
async function prepareFlutterTaskTools(root, work, platform, { signal, environment = {} } = {}) {
  signal?.throwIfAborted();
  if (!['android', 'ios', 'macos', 'sdk'].includes(platform)) return {};
  if (await realpath(root) !== root || await realpath(work) !== work
    || work === root || work.startsWith(root + '/') || root.startsWith(work + '/')) fail('工具任务目录不安全');
  const directory = join(work, 'flutter-tools');
  const prepareJava = async () => {
    if (!environment.JAVA_HOME) return {};
    if (!isAbsolute(environment.JAVA_HOME) || /[\r\n\x00]/u.test(environment.JAVA_HOME)) fail('受控Java路径无效');
    // Flutter的jdk-dir优先于Android Studio；配置仅写入当前任务HOME，不影响用户设置。
    await writeFile(join(work, '.flutter_settings'), JSON.stringify({ 'jdk-dir': environment.JAVA_HOME }), { flag: 'wx', mode: 0o600 });
    return { HOME: work };
  };
  if (platform === 'sdk') return prepareJava();
  if (platform !== 'android') {
    signal?.throwIfAborted();
    await mkdir(directory);
    const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
    // 使用验真rsync，额外处理其未落实的副本权限；入口不覆盖或替换系统工具。
    await writeFile(join(directory, 'rsync'), '#!'+environment.PRODUCT_BASH_BIN+'\n'
      // 验真rsync的本机接收端会经PATH再次调用rsync；协议端必须继承原始stdio，不能进入Node缓冲执行。
      + 'if [ "${1:-}" = "--server" ]; then exec '+quote(environment.PRODUCT_RSYNC_BIN)+' "$@"; fi\n'
      + 'exec ' + quote(process.execPath) + ' '
      + quote(fileURLToPath(import.meta.url)) + ' rsync "$@"\n', { flag: 'wx', mode: 0o700 });
    signal?.throwIfAborted();
    return { ...await prepareJava(), PATH: directory };
  }
  const gradleHome = environment.GRADLE_HOME;
  if (!gradleHome || !isAbsolute(gradleHome) || /[\r\n\x00]/u.test(gradleHome)) fail('Android任务缺少产品资源阶段受控Gradle');
  if (!environment.JAVA_HOME || !isAbsolute(environment.JAVA_HOME) || /[\r\n\x00]/u.test(environment.JAVA_HOME)) fail('Android任务缺少产品资源阶段受控Java');
  // 先校验唯一配置再生成插件目录；链接、双配置与错误入口都不得留下半成品。
  const candidates = [];
  for (const name of ['settings.gradle.kts', 'settings.gradle']) {
    const path = join(work, 'android', name);
    const info = await lstat(path).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (info) candidates.push({ path, info });
  }
  if (candidates.length !== 1) fail('Android任务必须只有一份settings配置');
  const { path: settings, info } = candidates[0];
  if (!info.isFile() || info.nlink !== 1 || info.size > 1024 * 1024 || await realpath(settings) !== settings) fail('Android任务配置不是独占普通文件');
  const handle = await open(settings, constants.O_RDWR | constants.O_NOFOLLOW);
  try {
    const opened = await handle.stat();
    if (opened.dev !== info.dev || opened.ino !== info.ino) fail('Android任务配置已被替换');
    const input = await handle.readFile('utf8');
    const pattern = /includeBuild\((["'])\$flutterSdkPath\/packages\/flutter_tools\/gradle\1\)/gu;
    if ([...input.matchAll(pattern)].length !== 1) fail('Android配置缺少唯一Flutter插件入口');
    signal?.throwIfAborted();
    const target = await prepareGradle(root, work, { signal });
    const current = await lstat(settings);
    if (await realpath(settings) !== settings || current.dev !== info.dev || current.ino !== info.ino
      || current.nlink !== 1 || await readFile(settings, 'utf8') !== input) fail('Android任务配置已被替换或修改');
    signal?.throwIfAborted();
    // 使用已核对的文件描述符写入，不能重新打开后来替换的路径。
    const content = Buffer.from(input.replace(pattern, 'includeBuild(' + JSON.stringify(target) + ')'));
    let offset = 0;
    while (offset < content.length) {
      const { bytesWritten } = await handle.write(content, offset, content.length - offset, offset);
      if (!bytesWritten) fail('Android任务配置写入未完成');
      offset += bytesWritten;
    }
    await handle.truncate(content.length);
    signal?.throwIfAborted();
  } finally { await handle.close(); }
  // Flutter固定调用工程gradlew；仅替换本任务的入口链接，不触碰源工程或共享SDK。
  const wrapper = join(work, 'android/gradlew');
  const existing = await lstat(wrapper).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (existing && !existing.isSymbolicLink() && (!existing.isFile() || existing.nlink !== 1)) fail('Gradle任务入口不是独占文件');
  signal?.throwIfAborted();
  if (existing) {
    const current = await lstat(wrapper);
    if (current.dev !== existing.dev || current.ino !== existing.ino) fail('Gradle任务入口已被替换');
    await rm(wrapper);
  }
  const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
  await writeFile(wrapper, '#!'+environment.PRODUCT_BASH_BIN+'\n# 只执行本产品验真的工具，不下载Wrapper分发。\nexport JAVA_HOME='
    + quote(environment.JAVA_HOME) + '\nexec '
    + quote(join(gradleHome, 'bin/gradle')) + ' "$@"\n', { flag: 'wx', mode: 0o700 });
  signal?.throwIfAborted();
  return prepareJava();
}

// 只修正受控SDK复制到本任务的framework/dSYM；不跟随链接chmod共享原件。
async function copyFlutterArtifact(args, environment = process.env, run = execute) {
  const root = environment.FLUTTER_ROOT, work = environment.PRODUCT_WORK_DIR;
  if (!root || !work || await realpath(root) !== root || await realpath(work) !== work
    || work === root || work.startsWith(root + '/') || root.startsWith(work + '/')) fail('引擎复制缺少安全任务目录');
  const source = args.at(-2), destination = args.at(-1);
  let copied;
  if (source && isAbsolute(source) && source.startsWith(root + '/')
    && /\.(?:framework|dSYM)\/?$/u.test(source)) {
    const output = resolve(destination || '.');
    if (!output.startsWith(work + '/') || await realpath(output) !== output) fail('引擎副本不属于当前任务');
    if (!safePath(relative(root, await realpath(source)))) fail('引擎原件越界');
    copied = source.endsWith('/') ? output : join(output, source.split('/').at(-1));
    const existing = await lstat(copied).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (existing?.isSymbolicLink()) fail('引擎目标不能是符号链接');
    // 复用目标可能含硬链接，必须在rsync写入前拒绝，不能等复制后才保护原件。
    const inspect = async path => {
      const info = await lstat(path);
      if (info.isSymbolicLink()) return;
      if (await realpath(path) !== path || (!info.isDirectory() && (!info.isFile() || info.nlink !== 1))) fail('引擎目标不是独占生成物');
      if (info.isDirectory()) for (const name of await readdir(path)) await inspect(join(path, name));
    };
    if (existing) await inspect(copied);
    if (args.some(value => ['--inplace', '--keep-dirlinks', '--copy-dirlinks', '--copy-links', '-K', '-k', '-L'].includes(value))) fail('引擎复制禁止跟随目标链接');
  }
  if(!environment.PRODUCT_RSYNC_BIN||!environment.PRODUCT_BASH_BIN)fail('缺少验真同步和Shell入口');
  const result = await run(environment.PRODUCT_RSYNC_BIN, args, { env: environment, maxBuffer: 8 * 1024 * 1024 });
  if (copied) {
    const writable = async path => {
      const info = await lstat(path);
      if (info.isSymbolicLink()) {
        if (path === copied) fail('引擎目标已被替换为链接');
        return;
      }
      if (await realpath(path) !== path || (!info.isDirectory() && (!info.isFile() || info.nlink !== 1))) fail('引擎副本不是独占生成物');
      // 持有无跟随描述符并核对inode，chmod不重新打开可能已被替换的路径。
      const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const current = await handle.stat();
        if (current.dev !== info.dev || current.ino !== info.ino || await realpath(path) !== path) fail('引擎副本路径已被替换');
        await handle.chmod((current.mode & 0o777) | 0o200);
      } finally { await handle.close(); }
      if (info.isDirectory()) for (const name of await readdir(path)) await writable(join(path, name));
    };
    await writable(copied);
  }
  return result;
}

function verifyFlutterVersion(actual, tool) {
  if (actual?.frameworkVersion !== tool.version || actual?.frameworkRevision !== tool.patch.source.split('/').at(-1)) fail('实际Flutter版本不符或官方提交不符');
}

// 调用方先验真SDK并占有本端工作目录；这里只生成Gradle配置，不复制SDK或业务源码。
async function prepareGradle(root, work, { signal } = {}) {
  signal?.throwIfAborted();
  if (!isAbsolute(root) || !isAbsolute(work) || await realpath(root) !== root || await realpath(work) !== work
    || work === root || work.startsWith(root + '/') || root.startsWith(work + '/')) fail('Gradle工作目录必须独立于SDK原件');
  const sdk = join(root, 'packages/flutter_tools/gradle');
  const source = join(sdk, 'src');
  if (await realpath(source) !== source || !(await lstat(source)).isDirectory()) fail('Gradle源码必须位于SDK原件内');
  const files = [];
  for (const name of ['settings.gradle.kts', 'build.gradle.kts']) {
    const path = join(sdk, name), info = await lstat(path);
    if (!info.isFile() || info.size > 1024 * 1024 || await realpath(path) !== path) fail('Gradle配置不是SDK内受限普通文件');
    files.push([name, await readFile(path)]);
  }
  files.push(['gradle.properties', Buffer.from('# Kotlin只在本任务Gradle进程编译，不创建用户目录守护进程状态。\n'
    + 'kotlin.compiler.execution.strategy=in-process\nkotlin.daemon.useFallbackStrategy=false\n')]);
  const directory = join(work, 'flutter-gradle');
  // mkdir排他创建，已有目录不属于本次准备，禁止接管或清理。
  signal?.throwIfAborted();
  await mkdir(directory, { mode: 0o700 });
  const identity = await lstat(directory);
  const assertDirectory = async () => {
    const current = await lstat(directory);
    if (await realpath(directory) !== directory || current.dev !== identity.dev || current.ino !== identity.ino) fail('Gradle配置目录已被替换，保留现场');
  };
  try {
    for (const [name, content] of files) {
      signal?.throwIfAborted();
      await assertDirectory();
      const handle = await open(join(directory, name), 'wx', 0o600);
      try { await handle.writeFile(content); } finally { await handle.close(); }
    }
    await assertDirectory();
    signal?.throwIfAborted();
    await symlink(source, join(directory, 'src'), 'dir');
    signal?.throwIfAborted();
    return directory;
  } catch (error) {
    await assertDirectory();
    await rm(directory, { recursive: true });
    throw error;
  }
}

function flutterEnvironment(root, env) {
  const work = env.PRODUCT_WORK_DIR;
  const result = { ...env, HOME: work, USERPROFILE: work, TMPDIR: work,
    XDG_CONFIG_HOME: join(work, 'config'), XDG_CACHE_HOME: join(work, 'cache'),
    PUB_CACHE: join(root, 'bin/cache/pub'), BOT: 'true', FLUTTER_ROOT: root,
    // 官方开关在AI环境也返回NoOpAnalytics，防止首次提示混入机器JSON。
    FLUTTER_SUPPRESS_ANALYTICS: 'true' };
  for (const name of ['FLUTTER_ALREADY_LOCKED', 'FLUTTER_TOOL_ARGS', 'FLUTTER_HOST', 'PUB_HOSTED_URL', 'FLUTTER_STORAGE_BASE_URL']) delete result[name];
  return result;
}

// Windows直接执行SDK自带Dart与快照，避免Node把批处理文件当作原生可执行文件。
function flutterCommand(root, args, platform = process.platform) {
  const path = platform === 'win32' ? win32 : posix;
  if (!['win32', 'darwin', 'linux'].includes(platform)) fail('不支持的Flutter宿主');
  return platform === 'win32'
    ? [path.join(root, 'bin/cache/dart-sdk/bin/dart.exe'),
      [path.join(root, 'bin/cache/flutter_tools.snapshot'), ...args]]
    : [path.join(root, 'bin/flutter'), args];
}

async function checkFlutter(root, tool, env, { signal, run = execute } = {}) {
  const work = env.PRODUCT_WORK_DIR;
  if (!work || await realpath(work) !== work || work === root || work.startsWith(root + sep)) fail('运行状态不能写入SDK原件');
  const environment = flutterEnvironment(root, env);
  const [command, args] = flutterCommand(root, ['--suppress-analytics', '--version', '--machine']);
  const result = await run(command, args, {
    cwd: work, env: environment, signal, timeout: 60_000, maxBuffer: 1024 * 1024,
  });
  const actual = JSON.parse(result.stdout);
  verifyFlutterVersion(actual, tool);
}

// 补丁只接受完整基线与结果摘要；行号、上下文任一不符都拒绝，不做模糊匹配。
function parsePatch(text) {
  if (!text) fail('补丁为空');
  if (typeof text !== 'string' || !text.endsWith('\n')) fail('补丁必须完整换行结束');
  const lines = text.split('\n');
  const files = []; let at = 0;
  while (at < lines.length && !lines[at].startsWith('diff --git ')) {
    if (lines[at] && !lines[at].startsWith('#')) fail('补丁头部存在未登记内容');
    at++;
  }
  while (at < lines.length - 1) {
    const header = /^diff --git a\/(\S+) b\/(\S+)$/u.exec(lines[at++]);
    if (!header || header[1] !== header[2] || !safePath(header[1])) fail('补丁文件路径无效');
    const path = header[1];
    if (files.some(file => file.path === path)) fail('补丁文件重复');
    const hashes = /^index ([a-f0-9]{64})\.\.([a-f0-9]{64})$/u.exec(lines[at++]);
    if (!hashes || lines[at++] !== '--- a/' + path || lines[at++] !== '+++ b/' + path) fail('缺少完整文件摘要');
    const hunks = [];
    while (at < lines.length - 1 && !lines[at].startsWith('diff --git ')) {
      const hunk = /^@@ -(\d+),(\d+) \+(\d+),(\d+) @@$/u.exec(lines[at++]);
      if (!hunk) fail('补丁区块格式错误');
      const old = [], next = [];
      while (at < lines.length - 1 && /^[ +\-]/u.test(lines[at])) {
        const line = lines[at++];
        if (line[0] !== '+') old.push(line.slice(1));
        if (line[0] !== '-') next.push(line.slice(1));
      }
      if (old.length !== Number(hunk[2]) || next.length !== Number(hunk[4])) fail('补丁区块行数错误');
      hunks.push({ oldLine: Number(hunk[1]), nextLine: Number(hunk[3]), old, next });
    }
    if (!hunks.length) fail('补丁文件没有改动区块');
    files.push({ path, before: hashes[1], after: hashes[2], hunks });
  }
  if (!files.length) fail('补丁为空');
  return files;
}

function transformFile(input, file) {
  if (digest(input) !== file.before) fail('源码基线摘要不符：' + file.path);
  const lines = input.toString('utf8').split('\n');
  if (lines.pop() !== '') fail('源码必须使用末尾换行');
  const result = []; let cursor = 0;
  for (const hunk of file.hunks) {
    const offset = hunk.oldLine === 0 ? 0 : hunk.oldLine - 1;
    if (offset < cursor || offset > lines.length) fail('补丁区块重叠或越界');
    result.push(...lines.slice(cursor, offset));
    if ((hunk.nextLine === 0 ? 0 : hunk.nextLine - 1) !== result.length
      || JSON.stringify(lines.slice(offset, offset + hunk.old.length)) !== JSON.stringify(hunk.old)) fail('补丁上下文不符');
    result.push(...hunk.next); cursor = offset + hunk.old.length;
  }
  result.push(...lines.slice(cursor));
  const output = Buffer.from(result.join('\n') + '\n');
  if (digest(output) !== file.after) fail('修订结果摘要不符：' + file.path);
  return output;
}

async function readPatch(root, patch) {
  if (!patch || !safePath(patch.path) || !/^[a-f0-9]{64}$/u.test(patch.sha256)
    || !/^https:\/\/github\.com\/flutter\/flutter\/commit\/[a-f0-9]{40}$/u.test(patch.source)) fail('修订登记不完整');
  const path = join(root, patch.path);
  if (!(await lstat(path)).isFile() || await realpath(path) !== path) fail('补丁必须为库内普通文件');
  const input = await readFile(path);
  if (input.length > 4 * 1024 * 1024 || digest(input) !== patch.sha256) fail('补丁摘要不符');
  return parsePatch(input.toString('utf8'));
}

// 只在受控安装器独占的候选对象中准备；应用阶段不允许产品重新生成SDK快照。
async function prepareFlutter(root, { tool, files, env, signal, run = execute }) {
  root = resolve(root);
  if (await realpath(root) !== root || !env?.PRODUCT_WORK_DIR) fail('准备环境不完整');
  const work = resolve(env.PRODUCT_WORK_DIR);
  if (await realpath(work) !== work || work === root || work.startsWith(root + sep)) fail('准备状态不能写入SDK原件');
  const cache = join(root, 'bin/cache');
  const version = JSON.parse(await readFile(join(cache, 'flutter.version.json'), 'utf8'));
  if (version.frameworkVersion !== tool.version || version.frameworkRevision !== tool.patch.source.split('/').at(-1)) fail('SDK版本或官方提交不符');
  await applyPatch(root, files);
  await prepareFlutterSnapshot(root, { tool, files, env, signal, run });
}

// 安装候选的所有源码必须达到唯一目标后才重建快照；已安装原件不得原位修订。
async function prepareFlutterSnapshot(root, { tool, files, env, signal, run = execute, offline = false }) {
  root = resolve(root);
  const work = env?.PRODUCT_WORK_DIR && resolve(env.PRODUCT_WORK_DIR);
  if (await realpath(root) !== root || !work || await realpath(work) !== work
    || work === root || work.startsWith(root + sep)) fail('准备状态不能写入SDK原件');
  const cache = join(root, 'bin/cache');
  const version = JSON.parse(await readFile(join(cache, 'flutter.version.json'), 'utf8'));
  if (version.frameworkVersion !== tool.version || version.frameworkRevision !== tool.patch.source.split('/').at(-1)) fail('SDK版本或官方提交不符');
  if (!Array.isArray(files) || !files.length) fail('快照缺少完整修订输入');
  for (const file of files) {
    const path = join(root, file.path);
    if (!safePath(file.path) || !(await lstat(path)).isFile() || await realpath(path) !== path
      || digest(await readFile(path)) !== file.after) fail('快照源码未达到修订结果：' + file.path);
  }
  const tools = join(root, 'packages/flutter_tools');
  const dart = join(cache, 'dart-sdk/bin', process.platform === 'win32' ? 'dart.exe' : 'dart');
  const lock = await readFile(join(tools, 'pubspec.lock'));
  const environment = flutterEnvironment(root, env);
  // 现有验真对象维护使用离线缓存；首次Runner准备仍由正式Pub按锁获取工具依赖。
  await run(dart, ['pub', 'get', '--enforce-lockfile', '--no-precompile', ...(offline ? ['--offline'] : [])], {
    cwd: tools, env: environment, signal, timeout: 600_000, maxBuffer: 2 * 1024 * 1024,
  });
  if (!(await readFile(join(tools, 'pubspec.lock'))).equals(lock)) fail('工具依赖锁文件被改变');
  const configPath = join(tools, '.dart_tool/package_config.json');
  // Pub生成配置后再校验真实位置，不能沿着符号链接改写当前候选之外的文件。
  if (!(await lstat(configPath)).isFile() || await realpath(configPath) !== configPath) fail('Dart包配置不是候选内普通文件');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  if (!Array.isArray(config.packages) || !config.packages.length) fail('Dart包配置不完整');
  // 候选对象最终会原位改名；包地址全部改为对象内部相对地址，不保留准备目录绝对路径。
  for (const item of config.packages) {
    const path = fileURLToPath(new URL(item.rootUri, pathToFileURL(configPath)));
    const canonical = await realpath(path);
    if (!canonical.startsWith(root + sep)) fail('工具依赖指向共享对象之外');
    item.rootUri = relative(dirname(configPath), canonical).split(sep).map(encodeURIComponent).join('/') + '/';
  }
  const handle = await open(configPath, 'w');
  try { await handle.writeFile(JSON.stringify(config)); } finally { await handle.close(); }
  const snapshot = join(cache, 'flutter_tools.snapshot');
  // 旧快照属于尚未发布的当前候选，必须删除后由修订源码重新产生，失败不保留可运行旧工具。
  await rm(snapshot, { force: true });
  await run(dart, ['--snapshot=' + snapshot, '--snapshot-kind=app-jit', '--packages=' + configPath,
    join(tools, 'bin/flutter_tools.dart'), '--version', '--machine'], {
    cwd: work, env: environment, signal, timeout: 300_000, maxBuffer: 2 * 1024 * 1024,
  });
  if (!(await lstat(snapshot)).isFile() || !(await lstat(snapshot)).size) fail('修订快照没有生成');
  await checkFlutter(root, tool, environment, { signal, run });
}

async function applyPatch(root, files) {
  root = resolve(root);
  if (await realpath(root) !== root || !(await lstat(root)).isDirectory()) fail('准备目录不安全');
  const lockPath = join(root, 'flutter.lock');
  const lock = await open(lockPath, 'wx', 0o600);
  try {
    const prepared = [];
    for (const file of files) {
      if (!safePath(file.path)) fail('源码路径越界');
      const path = join(root, file.path);
      if (!(await lstat(path)).isFile() || await realpath(path) !== path) fail('源码不是准备目录内的普通文件');
      prepared.push({ path, output: transformFile(await readFile(path), file) });
    }
    for (const { path, output } of prepared) {
      const temporary = path + '.pending'; let owned = false;
      try {
        const handle = await open(temporary, 'wx', 0o600); owned = true;
        try { await handle.writeFile(output); await handle.sync(); } finally { await handle.close(); }
        await rename(temporary, path); owned = false;
      } finally { if (owned) await rm(temporary); }
    }
  } finally { await lock.close(); await rm(lockPath); }
}

return {prepareFlutterTaskTools,copyFlutterArtifact,parsePatch,prepareFlutter,checkFlutter};})();
const appleSystemTools = Object.freeze({
  codesign: '/usr/bin/codesign', security: '/usr/bin/security',
  xcrun: '/usr/bin/xcrun', 'xcode-select': '/usr/bin/xcode-select', xattr: '/usr/bin/xattr',
});
const appleBundleTools = new Set([
  'xcodebuild', 'make', 'clang', 'clang++', 'swift', 'swiftc', 'ar', 'ld', 'as', 'nm', 'ranlib', 'strip', 'lipo', 'libtool',
  'otool', 'install_name_tool', 'codesign_allocate', 'devicectl', 'xctrace', 'actool', 'ibtool', 'notarytool', 'llvm-nm',
]);
async function verifyAppleTools(library,{names=['xcodebuild'],signal,run=exec,environment=process.env}={}){
  const wanted=library.tools.find(tool=>tool.id==='xcode');if(!wanted||!Array.isArray(names)||names.some(name=>!appleBundleTools.has(name)&&!Object.hasOwn(appleSystemTools,name)))fail('Apple工具需求无效');
  const supplied=resourceSupplies.getStore();if(supplied)return supplied.acquireApple({...supplyRequirements().apple,names});
  const env=cleanEnvironment(environment),developerDirectory=(await run('/usr/bin/xcode-select',['-p'],{env,signal})).stdout.trim();await directory(developerDirectory);
  const tools={};for(const name of names){const path=appleSystemTools[name]||(name==='xcodebuild'?join(developerDirectory,'usr/bin/xcodebuild'):(await run('/usr/bin/xcrun',['--find',name],{env:{...env,DEVELOPER_DIR:developerDirectory},signal})).stdout.trim());await regular(path);tools[name]=await realpath(path);}
  return {developerDirectory,version:wanted.version,tools};
 }

const toolDefinitions=[{"id":"cmake","title":"CMake","version":"3.31.6","source":"https://cmake.org/download/","command":"cmake","archive":null,"archives":{"macos":{"url":"https://dl.google.com/android/repository/cmake-3.31.6-darwin.zip","sha256":"861a219b872cd0d9aee282b617fe3bd32f83925db3a0d28fd45d0553452e903a","root":"."},"linux-arm":{"url":"https://github.com/Kitware/CMake/releases/download/v3.31.6/cmake-3.31.6-linux-aarch64.tar.gz","sha256":"b4cc788d63112b2749b40627e719eb5d3b8ed8f00c36d77189f4019cfe64bc9e","root":"cmake-3.31.6-linux-aarch64"},"linux-amd":{"url":"https://dl.google.com/android/repository/cmake-3.31.6-linux.zip","sha256":"ce136bb4b02580b36e53d9ccfe5275069655e6ef7d46d6fe2fcf88cfdf8fb761","root":"."},"windows":{"url":"https://dl.google.com/android/repository/cmake-3.31.6-windows.zip","sha256":"dd54cc866afbd2cfc46189dd4864cdfb5bf8e2a34ec56e80188da0a138567b5e","root":"."}},"managed":false,"requires":[]},{"id":"git","title":"Git","version":"2.54.0","source":"https://git-scm.com/download/mac","command":"git","archive":{"url":"https://www.kernel.org/pub/software/scm/git/git-2.54.0.tar.xz","sha256":"f689162364c10de79ef89aa8dbf48731eb057e34edbbd20aca510ce0154681a3","root":"git-2.54.0","executable":"bin/git","kind":"native-source"},"managed":true,"requires":["node","xcode","perl","python","gettext"]},{"id":"node","title":"Node.js","version":"25.2.1","source":"https://nodejs.org/dist/v25.2.1/SHASUMS256.txt","command":"node","archives":{"linux-arm":{"url":"https://nodejs.org/dist/v25.2.1/node-v25.2.1-linux-arm64.tar.xz","sha256":"75f910b5234d3ee324ceebcf41e2c3c221c4c2225463a02ecd685b884155e0f6","root":"node-v25.2.1-linux-arm64"},"linux-amd":{"url":"https://nodejs.org/dist/v25.2.1/node-v25.2.1-linux-x64.tar.xz","sha256":"b9f6a97e81c89a9df45526b4f86dafdccaf12b82295f7bf35bdb2b0f5e68744f","root":"node-v25.2.1-linux-x64"},"windows":{"url":"https://nodejs.org/dist/v25.2.1/node-v25.2.1-win-x64.zip","sha256":"f97ba75ead7720652f3925d9cf8661e083a28c6b98ea77acc83903d77a9dd688","root":"node-v25.2.1-win-x64"}},"archive":{"url":"https://nodejs.org/dist/v25.2.1/node-v25.2.1-darwin-arm64.tar.gz","sha256":"be87e21bd235a451fad02c89e5bf7cb17e206e4cd89dd5664f20d19e7dfde6f9","root":"node-v25.2.1-darwin-arm64","executable":"bin/node","kind":"extract"},"managed":true,"requires":[]},{"id":"python","title":"Python","version":"3.14.3","source":"https://www.python.org/downloads/macos/","command":"python3","archive":{"url":"https://www.python.org/ftp/python/3.14.3/Python-3.14.3.tar.xz","sha256":"a97d5549e9ad81fe17159ed02c68774ad5d266c72f8d9a0b5a9c371fe85d902b","root":"Python-3.14.3","executable":"bin/python3.14","kind":"native-source"},"managed":true,"requires":["node","xcode","openssl"],"dependencies":[{"name":"xz","version":"5.8.2","url":"https://github.com/tukaani-project/xz/releases/download/v5.8.2/xz-5.8.2.tar.xz","sha256":"890966ec3f5d5cc151077879e157c0593500a522f413ac50ba26d22a9a145214","root":"xz-5.8.2"}]},{"id":"rust","title":"Rust","version":"1.97.1","source":"https://static.rust-lang.org/dist/channel-rust-1.97.1.toml","command":"rustc","archive":{"url":"https://static.rust-lang.org/dist/2026-07-16/rust-1.97.1-aarch64-apple-darwin.tar.xz","sha256":"c9748cc86107734a2a024069908a895de7caa2d37062fb641eef9f756938ace2","root":"rust-1.97.1-aarch64-apple-darwin","executable":"bin/rustc","kind":"rust"},"components":[{"target":"aarch64-linux-android","url":"https://static.rust-lang.org/dist/2026-07-16/rust-std-1.97.1-aarch64-linux-android.tar.xz","sha256":"d664a49fb80d125d68f779112aa97d2a3f5def5f807a35540aa77fce0b350c4f","root":"rust-std-1.97.1-aarch64-linux-android"},{"target":"aarch64-apple-ios","url":"https://static.rust-lang.org/dist/2026-07-16/rust-std-1.97.1-aarch64-apple-ios.tar.xz","sha256":"1d58e856a295852a419f92445fe6b3db268049eb6222a672d52c52de52f36631","root":"rust-std-1.97.1-aarch64-apple-ios"},{"target":"aarch64-apple-ios-sim","url":"https://static.rust-lang.org/dist/2026-07-16/rust-std-1.97.1-aarch64-apple-ios-sim.tar.xz","sha256":"3deb094abb0f7382aad761b8e1e89cebd68bec0591d39e313330ef709b99f6e4","root":"rust-std-1.97.1-aarch64-apple-ios-sim"},{"target":"aarch64-unknown-linux-gnu","url":"https://static.rust-lang.org/dist/2026-07-16/rust-std-1.97.1-aarch64-unknown-linux-gnu.tar.xz","sha256":"46aed8e63186350004d8ec6afca798811e6530b514352e5a8a26f3dc4939b3be","root":"rust-std-1.97.1-aarch64-unknown-linux-gnu"},{"target":"wasm32-unknown-unknown","url":"https://static.rust-lang.org/dist/2026-07-16/rust-std-1.97.1-wasm32-unknown-unknown.tar.xz","sha256":"fa0edb6e9f34faae5735554d62d50875eded839dc707d0f1c01467a918d8453b","root":"rust-std-1.97.1-wasm32-unknown-unknown"}],"managed":true,"requires":[]},{"id":"flutter","title":"Flutter","version":"3.47.2","source":"https://storage.googleapis.com/flutter_infra_release/releases/releases_macos.json","command":"flutter","archive":{"url":"https://storage.googleapis.com/flutter_infra_release/releases/stable/macos/flutter_macos_arm64_3.47.2-stable.zip","sha256":"f456fd6733053d9301828a2e702d6cbec872923126809aa8c48eb0a696d6cc01","root":"flutter","executable":"bin/flutter","kind":"extract"},"patch":{"path":"flutter.patch","sha256":"76ef76ca73b2b00423009bd7ebca62f23026e2c9d411504324d2c8ff64da4657","source":"https://github.com/flutter/flutter/commit/d3b14c876900e553bc736ca19295fc09e3853e8e"},"managed":true,"requires":[]},{"id":"java","title":"Java (Temurin)","version":"17.0.20.1","source":"https://api.adoptium.net/v3/assets/feature_releases/17/ga?architecture=aarch64&image_type=jdk&os=mac","command":"java","archive":{"url":"https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.20.1%2B1/OpenJDK17U-jdk_aarch64_mac_hotspot_17.0.20.1_1.tar.gz","sha256":"196d13ba5f10414bef7f6a05a9b3f00edacb18ebacef2b99485db9e2ee18f0e8","root":"jdk-17.0.20.1+1","executable":"Contents/Home/bin/java","kind":"extract"},"managed":true,"requires":[]},{"id":"gradle","title":"Gradle","version":"9.1.0","source":"https://services.gradle.org/distributions/gradle-9.1.0-bin.zip.sha256","command":"gradle","archive":{"url":"https://services.gradle.org/distributions/gradle-9.1.0-bin.zip","sha256":"a17ddd85a26b6a7f5ddb71ff8b05fc5104c0202c6e64782429790c933686c806","root":"gradle-9.1.0","executable":"bin/gradle","kind":"extract"},"managed":true,"requires":["java"]},{"id":"android","title":"Android SDK","version":"37.0.1","source":"https://developer.android.com/studio","command":"adb","archive":null,"managed":false,"requires":[]},{"id":"android-sdk","title":"Android SDK Manager","version":"22.0","source":"https://developer.android.com/tools/sdkmanager","command":"sdkmanager","archive":null,"managed":false,"requires":[]},{"id":"android-ndk","title":"Android NDK","version":"28.2.13676358","source":"https://developer.android.com/ndk/downloads","command":"ndk-build","archive":null,"managed":false,"requires":[]},{"id":"cocoapods","title":"CocoaPods","version":"1.17.0","source":"https://cocoapods.org","command":"pod","archive":{"url":"https://rubygems.org/downloads/cocoapods-1.17.0.gem","sha256":"dacf6f11ac3b00d60e6dd326485b616935230aacf95f385d145db27bfdf284af","root":".","executable":"bin/pod","kind":"gem"},"managed":true,"requires":["node","xcode","ruby","git"],"dependencies":[{"name":"CFPropertyList","version":"3.0.8","url":"https://rubygems.org/downloads/CFPropertyList-3.0.8.gem","sha256":"2c99d0d980536d3d7ab252f7bd59ac8be50fbdd1ff487c98c949bb66bb114261"},{"name":"activesupport","version":"6.1.7.10","url":"https://rubygems.org/downloads/activesupport-6.1.7.10.gem","sha256":"3f8e1f787a7bfbf765959ba509ef70af8293b35cb864078919365a12bf33d470"},{"name":"addressable","version":"2.9.0","url":"https://rubygems.org/downloads/addressable-2.9.0.gem","sha256":"7fdf6ac3660f7f4e867a0838be3f6cf722ace541dd97767fa42bc6cfa980c7af"},{"name":"algoliasearch","version":"1.27.5","url":"https://rubygems.org/downloads/algoliasearch-1.27.5.gem","sha256":"26c1cddf3c2ec4bd60c148389e42702c98fdac862881dc6b07a4c0b89ffec853"},{"name":"atomos","version":"0.1.3","url":"https://rubygems.org/downloads/atomos-0.1.3.gem","sha256":"7d43b22f2454a36bace5532d30785b06de3711399cb1c6bf932573eda536789f"},{"name":"base64","version":"0.3.0","url":"https://rubygems.org/downloads/base64-0.3.0.gem","sha256":"27337aeabad6ffae05c265c450490628ef3ebd4b67be58257393227588f5a97b"},{"name":"claide","version":"1.1.0","url":"https://rubygems.org/downloads/claide-1.1.0.gem","sha256":"6d3c5c089dde904d96aa30e73306d0d4bd444b1accb9b3125ce14a3c0183f82e"},{"name":"cocoapods-core","version":"1.17.0","url":"https://rubygems.org/downloads/cocoapods-core-1.17.0.gem","sha256":"a9e3d0dd36ab1b48935236d77a15cad9171217f13c6010c8e2ae3c0f455daf5b"},{"name":"cocoapods-deintegrate","version":"1.0.5","url":"https://rubygems.org/downloads/cocoapods-deintegrate-1.0.5.gem","sha256":"517c2a448ef563afe99b6e7668704c27f5de9e02715a88ee9de6974dc1b3f6a2"},{"name":"cocoapods-downloader","version":"2.1","url":"https://rubygems.org/downloads/cocoapods-downloader-2.1.gem","sha256":"bb6ebe1b3966dc4055de54f7a28b773485ac724fdf575d9bee2212d235e7b6d1"},{"name":"cocoapods-plugins","version":"1.0.0","url":"https://rubygems.org/downloads/cocoapods-plugins-1.0.0.gem","sha256":"725d17ce90b52f862e73476623fd91441b4430b742d8a071000831efb440ca9a"},{"name":"cocoapods-search","version":"1.0.1","url":"https://rubygems.org/downloads/cocoapods-search-1.0.1.gem","sha256":"1b133b0e6719ed439bd840e84a1828cca46425ab73a11eff5e096c3b2df05589"},{"name":"cocoapods-trunk","version":"1.6.0","url":"https://rubygems.org/downloads/cocoapods-trunk-1.6.0.gem","sha256":"5f5bda8c172afead48fa2d43a718cf534b1313c367ba1194cebdeb9bfee9ed31"},{"name":"cocoapods-try","version":"1.2.0","url":"https://rubygems.org/downloads/cocoapods-try-1.2.0.gem","sha256":"145b946c6e7747ed0301d975165157951153d27469e6b2763c83e25c84b9defe"},{"name":"colored2","version":"3.1.2","url":"https://rubygems.org/downloads/colored2-3.1.2.gem","sha256":"b13c2bd7eeae2cf7356a62501d398e72fde78780bd26aec6a979578293c28b4a"},{"name":"concurrent-ruby","version":"1.3.7","url":"https://rubygems.org/downloads/concurrent-ruby-1.3.7.gem","sha256":"4412caec3a5ea2e5fdc52076724c071a81f2c0593d83b2ac8cbb8ca63b3151b0"},{"name":"ethon","version":"0.18.0","url":"https://rubygems.org/downloads/ethon-0.18.0.gem","sha256":"b598afc9f30448cb068b850714b7d6948e941476095d04f90a4ac65b8d6efcb2"},{"name":"ffi","version":"1.17.4","url":"https://rubygems.org/downloads/ffi-1.17.4.gem","sha256":"bcd1642e06f0d16fc9e09ac6d49c3a7298b9789bcb58127302f934e437d60acf"},{"name":"fourflusher","version":"2.3.1","url":"https://rubygems.org/downloads/fourflusher-2.3.1.gem","sha256":"1b3de61c7c791b6a4e64f31e3719eb25203d151746bb519a0292bff1065ccaa9"},{"name":"fuzzy_match","version":"2.0.4","url":"https://rubygems.org/downloads/fuzzy_match-2.0.4.gem","sha256":"b5de4f95816589c5b5c3ad13770c0af539b75131c158135b3f3bbba75d0cfca5"},{"name":"gh_inspector","version":"1.1.3","url":"https://rubygems.org/downloads/gh_inspector-1.1.3.gem","sha256":"04cca7171b87164e053aa43147971d3b7f500fcb58177698886b48a9fc4a1939"},{"name":"httpclient","version":"2.9.0","url":"https://rubygems.org/downloads/httpclient-2.9.0.gem","sha256":"4b645958e494b2f86c2f8a2f304c959baa273a310e77a2931ddb986d83e498c8"},{"name":"i18n","version":"1.14.8","url":"https://rubygems.org/downloads/i18n-1.14.8.gem","sha256":"285778639134865c5e0f6269e0b818256017e8cde89993fdfcbfb64d088824a5"},{"name":"json","version":"2.20.0","url":"https://rubygems.org/downloads/json-2.20.0.gem","sha256":"9362bc6e55a952b056abf9167cf053358181c904cb70cd6eee0808ea830fc32b"},{"name":"logger","version":"1.7.0","url":"https://rubygems.org/downloads/logger-1.7.0.gem","sha256":"196edec7cc44b66cfb40f9755ce11b392f21f7967696af15d274dde7edff0203"},{"name":"minitest","version":"5.26.1","url":"https://rubygems.org/downloads/minitest-5.26.1.gem","sha256":"f16a63d4278e230bba342c3bda3006a69c5216d46461b77dd57f7c7c529b5a96"},{"name":"molinillo","version":"0.8.0","url":"https://rubygems.org/downloads/molinillo-0.8.0.gem","sha256":"efbff2716324e2a30bccd3eba1ff3a735f4d5d53ffddbc6a2f32c0ca9433045d"},{"name":"mutex_m","version":"0.3.0","url":"https://rubygems.org/downloads/mutex_m-0.3.0.gem","sha256":"cfcb04ac16b69c4813777022fdceda24e9f798e48092a2b817eb4c0a782b0751"},{"name":"nanaimo","version":"0.4.0","url":"https://rubygems.org/downloads/nanaimo-0.4.0.gem","sha256":"faf069551bab17f15169c1f74a1c73c220657e71b6e900919897a10d991d0723"},{"name":"nap","version":"1.1.0","url":"https://rubygems.org/downloads/nap-1.1.0.gem","sha256":"949691660f9d041d75be611bb2a8d2fd559c467537deac241f4097d9b5eea576"},{"name":"netrc","version":"0.11.0","url":"https://rubygems.org/downloads/netrc-0.11.0.gem","sha256":"de1ce33da8c99ab1d97871726cba75151113f117146becbe45aa85cb3dabee3f"},{"name":"nkf","version":"0.3.0","url":"https://rubygems.org/downloads/nkf-0.3.0.gem","sha256":"357a8dbeba38b727b75930f665146546076a394a1c243faf634ff176e3588895"},{"name":"public_suffix","version":"4.0.7","url":"https://rubygems.org/downloads/public_suffix-4.0.7.gem","sha256":"8be161e2421f8d45b0098c042c06486789731ea93dc3a896d30554ee38b573b8"},{"name":"rexml","version":"3.4.4","url":"https://rubygems.org/downloads/rexml-3.4.4.gem","sha256":"19e0a2c3425dfbf2d4fc1189747bdb2f849b6c5e74180401b15734bc97b5d142"},{"name":"ruby-macho","version":"4.1.0","url":"https://rubygems.org/downloads/ruby-macho-4.1.0.gem","sha256":"23dab37f7de0fe1e14f3bfa73bebc423ae8cd1d4fdb3e5585abc45a841eca920"},{"name":"typhoeus","version":"1.6.0","url":"https://rubygems.org/downloads/typhoeus-1.6.0.gem","sha256":"bacc41c23e379547e29801dc235cd1699b70b955a1ba3d32b2b877aa844c331d"},{"name":"tzinfo","version":"2.0.6","url":"https://rubygems.org/downloads/tzinfo-2.0.6.gem","sha256":"8daf828cc77bcf7d63b0e3bdb6caa47e2272dcfaf4fbfe46f8c3a9df087a829b"},{"name":"xcodeproj","version":"1.28.1","url":"https://rubygems.org/downloads/xcodeproj-1.28.1.gem","sha256":"6f12670f00739d9817ca27ac89d6ef01cc86050e22a0bc08a3131487e5b5cddc"},{"name":"zeitwerk","version":"2.6.18","url":"https://rubygems.org/downloads/zeitwerk-2.6.18.gem","sha256":"bd2d213996ff7b3b364cd342a585fbee9797dbc1c0c6d868dc4150cc75739781"}]},{"id":"xcode","title":"Xcode","version":"27.0","source":"https://developer.apple.com/xcode/","command":"xcodebuild","archive":null,"managed":false,"requires":[]},{"id":"perl","title":"Perl","version":"5.42.3","source":"https://www.cpan.org/src/5.0/","command":"perl","archive":{"url":"https://www.cpan.org/src/5.0/perl-5.42.3.tar.xz","sha256":"c9387e1473a1866935cb047ece7c2e0a80767a3acdecb79d4a375f8a95970ddc","root":"perl-5.42.3","executable":"bin/perl","kind":"native-source"},"managed":true,"requires":["node","xcode"]},{"id":"openssl","title":"OpenSSL","version":"3.6.3","source":"https://github.com/openssl/openssl/releases/download/openssl-3.6.3/","command":"openssl","archive":{"url":"https://github.com/openssl/openssl/releases/download/openssl-3.6.3/openssl-3.6.3.tar.gz","sha256":"243a86649cf6f23eeb6a2ff2456e09e5d77dd9018a54d3d96b0c6bdd6ba6c7f1","root":"openssl-3.6.3","executable":"bin/openssl","kind":"native-source"},"managed":true,"requires":["node","xcode","perl"]},{"id":"ruby","title":"Ruby","version":"3.4.11","source":"https://cache.ruby-lang.org/pub/ruby/3.4/","command":"ruby","archive":{"url":"https://cache.ruby-lang.org/pub/ruby/3.4/ruby-3.4.11.tar.gz","sha256":"5c22be44524312b3d433d68739bcc530633b1da5ef8ba0afa0a37680da17d3de","root":"ruby-3.4.11","executable":"bin/ruby","kind":"native-source"},"managed":true,"requires":["node","xcode","openssl"],"dependencies":[{"name":"libyaml","version":"0.2.5","url":"https://pyyaml.org/download/libyaml/yaml-0.2.5.tar.gz","sha256":"c642ae9b75fee120b2d96c712538bd2cf283228d2337df2cf2988e3c02678ef4","root":"yaml-0.2.5"}]},{"id":"m4","title":"GNU M4","version":"1.4.21","source":"https://ftp.gnu.org/gnu/m4/","command":"m4","archive":{"url":"https://ftp.gnu.org/gnu/m4/m4-1.4.21.tar.xz","sha256":"f25c6ab51548a73a75558742fb031e0625d6485fe5f9155949d6486a2408ab66","root":"m4-1.4.21","executable":"bin/m4","kind":"native-source"},"managed":true,"requires":["node","xcode"]},{"id":"bison","title":"GNU Bison","version":"3.8.2","source":"https://ftp.gnu.org/gnu/bison/","command":"bison","archive":{"url":"https://ftp.gnu.org/gnu/bison/bison-3.8.2.tar.xz","sha256":"9bba0214ccf7f1079c5d59210045227bcf619519840ebfa80cd3849cff5a5bf2","root":"bison-3.8.2","executable":"bin/bison","kind":"native-source"},"managed":true,"requires":["node","xcode","m4"]},{"id":"flex","title":"Flex","version":"2.6.4","source":"https://github.com/westes/flex/releases/download/v2.6.4/","command":"flex","archive":{"url":"https://github.com/westes/flex/releases/download/v2.6.4/flex-2.6.4.tar.gz","sha256":"e87aae032bf07c26f85ac0ed3250998c37621d95f8bd748b31f15b33c45ee995","root":"flex-2.6.4","executable":"bin/flex","kind":"native-source"},"managed":true,"requires":["node","xcode","m4","bison"]},{"id":"gettext","title":"GNU Gettext","version":"1.0","source":"https://ftp.gnu.org/gnu/gettext/","command":"msgfmt","archive":{"url":"https://ftp.gnu.org/gnu/gettext/gettext-1.0.tar.gz","sha256":"85d99b79c981a404874c02e0342176cf75c7698e2b51fe41031cf6526d974f1a","root":"gettext-1.0","executable":"bin/msgfmt","kind":"native-source"},"managed":true,"requires":["node","xcode","perl","m4","bison","flex"]},{"id":"posix","title":"macOS POSIX 基础工具","version":"27.0","source":"https://opensource.apple.com/","command":"bash","archive":{"url":"https://opensource.apple.com/","sha256":"8ca7560842b9606bcbe9628248866cc52675775a956574199716515dadf020fe","root":"macos-posix-27.0","executable":"bin/bash","kind":"apple-posix"},"managed":true,"requires":["node","xcode"]},{"id":"bash","title":"GNU Bash","version":"5.3.20","source":"https://www.gnu.org/software/bash/","command":"bash","archive":{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3.tar.gz","sha256":"0d5cd86965f869a26cf64f4b71be7b96f90a3ba8b3d74e27e8e9d9d5550f31ba","root":"bash-5.3","executable":"bin/bash","kind":"native-source"},"upstream_patches":[{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-001","sha256":"1f608434364af86b9b45c8b0ea3fb3b165fb830d27697e6cdfc7ac17dee3287f"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-002","sha256":"e385548a00130765ec7938a56fbdca52447ab41fabc95a25f19ade527e282001"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-003","sha256":"f245d9c7dc3f5a20d84b53d249334747940936f09dc97e1dcb89fc3ab37d60ed"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-004","sha256":"9591d245045529f32f0812f94180b9d9ce9023f5a765c039b852e5dfc99747d0"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-005","sha256":"cca1ef52dbbf433bc98e33269b64b2c814028efe2538be1e2c9a377da90bc99d"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-006","sha256":"29119addefed8eff91ae37fd51822c31780ee30d4a28376e96002706c995ff10"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-007","sha256":"c0976bbfffa1453c7cfdd62058f206a318568ff2d690f5d4fa048793fa3eb299"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-008","sha256":"097cd723cbfb8907674ac32214063a3fd85282657ec5b4e544d2c0f719653fb4"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-009","sha256":"eee30fe78a4b0cb2fe20e010e00308899cfc613e0774ebb3c8557a1552f24f8c"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-010","sha256":"cf76f1cce2ea300c18bff9f002d21f280cc931acd17c28518110b93fe6e72569"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-011","sha256":"0298df8f5ea2a31d3be43ed7d269c5b3c7c342dd5b570bea7f64d66dcbbe7531"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-012","sha256":"d71379b39bebaedaf123414414e77fb458a0a43b9ad3116594c6df7ca6754573"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-013","sha256":"042f9cda967e24bf4211944697441e93d06ff42b4b998629a98a1b249279f200"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-014","sha256":"bd4360b401d38507e358783dcad8536a99c6789f0d3a5bd0cfb8c4a34144696c"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-015","sha256":"55b79ceee2fc27f6767eed697e939a7eb2fe2a28c01556bd75f18d581014f46e"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-016","sha256":"9ea29b266b7d24cb34d0ff3f1c4631e4d527bfe2d1ef15d17cdb924bf31ef767"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-017","sha256":"443b927b45c1558ca72052410f8b8f6e5152b617ed707061a2781d4375b0d1c3"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-018","sha256":"ae715d76c50341d7d7095e9a8d2eeed1ca9546152c2ac7289206f90cf30ac697"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-019","sha256":"a25c581e4d0057dea3833918438a930e2e86ee4c6dc17fe15267b7f04cbc4e3d"},{"url":"https://ftp.gnu.org/gnu/bash/bash-5.3-patches/bash53-020","sha256":"df217ed3a9122aa2286d9b67bbe348661b6a9db262b580c29150dae55d532896"}],"managed":true,"requires":["node","xcode","posix"]},{"id":"grep","title":"GNU grep","version":"3.12","source":"https://www.gnu.org/software/grep/","command":"grep","archive":{"url":"https://ftp.gnu.org/gnu/grep/grep-3.12.tar.xz","sha256":"2649b27c0e90e632eadcd757be06c6e9a4f48d941de51e7c0f83ff76408a07b9","root":"grep-3.12","executable":"bin/grep","kind":"native-source"},"managed":true,"requires":["node","xcode","posix"]},{"id":"sed","title":"GNU sed","version":"4.10","source":"https://www.gnu.org/software/sed/","command":"sed","archive":{"url":"https://ftp.gnu.org/gnu/sed/sed-4.10.tar.xz","sha256":"b8e72182b2ec96a3574e2998c47b7aaa64cc20ce000d8e9ac313cc07cecf28c7","root":"sed-4.10","executable":"bin/sed","kind":"native-source"},"managed":true,"requires":["node","xcode","posix"]}];
const androidPlatformDefinitions=[{"path":"platforms;android-35","version":"2","source":"https://dl.google.com/android/repository/platform-35_r02.zip","sha256":"14c793e5c50d69bd3a5b15e42bf763b39ea90d8d3fb3a4a690b5a7b05c299d6f"}];
const androidDefinitions=[{"path":"platforms;android-36","version":"2","url":"https://dl.google.com/android/repository/platform-36_r02.zip","sha256":"37607369a28c5b640b3a7998868d45898ebcb777565a0e85f9acf36f29631d2e","root":"android-36"},{"path":"build-tools;36.0.0","version":"36.0.0","url":"https://dl.google.com/android/repository/build-tools_r36_macosx.zip","sha256":"04e7f3a72044de4926fa038fa0e251a37bba1e1c3fb8beab6f8401bfd9eb4bf3","root":"android-16"},{"path":"platform-tools","version":"37.0.1","url":"https://dl.google.com/android/repository/platform-tools_r37.0.1-darwin.zip","sha256":"ee39ad5967e95c2a07f04dbcbde96b1a0c916ba376096db5d2f498b7727a5d1d","root":"platform-tools"},{"path":"cmdline-tools;22.0","version":"22.0","url":"https://dl.google.com/android/repository/commandlinetools-mac_arm64-15859902_latest.zip","sha256":"835b62a26162b229b441d1f6d4680383815a270809eb33522c0d480fa5002c4e","root":"cmdline-tools"},{"tool":"cmake"},{"path":"ndk;28.2.13676358","version":"28.2.13676358","url":"https://dl.google.com/android/repository/android-ndk-r28c-darwin.zip","sha256":"0d4599e8bbf1a1668a0d51a541729b2246360f350018a2081d0b302dbb594f2a","root":"android-ndk-r28c"}];
const flutterPatch="# Flutter Android new DSL — fixed source d3b14c876900e553bc736ca19295fc09e3853e8e\n# Copyright notices and the upstream BSD license are retained in the SDK.\ndiff --git a/packages/flutter_tools/gradle/build.gradle.kts b/packages/flutter_tools/gradle/build.gradle.kts\nindex 8bce67c561f7a91bb743b443242b8d804ddc4190dc5524278bdecf8797515008..7438ec7066f34d2b597426a58105e831d677a4278cd3ee415587a9768678d667\n--- a/packages/flutter_tools/gradle/build.gradle.kts\n+++ b/packages/flutter_tools/gradle/build.gradle.kts\n@@ -7,8 +7,13 @@\n plugins {\n     `java-gradle-plugin`\n     groovy\n+    kotlin(\"jvm\") version \"2.2.20\"\n+    kotlin(\"plugin.sam.with.receiver\") version \"2.2.20\"\n+}\n+\n+// 保留Gradle Action的官方隐式接收者语义，编译插件与Kotlin使用同一版本。\n+samWithReceiver {\n+    annotation(\"org.gradle.api.HasImplicitReceiver\")\n-    `kotlin-dsl`\n-    kotlin(\"jvm\") version \"2.2.20\"\n }\n \n group = \"dev.flutter.plugin\"\n@@ -50,12 +55,14 @@\n }\n \n dependencies {\n+    // 使用固定Kotlin编译插件，不应用绑定Gradle内嵌Kotlin版本的kotlin-dsl插件。\n+    implementation(gradleKotlinDsl())\n     // Versions available https://mvnrepository.com/artifact/androidx.annotation/annotation-jvm.\n     // Version release notes https://developer.android.com/jetpack/androidx/releases/annotation\n     compileOnly(\"androidx.annotation:annotation-jvm:1.9.1\")\n     // When bumping, also update:\n     //  * KGP error version in packages/flutter_tools/gradle/src/main/kotlin/DependencyVersionChecker.kt\n+    implementation(\"org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.20\")\n-    implementation(\"org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.0\")\n     // Update to 1.8.0 when min kotlin is 2.1\n     // https://github.com/Kotlin/kotlinx.serialization/releases for kotlin version compatibility.\n     // All kotlinx implementation dependencies must work with the oldest kotlin supported versions.\n@@ -65,10 +72,10 @@\n     //  * AGP version constants in packages/flutter_tools/lib/src/android/gradle_utils.dart\n     //  * ndkVersion constant in packages/flutter_tools/lib/src/android/gradle_utils.dart\n     //  * ndkVersion in FlutterExtension in packages/flutter_tools/gradle/src/main/kotlin/FlutterExtension.kt\n+    compileOnly(\"com.android.tools.build:gradle:9.0.1\")\n-    compileOnly(\"com.android.tools.build:gradle:8.11.1\")\n \n     testImplementation(kotlin(\"test\"))\n+    testImplementation(\"com.android.tools.build:gradle:9.0.1\")\n-    testImplementation(\"com.android.tools.build:gradle:8.11.1\")\n     testImplementation(\"org.mockito:mockito-core:5.8.0\")\n     testImplementation(\"io.mockk:mockk:1.13.16\")\n }\ndiff --git a/packages/flutter_tools/gradle/src/main/kotlin/FlutterExtension.kt b/packages/flutter_tools/gradle/src/main/kotlin/FlutterExtension.kt\nindex a8ca02d55798c200d766e245dae9df20565cb9d638d4887b51bf617abac938a1..383540448a0810cb60e7b6197455fdcf3bd1771720e82a42ed10e5af7e8b43b9\n--- a/packages/flutter_tools/gradle/src/main/kotlin/FlutterExtension.kt\n+++ b/packages/flutter_tools/gradle/src/main/kotlin/FlutterExtension.kt\n@@ -45,4 +45,5 @@\n      * Specifies the relative directory to the Flutter project directory.\n      * In an app project, this is ../.. since the app's Gradle build file is under android/app.\n      */\n+    // 本机任务在插件应用时即需准确源码根；标准Flutter工程继续使用官方相对路径。\n+    var source: String? = System.getenv(\"PRODUCT_SOURCE_DIR\") ?: \"../..\"\n-    var source: String? = \"../..\"\ndiff --git a/packages/flutter_tools/gradle/src/main/kotlin/FlutterPlugin.kt b/packages/flutter_tools/gradle/src/main/kotlin/FlutterPlugin.kt\nindex aba6c2f7331ea613227fed69666f8edb3839c09413188ccab64989dabe4bcd6f..afc1c54599c2b8cacbf5d957a198b168106aa95b341a79243bc66e47e4201ed1\n--- a/packages/flutter_tools/gradle/src/main/kotlin/FlutterPlugin.kt\n+++ b/packages/flutter_tools/gradle/src/main/kotlin/FlutterPlugin.kt\n@@ -7,11 +7,20 @@\n import com.android.build.api.dsl.ApplicationExtension\n import com.android.build.api.dsl.BuildType\n import com.android.build.api.variant.AndroidComponentsExtension\n+import com.android.build.api.variant.ApplicationVariant\n+import com.android.build.api.variant.Variant\n+import com.android.build.api.variant.FilterConfiguration\n+import com.android.build.api.variant.BuiltArtifactsLoader\n+import com.android.build.api.artifact.SingleArtifact\n+import org.gradle.api.DefaultTask\n+import org.gradle.api.file.DirectoryProperty\n+import org.gradle.api.provider.Property\n+import org.gradle.api.tasks.Input\n+import org.gradle.api.tasks.InputDirectory\n+import org.gradle.api.tasks.OutputDirectory\n+import org.gradle.api.tasks.Internal\n+import org.gradle.api.tasks.TaskAction\n+import org.gradle.api.tasks.Sync\n-import com.android.build.gradle.AbstractAppExtension\n-import com.android.build.gradle.LibraryExtension\n-import com.android.build.gradle.api.ApkVariant\n-import com.android.build.gradle.tasks.PackageAndroidArtifact\n-import com.android.build.gradle.tasks.ProcessAndroidResources\n import com.flutter.gradle.FlutterPluginConstants.PLATFORM_ABI_LIST\n import com.flutter.gradle.FlutterPluginUtils.readPropertiesIfExist\n import com.flutter.gradle.plugins.PluginHandler\n@@ -246,12 +255,12 @@\n             }\n             localEngineHost = engineHostOut.name\n         }\n+        FlutterPluginUtils.getAndroidExtension(project).buildTypes.all {\n-        FlutterPluginUtils.getLegacyAndroidExtension(project).buildTypes.all {\n             addFlutterDependencies(this)\n         }\n     }\n \n+    private fun addFlutterDependencies(buildType: BuildType) {\n-    private fun addFlutterDependencies(buildType: com.android.builder.model.BuildType) {\n         FlutterPluginUtils.addFlutterDependencies(\n             project!!,\n             buildType,\n@@ -305,203 +314,15 @@\n             FlutterPluginUtils.addTasksForOutputsAppLinkSettings(projectToAddTasksTo)\n         }\n \n+        val targetPlatforms = FlutterPluginUtils.getTargetPlatforms(projectToAddTasksTo)\n-        val targetPlatforms: List<String> =\n-            FlutterPluginUtils.getTargetPlatforms(projectToAddTasksTo)\n-\n-        // The Android Gradle Plugin is always applied to Flutter Android projects, so its components\n-        // extension is expected to be present. Use getByType (not findByType) so a misconfiguration\n-        // fails loudly rather than silently skipping libapp.so registration.\n-        val androidComponents = projectToAddTasksTo.extensions.getByType(AndroidComponentsExtension::class.java)\n-        val targetPlatformsList = targetPlatforms\n-        androidComponents.onVariants { variant ->\n-            val capitalizeVariantName = FlutterPluginUtils.capitalize(variant.name)\n-            val compileTaskName = flutterCompileTaskName(variant.name)\n-            val copyJniLibsTaskProvider: TaskProvider<CopyFlutterJniLibsTask> =\n-                projectToAddTasksTo.tasks.register(\n-                    \"copyJniLibs${FLUTTER_BUILD_PREFIX}$capitalizeVariantName\",\n-                    CopyFlutterJniLibsTask::class.java\n-                ) {\n-                    // The Flutter compile task is registered later (in the legacy\n-                    // `applicationVariants` callback in addFlutterDeps) and only for variants that\n-                    // are actually built as a Flutter app. It is absent for e.g. an\n-                    // `assembleAndroidTest` build, where `shouldConfigureFlutterTask` returns false.\n-                    // Look it up tolerantly (findByName, not named) so this task degrades to a no-op\n-                    // with empty output instead of failing to be created when there is no Flutter\n-                    // build for the variant. See https://github.com/flutter/flutter/issues/188785.\n-                    dependsOn(projectToAddTasksTo.tasks.matching { it.name == compileTaskName })\n-                    intermediateDir.set(\n-                        projectToAddTasksTo.layout.dir(\n-                            projectToAddTasksTo.provider {\n-                                val compileTask = projectToAddTasksTo.tasks.findByName(compileTaskName) as? FlutterTask\n-                                compileTask?.outputDirectory\n-                            }\n-                        )\n-                    )\n-                    this.targetPlatforms.set(targetPlatformsList)\n-                }\n-            variant.sources.jniLibs?.addGeneratedSourceDirectory(\n-                copyJniLibsTaskProvider,\n-                CopyFlutterJniLibsTask::destinationDir\n-            )\n-        }\n-\n-        val flutterPlugin = this\n-\n         if (FlutterPluginUtils.isFlutterAppProject(projectToAddTasksTo)) {\n+            configureAbis(projectToAddTasksTo, FlutterPluginUtils.getAndroidApplicationExtension(projectToAddTasksTo))\n-            val appExtension = FlutterPluginUtils.getAndroidApplicationExtension(projectToAddTasksTo)\n-            configureAbis(projectToAddTasksTo, appExtension)\n-            val android: AbstractAppExtension =\n-                projectToAddTasksTo.extensions.findByName(\"android\") as AbstractAppExtension\n-            android.applicationVariants.configureEach {\n-                val variant = this\n-                val assembleTask = variant.assembleProvider.get()\n-                if (!FlutterPluginUtils.shouldConfigureFlutterTask(\n-                        projectToAddTasksTo,\n-                        assembleTask\n-                    )\n-                ) {\n-                    return@configureEach\n-                }\n-                val copyFlutterAssetsTask: Task =\n-                    addFlutterDeps(variant, flutterPlugin, targetPlatforms)\n-\n-                // TODO(gmackall): Migrate to AGPs variant api.\n-                //    https://github.com/flutter/flutter/issues/166550\n-                @Suppress(\"DEPRECATION\")\n-                val variantOutput: com.android.build.gradle.api.BaseVariantOutput = variant.outputs.first()\n-                val processResources: ProcessAndroidResources =\n-                    try {\n-                        variantOutput.processResourcesProvider.get()\n-                    } catch (e: UnknownTaskException) {\n-                        // TODO(gmackall): Migrate to AGPs variant api.\n-                        //    https://github.com/flutter/flutter/issues/166550\n-                        @Suppress(\"DEPRECATION\")\n-                        variantOutput.processResources\n-                    }\n-                processResources.dependsOn(copyFlutterAssetsTask)\n-\n-                // Copy the output APKs into a known location, so `flutter run` or `flutter build apk`\n-                // can discover them. By default, this is `<app-dir>/build/app/outputs/flutter-apk/<filename>.apk`.\n-                //\n-                // The filename consists of `app<-abi>?<-flavor-name>?-<build-mode>.apk`.\n-                // Where:\n-                //   * `abi` can be `armeabi-v7a|arm64-v8a|x86_64` only if the flag `split-per-abi` is set.\n-                //   * `flavor-name` is the flavor used to build the app in lower case if the assemble task is called.\n-                //   * `build-mode` can be `release|debug|profile`.\n-                variant.outputs.forEach { output ->\n-                    assembleTask.doLast {\n-                        // TODO(gmackall): Migrate to AGPs variant api.\n-                        //    https://github.com/flutter/flutter/issues/166550\n-                        @Suppress(\"DEPRECATION\")\n-                        output as com.android.build.gradle.api.ApkVariantOutput\n-                        val packageApplicationProvider: PackageAndroidArtifact =\n-                            variant.packageApplicationProvider.get()\n-                        val outputDirectory: Directory =\n-                            packageApplicationProvider.outputDirectory.get()\n-                        val outputDirectoryStr: String = outputDirectory.toString()\n-                        var filename = \"app\"\n-\n-                        // TODO(gmackall): Migrate to AGPs variant api.\n-                        //    https://github.com/flutter/flutter/issues/166550\n-                        @Suppress(\"DEPRECATION\")\n-                        val abi = output.getFilter(com.android.build.VariantOutput.FilterType.ABI)\n-                        if (abi != null && abi.isNotEmpty()) {\n-                            filename += \"-$abi\"\n-                        }\n-                        if (variant.flavorName != null && variant.flavorName.isNotEmpty()) {\n-                            filename += \"-${FlutterPluginUtils.lowercase(variant.flavorName)}\"\n-                        }\n-                        filename += \"-${FlutterPluginUtils.buildModeFor(variant.buildType)}\"\n-                        projectToAddTasksTo.copy {\n-                            from(File(\"$outputDirectoryStr/${output.outputFileName}\"))\n-                            into(projectToAddTasksTo.layout.buildDirectory.dir(\"outputs/flutter-apk\"))\n-                            rename { \"$filename.apk\" }\n-                        }\n-                    }\n-                }\n-            }\n-            getPluginHandler(projectToAddTasksTo).configurePlugins(engineVersion!!)\n-            FlutterPluginUtils.detectLowCompileSdkVersionOrNdkVersion(\n-                projectToAddTasksTo,\n-                getPluginHandler(projectToAddTasksTo).getPluginList()\n-            )\n-            FlutterPluginUtils.detectApplyingKotlinGradlePlugin(\n-                projectToAddTasksTo\n-            )\n-            return\n         }\n+        // 同一个公开变体回调同时注册编译、资源与JNI，避免跨回调按名称猜测任务。\n+        val components = projectToAddTasksTo.extensions.getByType(AndroidComponentsExtension::class.java)\n+        components.onVariants { variant ->\n+            addFlutterDeps(variant, this, targetPlatforms)\n-        // Flutter host module project (Add-to-app).\n-        val hostAppProjectName: String? =\n-            if (projectToAddTasksTo.rootProject.hasProperty(\"flutter.hostAppProjectName\")) {\n-                projectToAddTasksTo.rootProject.property(\n-                    \"flutter.hostAppProjectName\"\n-                ) as? String\n-            } else {\n-                \"app\"\n-            }\n-        val appProject: Project? =\n-            projectToAddTasksTo.rootProject.findProject(\":$hostAppProjectName\")\n-        check(appProject != null) {\n-            \"Project :$hostAppProjectName doesn't exist. To customize the host app project name, set `flutter.hostAppProjectName=<project-name>` in gradle.properties.\"\n         }\n-        // Wait for the host app project configuration.\n-        appProject.afterEvaluate {\n-            val androidLibraryExtension =\n-                projectToAddTasksTo.extensions.findByType(LibraryExtension::class.java)\n-            check(androidLibraryExtension != null)\n-            androidLibraryExtension.libraryVariants.all libraryVariantAll@{\n-                val libraryVariant = this\n-                var copyFlutterAssetsTask: Task? = null\n-                val androidAppExtension =\n-                    appProject.extensions.findByName(\"android\") as? AbstractAppExtension\n-                check(androidAppExtension != null)\n-                androidAppExtension.applicationVariants.all applicationVariantAll@{\n-                    val appProjectVariant = this\n-                    val appAssembleTask: Task = appProjectVariant.assembleProvider.get()\n-                    if (!FlutterPluginUtils.shouldConfigureFlutterTask(project, appAssembleTask)) {\n-                        return@applicationVariantAll\n-                    }\n-\n-                    // Find a compatible application variant in the host app.\n-                    //\n-                    // For example, consider a host app that defines the following variants:\n-                    // | ----------------- | ----------------------------- |\n-                    // |   Build Variant   |   Flutter Equivalent Variant  |\n-                    // | ----------------- | ----------------------------- |\n-                    // |   freeRelease     |   release                     |\n-                    // |   freeDebug       |   debug                       |\n-                    // |   freeDevelop     |   debug                       |\n-                    // |   profile         |   profile                     |\n-                    // | ----------------- | ----------------------------- |\n-                    //\n-                    // This mapping is based on the following rules:\n-                    // 1. If the host app build variant name is `profile` then the equivalent\n-                    //    Flutter variant is `profile`.\n-                    // 2. If the host app build variant is debuggable\n-                    //    (e.g. `buildType.debuggable = true`), then the equivalent Flutter\n-                    //    variant is `debug`.\n-                    // 3. Otherwise, the equivalent Flutter variant is `release`.\n-                    val variantBuildMode: String =\n-                        FlutterPluginUtils.buildModeFor(libraryVariant.buildType)\n-                    if (FlutterPluginUtils.buildModeFor(appProjectVariant.buildType) != variantBuildMode) {\n-                        return@applicationVariantAll\n-                    }\n-                    copyFlutterAssetsTask = copyFlutterAssetsTask ?: addFlutterDeps(\n-                        libraryVariant,\n-                        flutterPlugin,\n-                        targetPlatforms\n-                    )\n-                    // TODO(gmackall): Migrate to AGPs variant api.\n-                    //    https://github.com/flutter/flutter/issues/166550\n-                    val mergeAssets =\n-                        projectToAddTasksTo\n-                            .tasks\n-                            .findByPath(\":$hostAppProjectName:merge${FlutterPluginUtils.capitalize(appProjectVariant.name)}Assets\")\n-                    check(mergeAssets != null)\n-                    mergeAssets.dependsOn(copyFlutterAssetsTask)\n-                }\n-            }\n-        }\n         getPluginHandler(projectToAddTasksTo).configurePlugins(engineVersion!!)\n         FlutterPluginUtils.detectLowCompileSdkVersionOrNdkVersion(\n             projectToAddTasksTo,\n@@ -600,26 +421,12 @@\n             }\n         }\n \n+        // 只消费AGP公开变体，不读取内部打包任务或已删除的变体接口。\n-        /**\n-         * Finds a task by name, returning null if the task does not exist.\n-         */\n-        private fun findTaskOrNull(\n-            project: Project,\n-            taskName: String\n-        ): Task? =\n-            try {\n-                project.tasks.named(taskName).get()\n-            } catch (ignored: UnknownTaskException) {\n-                null\n-            }\n-\n-        // TODO(gmackall): Migrate to AGPs variant api.\n-        //    https://github.com/flutter/flutter/issues/166550\n         private fun addFlutterDeps(\n+            variant: Variant,\n-            @Suppress(\"DEPRECATION\") variant: com.android.build.gradle.api.BaseVariant,\n             flutterPlugin: FlutterPlugin,\n             targetPlatforms: List<String>\n+        ): Unit {\n-        ): Task {\n             // Shorthand\n             val project: Project = flutterPlugin.project!!\n \n@@ -654,51 +461,19 @@\n             val validateDeferredComponentsValue: Boolean =\n                 project.findProperty(\"validate-deferred-components\")?.toString()?.toBoolean() ?: true\n \n+            val buildType = FlutterPluginUtils.getAndroidExtension(project).buildTypes.getByName(requireNotNull(variant.buildType))\n+            val variantBuildMode = FlutterPluginUtils.buildModeFor(buildType)\n+            val flavorValue = variant.flavorName.orEmpty()\n+            if (!FlutterPluginUtils.supportsBuildMode(project, variantBuildMode)) return\n+            if (variant is ApplicationVariant && FlutterPluginUtils.shouldProjectSplitPerAbi(project)) {\n-            if (FlutterPluginUtils.shouldProjectSplitPerAbi(project)) {\n                 variant.outputs.forEach { output ->\n+                    val abi = output.filters.firstOrNull { it.filterType == FilterConfiguration.FilterType.ABI }?.identifier\n+                    val abiVersionCode = FlutterPluginConstants.ABI_VERSION[abi]\n-                    // need to force this as the API does not return the right thing for our use.\n-                    // TODO(gmackall): Migrate to AGPs variant api.\n-                    //    https://github.com/flutter/flutter/issues/166550\n-                    @Suppress(\"DEPRECATION\")\n-                    output as com.android.build.gradle.api.ApkVariantOutput\n-                    val versionCodeIfPresent: Int? = if (variant is ApkVariant) variant.versionCode else null\n-\n-                    // TODO(gmackall): Migrate to AGPs variant api.\n-                    //    https://github.com/flutter/flutter/issues/166550\n-                    @Suppress(\"DEPRECATION\")\n-                    val filterIdentifier: String? =\n-                        output.getFilter(com.android.build.VariantOutput.FilterType.ABI)\n-                    val abiVersionCode: Int? = FlutterPluginConstants.ABI_VERSION[filterIdentifier]\n                     if (abiVersionCode != null && !FlutterPluginUtils.shouldForceVersionCodeIgnoringAbi(project)) {\n+                        output.versionCode.set(output.versionCode.get() + abiVersionCode * 1000)\n-                        output.versionCodeOverride = abiVersionCode * 1000 + (\n-                            versionCodeIfPresent\n-                                ?: variant.mergedFlavor.versionCode as Int\n-                        )\n                     }\n                 }\n             }\n-\n-            // Build an AAR when this property is defined.\n-            val isBuildingAar: Boolean = project.hasProperty(\"is-plugin\")\n-            // In add to app scenarios, a Gradle project contains a `:flutter` and `:app` project.\n-            // `:flutter` is used as a subproject when these tasks exists and the build isn't building an AAR.\n-            // TODO(gmackall): I think this is just always null? Which is great news! Consider removing.\n-            val packageAssets: Task? =\n-                findTaskOrNull(\n-                    project,\n-                    \"package${FlutterPluginUtils.capitalize(variant.name)}Assets\"\n-                )\n-            val cleanPackageAssets: Task? =\n-                findTaskOrNull(\n-                    project,\n-                    \"cleanPackage${FlutterPluginUtils.capitalize(variant.name)}Assets\"\n-                )\n-\n-            val isUsedAsSubproject: Boolean =\n-                packageAssets != null && cleanPackageAssets != null && !isBuildingAar\n-\n-            val variantBuildMode: String = FlutterPluginUtils.buildModeFor(variant.buildType)\n-            val flavorValue: String = variant.flavorName\n             val taskName: String = flutterCompileTaskName(variant.name)\n             // The task provider below will shadow a lot of the variable names, so provide this reference\n             // to access them within that scope.\n@@ -714,7 +489,7 @@\n                     flutterRoot = flutterPlugin.flutterRoot\n                     flutterExecutable = flutterPlugin.flutterExecutable\n                     buildMode = variantBuildMode\n+                    minSdkVersion = variant.minSdk.apiLevel\n-                    minSdkVersion = variant.mergedFlavor.minSdkVersion!!.apiLevel\n                     localEngine = flutterPlugin.localEngine\n                     localEngineHost = flutterPlugin.localEngineHost\n                     localEngineSrcPath = flutterPlugin.localEngineSrcPath\n@@ -742,76 +517,42 @@\n                     validateDeferredComponents = validateDeferredComponentsValue\n                     flavor = flavorValue\n                 }\n+            // 生成目录经Sources API交给AGP，资源/JNI消费者自动获得准确任务依赖。\n+            val assets = project.tasks.register(\n+                \"copyFlutterAssets\" + FlutterPluginUtils.capitalize(variant.name),\n+                FlutterAssetsTask::class.java\n+            ) {\n+                dependsOn(compileTaskProvider)\n+                from(compileTaskProvider.map { File(requireNotNull(it.outputDirectory), \"flutter_assets\") }) { into(\"flutter_assets\") }\n+                destinationDirectory.set(project.layout.buildDirectory.dir(\"intermediates/flutter-assets/\" + variant.name))\n+                into(destinationDirectory)\n+            }\n+            variant.sources.assets?.addGeneratedSourceDirectory(assets, FlutterAssetsTask::destinationDirectory)\n+                ?: throw GradleException(\"Android variant has no assets sources: \" + variant.name)\n+            val jni = project.tasks.register(\n+                \"copyJniLibs\" + FLUTTER_BUILD_PREFIX + FlutterPluginUtils.capitalize(variant.name),\n+                CopyFlutterJniLibsTask::class.java\n+            ) {\n+                dependsOn(compileTaskProvider)\n+                intermediateDir.set(project.layout.dir(compileTaskProvider.map { requireNotNull(it.outputDirectory) }))\n+                this.targetPlatforms.set(targetPlatforms)\n+            }\n+            variant.sources.jniLibs?.addGeneratedSourceDirectory(jni, CopyFlutterJniLibsTask::destinationDir)\n+                ?: throw GradleException(\"Android variant has no JNI sources: \" + variant.name)\n+            if (variant is ApplicationVariant) {\n+                val copyApk = project.tasks.register(\n+                    \"copyFlutterApk\" + FlutterPluginUtils.capitalize(variant.name), FlutterApkTask::class.java\n-            val flutterCompileTask: FlutterTask = compileTaskProvider.get()\n-            val copyFlutterAssetsTaskProvider: TaskProvider<Copy> =\n-                project.tasks.register(\n-                    \"copyFlutterAssets${FlutterPluginUtils.capitalize(variant.name)}\",\n-                    Copy::class.java\n                 ) {\n+                    inputDirectory.set(variant.artifacts.get(SingleArtifact.APK))\n+                    destinationDirectory.set(project.layout.buildDirectory.dir(\"outputs/flutter-apk\"))\n+                    loader.set(variant.artifacts.getBuiltArtifactsLoader())\n+                    buildMode.set(variantBuildMode)\n+                    flavor.set(flavorValue)\n-                    dependsOn(flutterCompileTask)\n-                    with(flutterCompileTask.assets)\n-                    filePermissions {\n-                        user {\n-                            read = true\n-                            write = true\n-                        }\n-                    }\n-                    if (isUsedAsSubproject) {\n-                        // TODO(gmackall): above is always false, can delete\n-                        dependsOn(packageAssets)\n-                        dependsOn(cleanPackageAssets)\n-                        into(packageAssets!!.outputs)\n-                    }\n-                    val mergeAssets =\n-                        try {\n-                            variant.mergeAssetsProvider.get()\n-                        } catch (e: IllegalStateException) {\n-                            // TODO(gmackall): Migrate to AGPs variant api.\n-                            //    https://github.com/flutter/flutter/issues/166550\n-                            @Suppress(\"DEPRECATION\")\n-                            variant.mergeAssets\n-                        }\n-                    dependsOn(mergeAssets)\n-                    dependsOn(\"clean${FlutterPluginUtils.capitalize(mergeAssets.name)}\")\n-                    mergeAssets.mustRunAfter(\"clean${FlutterPluginUtils.capitalize(mergeAssets.name)}\")\n-                    into(mergeAssets.outputDir)\n                 }\n+                // assemble是公开生命周期入口；APK位置与文件清单由Artifacts API提供。\n+                project.tasks.matching { it.name == \"assemble\" + FlutterPluginUtils.capitalize(variant.name) }\n+                    .configureEach { dependsOn(copyApk) }\n-            val copyFlutterAssetsTask: Task = copyFlutterAssetsTaskProvider.get()\n-            if (!isUsedAsSubproject) {\n-                // TODO(gmackall): Migrate to AGPs variant api.\n-                //    https://github.com/flutter/flutter/issues/166550\n-                @Suppress(\"DEPRECATION\")\n-                val variantOutput: com.android.build.gradle.api.BaseVariantOutput = variant.outputs.first()\n-                val processResources =\n-                    try {\n-                        variantOutput.processResourcesProvider.get()\n-                    } catch (e: IllegalStateException) {\n-                        // TODO(gmackall): Migrate to AGPs variant api.\n-                        //    https://github.com/flutter/flutter/issues/166550\n-                        @Suppress(\"DEPRECATION\")\n-                        variantOutput.processResources\n-                    }\n-                processResources.dependsOn(copyFlutterAssetsTask)\n             }\n-            // The following tasks use the output of copyFlutterAssetsTask,\n-            // so it's necessary to declare it as an dependency since Gradle 8.\n-            // See https://docs.gradle.org/8.1/userguide/validation_problems.html#implicit_dependency.\n-            val tasksToCheck =\n-                listOf(\n-                    \"compress${FlutterPluginUtils.capitalize(variant.name)}Assets\",\n-                    \"bundle${FlutterPluginUtils.capitalize(variant.name)}Aar\",\n-                    \"bundle${FlutterPluginUtils.capitalize(variant.name)}LocalLintAar\"\n-                )\n-            tasksToCheck.forEach { taskTocheck ->\n-                try {\n-                    project.tasks.named(taskTocheck).configure {\n-                        dependsOn(copyFlutterAssetsTask)\n-                    }\n-                } catch (ignored: UnknownTaskException) {\n-                    // ignored\n-                }\n-            }\n-            return copyFlutterAssetsTask\n         }\n     }\n \n@@ -823,3 +564,35 @@\n      */\n     private fun isInvokedFromAndroidStudio(): Boolean = project?.hasProperty(\"android.injected.invoked.from.ide\") == true\n }\n+\n+/** 公开资源生成任务：每个变体独占输出，禁止直接写入AGP内部合并目录。 */\n+abstract class FlutterAssetsTask : Sync() {\n+    @get:OutputDirectory\n+    abstract val destinationDirectory: DirectoryProperty\n+}\n+\n+/** 从AGP正式输出清单发现APK，不按内部任务类或固定文件位置猜测。 */\n+abstract class FlutterApkTask : DefaultTask() {\n+    @get:InputDirectory\n+    abstract val inputDirectory: DirectoryProperty\n+    @get:OutputDirectory\n+    abstract val destinationDirectory: DirectoryProperty\n+    @get:Internal\n+    abstract val loader: Property<BuiltArtifactsLoader>\n+    @get:Input\n+    abstract val buildMode: Property<String>\n+    @get:Input\n+    abstract val flavor: Property<String>\n+\n+    @TaskAction\n+    fun copyApks() {\n+        val artifacts = requireNotNull(loader.get().load(inputDirectory.get())) { \"APK metadata is missing\" }\n+        val output = destinationDirectory.get().asFile\n+        output.mkdirs()\n+        artifacts.elements.forEach { artifact ->\n+            val abi = artifact.filters.firstOrNull { it.filterType == FilterConfiguration.FilterType.ABI }?.identifier\n+            val name = listOfNotNull(\"app\", abi, flavor.get().takeIf { it.isNotEmpty() }?.lowercase(), buildMode.get()).joinToString(\"-\")\n+            File(artifact.outputFile).copyTo(File(output, name + \".apk\"), overwrite = true)\n+        }\n+    }\n+}\ndiff --git a/packages/flutter_tools/gradle/src/main/kotlin/FlutterPluginUtils.kt b/packages/flutter_tools/gradle/src/main/kotlin/FlutterPluginUtils.kt\nindex 92f05b75bae280223c3cea04fceb8c7860c65a6b464399a5a51d71dfe90f0c05..8c22286256d2ee68c5b27f60854d74df56f07de9f1cb77423cd3193aa43c8f58\n--- a/packages/flutter_tools/gradle/src/main/kotlin/FlutterPluginUtils.kt\n+++ b/packages/flutter_tools/gradle/src/main/kotlin/FlutterPluginUtils.kt\n@@ -7,10 +7,11 @@\n import com.android.build.api.AndroidPluginVersion\n import com.android.build.api.artifact.SingleArtifact\n import com.android.build.api.dsl.ApplicationExtension\n+import com.android.build.api.dsl.ApplicationBuildType\n import com.android.build.api.dsl.LibraryExtension\n import com.android.build.api.variant.AndroidComponentsExtension\n+import com.android.build.api.dsl.CommonExtension\n+import com.android.build.api.dsl.BuildType\n-import com.android.build.gradle.BaseExtension\n-import com.android.builder.model.BuildType\n import com.flutter.gradle.plugins.PluginHandler\n import com.flutter.gradle.tasks.DeepLinkJsonFromManifestTask\n import com.flutter.gradle.tasks.PrintTask\n@@ -472,7 +473,7 @@\n     internal fun buildModeFor(buildType: BuildType): String {\n         if (buildType.name == \"profile\") {\n             return \"profile\"\n+        } else if ((buildType is ApplicationBuildType && buildType.isDebuggable) || buildType.name == \"debug\") {\n-        } else if (buildType.isDebuggable) {\n             return \"debug\"\n         }\n         return \"release\"\n@@ -498,48 +499,23 @@\n         return project.property(PROP_LOCAL_ENGINE_BUILD_MODE) == flutterBuildMode\n     }\n \n+    // AGP9公共DSL统一入口；没有Android扩展必须立即报错。\n+    internal fun getAndroidExtension(project: Project): CommonExtension =\n+        project.extensions.getByType(CommonExtension::class.java)\n-    /**\n-     * Returns BaseExtension for the project. Used for compatibility.\n-     *\n-     * From BaseExtension docs:\n-     * \"Don't use this extension directly Instead, use one of the following:\n-     *  ApplicationExtension, LibraryExtension, TestExtension, DynamicFeatureExtension\"\n-     *\n-     *  For ApplicationExtension use `getAndroidApplicationExtension`.\n-     *  For LibraryExtension use `getAndroidLibraryExtension`.\n-     */\n-    internal fun getLegacyAndroidExtension(project: Project): BaseExtension {\n-        // Common supertype of the android extension types.\n-        // But maybe this should be https://developer.android.com/reference/tools/gradle-api/8.7/com/android/build/api/dsl/TestedExtension.\n-        return project.extensions.findByType(BaseExtension::class.java)!!\n-    }\n \n-    internal fun getAndroidExtension(project: Project): AgpCommonExtensionWrapper {\n-        // Look up by name to completely avoid importing or resolving CommonExtension\n-        val androidExtension =\n-            project.extensions.findByName(\"android\")\n-                ?: throw IllegalStateException(\"The Android plugin must be applied before accessing the Android extension.\")\n-\n-        return AgpCommonExtensionWrapper(androidExtension)\n-    }\n-\n     internal fun getAndroidLibraryExtension(project: Project): LibraryExtension = project.extensions.getByType(LibraryExtension::class.java)\n \n     internal fun getAndroidApplicationExtension(project: Project): ApplicationExtension =\n         project.extensions.getByType(ApplicationExtension::class.java)\n \n+    internal fun getConfiguredNdkVersion(project: Project): String? = getAndroidExtension(project).ndkVersion\n-    internal fun getConfiguredNdkVersion(project: Project): String? =\n-        project.extensions.findByType(ApplicationExtension::class.java)?.ndkVersion\n-            ?: getLegacyAndroidExtension(project).ndkVersion\n \n-    /**\n-     * Expected format of getAndroidExtension(project).compileSdkVersion is a string of the form\n-     * `android-` followed by either the numeric version, e.g. `android-35`, or a preview version,\n-     * e.g. `android-UpsideDownCake`.\n-     */\n     @JvmStatic\n     @JvmName(\"getCompileSdkFromProject\")\n+    internal fun getCompileSdkFromProject(project: Project): String {\n+        val android = getAndroidExtension(project)\n+        return android.compileSdkPreview ?: requireNotNull(android.compileSdk).toString()\n+    }\n-    internal fun getCompileSdkFromProject(project: Project): String = getLegacyAndroidExtension(project).compileSdkVersion!!.substring(8)\n \n     /**\n      * Returns:\n@@ -794,7 +770,7 @@\n         }\n \n         // If the project is already configuring a native build, we don't need to do anything.\n+        val gradleProjectAndroidExtension = getAndroidExtension(gradleProject)\n-        val gradleProjectAndroidExtension = getLegacyAndroidExtension(gradleProject)\n         val forcingNotRequired: Boolean =\n             gradleProjectAndroidExtension.externalNativeBuild.cmake.path != null\n         if (forcingNotRequired) {\n@@ -920,7 +896,7 @@\n         gradleProject: Project,\n         flutterSdkRootPath: String\n     ) {\n+        val gradleProjectAndroidExtension = getAndroidExtension(gradleProject)\n-        val gradleProjectAndroidExtension = getLegacyAndroidExtension(gradleProject)\n         gradleProjectAndroidExtension.externalNativeBuild.cmake.path(\n             \"$flutterSdkRootPath/packages/flutter_tools/gradle/src/main/scripts/CMakeLists.txt\"\n         )\ndiff --git a/packages/flutter_tools/gradle/src/main/kotlin/VersionFetcher.kt b/packages/flutter_tools/gradle/src/main/kotlin/VersionFetcher.kt\nindex 46dc5b89b2ce5a7554c0b21c52f8ef25cbe0fed25958dd84f8328998b7df75e6..4d1f77d630b102da5155c716ab0959e1e2dbdc72a02d1b59f66cbcc27bc28c5a\n--- a/packages/flutter_tools/gradle/src/main/kotlin/VersionFetcher.kt\n+++ b/packages/flutter_tools/gradle/src/main/kotlin/VersionFetcher.kt\n@@ -6,10 +6,9 @@\n \n import com.android.build.api.AndroidPluginVersion\n import com.android.build.api.variant.AndroidComponentsExtension\n-import com.android.build.gradle.internal.utils.getKotlinAndroidPluginVersion\n import org.gradle.api.JavaVersion\n import org.gradle.api.Project\n+import org.jetbrains.kotlin.gradle.plugin.getKotlinPluginVersion\n-import org.jetbrains.kotlin.gradle.plugin.KotlinAndroidPluginWrapper\n \n internal object VersionFetcher {\n     /**\n@@ -45,43 +44,8 @@\n      * Returns the version of the Kotlin Gradle plugin.\n      */\n     internal fun getKGPVersion(project: Project): Version? {\n+        // 回读实际加载的KGP资源版本，不以声明版本或Gradle内嵌编译器冒充。\n+        return Version.fromString(project.getKotlinPluginVersion())\n-        // AGP and Kgp have methods for getting kotlin version.\n-        // AGP's method is internal, we try to use it anyway.\n-        // KGP's version in org.jetbrains.kotlin.gradle.plugin.DefaultKotlinBasePlugin is not\n-        // available when this method is called.\n-        // When testing call `setAgpKotlinVersionToNull(project)`.\n-        val agpDefinedKgpVersion = getKotlinAndroidPluginVersion(project)\n-        if (agpDefinedKgpVersion != null && agpDefinedKgpVersion != \"unknown\") {\n-            return Version.fromString(agpDefinedKgpVersion)\n-        }\n-\n-        val kotlinVersionProperty = \"kotlin_version\"\n-        val firstKotlinVersionFieldName = \"pluginVersion\"\n-        val secondKotlinVersionFieldName = \"kotlinPluginVersion\"\n-        // This property corresponds to application of the Kotlin Gradle plugin in the\n-        // top-level build.gradle file.\n-        if (project.hasProperty(kotlinVersionProperty)) {\n-            return Version.fromString(project.properties[kotlinVersionProperty] as String)\n-        }\n-        val kotlinPlugin =\n-            project.plugins\n-                .findPlugin(KotlinAndroidPluginWrapper::class.java)\n-        // Partial implementation of getKotlinPluginVersion from the comment above.\n-        var versionString: String? = kotlinPlugin?.pluginVersion\n-        if (!versionString.isNullOrEmpty()) {\n-            return Version.fromString(versionString)\n-        }\n-        // Fall back to reflection.\n-        val versionField =\n-            kotlinPlugin?.javaClass?.kotlin?.members?.firstOrNull {\n-                it.name == firstKotlinVersionFieldName || it.name == secondKotlinVersionFieldName\n-            }\n-        versionString = versionField?.call(kotlinPlugin) as String?\n-        return if (versionString == null) {\n-            null\n-        } else {\n-            Version.fromString(versionString)\n-        }\n     }\n }\n \ndiff --git a/packages/flutter_tools/gradle/src/main/kotlin/plugins/PluginHandler.kt b/packages/flutter_tools/gradle/src/main/kotlin/plugins/PluginHandler.kt\nindex 2e0aabbee4b6699ded8fb75fa38347d1fe6d1c719051a2177bfc6ea7595b4817..cbebdcdb654a74d32901f0f6faee04e635c4914ef5826b43308393e547e52cf8\n--- a/packages/flutter_tools/gradle/src/main/kotlin/plugins/PluginHandler.kt\n+++ b/packages/flutter_tools/gradle/src/main/kotlin/plugins/PluginHandler.kt\n@@ -4,13 +4,14 @@\n \n package com.flutter.gradle.plugins\n \n-import com.android.builder.model.BuildType\n+import com.android.build.api.dsl.BuildType\n+import com.android.build.api.dsl.ApplicationBuildType\n import com.flutter.gradle.FlutterExtension\n import com.flutter.gradle.FlutterPluginUtils\n import com.flutter.gradle.FlutterPluginUtils.addApiDependencies\n import com.flutter.gradle.FlutterPluginUtils.buildModeFor\n import com.flutter.gradle.FlutterPluginUtils.getCompileSdkFromProject\n-import com.flutter.gradle.FlutterPluginUtils.getLegacyAndroidExtension\n+import com.flutter.gradle.FlutterPluginUtils.getAndroidExtension\n import com.flutter.gradle.FlutterPluginUtils.isBuiltAsApp\n import com.flutter.gradle.FlutterPluginUtils.supportsBuildMode\n import com.flutter.gradle.NativePluginLoaderReflectionBridge\n@@ -18,7 +19,7 @@\n import org.gradle.api.Project\n import org.jetbrains.kotlin.gradle.plugin.extraProperties\n import java.io.File\n-import com.android.build.gradle.internal.dsl.BuildType as dslBuildType\n+import java.nio.file.Files\n \n /**\n  * Handles interactions with the flutter plugins (not Gradle plugins) used by the Flutter project,\n@@ -87,6 +88,30 @@\n          */\n         private const val WEBSITE_DEPLOYMENT_ANDROID_BUILD_CONFIG = \"https://flutter.dev/to/review-gradle-config\"\n \n+        private fun prepareBuiltInKotlinPluginScript(pluginProject: Project) {\n+            val pubCache = System.getenv(\"PUB_CACHE\") ?: return\n+            val buildFile = pluginProject.buildFile\n+            if (buildFile.extension !in setOf(\"kts\", \"gradle\") || !buildFile.isFile || Files.isSymbolicLink(buildFile.toPath())) return\n+            val hostedRoot = File(pubCache, \"hosted\").canonicalFile.toPath()\n+            val buildPath = buildFile.canonicalFile.toPath()\n+            if (!buildPath.startsWith(hostedRoot)) return\n+            val input = buildFile.readText()\n+            val kotlinPlugin =\n+                Regex(\"\"\"(?m)^\\s*(?:id\\(\\s*[\"'](?:kotlin-android|org\\.jetbrains\\.kotlin\\.android)[\"']\\s*\\)(?:\\s+version\\s+[\"'][^\"']+[\"'])?|id\\s+[\"'](?:kotlin-android|org\\.jetbrains\\.kotlin\\.android)[\"']|kotlin\\(\\s*[\"']android[\"']\\s*\\)(?:\\s+version\\s+[\"'][^\"']+[\"'])?|apply\\(\\s*plugin\\s*=\\s*[\"'](?:kotlin-android|org\\.jetbrains\\.kotlin\\.android)[\"']\\s*\\)|apply\\s+plugin:\\s*[\"'](?:kotlin-android|org\\.jetbrains\\.kotlin\\.android)[\"'])\\s*$\"\"\")\n+            val kotlinClasspath =\n+                Regex(\"\"\"(?m)^\\s*(?:classpath\\(\\s*[\"']org\\.jetbrains\\.kotlin:kotlin-gradle-plugin:[^\"']+[\"']\\s*\\)|classpath\\s+[\"']org\\.jetbrains\\.kotlin:kotlin-gradle-plugin:[^\"']+[\"'])\\s*$\"\"\")\n+            val agpClasspath =\n+                Regex(\"\"\"(?m)^(\\s*)(?:classpath\\(\\s*[\"']com\\.android\\.tools\\.build:gradle:[^\"']+[\"']\\s*\\)|classpath\\s+[\"']com\\.android\\.tools\\.build:gradle:[^\"']+[\"'])\\s*$\"\"\")\n+            if (!kotlinPlugin.containsMatchIn(input) && !kotlinClasspath.containsMatchIn(input) && !agpClasspath.containsMatchIn(input)) return\n+            // 只修改任务PUB_CACHE副本；插件模块统一使用AGP 9.0.1内置Kotlin，不再重复应用KGP。\n+            buildFile.writeText(\n+                input\n+                    .replace(kotlinPlugin, \"\")\n+                    .replace(kotlinClasspath, \"\")\n+                    .replace(agpClasspath, if (buildFile.extension == \"kts\") \"\\$1classpath(\\\"com.android.tools.build:gradle:9.0.1\\\")\" else \"\\$1classpath 'com.android.tools.build:gradle:9.0.1'\")\n+            )\n+        }\n+\n         /**\n          * Performs configuration related to the plugin's Gradle [Project], including\n          * 1. Adding the plugin itself as a dependency to the main project.\n@@ -104,16 +129,28 @@\n                 requireNotNull(pluginObject[\"name\"] as? String) { \"Plugin name must be a string for plugin object: $pluginObject\" }\n             val pluginProject: Project = project.rootProject.findProject(\":$pluginName\") ?: return\n \n+            // Kotlin DSL compiles each plugin script with that plugin's buildscript classpath.\n+            // Publish the extension type there before evaluation so generated accessors stay typed.\n+            prepareBuiltInKotlinPluginScript(pluginProject)\n+            val flutterPluginClasspath = FlutterExtension::class.java.protectionDomain.codeSource.location.toURI()\n+            pluginProject.buildscript.dependencies.add(\"classpath\", pluginProject.files(flutterPluginClasspath))\n+\n             // Apply the \"flutter\" Gradle extension to plugins so that they can use it's vended\n             // compile/target/min sdk values.\n-            pluginProject.extensions.create(\"flutter\", FlutterExtension::class.java)\n+            pluginProject.pluginManager.withPlugin(\"com.android.library\") {\n+                val pluginFlutterExtensionClass =\n+                    pluginProject.buildscript.classLoader.loadClass(FlutterExtension::class.java.name)\n+                pluginProject.extensions.create(\"flutter\", pluginFlutterExtensionClass)\n+            }\n \n             // Add plugin dependency to the app project. We only want to add dependency\n             // for dev dependencies in non-release builds.\n             project.afterEvaluate {\n-                getLegacyAndroidExtension(project).buildTypes.forEach { buildType ->\n+                getAndroidExtension(project).buildTypes.forEach { buildType ->\n                     if (!(pluginObject[\"dev_dependency\"] as Boolean) || buildType.name != \"release\") {\n-                        project.dependencies.add(\"${buildType.name}Api\", pluginProject)\n+                        // AGP 9应用模块必须进入运行时类路径；library模块保留API传递给宿主。\n+                        val dependencyScope = if (isBuiltAsApp(project)) \"Implementation\" else \"Api\"\n+                        project.dependencies.add(\"${buildType.name}$dependencyScope\", pluginProject)\n                     }\n                 }\n             }\n@@ -135,7 +172,7 @@\n                     )\n                 }\n \n-                getLegacyAndroidExtension(project).buildTypes.forEach { buildType ->\n+                getAndroidExtension(project).buildTypes.forEach { buildType ->\n                     addEmbeddingDependencyToPlugin(project, pluginProject, buildType, engineVersion)\n                 }\n             }\n@@ -164,23 +201,15 @@\n             // This allows to build apps with plugins and custom build types or flavors.\n             // However, only copy if the plugin is also an app project, since library projects\n             // cannot have applicationIdSuffix and other app-specific properties.\n-            if (isBuiltAsApp(pluginProject)) {\n-                (getLegacyAndroidExtension(pluginProject).buildTypes as NamedDomainObjectContainer<dslBuildType>)\n-                    .addAll(getLegacyAndroidExtension(project).buildTypes as NamedDomainObjectContainer<dslBuildType>)\n-            } else {\n-                // For library projects, create compatible build types without app-specific properties\n-                getLegacyAndroidExtension(project).buildTypes.forEach { appBuildType ->\n-                    if (getLegacyAndroidExtension(pluginProject).buildTypes.findByName(appBuildType.name) == null) {\n-                        getLegacyAndroidExtension(pluginProject).buildTypes.create(appBuildType.name) {\n-                            // Copy library-compatible properties only\n-                            isDebuggable = appBuildType.isDebuggable\n-                            isMinifyEnabled = appBuildType.isMinifyEnabled\n-                            // Note: applicationIdSuffix and other app-specific properties are intentionally not copied\n-                        }\n-                    }\n-                }\n-            }\n-\n+            // 库模块只复制公开的共同属性，不把应用专属属性写入库扩展。\n+            getAndroidExtension(project).buildTypes.forEach { appBuildType ->\n+                val target = getAndroidExtension(pluginProject).buildTypes.maybeCreate(appBuildType.name)\n+                if (target is ApplicationBuildType && appBuildType is ApplicationBuildType) {\n+                    target.isDebuggable = appBuildType.isDebuggable\n+                }\n+                // Library插件不能先被R8裁空；仅应用插件继承宿主的压缩设置。\n+                target.isMinifyEnabled = isBuiltAsApp(pluginProject) && appBuildType.isMinifyEnabled\n+            }\n             // The embedding is API dependency of the plugin, so the AGP is able to desugar\n             // default method implementations when the interface is implemented by a plugin.\n             //\n@@ -215,7 +244,7 @@\n                 }\n             val pluginProject: Project = project.rootProject.findProject(\":$pluginName\") ?: return\n \n-            getLegacyAndroidExtension(project).buildTypes.forEach { buildType ->\n+            getAndroidExtension(project).buildTypes.forEach { buildType ->\n                 val flutterBuildMode: String = buildModeFor(buildType)\n                 if (flutterBuildMode == \"release\" && (pluginObject[\"dev_dependency\"] as? Boolean == true)) {\n                     // This plugin is a dev dependency will not be included in the\ndiff --git a/packages/flutter_tools/lib/src/android/gradle.dart b/packages/flutter_tools/lib/src/android/gradle.dart\nindex 84ea6ed0fc6f6b86128a220ba9a8830ad2bcd562f8791b9a9c237c29ffa0694e..b0707a83e5359f37073536654f78b8a5d08b94faf18ff40df4a0f52c550e0d74\n--- a/packages/flutter_tools/lib/src/android/gradle.dart\n+++ b/packages/flutter_tools/lib/src/android/gradle.dart\n@@ -41,8 +41,6 @@\n import 'java.dart';\n import 'migrations/android_studio_java_gradle_conflict_migration.dart';\n import 'migrations/cmake_android_16k_pages_migration.dart';\n-import 'migrations/disable_built_in_kotlin_migration.dart';\n-import 'migrations/disable_new_dsl_migration.dart';\n import 'migrations/min_sdk_version_migration.dart';\n import 'migrations/multidex_removal_migration.dart';\n import 'migrations/top_level_gradle_build_file_migration.dart';\n@@ -517,8 +515,6 @@\n       MinSdkVersionMigration(project.android, _logger),\n       MultidexRemovalMigration(project.android, _logger),\n       CmakeAndroid16kPagesMigration(project.android, _logger),\n-      DisableBuiltInKotlinMigration(project.android, _logger),\n-      DisableNewDslMigration(project.android, _logger),\n     ];\n \n     final migration = ProjectMigration(migrators);\ndiff --git a/packages/flutter_tools/lib/src/android/gradle_errors.dart b/packages/flutter_tools/lib/src/android/gradle_errors.dart\nindex 7a3ba07b414a806e949dcde01beeaa8128c68d3d7d090bc1b26b5245b074cc8b..d79d05bbbf71f3c85e6bb2e044cbcf1755ba83e2aeb91cf5b729795cae8bcb15\n--- a/packages/flutter_tools/lib/src/android/gradle_errors.dart\n+++ b/packages/flutter_tools/lib/src/android/gradle_errors.dart\n@@ -689,10 +689,6 @@\n const String kMigrateToBuiltInKotlinDocsUrl =\n     'https://docs.flutter.dev/release/breaking-changes/migrate-to-built-in-kotlin';\n \n-/// The URL for documentation on opting out of the new AGP DSL.\n-const String kOptOutOfNewDslDocsUrl =\n-    'https://developer.android.com/build/releases/agp-9-0-0-release-notes';\n-\n /// Handler when applying the kotlin-android plugin results in a build failure. This failure occurs when\n /// using AGP 9+ because built-in Kotlin has become the default behavior.\n @visibleForTesting\n@@ -715,9 +711,7 @@\n   eventLabel: 'applying-kotlin-android-plugin-error',\n );\n \n+/// 插件应用失败时保留真实报错；不得建议关闭新DSL来绕过修订验收。\n-/// Handler when using the new AGP DSL interfaces. Starting AGP 9+, only the new\n-/// DSL interfaces are used. This results in a failure because we still depend\n-/// on old DSL types.\n @visibleForTesting\n final useNewAgpDslErrorHandler = GradleHandledError(\n   test: _lineMatcher(const <String>[\n@@ -731,8 +725,7 @@\n           '''\n ${globals.logger.terminal.warningMark} Starting AGP 9+, only the new DSL interface will be read.\n This results in a build failure when applying the Flutter Gradle plugin at ${appGradleFile.path}.\n+\\nVerify the registered Flutter tool revision and inspect the original plugin error.\n-\\nTo resolve this update flutter or opt out of `android.newDsl`.\n-For instructions on how to opt out, see: $kOptOutOfNewDslDocsUrl\n \\nIf you are not upgrading to AGP 9+, run `flutter analyze --suggestions` to check for incompatible dependencies.''',\n           title: _boxTitle,\n         );\ndiff --git a/packages/flutter_tools/templates/app/android.tmpl/gradle.properties.tmpl b/packages/flutter_tools/templates/app/android.tmpl/gradle.properties.tmpl\nindex 0f82b18017fba6bb5ce3aa4b2d1a00c9382fc8aae7b1d9326e44b18abd66d80b..ce93cd30017008fa20352b9b8debd2554ee946d0ba993329dd251be0207f8dd8\n--- a/packages/flutter_tools/templates/app/android.tmpl/gradle.properties.tmpl\n+++ b/packages/flutter_tools/templates/app/android.tmpl/gradle.properties.tmpl\n@@ -1,6 +1,5 @@\n org.gradle.jvmargs=-Xmx8G -XX:MaxMetaspaceSize=4G -XX:ReservedCodeCacheSize=512m -XX:+HeapDumpOnOutOfMemoryError\n android.useAndroidX=true\n+# 受控工具仅使用新DSL和内置Kotlin。\n+android.newDsl=true\n+android.builtInKotlin=true\n-# This newDsl flag was added by the Flutter template\n-android.newDsl=false\n-# This builtInKotlin flag was added by the Flutter template\n-android.builtInKotlin=false\ndiff --git a/packages/flutter_tools/templates/module/android/gradle/gradle.properties.tmpl b/packages/flutter_tools/templates/module/android/gradle/gradle.properties.tmpl\nindex 0f82b18017fba6bb5ce3aa4b2d1a00c9382fc8aae7b1d9326e44b18abd66d80b..ce93cd30017008fa20352b9b8debd2554ee946d0ba993329dd251be0207f8dd8\n--- a/packages/flutter_tools/templates/module/android/gradle/gradle.properties.tmpl\n+++ b/packages/flutter_tools/templates/module/android/gradle/gradle.properties.tmpl\n@@ -1,6 +1,5 @@\n org.gradle.jvmargs=-Xmx8G -XX:MaxMetaspaceSize=4G -XX:ReservedCodeCacheSize=512m -XX:+HeapDumpOnOutOfMemoryError\n android.useAndroidX=true\n+# 受控工具仅使用新DSL和内置Kotlin。\n+android.newDsl=true\n+android.builtInKotlin=true\n-# This newDsl flag was added by the Flutter template\n-android.newDsl=false\n-# This builtInKotlin flag was added by the Flutter template\n-android.builtInKotlin=false\ndiff --git a/packages/flutter_tools/gradle/src/test/kotlin/FlutterPluginTest.kt b/packages/flutter_tools/gradle/src/test/kotlin/FlutterPluginTest.kt\nindex d275246cdbb7f3ddd6dba8fbbd355067ffa167c7de9ded33707c2f30f877f5a5..ae08e2e418eed63882e86852059a8cc25d7d831454cb912b2ddc33071c13ce1b\n--- a/packages/flutter_tools/gradle/src/test/kotlin/FlutterPluginTest.kt\n+++ b/packages/flutter_tools/gradle/src/test/kotlin/FlutterPluginTest.kt\n@@ -1,342 +1,63 @@\n+// Copyright 2014 The Flutter Authors. All rights reserved.\n+// Use of this source code is governed by a BSD-style license that can be\n+// found in the LICENSE file.\n+\n package com.flutter.gradle\n \n+import com.android.build.api.variant.BuiltArtifactsLoader\n+import com.android.build.api.variant.BuiltArtifacts\n+import com.android.build.api.variant.BuiltArtifact\n-import com.android.build.api.dsl.ApplicationBuildType\n-import com.android.build.api.dsl.ApplicationDefaultConfig\n-import com.android.build.api.dsl.ApplicationExtension\n-import com.android.build.api.dsl.CommonExtension\n-import com.android.build.api.dsl.LibraryExtension\n-import com.android.build.api.variant.AndroidComponentsExtension\n-import com.android.build.gradle.AbstractAppExtension\n-import com.android.build.gradle.BaseExtension\n-import com.android.build.gradle.api.AndroidSourceDirectorySet\n-import com.android.build.gradle.internal.core.InternalBaseVariant\n-import com.android.build.gradle.tasks.MergeSourceSetFolders\n-import com.android.build.gradle.tasks.ProcessAndroidResources\n-import com.flutter.gradle.tasks.FlutterTask\n-import com.flutter.gradle.tasks.PrintTask\n import io.mockk.every\n import io.mockk.mockk\n-import io.mockk.mockkObject\n-import io.mockk.slot\n-import io.mockk.verify\n-import org.gradle.api.Action\n-import org.gradle.api.Project\n-import org.gradle.api.Task\n import org.gradle.api.file.Directory\n+import org.gradle.testfixtures.ProjectBuilder\n-import org.gradle.api.tasks.Copy\n-import org.gradle.api.tasks.TaskContainer\n-import org.gradle.api.tasks.TaskProvider\n-import org.jetbrains.kotlin.gradle.plugin.extraProperties\n-import org.junit.jupiter.api.Assertions.fail\n import org.junit.jupiter.api.io.TempDir\n import java.nio.file.Path\n-import kotlin.io.path.writeText\n import kotlin.test.Test\n+import kotlin.test.assertEquals\n+import kotlin.test.assertFailsWith\n+import kotlin.test.assertTrue\n-import kotlin.test.assertContains\n \n class FlutterPluginTest {\n     @Test\n+    fun `APK任务从公开输出清单读取且缺失清单时失败`(@TempDir root: Path) {\n+        val project = ProjectBuilder.builder().withProjectDir(root.toFile()).build()\n+        val input = root.resolve(\"apk\").toFile().apply { mkdirs() }\n+        val apk = input.resolve(\"upstream-name.apk\").apply { writeText(\"verified fixture\") }\n+        val task = project.tasks.register(\"copyFlutterApkRelease\", FlutterApkTask::class.java).get()\n+        task.inputDirectory.set(input)\n+        task.destinationDirectory.set(root.resolve(\"output\").toFile())\n+        task.buildMode.set(\"release\")\n+        task.flavor.set(\"Shop\")\n+        val metadata = mockk<BuiltArtifacts>()\n+        val artifact = mockk<BuiltArtifact>()\n+        every { artifact.outputFile } returns apk.absolutePath\n+        every { artifact.filters } returns emptyList()\n+        every { metadata.elements } returns listOf(artifact)\n+        val loader = mockk<BuiltArtifactsLoader>()\n+        every { loader.load(any<Directory>()) } returns metadata\n+        task.loader.set(loader)\n+        task.copyApks()\n+        val result = root.resolve(\"output/app-shop-release.apk\").toFile()\n+        assertEquals(\"verified fixture\", result.readText())\n+        every { loader.load(any<Directory>()) } returns null\n+        assertFailsWith<IllegalArgumentException> { task.copyApks() }\n+        assertEquals(\"verified fixture\", result.readText())\n-    fun `FlutterPlugin apply() adds expected tasks`(\n-        @TempDir tempDir: Path\n-    ) {\n-        val projectDir = tempDir.resolve(\"project-dir\").resolve(\"android\").resolve(\"app\")\n-        projectDir.toFile().mkdirs()\n-        val settingsFile = projectDir.parent.resolve(\"settings.gradle\")\n-        settingsFile.writeText(\"empty for now\")\n-        val fakeFlutterSdkDir = tempDir.resolve(\"fake-flutter-sdk\")\n-        fakeFlutterSdkDir.toFile().mkdirs()\n-        val fakeCacheDir = fakeFlutterSdkDir.resolve(\"bin\").resolve(\"cache\")\n-        fakeCacheDir.toFile().mkdirs()\n-        val fakeEngineStampFile = fakeCacheDir.resolve(\"engine.stamp\")\n-        fakeEngineStampFile.writeText(FAKE_ENGINE_STAMP)\n-        val fakeEngineRealmFile = fakeCacheDir.resolve(\"engine.realm\")\n-        fakeEngineRealmFile.writeText(FAKE_ENGINE_REALM)\n-        val project = mockk<Project>(relaxed = true)\n-        val mockAbstractAppExtension =\n-            mockk<AbstractAppExtension>(\n-                moreInterfaces = arrayOf(ApplicationExtension::class),\n-                relaxed = true\n-            )\n-        val mockLibraryExtension = mockk<LibraryExtension>(relaxed = true)\n-        every { project.extensions.findByType(AbstractAppExtension::class.java) } returns mockAbstractAppExtension\n-        val mockAndroidComponentsExtension = mockk<AndroidComponentsExtension<*, *, *>>(relaxed = true)\n-        every { project.extensions.getByType(AndroidComponentsExtension::class.java) } returns mockAndroidComponentsExtension\n-        every { project.extensions.findByType(AndroidComponentsExtension::class.java) } returns mockAndroidComponentsExtension\n-        val mockSelector = mockk<com.android.build.api.variant.VariantSelector>(relaxed = true)\n-        every { mockAndroidComponentsExtension.selector() } returns mockSelector\n-        every { mockSelector.all() } returns mockSelector\n-        every { mockSelector.withName(any<String>()) } returns mockSelector\n-        every { project.extensions.getByType(AbstractAppExtension::class.java) } returns mockAbstractAppExtension\n-        every { project.extensions.getByType(LibraryExtension::class.java) } returns mockLibraryExtension\n-        every { project.extensions.findByName(\"android\") } returns mockAbstractAppExtension\n-        every { project.projectDir } returns projectDir.toFile()\n-        every { project.findProperty(\"flutter.sdk\") } returns fakeFlutterSdkDir.toString()\n-        every { project.file(fakeFlutterSdkDir.toString()) } returns fakeFlutterSdkDir.toFile()\n-        val flutterExtension = FlutterExtension()\n-        every { project.extensions.create(\"flutter\", any<Class<*>>()) } returns flutterExtension\n-        every { project.extensions.findByType(FlutterExtension::class.java) } returns flutterExtension\n-        val mockBaseExtension = mockk<BaseExtension>(relaxed = true)\n-        val mockCommonExtension = mockk<CommonExtension<*, *, *, *, *, *>>(relaxed = true)\n-        val mockDebugBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>(relaxed = true)\n-        val mockReleaseBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>(relaxed = true)\n-\n-        // Cast our multi-interface mock instead of creating a brand new one\n-        val mockApplicationExtension = mockAbstractAppExtension as ApplicationExtension\n-\n-        // Mock buildTypes on our new dual-purpose mock so AgpCommonExtensionWrapper can read them\n-        every { mockApplicationExtension.buildTypes.getByName(\"debug\") } returns mockDebugBuildType\n-        every { mockApplicationExtension.buildTypes.getByName(\"release\") } returns mockReleaseBuildType\n-\n-        // Keep the CommonExtension mocks just in case other parts of the plugin look for it\n-        every { mockCommonExtension.buildTypes.getByName(\"debug\") } returns mockDebugBuildType\n-        every { mockCommonExtension.buildTypes.getByName(\"release\") } returns mockReleaseBuildType\n-\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { project.extensions.findByType(CommonExtension::class.java) } returns mockCommonExtension\n-\n-        // Pass the dual-purpose mock for any ApplicationExtension lookups\n-        every { project.extensions.findByType(ApplicationExtension::class.java) } returns mockApplicationExtension\n-        every { project.extensions.getByType(ApplicationExtension::class.java) } returns mockApplicationExtension\n-\n-        val mockApplicationDefaultConfig =\n-            mockk<com.android.build.gradle.internal.dsl.DefaultConfig>(\n-                moreInterfaces = arrayOf(ApplicationDefaultConfig::class),\n-                relaxed = true\n-            )\n-        every { mockApplicationExtension.defaultConfig } returns mockApplicationDefaultConfig\n-        every { project.rootProject } returns project\n-        every { project.state.failure as Throwable? } returns null\n-        val mockDirectory = mockk<Directory>(relaxed = true)\n-        every { project.layout.buildDirectory.get() } returns mockDirectory\n-        val mockAndroidSourceSet = mockk<com.android.build.gradle.api.AndroidSourceSet>(relaxed = true)\n-        val mockAndroidSourceDirectorySet = mockk<AndroidSourceDirectorySet>(relaxed = true)\n-        every { mockAndroidSourceSet.jniLibs.srcDir(any()) } returns mockAndroidSourceDirectorySet\n-        every { mockAbstractAppExtension.sourceSets.getByName(\"main\") } returns mockAndroidSourceSet\n-        // mock return of NativePluginLoaderReflectionBridge.getPlugins\n-        mockkObject(NativePluginLoaderReflectionBridge)\n-        every { NativePluginLoaderReflectionBridge.getPlugins(any(), any()) } returns\n-            listOf()\n-        // mock method calls that are invoked by the args to NativePluginLoaderReflectionBridge\n-        every { project.extraProperties } returns mockk()\n-        every { project.file(flutterExtension.source!!) } returns mockk()\n-        val flutterPlugin = FlutterPlugin()\n-        flutterPlugin.apply(project)\n-\n-        verify { project.tasks.register(\"generateLockfiles\", any()) }\n-        val registeredPrintTasks = mutableListOf<String>()\n-        verify {\n-            project.tasks.register(capture(registeredPrintTasks), PrintTask::class.java, any())\n-        }\n-\n-        assertContains(registeredPrintTasks, \"javaVersion\")\n-        assertContains(registeredPrintTasks, \"kgpVersion\")\n-        assertContains(registeredPrintTasks, \"printBuildVariants\")\n-        assertContains(registeredPrintTasks, \"printNdkVersion\")\n     }\n \n     @Test\n+    fun `资源任务只写自己的生成目录并保存Flutter目录层级`(@TempDir root: Path) {\n+        val project = ProjectBuilder.builder().withProjectDir(root.toFile()).build()\n+        val input = root.resolve(\"input\").toFile().apply { mkdirs() }\n+        input.resolve(\"AssetManifest.bin\").writeText(\"asset fixture\")\n+        val other = root.resolve(\"other\").toFile().apply { mkdirs() }\n+        other.resolve(\"keep\").writeText(\"other task\")\n+        val task = project.tasks.register(\"copyFlutterAssetsRelease\", FlutterAssetsTask::class.java).get()\n+        task.destinationDirectory.set(root.resolve(\"output\").toFile())\n+        task.from(input) { into(\"flutter_assets\") }\n+        task.into(task.destinationDirectory)\n+        task.actions.forEach { it.execute(task) }\n+        assertTrue(root.resolve(\"output/flutter_assets/AssetManifest.bin\").toFile().isFile)\n+        assertEquals(\"other task\", other.resolve(\"keep\").readText())\n-    fun `copyFlutterAssets task sets filePermissions correctly`(\n-        @TempDir tempDir: Path\n-    ) {\n-        val projectDir = tempDir.resolve(\"project-dir\").resolve(\"android\").resolve(\"app\")\n-        projectDir.toFile().mkdirs()\n-        val settingsFile = projectDir.parent.resolve(\"settings.gradle\")\n-        settingsFile.writeText(\"empty for now\")\n-        val fakeFlutterSdkDir = tempDir.resolve(\"fake-flutter-sdk\")\n-        fakeFlutterSdkDir.toFile().mkdirs()\n-        val fakeCacheDir = fakeFlutterSdkDir.resolve(\"bin\").resolve(\"cache\")\n-        fakeCacheDir.toFile().mkdirs()\n-        val fakeEngineStampFile = fakeCacheDir.resolve(\"engine.stamp\")\n-        fakeEngineStampFile.writeText(FAKE_ENGINE_STAMP)\n-        val fakeEngineRealmFile = fakeCacheDir.resolve(\"engine.realm\")\n-        fakeEngineRealmFile.writeText(FAKE_ENGINE_REALM)\n-        val project = mockk<Project>(relaxed = true)\n-        val mockAbstractAppExtension =\n-            mockk<AbstractAppExtension>(\n-                moreInterfaces = arrayOf(ApplicationExtension::class),\n-                relaxed = true\n-            )\n-        every { project.extensions.findByType(AbstractAppExtension::class.java) } returns mockAbstractAppExtension\n-        every { project.extensions.getByType(AbstractAppExtension::class.java) } returns mockAbstractAppExtension\n-        every { project.extensions.findByName(\"android\") } returns mockAbstractAppExtension\n-        val mockAndroidComponentsExtension = mockk<AndroidComponentsExtension<*, *, *>>(relaxed = true)\n-        every { project.extensions.getByType(AndroidComponentsExtension::class.java) } returns mockAndroidComponentsExtension\n-        every { project.extensions.findByType(AndroidComponentsExtension::class.java) } returns mockAndroidComponentsExtension\n-        val mockSelector = mockk<com.android.build.api.variant.VariantSelector>(relaxed = true)\n-        every { mockAndroidComponentsExtension.selector() } returns mockSelector\n-        every { mockSelector.all() } returns mockSelector\n-        every { mockSelector.withName(any<String>()) } returns mockSelector\n-        every { project.projectDir } returns projectDir.toFile()\n-        every { project.findProperty(\"flutter.sdk\") } returns fakeFlutterSdkDir.toString()\n-        every { project.file(fakeFlutterSdkDir.toString()) } returns fakeFlutterSdkDir.toFile()\n-        val flutterExtension = FlutterExtension()\n-        every { project.extensions.create(\"flutter\", any<Class<*>>()) } returns flutterExtension\n-        every { project.extensions.findByType(FlutterExtension::class.java) } returns flutterExtension\n-        val mockBaseExtension = mockk<BaseExtension>(relaxed = true)\n-        val mockCommonExtension = mockk<CommonExtension<*, *, *, *, *, *>>(relaxed = true)\n-        val mockDebugBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>(relaxed = true)\n-        val mockReleaseBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>(relaxed = true)\n-\n-        // Cast our multi-interface mock instead of creating a brand new one\n-        val mockApplicationExtension = mockAbstractAppExtension as ApplicationExtension\n-\n-        // Mock buildTypes on our new dual-purpose mock so AgpCommonExtensionWrapper can read them\n-        every { mockApplicationExtension.buildTypes.getByName(\"debug\") } returns mockDebugBuildType\n-        every { mockApplicationExtension.buildTypes.getByName(\"release\") } returns mockReleaseBuildType\n-\n-        // Keep the CommonExtension mocks just in case other parts of the plugin look for it\n-        every { mockCommonExtension.buildTypes.getByName(\"debug\") } returns mockDebugBuildType\n-        every { mockCommonExtension.buildTypes.getByName(\"release\") } returns mockReleaseBuildType\n-\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { project.extensions.findByType(CommonExtension::class.java) } returns mockCommonExtension\n-\n-        // Pass the dual-purpose mock for any ApplicationExtension lookups\n-        every { project.extensions.findByType(ApplicationExtension::class.java) } returns mockApplicationExtension\n-        every { project.extensions.getByType(ApplicationExtension::class.java) } returns mockApplicationExtension\n-\n-        val mockApplicationDefaultConfig =\n-            mockk<com.android.build.gradle.internal.dsl.DefaultConfig>(\n-                moreInterfaces = arrayOf(ApplicationDefaultConfig::class),\n-                relaxed = true\n-            )\n-        every { mockApplicationExtension.defaultConfig } returns mockApplicationDefaultConfig\n-        every { project.rootProject } returns project\n-        every { project.state.failure as Throwable? } returns null\n-        val mockDirectory = mockk<Directory>(relaxed = true)\n-        every { project.layout.buildDirectory.get() } returns mockDirectory\n-        val mockAndroidSourceSet = mockk<com.android.build.gradle.api.AndroidSourceSet>(relaxed = true)\n-        val mockAndroidSourceDirectorySet = mockk<AndroidSourceDirectorySet>(relaxed = true)\n-        every { mockAndroidSourceSet.jniLibs.srcDir(any()) } returns mockAndroidSourceDirectorySet\n-        every { mockAbstractAppExtension.sourceSets.getByName(\"main\") } returns mockAndroidSourceSet\n-        // mock return of NativePluginLoaderReflectionBridge.getPlugins\n-        mockkObject(NativePluginLoaderReflectionBridge)\n-        every { NativePluginLoaderReflectionBridge.getPlugins(any(), any()) } returns\n-            listOf()\n-        // mock method calls that are invoked by the args to NativePluginLoaderReflectionBridge\n-        every { project.extraProperties } returns mockk()\n-        every { project.file(flutterExtension.source!!) } returns mockk()\n-        // Set up the task container and our task capture\n-        val taskContainer = mockk<TaskContainer>(relaxed = true)\n-        every { project.tasks } returns taskContainer\n-        val copyTaskActionCaptor = slot<Action<Copy>>()\n-        val copyTask = mockk<Copy>(relaxed = true)\n-        val mockVariant = mockk<com.android.build.gradle.api.ApplicationVariant>(relaxed = true)\n-        every { mockVariant.name } returns \"debug\"\n-        every { mockVariant.buildType.name } returns \"debug\"\n-        every { mockVariant.flavorName } returns \"\"\n-        val mergedFlavor = mockk<InternalBaseVariant.MergedFlavor>(relaxed = true)\n-        every { mockVariant.mergedFlavor } returns mergedFlavor\n-        val apiLevel = mockk<com.android.builder.model.ApiVersion>(relaxed = true)\n-        every { apiLevel.apiLevel } returns 21\n-        every { mergedFlavor.minSdkVersion } returns apiLevel\n-        val variantOutput = mockk<com.android.build.gradle.api.BaseVariantOutput>(relaxed = true)\n-        val outputsIterator = mockk<MutableIterator<com.android.build.gradle.api.BaseVariantOutput>>()\n-        every { outputsIterator.hasNext() } returns true andThen false\n-        every { outputsIterator.next() } returns variantOutput\n-        val variantOutputCollection = mockk<org.gradle.api.DomainObjectCollection<com.android.build.gradle.api.BaseVariantOutput>>()\n-        every { variantOutputCollection.iterator() } returns outputsIterator\n-        every { mockVariant.outputs } returns variantOutputCollection\n-        val processResourcesProvider = mockk<TaskProvider<ProcessAndroidResources>>(relaxed = true)\n-        every { processResourcesProvider.hint(ProcessAndroidResources::class).get() } returns mockk<ProcessAndroidResources>(relaxed = true)\n-        every { variantOutput.processResourcesProvider } returns processResourcesProvider\n-        val assembleTask = mockk<Task>(relaxed = true)\n-        val assembleTaskProvider = mockk<TaskProvider<Task>>(relaxed = true)\n-        every { assembleTaskProvider.get() } returns assembleTask\n-        every { mockVariant.assembleProvider } returns assembleTaskProvider\n-        val variants = listOf(mockVariant)\n-        val variantsIterator = mockk<MutableIterator<com.android.build.gradle.api.ApplicationVariant>>()\n-        every { variantsIterator.hasNext() } returns true andThen false\n-        every { variantsIterator.next() } returns mockVariant\n-        val variantCollection = mockk<org.gradle.api.DomainObjectSet<com.android.build.gradle.api.ApplicationVariant>>()\n-        every { mockAbstractAppExtension.applicationVariants } returns variantCollection\n-        every { variantCollection.iterator() } returns variantsIterator\n-        every {\n-            variantCollection.configureEach(any<Action<com.android.build.gradle.api.ApplicationVariant>>())\n-        } answers {\n-            variants.forEach { firstArg<Action<com.android.build.gradle.api.ApplicationVariant>>().execute(it) }\n-        }\n-        every { mockVariant.mergeAssetsProvider.hint(MergeSourceSetFolders::class).get() } returns\n-            mockk<MergeSourceSetFolders>(relaxed = true)\n-        val flutterTask = mockk<FlutterTask>(relaxed = true)\n-        val copySpec = mockk<org.gradle.api.file.CopySpec>(relaxed = true)\n-        every {\n-            (flutterTask).assets\n-        } returns copySpec\n-        val flutterTaskProvider = mockk<TaskProvider<FlutterTask>>(relaxed = true)\n-        every {\n-            flutterTaskProvider.hint(FlutterTask::class).get()\n-        } returns flutterTask\n-        every {\n-            taskContainer.register(\n-                match { it.contains(\"compileFlutterBuild\") },\n-                any<Class<FlutterTask>>(),\n-                any()\n-            )\n-        } answers {\n-            flutterTaskProvider\n-        }\n-        // Actual task that should be captured to test if permissions have been set\n-        val mockCopyTaskProvider = mockk<TaskProvider<Copy>>(relaxed = true)\n-        every { mockCopyTaskProvider.hint(Copy::class).get() } returns copyTask\n-        every {\n-            taskContainer.register(\n-                match { it.startsWith(\"copyFlutterAssets\") },\n-                eq(Copy::class.java),\n-                capture(copyTaskActionCaptor)\n-            )\n-        } answers {\n-            mockCopyTaskProvider\n-        }\n-        val mockJarTaskProvider = mockk<TaskProvider<org.gradle.api.tasks.bundling.Jar>>(relaxed = true)\n-        every { mockJarTaskProvider.hint(org.gradle.api.tasks.bundling.Jar::class).get() } returns\n-            mockk<org.gradle.api.tasks.bundling.Jar>(relaxed = true)\n-        every {\n-            taskContainer.register(\n-                match { it.contains(\"packJniLibs\") },\n-                eq(org.gradle.api.tasks.bundling.Jar::class.java),\n-                any()\n-            )\n-        } answers {\n-            mockJarTaskProvider\n-        }\n-        val mockTaskProvider = mockk<TaskProvider<Task>>(relaxed = true)\n-        every { mockTaskProvider.hint(Task::class).get() } returns mockk<Task>(relaxed = true)\n-        every {\n-            taskContainer.named(any<String>())\n-        } returns mockTaskProvider\n-        val flutterPlugin = FlutterPlugin()\n-        flutterPlugin.apply(project)\n-\n-        copyTaskActionCaptor.captured.execute(copyTask)\n-        val filePermissionsActionCaptor = slot<Action<org.gradle.api.file.ConfigurableFilePermissions>>()\n-        verify {\n-            copyTask.filePermissions(capture(filePermissionsActionCaptor))\n-        }\n-        if (filePermissionsActionCaptor.isCaptured) {\n-            val mockFilePermissionSet = mockk<org.gradle.api.file.ConfigurableFilePermissions>(relaxed = true)\n-            filePermissionsActionCaptor.captured.execute(mockFilePermissionSet)\n-            val userPermissionsActionCaptor = slot<Action<org.gradle.api.file.ConfigurableUserClassFilePermissions>>()\n-            verify {\n-                mockFilePermissionSet.user(capture(userPermissionsActionCaptor))\n-            }\n-            if (userPermissionsActionCaptor.isCaptured) {\n-                val mockUserPermission = mockk<org.gradle.api.file.ConfigurableUserClassFilePermissions>(relaxed = true)\n-                userPermissionsActionCaptor.captured.execute(mockUserPermission)\n-                verify {\n-                    mockUserPermission.read = true\n-                    mockUserPermission.write = true\n-                }\n-            } else {\n-                fail(\"User permissions configuration action was not captured\")\n-            }\n-        } else {\n-            fail(\"FilePermissions configuration action was not captured\")\n-        }\n     }\n-\n-    companion object {\n-        const val FAKE_ENGINE_STAMP = \"901b0f1afe77c3555abee7b86a26aaa37f131379\"\n-        const val FAKE_ENGINE_REALM = \"made_up_realm\"\n-    }\n }\ndiff --git a/packages/flutter_tools/gradle/src/test/kotlin/VersionFetcherTest.kt b/packages/flutter_tools/gradle/src/test/kotlin/VersionFetcherTest.kt\nindex 47acb2223475b9b6aa230f524982c49b457cfa9d05aa74d57f597db9357adf60..6c80f5e445f94f211d5d86be4ac534c3d9d85bd2b2a71ed71d111dd3a80bc301\n--- a/packages/flutter_tools/gradle/src/test/kotlin/VersionFetcherTest.kt\n+++ b/packages/flutter_tools/gradle/src/test/kotlin/VersionFetcherTest.kt\n@@ -6,65 +6,42 @@\n \n import com.android.build.api.AndroidPluginVersion\n import com.android.build.api.variant.AndroidComponentsExtension\n-import com.flutter.gradle.testing.setAgpKotlinVersionToNull\n import io.mockk.every\n import io.mockk.mockk\n+import io.mockk.mockkStatic\n+import io.mockk.unmockkStatic\n import org.gradle.api.Project\n+import org.jetbrains.kotlin.gradle.plugin.getKotlinPluginVersion\n-import org.jetbrains.kotlin.gradle.plugin.KotlinAndroidPluginWrapper\n import kotlin.test.Test\n import kotlin.test.assertEquals\n+import kotlin.test.assertFailsWith\n \n class VersionFetcherTest {\n-    // getGradleVersion\n     @Test\n+    fun `Gradle版本从实际运行对象读取`() {\n-    fun `getGradleVersion returns version when gradleVersion is set`() {\n-        val gradleVersion = Version(1, 9, 20)\n         val project = mockk<Project>()\n+        every { project.gradle.gradleVersion } returns \"9.1.0\"\n+        assertEquals(Version(9, 1, 0), VersionFetcher.getGradleVersion(project))\n-        every { project.gradle.gradleVersion } returns gradleVersion.toString()\n-        assertEquals(VersionFetcher.getGradleVersion(project), gradleVersion)\n     }\n \n     @Test\n+    fun `AGP版本从公开组件扩展读取`() {\n-    fun `getGradleVersion returns version when gradleVersion has hyphen`() {\n         val project = mockk<Project>()\n+        val extension = mockk<AndroidComponentsExtension<*, *, *>>()\n+        every { project.extensions.findByType(AndroidComponentsExtension::class.java) } returns extension\n+        every { extension.pluginVersion } returns AndroidPluginVersion(9, 0, 1)\n+        assertEquals(AndroidPluginVersion(9, 0, 1), VersionFetcher.getAGPVersion(project))\n-        every { project.gradle.gradleVersion } returns \"2.1.20-2\"\n-        assertEquals(VersionFetcher.getGradleVersion(project), Version(2, 1, 20))\n     }\n \n-    // getAGPVersion\n     @Test\n+    fun `Kotlin版本仅从已加载插件的公开接口读取`() {\n-    fun `getAGPVersion returns version when agpVersion is set`() {\n-        val agpVersion = AndroidPluginVersion(8, 3, 0)\n         val project = mockk<Project>()\n+        mockkStatic(\"org.jetbrains.kotlin.gradle.plugin.KotlinPluginWrapperKt\")\n+        try {\n+            every { project.getKotlinPluginVersion() } returns \"2.2.20\"\n+            assertEquals(Version(2, 4, 10), VersionFetcher.getKGPVersion(project))\n+            every { project.getKotlinPluginVersion() } throws IllegalStateException(\"invalid plugin\")\n+            assertFailsWith<IllegalStateException> { VersionFetcher.getKGPVersion(project) }\n+        } finally { unmockkStatic(\"org.jetbrains.kotlin.gradle.plugin.KotlinPluginWrapperKt\") }\n-        val mockAndroidComponentsExtension = mockk<AndroidComponentsExtension<*, *, *>>()\n-        every { project.extensions.findByType(AndroidComponentsExtension::class.java) } returns mockAndroidComponentsExtension\n-        every { mockAndroidComponentsExtension.pluginVersion } returns agpVersion\n-        assertEquals(VersionFetcher.getAGPVersion(project).toString(), agpVersion.toString())\n     }\n-\n-    // getKGPVersion\n-    @Test\n-    fun `getKGPVersion returns version when kotlin_version is set`() {\n-        val kgpVersion = Version(1, 9, 20)\n-        val project = mockk<Project>()\n-        setAgpKotlinVersionToNull(project)\n-        every { project.hasProperty(eq(\"kotlin_version\")) } returns true\n-        every { project.properties[\"kotlin_version\"] } returns kgpVersion.toString()\n-        val result = VersionFetcher.getKGPVersion(project)\n-        assertEquals(kgpVersion, result!!)\n-    }\n-\n-    @Test\n-    fun `getKGPVersion returns version from KotlinAndroidPluginWrapper`() {\n-        val kgpVersion = Version(1, 9, 20)\n-        val project = mockk<Project>()\n-        setAgpKotlinVersionToNull(project)\n-        every { project.hasProperty(eq(\"kotlin_version\")) } returns false\n-        every { project.plugins.findPlugin(KotlinAndroidPluginWrapper::class.java) } returns\n-            mockk<KotlinAndroidPluginWrapper> {\n-                every { pluginVersion } returns kgpVersion.toString()\n-            }\n-        val result = VersionFetcher.getKGPVersion(project)\n-        assertEquals(kgpVersion, result!!)\n-    }\n }\ndiff --git a/packages/flutter_tools/gradle/src/test/kotlin/FlutterPluginUtilsTest.kt b/packages/flutter_tools/gradle/src/test/kotlin/FlutterPluginUtilsTest.kt\nindex d595101c31d071fd2f4cca3ddae33d59d7e13f4b3bf2c4c897d88a7db72cbbda..52d0d9d2eb6ca5de164b69a2916bd293d5bb16a2abc706ee5a9cb37884997021\n--- a/packages/flutter_tools/gradle/src/test/kotlin/FlutterPluginUtilsTest.kt\n+++ b/packages/flutter_tools/gradle/src/test/kotlin/FlutterPluginUtilsTest.kt\n@@ -9,10 +9,10 @@\n import com.android.build.api.variant.AndroidComponentsExtension\n import com.android.build.api.variant.Variant\n import com.android.build.api.variant.VariantBuilder\n+import com.android.build.api.dsl.CommonExtension\n+import com.android.build.api.dsl.Cmake\n+import com.android.build.api.dsl.DefaultConfig\n+import com.android.build.api.dsl.ApplicationBuildType\n-import com.android.build.gradle.BaseExtension\n-import com.android.build.gradle.internal.dsl.CmakeOptions\n-import com.android.build.gradle.internal.dsl.DefaultConfig\n-import com.android.builder.model.BuildType\n import com.flutter.gradle.FlutterPluginUtils.BUILT_IN_KOTLIN_DOCS\n import com.flutter.gradle.FlutterPluginUtils.BUILT_IN_KOTLIN_DOCS_FOR_APPS\n import com.flutter.gradle.FlutterPluginUtils.BUILT_IN_KOTLIN_DOCS_FOR_PLUGINS\n@@ -500,8 +500,8 @@\n \n     // buildModeFor\n     @Test\n+    fun `buildModeFor returns profile if the ApplicationBuildType has name profile`() {\n+        val buildType = mockk<ApplicationBuildType>()\n-    fun `buildModeFor returns profile if the BuildType has name profile`() {\n-        val buildType = mockk<BuildType>()\n         every { buildType.name } returns \"profile\"\n \n         val result = FlutterPluginUtils.buildModeFor(buildType)\n@@ -509,8 +509,8 @@\n     }\n \n     @Test\n+    fun `buildModeFor returns debug if the ApplicationBuildType is debuggable`() {\n+        val buildType = mockk<ApplicationBuildType>()\n-    fun `buildModeFor returns debug if the BuildType is debuggable`() {\n-        val buildType = mockk<BuildType>()\n         every { buildType.name } returns \"something random\"\n         every { buildType.isDebuggable } returns true\n \n@@ -519,8 +519,8 @@\n     }\n \n     @Test\n+    fun `buildModeFor returns release if the ApplicationBuildType is not debuggable and not named profile`() {\n+        val buildType = mockk<ApplicationBuildType>()\n-    fun `buildModeFor returns release if the BuildType is not debuggable and not named profile`() {\n-        val buildType = mockk<BuildType>()\n         every { buildType.isDebuggable } returns false\n         every { buildType.name } returns \"something random\"\n \n@@ -616,7 +616,8 @@\n     @Test\n     fun `getCompileSdkFromProject returns the compileSdk from the project`() {\n         val project = mockk<Project>()\n+        every { project.extensions.getByType(CommonExtension::class.java).compileSdk } returns 35\n+        every { project.extensions.getByType(CommonExtension::class.java).compileSdkPreview } returns null\n-        every { project.extensions.findByType(BaseExtension::class.java)!!.compileSdkVersion } returns \"android-35\"\n         val result = FlutterPluginUtils.getCompileSdkFromProject(project)\n         assertEquals(\"35\", result)\n     }\n@@ -1874,24 +1875,24 @@\n         val fakeCmakeFile = tempDir.resolve(\"CMakeLists.txt\").toFile()\n         fakeCmakeFile.createNewFile()\n         val project = mockk<Project>()\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n         every { project.extensions.findByType(ApplicationExtension::class.java) } returns null\n         every {\n             project.extensions\n+                .getByType(CommonExtension::class.java)\n-                .findByType(BaseExtension::class.java)!!\n                 .externalNativeBuild.cmake\n+        } returns mockCmake\n+        every { project.extensions.getByType(CommonExtension::class.java).defaultConfig } returns mockDefaultConfig\n-        } returns mockCmakeOptions\n-        every { project.extensions.findByType(BaseExtension::class.java)!!.defaultConfig } returns mockDefaultConfig\n \n+        every { mockCmake.path } returns fakeCmakeFile\n-        every { mockCmakeOptions.path } returns fakeCmakeFile\n \n         FlutterPluginUtils.forceNdkDownload(project, \"ignored\")\n \n         verify(exactly = 1) {\n+            mockCmake.path\n-            mockCmakeOptions.path\n         }\n+        verify(exactly = 0) { mockCmake.path(any()) }\n-        verify(exactly = 0) { mockCmakeOptions.setPath(any()) }\n         verify { mockDefaultConfig wasNot called }\n     }\n \n@@ -1905,14 +1906,14 @@\n         val mockExecSpec = mockk<ExecSpec>()\n         val mockExecResult = mockk<ExecResult>()\n         val mockExecOperations = mockk<ExecOperations>()\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCommonExtension.ndkVersion } returns \"29.0.13846066\"\n+        every { mockCmake.path } returns null\n-        val mockBaseExtension = mockk<BaseExtension>()\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockBaseExtension.ndkVersion } returns \"29.0.13846066\"\n-        every { mockCmakeOptions.path } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns \"/sdkmanager\"\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns tempDir.toString()\n         every { project.findProperty(FlutterPluginUtils.PROP_INSTALLED_NDK_VERSIONS) } returns \"\"\n@@ -1945,7 +1946,7 @@\n                 )\n             )\n         }\n+        verify(exactly = 0) { mockCmake.path(any()) }\n-        verify(exactly = 0) { mockCmakeOptions.path(any()) }\n         verify { mockDefaultConfig wasNot called }\n     }\n \n@@ -1953,14 +1954,14 @@\n     fun `forceNdkDownload skips sdkmanager install when the requested ndk is already installed`() {\n         val project = mockk<Project>()\n         val finalizeDslSlot = captureFinalizeDslAction(project)\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCommonExtension.ndkVersion } returns \"29.0.13846066\"\n+        every { mockCmake.path } returns null\n-        val mockBaseExtension = mockk<BaseExtension>()\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockBaseExtension.ndkVersion } returns \"29.0.13846066\"\n-        every { mockCmakeOptions.path } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns \"/sdkmanager\"\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns \"/sdk/root\"\n         every { project.findProperty(FlutterPluginUtils.PROP_INSTALLED_NDK_VERSIONS) } returns \"29.0.13846066\"\n@@ -1970,7 +1971,7 @@\n         FlutterPluginUtils.forceNdkDownload(project, \"/base/path\")\n         finalizeDslSlot.captured.invoke(Any())\n \n+        verify(exactly = 0) { mockCmake.path(any()) }\n-        verify(exactly = 0) { mockCmakeOptions.path(any()) }\n         verify { mockDefaultConfig wasNot called }\n     }\n \n@@ -1980,20 +1981,20 @@\n     ) {\n         val project = mockk<Project>()\n         val finalizeDslSlot = captureFinalizeDslAction(project)\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n         val mockDirectoryProperty = mockk<DirectoryProperty>()\n         val mockDirectory = mockk<Directory>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n-        val mockBaseExtension = mockk<BaseExtension>()\n         var cmakePath: File? = null\n         every { project.extensions.findByType(ApplicationExtension::class.java) } returns null\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCommonExtension.ndkVersion } returns \"29.0.13846066\"\n+        every { mockCmake.path } answers { cmakePath }\n+        every { mockCmake.path(any()) } returns Unit\n+        every { mockCmake.buildStagingDirectory(any()) } returns Unit\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockBaseExtension.ndkVersion } returns \"29.0.13846066\"\n-        every { mockCmakeOptions.path } answers { cmakePath }\n-        every { mockCmakeOptions.path(any()) } returns Unit\n-        every { mockCmakeOptions.buildStagingDirectory(any()) } returns Unit\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns \"/sdk/root\"\n         every { project.findProperty(FlutterPluginUtils.PROP_INSTALLED_NDK_VERSIONS) } returns \"\"\n@@ -2003,8 +2004,8 @@\n         every { mockDirectoryProperty.get() } returns mockDirectory\n         every { mockDirectory.asFile.path } returns \"/randomapp/build/app/\"\n \n+        val mockBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>()\n+        every { mockCommonExtension.buildTypes.iterator() } returns mutableListOf(mockBuildType).iterator()\n-        val mockBuildType = mockk<com.android.build.gradle.internal.dsl.BuildType>()\n-        every { mockBaseExtension.buildTypes.iterator() } returns mutableListOf(mockBuildType).iterator()\n         every { mockBuildType.name } returns \"Debug\"\n         every { mockBuildType.externalNativeBuild.cmake.arguments(any(), any(), any()) } returns Unit\n \n@@ -2013,11 +2014,11 @@\n         finalizeDslSlot.captured.invoke(Any())\n \n         verify(exactly = 0) {\n+            mockCmake.path(\n-            mockCmakeOptions.path(\n                 \"/base/path/packages/flutter_tools/gradle/src/main/scripts/CMakeLists.txt\"\n             )\n         }\n+        verify(exactly = 0) { mockCmake.buildStagingDirectory(any()) }\n-        verify(exactly = 0) { mockCmakeOptions.buildStagingDirectory(any()) }\n         verify { mockDefaultConfig wasNot called }\n     }\n \n@@ -2031,15 +2032,15 @@\n         val mockExecSpec = mockk<ExecSpec>()\n         val mockExecResult = mockk<ExecResult>()\n         val mockExecOperations = mockk<ExecOperations>()\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n-        val mockBaseExtension = mockk<BaseExtension>()\n         var configuredNdkVersion = \"26.3.11579264\"\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCommonExtension.ndkVersion } answers { configuredNdkVersion }\n+        every { mockCmake.path } returns null\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockBaseExtension.ndkVersion } answers { configuredNdkVersion }\n-        every { mockCmakeOptions.path } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns \"/sdkmanager\"\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns tempDir.toString()\n         every {\n@@ -2075,7 +2076,7 @@\n                 )\n             )\n         }\n+        verify(exactly = 0) { mockCmake.path(any()) }\n-        verify(exactly = 0) { mockCmakeOptions.path(any()) }\n         verify { mockDefaultConfig wasNot called }\n     }\n \n@@ -2089,24 +2090,20 @@\n         val mockExecSpec = mockk<ExecSpec>()\n         val mockExecResult = mockk<ExecResult>()\n         val mockExecOperations = mockk<ExecOperations>()\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n-        val mockBaseExtension = mockk<BaseExtension>()\n         val mockApplicationExtension = mockk<ApplicationExtension>()\n         var configuredNdkVersion = \"26.3.11579264\"\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n         every {\n             project.extensions.findByType(ApplicationExtension::class.java)\n         } returns mockApplicationExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCommonExtension.ndkVersion } answers { configuredNdkVersion }\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockBaseExtension.ndkVersion } answers {\n-            throw AssertionError(\n-                \"legacy ndkVersion should not be read when ApplicationExtension is available\"\n-            )\n-        }\n         every { mockApplicationExtension.ndkVersion } answers { configuredNdkVersion }\n+        every { mockCmake.path } returns null\n-        every { mockCmakeOptions.path } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns \"/sdkmanager\"\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns tempDir.toString()\n         every {\n@@ -2141,7 +2138,7 @@\n                 )\n             )\n         }\n+        verify(exactly = 0) { mockCmake.path(any()) }\n-        verify(exactly = 0) { mockCmakeOptions.path(any()) }\n         verify { mockDefaultConfig wasNot called }\n     }\n \n@@ -2149,15 +2146,15 @@\n     fun `forceNdkDownload skips fallback when sdkmanager is unavailable but the requested ndk is already installed`() {\n         val project = mockk<Project>()\n         val finalizeDslSlot = captureFinalizeDslAction(project)\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n-        val mockBaseExtension = mockk<BaseExtension>()\n         every { project.extensions.findByType(ApplicationExtension::class.java) } returns null\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCommonExtension.ndkVersion } returns \"29.0.13846066\"\n+        every { mockCmake.path } returns null\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockBaseExtension.ndkVersion } returns \"29.0.13846066\"\n-        every { mockCmakeOptions.path } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns \"/sdk/root\"\n         every { project.findProperty(FlutterPluginUtils.PROP_INSTALLED_NDK_VERSIONS) } returns \"29.0.13846066\"\n@@ -2166,27 +2163,25 @@\n         FlutterPluginUtils.forceNdkDownload(project, \"/base/path\")\n         finalizeDslSlot.captured.invoke(Any())\n \n+        verify(exactly = 0) { mockCmake.path(any()) }\n-        verify(exactly = 0) { mockCmakeOptions.path(any()) }\n         verify { mockDefaultConfig wasNot called }\n     }\n \n     @Test\n+    fun `forceNdkDownload读取公开扩展中的已安装NDK版本`() {\n-    fun `forceNdkDownload reads ndkVersion from ApplicationExtension when legacy extension does not expose it`() {\n         val project = mockk<Project>()\n         val finalizeDslSlot = captureFinalizeDslAction(project)\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n-        val mockBaseExtension = mockk<BaseExtension>()\n         val mockApplicationExtension = mockk<ApplicationExtension>()\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n         every { project.extensions.findByType(ApplicationExtension::class.java) } returns mockApplicationExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCommonExtension.ndkVersion } returns \"29.0.13846066\"\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockBaseExtension.ndkVersion } answers {\n-            throw AssertionError(\"legacy ndkVersion should not be read when ApplicationExtension is available\")\n-        }\n         every { mockApplicationExtension.ndkVersion } returns \"29.0.13846066\"\n+        every { mockCmake.path } returns null\n-        every { mockCmakeOptions.path } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns \"/sdkmanager\"\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns \"/sdk/root\"\n         every { project.findProperty(FlutterPluginUtils.PROP_INSTALLED_NDK_VERSIONS) } returns \"29.0.13846066\"\n@@ -2195,7 +2190,7 @@\n         FlutterPluginUtils.forceNdkDownload(project, \"/base/path\")\n         finalizeDslSlot.captured.invoke(Any())\n \n+        verify(exactly = 0) { mockCmake.path(any()) }\n-        verify(exactly = 0) { mockCmakeOptions.path(any()) }\n         verify { mockDefaultConfig wasNot called }\n     }\n \n@@ -2207,14 +2202,14 @@\n         val finalizeDslSlot = captureFinalizeDslAction(project)\n         val mockExecResult = mockk<ExecResult>()\n         val mockExecOperations = mockk<ExecOperations>()\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCommonExtension.ndkVersion } returns \"29.0.13846066\"\n+        every { mockCmake.path } returns null\n-        val mockBaseExtension = mockk<BaseExtension>()\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockBaseExtension.ndkVersion } returns \"29.0.13846066\"\n-        every { mockCmakeOptions.path } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns \"/sdkmanager\"\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns tempDir.toString()\n         every { project.findProperty(FlutterPluginUtils.PROP_INSTALLED_NDK_VERSIONS) } returns \"\"\n@@ -2231,7 +2226,7 @@\n             finalizeDslSlot.captured.invoke(Any())\n         }\n \n+        verify(exactly = 0) { mockCmake.path(any()) }\n-        verify(exactly = 0) { mockCmakeOptions.path(any()) }\n         verify { mockDefaultConfig wasNot called }\n     }\n \n@@ -2238,13 +2233,13 @@\n     @Test\n     fun `forceNdkDownload skips when invoking the ndk metadata task`() {\n         val project = mockk<Project>()\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCmake.path } returns null\n-        val mockBaseExtension = mockk<BaseExtension>()\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockCmakeOptions.path } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_INSTALLED_NDK_VERSIONS) } returns null\n@@ -2253,7 +2248,7 @@\n \n         FlutterPluginUtils.forceNdkDownload(project, \"/base/path\")\n \n+        verify(exactly = 0) { mockCmake.path(any()) }\n-        verify(exactly = 0) { mockCmakeOptions.path(any()) }\n         verify { mockDefaultConfig wasNot called }\n     }\n \n@@ -2261,19 +2256,19 @@\n     fun `forceNdkDownload falls back when tool properties are present but sdkmanager is unavailable`() {\n         val project = mockk<Project>()\n         val finalizeDslSlot = captureFinalizeDslAction(project)\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n         val mockDirectoryProperty = mockk<DirectoryProperty>()\n         val mockDirectory = mockk<Directory>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n-        val mockBaseExtension = mockk<BaseExtension>()\n         every { project.extensions.findByType(ApplicationExtension::class.java) } returns null\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCommonExtension.ndkVersion } returns \"29.0.13846066\"\n+        every { mockCmake.path } returns null\n+        every { mockCmake.path(any()) } returns Unit\n+        every { mockCmake.buildStagingDirectory(any()) } returns Unit\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockBaseExtension.ndkVersion } returns \"29.0.13846066\"\n-        every { mockCmakeOptions.path } returns null\n-        every { mockCmakeOptions.path(any()) } returns Unit\n-        every { mockCmakeOptions.buildStagingDirectory(any()) } returns Unit\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns null\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns \"/sdk/root\"\n         every { project.findProperty(FlutterPluginUtils.PROP_INSTALLED_NDK_VERSIONS) } returns \"\"\n@@ -2284,8 +2279,8 @@\n         every { mockDirectory.asFile.path } returns \"/randomapp/build/app/\"\n         val basePath = \"/base/path\"\n \n+        val mockBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>()\n+        every { mockCommonExtension.buildTypes.iterator() } returns mutableListOf(mockBuildType).iterator()\n-        val mockBuildType = mockk<com.android.build.gradle.internal.dsl.BuildType>()\n-        every { mockBaseExtension.buildTypes.iterator() } returns mutableListOf(mockBuildType).iterator()\n         every { mockBuildType.name } returns \"Debug\"\n         every { mockBuildType.externalNativeBuild.cmake.arguments(any(), any(), any()) } returns Unit\n \n@@ -2293,9 +2288,9 @@\n         finalizeDslSlot.captured.invoke(Any())\n \n         verify(exactly = 1) {\n+            mockCmake.path(\"$basePath/packages/flutter_tools/gradle/src/main/scripts/CMakeLists.txt\")\n-            mockCmakeOptions.path(\"$basePath/packages/flutter_tools/gradle/src/main/scripts/CMakeLists.txt\")\n         }\n+        verify(exactly = 1) { mockCmake.buildStagingDirectory(any()) }\n-        verify(exactly = 1) { mockCmakeOptions.buildStagingDirectory(any()) }\n         verify(exactly = 1) {\n             mockBuildType.externalNativeBuild.cmake.arguments(\n                 \"-Wno-dev\",\n@@ -2309,19 +2304,19 @@\n     fun `forceNdkDownload falls back when Gradle is offline`() {\n         val project = mockk<Project>()\n         val finalizeDslSlot = captureFinalizeDslAction(project)\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n         val mockDirectoryProperty = mockk<DirectoryProperty>()\n         val mockDirectory = mockk<Directory>()\n+        val mockCommonExtension = mockk<CommonExtension>()\n-        val mockBaseExtension = mockk<BaseExtension>()\n         every { project.extensions.findByType(ApplicationExtension::class.java) } returns null\n+        every { project.extensions.getByType(CommonExtension::class.java) } returns mockCommonExtension\n+        every { mockCommonExtension.externalNativeBuild.cmake } returns mockCmake\n+        every { mockCommonExtension.defaultConfig } returns mockDefaultConfig\n+        every { mockCommonExtension.ndkVersion } returns \"29.0.13846066\"\n+        every { mockCmake.path } returns null\n+        every { mockCmake.path(any()) } returns Unit\n+        every { mockCmake.buildStagingDirectory(any()) } returns Unit\n-        every { project.extensions.findByType(BaseExtension::class.java) } returns mockBaseExtension\n-        every { mockBaseExtension.externalNativeBuild.cmake } returns mockCmakeOptions\n-        every { mockBaseExtension.defaultConfig } returns mockDefaultConfig\n-        every { mockBaseExtension.ndkVersion } returns \"29.0.13846066\"\n-        every { mockCmakeOptions.path } returns null\n-        every { mockCmakeOptions.path(any()) } returns Unit\n-        every { mockCmakeOptions.buildStagingDirectory(any()) } returns Unit\n         every { project.findProperty(FlutterPluginUtils.PROP_SDK_MANAGER_PATH) } returns \"/sdkmanager\"\n         every { project.findProperty(FlutterPluginUtils.PROP_ANDROID_SDK_ROOT) } returns \"/sdk/root\"\n         every { project.findProperty(FlutterPluginUtils.PROP_INSTALLED_NDK_VERSIONS) } returns \"\"\n@@ -2333,8 +2328,8 @@\n         every { mockDirectory.asFile.path } returns \"/randomapp/build/app/\"\n         val basePath = \"/base/path\"\n \n+        val mockBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>()\n+        every { mockCommonExtension.buildTypes.iterator() } returns mutableListOf(mockBuildType).iterator()\n-        val mockBuildType = mockk<com.android.build.gradle.internal.dsl.BuildType>()\n-        every { mockBaseExtension.buildTypes.iterator() } returns mutableListOf(mockBuildType).iterator()\n         every { mockBuildType.name } returns \"Debug\"\n         every { mockBuildType.externalNativeBuild.cmake.arguments(any(), any(), any()) } returns Unit\n \n@@ -2342,9 +2337,9 @@\n         finalizeDslSlot.captured.invoke(Any())\n \n         verify(exactly = 1) {\n+            mockCmake.path(\"$basePath/packages/flutter_tools/gradle/src/main/scripts/CMakeLists.txt\")\n-            mockCmakeOptions.path(\"$basePath/packages/flutter_tools/gradle/src/main/scripts/CMakeLists.txt\")\n         }\n+        verify(exactly = 1) { mockCmake.buildStagingDirectory(any()) }\n-        verify(exactly = 1) { mockCmakeOptions.buildStagingDirectory(any()) }\n         verify(exactly = 1) {\n             mockBuildType.externalNativeBuild.cmake.arguments(\n                 \"-Wno-dev\",\n@@ -2357,7 +2352,7 @@\n     @Test\n     fun `forceNdkDownload sets externalNativeBuild properties`() {\n         val project = mockk<Project>()\n+        val mockCmake = mockk<Cmake>()\n-        val mockCmakeOptions = mockk<CmakeOptions>()\n         val mockDefaultConfig = mockk<DefaultConfig>()\n         val mockDirectoryProperty = mockk<DirectoryProperty>()\n         val mockDirectory = mockk<Directory>()\n@@ -2367,25 +2362,25 @@\n         every { project.findProperty(FlutterPluginUtils.PROP_INSTALLED_NDK_VERSIONS) } returns null\n         every {\n             project.extensions\n+                .getByType(CommonExtension::class.java)\n-                .findByType(BaseExtension::class.java)!!\n                 .externalNativeBuild.cmake\n+        } returns mockCmake\n+        every { project.extensions.getByType(CommonExtension::class.java).defaultConfig } returns mockDefaultConfig\n-        } returns mockCmakeOptions\n-        every { project.extensions.findByType(BaseExtension::class.java)!!.defaultConfig } returns mockDefaultConfig\n \n         val basePath = \"/base/path\"\n         val fakeBuildPath = \"/randomapp/build/app/\"\n+        every { mockCmake.path } returns null\n+        every { mockCmake.path(any()) } returns Unit\n+        every { mockCmake.buildStagingDirectory(any()) } returns Unit\n-        every { mockCmakeOptions.path } returns null\n-        every { mockCmakeOptions.path(any()) } returns Unit\n-        every { mockCmakeOptions.buildStagingDirectory(any()) } returns Unit\n         every { project.layout.buildDirectory } returns mockDirectoryProperty\n         every { mockDirectoryProperty.dir(any<String>()) } returns mockDirectoryProperty\n         every { mockDirectoryProperty.get() } returns mockDirectory\n         every { mockDirectory.asFile.path } returns fakeBuildPath\n \n+        val mockBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>()\n-        val mockBuildType = mockk<com.android.build.gradle.internal.dsl.BuildType>()\n         every {\n             project.extensions\n+                .getByType(CommonExtension::class.java)\n-                .findByType(BaseExtension::class.java)!!\n                 .buildTypes\n                 .iterator()\n         } returns mutableListOf(mockBuildType).iterator()\n@@ -2395,10 +2390,10 @@\n         FlutterPluginUtils.forceNdkDownload(project, basePath)\n \n         verify(exactly = 1) {\n+            mockCmake.path\n-            mockCmakeOptions.path\n         }\n+        verify(exactly = 1) { mockCmake.path(\"$basePath/packages/flutter_tools/gradle/src/main/scripts/CMakeLists.txt\") }\n+        verify(exactly = 1) { mockCmake.buildStagingDirectory(any()) }\n-        verify(exactly = 1) { mockCmakeOptions.path(\"$basePath/packages/flutter_tools/gradle/src/main/scripts/CMakeLists.txt\") }\n-        verify(exactly = 1) { mockCmakeOptions.buildStagingDirectory(any()) }\n         verify(exactly = 1) {\n             mockBuildType.externalNativeBuild.cmake.arguments(\n                 \"-Wno-dev\",\n@@ -2440,7 +2435,7 @@\n         val pluginHandler = PluginHandler(project)\n         mockkObject(NativePluginLoaderReflectionBridge)\n         every { NativePluginLoaderReflectionBridge.getPlugins(any(), any()) } returns pluginListWithoutDevDependency\n+        val buildType: ApplicationBuildType = mockk<ApplicationBuildType>()\n-        val buildType: BuildType = mockk<BuildType>()\n         every { buildType.name } returns \"debug\"\n         every { buildType.isDebuggable } returns true\n         every { project.hasProperty(\"local-engine-repo\") } returns true\n@@ -2472,7 +2467,7 @@\n         val pluginHandler = PluginHandler(project)\n         mockkObject(NativePluginLoaderReflectionBridge)\n         every { NativePluginLoaderReflectionBridge.getPlugins(any(), any()) } returns pluginListWithoutDevDependency\n+        val buildType: ApplicationBuildType = mockk<ApplicationBuildType>()\n-        val buildType: BuildType = mockk<BuildType>()\n         val engineVersion = EXAMPLE_ENGINE_VERSION\n         every { buildType.name } returns \"debug\"\n         every { buildType.isDebuggable } returns true\n@@ -2510,7 +2505,7 @@\n         val pluginHandler = PluginHandler(project)\n         mockkObject(NativePluginLoaderReflectionBridge)\n         every { NativePluginLoaderReflectionBridge.getPlugins(any(), any()) } returns pluginListWithSingleDevDependency\n+        val buildType: ApplicationBuildType = mockk<ApplicationBuildType>()\n-        val buildType: BuildType = mockk<BuildType>()\n         val engineVersion = EXAMPLE_ENGINE_VERSION\n         every { buildType.name } returns \"release\"\n         every { buildType.isDebuggable } returns false\n@@ -2564,7 +2559,7 @@\n         val pluginHandler = PluginHandler(project)\n         mockkObject(NativePluginLoaderReflectionBridge)\n         every { NativePluginLoaderReflectionBridge.getPlugins(any(), any()) } returns pluginListWithSingleDevDependency\n+        val buildType: ApplicationBuildType = mockk<ApplicationBuildType>()\n-        val buildType: BuildType = mockk<BuildType>()\n         val engineVersion = EXAMPLE_ENGINE_VERSION\n         every { buildType.name } returns \"debug\"\n         every { buildType.isDebuggable } returns true\ndiff --git a/packages/flutter_tools/gradle/src/test/kotlin/plugins/PluginHandlerTest.kt b/packages/flutter_tools/gradle/src/test/kotlin/plugins/PluginHandlerTest.kt\nindex 5a4b7b28f038d39e7c2322923e2abe191d5fc68822c59d73b27c86ffb708f7c5..d90e2dd7a0e21ef03c6a05722b4afa38f8c88da5b8f3a6afe0fb14f86d722311\n--- a/packages/flutter_tools/gradle/src/test/kotlin/plugins/PluginHandlerTest.kt\n+++ b/packages/flutter_tools/gradle/src/test/kotlin/plugins/PluginHandlerTest.kt\n@@ -4,7 +4,7 @@\n \n package com.flutter.gradle.plugins\n \n-import com.android.build.gradle.BaseExtension\n+import com.android.build.api.dsl.CommonExtension\n import com.flutter.gradle.FlutterExtension\n import com.flutter.gradle.FlutterPluginUtils\n import com.flutter.gradle.FlutterPluginUtilsTest.Companion.EXAMPLE_ENGINE_VERSION\n@@ -169,10 +169,13 @@\n         settingsGradle.createNewFile()\n         val mockLogger = mockk<Logger>()\n         every { project.logger } returns mockLogger\n+        val mockAppPluginContainer = mockk<org.gradle.api.plugins.PluginContainer>()\n+        every { project.plugins } returns mockAppPluginContainer\n+        every { mockAppPluginContainer.hasPlugin(\"com.android.application\") } returns true\n \n         val pluginProject = mockk<Project>()\n         val pluginDependencyProject = mockk<Project>()\n-        val mockBuildType = mockk<com.android.build.gradle.internal.dsl.BuildType>()\n+        val mockBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>()\n         every { pluginProject.hasProperty(\"local-engine-repo\") } returns false\n         every { pluginProject.hasProperty(\"android\") } returns true\n         val mockPluginContainer = mockk<org.gradle.api.plugins.PluginContainer>()\n@@ -189,18 +192,18 @@\n         every { pluginProject.afterEvaluate(any<Action<Project>>()) } returns Unit\n \n         val mockProjectBuildTypes =\n-            mockk<NamedDomainObjectContainer<com.android.build.gradle.internal.dsl.BuildType>>()\n+            mockk<NamedDomainObjectContainer<com.android.build.api.dsl.ApplicationBuildType>>()\n         val mockPluginProjectBuildTypes =\n-            mockk<NamedDomainObjectContainer<com.android.build.gradle.internal.dsl.BuildType>>()\n-        every { project.extensions.findByType(BaseExtension::class.java)!!.buildTypes } returns mockProjectBuildTypes\n-        every { pluginProject.extensions.findByType(BaseExtension::class.java)!!.buildTypes } returns mockPluginProjectBuildTypes\n+            mockk<NamedDomainObjectContainer<com.android.build.api.dsl.ApplicationBuildType>>()\n+        every { project.extensions.getByType(CommonExtension::class.java).buildTypes } returns mockProjectBuildTypes\n+        every { pluginProject.extensions.getByType(CommonExtension::class.java).buildTypes } returns mockPluginProjectBuildTypes\n         every { mockPluginProjectBuildTypes.addAll(any()) } returns true\n         every { pluginProject.configurations.named(any<String>()) } returns mockk()\n         every { pluginProject.dependencies.add(any(), any()) } returns mockk()\n \n         every {\n             project.extensions\n-                .findByType(BaseExtension::class.java)!!\n+                .getByType(CommonExtension::class.java)\n                 .buildTypes\n                 .iterator()\n         } returns\n@@ -214,8 +217,10 @@\n                 mockBuildType\n             ).iterator()\n         every { project.dependencies.add(any(), any()) } returns mockk()\n-        every { project.extensions.findByType(BaseExtension::class.java)!!.compileSdkVersion } returns \"android-35\"\n-        every { pluginProject.extensions.findByType(BaseExtension::class.java)!!.compileSdkVersion } returns \"android-35\"\n+        every { project.extensions.getByType(CommonExtension::class.java).compileSdk } returns 35\n+        every { project.extensions.getByType(CommonExtension::class.java).compileSdkPreview } returns null\n+        every { pluginProject.extensions.getByType(CommonExtension::class.java).compileSdk } returns 35\n+        every { pluginProject.extensions.getByType(CommonExtension::class.java).compileSdkPreview } returns null\n \n         val pluginHandler = PluginHandler(project)\n         mockkObject(NativePluginLoaderReflectionBridge)\n@@ -248,7 +253,7 @@\n                 \"io.flutter:flutter_embedding_debug:$EXAMPLE_ENGINE_VERSION\"\n             )\n         }\n-        verify { project.dependencies.add(\"debugApi\", pluginProject) }\n+        verify { project.dependencies.add(\"debugImplementation\", pluginProject) }\n         verify { mockLogger wasNot called }\n         // For library projects, individual build types should be created, not addAll\n         verify(exactly = 0) { mockPluginProjectBuildTypes.addAll(any()) }\n@@ -272,7 +277,7 @@\n         every { project.logger } returns mockLogger\n \n         val pluginProject = mockk<Project>()\n-        val mockBuildType = mockk<com.android.build.gradle.internal.dsl.BuildType>()\n+        val mockBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>()\n         every { pluginProject.hasProperty(\"local-engine-repo\") } returns false\n         every { pluginProject.hasProperty(\"android\") } returns true\n         every { mockBuildType.name } returns \"debug\"\n@@ -285,18 +290,18 @@\n         every { pluginProject.afterEvaluate(any<Action<Project>>()) } returns Unit\n \n         val mockProjectBuildTypes =\n-            mockk<NamedDomainObjectContainer<com.android.build.gradle.internal.dsl.BuildType>>()\n+            mockk<NamedDomainObjectContainer<com.android.build.api.dsl.ApplicationBuildType>>()\n         val mockPluginProjectBuildTypes =\n-            mockk<NamedDomainObjectContainer<com.android.build.gradle.internal.dsl.BuildType>>()\n-        every { project.extensions.findByType(BaseExtension::class.java)!!.buildTypes } returns mockProjectBuildTypes\n-        every { pluginProject.extensions.findByType(BaseExtension::class.java)!!.buildTypes } returns mockPluginProjectBuildTypes\n+            mockk<NamedDomainObjectContainer<com.android.build.api.dsl.ApplicationBuildType>>()\n+        every { project.extensions.getByType(CommonExtension::class.java).buildTypes } returns mockProjectBuildTypes\n+        every { pluginProject.extensions.getByType(CommonExtension::class.java).buildTypes } returns mockPluginProjectBuildTypes\n         every { mockPluginProjectBuildTypes.addAll(any()) } returns true\n         every { pluginProject.configurations.named(any<String>()) } returns mockk()\n         every { pluginProject.dependencies.add(any(), any()) } returns mockk()\n \n         every {\n             project.extensions\n-                .findByType(BaseExtension::class.java)!!\n+                .getByType(CommonExtension::class.java)\n                 .buildTypes\n                 .iterator()\n         } returns\n@@ -310,8 +315,10 @@\n                 mockBuildType\n             ).iterator()\n         every { project.dependencies.add(any(), any()) } returns mockk()\n-        every { project.extensions.findByType(BaseExtension::class.java)!!.compileSdkVersion } returns \"android-35\"\n-        every { pluginProject.extensions.findByType(BaseExtension::class.java)!!.compileSdkVersion } returns \"android-35\"\n+        every { project.extensions.getByType(CommonExtension::class.java).compileSdk } returns 35\n+        every { project.extensions.getByType(CommonExtension::class.java).compileSdkPreview } returns null\n+        every { pluginProject.extensions.getByType(CommonExtension::class.java).compileSdk } returns 35\n+        every { pluginProject.extensions.getByType(CommonExtension::class.java).compileSdkPreview } returns null\n \n         val pluginHandler = PluginHandler(project)\n         mockkObject(NativePluginLoaderReflectionBridge)\n@@ -347,19 +354,19 @@\n         mockkObject(FlutterPluginUtils)\n         every { FlutterPluginUtils.isBuiltAsApp(pluginProject) } returns true\n \n-        val mockProjectBuildTypes = mockk<NamedDomainObjectContainer<com.android.build.gradle.internal.dsl.BuildType>>()\n-        val mockPluginProjectBuildTypes = mockk<NamedDomainObjectContainer<com.android.build.gradle.internal.dsl.BuildType>>()\n-\n-        every { project.extensions.findByType(BaseExtension::class.java)!!.buildTypes } returns mockProjectBuildTypes\n-        every { pluginProject.extensions.findByType(BaseExtension::class.java)!!.buildTypes } returns mockPluginProjectBuildTypes\n+        val mockProjectBuildTypes = mockk<NamedDomainObjectContainer<com.android.build.api.dsl.ApplicationBuildType>>()\n+        val mockPluginProjectBuildTypes = mockk<NamedDomainObjectContainer<com.android.build.api.dsl.ApplicationBuildType>>()\n+\n+        every { project.extensions.getByType(CommonExtension::class.java).buildTypes } returns mockProjectBuildTypes\n+        every { pluginProject.extensions.getByType(CommonExtension::class.java).buildTypes } returns mockPluginProjectBuildTypes\n         every { mockPluginProjectBuildTypes.addAll(any()) } returns true\n-        every { mockProjectBuildTypes.iterator() } returns mutableListOf<com.android.build.gradle.internal.dsl.BuildType>().iterator()\n+        every { mockProjectBuildTypes.iterator() } returns mutableListOf<com.android.build.api.dsl.ApplicationBuildType>().iterator()\n \n         // Mock FlutterPluginUtils calls that our logic depends on\n         mockkObject(FlutterPluginUtils)\n-        every { FlutterPluginUtils.getLegacyAndroidExtension(project) } returns project.extensions.findByType(BaseExtension::class.java)!!\n-        every { FlutterPluginUtils.getLegacyAndroidExtension(pluginProject) } returns\n-            pluginProject.extensions.findByType(BaseExtension::class.java)!!\n+        every { FlutterPluginUtils.getAndroidExtension(project) } returns project.extensions.getByType(CommonExtension::class.java)\n+        every { FlutterPluginUtils.getAndroidExtension(pluginProject) } returns\n+            pluginProject.extensions.getByType(CommonExtension::class.java)\n \n         // For app plugins, the old addAll behavior should be used\n         // This is tested implicitly by verifying the absence of individual create calls\n@@ -367,7 +374,7 @@\n         verify(exactly = 0) {\n             mockPluginProjectBuildTypes.create(\n                 any<String>(),\n-                any<Action<com.android.build.gradle.internal.dsl.BuildType>>()\n+                any<Action<com.android.build.api.dsl.ApplicationBuildType>>()\n             )\n         }\n     }\n@@ -387,22 +394,22 @@\n         mockkObject(FlutterPluginUtils)\n         every { FlutterPluginUtils.isBuiltAsApp(pluginProject) } returns false\n \n-        val mockProjectBuildTypes = mockk<NamedDomainObjectContainer<com.android.build.gradle.internal.dsl.BuildType>>()\n-        val mockPluginProjectBuildTypes = mockk<NamedDomainObjectContainer<com.android.build.gradle.internal.dsl.BuildType>>()\n-        val mockCreatedBuildType = mockk<com.android.build.gradle.internal.dsl.BuildType>(relaxed = true)\n-\n-        every { project.extensions.findByType(BaseExtension::class.java)!!.buildTypes } returns mockProjectBuildTypes\n-        every { pluginProject.extensions.findByType(BaseExtension::class.java)!!.buildTypes } returns mockPluginProjectBuildTypes\n+        val mockProjectBuildTypes = mockk<NamedDomainObjectContainer<com.android.build.api.dsl.ApplicationBuildType>>()\n+        val mockPluginProjectBuildTypes = mockk<NamedDomainObjectContainer<com.android.build.api.dsl.ApplicationBuildType>>()\n+        val mockCreatedBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>(relaxed = true)\n+\n+        every { project.extensions.getByType(CommonExtension::class.java).buildTypes } returns mockProjectBuildTypes\n+        every { pluginProject.extensions.getByType(CommonExtension::class.java).buildTypes } returns mockPluginProjectBuildTypes\n         every { mockPluginProjectBuildTypes.findByName(\"debug\") } returns null\n         every {\n             mockPluginProjectBuildTypes.create(\n                 \"debug\",\n-                any<Action<com.android.build.gradle.internal.dsl.BuildType>>()\n+                any<Action<com.android.build.api.dsl.ApplicationBuildType>>()\n             )\n         } returns mockCreatedBuildType\n \n         // Mock the iterator for forEach\n-        val testBuildType = mockk<com.android.build.gradle.internal.dsl.BuildType>()\n+        val testBuildType = mockk<com.android.build.api.dsl.ApplicationBuildType>()\n         every { testBuildType.name } returns \"debug\"\n         every { testBuildType.isDebuggable } returns true\n         every { testBuildType.isMinifyEnabled } returns false\n@@ -410,9 +417,9 @@\n \n         // Mock FlutterPluginUtils calls that our logic depends on\n         mockkObject(FlutterPluginUtils)\n-        every { FlutterPluginUtils.getLegacyAndroidExtension(project) } returns project.extensions.findByType(BaseExtension::class.java)!!\n-        every { FlutterPluginUtils.getLegacyAndroidExtension(pluginProject) } returns\n-            pluginProject.extensions.findByType(BaseExtension::class.java)!!\n+        every { FlutterPluginUtils.getAndroidExtension(project) } returns project.extensions.getByType(CommonExtension::class.java)\n+        every { FlutterPluginUtils.getAndroidExtension(pluginProject) } returns\n+            pluginProject.extensions.getByType(CommonExtension::class.java)\n \n         // For library plugins, individual build type creation should happen\n         // This is tested by verifying that create is called for the build type\n@@ -423,7 +430,7 @@\n     private fun setupBasicMocks(\n         project: Project,\n         pluginProject: Project,\n-        mockBuildType: com.android.build.gradle.internal.dsl.BuildType,\n+        mockBuildType: com.android.build.api.dsl.ApplicationBuildType,\n         tempDir: Path\n     ) {\n         // Configuration for project directory\n@@ -452,8 +459,10 @@\n         every { pluginProject.configurations.named(any<String>()) } returns mockk()\n         every { pluginProject.dependencies.add(any(), any()) } returns mockk()\n         every { project.dependencies.add(any(), any()) } returns mockk()\n-        every { project.extensions.findByType(BaseExtension::class.java)!!.compileSdkVersion } returns \"android-35\"\n-        every { pluginProject.extensions.findByType(BaseExtension::class.java)!!.compileSdkVersion } returns \"android-35\"\n+        every { project.extensions.getByType(CommonExtension::class.java).compileSdk } returns 35\n+        every { project.extensions.getByType(CommonExtension::class.java).compileSdkPreview } returns null\n+        every { pluginProject.extensions.getByType(CommonExtension::class.java).compileSdk } returns 35\n+        every { pluginProject.extensions.getByType(CommonExtension::class.java).compileSdkPreview } returns null\n     }\n \n     private fun setupPluginMocks(project: Project) {\ndiff --git a/packages/flutter_tools/gradle/src/test/kotlin/DeeplinkTest.kt b/packages/flutter_tools/gradle/src/test/kotlin/DeeplinkTest.kt\nindex 525fc434a271b6540e4665e6a3bb48c7250d751c4c060198ec7fdf7559abe648..ee5e509830ba5827d7db7dd7619d73abc56861c80df62d7bcf2cb827bce4e454\n--- a/packages/flutter_tools/gradle/src/test/kotlin/DeeplinkTest.kt\n+++ b/packages/flutter_tools/gradle/src/test/kotlin/DeeplinkTest.kt\n@@ -4,7 +4,7 @@\n \n package com.flutter.gradle\n \n+import kotlin.test.assertFailsWith\n-import org.gradle.internal.impldep.org.junit.Assert.assertThrows\n import kotlin.test.Test\n import kotlin.test.assertContains\n import kotlin.test.assertFalse\n@@ -41,7 +41,7 @@\n         val deeplink1 = Deeplink(\"scheme1\", \"host1\", \"path1\", IntentFilterCheck())\n         val deeplink2 = null\n \n+        assertFailsWith<NullPointerException> { deeplink1.equals(deeplink2) }\n-        assertThrows(NullPointerException::class.java) { deeplink1.equals(deeplink2) }\n     }\n \n     @Test\ndiff --git a/packages/flutter_tools/gradle/src/test/kotlin/DependencyVersionCheckerTest.kt b/packages/flutter_tools/gradle/src/test/kotlin/DependencyVersionCheckerTest.kt\nindex 66ec59b37378f70f347075b2c05393d4ce09c8f577e252200590db8bfe3fd933..8085404b25222899179e52fa5f59ff66ed97175ac7f534e5c0d0cc00b2deac63\n--- a/packages/flutter_tools/gradle/src/test/kotlin/DependencyVersionCheckerTest.kt\n+++ b/packages/flutter_tools/gradle/src/test/kotlin/DependencyVersionCheckerTest.kt\n@@ -30,7 +30,7 @@\n import com.flutter.gradle.DependencyVersionChecker.warnGradleVersion\n import com.flutter.gradle.DependencyVersionChecker.warnKGPVersion\n import com.flutter.gradle.DependencyVersionChecker.warnMinSdkVersion\n+import com.flutter.gradle.testing.setKotlinVersion\n-import com.flutter.gradle.testing.setAgpKotlinVersionToNull\n import io.mockk.every\n import io.mockk.mockk\n import io.mockk.mockkStatic\n@@ -55,7 +55,7 @@\n private const val SUPPORTED_GRADLE_VERSION: String = \"9.1.0\"\n private val SUPPORTED_JAVA_VERSION: JavaVersion = JavaVersion.VERSION_17\n private val SUPPORTED_AGP_VERSION: AndroidPluginVersion = AndroidPluginVersion(9, 0, 1)\n+private const val SUPPORTED_KGP_VERSION: String = \"2.2.20\"\n-private const val SUPPORTED_KGP_VERSION: String = \"2.3.20\"\n private val SUPPORTED_SDK_VERSION: MinSdkVersion = MinSdkVersion(\"release\", 30)\n \n class DependencyVersionCheckerTest {\n@@ -439,8 +439,7 @@\n         every { mockAndroidComponentsExtension.pluginVersion } returns agpVersion\n \n         // KGP\n+        setKotlinVersion(mockProject, kgpVersion)\n-        every { mockProject.hasProperty(eq(\"kotlin_version\")) } returns true\n-        every { mockProject.properties[\"kotlin_version\"] } returns kgpVersion\n \n         // Logger\n         val mockLogger = mockk<Logger>()\n@@ -499,7 +498,6 @@\n             }\n             return@answers Unit\n         }\n-        setAgpKotlinVersionToNull(mockProject)\n \n         return mockProject\n     }\ndiff --git a/packages/flutter_tools/gradle/src/test/kotlin/testing/VersionFetcherTestHelper.kt b/packages/flutter_tools/gradle/src/test/kotlin/testing/VersionFetcherTestHelper.kt\nindex 44682af9e0455c4060855f502f4b35247b5adb29465669486cbf688daf519fc7..17ee0eb03af0751f7b4a02af0fca0b7fcd82b432a964502f169e7fed4b55f129\n--- a/packages/flutter_tools/gradle/src/test/kotlin/testing/VersionFetcherTestHelper.kt\n+++ b/packages/flutter_tools/gradle/src/test/kotlin/testing/VersionFetcherTestHelper.kt\n@@ -1,22 +1,12 @@\n package com.flutter.gradle.testing\n \n import io.mockk.every\n+import io.mockk.mockkStatic\n-import io.mockk.mockk\n import org.gradle.api.Project\n+import org.jetbrains.kotlin.gradle.plugin.getKotlinPluginVersion\n-import org.jetbrains.kotlin.gradle.plugin.KotlinBaseApiPlugin\n \n+/** 测试通过KGP公开接口注入版本，不复刻AGP内部实现。 */\n+internal fun setKotlinVersion(mockProject: Project, version: String) {\n+    mockkStatic(\"org.jetbrains.kotlin.gradle.plugin.KotlinPluginWrapperKt\")\n+    every { mockProject.getKotlinPluginVersion() } returns version\n-/**\n- * Prevent AGP's kotlin version checker from throwing `no answer found`\n- *\n- * Intended to be called by tests that call `VersionFetcher.getKGPVersion(project)`\n- * and who do not care about the internal implementation of\n- * `com.android.build.gradle.internal.utils.getKotlinAndroidPluginVersion`\n- */\n-internal fun setAgpKotlinVersionToNull(mockProject: Project) {\n-    // The internals of `getKotlinAndroidPluginVersion` depend on `getKotlinPluginVersionFromPlugin`\n-    // which relies on reflection to get the value. Instead make sure fetching the plugin has valid\n-    // response then rely on the default behavior in `getKotlinPluginVersionFromPlugin` to\n-    // return null.\n-    every { mockProject.plugins.findPlugin(any<Class<KotlinBaseApiPlugin>>()) } returns mockk()\n-    every { mockProject.plugins.findPlugin(\"kotlin-android\") } returns mockk()\n }\ndiff --git a/bin/internal/shared.sh b/bin/internal/shared.sh\nindex 7029bb28e9f60927807f2119d2afe388742db41d34c26f5e263bf15568911fa2..5c6e3bfa4647025cba26e3a6f6cc9fa0d2dcd670062870d6fda85f6764a27fe4\n--- a/bin/internal/shared.sh\n+++ b/bin/internal/shared.sh\n@@ -1,283 +1,35 @@\n-#!/usr/bin/env bash\n-# Copyright 2014 The Flutter Authors. All rights reserved.\n-# Use of this source code is governed by a BSD-style license that can be\n-# found in the LICENSE file.\n-\n-# ---------------------------------- NOTE ---------------------------------- #\n-#\n-# Please keep the logic in this file consistent with the logic in the\n-# `shared.bat` script in the same directory to ensure that Flutter & Dart continue\n-# to work across all platforms!\n-#\n-# -------------------------------------------------------------------------- #\n-\n-set -e\n-\n-# Needed because if it is set, cd may print the path it changed to.\n-unset CDPATH\n-\n-function pub_upgrade_with_retry {\n-  local total_tries=\"10\"\n-  local remaining_tries=$((total_tries - 1))\n-  while [[ \"$remaining_tries\" -gt 0 ]]; do\n-    (cd \"$FLUTTER_TOOLS_DIR\" && \"$DART\" pub upgrade --suppress-analytics >&2) && break\n-    >&2 echo \"Error: Unable to 'pub upgrade' flutter tool. Retrying in five seconds... ($remaining_tries tries left)\"\n-    remaining_tries=$((remaining_tries - 1))\n-    sleep 5\n-  done\n-\n-  if [[ \"$remaining_tries\" == 0 ]]; then\n-    >&2 echo \"Command 'pub upgrade' still failed after $total_tries tries, giving up.\"\n-    return 1\n-  fi\n-\n-  # Touch the pubspec.lock to ensure, even if this was a NOP, it is newer than pubspec.yaml.\n-  # See https://github.com/flutter/flutter/issues/171024.\n-  touch \"$FLUTTER_TOOLS_DIR/pubspec.lock\" >&2\n-\n-  return 0\n-}\n-\n-# Trap function for removing any remaining lock file at exit.\n-function _rmlock () {\n-  [ -n \"$FLUTTER_UPGRADE_LOCK\" ] && rm -rf -- \"$FLUTTER_UPGRADE_LOCK\"\n-}\n-\n-# Determines which lock method to use, based on what is available on the system.\n-# Returns a non-zero value if the lock was not acquired, zero if acquired.\n-function _lock () {\n-  if hash flock 2>/dev/null; then\n-    flock --nonblock --exclusive 7 2>/dev/null\n-  elif hash shlock 2>/dev/null; then\n-    shlock -f \"$1\" -p $$\n-  else\n-    mkdir \"$1\" 2>/dev/null\n-  fi\n-}\n-\n-# Waits for an update lock to be acquired.\n-#\n-# To ensure that we don't simultaneously update Dart in multiple parallel\n-# instances, we try to obtain an exclusive lock on this file descriptor (and\n-# thus this script's source file) while we are updating Dart and compiling the\n-# script. To do this, we try to use the command line program \"flock\", which is\n-# available on many Unix-like platforms, in particular on most Linux\n-# distributions. You give it a file descriptor, and it locks the corresponding\n-# file, having inherited the file descriptor from the shell.\n-#\n-# Complicating matters, there are two major scenarios where this will not\n-# work.\n-#\n-# The first is if the platform doesn't have \"flock\", for example on macOS. There\n-# is not a direct equivalent, so on platforms that don't have flock, we fall\n-# back to using trying to use the shlock command, and if that doesn't exist,\n-# then we use mkdir as an atomic operation to create a lock directory. If mkdir\n-# is able to create the directory, then the lock is acquired. To determine if we\n-# have \"flock\" or \"shlock\" available, we use the \"hash\" shell built-in.\n-#\n-# The second complication is on network file shares. On NFS, to obtain an\n-# exclusive lock you need a file descriptor that is open for writing. Thus, we\n-# ignore errors from flock by redirecting all output to /dev/null, since users\n-# will typically not care about errors from flock and are more likely to be\n-# confused by them than helped. The \"shlock\" method doesn't work for network\n-# shares, since it is PID-based. The \"mkdir\" method does work over NFS\n-# implementations that support atomic directory creation (which is most of\n-# them). The \"schlock\" and \"flock\" commands are more reliable than the mkdir\n-# method, however, or we would use mkdir in all cases.\n-#\n-# The upgrade_flutter function calling _wait_for_lock is executed in a subshell\n-# with a redirect that pipes the source of this script into file descriptor 7.\n-# A flock lock is released when this subshell exits and file descriptor 7 is\n-# closed. The mkdir lock is released via an exit trap from the subshell that\n-# deletes the lock directory.\n-function _wait_for_lock () {\n-  FLUTTER_UPGRADE_LOCK=\"$FLUTTER_ROOT/bin/cache/.upgrade_lock\"\n-  local waiting_message_displayed\n-  while ! _lock \"$FLUTTER_UPGRADE_LOCK\"; do\n-    if [[ -z $waiting_message_displayed ]]; then\n-      # Print with a return so that if the Dart code also prints this message\n-      # when it does its own lock, the message won't appear twice. Be sure that\n-      # the clearing printf below has the same number of space characters.\n-      printf \"Waiting for another flutter command to release the startup lock...\\r\" >&2;\n-      waiting_message_displayed=\"true\"\n-    fi\n-    sleep .1;\n-  done\n-  if [[ $waiting_message_displayed == \"true\" ]]; then\n-    # Clear the waiting message so it doesn't overlap any following text.\n-    printf \"                                                                  \\r\" >&2;\n-  fi\n-  unset waiting_message_displayed\n-  # If the lock file is acquired, make sure that it is removed on exit.\n-  trap _rmlock INT TERM EXIT\n-}\n-\n-# This function is always run in a subshell. Running the function in a subshell\n-# is required to make sure any lock directory is cleaned up by the exit trap in\n-# _wait_for_lock.\n-function upgrade_flutter () (\n-  mkdir -p \"$FLUTTER_ROOT/bin/cache\"\n-\n-  # Ensure the engine.version is populated\n-  \"$FLUTTER_ROOT/bin/internal/update_engine_version.sh\"\n-\n-  local revision=\"$(git -C \"$FLUTTER_ROOT\" rev-parse HEAD)\"\n-  local compilekey=\"$revision:$FLUTTER_TOOL_ARGS\"\n-\n-  # Invalidate cache if:\n-  #  * SNAPSHOT_PATH is not a file, or\n-  #  * STAMP_PATH is not a file, or\n-  #  * STAMP_PATH is an empty file, or\n-  #  * Contents of STAMP_PATH is not what we are going to compile, or\n-  #  * pubspec.yaml last modified after pubspec.lock\n-  if [[ ! -f \"$SNAPSHOT_PATH\" || \\\n-        ! -s \"$STAMP_PATH\" || \\\n-        \"$(< \"$STAMP_PATH\")\" != \"$compilekey\" || \\\n-        \"$FLUTTER_TOOLS_DIR/pubspec.yaml\" -nt \"$FLUTTER_TOOLS_DIR/pubspec.lock\" ]]; then\n-    # Waits for the update lock to be acquired. Placing this check inside the\n-    # conditional allows the majority of flutter/dart installations to bypass\n-    # the lock entirely, but as a result this required a second verification that\n-    # the SDK is up to date.\n-    _wait_for_lock\n-\n-    # A different shell process might have updated the tool/SDK.\n-    if [[ -f \"$SNAPSHOT_PATH\" && -s \"$STAMP_PATH\" && \"$(< \"$STAMP_PATH\")\" == \"$compilekey\" && \"$FLUTTER_TOOLS_DIR/pubspec.yaml\" -ot \"$FLUTTER_TOOLS_DIR/pubspec.lock\" ]]; then\n-      exit $?\n-    fi\n-\n-    # Fetch Dart...\n-    rm -f \"$FLUTTER_ROOT/version\"\n-    rm -f \"$FLUTTER_ROOT/bin/cache/flutter.version.json\"\n-    touch \"$FLUTTER_ROOT/bin/cache/.dartignore\"\n-    \"$FLUTTER_ROOT/bin/internal/update_dart_sdk.sh\"\n-\n-    if [[ \"$BIN_NAME\" == 'dart' || \"$BIN_NAME\" == 'flutter-dev' ]]; then\n-      # Don't try to build tool\n-      return\n-    fi\n-\n-    >&2 echo Building flutter tool...\n-\n-    # Prepare packages...\n-    if [[ \"$CI\" == \"true\" || \"$BOT\" == \"true\" || \"$CONTINUOUS_INTEGRATION\" == \"true\" || \"$CHROME_HEADLESS\" == \"1\" ]]; then\n-      PUB_ENVIRONMENT=\"$PUB_ENVIRONMENT:flutter_bot\"\n-    else\n-      export PUB_SUMMARY_ONLY=1\n-    fi\n-    export PUB_ENVIRONMENT=\"$PUB_ENVIRONMENT:flutter_install\"\n-    pub_upgrade_with_retry\n-\n-    # Move the old snapshot - we can't just overwrite it as the VM might currently have it\n-    # memory mapped (e.g. on flutter upgrade). For downloading a new dart sdk the folder is moved,\n-    # so we take the same approach of moving the file here.\n-    SNAPSHOT_PATH_OLD=\"$SNAPSHOT_PATH.old\"\n-    if [ -f \"$SNAPSHOT_PATH\" ]; then\n-      mv \"$SNAPSHOT_PATH\" \"$SNAPSHOT_PATH_OLD\"\n-    fi\n-\n-    # Compile...\n-    \"$DART\" --verbosity=error $FLUTTER_TOOL_ARGS --snapshot=\"$SNAPSHOT_PATH\" --snapshot-kind=\"app-jit\" --packages=\"$FLUTTER_TOOLS_DIR/.dart_tool/package_config.json\" --no-enable-mirrors \"$SCRIPT_PATH\" > /dev/null\n-    echo \"$compilekey\" > \"$STAMP_PATH\"\n-\n-    # Delete any temporary snapshot path.\n-    if [ -f \"$SNAPSHOT_PATH_OLD\" ]; then\n-      rm -f \"$SNAPSHOT_PATH_OLD\"\n-    fi\n-  fi\n-  # The exit here is extraneous since the function is run in a subshell, but\n-  # this serves as documentation that running the function in a subshell is\n-  # required to make sure any lock directory created by mkdir is cleaned up.\n-  exit $?\n-)\n-\n-# This function is intended to be executed by entrypoints (e.g. `//bin/flutter`\n-# and `//bin/dart`). PROG_NAME and BIN_DIR should already be set by those\n-# entrypoints.\n-function shared::execute() {\n-  export FLUTTER_ROOT=\"$(cd \"${BIN_DIR}/..\" ; pwd -P)\"\n-\n-  # If present, run the bootstrap script first\n-  BOOTSTRAP_PATH=\"$FLUTTER_ROOT/bin/internal/bootstrap.sh\"\n-  if [ -f \"$BOOTSTRAP_PATH\" ]; then\n-    source \"$BOOTSTRAP_PATH\"\n-  fi\n-\n-  FLUTTER_TOOLS_DIR=\"$FLUTTER_ROOT/packages/flutter_tools\"\n-  SNAPSHOT_PATH=\"$FLUTTER_ROOT/bin/cache/flutter_tools.snapshot\"\n-  STAMP_PATH=\"$FLUTTER_ROOT/bin/cache/flutter_tools.stamp\"\n-  SCRIPT_PATH=\"$FLUTTER_TOOLS_DIR/bin/flutter_tools.dart\"\n-  DART_SDK_PATH=\"$FLUTTER_ROOT/bin/cache/dart-sdk\"\n-\n-  DART=\"$DART_SDK_PATH/bin/dart\"\n-\n-  # If running over git-bash, overrides the default UNIX executables with win32\n-  # executables\n-  case \"$(uname -s)\" in\n-    MINGW* | MSYS* )\n-      DART=\"$DART.exe\"\n-      ;;\n-  esac\n-\n-  # Test if running as superuser – but don't warn if running within Docker or CI.\n-  if [[ \"$EUID\" == \"0\" && ! -f /.dockerenv && \"$CI\" != \"true\" && \"$BOT\" != \"true\" && \"$CONTINUOUS_INTEGRATION\" != \"true\" ]]; then\n-    >&2 echo \"   Woah! You appear to be trying to run flutter as root.\"\n-    >&2 echo \"   We strongly recommend running the flutter tool without superuser privileges.\"\n-    >&2 echo \"  /\"\n-    >&2 echo \"📎\"\n-  fi\n-\n-  # Test if Git is available on the Host\n-  if ! hash git 2>/dev/null; then\n-    >&2 echo \"Error: Unable to find git in your PATH.\"\n-    exit 1\n-  fi\n-  # Test if the flutter directory is a git clone (otherwise git rev-parse HEAD\n-  # would fail)\n-  if [[ ! -e \"$FLUTTER_ROOT/.git\" ]]; then\n-    >&2 echo \"Error: The Flutter directory is not a clone of the GitHub project.\"\n-    >&2 echo \"       The flutter tool requires Git in order to operate properly;\"\n-    >&2 echo \"       to install Flutter, see the instructions at:\"\n-    >&2 echo \"       https://docs.flutter.dev/get-started\"\n-    exit 1\n-  fi\n-\n-  BIN_NAME=\"$(basename \"$PROG_NAME\")\"\n-\n-  # File descriptor 7 is prepared here so that we can use it with\n-  # flock(1) in _lock() (see above).\n-  #\n-  # We use number 7 because it's a luckier number than 3; luck is\n-  # important when making locks work reliably. Also because that way\n-  # if anyone is redirecting other file descriptors there's less\n-  # chance of a conflict.\n-  #\n-  # In any case, the file we redirect into this file descriptor is\n-  # this very source file you are reading right now, because that's\n-  # the only file we can truly guarantee exists, since we're running\n-  # it. We don't use PROG_NAME because otherwise if you run `dart` and\n-  # `flutter` simultaneously they'll end up using different lock files\n-  # and will corrupt each others' downloads.\n-  #\n-  # SHARED_NAME itself is prepared by the caller script.\n-  upgrade_flutter 7< \"$SHARED_NAME\"\n-\n-  case \"$BIN_NAME\" in\n-    flutter-dev)\n-      # FLUTTER_TOOL_ARGS aren't quoted below, because it is meant to be\n-      # considered as separate space-separated args.\n-      exec \"$DART\" run --resident --packages=\"$FLUTTER_TOOLS_DIR/.dart_tool/package_config.json\" $FLUTTER_TOOL_ARGS \"$SCRIPT_PATH\" \"$@\"\n-      ;;\n-    flutter*)\n-      # FLUTTER_TOOL_ARGS aren't quoted below, because it is meant to be\n-      # considered as separate space-separated args.\n-      exec \"$DART\" --packages=\"$FLUTTER_TOOLS_DIR/.dart_tool/package_config.json\" $FLUTTER_TOOL_ARGS \"$SNAPSHOT_PATH\" \"$@\"\n-      ;;\n-    dart*)\n-      exec \"$DART\" \"$@\"\n-      ;;\n-    *)\n-      >&2 echo \"Error! Executable name $BIN_NAME not recognized!\"\n-      exit 1\n-      ;;\n-  esac\n-}\n+#!/usr/bin/env bash\n+# Copyright 2014 The Flutter Authors. All rights reserved.\n+# Use of this source code is governed by a BSD-style license that can be\n+# found in the LICENSE file.\n+\n+set -e\n+unset CDPATH\n+\n+# SDK是可直接使用的工具，不要求产品必须由塔塔控制台启动。版本检查关闭只用于\n+# 避免编译命令隐式修改或更新SDK；产品自己的依赖和构建流程保持原样。\n+function shared::execute() {\n+  export FLUTTER_ROOT=\"$(cd \"${BIN_DIR}/..\" && pwd -P)\"\n+  local tools=\"$FLUTTER_ROOT/packages/flutter_tools\"\n+  local dart=\"$FLUTTER_ROOT/bin/cache/dart-sdk/bin/dart\"\n+  local snapshot=\"$FLUTTER_ROOT/bin/cache/flutter_tools.snapshot\"\n+  local config=\"$tools/.dart_tool/package_config.json\"\n+  local name=\"$(basename \"$PROG_NAME\")\"\n+  if [[ ! -x \"$dart\" || ! -s \"$snapshot\" || ! -s \"$config\" ||\n+        ! -s \"$FLUTTER_ROOT/bin/cache/flutter.version.json\" ]]; then\n+    >&2 echo \"Flutter SDK 不完整。\"\n+    return 1\n+  fi\n+  case \"$name\" in\n+    flutter)\n+      exec \"$dart\" --packages=\"$config\" \"$snapshot\" --no-version-check \"$@\"\n+      ;;\n+    dart)\n+      exec \"$dart\" \"$@\"\n+      ;;\n+    *)\n+      >&2 echo \"Flutter工具入口不支持：$name\"\n+      return 1\n+      ;;\n+  esac\n+}\ndiff --git a/packages/flutter_tools/lib/src/cache.dart b/packages/flutter_tools/lib/src/cache.dart\nindex 36c8addec9a603f8e5d89288059d7def5406b09de28ab78544e3129db76d83b8..dffe24408031cc33b047be33585dc1ec78e2f687f613d71fc42838c00585030a\n--- a/packages/flutter_tools/lib/src/cache.dart\n+++ b/packages/flutter_tools/lib/src/cache.dart\n@@ -1,1776 +1,1692 @@\n-// Copyright 2014 The Flutter Authors. All rights reserved.\n-// Use of this source code is governed by a BSD-style license that can be\n-// found in the LICENSE file.\n-\n-/// @docImport 'flutter_cache.dart';\n-/// @docImport 'runner/flutter_command.dart';\n-/// @docImport 'runner/flutter_command_runner.dart';\n-library;\n-\n-import 'dart:async';\n-import 'dart:ffi' show Abi;\n-import 'dart:math' show max;\n-\n-import 'package:crypto/crypto.dart';\n-import 'package:file/memory.dart';\n-import 'package:meta/meta.dart';\n-import 'package:process/process.dart';\n-\n-import 'artifacts.dart';\n-import 'base/common.dart';\n-import 'base/context.dart';\n-import 'base/error_handling_io.dart';\n-import 'base/file_system.dart';\n-import 'base/io.dart'\n-    show\n-        HttpClient,\n-        HttpClientRequest,\n-        HttpClientResponse,\n-        HttpHeaders,\n-        HttpStatus,\n-        SocketException,\n-        Stdio;\n-import 'base/logger.dart';\n-import 'base/net.dart';\n-import 'base/os.dart' show OperatingSystemUtils;\n-import 'base/platform.dart';\n-import 'base/terminal.dart';\n-import 'base/user_messages.dart';\n-import 'base/utils.dart' show getElapsedAsSeconds, getSizeAsPlatformMB;\n-import 'convert.dart';\n-import 'features.dart';\n-\n-const kFlutterRootEnvironmentVariableName =\n-    'FLUTTER_ROOT'; // should point to //flutter/ (root of flutter/flutter repo)\n-const kFlutterEngineEnvironmentVariableName =\n-    'FLUTTER_ENGINE'; // should point to //engine/src/ (root of flutter/engine repo)\n-const kSnapshotFileName = 'flutter_tools.snapshot'; // in //flutter/bin/cache/\n-const kFlutterToolsScriptFileName =\n-    'flutter_tools.dart'; // in //flutter/packages/flutter_tools/bin/\n-const kFlutterEnginePackageName = 'sky_engine';\n-\n-/// A tag for a set of development artifacts that need to be cached.\n-class DevelopmentArtifact {\n-  const DevelopmentArtifact._(this.name, {this.feature});\n-\n-  /// The name of the artifact.\n-  ///\n-  /// This should match the flag name in precache.dart.\n-  final String name;\n-\n-  /// A feature to control the visibility of this artifact.\n-  final Feature? feature;\n-\n-  /// Artifacts required for Android development.\n-  static const androidGenSnapshot = DevelopmentArtifact._(\n-    'android_gen_snapshot',\n-    feature: flutterAndroidFeature,\n-  );\n-  static const androidMaven = DevelopmentArtifact._(\n-    'android_maven',\n-    feature: flutterAndroidFeature,\n-  );\n-\n-  // Artifacts used for internal builds.\n-  static const androidInternalBuild = DevelopmentArtifact._(\n-    'android_internal_build',\n-    feature: flutterAndroidFeature,\n-  );\n-\n-  /// Artifacts required for iOS development.\n-  static const iOS = DevelopmentArtifact._('ios', feature: flutterIOSFeature);\n-\n-  /// Artifacts required for web development.\n-  static const web = DevelopmentArtifact._('web', feature: flutterWebFeature);\n-\n-  /// Artifacts required for desktop macOS.\n-  static const macOS = DevelopmentArtifact._('macos', feature: flutterMacOSDesktopFeature);\n-\n-  /// Artifacts required for desktop Windows.\n-  static const windows = DevelopmentArtifact._('windows', feature: flutterWindowsDesktopFeature);\n-\n-  /// Artifacts required for desktop Linux.\n-  static const linux = DevelopmentArtifact._('linux', feature: flutterLinuxDesktopFeature);\n-\n-  /// Artifacts required for Fuchsia.\n-  static const fuchsia = DevelopmentArtifact._('fuchsia', feature: flutterFuchsiaFeature);\n-\n-  /// Artifacts required for the Flutter Runner.\n-  static const flutterRunner = DevelopmentArtifact._(\n-    'flutter_runner',\n-    feature: flutterFuchsiaFeature,\n-  );\n-\n-  /// Artifacts required for any development platform.\n-  ///\n-  /// This does not need to be explicitly returned from requiredArtifacts as\n-  /// it will always be downloaded.\n-  static const universal = DevelopmentArtifact._('universal');\n-\n-  /// Artifacts which contain build information for the flutter tool.\n-  static const informative = DevelopmentArtifact._('informative');\n-\n-  /// The values of DevelopmentArtifacts.\n-  static final values = <DevelopmentArtifact>[\n-    androidGenSnapshot,\n-    androidMaven,\n-    androidInternalBuild,\n-    iOS,\n-    web,\n-    macOS,\n-    windows,\n-    linux,\n-    fuchsia,\n-    universal,\n-    flutterRunner,\n-    informative,\n-  ];\n-\n-  @override\n-  String toString() => 'Artifact($name)';\n-}\n-\n-/// A wrapper around the `bin/cache/` directory.\n-///\n-/// This does not provide any artifacts by default. See [FlutterCache] for the default\n-/// artifact set.\n-///\n-/// ## Artifact mirrors\n-///\n-/// Some environments cannot reach the Google Cloud Storage buckets and CIPD due\n-/// to regional or corporate policies.\n-///\n-/// To enable Flutter users in these environments, the Flutter tool supports\n-/// custom artifact mirrors that the administrators of such environments may\n-/// provide. To use an artifact mirror, the user defines the [kFlutterStorageBaseUrl]\n-/// (`FLUTTER_STORAGE_BASE_URL`) environment variable that points to the mirror.\n-/// Flutter tool reads this variable and uses it instead of the default URLs.\n-///\n-/// For more details on specific URLs used to download artifacts, see\n-/// [storageBaseUrl] and [cipdBaseUrl].\n-class Cache {\n-  /// [rootOverride] is configurable for testing.\n-  /// [artifacts] is configurable for testing.\n-  Cache({\n-    @protected Directory? rootOverride,\n-    @protected List<ArtifactSet>? artifacts,\n-    required Logger logger,\n-    required FileSystem fileSystem,\n-    required Platform platform,\n-    required OperatingSystemUtils osUtils,\n-    Stdio? stdio,\n-  }) : _rootOverride = rootOverride,\n-       _logger = logger,\n-       _fileSystem = fileSystem,\n-       _platform = platform,\n-       _osUtils = osUtils,\n-       _stdio = stdio,\n-       _net = Net(logger: logger, platform: platform),\n-       _fsUtils = FileSystemUtils(fileSystem: fileSystem, platform: platform),\n-       _artifacts = artifacts ?? <ArtifactSet>[];\n-\n-  /// Create a [Cache] for testing.\n-  ///\n-  /// Defaults to a memory file system, fake platform,\n-  /// buffer logger, and no accessible artifacts.\n-  /// By default, the root cache directory path is \"cache\".\n-  factory Cache.test({\n-    Directory? rootOverride,\n-    List<ArtifactSet>? artifacts,\n-    Logger? logger,\n-    FileSystem? fileSystem,\n-    Platform? platform,\n-    Stdio? stdio,\n-    required ProcessManager processManager,\n-    Abi? currentAbi,\n-  }) {\n-    if (rootOverride?.fileSystem != null &&\n-        fileSystem != null &&\n-        rootOverride!.fileSystem != fileSystem) {\n-      throw ArgumentError(\n-        'If rootOverride and fileSystem are both non-null, '\n-            'rootOverride.fileSystem must be the same as fileSystem.',\n-        'fileSystem',\n-      );\n-    }\n-    fileSystem ??= rootOverride?.fileSystem ?? MemoryFileSystem.test();\n-    platform ??= FakePlatform(environment: <String, String>{});\n-    logger ??= BufferLogger.test();\n-    return Cache(\n-      rootOverride: rootOverride ?? fileSystem.currentDirectory,\n-      artifacts: artifacts ?? <ArtifactSet>[],\n-      logger: logger,\n-      fileSystem: fileSystem,\n-      platform: platform,\n-      stdio: stdio,\n-      osUtils: OperatingSystemUtils(\n-        fileSystem: fileSystem,\n-        logger: logger,\n-        platform: platform,\n-        processManager: processManager,\n-        currentAbi: currentAbi,\n-      ),\n-    );\n-  }\n-\n-  final Logger _logger;\n-  final Platform _platform;\n-  final FileSystem _fileSystem;\n-  final OperatingSystemUtils _osUtils;\n-  final Directory? _rootOverride;\n-  final List<ArtifactSet> _artifacts;\n-  final Stdio? _stdio;\n-  final Net _net;\n-  final FileSystemUtils _fsUtils;\n-\n-  late final ArtifactUpdater _artifactUpdater = _createUpdater();\n-\n-  @visibleForTesting\n-  @protected\n-  void registerArtifact(ArtifactSet artifactSet) {\n-    _artifacts.add(artifactSet);\n-  }\n-\n-  /// This has to be lazy because it requires FLUTTER_ROOT to be initialized.\n-  ArtifactUpdater _createUpdater() {\n-    return ArtifactUpdater(\n-      operatingSystemUtils: _osUtils,\n-      logger: _logger,\n-      fileSystem: _fileSystem,\n-      tempStorage: getDownloadDir(),\n-      platform: _platform,\n-      httpClient: HttpClient(),\n-      allowedBaseUrls: <String>[storageBaseUrl, realmlessStorageBaseUrl, cipdBaseUrl],\n-      stdio: _stdio,\n-    );\n-  }\n-\n-  static const _hostsBlockedInChina = <String>[\n-    'storage.googleapis.com',\n-    'chrome-infra-packages.appspot.com',\n-  ];\n-\n-  // Initialized by FlutterCommandRunner on startup.\n-  // Explore making this field lazy to catch non-initialized access.\n-  static String? flutterRoot;\n-\n-  /// Determine the absolute and normalized path for the root of the current\n-  /// Flutter checkout.\n-  ///\n-  /// This method has a series of fallbacks for determining the repo location. The\n-  /// first success will immediately return the root without further checks.\n-  ///\n-  /// The order of these tests is:\n-  ///   1. FLUTTER_ROOT environment variable contains the path.\n-  ///   2. Platform script is a data URI scheme, returning `../..` to support\n-  ///      tests run from `packages/flutter_tools`.\n-  ///   3. Platform script is package URI scheme, returning the grandgrandparent\n-  ///      directory of the package config file location from\n-  ///      `packages/flutter_tools/.dart_tool/package_config.json`.\n-  ///   4. Platform script file path is the snapshot path generated by `bin/flutter`,\n-  ///      returning the grandparent directory from `bin/cache`.\n-  ///   5. Platform script file name is the entrypoint in `packages/flutter_tools/bin/flutter_tools.dart`,\n-  ///      returning the 4th parent directory.\n-  ///   6. The current directory\n-  ///\n-  /// If an exception is thrown during any of these checks, an error message is\n-  /// printed and `.` is returned by default (6).\n-  static String defaultFlutterRoot({\n-    required Platform platform,\n-    required FileSystem fileSystem,\n-    required UserMessages userMessages,\n-  }) {\n-    String normalize(String path) {\n-      return fileSystem.path.normalize(fileSystem.path.absolute(path));\n-    }\n-\n-    if (platform.environment.containsKey(kFlutterRootEnvironmentVariableName)) {\n-      return normalize(platform.environment[kFlutterRootEnvironmentVariableName]!);\n-    }\n-    try {\n-      if (platform.script.scheme == 'data') {\n-        return normalize('../..'); // The tool is running as a test.\n-      }\n-      final String Function(String) dirname = fileSystem.path.dirname;\n-\n-      if (platform.script.scheme == 'package') {\n-        final String packageConfigPath = Uri.parse(\n-          platform.packageConfig!,\n-        ).toFilePath(windows: platform.isWindows);\n-        return normalize(dirname(dirname(dirname(dirname(packageConfigPath)))));\n-      }\n-\n-      if (platform.script.scheme == 'file') {\n-        final String script = platform.script.toFilePath(windows: platform.isWindows);\n-        if (fileSystem.path.basename(script) == kSnapshotFileName) {\n-          return normalize(dirname(dirname(fileSystem.path.dirname(script))));\n-        }\n-        if (fileSystem.path.basename(script) == kFlutterToolsScriptFileName) {\n-          return normalize(dirname(dirname(dirname(dirname(script)))));\n-        }\n-      }\n-    } on Exception catch (error) {\n-      // There is currently no logger attached since this is computed at startup.\n-      // ignore: avoid_print\n-      print(userMessages.runnerNoRoot('$error'));\n-    }\n-    return normalize('.');\n-  }\n-\n-  // Whether to cache artifacts for all platforms. Defaults to only caching\n-  // artifacts for the current platform.\n-  bool includeAllPlatforms = false;\n-\n-  // Names of artifacts which should be cached even if they would normally\n-  // be filtered out for the current platform.\n-  Set<String>? platformOverrideArtifacts;\n-\n-  // Whether to cache the unsigned mac binaries. Defaults to caching the signed binaries.\n-  bool useUnsignedMacBinaries = false;\n-\n-  // Whether the warning printed when a custom artifact URL is used is fatal.\n-  bool fatalStorageWarning = true;\n-\n-  static RandomAccessFile? _lock;\n-  static var _lockEnabled = true;\n-\n-  /// Turn off the [lock]/[releaseLock] mechanism.\n-  ///\n-  /// This is used by the tests since they run simultaneously and all in one\n-  /// process and so it would be a mess if they had to use the lock.\n-  @visibleForTesting\n-  static void disableLocking() {\n-    _lockEnabled = false;\n-  }\n-\n-  /// Turn on the [lock]/[releaseLock] mechanism.\n-  ///\n-  /// This is used by the tests.\n-  @visibleForTesting\n-  static void enableLocking() {\n-    _lockEnabled = true;\n-  }\n-\n-  /// Check if lock acquired, skipping FLUTTER_ALREADY_LOCKED reentrant checks.\n-  ///\n-  /// This is used by the tests.\n-  @visibleForTesting\n-  static bool isLocked() {\n-    return _lock != null;\n-  }\n-\n-  /// Lock the cache directory.\n-  ///\n-  /// This happens while required artifacts are updated\n-  /// (see [FlutterCommandRunner.runCommand]).\n-  ///\n-  /// This uses normal POSIX flock semantics.\n-  Future<void> lock() async {\n-    if (!_lockEnabled) {\n-      return;\n-    }\n-    assert(_lock == null);\n-    final File lockFile = _fileSystem.file(\n-      _fileSystem.path.join(flutterRoot!, 'bin', 'cache', 'lockfile'),\n-    );\n-    try {\n-      _lock = lockFile.openSync(mode: FileMode.write);\n-    } on FileSystemException catch (e) {\n-      _logger.printError('Failed to open or create the artifact cache lockfile: \"$e\"');\n-      _logger.printError('Please ensure you have permissions to create or open ${lockFile.path}');\n-      throwToolExit('Failed to open or create the lockfile');\n-    }\n-    var locked = false;\n-    var printed = false;\n-    while (!locked) {\n-      try {\n-        _lock!.lockSync();\n-        locked = true;\n-      } on FileSystemException {\n-        if (!printed) {\n-          _logger.printTrace(\n-            'Waiting to be able to obtain lock of Flutter binary artifacts directory: ${_lock!.path}',\n-          );\n-          // This needs to go to stderr to avoid cluttering up stdout if a\n-          // parent process is collecting stdout (e.g. when calling \"flutter\n-          // version --machine\"). It's not really a \"warning\" though, so print it\n-          // in grey. Also, make sure that it isn't counted as a warning for\n-          // Logger.warningsAreFatal.\n-          _logger.printWarning(\n-            'Waiting for another flutter command to release the startup lock...',\n-            color: TerminalColor.grey,\n-            fatal: false,\n-          );\n-          printed = true;\n-        }\n-        await Future<void>.delayed(const Duration(milliseconds: 50));\n-      }\n-    }\n-  }\n-\n-  /// Releases the lock.\n-  ///\n-  /// This happens automatically on startup (see [FlutterCommand.verifyThenRunCommand])\n-  /// after the command's required artifacts are updated.\n-  void releaseLock() {\n-    if (!_lockEnabled || _lock == null) {\n-      return;\n-    }\n-    _lock!.closeSync();\n-    _lock = null;\n-  }\n-\n-  /// Checks if the current process owns the lock for the cache directory at\n-  /// this very moment; throws a [StateError] if it doesn't.\n-  void checkLockAcquired() {\n-    if (_lockEnabled &&\n-        _lock == null &&\n-        _platform.environment['FLUTTER_ALREADY_LOCKED'] != 'true') {\n-      throw StateError(\n-        'The current process does not own the lock for the cache directory. This is a bug in Flutter CLI tools.',\n-      );\n-    }\n-  }\n-\n-  String get devToolsVersion {\n-    if (_devToolsVersion == null) {\n-      const devToolsDirPath = 'dart-sdk/bin/resources/devtools';\n-      final Directory devToolsDir = getCacheDir(devToolsDirPath, shouldCreate: false);\n-      if (!devToolsDir.existsSync()) {\n-        throw Exception('Could not find directory at ${devToolsDir.path}');\n-      }\n-      final versionFilePath = '${devToolsDir.path}/version.json';\n-      final File versionFile = _fileSystem.file(versionFilePath);\n-      if (!versionFile.existsSync()) {\n-        throw Exception('Could not find file at $versionFilePath');\n-      }\n-      final dynamic data = jsonDecode(versionFile.readAsStringSync());\n-      if (data is! Map<String, Object?>) {\n-        throw Exception(\n-          \"Expected object of type 'Map<String, Object?>' but got one of type '${data.runtimeType}'\",\n-        );\n-      }\n-      final Object? version = data['version'];\n-      if (version == null) {\n-        throw Exception('Could not parse DevTools version from $version');\n-      }\n-      if (version is! String) {\n-        throw Exception(\n-          \"Could not parse DevTools version. Expected object of type 'String', but got one of type '${version.runtimeType}'\",\n-        );\n-      }\n-      return _devToolsVersion = version;\n-    }\n-    return _devToolsVersion!;\n-  }\n-\n-  String? _devToolsVersion;\n-\n-  /// The current version of Dart used to build Flutter and run the tool.\n-  String get dartSdkVersion {\n-    if (_dartSdkVersion == null) {\n-      // Make the version string more customer-friendly.\n-      // Changes '2.1.0-dev.8.0.flutter-4312ae32' to '2.1.0 (build 2.1.0-dev.8.0 4312ae32)'\n-      final String justVersion = _platform.version.split(' ')[0];\n-      _dartSdkVersion = justVersion.replaceFirstMapped(RegExp(r'(\\d+\\.\\d+\\.\\d+)(.+)'), (\n-        Match match,\n-      ) {\n-        final String noFlutter = match[2]!.replaceAll('.flutter-', ' ');\n-        return '${match[1]} (build ${match[1]}$noFlutter)';\n-      });\n-    }\n-    return _dartSdkVersion!;\n-  }\n-\n-  String? _dartSdkVersion;\n-\n-  /// The current version of Dart used to build Flutter and run the tool.\n-  String get dartSdkBuild {\n-    if (_dartSdkBuild == null) {\n-      // Make the version string more customer-friendly.\n-      // Changes '2.1.0-dev.8.0.flutter-4312ae32' to '2.1.0 (build 2.1.0-dev.8.0 4312ae32)'\n-      final String justVersion = _platform.version.split(' ')[0];\n-      _dartSdkBuild = justVersion.replaceFirstMapped(RegExp(r'(\\d+\\.\\d+\\.\\d+)(.+)'), (Match match) {\n-        final String noFlutter = match[2]!.replaceAll('.flutter-', ' ');\n-        return '${match[1]}$noFlutter';\n-      });\n-    }\n-    return _dartSdkBuild!;\n-  }\n-\n-  String? _dartSdkBuild;\n-\n-  /// The current version of the Flutter engine the flutter tool will download.\n-  String get engineRevision {\n-    _engineRevision ??= getStampFor('engine');\n-    if (_engineRevision == null) {\n-      throwToolExit('Could not determine engine revision.');\n-    }\n-    return _engineRevision!;\n-  }\n-\n-  String? _engineRevision;\n-\n-  /// The \"realm\" for the storage URL.\n-  ///\n-  /// For production artifacts from Engine post-submit and release builds,\n-  /// this string will be empty, and the `storageBaseUrl` will be unmodified.\n-  /// When non-empty, this string will be appended to the `storageBaseUrl` after\n-  /// a '/'. For artifacts generated by Engine presubmits, the realm should be\n-  /// \"flutter_archives_v2\".\n-  String get storageRealm {\n-    _storageRealm ??= getRealmFor('engine');\n-    if (_storageRealm == null) {\n-      throwToolExit('Could not determine engine realm.');\n-    }\n-    return _storageRealm!;\n-  }\n-\n-  String? _storageRealm;\n-\n-  /// The base for URLs that store Flutter engine artifacts that are fetched\n-  /// during the installation of the Flutter SDK.\n-  ///\n-  /// By default the base URL is https://storage.googleapis.com. However, if\n-  /// `FLUTTER_STORAGE_BASE_URL` environment variable ([kFlutterStorageBaseUrl])\n-  /// is provided, the environment variable value is returned instead.\n-  ///\n-  /// See also:\n-  ///\n-  ///  * [cipdBaseUrl], which determines how CIPD artifacts are fetched.\n-  ///  * [Cache] class-level dartdocs that explain how artifact mirrors work.\n-  String get storageBaseUrl {\n-    String? overrideUrl = _platform.environment[kFlutterStorageBaseUrl];\n-    if (overrideUrl == null) {\n-      return storageRealm.isEmpty\n-          ? 'https://storage.googleapis.com'\n-          : 'https://storage.googleapis.com/$storageRealm';\n-    }\n-    // verify that this is a valid URI.\n-    overrideUrl = storageRealm.isEmpty ? overrideUrl : '$overrideUrl/$storageRealm';\n-    try {\n-      Uri.parse(overrideUrl);\n-    } on FormatException catch (err) {\n-      throwToolExit('\"$kFlutterStorageBaseUrl\" contains an invalid URL:\\n$err');\n-    }\n-    _maybeWarnAboutStorageOverride(overrideUrl);\n-    return overrideUrl;\n-  }\n-\n-  String get realmlessStorageBaseUrl {\n-    return storageRealm.isEmpty ? storageBaseUrl : storageBaseUrl.replaceAll('/$storageRealm', '');\n-  }\n-\n-  /// The base for URLs that store Flutter engine artifacts in CIPD.\n-  ///\n-  /// For some platforms, such as Web and Fuchsia, CIPD artifacts are fetched\n-  /// during the installation of the Flutter SDK, in addition to those fetched\n-  /// from [storageBaseUrl].\n-  ///\n-  /// By default the base URL is https://chrome-infra-packages.appspot.com/dl.\n-  /// However, if `FLUTTER_STORAGE_BASE_URL` environment variable is provided\n-  /// ([kFlutterStorageBaseUrl]), then the following value is used:\n-  ///\n-  ///     FLUTTER_STORAGE_BASE_URL/flutter_infra_release/cipd\n-  ///\n-  /// See also:\n-  ///\n-  ///  * [storageBaseUrl], which determines how engine artifacts stored in the\n-  ///    Google Cloud Storage buckets are fetched.\n-  ///  * https://chromium.googlesource.com/infra/luci/luci-go/+/refs/heads/main/cipd,\n-  ///    which contains information about CIPD.\n-  ///  * [Cache] class-level dartdocs that explain how artifact mirrors work.\n-  String get cipdBaseUrl {\n-    final String? overrideUrl = _platform.environment[kFlutterStorageBaseUrl];\n-    if (overrideUrl == null) {\n-      return 'https://chrome-infra-packages.appspot.com/dl';\n-    }\n-\n-    final Uri original;\n-    try {\n-      original = Uri.parse(overrideUrl);\n-    } on FormatException catch (err) {\n-      throwToolExit('\"$kFlutterStorageBaseUrl\" contains an invalid URL:\\n$err');\n-    }\n-\n-    final cipdOverride = original\n-        .replace(pathSegments: <String>[...original.pathSegments, 'flutter_infra_release', 'cipd'])\n-        .toString();\n-    return cipdOverride;\n-  }\n-\n-  var _hasWarnedAboutStorageOverride = false;\n-\n-  void _maybeWarnAboutStorageOverride(String overrideUrl) {\n-    if (_hasWarnedAboutStorageOverride) {\n-      return;\n-    }\n-    _logger.printWarning(\n-      'Flutter assets will be downloaded from $overrideUrl. Make sure you trust this source!',\n-      emphasis: true,\n-      fatal: false,\n-    );\n-    _hasWarnedAboutStorageOverride = true;\n-  }\n-\n-  /// Return the top-level directory in the cache; this is `bin/cache`.\n-  Directory getRoot() {\n-    return _fileSystem.directory(\n-      _fileSystem.path.join(_rootOverride?.path ?? flutterRoot!, 'bin', 'cache'),\n-    );\n-  }\n-\n-  String getHostPlatformArchName() {\n-    return _osUtils.hostPlatform.platformName;\n-  }\n-\n-  /// Return a directory in the cache dir. For `pkg`, this will return `bin/cache/pkg`.\n-  ///\n-  /// When [shouldCreate] is true, the cache directory at [name] will be created\n-  /// if it does not already exist.\n-  Directory getCacheDir(String name, {bool shouldCreate = true}) {\n-    final Directory dir = _fileSystem.directory(_fileSystem.path.join(getRoot().path, name));\n-    if (!dir.existsSync() && shouldCreate) {\n-      dir.createSync(recursive: true);\n-      _osUtils.chmod(dir, '755');\n-    }\n-    return dir;\n-  }\n-\n-  /// Return the top-level directory for artifact downloads.\n-  Directory getDownloadDir() => getCacheDir('downloads');\n-\n-  /// Return the top-level mutable directory in the cache; this is `bin/cache/artifacts`.\n-  Directory getCacheArtifacts() => getCacheDir('artifacts');\n-\n-  /// Location of LICENSE file.\n-  File getLicenseFile() => _fileSystem.file(_fileSystem.path.join(flutterRoot!, 'LICENSE'));\n-\n-  /// Get a named directory from with the cache's artifact directory; for example,\n-  /// `material_fonts` would return `bin/cache/artifacts/material_fonts`.\n-  Directory getArtifactDirectory(String name) {\n-    return getCacheArtifacts().childDirectory(name);\n-  }\n-\n-  MapEntry<String, String> get dyLdLibEntry {\n-    if (_dyLdLibEntry != null) {\n-      return _dyLdLibEntry!;\n-    }\n-    final paths = <String>[];\n-    for (final ArtifactSet artifact in _artifacts) {\n-      final Map<String, String> env = artifact.environment;\n-      if (!env.containsKey('DYLD_LIBRARY_PATH')) {\n-        continue;\n-      }\n-      final String path = env['DYLD_LIBRARY_PATH']!;\n-      if (path.isEmpty) {\n-        continue;\n-      }\n-      paths.add(path);\n-    }\n-    _dyLdLibEntry = MapEntry<String, String>('DYLD_LIBRARY_PATH', paths.join(':'));\n-    return _dyLdLibEntry!;\n-  }\n-\n-  MapEntry<String, String>? _dyLdLibEntry;\n-\n-  /// The web sdk has to be co-located with the dart-sdk so that they can share source\n-  /// code.\n-  Directory getWebSdkDirectory() {\n-    return getRoot().childDirectory('flutter_web_sdk');\n-  }\n-\n-  String? getVersionFor(String artifactName) {\n-    final File versionFile = _fileSystem.file(\n-      _fileSystem.path.join(\n-        _rootOverride?.path ?? flutterRoot!,\n-        'bin',\n-        'internal',\n-        '$artifactName.version',\n-      ),\n-    );\n-    return versionFile.existsSync() ? versionFile.readAsStringSync().trim() : null;\n-  }\n-\n-  // TODO(matanlurey): Remove the ability to do \"generic\" realms, and special case for engine.\n-  // https://github.com/flutter/flutter/issues/164315\n-  String? getRealmFor(String artifactName) {\n-    final File realmFile = _fileSystem.file(\n-      _fileSystem.path.join(\n-        _rootOverride?.path ?? flutterRoot!,\n-        'bin',\n-        'cache',\n-        '$artifactName.realm',\n-      ),\n-    );\n-    return realmFile.existsSync() ? realmFile.readAsStringSync().trim() : '';\n-  }\n-\n-  /// Delete all stamp files maintained by the cache.\n-  void clearStampFiles() {\n-    try {\n-      getStampFileFor('flutter_tools').deleteSync();\n-      for (final ArtifactSet artifact in _artifacts) {\n-        final File file = getStampFileFor(artifact.stampName);\n-        ErrorHandlingFileSystem.deleteIfExists(file);\n-      }\n-    } on FileSystemException catch (err) {\n-      _logger.printWarning('Failed to delete some stamp files: $err');\n-    }\n-  }\n-\n-  /// Read the stamp for [artifactName].\n-  ///\n-  /// If the file is missing or cannot be parsed, returns `null`.\n-  String? getStampFor(String artifactName) {\n-    final File stampFile = getStampFileFor(artifactName);\n-    if (!stampFile.existsSync()) {\n-      return null;\n-    }\n-    try {\n-      return stampFile.readAsStringSync().trim();\n-    } on FileSystemException {\n-      return null;\n-    }\n-  }\n-\n-  void setStampFor(String artifactName, String version) {\n-    getStampFileFor(artifactName).writeAsStringSync(version);\n-  }\n-\n-  File getStampFileFor(String artifactName) {\n-    return _fileSystem.file(_fileSystem.path.join(getRoot().path, '$artifactName.stamp'));\n-  }\n-\n-  /// Returns `true` if either [entity] is older than the tools stamp or if\n-  /// [entity] doesn't exist.\n-  bool isOlderThanToolsStamp(FileSystemEntity entity) {\n-    final File flutterToolsStamp = getStampFileFor('flutter_tools');\n-    return _fsUtils.isOlderThanReference(entity: entity, referenceFile: flutterToolsStamp);\n-  }\n-\n-  Future<bool> isUpToDate() async {\n-    for (final ArtifactSet artifact in _artifacts) {\n-      if (!await artifact.isUpToDate(_fileSystem)) {\n-        return false;\n-      }\n-    }\n-    return true;\n-  }\n-\n-  /// Returns the list of artifacts that need updating from [requiredArtifacts].\n-  Future<List<ArtifactSet>> _collectArtifactsToUpdate(\n-    Set<DevelopmentArtifact> requiredArtifacts,\n-  ) async {\n-    final artifactsToUpdate = <ArtifactSet>[];\n-    final isLocalEngine = context.get<Artifacts>()?.localEngineInfo != null;\n-\n-    for (final ArtifactSet artifact in _artifacts) {\n-      if (!requiredArtifacts.contains(artifact.developmentArtifact)) {\n-        _logger.printTrace('Artifact $artifact is not required, skipping update.');\n-        continue;\n-      }\n-      if (isLocalEngine && (artifact is EngineCachedArtifact || artifact.name == 'engine_stamp')) {\n-        _logger.printTrace(\n-          'Artifact $artifact is an engine artifact or stamp and local engine is provided, skipping update.',\n-        );\n-        continue;\n-      }\n-      if (await artifact.isUpToDate(_fileSystem)) {\n-        continue;\n-      }\n-      artifactsToUpdate.add(artifact);\n-    }\n-    return artifactsToUpdate;\n-  }\n-\n-  /// Update the cache to contain all `requiredArtifacts`.\n-  Future<void> updateAll(Set<DevelopmentArtifact> requiredArtifacts, {bool offline = false}) async {\n-    if (!_lockEnabled) {\n-      return;\n-    }\n-\n-    final List<ArtifactSet> artifactsToUpdate = await _collectArtifactsToUpdate(requiredArtifacts);\n-\n-    if (artifactsToUpdate.isEmpty) {\n-      return;\n-    }\n-\n-    // Download artifacts and display progress\n-    final int total = artifactsToUpdate.length;\n-    for (var i = 0; i < artifactsToUpdate.length; i++) {\n-      final ArtifactSet artifact = artifactsToUpdate[i];\n-      final int current = i + 1;\n-\n-      // Set progress context for the artifact updater\n-      _artifactUpdater.setProgressContext(\n-        artifactIndex: current,\n-        artifactTotal: total,\n-        downloadTotal: artifact.downloadCount,\n-      );\n-\n-      // For artifacts containing multiple downloads, print the artifact name\n-      if (artifact.downloadCount > 1) {\n-        _logger.printStatus('[$current/$total] ${artifact.displayName}');\n-      }\n-\n-      try {\n-        await artifact.update(_artifactUpdater, _logger, _fileSystem, _osUtils, offline: offline);\n-      } on SocketException catch (e) {\n-        if (_hostsBlockedInChina.contains(e.address?.host)) {\n-          _logger.printError(\n-            'Failed to retrieve Flutter tool dependencies: ${e.message}.\\n'\n-            \"If you're in China, please see this page: \"\n-            'https://flutter.dev/to/china-setup',\n-            emphasis: true,\n-          );\n-        }\n-        rethrow;\n-      }\n-    }\n-    _artifactUpdater.resetProgressContext();\n-  }\n-\n-  Future<bool> areRemoteArtifactsAvailable({\n-    String? engineVersion,\n-    bool includeAllPlatforms = true,\n-  }) async {\n-    final bool includeAllPlatformsState = this.includeAllPlatforms;\n-    var allAvailable = true;\n-    this.includeAllPlatforms = includeAllPlatforms;\n-    for (final ArtifactSet cachedArtifact in _artifacts) {\n-      if (cachedArtifact is EngineCachedArtifact) {\n-        allAvailable &= await cachedArtifact.checkForArtifacts(engineVersion);\n-      }\n-    }\n-    this.includeAllPlatforms = includeAllPlatformsState;\n-    return allAvailable;\n-  }\n-\n-  Future<bool> doesRemoteExist(String message, Uri url) async {\n-    final Status status = _logger.startProgress(message);\n-    bool exists;\n-    try {\n-      exists = await _net.doesRemoteFileExist(url);\n-    } finally {\n-      status.stop();\n-    }\n-    return exists;\n-  }\n-}\n-\n-/// Representation of a set of artifacts used by the tool.\n-abstract class ArtifactSet {\n-  ArtifactSet(this.developmentArtifact);\n-\n-  /// The development artifact.\n-  final DevelopmentArtifact developmentArtifact;\n-\n-  /// Whether the artifact is up to date.\n-  Future<bool> isUpToDate(FileSystem fileSystem);\n-\n-  /// The environment variables (if any) required to consume the artifacts.\n-  Map<String, String> get environment {\n-    return const <String, String>{};\n-  }\n-\n-  /// Updates the artifact.\n-  Future<void> update(\n-    ArtifactUpdater artifactUpdater,\n-    Logger logger,\n-    FileSystem fileSystem,\n-    OperatingSystemUtils operatingSystemUtils, {\n-    bool offline = false,\n-  });\n-\n-  /// The canonical name of the artifact.\n-  String get name;\n-\n-  /// A prettier display name.\n-  ///\n-  /// Defaults to the canonical name.\n-  String get displayName => name;\n-\n-  /// The name of the stamp file.\n-  ///\n-  /// Defaults to the same as the artifact name.\n-  String get stampName => name;\n-\n-  /// The number of individual downloads this artifact will perform.\n-  ///\n-  /// Defaults to 1.\n-  int get downloadCount => 1;\n-}\n-\n-/// An artifact set managed by the cache.\n-abstract class CachedArtifact extends ArtifactSet {\n-  CachedArtifact(this.name, this.cache, DevelopmentArtifact developmentArtifact)\n-    : super(developmentArtifact);\n-\n-  final Cache cache;\n-\n-  @override\n-  final String name;\n-\n-  @override\n-  String get stampName => name;\n-\n-  Directory get location => cache.getArtifactDirectory(name);\n-\n-  String? get version => cache.getVersionFor(name);\n-\n-  // Whether or not to bypass normal platform filtering for this artifact.\n-  bool get ignorePlatformFiltering {\n-    return cache.includeAllPlatforms ||\n-        (cache.platformOverrideArtifacts != null &&\n-            cache.platformOverrideArtifacts!.contains(developmentArtifact.name));\n-  }\n-\n-  @override\n-  Future<bool> isUpToDate(FileSystem fileSystem) async {\n-    if (!location.existsSync()) {\n-      return false;\n-    }\n-    if (version != cache.getStampFor(stampName)) {\n-      return false;\n-    }\n-    return isUpToDateInner(fileSystem);\n-  }\n-\n-  @override\n-  Future<void> update(\n-    ArtifactUpdater artifactUpdater,\n-    Logger logger,\n-    FileSystem fileSystem,\n-    OperatingSystemUtils operatingSystemUtils, {\n-    bool offline = false,\n-  }) async {\n-    if (!location.existsSync()) {\n-      try {\n-        location.createSync(recursive: true);\n-      } on FileSystemException catch (err) {\n-        logger.printError(err.toString());\n-        throwToolExit(\n-          'Failed to create directory for flutter cache at ${location.path}. '\n-          'Flutter may be missing permissions in its cache directory.',\n-        );\n-      }\n-    }\n-    await updateInner(artifactUpdater, fileSystem, operatingSystemUtils);\n-    try {\n-      if (version == null) {\n-        logger.printWarning(\n-          'No known version for the artifact name \"$name\". '\n-          'Flutter can continue, but the artifact may be re-downloaded on '\n-          'subsequent invocations until the problem is resolved.',\n-        );\n-      } else {\n-        cache.setStampFor(stampName, version!);\n-      }\n-    } on FileSystemException catch (err) {\n-      logger.printWarning(\n-        'The new artifact \"$name\" was downloaded, but Flutter failed to update '\n-        'its stamp file, receiving the error \"$err\". '\n-        'Flutter can continue, but the artifact may be re-downloaded on '\n-        'subsequent invocations until the problem is resolved.',\n-      );\n-    }\n-    artifactUpdater.removeDownloadedFiles();\n-  }\n-\n-  /// Hook method for extra checks for being up-to-date.\n-  bool isUpToDateInner(FileSystem fileSystem) => true;\n-\n-  Future<void> updateInner(\n-    ArtifactUpdater artifactUpdater,\n-    FileSystem fileSystem,\n-    OperatingSystemUtils operatingSystemUtils,\n-  );\n-}\n-\n-abstract class EngineCachedArtifact extends CachedArtifact {\n-  EngineCachedArtifact(this.stampName, Cache cache, DevelopmentArtifact developmentArtifact)\n-    : super('engine', cache, developmentArtifact);\n-\n-  @override\n-  final String stampName;\n-\n-  @override\n-  String? get version => cache.engineRevision;\n-\n-  @override\n-  int get downloadCount => getPackageDirs().length + getBinaryDirs().length;\n-\n-  /// Return a list of (directory path, download URL path) tuples.\n-  List<List<String>> getBinaryDirs();\n-\n-  /// A list of cache directory paths to which the LICENSE file should be copied.\n-  List<String> getLicenseDirs();\n-\n-  /// A list of the dart package directories to download.\n-  List<String> getPackageDirs();\n-\n-  @override\n-  bool isUpToDateInner(FileSystem fileSystem) {\n-    final Directory pkgDir = cache.getCacheDir('pkg');\n-    for (final String pkgName in getPackageDirs()) {\n-      final String pkgPath = fileSystem.path.join(pkgDir.path, pkgName);\n-      if (!fileSystem.directory(pkgPath).existsSync()) {\n-        return false;\n-      }\n-    }\n-\n-    for (final List<String> toolsDir in getBinaryDirs()) {\n-      final Directory dir = fileSystem.directory(fileSystem.path.join(location.path, toolsDir[0]));\n-      if (!dir.existsSync()) {\n-        return false;\n-      }\n-    }\n-\n-    for (final String licenseDir in getLicenseDirs()) {\n-      final File file = fileSystem.file(fileSystem.path.join(location.path, licenseDir, 'LICENSE'));\n-      if (!file.existsSync()) {\n-        return false;\n-      }\n-    }\n-    return true;\n-  }\n-\n-  @override\n-  Future<void> updateInner(\n-    ArtifactUpdater artifactUpdater,\n-    FileSystem fileSystem,\n-    OperatingSystemUtils operatingSystemUtils,\n-  ) async {\n-    final url = '${cache.storageBaseUrl}/flutter_infra_release/flutter/$version/';\n-\n-    final Directory pkgDir = cache.getCacheDir('pkg');\n-    for (final String pkgName in getPackageDirs()) {\n-      await artifactUpdater.downloadZipArchive(pkgName, Uri.parse('$url$pkgName.zip'), pkgDir);\n-    }\n-\n-    for (final List<String> toolsDir in getBinaryDirs()) {\n-      final String cacheDir = toolsDir[0];\n-      final String urlPath = toolsDir[1];\n-      final Directory dir = fileSystem.directory(fileSystem.path.join(location.path, cacheDir));\n-\n-      final String friendlyName = urlPath.replaceAll('/artifacts.zip', '').replaceAll('.zip', '');\n-      await artifactUpdater.downloadZipArchive(friendlyName, Uri.parse(url + urlPath), dir);\n-\n-      _makeFilesExecutable(dir, operatingSystemUtils);\n-    }\n-\n-    final File licenseSource = cache.getLicenseFile();\n-    for (final String licenseDir in getLicenseDirs()) {\n-      final String licenseDestinationPath = fileSystem.path.join(\n-        location.path,\n-        licenseDir,\n-        'LICENSE',\n-      );\n-      await licenseSource.copy(licenseDestinationPath);\n-    }\n-  }\n-\n-  Future<bool> checkForArtifacts(String? engineVersion) async {\n-    engineVersion ??= version;\n-    final url = '${cache.storageBaseUrl}/flutter_infra_release/flutter/$engineVersion/';\n-\n-    var exists = false;\n-    for (final String pkgName in getPackageDirs()) {\n-      exists = await cache.doesRemoteExist(\n-        'Checking package $pkgName is available...',\n-        Uri.parse('$url$pkgName.zip'),\n-      );\n-      if (!exists) {\n-        return false;\n-      }\n-    }\n-\n-    for (final List<String> toolsDir in getBinaryDirs()) {\n-      final String cacheDir = toolsDir[0];\n-      final String urlPath = toolsDir[1];\n-      exists = await cache.doesRemoteExist(\n-        'Checking $cacheDir tools are available...',\n-        Uri.parse(url + urlPath),\n-      );\n-      if (!exists) {\n-        return false;\n-      }\n-    }\n-    return true;\n-  }\n-\n-  void _makeFilesExecutable(Directory dir, OperatingSystemUtils operatingSystemUtils) {\n-    operatingSystemUtils.chmod(dir, 'a+r,a+x');\n-    for (final File file in dir.listSync(recursive: true).whereType<File>()) {\n-      final FileStat stat = file.statSync();\n-      final isUserExecutable = ((stat.mode >> 6) & 0x1) == 1;\n-      if (file.basename == 'flutter_tester' || isUserExecutable) {\n-        // Make the file readable and executable by all users.\n-        operatingSystemUtils.chmod(file, 'a+r,a+x');\n-      }\n-    }\n-  }\n-}\n-\n-/// An API for downloading and un-archiving artifacts, such as engine binaries or\n-/// additional source code.\n-class ArtifactUpdater {\n-  ArtifactUpdater({\n-    required OperatingSystemUtils operatingSystemUtils,\n-    required Logger logger,\n-    required FileSystem fileSystem,\n-    required Directory tempStorage,\n-    required HttpClient httpClient,\n-    required Platform platform,\n-    required List<String> allowedBaseUrls,\n-    Stdio? stdio,\n-  }) : _operatingSystemUtils = operatingSystemUtils,\n-       _httpClient = httpClient,\n-       _logger = logger,\n-       _fileSystem = fileSystem,\n-       _tempStorage = tempStorage,\n-       _platform = platform,\n-       _allowedBaseUrls = allowedBaseUrls,\n-       _stdio = stdio;\n-\n-  /// The number of times the artifact updater will repeat the artifact download loop.\n-  static const _kRetryCount = 2;\n-\n-  final Logger _logger;\n-  final OperatingSystemUtils _operatingSystemUtils;\n-  final FileSystem _fileSystem;\n-  final Directory _tempStorage;\n-  final HttpClient _httpClient;\n-  final Platform _platform;\n-\n-  /// Artifacts should only be downloaded from URLs that use one of these\n-  /// prefixes.\n-  ///\n-  /// [ArtifactUpdater] will issue a warning if an attempt to download from a\n-  /// non-compliant URL is made.\n-  final List<String> _allowedBaseUrls;\n-\n-  final Stdio? _stdio;\n-\n-  /// Keep track of the files we've downloaded for this execution so we\n-  /// can delete them after completion. We don't delete them right after\n-  /// extraction in case [ArtifactSet.update] is interrupted, so we can\n-  /// restart without starting from scratch.\n-  @visibleForTesting\n-  final downloadedFiles = <File>[];\n-\n-  // Progress tracking state for download output formatting.\n-  int _artifactIndex = 0;\n-  int _artifactTotal = 0;\n-  int _downloadIndex = 0;\n-  int _downloadTotal = 0;\n-\n-  /// Sets the progress context for artifact downloads.\n-  ///\n-  /// This is called before each artifact update to enable progress output.\n-  /// The [downloadIndex] can be used to set the current download index\n-  /// within an artifact (1-based).\n-  void setProgressContext({\n-    required int artifactIndex,\n-    required int artifactTotal,\n-    required int downloadTotal,\n-    int downloadIndex = 0,\n-  }) {\n-    _artifactIndex = artifactIndex;\n-    _artifactTotal = artifactTotal;\n-    _downloadIndex = downloadIndex;\n-    _downloadTotal = downloadTotal;\n-  }\n-\n-  void resetProgressContext() {\n-    _artifactIndex = 0;\n-    _artifactTotal = 0;\n-    _downloadIndex = 0;\n-    _downloadTotal = 0;\n-  }\n-\n-  /// Creates the appropriate display for the current terminal capabilities.\n-  _DownloadDisplay _createDisplay(String statusMessage) {\n-    if (_stdio != null && _logger.supportsColor) {\n-      return _ProgressBarDisplay(stdio: _stdio, statusMessage: statusMessage);\n-    }\n-    return _SpinnerDisplay(logger: _logger, statusMessage: statusMessage);\n-  }\n-\n-  /// These filenames, should they exist after extracting an archive, should be deleted.\n-  static const _denylistedBasenames = <String>{\n-    'entitlements.txt',\n-    'without_entitlements.txt',\n-    'unsigned_binaries.txt',\n-  };\n-  void _removeDenylistedFiles(Directory directory) {\n-    for (final FileSystemEntity entity in directory.listSync(recursive: true)) {\n-      if (entity is! File) {\n-        continue;\n-      }\n-      if (_denylistedBasenames.contains(entity.basename)) {\n-        entity.deleteSync();\n-      }\n-    }\n-  }\n-\n-  /// Download a zip archive from the given [url] and unzip it to [location].\n-  Future<void> downloadZipArchive(String artifactName, Uri url, Directory location) {\n-    return _downloadArchive(artifactName, url, location, _operatingSystemUtils.unzip);\n-  }\n-\n-  /// Download a gzipped tarball from the given [url] and unpack it to [location].\n-  Future<void> downloadZippedTarball(String artifactName, Uri url, Directory location) {\n-    return _downloadArchive(artifactName, url, location, _operatingSystemUtils.unpack);\n-  }\n-\n-  /// Download a file from the given [url] and copy it to [location].\n-  Future<void> downloadFile(String artifactName, Uri url, Directory location) {\n-    return _downloadArchive(artifactName, url, location, (File file, Directory dir) {\n-      file.copySync(dir.childFile(file.basename).path);\n-    });\n-  }\n-\n-  /// Formats a download message with progress context.\n-  @visibleForTesting\n-  String formatProgressMessage(String artifactName) {\n-    final int displayIndex = _downloadIndex + 1;\n-    if (_downloadTotal == 1) {\n-      return '[$_artifactIndex/$_artifactTotal] $artifactName';\n-    } else {\n-      final prefix = displayIndex == _downloadTotal ? '└─' : '├─';\n-      return '  $prefix [$displayIndex/$_downloadTotal] $artifactName';\n-    }\n-  }\n-\n-  /// Download an archive from the given [url] and unzip it to [location].\n-  Future<void> _downloadArchive(\n-    String artifactName,\n-    Uri url,\n-    Directory location,\n-    void Function(File, Directory) extractor,\n-  ) async {\n-    final String downloadPath = flattenNameSubdirs(url, _fileSystem);\n-    final File tempFile = _createDownloadFile(downloadPath);\n-    int retries = _kRetryCount;\n-    final String formattedMessage = formatProgressMessage(artifactName);\n-    _downloadIndex++;\n-\n-    while (retries > 0) {\n-      final _DownloadDisplay display = _createDisplay(formattedMessage);\n-      display.start();\n-\n-      try {\n-        _ensureExists(tempFile.parent);\n-        if (tempFile.existsSync()) {\n-          tempFile.deleteSync();\n-        }\n-        await _download(url, tempFile, display);\n-\n-        if (!tempFile.existsSync()) {\n-          throw Exception('Did not find downloaded file ${tempFile.path}');\n-        }\n-        display.finish();\n-      } on Exception catch (err) {\n-        display.cancel();\n-        _logger.printTrace(err.toString());\n-        retries -= 1;\n-        if (retries == 0) {\n-          throwToolExit(\n-            'Failed to download $url. Ensure you have network connectivity and then try again.\\n$err',\n-          );\n-        }\n-        continue;\n-      } on ArgumentError catch (error) {\n-        display.cancel();\n-        final String? overrideUrl = _platform.environment[kFlutterStorageBaseUrl];\n-        if (overrideUrl != null && url.toString().contains(overrideUrl)) {\n-          _logger.printError(error.toString());\n-          throwToolExit(\n-            'The value of $kFlutterStorageBaseUrl ($overrideUrl) could not be '\n-            'parsed as a valid url. Please see https://flutter.dev/to/use-mirror-site '\n-            'for an example of how to use it.\\n'\n-            'Full URL: $url',\n-            exitCode: kNetworkProblemExitCode,\n-          );\n-        }\n-        // This error should not be hit if there was not a storage URL override, allow the\n-        // tool to crash.\n-        rethrow;\n-      }\n-\n-      /// Unzipping multiple file into a directory will not remove old files\n-      /// from previous versions that are not present in the new bundle.\n-      final Directory destination = location.childDirectory(\n-        tempFile.fileSystem.path.basenameWithoutExtension(tempFile.path),\n-      );\n-      try {\n-        ErrorHandlingFileSystem.deleteIfExists(destination, recursive: true);\n-      } on FileSystemException catch (error) {\n-        // Error that indicates another program has this file open and that it\n-        // cannot be deleted. For the cache, this is either the analyzer reading\n-        // the sky_engine package or a running flutter_tester device.\n-        const kSharingViolation = 32;\n-        if (_platform.isWindows && error.osError?.errorCode == kSharingViolation) {\n-          throwToolExit(\n-            'Failed to delete ${destination.path} because the local file/directory is in use '\n-            'by another process. Try closing any running IDEs or editors and trying '\n-            'again',\n-          );\n-        }\n-      }\n-      _ensureExists(location);\n-\n-      try {\n-        extractor(tempFile, location);\n-      } on Exception catch (err) {\n-        retries -= 1;\n-        if (retries == 0) {\n-          throwToolExit(\n-            'Flutter could not download and/or extract $url. Ensure you have '\n-            'network connectivity and all of the required dependencies listed at '\n-            'https://flutter.dev/setup.\\nThe original exception was: $err.',\n-          );\n-        }\n-        _deleteIgnoringErrors(tempFile);\n-        continue;\n-      }\n-      _removeDenylistedFiles(location);\n-      return;\n-    }\n-  }\n-\n-  /// Download bytes from [url], throwing non-200 responses as an exception.\n-  ///\n-  /// Validates that the md5 of the content bytes matches the provided\n-  /// `x-goog-hash` header, if present. This header should contain an md5 hash\n-  /// if the download source is Google cloud storage.\n-  ///\n-  /// See also:\n-  ///   * https://cloud.google.com/storage/docs/xml-api/reference-headers#xgooghash\n-  Future<void> _download(Uri url, File file, _DownloadDisplay display) async {\n-    final bool isAllowedUrl = _allowedBaseUrls.any(\n-      (String baseUrl) => url.toString().startsWith(baseUrl),\n-    );\n-\n-    // In tests make this a hard failure.\n-    assert(\n-      isAllowedUrl,\n-      'URL not allowed: $url\\n'\n-      'Allowed URLs must be based on one of: ${_allowedBaseUrls.join(', ')}',\n-    );\n-\n-    // In production, issue a warning but allow the download to proceed.\n-    if (!isAllowedUrl) {\n-      display.pause();\n-      _logger.printWarning(\n-        'Downloading an artifact that may not be reachable in some environments (e.g. firewalled environments): $url\\n'\n-        'This should not have happened. This is likely a Flutter SDK bug. Please file an issue at https://github.com/flutter/flutter/issues/new?template=01_activation.yml',\n-      );\n-      display.resume();\n-    }\n-\n-    final HttpClientRequest request = await _httpClient.getUrl(url);\n-    final HttpClientResponse response = await request.close();\n-    if (response.statusCode != HttpStatus.ok) {\n-      throw Exception(response.statusCode);\n-    }\n-\n-    final String? md5Hash = _expectedMd5(response.headers);\n-    ByteConversionSink? inputSink;\n-    late StreamController<Digest> digests;\n-    if (md5Hash != null) {\n-      _logger.printTrace('Content $url md5 hash: $md5Hash');\n-      digests = StreamController<Digest>();\n-      inputSink = md5.startChunkedConversion(digests);\n-    }\n-    final int contentLength = response.contentLength;\n-    final RandomAccessFile randomAccessFile = file.openSync(mode: FileMode.writeOnly);\n-    await response.forEach((List<int> chunk) {\n-      inputSink?.add(chunk);\n-      randomAccessFile.writeFromSync(chunk);\n-      display.onChunk(chunk.length, contentLength);\n-    });\n-    randomAccessFile.closeSync();\n-    if (inputSink != null) {\n-      inputSink.close();\n-      final Digest digest = await digests.stream.last;\n-      final String rawDigest = base64.encode(digest.bytes);\n-      if (rawDigest != md5Hash) {\n-        throw Exception(\n-          'Expected $url to have md5 checksum $md5Hash, but was $rawDigest. This '\n-          'may indicate a problem with your connection to the Flutter backend servers. '\n-          'Please re-try the download after confirming that your network connection is '\n-          'stable.',\n-        );\n-      }\n-    }\n-  }\n-\n-  String? _expectedMd5(HttpHeaders httpHeaders) {\n-    final List<String>? values = httpHeaders['x-goog-hash'];\n-    if (values == null) {\n-      return null;\n-    }\n-    String? rawMd5Hash;\n-    for (final String value in values) {\n-      if (value.startsWith('md5=')) {\n-        rawMd5Hash = value;\n-        break;\n-      }\n-    }\n-    if (rawMd5Hash == null) {\n-      return null;\n-    }\n-    final List<String> segments = rawMd5Hash.split('md5=');\n-    if (segments.length < 2) {\n-      return null;\n-    }\n-    final String md5Hash = segments[1];\n-    if (md5Hash.isEmpty) {\n-      return null;\n-    }\n-    return md5Hash;\n-  }\n-\n-  /// Create a temporary file and add it to the [downloadedFiles].\n-  File _createDownloadFile(String name) {\n-    final File tempFile = _fileSystem.file(_fileSystem.path.join(_tempStorage.path, name));\n-    downloadedFiles.add(tempFile);\n-    return tempFile;\n-  }\n-\n-  /// Create the given [directory] and parents, as necessary.\n-  void _ensureExists(Directory directory) {\n-    if (!directory.existsSync()) {\n-      directory.createSync(recursive: true);\n-    }\n-  }\n-\n-  /// Clear any zip/gzip files downloaded.\n-  void removeDownloadedFiles() {\n-    for (final File file in downloadedFiles) {\n-      if (!file.existsSync()) {\n-        continue;\n-      }\n-      try {\n-        file.deleteSync();\n-      } on FileSystemException catch (e) {\n-        _logger.printWarning('Failed to delete \"${file.path}\". Please delete manually. $e');\n-        continue;\n-      }\n-      for (\n-        Directory directory = file.parent;\n-        directory.absolute.path != _tempStorage.absolute.path;\n-        directory = directory.parent\n-      ) {\n-        // Handle race condition when the directory is deleted before this step\n-        if (!directory.existsSync()) {\n-          break;\n-        }\n-        if (directory.listSync().isNotEmpty) {\n-          break;\n-        }\n-        _deleteIgnoringErrors(directory);\n-      }\n-    }\n-  }\n-\n-  static void _deleteIgnoringErrors(FileSystemEntity entity) {\n-    if (!entity.existsSync()) {\n-      return;\n-    }\n-    try {\n-      entity.deleteSync();\n-    } on FileSystemException {\n-      // Ignore errors.\n-    }\n-  }\n-}\n-\n-@visibleForTesting\n-String flattenNameSubdirs(Uri url, FileSystem fileSystem) {\n-  final pieces = <String>[url.host, ...url.pathSegments];\n-  final Iterable<String> convertedPieces = pieces.map<String>(_flattenNameNoSubdirs);\n-  return fileSystem.path.joinAll(convertedPieces);\n-}\n-\n-/// Given a name containing slashes, colons, and backslashes, expand it into\n-/// something that doesn't.\n-String _flattenNameNoSubdirs(String fileName) {\n-  final replacedCodeUnits = <int>[\n-    for (final int codeUnit in fileName.codeUnits)\n-      ..._flattenNameSubstitutions[codeUnit] ?? <int>[codeUnit],\n-  ];\n-  return String.fromCharCodes(replacedCodeUnits);\n-}\n-\n-// Many characters are problematic in filenames, especially on Windows.\n-final _flattenNameSubstitutions = <int, List<int>>{\n-  r'@'.codeUnitAt(0): '@@'.codeUnits,\n-  r'/'.codeUnitAt(0): '@s@'.codeUnits,\n-  r'\\'.codeUnitAt(0): '@bs@'.codeUnits,\n-  r':'.codeUnitAt(0): '@c@'.codeUnits,\n-  r'%'.codeUnitAt(0): '@per@'.codeUnits,\n-  r'*'.codeUnitAt(0): '@ast@'.codeUnits,\n-  r'<'.codeUnitAt(0): '@lt@'.codeUnits,\n-  r'>'.codeUnitAt(0): '@gt@'.codeUnits,\n-  r'\"'.codeUnitAt(0): '@q@'.codeUnits,\n-  r'|'.codeUnitAt(0): '@pip@'.codeUnits,\n-  r'?'.codeUnitAt(0): '@ques@'.codeUnits,\n-};\n-\n-/// Abstraction for displaying download progress.\n-///\n-/// Two implementations exist:\n-/// - [_ProgressBarDisplay]: ANSI progress bar for terminals with color support.\n-/// - [_SpinnerDisplay]: Spinner-based display via [Logger.startProgress].\n-abstract class _DownloadDisplay {\n-  /// Called when the download begins.\n-  void start();\n-\n-  /// Called when a chunk of data is received.\n-  void onChunk(int chunkSize, int contentLength);\n-\n-  /// Called when the download completes successfully.\n-  void finish();\n-\n-  /// Called when the download is cancelled or fails.\n-  void cancel();\n-\n-  /// Pauses the display (e.g. when another status message needs the terminal).\n-  void pause();\n-\n-  /// Resumes the display after a pause.\n-  void resume();\n-}\n-\n-/// Displays an ANSI progress bar with speed, ETA, and percentage.\n-class _ProgressBarDisplay extends _DownloadDisplay {\n-  _ProgressBarDisplay({required Stdio stdio, required this.statusMessage}) : _stdio = stdio;\n-\n-  static const int _maxTerminalWidth = 80;\n-  static const int _progressUpdateIntervalMs = 100;\n-\n-  final Stdio _stdio;\n-  final String statusMessage;\n-  final DownloadProgress _progress = DownloadProgress();\n-  final Stopwatch _stopwatch = Stopwatch();\n-  int _lastUpdateMs = 0;\n-\n-  int get _terminalWidth =>\n-      (_stdio.terminalColumns ?? _maxTerminalWidth).clamp(0, _maxTerminalWidth);\n-\n-  @override\n-  void start() {\n-    _stopwatch.start();\n-    _stdio.stdoutWrite('$statusMessage\\n');\n-  }\n-\n-  @override\n-  void onChunk(int chunkSize, int contentLength) {\n-    if (_progress.totalBytes < 0) {\n-      _progress.totalBytes = contentLength;\n-    }\n-    _progress.addBytesReceived(chunkSize);\n-    final int currentMs = _stopwatch.elapsedMilliseconds;\n-    if (currentMs >= _lastUpdateMs + _progressUpdateIntervalMs) {\n-      _lastUpdateMs = currentMs;\n-      final String line = _progress.formatProgressLine(\n-        elapsed: _stopwatch.elapsed,\n-        terminalWidth: _terminalWidth,\n-      );\n-      _stdio.stdoutWrite('${AnsiTerminal.clearAndReturnCode}$line');\n-    }\n-  }\n-\n-  void _stopAndClear() {\n-    _stopwatch.stop();\n-    _stdio.stdoutWrite(\n-      '${AnsiTerminal.clearAndReturnCode}'\n-      '${AnsiTerminal.cursorUpLineCode}'\n-      '${AnsiTerminal.clearAndReturnCode}',\n-    );\n-  }\n-\n-  @override\n-  void finish() {\n-    _stopAndClear();\n-    final String summary = _progress.formatCompletionSummary(_stopwatch.elapsed);\n-    final int padding = _terminalWidth - statusMessage.length - summary.length;\n-    final line = '$statusMessage${' ' * max(1, padding)}$summary';\n-    _stdio.stdoutWrite('$line\\n');\n-  }\n-\n-  @override\n-  void cancel() {\n-    _stopAndClear();\n-  }\n-\n-  @override\n-  void pause() {}\n-\n-  @override\n-  void resume() {}\n-}\n-\n-/// Displays a spinner via [Logger.startProgress].\n-class _SpinnerDisplay extends _DownloadDisplay {\n-  _SpinnerDisplay({required Logger logger, required String statusMessage})\n-    : _logger = logger,\n-      _statusMessage = statusMessage;\n-\n-  final Logger _logger;\n-  final String _statusMessage;\n-  Status? _status;\n-\n-  @override\n-  void start() {\n-    _status = _logger.startProgress(_statusMessage);\n-  }\n-\n-  @override\n-  void onChunk(int chunkSize, int contentLength) {}\n-\n-  @override\n-  void finish() {\n-    _status?.stop();\n-  }\n-\n-  @override\n-  void cancel() {\n-    _status?.stop();\n-  }\n-\n-  @override\n-  void pause() {\n-    _status?.pause();\n-  }\n-\n-  @override\n-  void resume() {\n-    _status?.resume();\n-  }\n-}\n-\n-/// Tracks download progress and provides formatted display strings.\n-@visibleForTesting\n-class DownloadProgress {\n-  /// Total expected bytes, or -1 if unknown.\n-  int totalBytes = -1;\n-\n-  int _bytesReceived = 0;\n-  int get bytesReceived => _bytesReceived;\n-\n-  void addBytesReceived(int bytes) {\n-    _bytesReceived += bytes;\n-  }\n-\n-  bool get hasKnownSize => totalBytes > 0;\n-\n-  double get fractionReceived => hasKnownSize ? (_bytesReceived / totalBytes).clamp(0.0, 1.0) : 0.0;\n-\n-  int get percentReceived => (fractionReceived * 100).round();\n-\n-  /// Download speed in bytes per second.\n-  double speedBytesPerSecond(Duration elapsed) {\n-    if (elapsed.inMilliseconds == 0) {\n-      return 0;\n-    }\n-    return _bytesReceived * 1000 / elapsed.inMilliseconds;\n-  }\n-\n-  /// Estimated time remaining.\n-  Duration? timeRemaining(Duration elapsed) {\n-    final double speed = speedBytesPerSecond(elapsed);\n-    if (!hasKnownSize || speed == 0) {\n-      return null;\n-    }\n-    final int totalRemainingBytes = totalBytes - _bytesReceived;\n-    return Duration(milliseconds: (totalRemainingBytes * 1000 / speed).round());\n-  }\n-\n-  static const _subBlocks = ['▏', '▎', '▍', '▌', '▋', '▊', '▉'];\n-\n-  /// Renders a progress bar with sub-character precision.\n-  ///\n-  /// Uses 1/8-block characters for a smooth fill edge.\n-  String renderProgressBar(int width) {\n-    if (!hasKnownSize || width <= 0) {\n-      return '';\n-    }\n-    final int totalEighths = (fractionReceived * width * 8).round();\n-    final int fullBlocks = totalEighths ~/ 8;\n-    final int remainder = totalEighths % 8;\n-    final int emptyBlocks = width - fullBlocks - 1;\n-    final String filled = '█' * fullBlocks;\n-    final String partial = remainder > 0 ? _subBlocks[remainder - 1] : ' ';\n-    final String empty = ' ' * emptyBlocks;\n-    return '$filled$partial$empty';\n-  }\n-\n-  /// Formats download speed as a human-readable string.\n-  String formatSpeed(Duration elapsed) {\n-    return '${getSizeAsPlatformMB(speedBytesPerSecond(elapsed).round())}/s';\n-  }\n-\n-  /// Formats bytes received and total.\n-  String formatBytes() {\n-    if (hasKnownSize) {\n-      return '${getSizeAsPlatformMB(_bytesReceived)}'\n-          '/${getSizeAsPlatformMB(totalBytes)}';\n-    }\n-    return getSizeAsPlatformMB(_bytesReceived);\n-  }\n-\n-  /// Formats estimated time remaining.\n-  String formatRemaining(Duration elapsed) {\n-    final Duration? rem = timeRemaining(elapsed);\n-    if (rem == null) {\n-      return '';\n-    }\n-    return 'ETA ${getElapsedAsSeconds(rem)}';\n-  }\n-\n-  /// Formats the full progress line for terminal display.\n-  String formatProgressLine({required Duration elapsed, required int terminalWidth}) {\n-    final String indent = ' ' * 5;\n-    final percentReceivedStr = hasKnownSize ? '${percentReceived.toString().padLeft(3)}%' : '';\n-    final String bytesStr = formatBytes();\n-    final String speedStr = formatSpeed(elapsed);\n-    final String etaStr = formatRemaining(elapsed);\n-\n-    final parts = <String>[percentReceivedStr, bytesStr, speedStr, etaStr];\n-    final String info = parts.where((String s) => s.isNotEmpty).join('  ');\n-\n-    // The progress bar is 28 characters wide and terminated on either side by\n-    // thin vertical lines which take up another 2 characters. 28 characters was\n-    // chosen empirically to make the progress bar take up enough space to look\n-    // good while leaving enough space for the detailed info under \"normal\"\n-    // conditions (artifact size <1GB, download speed >1MB/s).\n-    const barInner = 28;\n-    const int barTotal = barInner + 2; // ▕ + bar + ▏\n-    final String line;\n-\n-    // Only show the progress bar if we have enough room to show it along with\n-    // the info, otherwise just show the info right-aligned.\n-    if (hasKnownSize && terminalWidth >= indent.length + barTotal + info.length) {\n-      final String bar = renderProgressBar(barInner);\n-      final int padding = terminalWidth - indent.length - barTotal - info.length;\n-      line = '$indent▕$bar▏${' ' * padding}$info';\n-    } else {\n-      final int padding = terminalWidth - indent.length - info.length;\n-      final unclipped = '$indent${' ' * max(0, padding)}$info';\n-      line = unclipped.length <= terminalWidth ? unclipped : unclipped.substring(0, terminalWidth);\n-    }\n-    return line;\n-  }\n-\n-  /// Formats the completion summary like `(21.1MB in 5.0s)`.\n-  String formatCompletionSummary(Duration elapsed) {\n-    final String size = getSizeAsPlatformMB(_bytesReceived);\n-    final String time = getElapsedAsSeconds(elapsed);\n-    return '($size in $time)';\n-  }\n-}\n+// Copyright 2014 The Flutter Authors. All rights reserved.\n+// Use of this source code is governed by a BSD-style license that can be\n+// found in the LICENSE file.\n+\n+/// @docImport 'flutter_cache.dart';\n+/// @docImport 'runner/flutter_command.dart';\n+/// @docImport 'runner/flutter_command_runner.dart';\n+library;\n+\n+import 'dart:async';\n+import 'dart:ffi' show Abi;\n+import 'dart:math' show max;\n+\n+import 'package:crypto/crypto.dart';\n+import 'package:file/memory.dart';\n+import 'package:meta/meta.dart';\n+import 'package:process/process.dart';\n+\n+import 'artifacts.dart';\n+import 'base/common.dart';\n+import 'base/context.dart';\n+import 'base/error_handling_io.dart';\n+import 'base/file_system.dart';\n+import 'base/io.dart'\n+    show\n+        HttpClient,\n+        HttpClientRequest,\n+        HttpClientResponse,\n+        HttpHeaders,\n+        HttpStatus,\n+        Stdio;\n+import 'base/logger.dart';\n+import 'base/net.dart';\n+import 'base/os.dart' show OperatingSystemUtils;\n+import 'base/platform.dart';\n+import 'base/terminal.dart';\n+import 'base/user_messages.dart';\n+import 'base/utils.dart' show getElapsedAsSeconds, getSizeAsPlatformMB;\n+import 'convert.dart';\n+import 'features.dart';\n+\n+const kFlutterRootEnvironmentVariableName =\n+    'FLUTTER_ROOT'; // should point to //flutter/ (root of flutter/flutter repo)\n+const kFlutterEngineEnvironmentVariableName =\n+    'FLUTTER_ENGINE'; // should point to //engine/src/ (root of flutter/engine repo)\n+const kSnapshotFileName = 'flutter_tools.snapshot'; // in //flutter/bin/cache/\n+const kFlutterToolsScriptFileName =\n+    'flutter_tools.dart'; // in //flutter/packages/flutter_tools/bin/\n+const kFlutterEnginePackageName = 'sky_engine';\n+\n+/// A tag for a set of development artifacts that need to be cached.\n+class DevelopmentArtifact {\n+  const DevelopmentArtifact._(this.name, {this.feature});\n+\n+  /// The name of the artifact.\n+  ///\n+  /// This should match the flag name in precache.dart.\n+  final String name;\n+\n+  /// A feature to control the visibility of this artifact.\n+  final Feature? feature;\n+\n+  /// Artifacts required for Android development.\n+  static const androidGenSnapshot = DevelopmentArtifact._(\n+    'android_gen_snapshot',\n+    feature: flutterAndroidFeature,\n+  );\n+  static const androidMaven = DevelopmentArtifact._(\n+    'android_maven',\n+    feature: flutterAndroidFeature,\n+  );\n+\n+  // Artifacts used for internal builds.\n+  static const androidInternalBuild = DevelopmentArtifact._(\n+    'android_internal_build',\n+    feature: flutterAndroidFeature,\n+  );\n+\n+  /// Artifacts required for iOS development.\n+  static const iOS = DevelopmentArtifact._('ios', feature: flutterIOSFeature);\n+\n+  /// Artifacts required for web development.\n+  static const web = DevelopmentArtifact._('web', feature: flutterWebFeature);\n+\n+  /// Artifacts required for desktop macOS.\n+  static const macOS = DevelopmentArtifact._('macos', feature: flutterMacOSDesktopFeature);\n+\n+  /// Artifacts required for desktop Windows.\n+  static const windows = DevelopmentArtifact._('windows', feature: flutterWindowsDesktopFeature);\n+\n+  /// Artifacts required for desktop Linux.\n+  static const linux = DevelopmentArtifact._('linux', feature: flutterLinuxDesktopFeature);\n+\n+  /// Artifacts required for Fuchsia.\n+  static const fuchsia = DevelopmentArtifact._('fuchsia', feature: flutterFuchsiaFeature);\n+\n+  /// Artifacts required for the Flutter Runner.\n+  static const flutterRunner = DevelopmentArtifact._(\n+    'flutter_runner',\n+    feature: flutterFuchsiaFeature,\n+  );\n+\n+  /// Artifacts required for any development platform.\n+  ///\n+  /// This does not need to be explicitly returned from requiredArtifacts as\n+  /// it will always be downloaded.\n+  static const universal = DevelopmentArtifact._('universal');\n+\n+  /// Artifacts which contain build information for the flutter tool.\n+  static const informative = DevelopmentArtifact._('informative');\n+\n+  /// The values of DevelopmentArtifacts.\n+  static final values = <DevelopmentArtifact>[\n+    androidGenSnapshot,\n+    androidMaven,\n+    androidInternalBuild,\n+    iOS,\n+    web,\n+    macOS,\n+    windows,\n+    linux,\n+    fuchsia,\n+    universal,\n+    flutterRunner,\n+    informative,\n+  ];\n+\n+  @override\n+  String toString() => 'Artifact($name)';\n+}\n+\n+/// A wrapper around the `bin/cache/` directory.\n+///\n+/// This does not provide any artifacts by default. See [FlutterCache] for the default\n+/// artifact set.\n+///\n+/// ## Artifact mirrors\n+///\n+/// Some environments cannot reach the Google Cloud Storage buckets and CIPD due\n+/// to regional or corporate policies.\n+///\n+/// To enable Flutter users in these environments, the Flutter tool supports\n+/// custom artifact mirrors that the administrators of such environments may\n+/// provide. To use an artifact mirror, the user defines the [kFlutterStorageBaseUrl]\n+/// (`FLUTTER_STORAGE_BASE_URL`) environment variable that points to the mirror.\n+/// Flutter tool reads this variable and uses it instead of the default URLs.\n+///\n+/// For more details on specific URLs used to download artifacts, see\n+/// [storageBaseUrl] and [cipdBaseUrl].\n+class Cache {\n+  /// [rootOverride] is configurable for testing.\n+  /// [artifacts] is configurable for testing.\n+  Cache({\n+    @protected Directory? rootOverride,\n+    @protected List<ArtifactSet>? artifacts,\n+    required Logger logger,\n+    required FileSystem fileSystem,\n+    required Platform platform,\n+    required OperatingSystemUtils osUtils,\n+    Stdio? stdio,\n+  }) : _rootOverride = rootOverride,\n+       _logger = logger,\n+       _fileSystem = fileSystem,\n+       _platform = platform,\n+       _osUtils = osUtils,\n+       _net = Net(logger: logger, platform: platform),\n+       _fsUtils = FileSystemUtils(fileSystem: fileSystem, platform: platform),\n+       _artifacts = artifacts ?? <ArtifactSet>[];\n+\n+  /// Create a [Cache] for testing.\n+  ///\n+  /// Defaults to a memory file system, fake platform,\n+  /// buffer logger, and no accessible artifacts.\n+  /// By default, the root cache directory path is \"cache\".\n+  factory Cache.test({\n+    Directory? rootOverride,\n+    List<ArtifactSet>? artifacts,\n+    Logger? logger,\n+    FileSystem? fileSystem,\n+    Platform? platform,\n+    Stdio? stdio,\n+    required ProcessManager processManager,\n+    Abi? currentAbi,\n+  }) {\n+    if (rootOverride?.fileSystem != null &&\n+        fileSystem != null &&\n+        rootOverride!.fileSystem != fileSystem) {\n+      throw ArgumentError(\n+        'If rootOverride and fileSystem are both non-null, '\n+            'rootOverride.fileSystem must be the same as fileSystem.',\n+        'fileSystem',\n+      );\n+    }\n+    fileSystem ??= rootOverride?.fileSystem ?? MemoryFileSystem.test();\n+    platform ??= FakePlatform(environment: <String, String>{});\n+    logger ??= BufferLogger.test();\n+    return Cache(\n+      rootOverride: rootOverride ?? fileSystem.currentDirectory,\n+      artifacts: artifacts ?? <ArtifactSet>[],\n+      logger: logger,\n+      fileSystem: fileSystem,\n+      platform: platform,\n+      stdio: stdio,\n+      osUtils: OperatingSystemUtils(\n+        fileSystem: fileSystem,\n+        logger: logger,\n+        platform: platform,\n+        processManager: processManager,\n+        currentAbi: currentAbi,\n+      ),\n+    );\n+  }\n+\n+  final Logger _logger;\n+  final Platform _platform;\n+  final FileSystem _fileSystem;\n+  final OperatingSystemUtils _osUtils;\n+  final Directory? _rootOverride;\n+  final List<ArtifactSet> _artifacts;\n+  final Net _net;\n+  final FileSystemUtils _fsUtils;\n+\n+  @visibleForTesting\n+  @protected\n+  void registerArtifact(ArtifactSet artifactSet) {\n+    _artifacts.add(artifactSet);\n+  }\n+\n+  // Initialized by FlutterCommandRunner on startup.\n+  // Explore making this field lazy to catch non-initialized access.\n+  static String? flutterRoot;\n+\n+  /// Determine the absolute and normalized path for the root of the current\n+  /// Flutter checkout.\n+  ///\n+  /// This method has a series of fallbacks for determining the repo location. The\n+  /// first success will immediately return the root without further checks.\n+  ///\n+  /// The order of these tests is:\n+  ///   1. FLUTTER_ROOT environment variable contains the path.\n+  ///   2. Platform script is a data URI scheme, returning `../..` to support\n+  ///      tests run from `packages/flutter_tools`.\n+  ///   3. Platform script is package URI scheme, returning the grandgrandparent\n+  ///      directory of the package config file location from\n+  ///      `packages/flutter_tools/.dart_tool/package_config.json`.\n+  ///   4. Platform script file path is the snapshot path generated by `bin/flutter`,\n+  ///      returning the grandparent directory from `bin/cache`.\n+  ///   5. Platform script file name is the entrypoint in `packages/flutter_tools/bin/flutter_tools.dart`,\n+  ///      returning the 4th parent directory.\n+  ///   6. The current directory\n+  ///\n+  /// If an exception is thrown during any of these checks, an error message is\n+  /// printed and `.` is returned by default (6).\n+  static String defaultFlutterRoot({\n+    required Platform platform,\n+    required FileSystem fileSystem,\n+    required UserMessages userMessages,\n+  }) {\n+    String normalize(String path) {\n+      return fileSystem.path.normalize(fileSystem.path.absolute(path));\n+    }\n+\n+    if (platform.environment.containsKey(kFlutterRootEnvironmentVariableName)) {\n+      return normalize(platform.environment[kFlutterRootEnvironmentVariableName]!);\n+    }\n+    try {\n+      if (platform.script.scheme == 'data') {\n+        return normalize('../..'); // The tool is running as a test.\n+      }\n+      final String Function(String) dirname = fileSystem.path.dirname;\n+\n+      if (platform.script.scheme == 'package') {\n+        final String packageConfigPath = Uri.parse(\n+          platform.packageConfig!,\n+        ).toFilePath(windows: platform.isWindows);\n+        return normalize(dirname(dirname(dirname(dirname(packageConfigPath)))));\n+      }\n+\n+      if (platform.script.scheme == 'file') {\n+        final String script = platform.script.toFilePath(windows: platform.isWindows);\n+        if (fileSystem.path.basename(script) == kSnapshotFileName) {\n+          return normalize(dirname(dirname(fileSystem.path.dirname(script))));\n+        }\n+        if (fileSystem.path.basename(script) == kFlutterToolsScriptFileName) {\n+          return normalize(dirname(dirname(dirname(dirname(script)))));\n+        }\n+      }\n+    } on Exception catch (error) {\n+      // There is currently no logger attached since this is computed at startup.\n+      // ignore: avoid_print\n+      print(userMessages.runnerNoRoot('$error'));\n+    }\n+    return normalize('.');\n+  }\n+\n+  // Whether to cache artifacts for all platforms. Defaults to only caching\n+  // artifacts for the current platform.\n+  bool includeAllPlatforms = false;\n+\n+  // Names of artifacts which should be cached even if they would normally\n+  // be filtered out for the current platform.\n+  Set<String>? platformOverrideArtifacts;\n+\n+  // Whether to cache the unsigned mac binaries. Defaults to caching the signed binaries.\n+  bool useUnsignedMacBinaries = false;\n+\n+  // Whether the warning printed when a custom artifact URL is used is fatal.\n+  bool fatalStorageWarning = true;\n+\n+  static RandomAccessFile? _lock;\n+  static var _lockEnabled = true;\n+\n+  /// Turn off the [lock]/[releaseLock] mechanism.\n+  ///\n+  /// This is used by the tests since they run simultaneously and all in one\n+  /// process and so it would be a mess if they had to use the lock.\n+  @visibleForTesting\n+  static void disableLocking() {\n+    _lockEnabled = false;\n+  }\n+\n+  /// Turn on the [lock]/[releaseLock] mechanism.\n+  ///\n+  /// This is used by the tests.\n+  @visibleForTesting\n+  static void enableLocking() {\n+    _lockEnabled = true;\n+  }\n+\n+  /// Check if lock acquired, skipping FLUTTER_ALREADY_LOCKED reentrant checks.\n+  ///\n+  /// This is used by the tests.\n+  @visibleForTesting\n+  static bool isLocked() {\n+    return _lock != null;\n+  }\n+\n+  /// Lock the cache directory.\n+  ///\n+  /// This happens while required artifacts are updated\n+  /// (see [FlutterCommandRunner.runCommand]).\n+  ///\n+  /// This uses normal POSIX flock semantics.\n+  Future<void> lock() async {\n+    if (!_lockEnabled) {\n+      return;\n+    }\n+    assert(_lock == null);\n+    final File lockFile = _fileSystem.file(\n+      _fileSystem.path.join(flutterRoot!, 'bin', 'cache', 'lockfile'),\n+    );\n+    try {\n+      _lock = lockFile.openSync(mode: FileMode.write);\n+    } on FileSystemException catch (e) {\n+      _logger.printError('Failed to open or create the artifact cache lockfile: \"$e\"');\n+      _logger.printError('Please ensure you have permissions to create or open ${lockFile.path}');\n+      throwToolExit('Failed to open or create the lockfile');\n+    }\n+    var locked = false;\n+    var printed = false;\n+    while (!locked) {\n+      try {\n+        _lock!.lockSync();\n+        locked = true;\n+      } on FileSystemException {\n+        if (!printed) {\n+          _logger.printTrace(\n+            'Waiting to be able to obtain lock of Flutter binary artifacts directory: ${_lock!.path}',\n+          );\n+          // This needs to go to stderr to avoid cluttering up stdout if a\n+          // parent process is collecting stdout (e.g. when calling \"flutter\n+          // version --machine\"). It's not really a \"warning\" though, so print it\n+          // in grey. Also, make sure that it isn't counted as a warning for\n+          // Logger.warningsAreFatal.\n+          _logger.printWarning(\n+            'Waiting for another flutter command to release the startup lock...',\n+            color: TerminalColor.grey,\n+            fatal: false,\n+          );\n+          printed = true;\n+        }\n+        await Future<void>.delayed(const Duration(milliseconds: 50));\n+      }\n+    }\n+  }\n+\n+  /// Releases the lock.\n+  ///\n+  /// This happens automatically on startup (see [FlutterCommand.verifyThenRunCommand])\n+  /// after the command's required artifacts are updated.\n+  void releaseLock() {\n+    if (!_lockEnabled || _lock == null) {\n+      return;\n+    }\n+    _lock!.closeSync();\n+    _lock = null;\n+  }\n+\n+  /// Checks if the current process owns the lock for the cache directory at\n+  /// this very moment; throws a [StateError] if it doesn't.\n+  void checkLockAcquired() {\n+    if (_lockEnabled &&\n+        _lock == null &&\n+        _platform.environment['FLUTTER_ALREADY_LOCKED'] != 'true') {\n+      throw StateError(\n+        'The current process does not own the lock for the cache directory. This is a bug in Flutter CLI tools.',\n+      );\n+    }\n+  }\n+\n+  String get devToolsVersion {\n+    if (_devToolsVersion == null) {\n+      const devToolsDirPath = 'dart-sdk/bin/resources/devtools';\n+      final Directory devToolsDir = getCacheDir(devToolsDirPath, shouldCreate: false);\n+      if (!devToolsDir.existsSync()) {\n+        throw Exception('Could not find directory at ${devToolsDir.path}');\n+      }\n+      final versionFilePath = '${devToolsDir.path}/version.json';\n+      final File versionFile = _fileSystem.file(versionFilePath);\n+      if (!versionFile.existsSync()) {\n+        throw Exception('Could not find file at $versionFilePath');\n+      }\n+      final dynamic data = jsonDecode(versionFile.readAsStringSync());\n+      if (data is! Map<String, Object?>) {\n+        throw Exception(\n+          \"Expected object of type 'Map<String, Object?>' but got one of type '${data.runtimeType}'\",\n+        );\n+      }\n+      final Object? version = data['version'];\n+      if (version == null) {\n+        throw Exception('Could not parse DevTools version from $version');\n+      }\n+      if (version is! String) {\n+        throw Exception(\n+          \"Could not parse DevTools version. Expected object of type 'String', but got one of type '${version.runtimeType}'\",\n+        );\n+      }\n+      return _devToolsVersion = version;\n+    }\n+    return _devToolsVersion!;\n+  }\n+\n+  String? _devToolsVersion;\n+\n+  /// The current version of Dart used to build Flutter and run the tool.\n+  String get dartSdkVersion {\n+    if (_dartSdkVersion == null) {\n+      // Make the version string more customer-friendly.\n+      // Changes '2.1.0-dev.8.0.flutter-4312ae32' to '2.1.0 (build 2.1.0-dev.8.0 4312ae32)'\n+      final String justVersion = _platform.version.split(' ')[0];\n+      _dartSdkVersion = justVersion.replaceFirstMapped(RegExp(r'(\\d+\\.\\d+\\.\\d+)(.+)'), (\n+        Match match,\n+      ) {\n+        final String noFlutter = match[2]!.replaceAll('.flutter-', ' ');\n+        return '${match[1]} (build ${match[1]}$noFlutter)';\n+      });\n+    }\n+    return _dartSdkVersion!;\n+  }\n+\n+  String? _dartSdkVersion;\n+\n+  /// The current version of Dart used to build Flutter and run the tool.\n+  String get dartSdkBuild {\n+    if (_dartSdkBuild == null) {\n+      // Make the version string more customer-friendly.\n+      // Changes '2.1.0-dev.8.0.flutter-4312ae32' to '2.1.0 (build 2.1.0-dev.8.0 4312ae32)'\n+      final String justVersion = _platform.version.split(' ')[0];\n+      _dartSdkBuild = justVersion.replaceFirstMapped(RegExp(r'(\\d+\\.\\d+\\.\\d+)(.+)'), (Match match) {\n+        final String noFlutter = match[2]!.replaceAll('.flutter-', ' ');\n+        return '${match[1]}$noFlutter';\n+      });\n+    }\n+    return _dartSdkBuild!;\n+  }\n+\n+  String? _dartSdkBuild;\n+\n+  /// The current version of the Flutter engine the flutter tool will download.\n+  String get engineRevision {\n+    _engineRevision ??= getStampFor('engine');\n+    if (_engineRevision == null) {\n+      throwToolExit('Could not determine engine revision.');\n+    }\n+    return _engineRevision!;\n+  }\n+\n+  String? _engineRevision;\n+\n+  /// The \"realm\" for the storage URL.\n+  ///\n+  /// For production artifacts from Engine post-submit and release builds,\n+  /// this string will be empty, and the `storageBaseUrl` will be unmodified.\n+  /// When non-empty, this string will be appended to the `storageBaseUrl` after\n+  /// a '/'. For artifacts generated by Engine presubmits, the realm should be\n+  /// \"flutter_archives_v2\".\n+  String get storageRealm {\n+    _storageRealm ??= getRealmFor('engine');\n+    if (_storageRealm == null) {\n+      throwToolExit('Could not determine engine realm.');\n+    }\n+    return _storageRealm!;\n+  }\n+\n+  String? _storageRealm;\n+\n+  /// The base for URLs that store Flutter engine artifacts that are fetched\n+  /// during the installation of the Flutter SDK.\n+  ///\n+  /// By default the base URL is https://storage.googleapis.com. However, if\n+  /// `FLUTTER_STORAGE_BASE_URL` environment variable ([kFlutterStorageBaseUrl])\n+  /// is provided, the environment variable value is returned instead.\n+  ///\n+  /// See also:\n+  ///\n+  ///  * [cipdBaseUrl], which determines how CIPD artifacts are fetched.\n+  ///  * [Cache] class-level dartdocs that explain how artifact mirrors work.\n+  String get storageBaseUrl {\n+    String? overrideUrl = _platform.environment[kFlutterStorageBaseUrl];\n+    if (overrideUrl == null) {\n+      return storageRealm.isEmpty\n+          ? 'https://storage.googleapis.com'\n+          : 'https://storage.googleapis.com/$storageRealm';\n+    }\n+    // verify that this is a valid URI.\n+    overrideUrl = storageRealm.isEmpty ? overrideUrl : '$overrideUrl/$storageRealm';\n+    try {\n+      Uri.parse(overrideUrl);\n+    } on FormatException catch (err) {\n+      throwToolExit('\"$kFlutterStorageBaseUrl\" contains an invalid URL:\\n$err');\n+    }\n+    _maybeWarnAboutStorageOverride(overrideUrl);\n+    return overrideUrl;\n+  }\n+\n+  String get realmlessStorageBaseUrl {\n+    return storageRealm.isEmpty ? storageBaseUrl : storageBaseUrl.replaceAll('/$storageRealm', '');\n+  }\n+\n+  /// The base for URLs that store Flutter engine artifacts in CIPD.\n+  ///\n+  /// For some platforms, such as Web and Fuchsia, CIPD artifacts are fetched\n+  /// during the installation of the Flutter SDK, in addition to those fetched\n+  /// from [storageBaseUrl].\n+  ///\n+  /// By default the base URL is https://chrome-infra-packages.appspot.com/dl.\n+  /// However, if `FLUTTER_STORAGE_BASE_URL` environment variable is provided\n+  /// ([kFlutterStorageBaseUrl]), then the following value is used:\n+  ///\n+  ///     FLUTTER_STORAGE_BASE_URL/flutter_infra_release/cipd\n+  ///\n+  /// See also:\n+  ///\n+  ///  * [storageBaseUrl], which determines how engine artifacts stored in the\n+  ///    Google Cloud Storage buckets are fetched.\n+  ///  * https://chromium.googlesource.com/infra/luci/luci-go/+/refs/heads/main/cipd,\n+  ///    which contains information about CIPD.\n+  ///  * [Cache] class-level dartdocs that explain how artifact mirrors work.\n+  String get cipdBaseUrl {\n+    final String? overrideUrl = _platform.environment[kFlutterStorageBaseUrl];\n+    if (overrideUrl == null) {\n+      return 'https://chrome-infra-packages.appspot.com/dl';\n+    }\n+\n+    final Uri original;\n+    try {\n+      original = Uri.parse(overrideUrl);\n+    } on FormatException catch (err) {\n+      throwToolExit('\"$kFlutterStorageBaseUrl\" contains an invalid URL:\\n$err');\n+    }\n+\n+    final cipdOverride = original\n+        .replace(pathSegments: <String>[...original.pathSegments, 'flutter_infra_release', 'cipd'])\n+        .toString();\n+    return cipdOverride;\n+  }\n+\n+  var _hasWarnedAboutStorageOverride = false;\n+\n+  void _maybeWarnAboutStorageOverride(String overrideUrl) {\n+    if (_hasWarnedAboutStorageOverride) {\n+      return;\n+    }\n+    _logger.printWarning(\n+      'Flutter assets will be downloaded from $overrideUrl. Make sure you trust this source!',\n+      emphasis: true,\n+      fatal: false,\n+    );\n+    _hasWarnedAboutStorageOverride = true;\n+  }\n+\n+  /// Return the top-level directory in the cache; this is `bin/cache`.\n+  Directory getRoot() {\n+    return _fileSystem.directory(\n+      _fileSystem.path.join(_rootOverride?.path ?? flutterRoot!, 'bin', 'cache'),\n+    );\n+  }\n+\n+  String getHostPlatformArchName() {\n+    return _osUtils.hostPlatform.platformName;\n+  }\n+\n+  /// Return a directory in the cache dir. For `pkg`, this will return `bin/cache/pkg`.\n+  ///\n+  /// When [shouldCreate] is true, the cache directory at [name] will be created\n+  /// if it does not already exist.\n+  Directory getCacheDir(String name, {bool shouldCreate = true}) {\n+    final Directory dir = _fileSystem.directory(_fileSystem.path.join(getRoot().path, name));\n+    if (!dir.existsSync() && shouldCreate) {\n+      throwToolExit('Flutter受控SDK缺少已准备目录：$name，请先完成工具库准备。');\n+    }\n+    return dir;\n+  }\n+\n+  /// Return the top-level directory for artifact downloads.\n+  Directory getDownloadDir() => getCacheDir('downloads');\n+\n+  /// Return the top-level mutable directory in the cache; this is `bin/cache/artifacts`.\n+  Directory getCacheArtifacts() => getCacheDir('artifacts');\n+\n+  /// Location of LICENSE file.\n+  File getLicenseFile() => _fileSystem.file(_fileSystem.path.join(flutterRoot!, 'LICENSE'));\n+\n+  /// Get a named directory from with the cache's artifact directory; for example,\n+  /// `material_fonts` would return `bin/cache/artifacts/material_fonts`.\n+  Directory getArtifactDirectory(String name) {\n+    return getCacheArtifacts().childDirectory(name);\n+  }\n+\n+  MapEntry<String, String> get dyLdLibEntry {\n+    if (_dyLdLibEntry != null) {\n+      return _dyLdLibEntry!;\n+    }\n+    final paths = <String>[];\n+    for (final ArtifactSet artifact in _artifacts) {\n+      final Map<String, String> env = artifact.environment;\n+      if (!env.containsKey('DYLD_LIBRARY_PATH')) {\n+        continue;\n+      }\n+      final String path = env['DYLD_LIBRARY_PATH']!;\n+      if (path.isEmpty) {\n+        continue;\n+      }\n+      paths.add(path);\n+    }\n+    _dyLdLibEntry = MapEntry<String, String>('DYLD_LIBRARY_PATH', paths.join(':'));\n+    return _dyLdLibEntry!;\n+  }\n+\n+  MapEntry<String, String>? _dyLdLibEntry;\n+\n+  /// The web sdk has to be co-located with the dart-sdk so that they can share source\n+  /// code.\n+  Directory getWebSdkDirectory() {\n+    return getRoot().childDirectory('flutter_web_sdk');\n+  }\n+\n+  String? getVersionFor(String artifactName) {\n+    final File versionFile = _fileSystem.file(\n+      _fileSystem.path.join(\n+        _rootOverride?.path ?? flutterRoot!,\n+        'bin',\n+        'internal',\n+        '$artifactName.version',\n+      ),\n+    );\n+    return versionFile.existsSync() ? versionFile.readAsStringSync().trim() : null;\n+  }\n+\n+  // TODO(matanlurey): Remove the ability to do \"generic\" realms, and special case for engine.\n+  // https://github.com/flutter/flutter/issues/164315\n+  String? getRealmFor(String artifactName) {\n+    final File realmFile = _fileSystem.file(\n+      _fileSystem.path.join(\n+        _rootOverride?.path ?? flutterRoot!,\n+        'bin',\n+        'cache',\n+        '$artifactName.realm',\n+      ),\n+    );\n+    return realmFile.existsSync() ? realmFile.readAsStringSync().trim() : '';\n+  }\n+\n+  /// Delete all stamp files maintained by the cache.\n+  void clearStampFiles() {\n+    try {\n+      getStampFileFor('flutter_tools').deleteSync();\n+      for (final ArtifactSet artifact in _artifacts) {\n+        final File file = getStampFileFor(artifact.stampName);\n+        ErrorHandlingFileSystem.deleteIfExists(file);\n+      }\n+    } on FileSystemException catch (err) {\n+      _logger.printWarning('Failed to delete some stamp files: $err');\n+    }\n+  }\n+\n+  /// Read the stamp for [artifactName].\n+  ///\n+  /// If the file is missing or cannot be parsed, returns `null`.\n+  String? getStampFor(String artifactName) {\n+    final File stampFile = getStampFileFor(artifactName);\n+    if (!stampFile.existsSync()) {\n+      return null;\n+    }\n+    try {\n+      return stampFile.readAsStringSync().trim();\n+    } on FileSystemException {\n+      return null;\n+    }\n+  }\n+\n+  void setStampFor(String artifactName, String version) {\n+    getStampFileFor(artifactName).writeAsStringSync(version);\n+  }\n+\n+  File getStampFileFor(String artifactName) {\n+    return _fileSystem.file(_fileSystem.path.join(getRoot().path, '$artifactName.stamp'));\n+  }\n+\n+  /// Returns `true` if either [entity] is older than the tools stamp or if\n+  /// [entity] doesn't exist.\n+  bool isOlderThanToolsStamp(FileSystemEntity entity) {\n+    final File flutterToolsStamp = getStampFileFor('flutter_tools');\n+    return _fsUtils.isOlderThanReference(entity: entity, referenceFile: flutterToolsStamp);\n+  }\n+\n+  Future<bool> isUpToDate() async {\n+    for (final ArtifactSet artifact in _artifacts) {\n+      if (!await artifact.isUpToDate(_fileSystem)) {\n+        return false;\n+      }\n+    }\n+    return true;\n+  }\n+\n+  /// Returns the list of artifacts that need updating from [requiredArtifacts].\n+  Future<List<ArtifactSet>> _collectArtifactsToUpdate(\n+    Set<DevelopmentArtifact> requiredArtifacts,\n+  ) async {\n+    final artifactsToUpdate = <ArtifactSet>[];\n+    final isLocalEngine = context.get<Artifacts>()?.localEngineInfo != null;\n+\n+    for (final ArtifactSet artifact in _artifacts) {\n+      if (!requiredArtifacts.contains(artifact.developmentArtifact)) {\n+        _logger.printTrace('Artifact $artifact is not required, skipping update.');\n+        continue;\n+      }\n+      if (isLocalEngine && (artifact is EngineCachedArtifact || artifact.name == 'engine_stamp')) {\n+        _logger.printTrace(\n+          'Artifact $artifact is an engine artifact or stamp and local engine is provided, skipping update.',\n+        );\n+        continue;\n+      }\n+      if (await artifact.isUpToDate(_fileSystem)) {\n+        continue;\n+      }\n+      artifactsToUpdate.add(artifact);\n+    }\n+    return artifactsToUpdate;\n+  }\n+\n+  /// Update the cache to contain all `requiredArtifacts`.\n+  Future<void> updateAll(Set<DevelopmentArtifact> requiredArtifacts, {bool offline = false}) async {\n+    if (!_lockEnabled) {\n+      return;\n+    }\n+\n+    final List<ArtifactSet> artifactsToUpdate = await _collectArtifactsToUpdate(requiredArtifacts);\n+\n+    if (artifactsToUpdate.isEmpty) {\n+      return;\n+    }\n+\n+    // 缺失资源明确失败；产品不得下载或更新其他任务正在读取的共享原件。\n+    throwToolExit(\n+      'Flutter受控SDK缺少已准备资源：${artifactsToUpdate.map((artifact) => artifact.name).join(', ')}。',\n+    );\n+  }\n+\n+  Future<bool> areRemoteArtifactsAvailable({\n+    String? engineVersion,\n+    bool includeAllPlatforms = true,\n+  }) async {\n+    final bool includeAllPlatformsState = this.includeAllPlatforms;\n+    var allAvailable = true;\n+    this.includeAllPlatforms = includeAllPlatforms;\n+    for (final ArtifactSet cachedArtifact in _artifacts) {\n+      if (cachedArtifact is EngineCachedArtifact) {\n+        allAvailable &= await cachedArtifact.checkForArtifacts(engineVersion);\n+      }\n+    }\n+    this.includeAllPlatforms = includeAllPlatformsState;\n+    return allAvailable;\n+  }\n+\n+  Future<bool> doesRemoteExist(String message, Uri url) async {\n+    final Status status = _logger.startProgress(message);\n+    bool exists;\n+    try {\n+      exists = await _net.doesRemoteFileExist(url);\n+    } finally {\n+      status.stop();\n+    }\n+    return exists;\n+  }\n+}\n+\n+/// Representation of a set of artifacts used by the tool.\n+abstract class ArtifactSet {\n+  ArtifactSet(this.developmentArtifact);\n+\n+  /// The development artifact.\n+  final DevelopmentArtifact developmentArtifact;\n+\n+  /// Whether the artifact is up to date.\n+  Future<bool> isUpToDate(FileSystem fileSystem);\n+\n+  /// The environment variables (if any) required to consume the artifacts.\n+  Map<String, String> get environment {\n+    return const <String, String>{};\n+  }\n+\n+  /// Updates the artifact.\n+  Future<void> update(\n+    ArtifactUpdater artifactUpdater,\n+    Logger logger,\n+    FileSystem fileSystem,\n+    OperatingSystemUtils operatingSystemUtils, {\n+    bool offline = false,\n+  });\n+\n+  /// The canonical name of the artifact.\n+  String get name;\n+\n+  /// A prettier display name.\n+  ///\n+  /// Defaults to the canonical name.\n+  String get displayName => name;\n+\n+  /// The name of the stamp file.\n+  ///\n+  /// Defaults to the same as the artifact name.\n+  String get stampName => name;\n+\n+  /// The number of individual downloads this artifact will perform.\n+  ///\n+  /// Defaults to 1.\n+  int get downloadCount => 1;\n+}\n+\n+/// An artifact set managed by the cache.\n+abstract class CachedArtifact extends ArtifactSet {\n+  CachedArtifact(this.name, this.cache, DevelopmentArtifact developmentArtifact)\n+    : super(developmentArtifact);\n+\n+  final Cache cache;\n+\n+  @override\n+  final String name;\n+\n+  @override\n+  String get stampName => name;\n+\n+  Directory get location => cache.getArtifactDirectory(name);\n+\n+  String? get version => cache.getVersionFor(name);\n+\n+  // Whether or not to bypass normal platform filtering for this artifact.\n+  bool get ignorePlatformFiltering {\n+    return cache.includeAllPlatforms ||\n+        (cache.platformOverrideArtifacts != null &&\n+            cache.platformOverrideArtifacts!.contains(developmentArtifact.name));\n+  }\n+\n+  @override\n+  Future<bool> isUpToDate(FileSystem fileSystem) async {\n+    if (!location.existsSync()) {\n+      return false;\n+    }\n+    if (version != cache.getStampFor(stampName)) {\n+      return false;\n+    }\n+    return isUpToDateInner(fileSystem);\n+  }\n+\n+  @override\n+  Future<void> update(\n+    ArtifactUpdater artifactUpdater,\n+    Logger logger,\n+    FileSystem fileSystem,\n+    OperatingSystemUtils operatingSystemUtils, {\n+    bool offline = false,\n+  }) async {\n+    throwToolExit('Flutter受控SDK资源只能在工具库准备阶段更新：$name。');\n+  }\n+\n+  /// Hook method for extra checks for being up-to-date.\n+  bool isUpToDateInner(FileSystem fileSystem) => true;\n+\n+  Future<void> updateInner(\n+    ArtifactUpdater artifactUpdater,\n+    FileSystem fileSystem,\n+    OperatingSystemUtils operatingSystemUtils,\n+  );\n+}\n+\n+abstract class EngineCachedArtifact extends CachedArtifact {\n+  EngineCachedArtifact(this.stampName, Cache cache, DevelopmentArtifact developmentArtifact)\n+    : super('engine', cache, developmentArtifact);\n+\n+  @override\n+  final String stampName;\n+\n+  @override\n+  String? get version => cache.engineRevision;\n+\n+  @override\n+  int get downloadCount => getPackageDirs().length + getBinaryDirs().length;\n+\n+  /// Return a list of (directory path, download URL path) tuples.\n+  List<List<String>> getBinaryDirs();\n+\n+  /// A list of cache directory paths to which the LICENSE file should be copied.\n+  List<String> getLicenseDirs();\n+\n+  /// A list of the dart package directories to download.\n+  List<String> getPackageDirs();\n+\n+  @override\n+  bool isUpToDateInner(FileSystem fileSystem) {\n+    final Directory pkgDir = cache.getCacheDir('pkg');\n+    for (final String pkgName in getPackageDirs()) {\n+      final String pkgPath = fileSystem.path.join(pkgDir.path, pkgName);\n+      if (!fileSystem.directory(pkgPath).existsSync()) {\n+        return false;\n+      }\n+    }\n+\n+    for (final List<String> toolsDir in getBinaryDirs()) {\n+      final Directory dir = fileSystem.directory(fileSystem.path.join(location.path, toolsDir[0]));\n+      if (!dir.existsSync()) {\n+        return false;\n+      }\n+    }\n+\n+    for (final String licenseDir in getLicenseDirs()) {\n+      final File file = fileSystem.file(fileSystem.path.join(location.path, licenseDir, 'LICENSE'));\n+      if (!file.existsSync()) {\n+        return false;\n+      }\n+    }\n+    return true;\n+  }\n+\n+  @override\n+  Future<void> updateInner(\n+    ArtifactUpdater artifactUpdater,\n+    FileSystem fileSystem,\n+    OperatingSystemUtils operatingSystemUtils,\n+  ) async {\n+    final url = '${cache.storageBaseUrl}/flutter_infra_release/flutter/$version/';\n+\n+    final Directory pkgDir = cache.getCacheDir('pkg');\n+    for (final String pkgName in getPackageDirs()) {\n+      await artifactUpdater.downloadZipArchive(pkgName, Uri.parse('$url$pkgName.zip'), pkgDir);\n+    }\n+\n+    for (final List<String> toolsDir in getBinaryDirs()) {\n+      final String cacheDir = toolsDir[0];\n+      final String urlPath = toolsDir[1];\n+      final Directory dir = fileSystem.directory(fileSystem.path.join(location.path, cacheDir));\n+\n+      final String friendlyName = urlPath.replaceAll('/artifacts.zip', '').replaceAll('.zip', '');\n+      await artifactUpdater.downloadZipArchive(friendlyName, Uri.parse(url + urlPath), dir);\n+\n+      _makeFilesExecutable(dir, operatingSystemUtils);\n+    }\n+\n+    final File licenseSource = cache.getLicenseFile();\n+    for (final String licenseDir in getLicenseDirs()) {\n+      final String licenseDestinationPath = fileSystem.path.join(\n+        location.path,\n+        licenseDir,\n+        'LICENSE',\n+      );\n+      await licenseSource.copy(licenseDestinationPath);\n+    }\n+  }\n+\n+  Future<bool> checkForArtifacts(String? engineVersion) async {\n+    engineVersion ??= version;\n+    final url = '${cache.storageBaseUrl}/flutter_infra_release/flutter/$engineVersion/';\n+\n+    var exists = false;\n+    for (final String pkgName in getPackageDirs()) {\n+      exists = await cache.doesRemoteExist(\n+        'Checking package $pkgName is available...',\n+        Uri.parse('$url$pkgName.zip'),\n+      );\n+      if (!exists) {\n+        return false;\n+      }\n+    }\n+\n+    for (final List<String> toolsDir in getBinaryDirs()) {\n+      final String cacheDir = toolsDir[0];\n+      final String urlPath = toolsDir[1];\n+      exists = await cache.doesRemoteExist(\n+        'Checking $cacheDir tools are available...',\n+        Uri.parse(url + urlPath),\n+      );\n+      if (!exists) {\n+        return false;\n+      }\n+    }\n+    return true;\n+  }\n+\n+  void _makeFilesExecutable(Directory dir, OperatingSystemUtils operatingSystemUtils) {\n+    operatingSystemUtils.chmod(dir, 'a+r,a+x');\n+    for (final File file in dir.listSync(recursive: true).whereType<File>()) {\n+      final FileStat stat = file.statSync();\n+      final isUserExecutable = ((stat.mode >> 6) & 0x1) == 1;\n+      if (file.basename == 'flutter_tester' || isUserExecutable) {\n+        // Make the file readable and executable by all users.\n+        operatingSystemUtils.chmod(file, 'a+r,a+x');\n+      }\n+    }\n+  }\n+}\n+\n+/// An API for downloading and un-archiving artifacts, such as engine binaries or\n+/// additional source code.\n+class ArtifactUpdater {\n+  ArtifactUpdater({\n+    required OperatingSystemUtils operatingSystemUtils,\n+    required Logger logger,\n+    required FileSystem fileSystem,\n+    required Directory tempStorage,\n+    required HttpClient httpClient,\n+    required Platform platform,\n+    required List<String> allowedBaseUrls,\n+    Stdio? stdio,\n+  }) : _operatingSystemUtils = operatingSystemUtils,\n+       _httpClient = httpClient,\n+       _logger = logger,\n+       _fileSystem = fileSystem,\n+       _tempStorage = tempStorage,\n+       _platform = platform,\n+       _allowedBaseUrls = allowedBaseUrls,\n+       _stdio = stdio;\n+\n+  /// The number of times the artifact updater will repeat the artifact download loop.\n+  static const _kRetryCount = 2;\n+\n+  final Logger _logger;\n+  final OperatingSystemUtils _operatingSystemUtils;\n+  final FileSystem _fileSystem;\n+  final Directory _tempStorage;\n+  final HttpClient _httpClient;\n+  final Platform _platform;\n+\n+  /// Artifacts should only be downloaded from URLs that use one of these\n+  /// prefixes.\n+  ///\n+  /// [ArtifactUpdater] will issue a warning if an attempt to download from a\n+  /// non-compliant URL is made.\n+  final List<String> _allowedBaseUrls;\n+\n+  final Stdio? _stdio;\n+\n+  /// Keep track of the files we've downloaded for this execution so we\n+  /// can delete them after completion. We don't delete them right after\n+  /// extraction in case [ArtifactSet.update] is interrupted, so we can\n+  /// restart without starting from scratch.\n+  @visibleForTesting\n+  final downloadedFiles = <File>[];\n+\n+  // Progress tracking state for download output formatting.\n+  int _artifactIndex = 0;\n+  int _artifactTotal = 0;\n+  int _downloadIndex = 0;\n+  int _downloadTotal = 0;\n+\n+  /// Sets the progress context for artifact downloads.\n+  ///\n+  /// This is called before each artifact update to enable progress output.\n+  /// The [downloadIndex] can be used to set the current download index\n+  /// within an artifact (1-based).\n+  void setProgressContext({\n+    required int artifactIndex,\n+    required int artifactTotal,\n+    required int downloadTotal,\n+    int downloadIndex = 0,\n+  }) {\n+    _artifactIndex = artifactIndex;\n+    _artifactTotal = artifactTotal;\n+    _downloadIndex = downloadIndex;\n+    _downloadTotal = downloadTotal;\n+  }\n+\n+  void resetProgressContext() {\n+    _artifactIndex = 0;\n+    _artifactTotal = 0;\n+    _downloadIndex = 0;\n+    _downloadTotal = 0;\n+  }\n+\n+  /// Creates the appropriate display for the current terminal capabilities.\n+  _DownloadDisplay _createDisplay(String statusMessage) {\n+    if (_stdio != null && _logger.supportsColor) {\n+      return _ProgressBarDisplay(stdio: _stdio, statusMessage: statusMessage);\n+    }\n+    return _SpinnerDisplay(logger: _logger, statusMessage: statusMessage);\n+  }\n+\n+  /// These filenames, should they exist after extracting an archive, should be deleted.\n+  static const _denylistedBasenames = <String>{\n+    'entitlements.txt',\n+    'without_entitlements.txt',\n+    'unsigned_binaries.txt',\n+  };\n+  void _removeDenylistedFiles(Directory directory) {\n+    for (final FileSystemEntity entity in directory.listSync(recursive: true)) {\n+      if (entity is! File) {\n+        continue;\n+      }\n+      if (_denylistedBasenames.contains(entity.basename)) {\n+        entity.deleteSync();\n+      }\n+    }\n+  }\n+\n+  /// Download a zip archive from the given [url] and unzip it to [location].\n+  Future<void> downloadZipArchive(String artifactName, Uri url, Directory location) {\n+    return _downloadArchive(artifactName, url, location, _operatingSystemUtils.unzip);\n+  }\n+\n+  /// Download a gzipped tarball from the given [url] and unpack it to [location].\n+  Future<void> downloadZippedTarball(String artifactName, Uri url, Directory location) {\n+    return _downloadArchive(artifactName, url, location, _operatingSystemUtils.unpack);\n+  }\n+\n+  /// Download a file from the given [url] and copy it to [location].\n+  Future<void> downloadFile(String artifactName, Uri url, Directory location) {\n+    return _downloadArchive(artifactName, url, location, (File file, Directory dir) {\n+      file.copySync(dir.childFile(file.basename).path);\n+    });\n+  }\n+\n+  /// Formats a download message with progress context.\n+  @visibleForTesting\n+  String formatProgressMessage(String artifactName) {\n+    final int displayIndex = _downloadIndex + 1;\n+    if (_downloadTotal == 1) {\n+      return '[$_artifactIndex/$_artifactTotal] $artifactName';\n+    } else {\n+      final prefix = displayIndex == _downloadTotal ? '└─' : '├─';\n+      return '  $prefix [$displayIndex/$_downloadTotal] $artifactName';\n+    }\n+  }\n+\n+  /// Download an archive from the given [url] and unzip it to [location].\n+  Future<void> _downloadArchive(\n+    String artifactName,\n+    Uri url,\n+    Directory location,\n+    void Function(File, Directory) extractor,\n+  ) async {\n+    final String downloadPath = flattenNameSubdirs(url, _fileSystem);\n+    final File tempFile = _createDownloadFile(downloadPath);\n+    int retries = _kRetryCount;\n+    final String formattedMessage = formatProgressMessage(artifactName);\n+    _downloadIndex++;\n+\n+    while (retries > 0) {\n+      final _DownloadDisplay display = _createDisplay(formattedMessage);\n+      display.start();\n+\n+      try {\n+        _ensureExists(tempFile.parent);\n+        if (tempFile.existsSync()) {\n+          tempFile.deleteSync();\n+        }\n+        await _download(url, tempFile, display);\n+\n+        if (!tempFile.existsSync()) {\n+          throw Exception('Did not find downloaded file ${tempFile.path}');\n+        }\n+        display.finish();\n+      } on Exception catch (err) {\n+        display.cancel();\n+        _logger.printTrace(err.toString());\n+        retries -= 1;\n+        if (retries == 0) {\n+          throwToolExit(\n+            'Failed to download $url. Ensure you have network connectivity and then try again.\\n$err',\n+          );\n+        }\n+        continue;\n+      } on ArgumentError catch (error) {\n+        display.cancel();\n+        final String? overrideUrl = _platform.environment[kFlutterStorageBaseUrl];\n+        if (overrideUrl != null && url.toString().contains(overrideUrl)) {\n+          _logger.printError(error.toString());\n+          throwToolExit(\n+            'The value of $kFlutterStorageBaseUrl ($overrideUrl) could not be '\n+            'parsed as a valid url. Please see https://flutter.dev/to/use-mirror-site '\n+            'for an example of how to use it.\\n'\n+            'Full URL: $url',\n+            exitCode: kNetworkProblemExitCode,\n+          );\n+        }\n+        // This error should not be hit if there was not a storage URL override, allow the\n+        // tool to crash.\n+        rethrow;\n+      }\n+\n+      /// Unzipping multiple file into a directory will not remove old files\n+      /// from previous versions that are not present in the new bundle.\n+      final Directory destination = location.childDirectory(\n+        tempFile.fileSystem.path.basenameWithoutExtension(tempFile.path),\n+      );\n+      try {\n+        ErrorHandlingFileSystem.deleteIfExists(destination, recursive: true);\n+      } on FileSystemException catch (error) {\n+        // Error that indicates another program has this file open and that it\n+        // cannot be deleted. For the cache, this is either the analyzer reading\n+        // the sky_engine package or a running flutter_tester device.\n+        const kSharingViolation = 32;\n+        if (_platform.isWindows && error.osError?.errorCode == kSharingViolation) {\n+          throwToolExit(\n+            'Failed to delete ${destination.path} because the local file/directory is in use '\n+            'by another process. Try closing any running IDEs or editors and trying '\n+            'again',\n+          );\n+        }\n+      }\n+      _ensureExists(location);\n+\n+      try {\n+        extractor(tempFile, location);\n+      } on Exception catch (err) {\n+        retries -= 1;\n+        if (retries == 0) {\n+          throwToolExit(\n+            'Flutter could not download and/or extract $url. Ensure you have '\n+            'network connectivity and all of the required dependencies listed at '\n+            'https://flutter.dev/setup.\\nThe original exception was: $err.',\n+          );\n+        }\n+        _deleteIgnoringErrors(tempFile);\n+        continue;\n+      }\n+      _removeDenylistedFiles(location);\n+      return;\n+    }\n+  }\n+\n+  /// Download bytes from [url], throwing non-200 responses as an exception.\n+  ///\n+  /// Validates that the md5 of the content bytes matches the provided\n+  /// `x-goog-hash` header, if present. This header should contain an md5 hash\n+  /// if the download source is Google cloud storage.\n+  ///\n+  /// See also:\n+  ///   * https://cloud.google.com/storage/docs/xml-api/reference-headers#xgooghash\n+  Future<void> _download(Uri url, File file, _DownloadDisplay display) async {\n+    final bool isAllowedUrl = _allowedBaseUrls.any(\n+      (String baseUrl) => url.toString().startsWith(baseUrl),\n+    );\n+\n+    // In tests make this a hard failure.\n+    assert(\n+      isAllowedUrl,\n+      'URL not allowed: $url\\n'\n+      'Allowed URLs must be based on one of: ${_allowedBaseUrls.join(', ')}',\n+    );\n+\n+    // In production, issue a warning but allow the download to proceed.\n+    if (!isAllowedUrl) {\n+      display.pause();\n+      _logger.printWarning(\n+        'Downloading an artifact that may not be reachable in some environments (e.g. firewalled environments): $url\\n'\n+        'This should not have happened. This is likely a Flutter SDK bug. Please file an issue at https://github.com/flutter/flutter/issues/new?template=01_activation.yml',\n+      );\n+      display.resume();\n+    }\n+\n+    final HttpClientRequest request = await _httpClient.getUrl(url);\n+    final HttpClientResponse response = await request.close();\n+    if (response.statusCode != HttpStatus.ok) {\n+      throw Exception(response.statusCode);\n+    }\n+\n+    final String? md5Hash = _expectedMd5(response.headers);\n+    ByteConversionSink? inputSink;\n+    late StreamController<Digest> digests;\n+    if (md5Hash != null) {\n+      _logger.printTrace('Content $url md5 hash: $md5Hash');\n+      digests = StreamController<Digest>();\n+      inputSink = md5.startChunkedConversion(digests);\n+    }\n+    final int contentLength = response.contentLength;\n+    final RandomAccessFile randomAccessFile = file.openSync(mode: FileMode.writeOnly);\n+    await response.forEach((List<int> chunk) {\n+      inputSink?.add(chunk);\n+      randomAccessFile.writeFromSync(chunk);\n+      display.onChunk(chunk.length, contentLength);\n+    });\n+    randomAccessFile.closeSync();\n+    if (inputSink != null) {\n+      inputSink.close();\n+      final Digest digest = await digests.stream.last;\n+      final String rawDigest = base64.encode(digest.bytes);\n+      if (rawDigest != md5Hash) {\n+        throw Exception(\n+          'Expected $url to have md5 checksum $md5Hash, but was $rawDigest. This '\n+          'may indicate a problem with your connection to the Flutter backend servers. '\n+          'Please re-try the download after confirming that your network connection is '\n+          'stable.',\n+        );\n+      }\n+    }\n+  }\n+\n+  String? _expectedMd5(HttpHeaders httpHeaders) {\n+    final List<String>? values = httpHeaders['x-goog-hash'];\n+    if (values == null) {\n+      return null;\n+    }\n+    String? rawMd5Hash;\n+    for (final String value in values) {\n+      if (value.startsWith('md5=')) {\n+        rawMd5Hash = value;\n+        break;\n+      }\n+    }\n+    if (rawMd5Hash == null) {\n+      return null;\n+    }\n+    final List<String> segments = rawMd5Hash.split('md5=');\n+    if (segments.length < 2) {\n+      return null;\n+    }\n+    final String md5Hash = segments[1];\n+    if (md5Hash.isEmpty) {\n+      return null;\n+    }\n+    return md5Hash;\n+  }\n+\n+  /// Create a temporary file and add it to the [downloadedFiles].\n+  File _createDownloadFile(String name) {\n+    final File tempFile = _fileSystem.file(_fileSystem.path.join(_tempStorage.path, name));\n+    downloadedFiles.add(tempFile);\n+    return tempFile;\n+  }\n+\n+  /// Create the given [directory] and parents, as necessary.\n+  void _ensureExists(Directory directory) {\n+    if (!directory.existsSync()) {\n+      directory.createSync(recursive: true);\n+    }\n+  }\n+\n+  /// Clear any zip/gzip files downloaded.\n+  void removeDownloadedFiles() {\n+    for (final File file in downloadedFiles) {\n+      if (!file.existsSync()) {\n+        continue;\n+      }\n+      try {\n+        file.deleteSync();\n+      } on FileSystemException catch (e) {\n+        _logger.printWarning('Failed to delete \"${file.path}\". Please delete manually. $e');\n+        continue;\n+      }\n+      for (\n+        Directory directory = file.parent;\n+        directory.absolute.path != _tempStorage.absolute.path;\n+        directory = directory.parent\n+      ) {\n+        // Handle race condition when the directory is deleted before this step\n+        if (!directory.existsSync()) {\n+          break;\n+        }\n+        if (directory.listSync().isNotEmpty) {\n+          break;\n+        }\n+        _deleteIgnoringErrors(directory);\n+      }\n+    }\n+  }\n+\n+  static void _deleteIgnoringErrors(FileSystemEntity entity) {\n+    if (!entity.existsSync()) {\n+      return;\n+    }\n+    try {\n+      entity.deleteSync();\n+    } on FileSystemException {\n+      // Ignore errors.\n+    }\n+  }\n+}\n+\n+@visibleForTesting\n+String flattenNameSubdirs(Uri url, FileSystem fileSystem) {\n+  final pieces = <String>[url.host, ...url.pathSegments];\n+  final Iterable<String> convertedPieces = pieces.map<String>(_flattenNameNoSubdirs);\n+  return fileSystem.path.joinAll(convertedPieces);\n+}\n+\n+/// Given a name containing slashes, colons, and backslashes, expand it into\n+/// something that doesn't.\n+String _flattenNameNoSubdirs(String fileName) {\n+  final replacedCodeUnits = <int>[\n+    for (final int codeUnit in fileName.codeUnits)\n+      ..._flattenNameSubstitutions[codeUnit] ?? <int>[codeUnit],\n+  ];\n+  return String.fromCharCodes(replacedCodeUnits);\n+}\n+\n+// Many characters are problematic in filenames, especially on Windows.\n+final _flattenNameSubstitutions = <int, List<int>>{\n+  r'@'.codeUnitAt(0): '@@'.codeUnits,\n+  r'/'.codeUnitAt(0): '@s@'.codeUnits,\n+  r'\\'.codeUnitAt(0): '@bs@'.codeUnits,\n+  r':'.codeUnitAt(0): '@c@'.codeUnits,\n+  r'%'.codeUnitAt(0): '@per@'.codeUnits,\n+  r'*'.codeUnitAt(0): '@ast@'.codeUnits,\n+  r'<'.codeUnitAt(0): '@lt@'.codeUnits,\n+  r'>'.codeUnitAt(0): '@gt@'.codeUnits,\n+  r'\"'.codeUnitAt(0): '@q@'.codeUnits,\n+  r'|'.codeUnitAt(0): '@pip@'.codeUnits,\n+  r'?'.codeUnitAt(0): '@ques@'.codeUnits,\n+};\n+\n+/// Abstraction for displaying download progress.\n+///\n+/// Two implementations exist:\n+/// - [_ProgressBarDisplay]: ANSI progress bar for terminals with color support.\n+/// - [_SpinnerDisplay]: Spinner-based display via [Logger.startProgress].\n+abstract class _DownloadDisplay {\n+  /// Called when the download begins.\n+  void start();\n+\n+  /// Called when a chunk of data is received.\n+  void onChunk(int chunkSize, int contentLength);\n+\n+  /// Called when the download completes successfully.\n+  void finish();\n+\n+  /// Called when the download is cancelled or fails.\n+  void cancel();\n+\n+  /// Pauses the display (e.g. when another status message needs the terminal).\n+  void pause();\n+\n+  /// Resumes the display after a pause.\n+  void resume();\n+}\n+\n+/// Displays an ANSI progress bar with speed, ETA, and percentage.\n+class _ProgressBarDisplay extends _DownloadDisplay {\n+  _ProgressBarDisplay({required Stdio stdio, required this.statusMessage}) : _stdio = stdio;\n+\n+  static const int _maxTerminalWidth = 80;\n+  static const int _progressUpdateIntervalMs = 100;\n+\n+  final Stdio _stdio;\n+  final String statusMessage;\n+  final DownloadProgress _progress = DownloadProgress();\n+  final Stopwatch _stopwatch = Stopwatch();\n+  int _lastUpdateMs = 0;\n+\n+  int get _terminalWidth =>\n+      (_stdio.terminalColumns ?? _maxTerminalWidth).clamp(0, _maxTerminalWidth);\n+\n+  @override\n+  void start() {\n+    _stopwatch.start();\n+    _stdio.stdoutWrite('$statusMessage\\n');\n+  }\n+\n+  @override\n+  void onChunk(int chunkSize, int contentLength) {\n+    if (_progress.totalBytes < 0) {\n+      _progress.totalBytes = contentLength;\n+    }\n+    _progress.addBytesReceived(chunkSize);\n+    final int currentMs = _stopwatch.elapsedMilliseconds;\n+    if (currentMs >= _lastUpdateMs + _progressUpdateIntervalMs) {\n+      _lastUpdateMs = currentMs;\n+      final String line = _progress.formatProgressLine(\n+        elapsed: _stopwatch.elapsed,\n+        terminalWidth: _terminalWidth,\n+      );\n+      _stdio.stdoutWrite('${AnsiTerminal.clearAndReturnCode}$line');\n+    }\n+  }\n+\n+  void _stopAndClear() {\n+    _stopwatch.stop();\n+    _stdio.stdoutWrite(\n+      '${AnsiTerminal.clearAndReturnCode}'\n+      '${AnsiTerminal.cursorUpLineCode}'\n+      '${AnsiTerminal.clearAndReturnCode}',\n+    );\n+  }\n+\n+  @override\n+  void finish() {\n+    _stopAndClear();\n+    final String summary = _progress.formatCompletionSummary(_stopwatch.elapsed);\n+    final int padding = _terminalWidth - statusMessage.length - summary.length;\n+    final line = '$statusMessage${' ' * max(1, padding)}$summary';\n+    _stdio.stdoutWrite('$line\\n');\n+  }\n+\n+  @override\n+  void cancel() {\n+    _stopAndClear();\n+  }\n+\n+  @override\n+  void pause() {}\n+\n+  @override\n+  void resume() {}\n+}\n+\n+/// Displays a spinner via [Logger.startProgress].\n+class _SpinnerDisplay extends _DownloadDisplay {\n+  _SpinnerDisplay({required Logger logger, required String statusMessage})\n+    : _logger = logger,\n+      _statusMessage = statusMessage;\n+\n+  final Logger _logger;\n+  final String _statusMessage;\n+  Status? _status;\n+\n+  @override\n+  void start() {\n+    _status = _logger.startProgress(_statusMessage);\n+  }\n+\n+  @override\n+  void onChunk(int chunkSize, int contentLength) {}\n+\n+  @override\n+  void finish() {\n+    _status?.stop();\n+  }\n+\n+  @override\n+  void cancel() {\n+    _status?.stop();\n+  }\n+\n+  @override\n+  void pause() {\n+    _status?.pause();\n+  }\n+\n+  @override\n+  void resume() {\n+    _status?.resume();\n+  }\n+}\n+\n+/// Tracks download progress and provides formatted display strings.\n+@visibleForTesting\n+class DownloadProgress {\n+  /// Total expected bytes, or -1 if unknown.\n+  int totalBytes = -1;\n+\n+  int _bytesReceived = 0;\n+  int get bytesReceived => _bytesReceived;\n+\n+  void addBytesReceived(int bytes) {\n+    _bytesReceived += bytes;\n+  }\n+\n+  bool get hasKnownSize => totalBytes > 0;\n+\n+  double get fractionReceived => hasKnownSize ? (_bytesReceived / totalBytes).clamp(0.0, 1.0) : 0.0;\n+\n+  int get percentReceived => (fractionReceived * 100).round();\n+\n+  /// Download speed in bytes per second.\n+  double speedBytesPerSecond(Duration elapsed) {\n+    if (elapsed.inMilliseconds == 0) {\n+      return 0;\n+    }\n+    return _bytesReceived * 1000 / elapsed.inMilliseconds;\n+  }\n+\n+  /// Estimated time remaining.\n+  Duration? timeRemaining(Duration elapsed) {\n+    final double speed = speedBytesPerSecond(elapsed);\n+    if (!hasKnownSize || speed == 0) {\n+      return null;\n+    }\n+    final int totalRemainingBytes = totalBytes - _bytesReceived;\n+    return Duration(milliseconds: (totalRemainingBytes * 1000 / speed).round());\n+  }\n+\n+  static const _subBlocks = ['▏', '▎', '▍', '▌', '▋', '▊', '▉'];\n+\n+  /// Renders a progress bar with sub-character precision.\n+  ///\n+  /// Uses 1/8-block characters for a smooth fill edge.\n+  String renderProgressBar(int width) {\n+    if (!hasKnownSize || width <= 0) {\n+      return '';\n+    }\n+    final int totalEighths = (fractionReceived * width * 8).round();\n+    final int fullBlocks = totalEighths ~/ 8;\n+    final int remainder = totalEighths % 8;\n+    final int emptyBlocks = width - fullBlocks - 1;\n+    final String filled = '█' * fullBlocks;\n+    final String partial = remainder > 0 ? _subBlocks[remainder - 1] : ' ';\n+    final String empty = ' ' * emptyBlocks;\n+    return '$filled$partial$empty';\n+  }\n+\n+  /// Formats download speed as a human-readable string.\n+  String formatSpeed(Duration elapsed) {\n+    return '${getSizeAsPlatformMB(speedBytesPerSecond(elapsed).round())}/s';\n+  }\n+\n+  /// Formats bytes received and total.\n+  String formatBytes() {\n+    if (hasKnownSize) {\n+      return '${getSizeAsPlatformMB(_bytesReceived)}'\n+          '/${getSizeAsPlatformMB(totalBytes)}';\n+    }\n+    return getSizeAsPlatformMB(_bytesReceived);\n+  }\n+\n+  /// Formats estimated time remaining.\n+  String formatRemaining(Duration elapsed) {\n+    final Duration? rem = timeRemaining(elapsed);\n+    if (rem == null) {\n+      return '';\n+    }\n+    return 'ETA ${getElapsedAsSeconds(rem)}';\n+  }\n+\n+  /// Formats the full progress line for terminal display.\n+  String formatProgressLine({required Duration elapsed, required int terminalWidth}) {\n+    final String indent = ' ' * 5;\n+    final percentReceivedStr = hasKnownSize ? '${percentReceived.toString().padLeft(3)}%' : '';\n+    final String bytesStr = formatBytes();\n+    final String speedStr = formatSpeed(elapsed);\n+    final String etaStr = formatRemaining(elapsed);\n+\n+    final parts = <String>[percentReceivedStr, bytesStr, speedStr, etaStr];\n+    final String info = parts.where((String s) => s.isNotEmpty).join('  ');\n+\n+    // The progress bar is 28 characters wide and terminated on either side by\n+    // thin vertical lines which take up another 2 characters. 28 characters was\n+    // chosen empirically to make the progress bar take up enough space to look\n+    // good while leaving enough space for the detailed info under \"normal\"\n+    // conditions (artifact size <1GB, download speed >1MB/s).\n+    const barInner = 28;\n+    const int barTotal = barInner + 2; // ▕ + bar + ▏\n+    final String line;\n+\n+    // Only show the progress bar if we have enough room to show it along with\n+    // the info, otherwise just show the info right-aligned.\n+    if (hasKnownSize && terminalWidth >= indent.length + barTotal + info.length) {\n+      final String bar = renderProgressBar(barInner);\n+      final int padding = terminalWidth - indent.length - barTotal - info.length;\n+      line = '$indent▕$bar▏${' ' * padding}$info';\n+    } else {\n+      final int padding = terminalWidth - indent.length - info.length;\n+      final unclipped = '$indent${' ' * max(0, padding)}$info';\n+      line = unclipped.length <= terminalWidth ? unclipped : unclipped.substring(0, terminalWidth);\n+    }\n+    return line;\n+  }\n+\n+  /// Formats the completion summary like `(21.1MB in 5.0s)`.\n+  String formatCompletionSummary(Duration elapsed) {\n+    final String size = getSizeAsPlatformMB(_bytesReceived);\n+    final String time = getElapsedAsSeconds(elapsed);\n+    return '($size in $time)';\n+  }\n+}\ndiff --git a/packages/flutter_tools/lib/src/windows/visual_studio.dart b/packages/flutter_tools/lib/src/windows/visual_studio.dart\nindex 2edeca77dc9bace3712d03acb6fde98d2d3c5473df1f9d1e8d2b86fc2fdabad1..8cb3c92a52b3d0ea2c5fc5a6f7fc2c92db5362ee8af211b51244f33e9fe8aa7c\n--- a/packages/flutter_tools/lib/src/windows/visual_studio.dart\n+++ b/packages/flutter_tools/lib/src/windows/visual_studio.dart\n@@ -159,21 +159,36 @@\n-  /// The path to CMake, or null if no Visual Studio installation has\n-  /// the components necessary to build.\n+  /// 受控准备器已验真固定归档；这里只接受准确入口并检查原VS生成器能力。\n   String? get cmakePath {\n     final VswhereDetails? details = _bestVisualStudioDetails;\n     if (details == null || !details.isUsable || details.installationPath == null) {\n       return null;\n     }\n-\n-    return _fileSystem.path.joinAll(<String>[\n-      details.installationPath!,\n-      'Common7',\n-      'IDE',\n-      'CommonExtensions',\n-      'Microsoft',\n-      'CMake',\n-      'CMake',\n-      'bin',\n-      'cmake.exe',\n-    ]);\n+    final String? command = _platform.environment['CMAKE_COMMAND'];\n+    if (command == null || !_fileSystem.path.isAbsolute(command) ||\n+        RegExp(r'[\\x00-\\x1f]').hasMatch(command) ||\n+        _fileSystem.path.basename(command) != 'cmake.exe' ||\n+        _fileSystem.typeSync(command, followLinks: false) != FileSystemEntityType.file ||\n+        _fileSystem.file(command).resolveSymbolicLinksSync() != command) {\n+      throwToolExit('Windows编译缺少验真的受控CMAKE_COMMAND绝对入口。');\n+    }\n+    // 不改变VS编译器或生成器；不支持的组合在产品编译前明确拒绝。\n+    final RunResult result = _processUtils.runSync(<String>[command, '-E', 'capabilities']);\n+    if (result.exitCode != 0) {\n+      throwToolExit('受控CMake能力读取失败。');\n+    }\n+    Object? capabilities;\n+    try {\n+      capabilities = json.decode(result.stdout);\n+    } on FormatException {\n+      throwToolExit('受控CMake能力输出无效。');\n+    }\n+    if (capabilities is! Map<String, dynamic> ||\n+        capabilities['generators'] is! List<dynamic> ||\n+        !(capabilities['generators'] as List<dynamic>).any(\n+          (dynamic generator) => generator is Map<String, dynamic> &&\n+              generator['name'] == cmakeGenerator,\n+        )) {\n+      throwToolExit('受控CMake不支持当前Visual Studio生成器：$cmakeGenerator。');\n+    }\n+    return command;\n   }\n-\n+\n@@ -312,2 +327,0 @@\n-      // CMake\n-      'Microsoft.VisualStudio.Component.VC.CMake.Project': 'C++ CMake tools for Windows',\ndiff --git a/packages/flutter_tools/lib/src/isolated/native_assets/macos/native_assets_host.dart b/packages/flutter_tools/lib/src/isolated/native_assets/macos/native_assets_host.dart\nindex a7e4310dc61574a1e03b6b25bc104a5bd55c0de824131255c779feeb66d36ee0..6f2ceb11402e01e33b030a0516f3865b817a2b9e44cc5009a1e76a1420e584dd\n--- a/packages/flutter_tools/lib/src/isolated/native_assets/macos/native_assets_host.dart\n+++ b/packages/flutter_tools/lib/src/isolated/native_assets/macos/native_assets_host.dart\n@@ -66,7 +66,8 @@\n /// ios device or macos arm64.\n Future<void> lipoDylibs(File target, List<File> sources) async {\n   final RunResult lipoResult = await globals.processUtils.run(<String>[\n-    'xcrun',\n+    // 固定Apple定位入口在每次交付前验真，不能从PATH选取副本。\n+    '/usr/bin/xcrun',\n     'lipo',\n     '-create',\n     '-output',\n@@ -96,7 +97,8 @@\n   Map<String, String> oldToNewInstallNames,\n ) async {\n   final RunResult setInstallNamesResult = await globals.processUtils.run(<String>[\n-    'xcrun',\n+    // 固定Apple定位入口在每次交付前验真，不能从PATH选取副本。\n+    '/usr/bin/xcrun',\n     'install_name_tool',\n     '-id',\n     newInstallName,\n@@ -119,7 +121,8 @@\n \n Future<Set<String>> getInstallNamesDylib(File dylibFile) async {\n   final RunResult installNameResult = await globals.processUtils.run(<String>[\n-    'xcrun',\n+    // 固定Apple定位入口在每次交付前验真，不能从PATH选取副本。\n+    '/usr/bin/xcrun',\n     'otool',\n     '-D',\n     dylibFile.path,\n@@ -141,7 +144,8 @@\n /// Creates a dSYM bundle for a dylib.\n Future<void> dsymutilDylib(File dylibFile, String dsymPath) async {\n   final RunResult result = await globals.processUtils.run(<String>[\n-    'xcrun',\n+    // 固定Apple定位入口在每次交付前验真，不能从PATH选取副本。\n+    '/usr/bin/xcrun',\n     'dsymutil',\n     dylibFile.path,\n     '-o',\n@@ -157,7 +161,8 @@\n /// This is useful for release builds to reduce binary size.\n Future<void> stripDylib(File dylibFile) async {\n   final RunResult result = await globals.processUtils.run(<String>[\n-    'xcrun',\n+    // 固定Apple定位入口在每次交付前验真，不能从PATH选取副本。\n+    '/usr/bin/xcrun',\n     'strip',\n     '-x', // Remove local symbols.\n     '-S', // Remove debugging symbol table.\n@@ -179,7 +184,8 @@\n     codesignIdentity = '-';\n   }\n   final codesignCommand = <String>[\n-    'xcrun',\n+    // 固定Apple定位入口在每次交付前验真，不能从PATH选取副本。\n+    '/usr/bin/xcrun',\n     'codesign',\n     '--force',\n     '--sign',\n@@ -221,7 +227,8 @@\n /// Invokes `xcrun --find` to find the full path to [binaryName].\n Future<Uri?> _findXcrunBinary(String binaryName, bool throwIfNotFound) async {\n   final RunResult xcrunResult = await globals.processUtils.run(<String>[\n-    'xcrun',\n+    // 固定Apple定位入口在每次交付前验真，不能从PATH选取副本。\n+    '/usr/bin/xcrun',\n     '--find',\n     binaryName,\n   ]);\n";
const parserDefinitions={"yaml":{"name":"yaml","version":"2.8.3","url":"https://registry.npmjs.org/yaml/-/yaml-2.8.3.tgz","integrity":"sha512-AvbaCLOO2Otw/lW5bmh9d/WEdcDFdQp2Z2ZUH3pX9U2ihyUY0nvLv7J6TrWowklRGPYbB/IuIMfYgxaCPg5Bpg=="},"toml":{"name":"smol-toml","version":"1.4.2","url":"https://registry.npmjs.org/smol-toml/-/smol-toml-1.4.2.tgz","integrity":"sha512-rInDH6lCNiEyn3+hH8KVGFdbjc099j47+OSgbMrfDYX1CmXLfdKd7qi6IfcWj2wFxvSVkuI46M+wPGYfEOEj6g=="}};
const cleanEnvironment=environment=>Object.fromEntries(['HOME','USER','LOGNAME','LANG','LC_ALL'].filter(k=>typeof environment[k]==='string').map(k=>[k,environment[k]]));
const objectRecipe=tool=>hash(JSON.stringify([tool,tool.id==='posix'?posixRecipe.buildPosixTool.toString():['native-source','gem'].includes(tool.archive?.kind)?sourceRecipe.buildSourceTool.toString():tool.id==='flutter'?flutterPatch:'locked-extract-v1']));
function toolArchive(tool){if(tool.archive)return tool.archive;if(tool.id==='cmake')return {...tool.archives.macos,kind:'extract',executable:'bin/cmake'};return null;}
async function verifyToolObject(directory,tool){
  if(!await stat(directory))return null;await directoryCheck(directory);const payload=join(directory,'payload'),archive=toolArchive(tool),path=join(payload,archive.executable);
  await directoryCheck(payload);const info=await regular(path);if(!(info.mode&0o111))fail('工具入口不可执行');return {path,version:tool.version};
 }
const directoryCheck=path=>directory(path);
// 基础工具的正式PATH投影排除发行件旧Shell/grep/sed；自举仅限本产品已声明GNU三工具。
async function productFoundation(library,verify,{bootstrap=false,id}={}){
 const base=await posixRecipe.controlledPosixTools(library,verify);if(bootstrap){if(!['bash','grep','sed'].includes(id))fail('自举仅限GNU三工具');return {...base,path:base.bin};}
 const tools={...base.tools},paths=[];for(const name of ['bash','grep','sed']){const tool=library.tools.find(x=>x.id===name),value=tool&&await verify(library,tool);if(!value)fail('GNU闭包缺失：'+name);tools[name]=value.path;paths.push(dirname(value.path));}tools.sh=tools.bash;delete tools.egrep;delete tools.fgrep;
 const view=join(library.work,'resource-tools');await directory(view,true);const shell=join(view,'sh');if(await stat(shell)){if(!((await lstat(shell)).isSymbolicLink())||await realpath(shell)!==tools.sh)fail('GNU sh交付漂移');}else await symlink(tools.sh,shell);for(const [name,path]of Object.entries(base.tools)){if(['sh','bash','grep','sed','egrep','fgrep'].includes(name))continue;const link=join(view,name);if(await stat(link)){if(!((await lstat(link)).isSymbolicLink())||await realpath(link)!==path)fail('基础交付漂移');}else await symlink(path,link);}return {tools,bin:view,path:[...paths,view].join(':')};
}
async function prepareSourceDependencies({library,tool,pending,signal,fetcher,options={}}){const result=new Map();for(const entry of tool.dependencies||[])result.set(entry.name,await acquireArchive(entry,{work:library.work,store:join(library.root,'archives'),optional:options.optionalDependencies,offline:options.offline,signal,fetcher}));return result;}
async function commitCandidate(pending,target,{signal,verify}={}){
 const supplied=resourceSupplies.getStore();if(supplied){if(typeof supplied.publishCandidate!=='function')fail('供给未交付提交能力');return supplied.publishCandidate(pending,target);}

 // 下载与编译已完成后才取得短锁；等待可取消，已有对象永不覆盖。
 const lock=target+'.lock';let handle;for(let n=0;n<500;n++){signal?.throwIfAborted();try{handle=await open(lock,'wx',0o600);break;}catch(e){if(e.code!=='EEXIST')throw e;await new Promise(r=>setTimeout(r,20));}}if(!handle)fail('原件提交锁等待超限');
 try{signal?.throwIfAborted();if(await stat(target)){if(verify)await verify(target);}else{const info=await lstat(pending),mode=info.mode&0o777;if(info.isDirectory()&&!(mode&0o200))await chmod(pending,mode|0o200);try{await rename(pending,target);if(info.isDirectory())await chmod(target,mode);}catch(error){if(await stat(pending)&&info.isDirectory())await chmod(pending,mode);throw error;}}}finally{await handle.close();await rm(lock);}
}
async function installTool(library,tool,options,visiting=new Set()){
 const supplied=resourceSupplies.getStore();if(supplied&&!supplied.preparingTool){
  if(library.installed.has(tool.id))return library.installed.get(tool.id);
  const value=tool.id==='xcode'?await supplied.acquireApple({...supplyRequirements().apple,names:['xcodebuild']}).then(apple=>({path:apple.tools.xcodebuild,version:tool.version})):await supplied.acquireTool(supplyRequirements().tools.find(item=>item.id===tool.id));
  library.installed.set(tool.id,value);return value;
 }

 if(library.installed.has(tool.id))return library.installed.get(tool.id);if(visiting.has(tool.id))fail('工具声明循环：'+tool.id);visiting=new Set([...visiting,tool.id]);const archive=toolArchive(tool);
 if(tool.id==='xcode'){const apple=await verifyAppleTools(library,{environment:cleanEnvironment(options.environment),signal:options.signal});const value={path:apple.tools.xcodebuild,version:tool.version};library.installed.set(tool.id,value);return value;}
 if(!archive)fail('工具归档未声明：'+tool.id);const shared=join(library.root,'shared');await directory(shared,true);const target=join(shared,library.supply?archive.sha256:archive.sha256+'-'+objectRecipe(tool));const verify=p=>verifyToolObject(p,tool,{produced:!library.supply});let value=await verify(target);
 if(!value&&options.optionalTools&&await stat(options.optionalTools)){await directory(options.optionalTools);value=await verifyToolObject(join(options.optionalTools,'shared',archive.sha256),tool);}
 for(const id of tool.requires||[]){const entry=library.tools.find(x=>x.id===id);if(!entry)fail('前置工具未声明：'+id);await installTool(library,entry,options,visiting);}
 if(value){library.installed.set(tool.id,value);return value;}if(options.offline)fail('离线缺少工具：'+tool.id);
 // Node用内置解包形成最小宿主，POSIX用固定签名输入；其余工具只能使用完成GNU接管的基础工具。
 let foundation;if(!['node','posix'].includes(tool.id)){for(const id of ['posix',...(['bash','grep','sed'].includes(tool.id)?[]:['bash','grep','sed'])]){if(visiting.has(id))fail('工具自举循环');await installTool(library,library.tools.find(x=>x.id===id),options,visiting);}foundation=await productFoundation(library,async(_,t)=>library.installed.get(t.id),{bootstrap:['bash','grep','sed'].includes(tool.id),id:tool.id});}
 const pending=await fixedScratch(join(await resourceWork(library.work),'.'+archive.sha256+'-'));const canonical=join(pending,'library/shared',archive.sha256+'.pending'),payload=join(canonical,'payload');const localLibrary={...library,pending:canonical,finalPayload:options.finalPayload||join(target,'payload')};await directory(canonical,true);const original=join(canonical,'archive');
 try{
  let source;if(archive.kind==='apple-posix'){await verifyAppleTools(library,{names:['codesign'],environment:cleanEnvironment(options.environment),signal:options.signal});await posixRecipe.buildPosixTool({tool,payload,bootstrap:true,run:exec,signal:options.signal});source=payload;}
  else{const file=await acquireArchive(archive,{work:library.work,store:join(library.root,'archives'),optional:options.optionalDependencies,offline:options.offline,fetcher:options.fetcher,signal:options.signal});await copyFile(file,original);if(['gem','binary','phar'].includes(archive.kind))source=original;else {const unpacked=join(canonical,'unpack');await unpack(original,unpacked,{foundation,signal:options.signal});source=archive.root==='.'?unpacked:join(unpacked,archive.root);await directory(source);}}
  const environment={...cleanEnvironment(options.environment),HOME:canonical,TMPDIR:canonical,PATH:foundation?.path||'',PRODUCT_WORK_DIR:canonical};
  const verifyInstalled=async(_,t)=>library.installed.get(t.id)||null;
  if(['native-source','gem'].includes(archive.kind))await sourceRecipe.buildSourceTool({library:localLibrary,tool,source,archive:original,pending:canonical,payload,finalPayload:localLibrary.finalPayload,signal:options.signal,fetcher:options.fetcher,exec,verify:verifyInstalled,apple:verifyAppleTools,bootstrap:['bash','grep','sed'].includes(tool.id),environment,prepare:input=>prepareSourceDependencies({...input,options}),download:(entry,target,context)=>downloadTool(entry,target,{...context,...options,work:library.work,store:join(library.root,'archives'),optional:options.optionalDependencies})});
  else if(['binary','phar'].includes(archive.kind)){await mkdir(dirname(join(payload,archive.executable)),{recursive:true});await copyFile(original,join(payload,archive.executable));await chmod(join(payload,archive.executable),0o555);}
  else if(archive.kind==='rust'){
   await exec(foundation.tools.bash,[join(source,'install.sh'),'--prefix='+payload,'--disable-ldconfig','--components=rustc,cargo,rust-std-aarch64-apple-darwin,rust-src,rustfmt-preview,clippy-preview'],{signal:options.signal,env:environment,maxBuffer:2*1024**2,timeout:300000});
   for(const component of tool.components||[]){const file=await acquireArchive(component,{work:library.work,store:join(library.root,'archives'),offline:options.offline,fetcher:options.fetcher,signal:options.signal}),dir=join(canonical,component.target);await unpack(file,dir,{foundation,signal:options.signal});await exec(foundation.tools.bash,[join(dir,component.root,'install.sh'),'--prefix='+payload,'--disable-ldconfig'],{signal:options.signal,env:environment,maxBuffer:2*1024**2,timeout:300000});}
  }else if(archive.kind==='cargo-source'){
   await directory(payload,true);const rust=library.installed.get('rust').path,apple=await verifyAppleTools(library,{names:['clang','ar'],environment:cleanEnvironment(options.environment),signal:options.signal}),work=join(canonical,'cargo');await directory(work,true);
   const deps=await prepareCargo([join(source,'Cargo.lock')],work,{...options,library});await exec(join(dirname(rust),'cargo'),['build','--manifest-path',join(source,'Cargo.toml'),'--release','--locked','--offline','--bin',tool.command],{cwd:work,signal:options.signal,timeout:1800000,maxBuffer:8*1024**2,env:{...environment,PATH:dirname(rust)+':'+environment.PATH,RUSTC:rust,CC:apple.tools.clang,AR:apple.tools.ar,DEVELOPER_DIR:apple.developerDirectory,CARGO_HOME:deps.cargoHome,CARGO_TARGET_DIR:join(work,'target')}});await mkdir(join(payload,'bin'));await copyFile(join(work,'target/release',tool.command),join(payload,archive.executable));await copyFile(original,join(payload,'source.crate'));
  }else if(archive.kind!=='apple-posix')await rename(source,payload);
  if(tool.id==='pnpm')await symlink('pnpm.cjs',join(payload,'bin/pnpm'));
  if(tool.id==='flutter'){if(hash(Buffer.from(flutterPatch))!==tool.patch.sha256)fail('Flutter配方摘要不符');const dart=join(payload,'bin/cache/dart-sdk/bin/dart');await preparePub([join(payload,'packages/flutter_tools/pubspec.lock')],join(payload,'bin/cache/pub'),{...options,library,dart});environment.PATH=dirname(library.installed.get('node').path)+':'+foundation.path;await flutterRecipe.prepareFlutter(payload,{tool,files:flutterRecipe.parsePatch(flutterPatch),env:environment,signal:options.signal});}
  if(tool.id==='java')environment.JAVA_HOME=dirname(dirname(join(payload,archive.executable)));if(tool.id==='gradle')environment.JAVA_HOME=dirname(dirname(library.installed.get('java').path));if(tool.id==='python')environment.PYTHONHOME=payload;

  await permissions(payload,false);
  if(tool.id==='flutter'){await chmod(join(payload,'bin/cache/lockfile'),0o600);await chmod(join(payload,'packages/flutter_tools/gradle'),0o755);}
  options.signal?.throwIfAborted();await commitCandidate(canonical,target,{signal:options.signal,verify});value=await verify(target);library.installed.set(tool.id,value);return value;
 }finally{if(await stat(pending)){await permissions(pending,true);await rm(pending,{recursive:true});}}
}
async function parser(kind,options){const entry=parserDefinitions[kind],store=join(options.library.root,...(options.library.supply?['shared','parsers']:['parsers'])),parserRoot=join(store,hash(JSON.stringify(entry)));await directoryCheck(options.library.root);await directoryCheck(options.library.work);await directoryCheck(store).catch(async e=>{if(e.code!=='ENOENT')throw e;await directoryCheck(options.library.root);await mkdir(store);});
 if(!await stat(parserRoot)){const file=await acquireArchive(entry,{work:options.library.work,store:join(options.library.root,'archives'),optional:options.optionalDependencies,offline:options.offline,fetcher:options.fetcher,signal:options.signal}),candidate=await fixedScratch(join(await resourceWork(options.library.work),'.parser-'));try{const payload=join(candidate,'payload');await extractArchive(file,payload,{prefix:'package',signal:options.signal});await writeFile(join(candidate,'receipt.json'),JSON.stringify(await inventory(payload)));await permissions(candidate,false);await commitCandidate(candidate,parserRoot,{signal:options.signal});}finally{if(await stat(candidate)){await permissions(candidate,true);await rm(candidate,{recursive:true});}}}
 const payload=join(parserRoot,'payload');const mod=createRequire(import.meta.url)(payload);if(kind==='yaml')return text=>mod.parse(text,{uniqueKeys:true});const parse=text=>mod.parse(text);parse.stringify=mod.stringify;return parse;
}
async function checkedLock(path){await regular(path);const s=await lstat(path);if(s.size>32*1024**2)fail('锁文件超限');return readFile(path,'utf8');}
async function packageOriginal(entry,options){return acquireArchive(entry,{work:options.library.work,store:join(options.dependencyRoot||join(options.library.root,'..','rely'),'archives'),optional:options.optionalDependencies,offline:options.offline,fetcher:options.fetcher,signal:options.signal});}
async function prepareNpm(locks,work,options){const cache=join(work,'npm');await directory(cache,true);const node=options.library.installed.get('node').path,require=createRequire(join(dirname(node),'../lib/node_modules/npm/bin/npm-cli.js')),cacache=require('cacache');for(const lock of locks){const document=JSON.parse(await checkedLock(lock));if(![2,3].includes(document.lockfileVersion)||!document.packages)fail('npm原始锁格式无效');for(const [path,entry]of Object.entries(document.packages)){if(!path||entry.link)continue;if(!entry.resolved||!entry.integrity||!entry.version)fail('npm包未锁定来源');const file=await packageOriginal({url:entry.resolved,integrity:entry.integrity},options);await cacache.put(join(cache,'_cacache'),'make-fetch-happen:request-cache:'+entry.resolved,await readFile(file),{integrity:entry.integrity,metadata:{time:Date.now(),url:entry.resolved,reqHeaders:{},resHeaders:{'content-type':'application/octet-stream'}}});}}return {npmCache:cache};}
async function preparePub(locks,cache,options){await directory(cache,true);const parse=await parser('yaml',options),files=[];for(const lock of locks){const d=parse(await checkedLock(lock));if(!d.packages)fail('Pub锁格式无效');for(const [name,entry]of Object.entries(d.packages)){if(['sdk','path'].includes(entry.source))continue;if(entry.source==='git'){const d=entry.description;if(!d||d.ref!==d['resolved-ref']||!options.sources?.some(x=>x.name===name&&x.url===d.url&&x.ref===d.ref))fail('Pub Git来源不属于产品固定闭包：'+name);continue;}if(entry.source!=='hosted'||entry.description?.name!==name||!['https://pub.dev','https://pub.dev/'].includes(entry.description.url)||!entry.description.sha256)fail('Pub来源未锁定');const coordinate={ecosystem:'pub',name,version:entry.version,url:'https://pub.dev/api/archives/'+name+'-'+entry.version+'.tar.gz',sha256:entry.description.sha256};files.push({name:name+'-'+entry.version,sha256:coordinate.sha256,file:await packageOriginal(coordinate,options)});}}
 return materializePubCache(files,cache,options);}
// Pub直接解析64位十六进制摘要，不接受行尾换行；独立与控制台配方共用此本轮物化。
async function materializePubCache(files,cache,options={}){
 await directory(cache,true); for(const entry of files){const target=join(cache,'hosted/pub.dev',entry.name),proof=join(cache,'hosted-hashes/pub.dev',entry.name+'.sha256');await directory(dirname(target),true);await directory(dirname(proof),true);if(await stat(target)){if(await readFile(proof,'utf8')!==entry.sha256)fail('Pub缓存摘要漂移');}else{await extractArchive(entry.file,target,{signal:options.signal});await writeFile(proof,entry.sha256,{flag:'wx'});}}
 await directory(join(cache,'_temp'),true);return {pubCache:cache};}
function gitCoordinate(source){const u=new URL(source.replace(/^git\+/u,''));const ref=u.searchParams.get('rev');if(u.protocol!=='https:'||u.hostname!=='github.com'||u.username||u.password||!u.pathname.endsWith('.git')||!/^[a-f0-9]{40}$/u.test(ref||'')||u.hash!=='#'+ref||[...u.searchParams.keys()].length!==1)fail('Git来源不是唯一锁定提交');return {url:u.origin+u.pathname,ref};}
async function gitCheckout(source,target,options){
 const git=options.library.installed.get('git')?.path;if(!git||!/^[a-f0-9]{40}$/u.test(source.ref||''))fail('Git未验真或来源没有固定提交');checkedURL(source.url);
 const environment={...cleanEnvironment(options.environment),PATH:(await productFoundation(options.library,async(_,t)=>options.library.installed.get(t.id))).path,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0',HOME:options.library.work};
 const run=args=>exec(git,['-c','credential.helper=','-c','core.hooksPath=/dev/null','-c','protocol.file.allow=always',...args],{signal:options.signal,env:environment,maxBuffer:16*1024**2,timeout:600000});
 if(await stat(target)){await directory(target);await directory(join(target,'.git'));if((await run(['-C',target,'rev-parse','HEAD'])).stdout.trim()!==source.ref||(await run(['-C',target,'status','--porcelain=v1','--untracked-files=all'])).stdout||(await run(['-C',target,'remote','get-url','origin'])).stdout.trim()!==source.url)fail('Git检出身份漂移');return target;}
 const store=options.library.supply?join(options.library.work,'resource-pending/git'):join(options.dependencyRoot||join(options.library.root,'..','rely'),'git');await directory(store,true);const object=join(store,hash(JSON.stringify(source)));
 // bundle与其来源/摘要回执一起原子提交，避免并发读到只有bundle而没有回执的中间状态。
 const verify=async path=>{if(!await stat(path))return null;await directory(path);const bundle=join(path,'source.bundle'),proofFile=join(path,'receipt.json');await regular(bundle);await regular(proofFile);const proof=JSON.parse(await readFile(proofFile,'utf8'));if(proof.request!==JSON.stringify(source)||proof.sha256!==hash(await readFile(bundle)))fail('Git原件身份或摘要被篡改');return bundle;};
 let bundle=await verify(object);if(!bundle){const candidate=await fixedScratch(join(await resourceWork(options.library.work),'.git-'));try{const file=join(candidate,'source.bundle');let supplied;
   if(options.optionalDependencies){const index=join(dirname(options.optionalDependencies),'index.json');if(await stat(index)){await regular(index);if((await lstat(index)).size>32*1024**2)fail('Git可选索引超限');const d=await readDependencySupply(options.optionalDependencies),coordinate='git+'+source.url+'?rev='+source.ref+'#'+source.ref,entry=d.git_sources?.find(x=>x.source===coordinate);if(entry){if(!/^[a-f0-9]{64}$/u.test(entry.sha256||''))fail('Git供给摘要无效');const original=join(options.optionalDependencies,entry.sha256+'.blob');await regular(original);if(hash(await readFile(original))!==entry.sha256)fail('Git供给原件摘要不符');supplied=original;}}}
   if(supplied)await copyFile(supplied,file,constants.COPYFILE_EXCL);else{if(options.offline)fail('离线缺少Git提交');const checkout=join(candidate,'repository');await mkdir(checkout);await run(['init','--quiet',checkout]);await run(['-C',checkout,'fetch','--no-tags',source.url,source.ref]);if((await run(['-C',checkout,'rev-parse','FETCH_HEAD'])).stdout.trim()!==source.ref)fail('Git取得提交不符');await run(['-C',checkout,'update-ref','refs/heads/locked',source.ref]);await run(['-C',checkout,'bundle','create',file,'refs/heads/locked']);await rm(checkout,{recursive:true});}
   await writeFile(join(candidate,'receipt.json'),JSON.stringify({request:JSON.stringify(source),sha256:hash(await readFile(file))}),{flag:'wx'});await permissions(candidate,false);await commitCandidate(candidate,object,{signal:options.signal,verify});bundle=await verify(object);
  }finally{if(await stat(candidate)){await permissions(candidate,true);await rm(candidate,{recursive:true});}}}
 await directory(dirname(target),true);const pending=await fixedScratch(join(dirname(target),'.checkout-'));try{const checkout=join(pending,'source');await run(['clone','--quiet','--no-checkout','--',bundle,checkout]);await run(['-C',checkout,'remote','set-url','origin',source.url]);await run(['-C',checkout,'checkout','--quiet','--detach',source.ref]);await run(['-C',checkout,'fsck','--full','--strict']);options.signal?.throwIfAborted();await rename(checkout,target);}finally{await rm(pending,{recursive:true});}return gitCheckout(source,target,options);
}
// Git工作区包转为目录源时展开workspace继承，并把相对path依赖固定到同一锁中的准确版本。
function normalizeCargoManifest(document,workspace,locked) {
 const d=structuredClone(document),w=workspace?.workspace||{};
 for(const [key,value]of Object.entries(d.package||{}))if(value&&typeof value==='object'&&value.workspace===true){if(w.package?.[key]===undefined)fail('Git包workspace字段缺失：'+key);d.package[key]=w.package[key];}
 const section=values=>{for(const [name,value]of Object.entries(values||{})){let dep=typeof value==='string'?{version:value}:{...value};if(dep.workspace){const inherited=w.dependencies?.[name];if(!inherited)fail('Git包workspace依赖缺失：'+name);const source=typeof inherited==='string'?{version:inherited}:inherited;dep={...source,...dep,features:[...(source.features||[]),...(dep.features||[])]};delete dep.workspace;}
  if(dep.path){delete dep.path;if(!dep.version){const matches=locked.filter(x=>x.name===(dep.package||name));if(matches.length!==1)fail('相对依赖没有唯一锁定版本：'+name);dep.version='='+matches[0].version;}}values[name]=dep;}};
 for(const key of ['dependencies','build-dependencies','dev-dependencies'])section(d[key]);for(const target of Object.values(d.target||{}))for(const key of ['dependencies','build-dependencies','dev-dependencies'])section(target[key]);if(d.lints?.workspace){if(!w.lints)fail('Git包workspace lints缺失');d.lints=w.lints;}delete d.workspace;return d;
}
async function prepareCargo(locks,work,options){await directory(work,true);const parse=await parser('toml',options),packages=new Map(),gitSources=new Map(),allPackages=[],vendor=join(work,'cargo-vendor');await directory(vendor,true);
 for(const lock of locks){const doc=parse(await checkedLock(lock));if(!Array.isArray(doc.package))fail('Cargo锁格式无效');allPackages.push(...doc.package);for(const pkg of doc.package){if(!pkg.source)continue;if(pkg.source==='registry+https://github.com/rust-lang/crates.io-index'){if(!/^[a-f0-9]{64}$/u.test(pkg.checksum||''))fail('Cargo包缺少摘要');const key=pkg.name+'-'+pkg.version;if(packages.has(key)&&packages.get(key)!==pkg.checksum)fail('Cargo包版本冲突');packages.set(key,pkg.checksum);const target=join(vendor,key),file=await packageOriginal({ecosystem:'cargo',name:pkg.name,version:pkg.version,url:'https://static.crates.io/crates/'+pkg.name+'/'+key+'.crate',sha256:pkg.checksum},options);if(!await stat(target)){await extractArchive(file,target,{prefix:key,signal:options.signal});const files=Object.fromEntries((await inventory(target)).filter(x=>x.sha256).map(x=>[x.path,x.sha256]));await writeFile(join(target,'.cargo-checksum.json'),JSON.stringify({files,package:pkg.checksum}),{flag:'wx'});}else {const proof=JSON.parse(await readFile(join(target,'.cargo-checksum.json'),'utf8'));if(proof.package!==pkg.checksum)fail('Cargo目录源摘要漂移');for(const [name,digest]of Object.entries(proof.files)){if(!safePath(name)||hash(await readFile(join(target,name)))!==digest)fail('Cargo目录源被篡改');}}}
 else if(pkg.source.startsWith('git+')){const coordinate=gitCoordinate(pkg.source);if(!gitSources.has(pkg.source))gitSources.set(pkg.source,{coordinate,packages:[]});gitSources.get(pkg.source).packages.push(pkg);}else fail('Cargo来源未声明');}}
 let config='[net]\noffline = true\n[source.crates-io]\nreplace-with = "product-verified"\n[source.product-verified]\ndirectory = '+JSON.stringify(vendor)+'\n';
 for(const [source,entry]of gitSources){const checkout=await gitCheckout(entry.coordinate,join(work,'cargo-git',hash(source)),options);const manifests=[];async function walk(path){for(const name of await readdir(path)){if(['.git','target'].includes(name))continue;const file=join(path,name),s=await lstat(file);if(s.isDirectory())await walk(file);else if(name==='Cargo.toml'&&s.isFile())manifests.push(file);}}await walk(checkout);for(const pkg of entry.packages){let found;for(const manifest of manifests){const doc=parse(await readFile(manifest,'utf8'));if(doc.package?.name===pkg.name){let version=doc.package.version;if(typeof version==='object'&&version.workspace)version=parse(await readFile(join(checkout,'Cargo.toml'),'utf8')).workspace?.package?.version;if(version===pkg.version){if(found)fail('Git包路径不唯一');found=dirname(manifest);}}}if(!found)fail('Git包名称版本与锁不一致');const target=join(vendor,pkg.name+'-'+pkg.version+'-'+hash(source).slice(0,12));if(!await stat(target)){await copyTree(found,target);let workspace={};for(let at=found;inside(checkout,at)||at===checkout;at=dirname(at)){const file=join(at,'Cargo.toml');if(await stat(file)){const candidate=parse(await readFile(file,'utf8'));if(candidate.workspace){workspace=candidate;break;}}if(at===checkout)break;}const manifest=normalizeCargoManifest(parse(await readFile(join(found,'Cargo.toml'),'utf8')),workspace,allPackages);await writeFile(join(target,'Cargo.toml'),parse.stringify(manifest));const files=Object.fromEntries((await inventory(target)).filter(x=>x.sha256).map(x=>[x.path,x.sha256]));await writeFile(join(target,'.cargo-checksum.json'),JSON.stringify({files,package:null}));}}
 const key='product-git-'+hash(source).slice(0,12);config+='[source.'+key+']\ngit = '+JSON.stringify(entry.coordinate.url)+'\nrev = '+JSON.stringify(entry.coordinate.ref)+'\nreplace-with = "product-verified"\n';}
 const cargoHome=join(work,'cargo-home');await directory(cargoHome,true);await writeFile(join(cargoHome,'config.toml'),config);return {cargoHome};
}
async function copyTree(source,target){await directory(source);await mkdir(target);for(const name of await readdir(source)){if(['.git','target'].includes(name))continue;const a=join(source,name),b=join(target,name),s=await lstat(a);if(s.isDirectory())await copyTree(a,b);else if(s.isFile())await copyFile(a,b);else fail('目录源链接或特殊项未声明');}}
// 2026-10-06只读核对官方GitHub tag/Release资产元数据；未下载或安装这些原件。
const podSourceDefinitions=[];
// 官方tag仅用于核对声明；产品预先锁定其40位提交，运行时不解析浮动tag。
function podSourceCoordinate(spec, definitions = podSourceDefinitions) {
 const source=spec.source,entry=definitions.find(x=>x.name===spec.name&&x.version===spec.version);
 if(!source||typeof source!=='object')fail('Pod缺少官方来源');
 if(entry){if(source.git!==entry.url&&source.http!==entry.url||source.tag!==entry.tag&&entry.tag!==undefined)fail('Pod官方来源与产品固定坐标不一致');
  if(entry.ref){if(source.commit&&source.commit!==entry.ref)fail('Pod提交漂移');return {url:checkedURL(entry.url),ref:entry.ref};}
  if(source.sha256&&source.sha256!==entry.sha256)fail('Pod发行摘要漂移');return {url:checkedURL(entry.url),sha256:entry.sha256};}
 if(source.git&&/^[a-f0-9]{40}$/u.test(source.commit||''))return {url:checkedURL(source.git),ref:source.commit};
 if(source.http&&/^[a-f0-9]{64}$/u.test(source.sha256||''))return {url:checkedURL(source.http),sha256:source.sha256};
 fail('Pod来源没有产品锁定提交或SHA256：'+spec.name);
}
async function responseBytes(response,limit,signal){
 if(!response.ok||!response.body)fail('官方来源响应失败');if(Number(response.headers.get('content-length'))>limit)fail('官方响应声明超限');
 const chunks=[];let size=0;try{for await(const chunk of response.body){signal?.throwIfAborted();size+=chunk.length;if(size>limit)fail('官方响应数据超限');chunks.push(chunk);}if(!size)fail('官方响应为空');return Buffer.concat(chunks);}finally{await response.body.cancel().catch(()=>{});}
}
async function verifyPodSpec(file,name,version,checksum,options){
 await regular(file);if((await lstat(file)).size>2*1024**2)fail('Pod spec超限');const spec=JSON.parse(await readFile(file,'utf8'));
 if(spec.name!==name||String(spec.version)!==version)fail('Pod spec身份不符');
 const tool=options.library.installed.get('cocoapods'),ruby=options.library.installed.get('ruby')?.path;if(!tool||!ruby)fail('Pod验真缺少Ruby/CocoaPods');const gems=join(dirname(dirname(tool.path)),'gems');
 // 同一Ruby的自带Gem与产品交付Gem是唯一搜索路径；每次复用均回读规范spec锁摘要。
 const program="require 'rubygems'; ENV['GEM_PATH'] = [ENV.fetch('GEM_HOME'), Gem.default_dir].join(File::PATH_SEPARATOR); Gem.clear_paths; require 'logger'; require 'cocoapods'; print Pod::Specification.from_file(ARGV.fetch(0)).checksum";
 const result=await exec(ruby,['-e',program,file],{signal:options.signal,env:{...cleanEnvironment(options.environment),GEM_HOME:gems,GEM_PATH:gems},maxBuffer:1024**2});if(result.stdout!==checksum)fail('Pod spec与锁摘要不符');return spec;
}
async function copyPodSource(source,target,base=source){
 await directory(source);await directory(target,true);for(const name of await readdir(source)){if(name==='.git')continue;const input=join(source,name),output=join(target,name),s=await lstat(input);
  if(s.isDirectory())await copyPodSource(input,output,base);else if(s.isFile()){await regular(input);await copyFile(input,output,constants.COPYFILE_EXCL);await chmod(output,s.mode&0o111?0o755:0o644);}else if(s.isSymbolicLink()){const resolved=await realpath(input);if(!inside(base,resolved))fail('Pod源码链接越界');await symlink(await readlink(input),output);}else fail('Pod源码含特殊项');}
}
async function preparePods(lockfile,work,options){const parse=await parser('yaml',options),text=await checkedLock(lockfile),lock=parse(text),podHome=join(work,'cocoapods');await directory(podHome,true);
 // 可选供给按单个Pod坐标匹配，与整锁、宿主和其它Pod变化无关。
 let restored=false;const supplied=await readDependencySupply(options.optionalDependencies);

 const local=new Set();for(const [name,source]of Object.entries(lock['EXTERNAL SOURCES']||{})){if(typeof source[':path']!=='string'||Object.keys(source).some(x=>x!==':path'))fail('Pod外部来源必须另有产品固定锁：'+name);local.add(name);}
 const handled=new Set();for(const item of lock.PODS||[]){const record=typeof item==='string'?item:Object.keys(item)[0],m=/^([^/( ]+)(?:\/[^ (]+)? \(([^)]+)\)$/u.exec(record);if(!m)fail('Pod锁记录无效');const [,name,version]=m;if(local.has(name)||handled.has(name))continue;handled.add(name);
  const checksum=lock['SPEC CHECKSUMS']?.[name];if(!/^[a-f0-9]{40}$/u.test(checksum||''))fail('Pod缺少锁定spec摘要');const key=version+'-'+checksum.slice(0,5),specPath=join(podHome,'cache/Pods/Specs/Release',name,key+'.podspec.json'),release=join(podHome,'cache/Pods/Release',name,key);
  const candidates=(supplied?.pods||[]).filter(x=>x.name===name&&x.version===version&&x.checksum===checksum);if(candidates.length>1)fail('Pod供给坐标重复');if(candidates.length){await materializePodSupply(candidates[0],options.optionalDependencies,podHome,{signal:options.signal});restored=true;}
  const store=options.library.supply?join(options.library.work,'resource-pending/pods'):join(options.dependencyRoot||join(options.library.root,'..','rely'),'pods');await directory(store,true);const original=join(store,hash(JSON.stringify([name,version,checksum])));
  const verify=async path=>{if(!await stat(path))return null;await directory(path);await regular(join(path,'receipt.json'));const proof=JSON.parse(await readFile(join(path,'receipt.json'),'utf8'));if(JSON.stringify(proof.files)!==JSON.stringify(await inventory(join(path,'payload'))))fail('Pod不可变原件被篡改');return path;};
  let object=await verify(original);if(!object){const candidate=await fixedScratch(join(await resourceWork(options.library.work),'.pod-'));try{const payload=join(candidate,'payload');await mkdir(payload);const specFile=join(payload,'spec.json');
    if(await stat(specPath))await copyFile(specPath,specFile,constants.COPYFILE_EXCL);else{if(options.offline)fail('离线缺少Pod spec');const md5=createHash('md5').update(name).digest('hex'),url='https://cdn.cocoapods.org/Specs/'+md5[0]+'/'+md5[1]+'/'+md5[2]+'/'+name+'/'+version+'/'+name+'.podspec.json';await writeFile(specFile,await responseBytes(await options.fetcher(url,{signal:options.signal,redirect:'error'}),2*1024**2,options.signal),{flag:'wx'});}
    const spec=await verifyPodSpec(specFile,name,version,checksum,options),coordinate=podSourceCoordinate(spec),source=join(payload,'source');
    if(await stat(release)){await inventory(release);await copyPodSource(release,source);}else if(coordinate.ref){const checkout=join(candidate,'checkout');await gitCheckout(coordinate,checkout,options);await copyPodSource(checkout,source);await rm(checkout,{recursive:true});}else{const file=await packageOriginal(coordinate,options);await extractArchive(file,source,{signal:options.signal});}
    if(!await stat(release)&&spec.prepare_command){if(typeof spec.prepare_command!=='string')fail('Pod准备命令不是锁定文本');const foundation=await productFoundation(options.library,async(_,t)=>options.library.installed.get(t.id));await exec(foundation.tools.bash,['-ec',spec.prepare_command],{cwd:source,signal:options.signal,env:{...cleanEnvironment(options.environment),PATH:foundation.path,HOME:options.library.work,COCOAPODS_VERSION:options.library.tools.find(x=>x.id==='cocoapods').version}});}
    await writeFile(join(candidate,'receipt.json'),JSON.stringify({request:JSON.stringify(coordinate),files:await inventory(payload)}),{flag:'wx'});await permissions(candidate,false);await commitCandidate(candidate,original,{signal:options.signal,verify});object=await verify(original);
   }finally{if(await stat(candidate)){await permissions(candidate,true);await rm(candidate,{recursive:true});}}}
  const spec=await verifyPodSpec(join(object,'payload/spec.json'),name,version,checksum,options),coordinate=podSourceCoordinate(spec),proof=JSON.parse(await readFile(join(object,'receipt.json'),'utf8'));if(JSON.stringify(coordinate)!==proof.request)fail('Pod原件来源回执漂移');
  if(!await stat(specPath)){await directory(dirname(specPath),true);await copyFile(join(object,'payload/spec.json'),specPath,constants.COPYFILE_EXCL);}await verifyPodSpec(specPath,name,version,checksum,options);
  if(options.publishPod)await options.publishPod({name,version,checksum,spec:join(object,'payload/spec.json'),source:join(object,'payload/source')});
  if(!await stat(release))await copyPodSource(join(object,'payload/source'),release);if(JSON.stringify(await inventory(release))!==JSON.stringify(await inventory(join(object,'payload/source'))))fail('Pod任务源码漂移');
 }
 const version=options.library.tools.find(x=>x.id==='cocoapods')?.version,file=join(podHome,'cache/Pods/VERSION');await directory(dirname(file),true);if(await stat(file)){await regular(file);if((await readFile(file,'utf8')).trim()!==version)fail('Pod缓存工具版本漂移');}else await writeFile(file,version,{flag:'wx'});
 checkCocoaPodsResources(lockfile,podHome);return {restored};
}
async function platformTreeDigest(directory){const digest=createHash('sha256');async function visit(path=''){for(const name of (await readdir(join(directory,path))).sort()){if(name==='.DS_Store')continue;const relative=join(path,name),file=join(directory,relative),s=await lstat(file);if(s.isDirectory())await visit(relative);else{await regular(file);digest.update(JSON.stringify([relative,s.size])+'\n');digest.update(await readFile(file));}}}await visit();return digest.digest('hex');}
async function acquireOfficialPlatform(item,options){
 // 固定官方发行树先有界下载，再以产品登记的整树摘要验真；候选归入同一取消清理范围。
 if(options.offline)fail('离线缺少额外Android发行件');const data=await responseBytes(await options.fetcher(checkedURL(item.source),{signal:options.signal,redirect:'error'}),512*1024**2,options.signal);const file=join(options.library.work,'.platform-'+randomUUID()+'.zip');await writeFile(file,data,{flag:'wx'});return file;
}
async function installAndroidResources(options){const library=options.library,cmake=library.tools.find(x=>x.id==='cmake'),packages=androidDefinitions.map(x=>x.tool?{path:'cmake;'+cmake.version,version:cmake.version,...cmake.archives.macos}:x),wanted=library.requested.flatMap(x=>x.packages||[]);for(const item of wanted){const match=library.androidPlatforms?.find(x=>x.path===item.path&&x.version===item.version);if(!match)fail('SDK平台没有产品准确登记');if(!library.supply&&!packages.some(x=>x.path===match.path))packages.push(match);}
 const sha256=hash(JSON.stringify(packages)),store=join(library.root,'shared');await directory(store,true);const target=join(store,library.supply?'android':'android-'+sha256);const verify=async directory=>{if(!await stat(directory))return null;await directoryCheck(directory);const payload=join(directory,'payload'),receipt=JSON.parse(await readFile(join(directory,'receipt.json'),'utf8'));if(receipt.sha256!==sha256||JSON.stringify(receipt.files)!==JSON.stringify(await inventory(payload)))fail('SDK原件回执不符');for(const item of packages){const text=await readFile(join(payload,...item.path.split(';'),'source.properties'),'utf8');if([...text.matchAll(/^Pkg\.Revision\s*=\s*(\S+)\s*$/gmu)].length!==1||!text.includes('Pkg.Revision='+item.version)&&!new RegExp('^Pkg\\.Revision\\s*=\\s*'+item.version.replaceAll('.','\\.')+'\\s*$','mu').test(text))fail('SDK组件版本不符：'+item.path);}return payload;};
 let payload=await verify(target);if(!payload){if(options.offline)fail('离线缺少SDK闭包');const pending=await fixedScratch(join(await resourceWork(options.library.work),'.android-'));try{payload=join(pending,'payload');await mkdir(payload);for(const item of packages){const at=join(payload,...item.path.split(';'));await directory(dirname(at),true);if(item.source){const file=await acquireOfficialPlatform(item,options),unpacked=join(pending,'unpack');try{await extractArchive(file,unpacked,{signal:options.signal});const names=await readdir(unpacked);if(names.length!==1)fail('额外平台归档根不唯一');await rename(join(unpacked,names[0]),at);await rm(unpacked,{recursive:true});if(await platformTreeDigest(at)!==item.sha256)fail('额外平台发行件树摘要不符');}finally{await rm(file,{force:true});}}else{const file=await packageOriginal(item,options),unpacked=join(pending,'unpack');await extractArchive(file,unpacked,{signal:options.signal});await rename(item.root==='.'?unpacked:join(unpacked,item.root),at);if(await stat(unpacked))await rm(unpacked,{recursive:true});}}await permissions(payload,false);await writeFile(join(pending,'receipt.json'),JSON.stringify({sha256,files:await inventory(payload)}),{flag:'wx',mode:0o444});await commitCandidate(pending,target,{signal:options.signal,verify});payload=await verify(target);}finally{if(await stat(pending)){await permissions(pending,true);await rm(pending,{recursive:true});}}}
 const toolPayload=payload;
 if(library.supply&&options.platformView)payload=await options.platformView(payload,wanted,androidPlatformDefinitions);
 const versions=id=>library.tools.find(x=>x.id===id)?.version;for(const [id,file]of [['android','platform-tools/adb'],['android-sdk','cmdline-tools/'+versions('android-sdk')+'/bin/sdkmanager'],['android-ndk','ndk/'+versions('android-ndk')+'/ndk-build'],['cmake','cmake/'+versions('cmake')+'/bin/cmake']])if(library.requested.some(x=>x.id===id))library.installed.set(id,{path:join(toolPayload,file),version:versions(id)});
 return {ANDROID_HOME:payload,ANDROID_SDK_ROOT:payload,ANDROID_NDK_HOME:join(toolPayload,'ndk',versions('android-ndk')),ANDROID_USER_HOME:join(library.work,'android-user'),ANDROID_EMULATOR_HOME:join(library.work,'android-user')};
}
async function appleEnvironment(library,options){if(!library.installed.has('xcode'))return {};const mapping={xcodebuild:'XCODEBUILD',codesign:'CODESIGN',security:'SECURITY',xcrun:'XCRUN','xcode-select':'XCODE_SELECT',clang:'CC','clang++':'CXX',swiftc:'SWIFT',otool:'OTOOL',install_name_tool:'INSTALL_NAME_TOOL',lipo:'LIPO',make:'MAKE',ar:'AR',ranlib:'RANLIB',nm:'NM',strip:'STRIP','llvm-nm':'LLVM_NM'};if(options.platform==='ios')mapping.xattr='XATTR';const apple=await verifyAppleTools(library,{names:Object.keys(mapping),signal:options.signal,environment:cleanEnvironment(options.environment)}),environment={DEVELOPER_DIR:apple.developerDirectory};const bin=join(library.work,'apple-tools');await directory(bin,true);for(const [name,key]of Object.entries(mapping)){environment[key]=apple.tools[name];const target=join(bin,name);if(await stat(target)){if(!((await lstat(target)).isSymbolicLink())||await realpath(target)!==await realpath(apple.tools[name]))fail('Apple任务入口漂移');}else await symlink(apple.tools[name],target);}environment.PATH=bin;environment.LD=apple.tools.clang;environment.LDCXX=apple.tools['clang++'];environment.CARGO_TARGET_AARCH64_APPLE_DARWIN_LINKER=apple.tools.clang;const sdk=(await exec(apple.tools.xcrun,['--sdk','macosx','--show-sdk-path'],{signal:options.signal,env:{PATH:'',DEVELOPER_DIR:apple.developerDirectory},timeout:60000})).stdout.trim();environment.SDKROOT=await realpath(sdk);if(!inside(apple.developerDirectory,environment.SDKROOT))fail('SDK越出Xcode');return environment;}
// 可选供给遵循唯一原件协议，产品独立解析本仓锁，拒绝旧快照和状态库回退。
async function readDependencySupply(objects) {
 if(!objects||!await stat(objects))return null;await directory(objects);const file=join(dirname(objects),'index.json');await regular(file);
 if((await lstat(file)).size>32*1024**2)fail('可选原件索引超限');const value=JSON.parse(await readFile(file,'utf8'));
 if(!value||typeof value!=='object'||Array.isArray(value)||JSON.stringify(Object.keys(value).sort())!==JSON.stringify(['git_sources','packages','pods','schema_version'])||value.schema_version!==2||!Array.isArray(value.packages)||!Array.isArray(value.git_sources)||!Array.isArray(value.pods))fail('可选原件索引协议无效');return value;
}
async function supplyObject(objects,sha256,signal){signal?.throwIfAborted();if(!/^[a-f0-9]{64}$/u.test(sha256||''))fail('供给原件摘要无效');const file=join(objects,sha256+'.blob');await regular(file);const data=await readFile(file);if(hash(data)!==sha256)fail('供给原件摘要不符');return data;}
// 只恢复当前Pod坐标，完成所有文件后再核对内部链接，随后仍由产品校验spec及固定来源。
async function materializePodSupply(pod,objects,destination,{signal}={}) {
 signal?.throwIfAborted();if(!pod)return false;const keys=['checksum','files','name','source','spec','version'];if(JSON.stringify(Object.keys(pod).sort())!==JSON.stringify(keys)||!/^[A-Za-z0-9_.+-]+$/u.test(pod.name||'')||!/^[0-9A-Za-z][0-9A-Za-z._+-]*$/u.test(pod.version||'')||!/^[a-f0-9]{40}$/u.test(pod.checksum||'')||!Array.isArray(pod.files)||!pod.files.length)fail('Pod供给坐标无效');
 const md5=createHash('md5').update(pod.name).digest('hex'),url='https://cdn.cocoapods.org/Specs/'+md5[0]+'/'+md5[1]+'/'+md5[2]+'/'+pod.name+'/'+pod.version+'/'+pod.name+'.podspec.json';if(JSON.stringify(Object.keys(pod.spec||{}).sort())!==JSON.stringify(['sha256','url'])||pod.spec.url!==url)fail('Pod spec来源无效');
 const spec=await supplyObject(objects,pod.spec.sha256,signal),value=JSON.parse(spec);if(value.name!==pod.name||value.version!==pod.version||JSON.stringify(value.source)!==JSON.stringify(pod.source))fail('Pod spec与发布坐标漂移');podSourceCoordinate(value);
 const key=pod.version+'-'+pod.checksum.slice(0,5),release=join(destination,'cache/Pods/Release',pod.name,key),specFile=join(destination,'cache/Pods/Specs/Release',pod.name,key+'.podspec.json'),paths=new Set();
 for(const entry of pod.files){if(!safePath(entry.path)||paths.has(entry.path))fail('Pod发布路径无效或重复');paths.add(entry.path);const target=join(release,entry.path);await directory(dirname(target),true);
  if(entry.type==='file'&&JSON.stringify(Object.keys(entry).sort())===JSON.stringify(['executable','path','sha256','type'])&&typeof entry.executable==='boolean'){const bytes=await supplyObject(objects,entry.sha256,signal);if(await stat(target)){await regular(target);if(hash(await readFile(target))!==entry.sha256)fail('Pod任务缓存漂移');}else await writeFile(target,bytes,{flag:'wx'});await chmod(target,entry.executable?0o755:0o644);}
  else if(!(entry.type==='link'&&JSON.stringify(Object.keys(entry).sort())===JSON.stringify(['path','target','type'])&&typeof entry.target==='string'&&entry.target&&!entry.target.startsWith('/')&&!entry.target.includes('\\')&&safePath(posix.normalize(posix.join(posix.dirname(entry.path),entry.target)))))fail('Pod发布条目或链接无效');
 }
 for(const entry of pod.files.filter(x=>x.type==='link')){signal?.throwIfAborted();const target=join(release,entry.path);if(await stat(target)){if(!(await lstat(target)).isSymbolicLink()||await readlink(target)!==entry.target)fail('Pod链接漂移');}else await symlink(entry.target,target);}
 const tree=await inventory(release),nodes=tree.filter(x=>!x.directory);if(nodes.length!==paths.size||nodes.some(x=>!paths.has(x.path))||tree.some(x=>x.directory&&![...paths].some(path=>path.startsWith(x.path+'/'))))fail('Pod发布树混入状态或未登记项');for(const entry of pod.files.filter(x=>x.type==='link')){const target=await realpath(join(release,entry.path));if(!inside(release,target))fail('Pod内部链接越界');}
 await directory(dirname(specFile),true);if(await stat(specFile)){await regular(specFile);if(hash(await readFile(specFile))!==pod.spec.sha256)fail('Pod任务spec漂移');}else await writeFile(specFile,spec,{flag:'wx'});return true;
}
// Maven只接纳登记中的具体上游文件；URL同时确定后缀、分类器及下载文件名。
function mavenOriginal(entry){
 if(entry.ecosystem!=='maven'||JSON.stringify(Object.keys(entry).sort())!==JSON.stringify(['archives','ecosystem','name','version'])||!/^[0-9A-Za-z][0-9A-Za-z._+-]*$/u.test(entry.version||'')||/^(?:LATEST|RELEASE)$/u.test(entry.version)||entry.version.endsWith('-SNAPSHOT')||entry.archives?.length!==1)fail('Maven登记坐标无效');
 const [group,artifact,...extra]=entry.name.split(':');if(extra.length||!/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/u.test(group||'')||!/^[A-Za-z0-9_.-]+$/u.test(artifact||''))fail('Maven登记名称无效');
 const archive=entry.archives[0];if(JSON.stringify(Object.keys(archive).sort())!==JSON.stringify(['integrity','sha256','url']))fail('Maven原件字段无效');const url=new URL(checkedURL(archive.url)),bases={'repo.maven.apache.org':'/maven2/','dl.google.com':'/dl/android/maven2/','plugins.gradle.org':'/m2/','storage.googleapis.com':'/download.flutter.io/','jitpack.io':'/'},base=bases[url.hostname],prefix=base+group.replaceAll('.','/')+'/'+artifact+'/'+entry.version+'/',leaf=url.pathname.slice(prefix.length),filename=artifact+'-'+entry.version;
 if(!base||url.href!==archive.url||url.search||url.hash||url.port||!url.pathname.startsWith(prefix)||!leaf.startsWith(filename+'.')&&!leaf.startsWith(filename+'-')||!/^[A-Za-z0-9_.+-]+\.(?:jar|aar|pom|module)$/u.test(leaf)||url.hostname==='jitpack.io'&&(group!=='com.github.davidliu'||artifact!=='audioswitch'||!/^[a-f0-9]{40}$/u.test(entry.version)))fail('Maven登记不是准确上游来源');
 return {archive,source:url.origin+base,path:url.pathname.slice(base.length)};
}
// 只复制不可变原件到本轮独占Maven仓库，按上游分区避免同坐标不同来源相互覆盖。
async function materializeMavenCache(objects,work,{signal}={}) {
 signal?.throwIfAborted();await directory(work);const index=await readDependencySupply(objects);if(!index)return [];const records=index.packages.filter(x=>x.ecosystem==='maven').map(mavenOriginal);if(!records.length)return [];
 const destination=join(work,'dependencies/maven');await directory(dirname(destination),true);const repos=[...new Set(records.map(x=>x.source))].sort().map(source=>({source,directory:join(destination,hash(source))}));
 const verify=async root=>{const paths=new Map();for(const record of records){signal?.throwIfAborted();const path=hash(record.source)+'/'+record.path,prior=paths.get(path);if(prior&&prior!==record.archive.sha256)fail('Maven同源文件内容冲突');paths.set(path,record.archive.sha256);const file=join(root,path);await regular(file);const bytes=await readFile(file);if(hash(bytes)!==record.archive.sha256||verifyBytes(bytes,{integrity:record.archive.integrity})!==record.archive.sha256)fail('Maven任务原件摘要不符');}const tree=await inventory(root),files=tree.filter(x=>!x.directory);if(files.length!==paths.size||files.some(x=>!x.sha256||!paths.has(x.path))||tree.some(x=>x.directory&&![...paths.keys()].some(path=>path.startsWith(x.path+'/'))))fail('Maven任务仓库混入状态或未登记项');};
 if(await stat(destination)){await directory(destination);await verify(destination);return repos;}
 const candidate=await fixedScratch(join(dirname(destination),'.maven-'));try{for(const record of records){signal?.throwIfAborted();const bytes=await supplyObject(objects,record.archive.sha256,signal);verifyBytes(bytes,{integrity:record.archive.integrity});const file=join(candidate,hash(record.source),record.path);await directory(dirname(file),true);if(await stat(file)){await regular(file);if(hash(await readFile(file))!==record.archive.sha256)fail('Maven同源文件冲突');}else await writeFile(file,bytes,{flag:'wx',mode:0o644});}await verify(candidate);signal?.throwIfAborted();await rename(candidate,destination);await verify(destination);return repos;}finally{await rm(candidate,{recursive:true,force:true});}
}
// 已验真原件按原始URL交给Gradle自身缓存；不再预判所有平台变体是否齐全。
// 按Gradle本次实际离线参数接入同源文件视图，普通执行继续使用原HTTPS仓库。
function mavenSupplyInit(repositories) {
 const quote=value=>"'"+value.replaceAll('\\','\\\\').replaceAll("'","\\'")+"'";
 const supplied='['+repositories.map(x=>'[source:'+quote(x.source)+', directory:'+quote(x.directory)+']').join(',')+']',originals=[];
 for(const repository of repositories){const visit=directory=>{if(realpathSync(directory)!==directory||!lstatSync(directory).isDirectory())fail('Maven任务目录无效');for(const name of readdirSync(directory).sort()){const file=join(directory,name),info=lstatSync(file);if(info.isDirectory())visit(file);else{if(!info.isFile()||info.nlink!==1||realpathSync(file)!==file)fail('Maven任务原件不是独占普通文件');originals.push({url:repository.source+relative(repository.directory,file).split(sep).join('/'),path:file,sha256:hash(readFileSync(file))});}}};visit(repository.directory);}
 // 大库清单作为分段JSON数据解析，避免Groovy逐条Map生成超过JVM方法或常量大小。
 const chunks=JSON.stringify(originals).match(/[\s\S]{1,8192}/gu)||['[]'];
 const entries='['+chunks.map(quote).join(',')+'].join(\'\')';
 return `// 本轮原件接入登记Gradle9.1.0，不改产品仓库、版本或上游元数据。
import org.gradle.api.internal.artifacts.ivyservice.modulecache.FileStoreAndIndexProvider
import org.gradle.api.internal.artifacts.ivyservice.ArtifactCachesProvider
import org.gradle.internal.resource.metadata.DefaultExternalResourceMetaData
import org.gradle.internal.resource.ExternalResourceReadBuildOperationType
import org.gradle.internal.operations.BuildOperationListener
import org.gradle.internal.operations.BuildOperationListenerManager
import java.nio.file.Files
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import groovy.json.JsonOutput
import groovy.json.JsonSlurper
import org.gradle.api.artifacts.repositories.MavenArtifactRepository
def supplied = ${supplied}
def originals = new JsonSlurper().parseText(${entries})
def home = gradle.gradleUserHomeDir.canonicalFile
def stores = gradle.services.get(FileStoreAndIndexProvider)
def caches = gradle.services.get(ArtifactCachesProvider)
def urls = ConcurrentHashMap.newKeySet()
def sha = { file -> MessageDigest.getInstance('SHA-256').digest(file.bytes).encodeHex().toString() }
originals.each { record ->
  def file = new File(record.path)
  if (file.canonicalPath != record.path || !file.isFile() || sha(file) != record.sha256) throw new GradleException('Maven任务原件内容漂移')
  def url = record.url
  def expected = record.sha256
  caches.withWritableCache({ metadata, cache -> cache.useCache({
   def existing = stores.externalResourceIndex.lookup(url)
   if (existing?.cachedFile != null && sha(existing.cachedFile) != expected) throw new GradleException('Maven任务缓存内容漂移')
   def saved = stores.externalResourceFileStore.add(url) { destination -> Files.copy(file.toPath(), destination.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING) }
   if (sha(saved.file) != expected) throw new GradleException('Maven任务原件复制漂移')
   stores.externalResourceIndex.store(url, saved.file, new DefaultExternalResourceMetaData(new URI(url), 0L, file.length()))
  } as Runnable); null } as java.util.function.BiFunction)
}
// 记录Gradle实际读取的URL及其原生缓存文件，不从缓存文件名拼下载地址。
def manager = gradle.services.get(BuildOperationListenerManager)
def listener = [started:{ descriptor, event -> }, progress:{ id, event -> }, finished:{ descriptor, event ->
 if (event.failure == null && descriptor.details instanceof ExternalResourceReadBuildOperationType.Details) urls.add(descriptor.details.location.toString())
}] as BuildOperationListener
manager.addListener(listener)
gradle.buildFinished {
 try {
  def records = []
  urls.toList().sort().each { url ->
   def cached = stores.externalResourceIndex.lookup(url)
   if (cached?.cachedFile != null && url.matches('https://.*[.](jar|aar|pom|module)')) {
    def file = cached.cachedFile.canonicalFile
    if (!file.toPath().startsWith(home.toPath())) throw new GradleException('Maven下载文件越界')
    records.add([url:url, path:file.path, sha256:sha(file)])
   }
  }
  new File(home, 'maven-downloads-' + UUID.randomUUID() + '.json').setText(JsonOutput.toJson(records), 'UTF-8')
 } finally { manager.removeListener(listener) }
}
// 实际Build可能在资源准备后才启用--offline，必须按当前Gradle参数接入已验真原件。
if (gradle.startParameter.offline) {
def attach = { repositories ->
 def seen = [] as Set
 repositories.all { original ->
  if (original instanceof MavenArtifactRepository && !original.name.startsWith('productOriginal_')) {
   def source = original.url.toString().replaceAll('/+$', '') + '/'
   def record = supplied.find { it.source == source }
   if (record != null && seen.add(original.name)) {
    def local = repositories.maven { name = 'productOriginal_' + original.name; url = new File(record.directory).toURI(); metadataSources { gradleMetadata(); mavenPom() } }
    repositories.remove(local)
    repositories.add(repositories.indexOf(original), local)
   }
  }
 }
}
gradle.beforeSettings { settings -> attach(settings.pluginManagement.repositories); attach(settings.dependencyResolutionManagement.repositories) }
gradle.beforeProject { project -> attach(project.buildscript.repositories); attach(project.repositories) }
}`;
}
// 远程Pod必须同时交付锁定spec与完整源码；本地路径Pod由本轮产品工程产生。
function checkCocoaPodsResources(lockfile,directory) {
 const text=readFileSync(lockfile,'utf8'),local=[...text.matchAll(/^  ([A-Za-z0-9_.+-]+):\n    :path: /gmu)].map(x=>x[1]);const checksums=new Map([...text.matchAll(/^  ([A-Za-z0-9_.+-]+): ([a-f0-9]{40})$/gmu)].map(x=>[x[1],x[2]]));
 for(const match of text.matchAll(/^  - "?([A-Za-z0-9_.+-]+)(?:\/[A-Za-z0-9_.+-]+)* \(([^()\s]+)\)"?/gmu)){const [,name,version]=match;if(local.includes(name))continue;const checksum=checksums.get(name);if(!checksum)fail('远程Pod缺少锁定spec摘要');const key=version+'-'+checksum.slice(0,5),spec=join(directory,'cache/Pods/Specs/Release',name,key+'.podspec.json'),release=join(directory,'cache/Pods/Release',name,key);if(!existsSync(spec)||!existsSync(release))fail('锁定CocoaPods原件尚未完整存在：'+name);}
 return {paths:local.map(name=>({name}))};
}
// 只取得实际Release编译、运行闭包；不解析debug/profile及Kotlin通用元数据。
function gradleResourceInit(){return "import org.gradle.api.artifacts.component.ModuleComponentIdentifier\nallprojects { p ->\n p.tasks.register(\"productResolveResources\") {\n  doLast {\n   def configurations = [p.configurations.findByName('releaseCompileClasspath'), p.configurations.findByName('releaseRuntimeClasspath'), p.buildscript.configurations.findByName('classpath')].findAll { it != null && it.canBeResolved }\n   configurations.each { configuration ->\n    configuration.incoming.artifactView {\n     componentFilter { component -> component instanceof ModuleComponentIdentifier }\n    }.files.files\n   }\n  }\n }\n}\n";}
async function prepareGradleResources(work,options,environment,projectEnvironment){const owner=await import('./build.mjs');owner.checkWork(work);const gradle=options.library.installed.get('gradle');if(!gradle)return;if(projectEnvironment?.PRODUCT_WORK_DIR!==work||typeof projectEnvironment.PATH!=='string'||!projectEnvironment.PATH)fail('Gradle工程环境未绑定当前任务');const home=join(work,'dependencies/gradle');await directory(home,true);environment.GRADLE_USER_HOME=home;
 // Maven视图与初始化脚本仅属于本轮产品，缺少可选供给时按既有产品仓库独立解析。
 const mirrors=await materializeMavenCache(options.optionalDependencies,work,{signal:options.signal});{const initDirectory=join(home,'init.d'),initFile=join(initDirectory,'product-originals.gradle'),text=mavenSupplyInit(mirrors);await directory(initDirectory,true);if(await stat(initFile)){await regular(initFile);if(await readFile(initFile,'utf8')!==text)fail('Maven资源初始化漂移');}else await writeFile(initFile,text,{flag:'wx'});}

 const projects=[];async function find(path,depth=0){if(depth>12)return;for(const name of await readdir(path)){if(['dependencies','git-sources','.git','tmp','cache','config','apple-tools','resource-tools'].includes(name))continue;const file=join(path,name),s=await lstat(file);if(s.isDirectory())await find(file,depth+1);else if(name==='settings.gradle'||name==='settings.gradle.kts')projects.push(dirname(file));}}await find(work);
 for(const project of projects.filter(x=>x.endsWith('/android'))){const flutter=options.library.installed.get('flutter');if(flutter&&!await stat(join(dirname(project),'flutter-gradle')))await flutterRecipe.prepareFlutterTaskTools(dirname(dirname(flutter.path)),dirname(project),'android',{signal:options.signal,environment:{...environment,JAVA_HOME:dirname(dirname(options.library.installed.get('java').path)),GRADLE_HOME:dirname(dirname(gradle.path)),PRODUCT_BASH_BIN:options.library.installed.get('bash').path}});
  const init=join(work,'gradle-resource-init.gradle');if(!await stat(init))await writeFile(init,gradleResourceInit());
  let resolutionFailure;try{
  await exec(gradle.path,['--no-daemon','--console=plain','--init-script',init,...(options.offline?['--offline']:[]),'-Ptarget-platform=android-arm64','productResolveResources'],{cwd:project,signal:options.signal,timeout:1800000,maxBuffer:8*1024**2,env:{...environment,...projectEnvironment,JAVA_HOME:dirname(dirname(options.library.installed.get('java').path)),PATH:projectEnvironment.PATH}});
  }catch(error){resolutionFailure=error;}
  // 下载成功的原件即使后续闭包失败也验真保存；取消不提交，失败不被保存操作掩盖。
  options.signal?.throwIfAborted();
  if(options.publishMaven)try{await options.publishMaven(home);}catch(error){if(!resolutionFailure)throw error;throw Error('Gradle闭包解析与Maven原件保存均失败');}
  if(resolutionFailure)throw resolutionFailure;
 }
}
const buildSourceTool=sourceRecipe.buildSourceTool;
const posixNames=posixRecipe.posixNames;
function resourceDeclarations(){return {tools:toolDefinitions,parsers:parserDefinitions,android:androidDefinitions,pods:podSourceDefinitions};}
// 完整入口可由调用方的启动Node进入；产品自行取得锁定Node并重新进入自己的入口。
// 启动Node只执行内置下载/摘要/解包，不成为产品编译工具版本的第二真源。
async function bootstrapNode(work,options={}) {
 const owner=await import('./build.mjs');owner.checkWork(work);const environment=options.environment||process.env;
 if(process.platform!=='darwin'||process.arch!=='arm64')fail('本机入口仅支持声明的macOS ARM宿主');
 const store=options.storeRoot||join(homedir(),'.local/share/product-resources');
 if(inside(root,store)||inside(store,root)||inside(work,store)||inside(store,work)||store===work)fail('启动原件库边界交叉');
 const library={root:join(store,'tools'),work,tools:toolDefinitions,installed:new Map()};await directory(library.root,true);
 const context={environment,offline:false,fetcher:fetch,...options,library,optionalTools:environment.PRODUCT_TOOL_ROOT,
  optionalDependencies:environment.PRODUCT_DEPENDENCY_ROOT?join(environment.PRODUCT_DEPENDENCY_ROOT,'objects'):undefined};
 return installTool(library,toolDefinitions.find(x=>x.id==='node'),context);
}

// 构建进程在明确供给模式下只请求和验真；获取、保存及配方执行由供给宿主拥有。
async function resources(platform,work,previous={},options={}){
 if(options.supply){const receipt=await options.supply(previous);if(receipt.run_id!==previous.run_id)fail('资源供给任务身份不符');const owner=await import('./build.mjs');owner.resourceEnvironment(platform,work,receipt,options.environment||{});return receipt;}
 return materializeResources(platform,work,previous,options);
}
// 公开准备配方供宿主动态调用；产品不导入私有控制台实现，不复制需求或配方。
async function prepareResourceSupply(platform,work,previous,options){
 if(!options||typeof options.acquireOriginal!=='function'||!options.toolRoot||!options.dependencyRoot)fail('供给准备缺少原件能力');
 for(const path of [options.toolRoot,options.dependencyRoot])await directory(path);
 const receipt=await resourceSupplies.run({...options,work},()=>materializeResources(platform,work,previous,options));
 receipt.environment??={};receipt.environment["CITIZENWALLET_RESOURCE_MODE"]='provided';return receipt;
}
async function materializeResources(platform,work,previous={},options={}){
 const owner=await import('./build.mjs');owner.checkWork(work);const request=()=>owner.requirements(platform,work);const requirement=request(),environment=options.environment||process.env;
 if(previous.schema!==undefined&&(previous.schema!==1||previous.product_id!==requirement.product_id||previous.platform!==platform||previous.work!==work))fail('资源请求身份无效');options={environment,fetcher:fetch,offline:false,...options};options.signal?.throwIfAborted();
 const store=options.storeRoot||join(homedir(),'.local/share/product-resources'),optionalTools=options.toolRoot||environment.PRODUCT_TOOL_ROOT,optionalDependencies=options.dependencyRoot?join(options.dependencyRoot,'objects'):environment.PRODUCT_DEPENDENCY_ROOT?join(environment.PRODUCT_DEPENDENCY_ROOT,'objects'):undefined;
 if(!options.toolRoot)await directory(store,true);if(inside(root,store)||inside(store,root)||inside(work,store)||inside(store,work)||store===work)fail('原件库与源码或工作区交叉');
 // tools承载工具发行件/编译输入，rely承载产品依赖原件；不把可写任务缓存混入任一原件库。
 const library={root:options.toolRoot||join(store,'tools'),supply:Boolean(options.toolRoot),work,tools:toolDefinitions,requested:requirement.tools,installed:new Map(),androidPlatforms:androidPlatformDefinitions};await directory(library.root,true);options={...options,platform,optionalTools,optionalDependencies,library,dependencyRoot:options.dependencyRoot||join(store,'rely'),sources:requirement.sources};
 for(const request of requirement.tools){const definition=toolDefinitions.find(x=>x.id===request.id);if(!definition||definition.version!==request.version)fail('需求与产品自己的工具配方不一致：'+request.id);}
 // Node与其它工具同样按本产品声明准备，只消费实际入口。
 const node=toolDefinitions.find(x=>x.id==='node');if(process.platform!=='darwin'||process.arch!=='arm64')fail('本机资源配方仅支持已声明macOS ARM宿主');await installTool(library,node,options);if(!library.supply){}if(hash(await readFile(process.execPath))!==hash(await readFile(library.installed.get('node').path)))fail('运行Node不是产品声明的官方入口字节');
 const android=requirement.tools.some(x=>['android','android-sdk','android-ndk'].includes(x.id));for(const request of requirement.tools){if(android&&['android','android-sdk','android-ndk','cmake'].includes(request.id))continue;await installTool(library,toolDefinitions.find(x=>x.id===request.id),options);}
 const receipt={schema:1,product_id:requirement.product_id,platform,work,tools:Object.fromEntries(library.installed),dependencies:{},archives:{},environment:{},offline:true};for(const key of ['run_id','program_digest'])if(previous[key]!==undefined)receipt[key]=previous[key];
 for(const id of ['posix','bash','grep','sed'])await installTool(library,toolDefinitions.find(x=>x.id===id),options);receipt.tools=Object.fromEntries(library.installed);const foundation=await productFoundation(library,async(_,t)=>library.installed.get(t.id));receipt.environment=await appleEnvironment(library,options);receipt.environment.PATH=[receipt.environment.PATH,foundation.path,...[...library.installed].filter(([id])=>id!=='posix').map(([,x])=>dirname(x.path))].filter(Boolean).join(':');receipt.environment.PRODUCT_WORK_DIR=work;
 if(android)Object.assign(receipt.environment,await installAndroidResources(options));receipt.tools=Object.fromEntries(library.installed);
 for(const source of requirement.sources)await gitCheckout(source,join(work,'git-sources',source.name),options);
 // 归属扩展由本产品判断：prepare产生的原生源码根也只能在同一work中消费。
 const groups=new Map();for(const lock of requirement.locks){const name=lock.source_package||'own';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(lock);}for(const [name,locks]of groups){const base=name==='own'?root:owner.resourceSourceRoot(name,work);await directory(base);const files=kind=>locks.filter(x=>x.ecosystem===kind).map(x=>{if(!safePath(x.path))fail('锁路径越界');return join(base,x.path);}),target=join(work,'dependencies',name);await directory(target,true);let result={request:JSON.stringify(locks)};
  if(files('npm').length)Object.assign(result,await prepareNpm(files('npm'),target,options));if(files('cargo').length)Object.assign(result,await prepareCargo(files('cargo'),target,options));if(files('pub').length)Object.assign(result,await preparePub(files('pub'),join(target,'pub'),options));for(const file of files('cocoapods'))await preparePods(file,join(work,'dependencies'),options);receipt.dependencies[name]=result;
 }
 for(const item of requirement.archives){if(!safePath(item.group))fail('归档分组无效');const file=await packageOriginal(item,options),directory=join(work,'dependencies/archives',item.group);await directoryCheck(directory).catch(async e=>{if(e.code!=='ENOENT')throw e;await directoryCheck(work);await mkdir(directory,{recursive:true});});const path=join(directory,item.sha256+'.blob');if(!await stat(path))await copyFile(file,path,constants.COPYFILE_EXCL);await regular(path);if(hash(await readFile(path))!==item.sha256)fail('任务归档篡改');(receipt.archives[item.group]??=[]).push({...item,path});}
 const flutter=library.installed.get('flutter');if(flutter){const sdk=dirname(dirname(flutter.path));receipt.environment.DART_EXECUTABLE=join(sdk,'bin/cache/dart-sdk/bin/dart');const os=platform.endsWith('ios')?'ios':platform.endsWith('macos')?'macos':null;if(os&&!await stat(join(work,'flutter-tools'))){const delivery=await flutterRecipe.prepareFlutterTaskTools(sdk,work,os,{signal:options.signal,environment:{PRODUCT_BASH_BIN:library.installed.get('bash').path,PRODUCT_RSYNC_BIN:foundation.tools.rsync}});if(delivery.PATH)receipt.environment.PATH=delivery.PATH+':'+receipt.environment.PATH;}if(os)receipt.environment.PATH=join(work,'flutter-tools')+':'+receipt.environment.PATH;receipt.environment.PRODUCT_RSYNC_BIN=foundation.tools.rsync;receipt.environment.PRODUCT_BASH_BIN=library.installed.get('bash').path;}
 await prepareGradleResources(work,options,receipt.environment,owner.resourceEnvironment(platform,work,receipt,cleanEnvironment(environment)));options.signal?.throwIfAborted();if(JSON.stringify(request())!==JSON.stringify(requirement)){if((options.depth||0)>=8)fail('资源递归闭包超限');return materializeResources(platform,work,receipt,{...options,depth:(options.depth||0)+1});}owner.resourceEnvironment(platform,work,receipt,cleanEnvironment(environment));return receipt;
}

// 公开声明与候选配方；供给对象的领取、提交及删除只由调度方实现。
function supplyRequirements(){
 const wanted=toolDefinitions.filter(tool=>tool.id!=='xcode').map(tool=>{const archive=toolArchive(tool);return {...tool,archive,slots:[...new Set([archive?.executable,...(tool.slots||[])].filter(Boolean))]};});
 const xcode=toolDefinitions.find(tool=>tool.id==='xcode');
 return {tools:wanted,apple:{version:xcode.version,source:xcode.source,names:[...new Set([...Object.keys(appleSystemTools),...appleBundleTools])]}};
}
function assertWorkQuiescent(work){for(const pid of supplyGroups.get(work)||[])try{process.kill(-pid,0);fail('资源工具退出未确认');}catch(error){if(error.code!=='ESRCH')throw error;}if(retainedResourcePath(work))fail('资源工具退出未确认');}
async function prepareToolSupply(tool,{original,payload,work,signal,offline,acquireOriginal,acquireTool,acquireApple,publishCandidate,environment,finalPayload}){
 const at=await fixedScratch(join(work,'.tool-recipe-'+tool.id+'-'+randomUUID()));
 const library={root:at,work,tools:toolDefinitions,installed:new Map(),requested:[],androidPlatforms:typeof androidPlatformDefinitions==='undefined'?[]:androidPlatformDefinitions};
 const context={work,toolRoot:at,dependencyRoot:join(work,'dependencies'),acquireOriginal,acquireTool,acquireApple,publishCandidate,preparingTool:true};
 try{return await resourceSupplies.run(context,async()=>{
  const definition=toolDefinitions.find(entry=>entry.id===tool.id);if(!definition)fail('工具配方未声明');
  const ids=[...(definition.requires||[]),...(!['node','posix'].includes(tool.id)?['posix',...(['bash','grep','sed'].includes(tool.id)?[]:['bash','grep','sed'])]:[])];
  for(const id of new Set(ids)){if(id==='xcode'){const apple=await acquireApple({...supplyRequirements().apple,names:['xcodebuild']});library.installed.set(id,{path:apple.tools.xcodebuild,version:toolDefinitions.find(t=>t.id===id).version});}else{const entry=supplyRequirements().tools.find(t=>t.id===id);if(!entry)fail('工具前置未声明');library.installed.set(id,await acquireTool(entry));}}
  const value=await installTool(library,definition,{library,signal,offline,environment,finalPayload,dependencyRoot:context.dependencyRoot});
  const executable=toolArchive(definition).executable,built=value.path.slice(0,-executable.length-1);await chmod(built,0o700);await rm(payload,{recursive:true,force:true});await rename(built,payload);
  return {schema:1,id:tool.id,version:tool.version,payload,original};
 });}finally{assertWorkQuiescent(work);await rm(at,{recursive:true,force:true});}
}

// 本产品Android配方已有的准确官方仓库来源；仅用于同版本发布文件回验。
const mavenSources=Object.freeze(['https://dl.google.com/dl/android/maven2/','https://repo.maven.apache.org/maven2/','https://storage.googleapis.com/download.flutter.io/','https://plugins.gradle.org/m2/']);

// 消费前按产品配方回验供给工具；资源宿主回执本身不能替代原件字节检查。

async function preparePlatformSupply(entry,{toolRoot,work,directory:existing,signal,offline,fetcher=fetch}){
 const owner=await import('./build.mjs');owner.checkWork(work);await directory(toolRoot);
 const target=join(toolRoot,'shared','platform-'+entry.sha256),verifyTree=async path=>{await directory(path);if(await platformTreeDigest(path)!==entry.sha256)fail('平台供给树摘要不符');return path;},verify=async path=>{if(!await stat(path))return null;await directory(path);return verifyTree(join(path,'payload'));};
 const saved=await verify(target);if(saved)return saved;signal?.throwIfAborted();
 const pending=await fixedScratch(join(await resourceWork(work),'.platform-'));
 try{const payload=join(pending,'payload');if(existing){await verifyTree(existing);await copyPodSource(existing,payload);}
  else{const file=await acquireOfficialPlatform(entry,{offline,fetcher,signal,library:{work}});try{await extractArchive(file,payload,{signal});const names=await readdir(payload);if(names.length!==1)fail('平台归档根不唯一');const selected=join(pending,'selected');await rename(join(payload,names[0]),selected);await rm(payload,{recursive:true});await rename(selected,payload);}finally{await rm(file,{force:true});}}
  await verifyTree(payload);await permissions(payload,false);await commitCandidate(pending,target,{signal,verify});return verify(target);
 }finally{if(await stat(pending)){await permissions(pending,true);await rm(pending,{recursive:true,force:true});}}
}

// SDK以产品自己的组件声明、完整回执和额外平台树共同验真，不能仅凭执行器存在接受。
async function verifyAndroidSupply(receipt){
 const versions=name=>toolDefinitions.find(x=>x.id===name).version;
 const names={android:'platform-tools/adb','android-sdk':'cmdline-tools/'+versions('android-sdk')+'/bin/sdkmanager','android-ndk':'ndk/'+versions('android-ndk')+'/ndk-build',cmake:'cmake/'+versions('cmake')+'/bin/cmake'};
 let payload;for(const [id,relative]of Object.entries(names)){const value=receipt.tools[id];if(!value)continue;const suffix='/shared/android/payload/'+relative;if(!value.path.endsWith(suffix)||await realpath(value.path)!==value.path)fail('SDK供给执行器路径漂移');const current=value.path.slice(0,-relative.length-1);if(payload&&payload!==current)fail('SDK供给组件不属于同一原件');payload=current;}
 const object=dirname(payload);await directory(payload);await regular(join(object,'receipt.json'));
 const saved=JSON.parse(await readFile(join(object,'receipt.json'),'utf8')),cmake=toolDefinitions.find(x=>x.id==='cmake'),packages=androidDefinitions.map(x=>x.tool?{path:'cmake;'+cmake.version,version:cmake.version,...cmake.archives.macos}:x);
 if(saved.sha256!==hash(JSON.stringify(packages))||JSON.stringify(saved.files)!==JSON.stringify(await inventory(payload)))fail('SDK供给原件回执不符');
 for(const entry of packages){const text=await readFile(join(payload,...entry.path.split(';'),'source.properties'),'utf8');if(!new RegExp('^Pkg\\.Revision\\s*=\\s*'+entry.version.replaceAll('.','\\.')+'\\s*$','mu').test(text))fail('SDK供给组件版本不符');}
 const home=receipt.environment.ANDROID_HOME;if(home!==receipt.environment.ANDROID_SDK_ROOT||home!==payload&&home!==join(receipt.work,'android-sdk-view'))fail('SDK供给工作视图越界');
 const requested=(await import('./build.mjs')).requirements(receipt.platform,receipt.work).tools.flatMap(x=>x.packages||[]);
 for(const request of requested){const entry=androidPlatformDefinitions.find(x=>x.path===request.path&&x.version===request.version),path=await realpath(join(home,...request.path.split(';')));if(!entry||await platformTreeDigest(path)!==entry.sha256)fail('SDK供给额外平台树摘要不符');}
}

// 内嵌测试：正式实现之后，仅由 node --test 直接运行本文件时注册。
if (inlineTestEntry) {
  void (async () => {
// 使用真实文件事务与受控HTTPS数据，禁止测试下载或安装真实工具。
const {test} = await import('node:test');
const { default: assert } = await import('node:assert/strict');
const {createHash} = await import('node:crypto');
const {mkdtemp,realpath,mkdir,readFile,writeFile,readdir,rm,symlink,chmod,lstat,rename} = await import('node:fs/promises');
const {dirname,join,resolve} = await import('node:path');
const { testRoot: tmpdir } = await import('./build.mjs');
const {spawnSync} = await import('node:child_process');
const {gzipSync} = await import('node:zlib');
const {acquireArchive,extractArchive,resourceDeclarations,normalizeCargoManifest,runResourceProcess,buildSourceTool,posixNames,podSourceCoordinate,readDependencySupply,materializeMavenCache,materializePodSupply,mavenSupplyInit,prepareGradleResources,materializePubCache,gradleResourceInit} = await Promise.resolve(resourceInternals);
const {contract} = await import('./build.mjs');
const hash=b=>createHash('sha256').update(b).digest('hex');
async function sandbox(t){const root=await realpath(await mkdtemp(join(tmpdir(),contract.product_id+'-resources-')));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
// 需要公开工作根的回归使用固定build现场，资源内部临时夹具仍使用sandbox。
async function fixedSandbox(t){const {fixedWork,checkFixedWork,finishFixedWork,clearFixedWork}=await Promise.resolve(targetInternals);const work=fixedWork('build/ios');if(existsSync(work))finishFixedWork(work);checkFixedWork(work,{create:true});t.after(()=>{if(existsSync(work))clearFixedWork(work);});return work;}
const archive=(body,url='https://example.invalid/locked.tgz')=>({url,sha256:hash(body)});
function tar(entries){const records=[];for(const {name,body='',type='0',target=''}of entries){const b=Buffer.from(body),h=Buffer.alloc(512);h.write(name,0,100);h.write('0000644\0',100);h.write('0000000\0',108);h.write('0000000\0',116);h.write(b.length.toString(8).padStart(11,'0')+'\0',124);h.write('00000000000\0',136);h.fill(32,148,156);h.write(type,156);h.write(target,157,100);h.write('ustar\0',257);h.write('00',263);h.write([...h].reduce((a,b)=>a+b,0).toString(8).padStart(6,'0')+'\0 ',148);records.push(h,b,Buffer.alloc((512-b.length%512)%512));}return gzipSync(Buffer.concat([...records,Buffer.alloc(1024)]));}
test('首次按锁取得；再次复用不联网，损坏原件不覆盖',async t=>{
 const root=await sandbox(t),body=Buffer.from('locked-source'),entry=archive(body);let requests=0;
 const options={store:root,fetcher:async()=>{requests++;return new Response(body);}};
 const file=await acquireArchive(entry,options);assert.equal(await readFile(file,'utf8'),'locked-source');
 assert.equal(await acquireArchive(entry,{...options,offline:true,fetcher:()=>assert.fail('离线联网')}),file);assert.equal(requests,1);
 await chmod(file,0o600);await writeFile(file,'corrupt');await assert.rejects(acquireArchive(entry,options),/摘要/);assert.equal(requests,1);assert.equal(await readFile(file,'utf8'),'corrupt');
});
test('错摘要、错来源、离线缺失、来源越权均失败关闭且无正式原件',async t=>{
 const root=await sandbox(t),body=Buffer.from('source'),entry=archive(body);let requests=0;
 await assert.rejects(acquireArchive(entry,{store:root,offline:true,fetcher:()=>assert.fail('离线联网')}),/离线/);
 await assert.rejects(acquireArchive(entry,{store:root,fetcher:async()=>{requests++;return new Response('wrong');}}),/摘要/);
 await assert.rejects(acquireArchive({...entry,url:['http', '://example.invalid/source'].join('')},{store:root}),/HTTPS/);
 const file=await acquireArchive(entry,{store:root,fetcher:async()=>new Response(body)});
 await assert.rejects(acquireArchive({...entry,url:'https://example.invalid/other'},{store:root,offline:true}),/离线/);
 assert.equal(await readFile(file,'utf8'),'source');assert.equal(requests,1);assert.equal((await readdir(root)).filter(x=>x.endsWith('.pending')||x.endsWith('.lock')).length,0);
});
test('可选供给按准确内容摘要验真，独立运行不需要供给目录',async t=>{
 const root=await sandbox(t),store=join(root,'store'),optional=join(root,'objects'),body=Buffer.from('shared-source'),entry=archive(body),source=join(optional,entry.sha256+'.blob');await mkdir(dirname(source),{recursive:true});await writeFile(source,body);
 const file=await acquireArchive(entry,{store,optional,offline:true,fetcher:()=>assert.fail('供给命中联网')});assert.equal(await readFile(file,'utf8'),'shared-source');await writeFile(source,'altered');assert.equal(await readFile(file,'utf8'),'shared-source');
 await assert.rejects(acquireArchive(entry,{store:join(root,'other'),optional,offline:true}),/摘要/);
});
test('取消下载清理本次候选；短锁只在提交阶段取得',async t=>{
 const root=await sandbox(t),entry=archive(Buffer.from('ab')),abort=new AbortController();
 const fetcher=async()=>new Response(new ReadableStream({start(controller){controller.enqueue(Buffer.from('a'));abort.abort();controller.close();}}));
 await assert.rejects(acquireArchive(entry,{store:root,fetcher,signal:abort.signal}));assert.deepEqual(await readdir(root),[]);
 let state;const file=await acquireArchive(entry,{store:root,fetcher:async()=>{state=await readdir(root);return new Response('ab');}});assert.deepEqual(state,[]);assert.equal(await readFile(file,'utf8'),'ab');
});
test('同对象并发提交只保留一份验真原件，不留全局下载锁',async t=>{
 const root=await sandbox(t),body=Buffer.from('concurrent'),entry=archive(body);let calls=0;const options={store:root,fetcher:async()=>{calls++;await new Promise(r=>setTimeout(r,10));return new Response(body);}};
 const paths=await Promise.all(Array.from({length:8},()=>acquireArchive(entry,options)));assert.equal(new Set(paths).size,1);assert.equal(await readFile(paths[0],'utf8'),'concurrent');assert.equal(calls,8);assert.deepEqual(await readdir(root),[paths[0].slice(root.length+1)]);
});
test('归档安全解包并隔离不同任务，拒绝路径和链接越界',async t=>{
 const root=await sandbox(t),source=join(root,'source.tgz'),data=tar([{name:'package/a',body:'source'},{name:'package/b',type:'2',target:'a'}]);await writeFile(source,data);
 const first=join(root,'first'),second=join(root,'second');await extractArchive(source,first,{prefix:'package'});await extractArchive(source,second,{prefix:'package'});assert.equal(await realpath(join(first,'b')),join(first,'a'));await writeFile(join(first,'a'),'task1');assert.equal(await readFile(join(second,'a'),'utf8'),'source');
 for(const [name,entries]of [['path',[{name:'../outside',body:'x'}]],['link',[{name:'package/a',body:'x'},{name:'package/b',type:'2',target:'../../outside'}]],['parent',[{name:'package/a',type:'2',target:'b'},{name:'package/a/child',body:'x'},{name:'package/b',body:'x'}]]]){const file=join(root,name+'.tgz');await writeFile(file,tar(entries));await assert.rejects(extractArchive(file,join(root,name),{prefix:name==='path'?'':'package'}),/越界|父目录/);assert.equal((await readdir(root)).includes(name),false);}
});
test('链接原件目录、重复成员与解包取消拒绝且不写第三方目录',async t=>{
 const root=await sandbox(t),external=join(root,'external'),link=join(root,'link');await mkdir(external);await symlink(external,link);await assert.rejects(acquireArchive(archive(Buffer.from('source')),{store:link,offline:true}),/链接/);assert.deepEqual(await readdir(external),[]);
 const input=join(root,'input.tgz');await writeFile(input,tar([{name:'a',body:'x'},{name:'a',body:'y'}]));await assert.rejects(extractArchive(input,join(root,'duplicate')),/重复/);
 const signal=AbortSignal.abort();await assert.rejects(extractArchive(input,join(root,'cancelled'),{signal}));assert.equal((await readdir(root)).includes('cancelled'),false);
});
test('产品配方覆盖自身需求和递归工具，同文件资源入口拒绝错误输入',async t=>{
 const root=await fixedSandbox(t),declarations=resourceDeclarations(),tools=new Map(declarations.tools.map(x=>[x.id,x]));for(const platform of Object.values(contract.platforms))for(const tool of platform.tools){assert.equal(tools.get(tool.id)?.version,tool.version);}
 for(const tool of tools.values())for(const id of tool.requires||[])assert.ok(tools.has(id),'缺少递归工具 '+id);
 for(const name of ['node','posix','bash','grep','sed'])assert.ok(tools.has(name));const source=await readFile(new URL('./build.mjs',import.meta.url),'utf8');assert.doesNotMatch(source,/['"]\.\/resources\.mjs['"]|['"]\.\/target\.mjs['"]/u);
 const result=spawnSync(process.execPath,[join(import.meta.dirname,'build.mjs'),'resources','unknown','--work',root,'--offline'],{env:{HOME:root,LANG:'C',PATH:''},encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/平台/);assert.deepEqual(await readdir(root),[]);
});

test('Git Cargo工作区继承按当前产品锁展开，不留下跨包路径',()=>{
 const input={package:{name:'one',version:{workspace:true}},dependencies:{two:{workspace:true},third:{path:'../third'}}};const workspace={workspace:{package:{version:'1.0.0'},dependencies:{two:{path:'two',version:'2.0.0',features:['a']}}}};const lock=[{name:'third',version:'3.0.0'}];
 const result=normalizeCargoManifest(input,workspace,lock);assert.equal(result.package.version,'1.0.0');assert.equal(result.dependencies.two.path,undefined);assert.equal(result.dependencies.third.version,'=3.0.0');assert.deepEqual(input.package.version,{workspace:true});assert.throws(()=>normalizeCargoManifest(input,workspace,[]),/唯一锁定版本/);
});
test('资源子进程可取消，不能继续输出成功回执',async()=>{
 const signal=AbortSignal.timeout(150);await assert.rejects(runResourceProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{signal,env:{PATH:''}}),/abort|timeout|取消/iu);
});

// 使用产品真实源码工具生产器；编译/Apple能力边界受控，文件事务和输出验真实际执行。
const registry=resourceDeclarations();
async function sourceFixture(t, behavior = {}) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'source-tool-')));
  const owner = await lstat(root);
  t.after(async () => {
    const current = await lstat(root);
    assert.equal(current.dev, owner.dev); assert.equal(current.ino, owner.ino);
    await rm(root, { recursive: true, force: true });
  });
  const library = { root: join(root, 'tools'), work:join(root,'work'), tools: registry.tools };await mkdir(library.work);
  const tool = structuredClone(registry.tools.find(tool => tool.id === 'perl'));
  const bytes = Buffer.from('official-fixture-archive');
  tool.archive.sha256 = createHash('sha256').update(bytes).digest('hex');
  const pending = join(library.root, 'shared', tool.archive.sha256 + '.pending');
  const payload = join(pending, 'payload'), source = join(pending, 'unpack', tool.archive.root);
  const finalPayload = join(library.root, 'shared', tool.archive.sha256, 'payload');library.pending=pending;library.finalPayload=finalPayload;
  const developerDirectory = join(root, 'Xcode.app/Contents/Developer');
  const sdk = join(developerDirectory, 'Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk');
  await mkdir(source, { recursive: true }); await mkdir(sdk, { recursive: true });
  await writeFile(join(pending, 'archive'), bytes);
  await writeFile(join(source, 'Artistic'), 'fixture upstream legal text');
  // 本夹具只声明实际Configure安装路径和受控入口，不复制任何真实工具原件。
  await writeFile(join(source,'config.sh'),
    "installprivlib='"+finalPayload+"/lib/5.42.3'\ninstallarchlib='"+finalPayload+"/lib/5.42.3/aarch64-darwin'\n");
  const posix=join(root,'verified/posix/bin');await mkdir(posix,{recursive:true});
  for(const name of posixNames)await writeFile(join(posix,name),'fixture executable '+name,{mode:0o755});
  // 完整基础工具交付属于夹具输入；不会复制或安装真实工具原件。
  for(const id of ['bash','grep','sed']) {
    const bin=join(root,'verified',id,'bin');await mkdir(bin,{recursive:true});
    await writeFile(join(bin,id),'fixture executable '+id,{mode:0o755});
  }
  const calls = [];
  const exec = async (command, args, options) => {
    calls.push({ command, args, options });
    if (command.endsWith('/xcrun')) return { stdout: sdk + '\n' };
    if (args.includes('-MJSON::PP')) return { stdout: behavior.coreFails ? '' : 'controlled-perl-ok\n' };
    if (behavior.compilerFails && args.includes('-j8')) throw new Error('compiler failed');
    if (args.includes('install')) {
      const destination = args.find(value => value.startsWith('DESTDIR=')).slice(8);
      const staged = join(destination, finalPayload.slice(1));
      await mkdir(join(staged, 'bin'), { recursive: true });
      if (behavior.linkOutput) await symlink(join(pending, 'archive'), join(staged, 'bin/perl'));
      else if (!behavior.missingOutput) {
        const macho = Buffer.alloc(32); macho.writeUInt32LE(0xfeedfacf, 0); macho.writeUInt32LE(0x0100000c, 4);
        await writeFile(join(staged, 'bin/perl'), macho, { mode: 0o755 });
        await mkdir(join(staged, 'lib/5.42.3/aarch64-darwin'), { recursive: true });
        await writeFile(join(staged, 'lib/5.42.3/aarch64-darwin/Config.pm'), 'fixture core module');
      }
    }
    return { stdout: '' };
  };
  const input = { library, tool, pending, payload, source, archive: join(pending, 'archive'), finalPayload,
    environment: { PATH: '/untrusted/bin', RUBYOPT: '-rmalicious', PYTHONPATH: '/untrusted',
      DYLD_INSERT_LIBRARIES: '/untrusted', LD_PRELOAD: '/untrusted', ARCHFLAGS: '-arch x86_64', CFLAGS: 'malicious', PERL5OPT: '-Mmalicious' },
    exec, verify: async (_, tool) => behavior.missingTool === tool.id ? null
      : { path: join(root, 'verified', tool.id, 'bin', tool.command), version: tool.version },
    apple: async () => ({ developerDirectory, version: '27.0',
      tools: Object.fromEntries(['clang', 'clang++', 'ar', 'make', 'ld', 'as', 'nm', 'ranlib', 'strip', 'xcrun', 'otool', 'install_name_tool', 'codesign'].map(name => [name, join(developerDirectory, 'usr/bin', name)])) }),
    // 产品依赖准备只返回归档映射，不创建旧工具库的originals目录。
    prepare: async () => new Map() };
  return { input, calls, bytes };
}
test('源码工具使用准确Apple编译入口并只在候选中收集输出、原件和编译输入', async t => {
  const { input, calls, bytes } = await sourceFixture(t);
  await buildSourceTool(input);
  const configure = calls.find(call => call.args.includes('-des'));
  assert.ok(configure.args.includes('-Dinstallusrbinperl=n'));
  for (const key of ['RUBYOPT', 'PYTHONPATH', 'DYLD_INSERT_LIBRARIES', 'PERL5OPT', 'LD_PRELOAD']) assert.equal(configure.options.env[key], undefined);
  assert.equal(configure.options.env.CFLAGS,'-O2');
  assert.equal(configure.options.env.MACOSX_DEPLOYMENT_TARGET,registry.tools.find(t=>t.id==='posix').version);
  assert.ok(configure.options.env.SDKROOT.startsWith(configure.options.env.DEVELOPER_DIR+'/'));
  assert.equal(configure.options.env.CPP,configure.options.env.CC+' -E');
  assert.ok(!configure.options.env.PATH.split(':').some(p=>['/usr/bin','/bin','/opt/homebrew/bin'].includes(p)));
  assert.equal(configure.options.env.ARCHFLAGS, '-arch arm64');
  assert.ok(configure.options.env.CC.startsWith(input.pending.split('/tools/')[0] + '/Xcode.app/'));
  assert.ok(!configure.options.env.PATH.includes('/untrusted/'));
  assert.ok(calls.some(call => call.args.includes('-MJSON::PP') && call.options.env.PERL5LIB.startsWith(input.payload + '/lib/')));
  assert.equal(await readFile(join(input.payload, 'licenses/Artistic'), 'utf8'), 'fixture upstream legal text');
});
for (const behavior of [{ compilerFails: true }, { missingOutput: true }, { linkOutput: true }, { missingTool: 'node' }, { coreFails: true }]) {
  test('源码工具失败边界保留失败且不写入最终工具对象：' + JSON.stringify(behavior), async t => {
    const { input } = await sourceFixture(t, behavior);
    await assert.rejects(buildSourceTool(input));
    await assert.rejects(readFile(join(input.finalPayload, 'bin/perl')), { code: 'ENOENT' });
  });
}
test('官方完整归档被替换时在任何编译前失败', async t => {
  const { input, calls } = await sourceFixture(t);
  await writeFile(input.archive, 'changed');
  await assert.rejects(buildSourceTool(input), /归档摘要/);
  assert.equal(calls.length, 0);
});
test('候选路径不属于当前工具摘要时在任何编译前失败', async t => {
  const { input, calls } = await sourceFixture(t);
  input.finalPayload += '-other';
  await assert.rejects(buildSourceTool(input), /候选对象身份/);
  assert.equal(calls.length, 0);
});

test('空可选供给不阻断产品取得，npm SRI原件按准确来源复用',async t=>{
 const root=await sandbox(t),body=Buffer.from('sri-original'),entry={url:'https://example.invalid/sri.tgz',integrity:'sha512-'+createHash('sha512').update(body).digest('base64')};
 const file=await acquireArchive(entry,{store:join(root,'first'),optional:join(root,'absent'),fetcher:async()=>new Response(body)});assert.equal(await readFile(file,'utf8'),'sri-original');
 const optional=join(root,'shared/objects'),digest=hash(body),original=join(optional,digest+'.blob');await mkdir(dirname(original),{recursive:true});await writeFile(original,body);await writeFile(join(root,'shared/index.json'),JSON.stringify({schema_version:2,packages:[{archives:[{...entry,sha256:digest}]}],git_sources:[],pods:[]}));
 const cached=await acquireArchive(entry,{store:join(root,'second'),optional,offline:true,fetcher:()=>assert.fail('SRI供给命中联网')});assert.equal(await readFile(cached,'utf8'),'sri-original');
});

test('Pod浮动tag必须由产品固定提交闭合，来源漂移或无摘要HTTP发行件失败',()=>{
 const url='https://github.com/example/project.git',ref='a'.repeat(40),spec={name:'Example',version:'1.0.0',source:{git:url,tag:'v1.0.0'}},definitions=[{name:'Example',version:'1.0.0',url,tag:'v1.0.0',ref}];
 assert.deepEqual(podSourceCoordinate(spec,definitions),{url,ref});assert.throws(()=>podSourceCoordinate(spec,[]),/锁定/);
 assert.throws(()=>podSourceCoordinate({...spec,source:{git:'https://github.com/example/other.git',tag:'v1.0.0'}},definitions),/来源/);
 assert.throws(()=>podSourceCoordinate({...spec,source:{git:url,tag:'v2.0.0'}},definitions),/来源/);
 assert.throws(()=>podSourceCoordinate({name:'HTTP',version:'1',source:{http:'https://example.invalid/archive.zip'}},[]),/锁定/);
 for(const entry of resourceDeclarations().pods){const source=entry.ref?{git:entry.url,tag:entry.tag}:{http:entry.url};const coordinate=podSourceCoordinate({name:entry.name,version:entry.version,source});assert.equal(coordinate.ref||coordinate.sha256,entry.ref||entry.sha256);}
});

// 真实进程退出顺序：取消回执必须晚于子工具完成清理，不能用发送信号代替退出确认。
test('资源取消等待真实工具清理并确认退出后才返回失败',{timeout:20000},async t=>{
 const directory=await sandbox(t),ready=join(directory,'ready'),closed=join(directory,'closed');
 const code=`import {writeFileSync} from 'node:fs';process.once('SIGTERM',()=>setTimeout(()=>{writeFileSync(${JSON.stringify(closed)},'closed');process.exit(0);},600));writeFileSync(${JSON.stringify(ready)},'ready');setInterval(()=>{},1000);`;
 const controller=new AbortController();const running=runResourceProcess(process.execPath,['--input-type=module','-e',code],{cwd:directory,env:{PRODUCT_WORK_DIR:directory},signal:controller.signal});
 for(let n=0;n<200;n++){try{await readFile(ready);break;}catch{await new Promise(ok=>setTimeout(ok,10));}}
 assert.equal(await readFile(ready,'utf8'),'ready');const start=Date.now();controller.abort(Error('资源进程取消'));
 await assert.rejects(running,/取消/u);assert.equal(await readFile(closed,'utf8'),'closed');assert.ok(Date.now()-start>=500);
});
test('资源超时等待退出，错误入口和输出超限不产生成功回执',{timeout:20000},async t=>{
 const directory=await sandbox(t),closed=join(directory,'timeout-closed');
 const code=`import {writeFileSync} from 'node:fs';process.once('SIGTERM',()=>setTimeout(()=>{writeFileSync(${JSON.stringify(closed)},'closed');process.exit(0);},400));setInterval(()=>{},1000);`;
 await assert.rejects(runResourceProcess(process.execPath,['--input-type=module','-e',code],{cwd:directory,timeout:500}),/超时/u);
 assert.equal(await readFile(closed,'utf8'),'closed');
 await assert.rejects(runResourceProcess(join(directory,'missing'),[],{cwd:directory}),/无法启动/u);
 await assert.rejects(runResourceProcess(process.execPath,['-e','process.stdout.write("x".repeat(4096))'],{cwd:directory,maxBuffer:64}),/输出超限/u);
});

// 依赖供给夹具只写真实独占文件，覆盖唯一协议及任务视图隔离，不下载和安装工具。
async function dependencySupplyFixture(t,packages=[],pods=[]){const root=await sandbox(t),objects=join(root,'supply/objects'),work=join(root,'work');await mkdir(objects,{recursive:true});await mkdir(work);const index={schema_version:2,packages,git_sources:[],pods};await writeFile(join(dirname(objects),'index.json'),JSON.stringify(index));return {root,objects,work,index};}
const suppliedMaven=(bytes,source='https://repo.maven.apache.org/maven2/',suffix='pom')=>({ecosystem:'maven',name:'example:library',version:'1.0.0',archives:[{url:source+'example/library/1.0.0/library-1.0.0.'+suffix,integrity:'sha256-'+createHash('sha256').update(bytes).digest('base64'),sha256:hash(bytes)}]});
test('无可选依赖供给保持独立，旧schema与Pod整锁快照被拒绝',async t=>{
 const f=await dependencySupplyFixture(t);assert.equal(await readDependencySupply(join(f.root,'absent')),null);assert.deepEqual(await materializeMavenCache(undefined,f.work),[]);
 for(const value of [null,[],{schema_version:1,packages:[],git_sources:[],snapshots:[]},{...f.index,snapshots:[]}]){await writeFile(join(dirname(f.objects),'index.json'),JSON.stringify(value));await assert.rejects(readDependencySupply(f.objects),/协议/);}
});
test('Maven按上游分区重建，JAR分类器及module文件名保留，共享原件不承接写入',async t=>{
 const a=Buffer.from('central-pom'),b=Buffer.from('portal-pom'),c=Buffer.from('classifier-original'),d=Buffer.from('{"formatVersion":"1.1"}');const entries=[suppliedMaven(a),suppliedMaven(b,'https://plugins.gradle.org/m2/'),suppliedMaven(c,undefined,'jar'),suppliedMaven(d,undefined,'module')];entries[2].archives[0].url=entries[2].archives[0].url.replace('.jar','-sources.jar');const f=await dependencySupplyFixture(t,entries);
 for(const bytes of[a,b,c,d])await writeFile(join(f.objects,hash(bytes)+'.blob'),bytes);
 const repos=await materializeMavenCache(f.objects,f.work);assert.equal(repos.length,2);const central=repos.find(x=>x.source.includes('repo.maven.apache.org')),portal=repos.find(x=>x.source.includes('plugins.gradle.org'));assert.equal(await readFile(join(central.directory,'example/library/1.0.0/library-1.0.0.pom'),'utf8'),'central-pom');assert.equal(await readFile(join(portal.directory,'example/library/1.0.0/library-1.0.0.pom'),'utf8'),'portal-pom');assert.equal(await readFile(join(central.directory,'example/library/1.0.0/library-1.0.0-sources.jar'),'utf8'),'classifier-original');
 assert.deepEqual(await materializeMavenCache(f.objects,f.work),repos);const script=mavenSupplyInit(repos);assert.match(script,/FileStoreAndIndexProvider/);assert.match(script,/if \(gradle.startParameter.offline\)/);assert.match(script,/beforeSettings/);assert.match(script,/beforeProject/);assert.doesNotMatch(script,/artifactUrls/);assert.doesNotMatch(script,/modules-2|rely\/maven/);
 await writeFile(join(central.directory,'example/library/1.0.0/library-1.0.0.pom'),'task-changed');assert.equal(await readFile(join(f.objects,hash(a)+'.blob'),'utf8'),'central-pom');await assert.rejects(materializeMavenCache(f.objects,f.work),/摘要/);
});
for(const change of ['sha','sri','source','version','duplicate','state','link','cancel'])test('Maven拒绝错误原件或状态并保留失败：'+change,async t=>{
 const bytes=Buffer.from('maven-original'),entry=suppliedMaven(bytes),f=await dependencySupplyFixture(t,[entry]);await writeFile(join(f.objects,hash(bytes)+'.blob'),bytes);
 if(change==='sha')await writeFile(join(f.objects,hash(bytes)+'.blob'),'changed');if(change==='sri')entry.archives[0].integrity='sha256-'+Buffer.alloc(32).toString('base64');if(change==='source')entry.archives[0].url='https://other.invalid/maven2/example/library/1.0.0/library-1.0.0.pom';if(change==='version')entry.version='LATEST';if(change==='duplicate')f.index.packages.push({...entry,archives:[{...entry.archives[0],sha256:'a'.repeat(64)}]});
 await writeFile(join(dirname(f.objects),'index.json'),JSON.stringify(f.index));if(change==='state'){const [repo]=await materializeMavenCache(f.objects,f.work);await writeFile(join(repo.directory,'gc.properties'),'generated');}if(change==='link'){await mkdir(join(f.root,'outside'));await symlink(join(f.root,'outside'),join(f.work,'dependencies'));}
 const signal=change==='cancel'?AbortSignal.abort(Error('取消')):undefined;await assert.rejects(materializeMavenCache(f.objects,f.work,{signal}));assert.equal(await readFile(join(f.objects,hash(bytes)+'.blob'),'utf8'),change==='sha'?'changed':'maven-original');assert.equal((await readdir(join(f.work,'dependencies')).catch(e=>{if(e.code==='ENOENT')return [];throw e;})).some(x=>x.startsWith('.maven-')),false);
});
async function podSupplyFixture(t){
 // 合成Pod自带固定提交，不读取真实产品的Pod清单作为测试输入。
 const name='PodFixture',version='1.0.0',source={git:'https://github.com/example/PodFixture.git',commit:'1'.repeat(40)},bytes=Buffer.from(JSON.stringify({name,version,source})),file=Buffer.from('pod-source'),md5=createHash('md5').update(name).digest('hex');
 const pod={name,version,checksum:'a'.repeat(40),spec:{url:'https://cdn.cocoapods.org/Specs/'+md5[0]+'/'+md5[1]+'/'+md5[2]+'/'+name+'/'+version+'/'+name+'.podspec.json',sha256:hash(bytes)},source,files:[{type:'file',path:'Example.framework/Versions/A/Headers/source.h',sha256:hash(file),executable:false},{type:'link',path:'Example.framework/Versions/Current',target:'A'},{type:'link',path:'Example.framework/Headers',target:'Versions/Current/Headers'}]};const f=await dependencySupplyFixture(t,[],[pod]);for(const value of[bytes,file])await writeFile(join(f.objects,hash(value)+'.blob'),value);return {...f,pod,bytes,file};
}
test('Pod单坐标供给不依赖整锁与宿主，Framework多级链接仅在本轮物化',async t=>{
 const f=await podSupplyFixture(t);assert.equal(await materializePodSupply(undefined,f.objects,f.work),false);assert.equal(await materializePodSupply(f.pod,f.objects,f.work),true);assert.equal(await materializePodSupply(f.pod,f.objects,f.work),true);const release=join(f.work,'cache/Pods/Release',f.pod.name,f.pod.version+'-aaaaa');assert.equal(await readFile(join(release,'Example.framework/Headers/source.h'),'utf8'),'pod-source');await writeFile(join(release,'Example.framework/Headers/source.h'),'task-write');assert.equal(await readFile(join(f.objects,hash(f.file)+'.blob'),'utf8'),'pod-source');await assert.rejects(materializePodSupply(f.pod,f.objects,f.work),/漂移/);
});
for(const change of ['sha','spec','source','escape','duplicate','cycle','state','cancel'])test('Pod错来源、摘要和不安全链接失败关闭：'+change,async t=>{
 const f=await podSupplyFixture(t);if(change==='state'){await materializePodSupply(f.pod,f.objects,f.work);await writeFile(join(f.work,'cache/Pods/Release',f.pod.name,f.pod.version+'-aaaaa/generated.bin'),'state');}if(change==='sha')await writeFile(join(f.objects,hash(f.file)+'.blob'),'changed');if(change==='spec')f.pod.spec.url+='?other=1';if(change==='source')f.pod.source={git:'https://github.com/example/other.git',tag:'v1'};if(change==='escape')f.pod.files[1].target='../../../../outside';if(change==='duplicate')f.pod.files.push({...f.pod.files[0]});if(change==='cycle')f.pod.files[1].target='Current';const signal=change==='cancel'?AbortSignal.abort(Error('取消')):undefined;await assert.rejects(materializePodSupply(f.pod,f.objects,f.work,{signal}));assert.equal(await readFile(join(f.objects,hash(f.bytes)+'.blob'),'utf8'),f.bytes.toString());
});

// 真实文件事务验证下载候选的归属，不执行真实工具安装或编译。
test('资源下载候选只属于当前产品target现场，永久库不接收半包',async t=>{
 const root=await sandbox(t),work=join(root,'work'),store=join(root,'originals');await mkdir(work);await mkdir(store);
 const body=Buffer.from('owned-pending'),entry=archive(body);let inspected=false;
 const fetcher=async()=>({ok:true,headers:new Headers(),body:{async *[Symbol.asyncIterator](){
  const candidates=await readdir(join(work,'resource-pending'));
  assert.equal(candidates.filter(name=>name.endsWith('.pending')).length,1);
  assert.deepEqual(await readdir(store),[]);inspected=true;yield body;
 },cancel:async()=>{}}});
 const file=await acquireArchive(entry,{store,work,fetcher});assert.equal(inspected,true);
 assert.equal(await readFile(file,'utf8'),body.toString());assert.deepEqual(await readdir(join(work,'resource-pending')),[]);
 await assert.rejects(acquireArchive(archive(Buffer.from('other')),{store,work:dirname(resolve(import.meta.dirname,'..')),fetcher}),/target/);
});


// 夹具复制本仓完整资源实现，只替换文件IO边界并暴露已有私有验真函数，生产接口不新增出口。



// 全文复制本仓模块，合成回执逐次重算文件清单；只在测试副本暴露已有私有入口，不执行工具。


test('资源下载声明identity，自动解码正文按锁摘要校验而不误用传输长度',async t=>{
 const root=await sandbox(t),body=Buffer.from('decoded-original'),entry=archive(body);let headers;
 const path=await acquireArchive(entry,{store:root,fetcher:async(_,options)=>{headers=options.headers;return new Response(body,{headers:{'content-encoding':'gzip','content-length':'7'}});}});
 assert.equal(headers['Accept-Encoding'],'identity');assert.equal(await readFile(path,'utf8'),body.toString());
 await assert.rejects(acquireArchive(archive(body,'https://example.invalid/truncated'),{store:root,fetcher:async()=>new Response(body,{headers:{'content-length':'7'}})}),/不完整/);
 await assert.rejects(acquireArchive(archive(body,'https://example.invalid/incorrect'),{store:root,fetcher:async()=>new Response('incorrect',{headers:{'content-encoding':'gzip','content-length':'7'}})}),/摘要/);
});
test('供给中断只失败，不调用独立获取；任务串用先拒绝',async t=>{
 const root=await sandbox(t),{resources}=await Promise.resolve(resourceInternals);let calls=0;
 await assert.rejects(resources('android',root,{run_id:'123456789'},{supply:async()=>{calls++;throw Error('provider failed');},fetcher:()=>assert.fail('禁止独立获取')}),/provider failed/);
 await assert.rejects(resources('android',root,{run_id:'123456789'},{supply:async()=>({run_id:'987654321'}),fetcher:()=>assert.fail('禁止独立获取')}),/任务身份/);
 assert.equal(calls,1);assert.deepEqual(await readdir(root),[]);
});




// 实际子进程读取当前工程配置和插件清单；宿主旧PATH与其它工程不能替代本轮输入。
test('Maven解析使用已准备工程的当前任务环境且不把宿主PATH覆盖回来',async t=>{
 const work=await fixedSandbox(t),source=resolve(import.meta.dirname,'..'),project=join(work,'source-view',source.replace(/^\/+/u,'')),android=join(project,'android'),tool=join(work,'gradle-fixture.mjs');
 await mkdir(android,{recursive:true});await writeFile(join(android,'settings.gradle.kts'),'// current task settings');await writeFile(join(android,'local.properties'),'sdk.dir=prepared');await writeFile(join(project,'.flutter-plugins-dependencies'),'{}');
 await writeFile(tool,'#!'+process.execPath+'\n'+`import fs from 'node:fs';
const p=process.env.PRODUCT_SOURCE_DIR;
if(process.cwd()!==p+'/android'||!fs.existsSync(p+'/android/local.properties')||!fs.existsSync(p+'/.flutter-plugins-dependencies'))throw Error('unprepared-project');
fs.writeFileSync(process.env.PRODUCT_WORK_DIR+'/maven-environment.json',JSON.stringify({cwd:process.cwd(),path:process.env.PATH,home:process.env.HOME,project:p,args:process.argv.slice(2)}));
`);await chmod(tool,0o700);
 const library={installed:new Map([['gradle',{path:tool}],['java',{path:process.execPath}]])},options={library,environment:{}},environment={PATH:'/stale-host-path',PRODUCT_SOURCE_DIR:'/wrong-project'},current={PRODUCT_WORK_DIR:work,PRODUCT_SOURCE_DIR:project,PATH:dirname(process.execPath),HOME:work};
 await assert.rejects(prepareGradleResources(work,options,environment,{...current,PRODUCT_WORK_DIR:project}),/当前任务/);
 await prepareGradleResources(work,options,environment,current);
 const observed=JSON.parse(await readFile(join(work,'maven-environment.json'),'utf8'));assert.equal(observed.cwd,android);assert.equal(observed.project,project);assert.equal(observed.path,current.PATH);assert.equal(observed.home,work);assert.equal(observed.args.at(-1),'productResolveResources');
});


test('Pub本轮物化由真实Dart离线消费，摘要严格64字节且复用不改原件',async t=>{
 const root=await sandbox(t),cache=join(root,'pub'),project=join(root,'project'),file=join(root,'package.tgz');
 const dart=process.env.PRODUCT_TEST_DART||process.env.DART_EXECUTABLE;
 assert.ok(dart,'统一验收须显式交付产品锁定Flutter内的PRODUCT_TEST_DART或DART_EXECUTABLE');
 const body=tar([{name:'pubspec.yaml',body:'name: offline_hash_fixture\nversion: 1.0.0\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\n'}]);
 await writeFile(file,body);const sha256=hash(body),entries=[{name:'offline_hash_fixture-1.0.0',sha256,file}];
 await materializePubCache(entries,cache);await mkdir(project);
 await writeFile(join(project,'pubspec.yaml'),'name: offline_hash_consumer\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\ndependencies:\n  offline_hash_fixture: 1.0.0\n');
 await writeFile(join(project,'pubspec.lock'),`packages:\n  offline_hash_fixture:\n    dependency: "direct main"\n    description:\n      name: offline_hash_fixture\n      sha256: "${sha256}"\n      url: "https://pub.dev"\n    source: hosted\n    version: "1.0.0"\nsdks:\n  dart: ">=3.0.0 <4.0.0"\n`);
 const result=spawnSync(dart,['--suppress-analytics','pub','get','--offline','--enforce-lockfile'],{cwd:project,env:{HOME:root,USERPROFILE:root,PATH:'',PUB_CACHE:cache,TMPDIR:root,LANG:'C'},encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,result.stdout+result.stderr);assert.match(result.stdout,/Got dependencies/);
 assert.equal(await readFile(join(cache,'hosted-hashes/pub.dev',entries[0].name+'.sha256'),'utf8'),sha256);
 assert.equal(JSON.parse(await readFile(join(project,'.dart_tool/package_config.json'),'utf8')).packages.some(x=>x.name==='offline_hash_fixture'),true);
 await materializePubCache(entries,cache);assert.deepEqual(await readFile(file),body);
});

test('Pub既有摘要换行和错误值拒绝，取消不提交可消费缓存',async t=>{
 const root=await sandbox(t),file=join(root,'package.tgz'),body=tar([{name:'pubspec.yaml',body:'name: hash_fixture\nversion: 1.0.0\n'}]);await writeFile(file,body);
 const entry={name:'hash_fixture-1.0.0',sha256:hash(body),file};
 for(const value of [entry.sha256+'\n','0'.repeat(64)]){
  const cache=join(root,'cache-'+(value.length===65?'newline':'wrong'));await materializePubCache([entry],cache);
  const proof=join(cache,'hosted-hashes/pub.dev',entry.name+'.sha256');await writeFile(proof,value);
  await assert.rejects(materializePubCache([entry],cache),/Pub缓存摘要漂移/);assert.equal(await readFile(proof,'utf8'),value);
 }
 await assert.rejects(materializePubCache([entry],join(root,'cancelled'),{signal:AbortSignal.abort()}));
});


// 真实Gradle同时验证项目内部变体歧义、外部传递闭包和缺件失败，不能靠源码字符串代替。
test('Gradle资源视图获取外部传递原件，拒绝缺件而不选择项目内部次级制品',async t=>{
 const root=await sandbox(t),project=join(root,'project'),maven=join(root,'maven'),cache=join(root,'cache');await mkdir(project);await mkdir(join(project,'internal'));
 const gradle=process.env.PRODUCT_TEST_GRADLE||process.env.GRADLE,java=process.env.PRODUCT_TEST_JAVA||process.env.JAVA;
 const shell=process.env.PRODUCT_TEST_SHELL||process.env.PRODUCT_BASH_BIN,path=process.env.PRODUCT_TEST_POSIX_BIN||process.env.PATH;
 assert.ok(gradle&&java&&shell&&path,'须交付已验真Gradle、Java、Shell及基础工具');
 for(const name of ['direct','transitive']){
  const dir=join(maven,'example',name,'1.0');await mkdir(dir,{recursive:true});await writeFile(join(dir,name+'-1.0.jar'),name);
  await writeFile(join(dir,name+'-1.0.pom'),`<project><modelVersion>4.0.0</modelVersion><groupId>example</groupId><artifactId>${name}</artifactId><version>1.0</version></project>`);
 }
 await writeFile(join(project,'settings.gradle'),"rootProject.name='resource-fixture'\ninclude 'internal'\n");
 await writeFile(join(project,'build.gradle'),`import org.gradle.api.attributes.Usage
allprojects { repositories { maven { url uri('${maven}') } } }
configurations { debugImplementationDependenciesMetadata { canBeResolved=true; canBeConsumed=false }; releaseRuntimeClasspath { canBeResolved=true; canBeConsumed=false; attributes { attribute(Usage.USAGE_ATTRIBUTE, objects.named(Usage, Usage.JAVA_RUNTIME)); attribute(org.gradle.api.attributes.Attribute.of('com.android.build.api.attributes.BuildTypeAttr', String), 'release') } } }
dependencies { debugImplementationDependenciesMetadata project(':internal'); releaseRuntimeClasspath 'example:direct:1.0'; releaseRuntimeClasspath project(':internal') }
tasks.register('showExternal') { doLast { println 'EXTERNAL='+configurations.releaseRuntimeClasspath.incoming.artifactView { componentFilter { it instanceof org.gradle.api.artifacts.component.ModuleComponentIdentifier } }.files.files*.name.sort().join(',') } }
`);
 await writeFile(join(project,'internal/build.gradle'),`import org.gradle.api.attributes.Usage
import org.gradle.api.attributes.Attribute
['debug','profile','release'].each { name ->
 def published=configurations.create(name) { canBeResolved=false; canBeConsumed=true; attributes { attribute(Usage.USAGE_ATTRIBUTE, objects.named(Usage, Usage.JAVA_RUNTIME)); attribute(Attribute.of('com.android.build.api.attributes.BuildTypeAttr', String), name) } }
 dependencies.add(name, 'example:transitive:1.0')
 published.outgoing.artifact(file(name+'.bin'))
}
`);
 for(const name of ['debug','profile','release'])await writeFile(join(project,'internal',name+'.bin'),'internal');
 const old=join(root,'old.gradle'),init=join(root,'resource.gradle');await writeFile(old,'allprojects { p -> p.tasks.register("productResolveResources") { doLast { p.configurations.findAll { it.canBeResolved }.each { it.resolve() } } } }');await writeFile(init,gradleResourceInit());
 const env={HOME:root,USERPROFILE:root,JAVA_HOME:dirname(dirname(java)),PATH:[dirname(shell),path].join(':'),TMPDIR:root,LANG:'C',JAVA_TOOL_OPTIONS:'-Djava.io.tmpdir='+root+' -Duser.home='+root};
 const run=(file,...tasks)=>spawnSync(gradle,['--offline','--no-daemon','--console=plain','--gradle-user-home',cache,'--init-script',file,...tasks],{cwd:project,env,encoding:'utf8',timeout:120000,maxBuffer:4*1024**2});
 const baseline=run(old,'productResolveResources');assert.notEqual(baseline.status,0);assert.match(baseline.stdout+baseline.stderr,/cannot choose between|ambiguous/iu);
 const ready=run(init,'productResolveResources','showExternal');assert.equal(ready.status,0,ready.stdout+ready.stderr);assert.match(ready.stdout,/EXTERNAL=direct-1.0.jar,transitive-1.0.jar/);
 await writeFile(join(project,'build.gradle'),(await readFile(join(project,'build.gradle'),'utf8')).replace('example:direct:1.0','example:missing:1.0'));
 const missing=run(init,'productResolveResources');assert.notEqual(missing.status,0);assert.match(missing.stdout+missing.stderr,/example:missing|example\/missing/u);
});

// 不执行本机产品编译；真实Gradle用例只在获准统一验收时运行。
test('Maven接入保留跨版本URL、不同文件名和未选平台，不要求metadata提供强摘要',async t=>{
 const root=await sandbox(t),directory=join(root,'maven'),folder=join(directory,'example/library/1.0');await mkdir(folder,{recursive:true});
 const metadata={formatVersion:'1.1',component:{group:'example',module:'library',version:'1.0'},variants:[{name:'runtime',files:[{name:'library.jar',url:'../2.0/library-2.0.jar'}]},{name:'unselected',files:[{name:'missing.jar',url:'missing.jar'}]}]};
 const file=join(folder,'library-1.0.module');await writeFile(file,JSON.stringify(metadata));const other=join(directory,'example/library/2.0');await mkdir(other,{recursive:true});await writeFile(join(other,'library-2.0.jar'),'actual-original');
 const init=mavenSupplyInit([{source:'https://repo.maven.apache.org/maven2/',directory}]);
 assert.match(init,/library-2\.0\.jar/);assert.match(init,/FileStoreAndIndexProvider/);assert.doesNotMatch(init,/includeVersion|artifactUrls|available-at/);assert.equal(await readFile(file,'utf8'),JSON.stringify(metadata));
 await symlink(file,join(folder,'linked.jar'));assert.throws(()=>mavenSupplyInit([{source:'https://repo.maven.apache.org/maven2/',directory}]),/普通文件/);
});
test('空供给仍记录Gradle真实下载，实际离线仅按已有文件视图消费',()=>{
 const script=mavenSupplyInit([]);assert.match(script,/ExternalResourceReadBuildOperationType/);assert.match(script,/maven-downloads-/);assert.match(script,/if \(gradle.startParameter.offline\)/);
 assert.ok(script.includes('gradleMetadata(); mavenPom()'));assert.doesNotMatch(script,/includeVersion|artifactUrls/);
});
// 同一初始化脚本先用于普通准备，再用于离线Build；延迟配置只能在实际任务动作内产生。
test('Maven按实际Gradle模式接入原件，执行期配置可离线解析且真缺件失败',async t=>{
 const root=await sandbox(t),project=join(root,'project'),directory=join(root,'originals'),folder=join(directory,'example/tool/1.0');
 await mkdir(project);await mkdir(folder,{recursive:true});
 await writeFile(join(folder,'tool-1.0.pom'),'<project><modelVersion>4.0.0</modelVersion><groupId>example</groupId><artifactId>tool</artifactId><version>1.0</version></project>');
 const artifact=join(folder,'tool-1.0-osx.jar');await writeFile(artifact,'saved-original');
 const source='https://dl.google.com/dl/android/maven2/',init=join(root,'originals.gradle');await writeFile(init,mavenSupplyInit([{source,directory}]));
 await writeFile(join(project,'settings.gradle'),"rootProject.name='runtime-originals'\n");
 await writeFile(join(project,'build.gradle'),`repositories { maven { url '${source}' } }
tasks.register('verifyOrdinary') { doLast { assert repositories.names.every { !it.startsWith('productOriginal_') } } }
tasks.register('verifyLateTool') { doLast {
 def late = configurations.detachedConfiguration(dependencies.create('example:tool:1.0:osx@jar'))
 assert late.singleFile.text == 'saved-original'
} }
`);
 const gradle=process.env.PRODUCT_TEST_GRADLE,java=process.env.PRODUCT_TEST_JAVA,shell=process.env.PRODUCT_TEST_SHELL,path=process.env.PRODUCT_TEST_POSIX_BIN;assert.ok(gradle&&java&&shell&&path);
 const env={HOME:root,JAVA_HOME:dirname(dirname(java)),PATH:[dirname(shell),path].join(':'),TMPDIR:root,LANG:'C',JAVA_TOOL_OPTIONS:'-Djava.io.tmpdir='+root+' -Duser.home='+root};
 const run=(task,offline,cache)=>spawnSync(gradle,[...(offline?['--offline']:[]),'--no-daemon','--console=plain','--gradle-user-home',join(root,cache),'--init-script',init,task],{cwd:project,env,encoding:'utf8',timeout:120000,maxBuffer:4*1024**2});
 const ordinary=run('verifyOrdinary',false,'ordinary-cache');assert.equal(ordinary.status,0,ordinary.stdout+ordinary.stderr);
 const ready=run('verifyLateTool',true,'offline-cache');assert.equal(ready.status,0,ready.stdout+ready.stderr);
 await rm(artifact);await writeFile(init,mavenSupplyInit([{source,directory}]));
 const missing=run('verifyLateTool',true,'missing-cache');assert.notEqual(missing.status,0);assert.match(missing.stdout+missing.stderr,/tool-1\.0-osx\.jar/u);
});

test('实际Gradle离线只消费当前选定JVM变体，缺少JS及文档变体不阻断',async t=>{
 const root=await sandbox(t),project=join(root,'project'),directory=join(root,'originals'),folder=join(directory,'example/library/1.0');await mkdir(project);await mkdir(folder,{recursive:true});
 await writeFile(join(folder,'library-1.0.pom'),'<project><modelVersion>4.0.0</modelVersion><groupId>example</groupId><artifactId>library</artifactId><version>1.0</version></project>');
 const metadata={formatVersion:'1.1',component:{group:'example',module:'library',version:'1.0'},variants:[{name:'runtime',attributes:{'org.gradle.usage':'java-runtime','org.jetbrains.kotlin.platform.type':'jvm'},files:[{name:'library.jar',url:'../2.0/library-2.0.jar'}]},{name:'js',attributes:{'org.gradle.usage':'kotlin-runtime','org.jetbrains.kotlin.platform.type':'js'},files:[{name:'missing.jar',url:'missing.jar'}]}]};
 await writeFile(join(folder,'library-1.0.module'),JSON.stringify(metadata));const jar=join(directory,'example/library/2.0/library-2.0.jar');await mkdir(dirname(jar),{recursive:true});await writeFile(jar,'actual-original');
 const source='https://repo.maven.apache.org/maven2/',init=join(root,'originals.gradle');await writeFile(init,mavenSupplyInit([{source,directory}]));
 await writeFile(join(project,'settings.gradle'),"rootProject.name='selected-variant'\n");
 await writeFile(join(project,'build.gradle'),`repositories { maven { url '${source}' } }
configurations { external { attributes { attribute(Usage.USAGE_ATTRIBUTE, objects.named(Usage, Usage.JAVA_RUNTIME)); attribute(Attribute.of('org.jetbrains.kotlin.platform.type', String), 'jvm') } } }
dependencies { external 'example:library:1.0' }
tasks.register('verifyOriginal') { doLast { assert configurations.external.singleFile.text == 'actual-original' } }
`);
 const gradle=process.env.PRODUCT_TEST_GRADLE,java=process.env.PRODUCT_TEST_JAVA,shell=process.env.PRODUCT_TEST_SHELL,path=process.env.PRODUCT_TEST_POSIX_BIN;assert.ok(gradle&&java&&shell&&path);
 const run=()=>spawnSync(gradle,['--offline','--no-daemon','--console=plain','--gradle-user-home',join(root,'cache'),'--init-script',init,'verifyOriginal'],{cwd:project,env:{HOME:root,JAVA_HOME:dirname(dirname(java)),PATH:[dirname(shell),path].join(':'),TMPDIR:root,LANG:'C',JAVA_TOOL_OPTIONS:'-Djava.io.tmpdir='+root+' -Duser.home='+root},encoding:'utf8',timeout:120000,maxBuffer:4*1024**2});
 const result=run();assert.equal(result.status,0,result.stdout+result.stderr);await rm(jar);await rm(join(root,'cache'),{recursive:true});await writeFile(init,mavenSupplyInit([{source,directory}]));const missing=run();assert.notEqual(missing.status,0);assert.match(missing.stdout+missing.stderr,/library-2\.0\.jar/);
});

// 原件规模超过当前真实供给库，并让登记Gradle实际编译与回读缓存，防止小夹具漏检JVM上限。
test('大规模Maven清单由真实Gradle分段解析，全部原件验真且首尾URL正确',async t=>{
 const root=await sandbox(t),project=join(root,'project'),directory=join(root,"原件'视图"),folder=join(directory,'example/library/1.0');await mkdir(project);await mkdir(folder,{recursive:true});
 const count=3000,body=Buffer.from('bulk-original');for(let i=0;i<count;i++)await writeFile(join(folder,'library-1.0-'+i+'.jar'),body);
 const source='https://repo.maven.apache.org/maven2/',init=join(root,'originals.gradle'),script=mavenSupplyInit([{source,directory}]);assert.match(script,/JsonSlurper/);assert.doesNotMatch(script,/def originals = \[\[url:/);await writeFile(init,script);
 await writeFile(join(project,'settings.gradle'),"rootProject.name='large-original-list'\n");
 await writeFile(join(project,'build.gradle'),"import org.gradle.api.internal.artifacts.ivyservice.modulecache.FileStoreAndIndexProvider\ntasks.register('verifyOriginals') { doLast { def stores=gradle.services.get(FileStoreAndIndexProvider); [0,2999].each { number -> def record=stores.externalResourceIndex.lookup('https://repo.maven.apache.org/maven2/example/library/1.0/library-1.0-'+number+'.jar'); assert record.cachedFile.text == 'bulk-original' } } }\n");
 const gradle=process.env.PRODUCT_TEST_GRADLE,java=process.env.PRODUCT_TEST_JAVA,shell=process.env.PRODUCT_TEST_SHELL,path=process.env.PRODUCT_TEST_POSIX_BIN;assert.ok(gradle&&java&&shell&&path);
 const result=spawnSync(gradle,['--offline','--no-daemon','--console=plain','--gradle-user-home',join(root,'cache'),'--init-script',init,'verifyOriginals'],{cwd:project,env:{HOME:root,JAVA_HOME:dirname(dirname(java)),PATH:[dirname(shell),path].join(':'),TMPDIR:root,LANG:'C',JAVA_TOOL_OPTIONS:'-Djava.io.tmpdir='+root+' -Duser.home='+root},encoding:'utf8',timeout:120000,maxBuffer:4*1024**2});
 assert.equal(result.status,0,result.stdout+result.stderr);assert.equal((await readdir(folder)).length,count);assert.equal((await readdir(join(root,'cache'))).filter(x=>/^maven-downloads-.*[.]json$/u.test(x)).length,1);
});

// 运行生产验证函数本身，注入受控宿主能力；测试不调用未获授权的新系统工具。

  })().catch(error => { console.error(error); process.exitCode = 1; });
}

// 同文件回归只准备夹具归档，验证候选职责和失败清理，不下载或运行产品编译。
if(process.env.NODE_TEST_CONTEXT&&process.argv.length===2&&process.argv[1]===import.meta.filename){
 const {test}=await import('node:test'),{default:assert}=await import('node:assert/strict'),{execFileSync}=await import('node:child_process'),fs=await import('node:fs'),{withFixedWork}=await Promise.resolve(targetInternals);
 for(const failure of [false,true])test('编译供给候选归属与失败收尾：'+failure,()=>withFixedWork('test',async work=>{
  const tool=supplyRequirements().tools.find(tool=>tool.id==='node'),base=join(work,'fixture');await mkdir(join(base,tool.archive.root,'bin'),{recursive:true});await writeFile(join(base,tool.archive.root,'bin/node'),'#!/bin/sh\nexit 0\n',{mode:0o755});
  const archive=join(work,'fixture.tgz');execFileSync('/usr/bin/tar',['-czf',archive,'-C',base,tool.archive.root]);const payload=join(work,'payload');await mkdir(payload);let acquired=0,committed=0;
  const options={original:archive,payload,work,environment:{HOME:work},acquireOriginal:async entry=>{acquired++;assert.equal(entry.url,tool.archive.url);if(failure)throw Error('原件缺失');return archive;},acquireTool:()=>assert.fail('Node无前置工具'),acquireApple:()=>assert.fail('Node不需要Apple'),publishCandidate:async(candidate,target)=>{assert.ok(candidate.startsWith(work+'/')&&target.startsWith(work+'/'));committed++;await mkdir(dirname(target),{recursive:true});await rename(candidate,target);}};
  if(failure)await assert.rejects(prepareToolSupply(tool,options),/原件缺失/);else{const result=await prepareToolSupply(tool,options);assert.equal(result.payload,payload);assert.ok((await lstat(join(payload,'bin/node'))).mode&0o111);assert.equal(committed,1);}
  assert.equal(acquired,1);assert.equal((await readdir(work)).some(name=>name.startsWith('.tool-recipe-')),false);
 }));
}

return {runResourceProcess,inventory,acquireArchive,extractArchive,materializePubCache,normalizeCargoManifest,podSourceCoordinate,readDependencySupply,materializePodSupply,materializeMavenCache,mavenSupplyInit,checkCocoaPodsResources,gradleResourceInit,prepareGradleResources,buildSourceTool,posixNames,resourceDeclarations,bootstrapNode,resources,prepareResourceSupply,supplyRequirements,assertWorkQuiescent,prepareToolSupply,mavenSources,preparePlatformSupply,copyFlutterArtifact:flutterRecipe.copyFlutterArtifact};
})();
resolveResourceReady(resourceInternals);
export const {runResourceProcess,inventory,acquireArchive,extractArchive,materializePubCache,normalizeCargoManifest,podSourceCoordinate,readDependencySupply,materializePodSupply,materializeMavenCache,mavenSupplyInit,checkCocoaPodsResources,gradleResourceInit,prepareGradleResources,buildSourceTool,posixNames,resourceDeclarations,bootstrapNode,resources,prepareResourceSupply,supplyRequirements,assertWorkQuiescent,prepareToolSupply,mavenSources,preparePlatformSupply}=resourceInternals;
const {copyFlutterArtifact}=resourceInternals;
const product=contract.product_id, prefix=product.toUpperCase();
const inside=(base,path)=>{const r=relative(base,path);return r===''||!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep);};
const fail=message=>{throw Error(product+' Build：'+message);};
export function checkWork(work) { return checkFixedWork(work); }

// 产品自己拥有target工作边界；测试与独立入口也不借用调用方的全局缓存。
export function productTarget(platform) {
 platformContract(platform);
 return join(root,'target');
}
export function temporaryRoot(platform=Object.keys(contract.platforms)[0],scope='test',suppliedInput) {
 if(!['test','tmp','build','ci','release','publish'].includes(scope))fail('临时目录职责无效');
 platformContract(platform);const expected=fixedWork(scope==='test'?'test':'build/'+platform);
 if(suppliedInput!=null&&suppliedInput!==expected)fail('临时工作根必须是本产品固定目录');
 return checkFixedWork(expected,{create:true});
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
 const [id,platform,...extra]=String(environment.GITHUB_WORKFLOW||'').split('.');
 if(id!==product||extra.length||!Object.hasOwn(contract.platforms,platform))fail('远端临时目录缺少准确产品平台流程身份');
 const temporary=temporaryRoot(platform,'build',null);
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
 const allowedEnvironment=new Set([prefix+'_RESOURCE_MODE','PRODUCT_WORK_DIR','PRODUCT_BASH_BIN','PRODUCT_RSYNC_BIN','PATH','DEVELOPER_DIR','SDKROOT','DART_EXECUTABLE','XCODEBUILD','XATTR','CODESIGN','SECURITY','XCRUN','XCODE_SELECT','CC','CXX','SWIFT','OTOOL','INSTALL_NAME_TOOL','LIPO','MAKE','AR','RANLIB','NM','STRIP','LLVM_NM','LD','LDCXX','CARGO_TARGET_AARCH64_APPLE_DARWIN_LINKER','ANDROID_HOME','ANDROID_SDK_ROOT','ANDROID_NDK_HOME','ANDROID_USER_HOME','ANDROID_EMULATOR_HOME','GRADLE_INIT_SCRIPT','GRADLE_USER_HOME']);
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
 if(base.PRODUCT_RESOURCE_FD==='4')env["CITIZENWALLET_RESOURCE_MODE"]='provided';else env["CITIZENWALLET_RESOURCE_MODE"]??='independent';
 if(env["CITIZENWALLET_RESOURCE_MODE"]==='provided'){env.PIP_NO_INDEX='1';env.COMPOSER_DISABLE_NETWORK='1';env.YARN_ENABLE_NETWORK='0';}
 const execution=executions.getStore();if(execution)execution.buildEnvironment=env;
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
 const versions=[...readBuildSource(project,'pubspec.yaml').toString('utf8').matchAll(/^version:[ \t]*([0-9]+\.[0-9]+\.[0-9]+)(?:\+([0-9]+))?[ \t]*$/gmu)];
 if(versions.length!==1)fail('Android工程版本声明不唯一或无效');
 const code=versions[0][2]||'1';if(!/^[1-9][0-9]*$/u.test(code)||Number(code)>2147483647)fail('Android工程版本编号无效');
 const property=value=>value.split('').map(char=>char.charCodeAt(0)>126?'\\u'+char.charCodeAt(0).toString(16).padStart(4,'0'):/[\\:=#!\s]/u.test(char)?'\\'+char:char).join('');
 const content=[['sdk.dir',values[0]],['flutter.sdk',values[1]],['flutter.buildMode','release'],['flutter.versionName',versions[0][1]],['flutter.versionCode',code]].map(([key,value])=>key+'='+property(value)).join('\n')+'\n';
 const file=join(project,'android/local.properties');
 if(realpathSync(dirname(file))!==dirname(file))fail('Android工程配置经过链接');
 const info=lstatSync(file,{throwIfNoEntry:false});if(info){if(!info.isFile()||info.isSymbolicLink()||info.nlink!==1||readFileSync(file,'utf8')!==content)fail('Android工程配置漂移');}
 else writeFileSync(file,content,{flag:'wx',mode:0o600});return file;
}
export const ANALYSIS_OPTIONS_SOURCE="# 本产品独立维护的 Flutter 分析规则。\ninclude: package:flutter_lints/flutter.yaml\n\nanalyzer:\n  exclude:\n    - \"**/*.g.dart\"\n\nlinter:\n  rules:\n    use_build_context_synchronously: true\n";
export const BUILD_SHELL_SOURCES=Object.freeze({"wallet":"#!/usr/bin/env bash\n# 在本产品target内准确任务工程生成本机优化安装包；本脚本不启动、不安装产品。\n#\n# 用法：node scripts/build.mjs wallet <ios|android>\n#\n# 目标平台是必填参数，不做任何自动探测：探测总要在失败时选一个回落，\n# 而回落的那一端会被当成用户想编的那一端。每个调用方必须明确传入目标平台。\n#\n# 调用方交付本产品target内任务工程；独立准备同样使用本产品target。\nset -euo pipefail\nCITIZENWALLET_DIR=\"${CITIZENWALLET_SOURCE_ROOT:?缺少所属产品源码根}\"\nPLATFORM=\"${1:?缺少目标平台，用法：$0 <ios|android>}\"\nPREPARE_ONLY=false\nif [[ \"$PLATFORM\" == prepare-ios || \"$PLATFORM\" == prepare-android ]]; then\n  PREPARE_ONLY=true\n  PLATFORM=\"${PLATFORM#prepare-}\"\nfi\n[[ \"$PLATFORM\" == ios || \"$PLATFORM\" == android ]] \\\n  || { echo \"本机目标平台只接受 ios 或 android：$PLATFORM\" >&2; exit 1; }\n\n# 所有独立入口的工具临时状态归本产品target；宿主已交付的产品工作根继续归当前任务。\nPRODUCT_TEMP_SOURCE=\"$CITIZENWALLET_DIR\"\nPRODUCT_TARGET_TEMP_ROOT=\"$(\"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$PRODUCT_TEMP_SOURCE/scripts/build.mjs\" temporary-root \"${PLATFORM:-${platform:-}}\" 'ios')\" || exit 1\nif [[ -z \"${PRODUCT_WORK_DIR:-}\" && \"${TMPDIR:-}\" != \"$PRODUCT_TEMP_SOURCE/target/\"* ]]; then\n  export TMPDIR=\"$PRODUCT_TARGET_TEMP_ROOT/\"\nfi\nCITIZENWALLET_WORK_DIR=\"${CITIZENWALLET_WORK_DIR:-$PRODUCT_TARGET_TEMP_ROOT}\"\n# 源码根只读；两个端的Flutter、Pods和Gradle状态分别写入当前产品工作目录。\n# 中文注释：检出目录名称由调用方选择；产品身份只取普通 pubspec 文件中的唯一包名。\npython3 - \"$CITIZENWALLET_DIR\" <<'CHECK_SOURCE'\nfrom pathlib import Path\nimport re\nimport sys\nsource = Path(sys.argv[1])\nmanifest = source / 'pubspec.yaml'\nif manifest.is_symlink() or not manifest.is_file():\n    raise SystemExit('citizenwallet本机Build源码身份无效')\nnames = re.findall(r'^name:[ \\t]*([^\\r\\n]+?)[ \\t]*$', manifest.read_text(), re.MULTILINE)\nif names != ['citizenwallet']:\n    raise SystemExit('citizenwallet本机Build源码身份无效')\nCHECK_SOURCE\n# 写入前先绑定本产品、真实平台、当前工作根和准确工程；拒绝链接或其它任务路径。\nCREATE_PROJECT=false\nif [[ \"$PREPARE_ONLY\" == true && -z \"${CITIZENWALLET_PROJECT_ROOT:-}\" ]]; then\n  CREATE_PROJECT=true\n  export CITIZENWALLET_PROJECT_ROOT=\"$CITIZENWALLET_WORK_DIR/source-view\"\nfi\npython3 - \"$CITIZENWALLET_DIR\" \"$PLATFORM\" \"$CITIZENWALLET_WORK_DIR\" \"${CITIZENWALLET_PROJECT_ROOT:-}\" \"$PREPARE_ONLY\" <<'CHECK_PROJECT'\nfrom pathlib import Path\nimport sys\nsource, platform, work, project, preparing = Path(sys.argv[1]), sys.argv[2], Path(sys.argv[3]), Path(sys.argv[4]), sys.argv[5]\nif not work.is_absolute() or work.resolve() != work:\n    raise SystemExit('产品工作目录必须为无链接规范绝对路径')\ntry:\n    parts = work.relative_to(source / 'target').parts\nexcept ValueError:\n    parts = ()\nif parts != ('test',) and parts not in {('build', 'ios'), ('build', 'android')}:\n    raise SystemExit('产品工作目录只允许本产品target/build/<平台>或target/test')\nexpected = work / 'source-view' / str(source).lstrip('/')\nif not project.is_absolute() or project.resolve() != project or not (project == expected or preparing == 'true' and project == work / 'source-view'):\n    raise SystemExit('平台工程不属于当前任务')\nCHECK_PROJECT\n# 准备入口使用同一target边界；没有交付工程时只创建当前任务的准确空副本。\nif [[ \"$CREATE_PROJECT\" == true ]]; then\n  python3 - \"$CITIZENWALLET_DIR\" \"$CITIZENWALLET_PROJECT_ROOT\" <<'CREATE_VIEW'\nfrom pathlib import Path\nimport shutil\nimport sys\nsource = Path(sys.argv[1]).resolve(strict=True)\ntarget = Path(sys.argv[2])\nif target.exists() or target.is_symlink():\n    raise SystemExit('CitizenWallet本轮新工程必须为空目标')\nexcluded = {'.git', '.dart_tool', '.gradle', '.symlinks', 'Pods', 'build', 'target', 'node_modules', 'ephemeral', '.DS_Store', 'swiftpm'}\ngenerated = {'local.properties', 'Generated.xcconfig', 'flutter_export_environment.sh', '.flutter-plugins-dependencies', 'GeneratedPluginRegistrant.java', 'GeneratedPluginRegistrant.h', 'GeneratedPluginRegistrant.m', 'GeneratedPluginRegistrant.swift'}\ndef visit(src, dst):\n    dst.mkdir(parents=True)\n    for child in sorted(src.iterdir()):\n        if child.name in excluded or child.name in generated:\n            continue\n        output = dst / child.name\n        if child.is_dir() and not child.is_symlink():\n            visit(child, output)\n        else:\n            resolved = child.resolve(strict=True)\n            if not resolved.is_relative_to(source) or not resolved.is_file():\n                raise SystemExit('源码文件链接越界或不是普通文件')\n            shutil.copy2(resolved, output)\nvisit(source, target)\nCREATE_VIEW\nfi\nexport CITIZENWALLET_PROJECT_ROOT=\"${CITIZENWALLET_PROJECT_ROOT:?必须提供本轮CitizenWallet Flutter工程根}\"\n[[ -d \"$CITIZENWALLET_PROJECT_ROOT\" && -f \"$CITIZENWALLET_PROJECT_ROOT/pubspec.yaml\" ]] \\\n  || { echo 'CitizenWallet Flutter 产品目录无效' >&2; exit 1; }\nBUILD_WORK_DIR=\"${CITIZENWALLET_BUILD_WORK_DIR:-$CITIZENWALLET_WORK_DIR/work}\"\nDEPENDENCY_WORK_DIR=\"${CITIZENWALLET_DEPENDENCY_DIR:-$CITIZENWALLET_WORK_DIR/dependencies}\"\nBUILD_DIR=\"${CITIZENWALLET_BUILD_DIR:-$BUILD_WORK_DIR/flutter}\"\nARTIFACT_ROOT=\"${CITIZENWALLET_ARTIFACT_DIR:-$CITIZENWALLET_WORK_DIR}\"\n# Pub始终向工程根写.dart_tool；build-dir不能改变这个位置。先解析真实路径，\n# 拒绝工程根、.dart_tool及Kotlin持久目录链接把生成状态导回产品源码，再允许任何写入。\npython3 - \"$CITIZENWALLET_WORK_DIR\" \"$CITIZENWALLET_PROJECT_ROOT\" \"$CITIZENWALLET_PROJECT_ROOT/.dart_tool\" \"$CITIZENWALLET_WORK_DIR\" \"$BUILD_WORK_DIR\" \"$BUILD_WORK_DIR/kotlin-project\" \"$DEPENDENCY_WORK_DIR\" \"$BUILD_DIR\" \"$ARTIFACT_ROOT\" <<'CHECK_OUTPUTS'\nfrom pathlib import Path\nimport sys\nwork = Path(sys.argv[1]).resolve()\nfor value in sys.argv[2:]:\n    raw = Path(value)\n    target = raw.resolve()\n    if not raw.is_absolute() or raw != target or not (target == work or work in target.parents):\n        raise SystemExit(f'CitizenWallet可写目录必须属于当前任务且不得经过链接：{value}')\nCHECK_OUTPUTS\n# 固定平台布局只装配到本轮工程；逐层拒绝目录链接，禁止生成物回写源目录。\npython3 - \"$CITIZENWALLET_DIR\" \"$CITIZENWALLET_PROJECT_ROOT\" \"$PLATFORM\" \"$PREPARE_ONLY\" <<'PREPARE_PLATFORM'\nfrom pathlib import Path\nimport os\nimport shutil\nimport sys\nsource = Path(sys.argv[1]).resolve(strict=True)\nproject = Path(sys.argv[2])\nif project.resolve() != project or not any(project.is_relative_to(source / 'target' / scope) for scope in ('build', 'test')):\n    raise SystemExit('平台工程必须属于本产品build或test且不得经过链接')\npairs = [('ios/tests/RunnerTests.swift', 'ios/RunnerTests.swift'), ('ios/project/Runner.xcscheme', 'ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme'), ('ios/project/Runner.xcworkspacedata', 'ios/Runner.xcworkspace/contents.xcworkspacedata'), ('ios/native/placeholder.m', 'ios/signer/placeholder.m'), ('ios/native/citizenwallet_signer.podspec', 'ios/signer/citizenwallet_signer.podspec'), ('ios/tests/RunnerUITests.xctestplan', 'ios/RunnerUITests/RunnerUITests.xctestplan'), ('ios/tests/ImportWalletUITests.swift', 'ios/RunnerUITests/ImportWalletUITests.swift'), ('ios/tests/CreateWalletUITests.swift', 'ios/RunnerUITests/CreateWalletUITests.swift'), ('ios/source/Runner-Bridging-Header.h', 'ios/Runner/Runner-Bridging-Header.h'), ('ios/source/HardwareSecretvaultPlugin.swift', 'ios/Runner/HardwareSecretvaultPlugin.swift'), ('ios/resources/InfoPlist.xcstrings', 'ios/Runner/InfoPlist.xcstrings'), ('ios/source/AppDelegate.swift', 'ios/Runner/AppDelegate.swift'), ('ios/source/Info.plist', 'ios/Runner/Info.plist'), ('ios/source/SceneDelegate.swift', 'ios/Runner/SceneDelegate.swift'), ('ios/project/Runner.pbxproj', 'ios/Runner.xcodeproj/project.pbxproj'), ('ios/config/Debug.xcconfig', 'ios/Flutter/Debug.xcconfig'), ('ios/config/Release.xcconfig', 'ios/Flutter/Release.xcconfig'), ('ios/config/AppFrameworkInfo.plist', 'ios/Flutter/AppFrameworkInfo.plist'), ('ios/resources/AppIcon.json', 'ios/IconAssets/AppIcon.appiconset/Contents.json'), ('ios/resources/CitizenLaunchLogo.json', 'ios/IconAssets/CitizenLaunchLogo.imageset/Contents.json'), ('ios/project/project.xcworkspacedata', 'ios/Runner.xcodeproj/project.xcworkspace/contents.xcworkspacedata'), ('ios/project/ProjectWorkspaceChecks.plist', 'ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist'), ('ios/project/ProjectWorkspaceSettings.xcsettings', 'ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/WorkspaceSettings.xcsettings'), ('ios/resources/CitizenLaunchScreen.storyboard', 'ios/Runner/Base.lproj/CitizenLaunchScreen.storyboard'), ('ios/resources/Main.storyboard', 'ios/Runner/Base.lproj/Main.storyboard'), ('ios/project/RunnerWorkspaceChecks.plist', 'ios/Runner.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist'), ('ios/project/RunnerWorkspaceSettings.xcsettings', 'ios/Runner.xcworkspace/xcshareddata/WorkspaceSettings.xcsettings')] if sys.argv[3] == 'ios' else [\n    ('android/gradle-wrapper.properties', 'android/gradle/wrapper/gradle-wrapper.properties'),\n    ('android/settings.gradle.kts', 'android/settings.gradle.kts')]\nif sys.argv[3] == 'android':\n    import re\n    resources = source / 'android/resources'\n    if not resources.is_dir() or resources.is_symlink():\n        raise SystemExit('缺少普通Android资源原件目录')\n    for resource in sorted(resources.iterdir()):\n        match = re.fullmatch(r'(drawable(?:-v21)?|mipmap-anydpi-v26|values(?:-en|-night)?)_([a-z][a-z0-9_]*\\.xml)', resource.name)\n        if not match:\n            raise SystemExit('Android资源原件名称无效：' + resource.name)\n        pairs.append(('android/resources/' + resource.name, 'android/app/res/' + match[1] + '/' + match[2]))\n# 先完成所有输入验真，避免缺少工具时留下半套平台入口。\n# 本轮Xcode工程和Android settings已由准备阶段改写；装配继续核验本轮普通文件。\ninputs = [(project / origin if origin in ('ios/project/Runner.pbxproj', 'android/settings.gradle.kts') and (project / origin).is_file() else source / origin, destination) for origin, destination in pairs]\nfor relative in ('android/gradlew', 'android/gradlew.bat', 'android/gradle'):\n    if (source / relative).exists() or (source / relative).is_symlink():\n        raise SystemExit('产品源码残留Wrapper副本：' + relative)\nif sys.argv[3] == 'android' and sys.argv[4] == 'true':\n    # 远端直接运行Wrapper；原件来自该流程已安装的Flutter，不从产品取得或下载。\n    raw = os.environ.get('FLUTTER_ROOT', '')\n    flutter = Path(raw)\n    if not raw or not flutter.is_absolute() or not flutter.is_dir() or flutter.resolve() != flutter:\n        raise SystemExit('必须提供无链接的Flutter工具根')\n    for name in ('gradlew', 'gradlew.bat', 'gradle/wrapper/gradle-wrapper.jar'):\n        src = flutter / 'bin/cache/artifacts/gradle_wrapper' / name\n        if src.resolve() != src or not src.is_file() or src.stat().st_size == 0:\n            raise SystemExit('Flutter Wrapper原件缺失或为链接：' + name)\n        inputs.append((src, 'android/' + name))\nfor src, destination in inputs:\n    dst = project / destination\n    origin = str(src)\n    if not src.is_file() or src.is_symlink() or src.resolve() != src:\n        raise SystemExit('缺少普通平台输入：' + origin)\n    parent = dst.parent\n    while parent != project:\n        if parent.is_symlink():\n            raise SystemExit('平台目标祖先不得为链接：' + destination)\n        parent = parent.parent\n    if dst.is_symlink():\n        if dst.resolve(strict=True) != src:\n            raise SystemExit('平台入口来源不符：' + destination)\n        dst.unlink()\n    elif dst.exists():\n        if not dst.is_file() or dst.read_bytes() != src.read_bytes():\n            raise SystemExit('平台入口重复或内容漂移：' + destination)\n        continue\n    dst.parent.mkdir(parents=True, exist_ok=True)\n    shutil.copy2(src, dst)\n    if destination == 'android/gradlew':\n        dst.chmod(0o755)\nPREPARE_PLATFORM\n\"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$CITIZENWALLET_DIR/scripts/build.mjs\" icons \"$CITIZENWALLET_PROJECT_ROOT\" \"$PLATFORM\"\nif [[ \"$PREPARE_ONLY\" == true ]]; then\n  printf '%s\\n' \"$CITIZENWALLET_PROJECT_ROOT\"\n  exit 0\nfi\n# CocoaPods 会改写工程锁文件；先确认工程与工作目录均在当前任务target内，再把\n# 指向源码的锁文件链接原子替换为工程普通文件，禁止本机 Build 回写源码。\nif [[ \"$PLATFORM\" == ios ]]; then\n  python3 - \"$CITIZENWALLET_DIR/ios/Podfile.lock\" \"$CITIZENWALLET_PROJECT_ROOT/ios/Podfile.lock\" <<'DETACH_IOS_LOCK'\nfrom pathlib import Path\nimport os\nimport tempfile\nimport sys\n\nsource = Path(sys.argv[1]).resolve(strict=True)\nproject_lock = Path(sys.argv[2])\nif project_lock.is_symlink():\n    if project_lock.resolve(strict=True) != source:\n        raise SystemExit('CitizenWallet iOS工程锁文件链接目标不是本产品源码')\n    fd, temporary = tempfile.mkstemp(prefix='Podfile.lock.', dir=project_lock.parent)\n    try:\n        with os.fdopen(fd, 'wb') as output:\n            output.write(source.read_bytes())\n        os.replace(temporary, project_lock)\n    finally:\n        if os.path.exists(temporary):\n            os.unlink(temporary)\nDETACH_IOS_LOCK\nfi\ncd \"$CITIZENWALLET_PROJECT_ROOT\"\nexport CITIZENWALLET_BUILD_DIR=\"$BUILD_DIR\"\nexport CITIZENWALLET_NATIVE_ANDROID_DIR=\"${CITIZENWALLET_NATIVE_ANDROID_DIR:-$BUILD_WORK_DIR/native/android}\"\nexport CITIZENWALLET_NATIVE_IOS_DIR=\"${CITIZENWALLET_NATIVE_IOS_DIR:-$BUILD_WORK_DIR/native/ios}\"\nexport CARGO_TARGET_DIR=\"${CARGO_TARGET_DIR:-$BUILD_WORK_DIR/cargo}\"\nexport XDG_CONFIG_HOME=\"${XDG_CONFIG_HOME:-$DEPENDENCY_WORK_DIR/flutter-config}\"\nexport PUB_CACHE=\"${PUB_CACHE:-$DEPENDENCY_WORK_DIR/pub}\"\nexport GRADLE_USER_HOME=\"$DEPENDENCY_WORK_DIR/gradle\"\nexport CP_HOME_DIR=\"$DEPENDENCY_WORK_DIR/cocoapods\"\nexport TMPDIR=\"$CITIZENWALLET_WORK_DIR/tmp/\"\nexport FLUTTER_SUPPRESS_ANALYTICS=true COCOAPODS_DISABLE_STATS=true\nexport CITIZENWALLET_GRADLE_INIT_SCRIPT=\"${CITIZENWALLET_GRADLE_INIT_SCRIPT:-$CITIZENWALLET_WORK_DIR/gradle.init.gradle}\"\nexport CITIZENWALLET_FLUTTER_GRADLE_BUILD_DIR=\"${CITIZENWALLET_FLUTTER_GRADLE_BUILD_DIR:-$BUILD_WORK_DIR/flutter-gradle-plugin}\"\nmkdir -p \"$XDG_CONFIG_HOME\" \"$TMPDIR\" \"$CITIZENWALLET_FLUTTER_GRADLE_BUILD_DIR\"\n# Flutter Gradle 插件原件只读；其 Kotlin 会话与编译状态必须写入本轮工作目录。\nprintf '%s\\n' \\\n  'gradle.beforeProject { project ->' \\\n  '    def source = System.getenv(\"CITIZENWALLET_FLUTTER_GRADLE_ROOT\")' \\\n  '    def output = System.getenv(\"CITIZENWALLET_FLUTTER_GRADLE_BUILD_DIR\")' \\\n  '    if (source && output && project.rootDir.canonicalPath == new File(source).canonicalPath) {' \\\n  '        def suffix = project.path == \":\" ? \"root\" : project.path.substring(1).replace(\":\", \"/\")' \\\n  '        project.layout.buildDirectory.set(new File(output, suffix))' \\\n  '        project.extensions.extraProperties.set(\"kotlin.project.persistent.dir\", new File(output, suffix + \"/kotlin-project\").path)' \\\n  '    }' \\\n  '}' >\"$CITIZENWALLET_GRADLE_INIT_SCRIPT\"\n# Flutter只接受相对产品根的build-dir配置；把本轮绝对目录换算为相对路径，\n# 不能写死为产品源码下的cache/build，也不能在产品根生成build。\nFLUTTER_BUILD_RELATIVE=\"$(python3 -c 'import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))' \"$BUILD_DIR\" \"$CITIZENWALLET_PROJECT_ROOT\")\"\nflutter config --build-dir=\"$FLUTTER_BUILD_RELATIVE\" >/dev/null\n\nPUB_GET_ARGS=(--enforce-lockfile)\nGRADLE_ARGS=(--no-daemon)\ncase \"${CITIZENWALLET_PUB_OFFLINE:-false}\" in\n  true|false) ;;\n  *) echo 'CITIZENWALLET_PUB_OFFLINE只接受true或false' >&2; exit 1 ;;\nesac\nPUB_OFFLINE=\"${CITIZENWALLET_PUB_OFFLINE:-false}\"\ncase \"${CITIZENWALLET_OFFLINE:-false}\" in\n  true) PUB_OFFLINE=true; GRADLE_ARGS+=(--offline); export CARGO_NET_OFFLINE=true ;;\n  false) ;;\n  *) echo 'CITIZENWALLET_OFFLINE只接受true或false' >&2; exit 1 ;;\nesac\n# 任务级Pub预装只约束Pub；原整体离线开关仍同时约束Pub、Gradle和Cargo。\nif [[ \"$PUB_OFFLINE\" == true ]]; then PUB_GET_ARGS+=(--offline); fi\n\n# Flutter 版本及依赖配置由产品工程自行决定。\n\n# Flutter在缓存工程生成配置和插件清单；Gradle只从公民钱包真实android根启动，\n# 项目缓存、依赖缓存、编译物和临时文件继续使用当前Android任务缓存。\n# Kotlin持久状态不受--project-cache-dir控制，必须另传官方工程属性避免源码生成.kotlin。\nbuild_android_release() {\n  local properties flutter_command flutter_sdk android_sdk gradle_bin\n  local flutter_version dart_defines link_target java_home expected_gradle_version actual_gradle_version\n  gradle_bin=\"${CITIZENWALLET_GRADLE_BIN:?Android Build必须提供绝对Gradle工具路径}\"\n  [[ \"$gradle_bin\" == /* && -f \"$gradle_bin\" && -x \"$gradle_bin\" ]] \\\n    || { echo \"Android Gradle工具无效：$gradle_bin\" >&2; return 1; }\n  properties=\"$CITIZENWALLET_PROJECT_ROOT/android/local.properties\"\n  flutter_command=\"$(command -v flutter)\"\n  while [[ -L \"$flutter_command\" ]]; do\n    link_target=\"$(readlink \"$flutter_command\")\"\n    [[ \"$link_target\" == /* ]] || link_target=\"$(cd \"$(dirname \"$flutter_command\")\" && pwd -P)/$link_target\"\n    flutter_command=\"$link_target\"\n  done\n  flutter_sdk=\"$(cd \"$(dirname \"$flutter_command\")/..\" && pwd -P)\"\n  android_sdk=\"${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}\"\n  # JDK选择属于CitizenWallet产品流程：保留调用方选择；本机未传入时使用\n  # Android Studio随包JBR。Gradle自行报告工具错误，不增加外部前置门禁。\n  java_home=\"${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}\"\n  # Wrapper属性仍是产品的Gradle版本真源；调用方给出的工具必须与它完全一致。\n  expected_gradle_version=\"$(sed -nE 's@^distributionUrl=.*gradle-([0-9][0-9.]*)-bin\\.zip$@\\1@p' \\\n    \"$CITIZENWALLET_DIR/android/gradle-wrapper.properties\")\"\n  [[ -n \"$expected_gradle_version\" ]] || { echo 'Android Gradle版本声明无效' >&2; return 1; }\n  actual_gradle_version=\"$(JAVA_HOME=\"$java_home\" \"$gradle_bin\" --version | sed -n 's/^Gradle //p' | head -n 1)\"\n  [[ \"$actual_gradle_version\" == \"$expected_gradle_version\" ]] \\\n    || { echo 'Android Gradle工具版本与钱包锁定版本不一致' >&2; return 1; }\n  # 完整prepare已写入验真SDK与原始版本，资源解析和编译消费同一普通配置。\n  [[ -f \"$properties\" && ! -L \"$properties\" ]] \\\n    || { echo 'Android工程缺少完整prepare交付的local.properties' >&2; return 1; }\n  flutter_version=\"$(flutter --version --machine)\"\n  dart_defines=\"$(printf '%s' \"$flutter_version\" | python3 -c '\nimport base64, json, sys\nvalue = json.load(sys.stdin)\nfields = (\n    (\"FLUTTER_VERSION\", \"frameworkVersion\"),\n    (\"FLUTTER_CHANNEL\", \"channel\"),\n    (\"FLUTTER_GIT_URL\", \"repositoryUrl\"),\n    (\"FLUTTER_FRAMEWORK_REVISION\", \"frameworkRevision\"),\n    (\"FLUTTER_ENGINE_REVISION\", \"engineRevision\"),\n    (\"FLUTTER_DART_VERSION\", \"dartSdkVersion\"),\n)\nprint(\",\".join(base64.b64encode(f\"{name}={value[key]}\".encode()).decode() for name, key in fields))\n')\"\n  (\n    cd \"$CITIZENWALLET_PROJECT_ROOT/android\"\n    # 调用方提供同一已验真 Gradle 工具，任务目录只承载依赖和编译状态，不再下载工具分发包。\n    ANDROID_HOME=\"$android_sdk\" ANDROID_SDK_ROOT=\"$android_sdk\" JAVA_HOME=\"$java_home\" PATH=\"$java_home/bin:$PATH\" \\\n    CITIZENWALLET_FLUTTER_GRADLE_ROOT=\"$flutter_sdk/packages/flutter_tools/gradle\" \\\n    FLUTTER_ROOT=\"$flutter_sdk\" \"$gradle_bin\" \"${GRADLE_ARGS[@]}\" --stacktrace --no-problems-report \\\n      --init-script \"$CITIZENWALLET_GRADLE_INIT_SCRIPT\" \\\n      --project-cache-dir \"$BUILD_WORK_DIR/gradle-project\" \\\n      -Pkotlin.project.persistent.dir=\"$BUILD_WORK_DIR/kotlin-project\" \\\n      -Ptarget-platform=android-arm64 \\\n      -Ptarget=lib/main.dart \\\n      -Pbase-application-name=android.app.Application \\\n      -Pdart-defines=\"$dart_defines\" \\\n      -Pdart-obfuscation=false \\\n      -Ptrack-widget-creation=true \\\n      -Ptree-shake-icons=true \\\n      assembleRelease\n  )\n}\n\n# 仅清理当前工作目录中的候选包，不触碰源码或另一端。\nclean_platform_build_outputs() {\n  case \"$PLATFORM\" in\n    ios) rm -rf \"$BUILD_DIR/ios/iphoneos/Runner.app\" ;;\n    android) rm -f \"$BUILD_DIR/app/outputs/flutter-apk/\"*.apk ;;\n  esac\n  mkdir -p \"$BUILD_DIR\"\n}\n\n# 仅选择 Xcode 报告的一台可用 iOS 真机；不在无设备或多设备时回落模拟器。\nrun_ios_ui_tests() {\n  local xcodebuild_bin destinations device_id\n  xcodebuild_bin=\"${CITIZENWALLET_XCODEBUILD_BIN:?iOS Build必须提供绝对Xcode工具路径}\"\n  [[ \"$xcodebuild_bin\" == /* && -f \"$xcodebuild_bin\" && -x \"$xcodebuild_bin\" ]] \\\n    || { echo 'iOS Xcode工具无效' >&2; return 1; }\n  destinations=\"$(\"$xcodebuild_bin\" -workspace \"$CITIZENWALLET_PROJECT_ROOT/ios/Runner.xcworkspace\" \\\n    -scheme Runner -configuration Release -showdestinations)\"\n  device_id=\"$(printf '%s\\n' \"$destinations\" | python3 -c '\nimport re, sys\navailable = sys.stdin.read().split(\"Ineligible destinations\", 1)[0]\nids = re.findall(r\"\\{\\s*platform:iOS,\\s*arch:arm64,\\s*id:([0-9A-Fa-f-]+),\", available)\nif len(ids) != 1 or not re.fullmatch(r\"[0-9A-Fa-f]{8}-[0-9A-Fa-f-]{16,}\", ids[0]):\n    raise SystemExit(\"iOS UI测试需要唯一可用真机\")\nprint(ids[0])\n')\"\n  # 测试计划关闭自动屏幕采集，避免触发钱包既有录屏保护；Release 测试应用与编译物均留在调用方工作根。\n  \"$xcodebuild_bin\" test \\\n    -workspace \"$CITIZENWALLET_PROJECT_ROOT/ios/Runner.xcworkspace\" \\\n    -scheme Runner -configuration Release \\\n    -destination \"platform=iOS,id=$device_id\" \\\n    -only-testing:RunnerUITests -parallel-testing-enabled NO \\\n    -collect-test-diagnostics never \\\n    -derivedDataPath \"$BUILD_WORK_DIR/xcode-ui\" \\\n    -resultBundlePath \"$BUILD_WORK_DIR/ios-ui-tests.xcresult\"\n}\n\n\n# 已跟踪的 pallet_registry.dart 是构建输入；本机编译不得回写共享源码索引。\n\necho \"==> 清理 ${PLATFORM} 平台构建产物...\"\nclean_platform_build_outputs\necho \"==> 获取依赖...\"\nflutter pub get \"${PUB_GET_ARGS[@]}\"\n# 本机钱包 Build 与 CI 使用同一套单元和组件测试。先在本轮target Cargo 目录\n# 编译宿主 FFI 动态库，再运行 Flutter 测试；测试失败立即阻止后续平台编译与安装。\necho \"==> 编译宿主签名库并运行钱包测试...\"\n\"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$CITIZENWALLET_DIR/scripts/build.mjs\" native host\n# 测试缓存留在当前任务工程视图，避免相对路径重复拼接越界。\nflutter config --build-dir=test-build >/dev/null\nflutter test --no-pub\nflutter config --build-dir=\"$FLUTTER_BUILD_RELATIVE\" >/dev/null\n# Isar 与 QR 生成文件已经纳入仓库。本机四端编译只消费同一份源码，禁止两个平台在\n# 构建过程中同时运行 build_runner 改写源文件。\n\n# sr25519 原生签名库(schnorrkel)。签名、派生、验签全走它，缺库会在运行时才炸，\n# 所以必须先于 flutter build 产出；实现来自 citizenwallet/rust/source/sr25519.rs，\n# 由公民钱包独立维护。\necho \"==> 编译原生签名库（${PLATFORM}）...\"\n# 使用所属产品构建入口的绝对路径，工作目录切换后仍定位同一实现。\n\"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$CITIZENWALLET_DIR/scripts/build.mjs\" native \"$PLATFORM\"\n\n# 本脚本编译并运行既有测试；完整Build由产品入口继续签名验真、安装和回读。\n# `--release`只是本机优化配置，不表示或触发正式Release流程。\necho \"==> 编译本机优化安装包...\"\nif [[ \"$PLATFORM\" == ios ]]; then\n  flutter build ios --release\n  echo \"==> 在唯一真机运行 Release UI 测试...\"\n  run_ios_ui_tests\n  IOS_APP=\"$BUILD_DIR/ios/iphoneos/Runner.app\"\n  \"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$CITIZENWALLET_DIR/scripts/build.mjs\" native verify-ios-package \"$IOS_APP\"\n  echo \"\"\n  echo \"==> iOS Release编译和真机测试完成，继续签名验真、安装及回读。\"\nelif [[ \"$PLATFORM\" == android ]]; then\n  build_android_release\n  ANDROID_APK=\"$BUILD_DIR/app/outputs/flutter-apk/app-release.apk\"\n  [[ -f \"$ANDROID_APK\" ]] || {\n    echo \"Android 本机无私钥 APK 不存在\" >&2\n    exit 1\n  }\n  \"${PRODUCT_NODE_BIN:-${NODE:-node}}\" \"$CITIZENWALLET_DIR/scripts/build.mjs\" native verify-android-package \"$ANDROID_APK\"\n  # 未签名APK仅留在本轮工作根；产品完整入口随后使用已有身份签名、安装和回读。\n  mkdir -p \"$ARTIFACT_ROOT\"\n  cp \"$ANDROID_APK\" \"$ARTIFACT_ROOT/android.apk\"\n  echo \"==> Android未签名APK编译完成，继续使用已有身份签名、安装及回读。\"\nfi\n","native":"#!/usr/bin/env bash\n# 编译 CitizenWallet 冷钱包原生密码学库，放到 Flutter 能自动打包的位置。\n#\n# sr25519签名实现只属于citizenwallet/rust/source/sr25519.rs。\n# 本库是冷端FFI外壳，永久离线且不需要链。\n#\n# 前置条件：当前Rust编译器已具备目标平台标准库；本脚本只读检查，不自动安装。\n#\n# 用法：\n#   node scripts/build.mjs native            # 编译所有平台\n#   node scripts/build.mjs native android    # 仅 Android\n#   node scripts/build.mjs native ios        # 仅 iOS\n#   node scripts/build.mjs native macos      # 仅 macOS（flutter test 用）\nset -euo pipefail\n\nWALLET_DIR=\"${CITIZENWALLET_SOURCE_ROOT:?缺少所属产品源码根}\"\nRUST_DIR=\"$WALLET_DIR/rust\"\nLIB_NAME=\"libcitizenwallet_signer\"\nTARGET=\"${1:-all}\"\n\n# 宿主与平台库同属本轮产品工作根；独立调用也使用本产品声明的平台target。\n# 复用公开工作根校验，禁止旧“整棵源码外”规则误拒绝已验真的target任务。\nCITIZENWALLET_WORK_DIR=\"$(\"${PRODUCT_NODE_BIN:-${NODE:-node}}\" --input-type=module - \"$WALLET_DIR/scripts/build.mjs\" \"${CITIZENWALLET_WORK_DIR:-${PRODUCT_WORK_DIR:-}}\" \"$TARGET\" \"${PLATFORM:-${platform:-}}\" <<'CHECK_WORK'\nimport {pathToFileURL} from 'node:url';\nimport {dirname,join,relative,sep} from 'node:path';\nconst [entry,provided,target,explicit]=process.argv.slice(2);\nconst {checkWork,productTarget,temporaryRoot}=await import(pathToFileURL(entry));\nconst requested=target==='android'||target==='verify-android-package'?'android':target==='ios'||target==='verify-ios-package'?'ios':undefined;\nconst platform=explicit||requested||'ios';\nif(requested&&requested!==platform)throw Error('原生目标与当前任务平台不符');\nconst work=provided?checkWork(provided):temporaryRoot(platform,'tmp');\nif(!work.startsWith(productTarget(platform)+sep))throw Error('原生工作根与当前任务平台不符');\nprocess.stdout.write(work+'\\n');\nCHECK_WORK\n)\" || exit 1\nCITIZENWALLET_NATIVE_WORK_DIR=\"${CITIZENWALLET_NATIVE_WORK_DIR:-$CITIZENWALLET_WORK_DIR/work/native}\"\nexport CARGO_TARGET_DIR=\"${CARGO_TARGET_DIR:-$CITIZENWALLET_NATIVE_WORK_DIR/cargo-target}\"\nexport CITIZENWALLET_NATIVE_ANDROID_DIR=\"${CITIZENWALLET_NATIVE_ANDROID_DIR:-$CITIZENWALLET_NATIVE_WORK_DIR/android}\"\nexport CITIZENWALLET_NATIVE_IOS_DIR=\"${CITIZENWALLET_NATIVE_IOS_DIR:-$CITIZENWALLET_NATIVE_WORK_DIR/ios}\"\n# 全部原生产物与临时状态在编译前一次验真，不允许源码、其它任务或链接写入。\nexport TMPDIR=\"${TMPDIR:-$CITIZENWALLET_WORK_DIR/tmp/}\"\npython3 - \"$CITIZENWALLET_WORK_DIR\" \"$CITIZENWALLET_NATIVE_WORK_DIR\" \"$CARGO_TARGET_DIR\" \"$CITIZENWALLET_NATIVE_ANDROID_DIR\" \"$CITIZENWALLET_NATIVE_IOS_DIR\" \"$TMPDIR\" <<'CHECK_TARGET'\nfrom pathlib import Path\nimport sys\nwork = Path(sys.argv[1])\nfor value in sys.argv[2:]:\n    target = Path(value)\n    if not target.is_absolute() or target.resolve() != target or not target.is_relative_to(work) or target == work:\n        raise SystemExit('原生产物与临时目录必须属于当前任务且不得经过链接：' + value)\nCHECK_TARGET\nmkdir -p \"$TMPDIR\"\n\nensure_target() {\n  local target=\"$1\" target_lib\n  # 只检查当前Rust编译器已有的目标库；缺失即停止，构建不得自动安装工具。\n  target_lib=\"$(rustc --print target-libdir --target \"$target\")\" || return 1\n  [[ \"$target_lib\" == /* && -d \"$target_lib\" ]] \\\n    || { echo \"错误: Rust目标库目录无效：$target\" >&2; return 1; }\n  local core_libraries=(\"$target_lib\"/libcore-*.rlib)\n  local std_libraries=(\"$target_lib\"/libstd-*.rlib)\n  [[ -f \"${core_libraries[0]}\" && -f \"${std_libraries[0]}\" ]] \\\n    || { echo \"错误: 当前Rust缺少已安装目标库：${target}；构建停止\" >&2; return 1; }\n}\n\n# 4个sr25519 C符号必须齐全，禁止交付额外用途钥符号，否则 Dart 侧 lookupFunction 会在运行时才失败。\n# 注意平台差异：ELF 用 -D，Mach-O 用 -g，用错标志会误判为 0。\nverify_symbols() {\n  local lib=\"$1\"\n  local nm_flag=\"$2\"\n  local nm_bin\n  nm_bin=\"$(command -v llvm-nm || true)\"\n  if [ -z \"$nm_bin\" ]; then\n    local sdk_home=\"${ANDROID_HOME:-$HOME/Library/Android/sdk}\"\n    nm_bin=\"$(ls \"$sdk_home\"/ndk/*/toolchains/llvm/prebuilt/*/bin/llvm-nm 2>/dev/null | tail -1 || true)\"\n  fi\n  if [ -z \"$nm_bin\" ]; then\n    echo \"错误: 未找到 llvm-nm，不能验证原生库导出符号。\"\n    return 1\n  fi\n  local signer_count removed_export_count\n  signer_count=\"$(\"$nm_bin\" \"$nm_flag\" \"$lib\" 2>/dev/null | grep -c 'citizen_sr25519' || true)\"\n  removed_export_count=\"$(\"$nm_bin\" \"$nm_flag\" \"$lib\" 2>/dev/null | grep -c 'account_crypto_' || true)\"\n  if [ \"$signer_count\" != \"4\" ] || [ \"$removed_export_count\" != \"0\" ]; then\n    echo \"错误: $lib 符号不完整（citizen_sr25519_*=$signer_count/4, 禁用导出=$removed_export_count/0）\"\n    return 1\n  fi\n  echo \"    符号检查通过：citizen_sr25519_*=4, 禁用导出=0\"\n}\n\nverify_android_package() {\n  local package=\"$1\" expected=\"${CITIZENWALLET_NATIVE_ANDROID_DIR:?缺少CitizenWallet Android原生库目录}/arm64-v8a/$LIB_NAME.so\" entry temporary packaged\n  [[ -f \"$package\" ]] || { echo \"错误: Android 包不存在：$package\"; return 1; }\n  [[ -f \"$expected\" ]] || { echo \"错误: Android 原生库不存在：$expected\"; return 1; }\n  case \"$package\" in\n    *.apk) entry=\"lib/arm64-v8a/$LIB_NAME.so\" ;;\n    *.aab) entry=\"base/lib/arm64-v8a/$LIB_NAME.so\" ;;\n    *) echo \"错误: 只支持校验 APK/AAB：$package\"; return 1 ;;\n  esac\n  # 中文注释：Android 打包会剥离调试段，不能按原文件字节比对；从最终包提取后验证\n  # ELF 架构和真实导出符号，缺失、错 ABI 或错误库都会在上传前失败。\n  temporary=\"$(mktemp -d)\"\n  packaged=\"$temporary/$LIB_NAME.so\"\n  unzip -p \"$package\" \"$entry\" > \"$packaged\" || { rm -rf \"$temporary\"; return 1; }\n  [[ -s \"$packaged\" ]] || { rm -rf \"$temporary\"; echo \"错误: Android 包内原生库为空：$entry\"; return 1; }\n  file \"$packaged\" | grep -Eq 'ARM aarch64|ARM64' || {\n    rm -rf \"$temporary\"; echo \"错误: Android 包内原生库不是 arm64：$entry\"; return 1;\n  }\n  verify_symbols \"$packaged\" -D || { rm -rf \"$temporary\"; return 1; }\n  rm -rf \"$temporary\"\n  if unzip -Z1 \"$package\" | grep -E \"(^|/)lib/(armeabi-v7a|x86|x86_64)/$LIB_NAME\\\\.so$\"; then\n    echo \"错误: Android 包含未支持 ABI 的原生库。\"; return 1\n  fi\n  echo \"Android 包原生库门禁通过：$entry\"\n}\n\nverify_ios_package() {\n  local app_bundle=\"$1\" executable nm_bin symbols\n  executable=\"$app_bundle/Runner\"\n  [[ -f \"$executable\" ]] || { echo \"错误: iOS Runner 不存在：$executable\"; return 1; }\n  [[ \"$(lipo -archs \"$executable\")\" = \"arm64\" ]] || {\n    echo \"错误: iOS 真机包必须且只能包含 arm64：$(lipo -archs \"$executable\")\"; return 1;\n  }\n  nm_bin=\"$(xcrun --find llvm-nm)\"\n  symbols=\"$(\"$nm_bin\" -gU \"$executable\" 2>/dev/null | awk '{print $NF}' | sed 's/^_//' || true)\"\n  [[ \"$(printf '%s\\n' \"$symbols\" | grep -c '^citizen_sr25519_' || true)\" = \"4\" ]] || {\n    echo \"错误: iOS Runner 的 citizen_sr25519_* 符号不完整。\"; return 1;\n  }\n  [[ \"$(printf '%s\\n' \"$symbols\" | grep -c '^account_crypto_' || true)\" = \"0\" ]] || {\n    echo \"错误: iOS Runner包含禁用的用途钥导出。\"; return 1;\n  }\n  echo \"iOS 包原生库门禁通过：arm64与4个sr25519 FFI符号完整，禁用导出为零\"\n}\n\nbuild_android() {\n  echo \"\"\n  echo \"=== 编译 Android (arm64-v8a) ===\"\n  ensure_target aarch64-linux-android\n\n  local ndk_home=\"${ANDROID_NDK_HOME:-}\"\n  if [ -z \"$ndk_home\" ]; then\n    local sdk_home=\"${ANDROID_HOME:-$HOME/Library/Android/sdk}\"\n    ndk_home=\"$(ls -d \"$sdk_home/ndk/\"* 2>/dev/null | sort -V | tail -1 || true)\"\n  fi\n  if [ -z \"$ndk_home\" ] || [ ! -d \"$ndk_home\" ]; then\n    echo \"错误: 未找到 Android NDK。请设置 ANDROID_NDK_HOME 或通过 Android Studio 安装 NDK。\"\n    return 1\n  fi\n  echo \"使用 NDK: $ndk_home\"\n\n  local toolchain=\"\"\n  case \"$(uname -s)\" in\n    Darwin)\n      toolchain=\"$ndk_home/toolchains/llvm/prebuilt/darwin-x86_64\"\n      if [ ! -d \"$toolchain\" ]; then\n        toolchain=\"$ndk_home/toolchains/llvm/prebuilt/darwin-aarch64\"\n      fi\n      ;;\n    Linux)\n      toolchain=\"$ndk_home/toolchains/llvm/prebuilt/linux-x86_64\"\n      ;;\n    *)\n      echo \"错误: 当前系统不支持自动定位 Android NDK toolchain: $(uname -s)\"\n      return 1\n      ;;\n  esac\n  if [ ! -d \"$toolchain\" ]; then\n    echo \"错误: 未找到 Android NDK toolchain: $toolchain\"\n    return 1\n  fi\n\n  export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER=\"$toolchain/bin/aarch64-linux-android24-clang\"\n  export CC_aarch64_linux_android=\"$toolchain/bin/aarch64-linux-android24-clang\"\n  export AR_aarch64_linux_android=\"$toolchain/bin/llvm-ar\"\n\n  cd \"$RUST_DIR\"\n  cargo build --release --target aarch64-linux-android\n\n  # CitizenWallet Android 唯一支持 arm64-v8a；禁止重新生成任何 32 位或 x86 ABI。\n  local arm64_dest=\"${CITIZENWALLET_NATIVE_ANDROID_DIR:?缺少CitizenWallet Android原生库目录}/arm64-v8a\"\n  mkdir -p \"$arm64_dest\"\n  cp \"$CARGO_TARGET_DIR/aarch64-linux-android/release/$LIB_NAME.so\" \"$arm64_dest/\"\n  echo \"Android arm64-v8a: $arm64_dest/$LIB_NAME.so ($(wc -c < \"$arm64_dest/$LIB_NAME.so\" | tr -d ' ') bytes)\"\n  verify_symbols \"$arm64_dest/$LIB_NAME.so\" -D\n}\n\nbuild_ios() {\n  echo \"\"\n  echo \"=== 编译 iOS (arm64 真机) ===\"\n  ensure_target aarch64-apple-ios\n\n  # 宿主测试继承macOS SDK；真机目标必须切到同一已供给Xcode的iphoneos SDK。\n  # xcrun只读定位已安装SDK，不下载，不改变全流程或宿主的SDKROOT。\n  local ios_sdk\n  ios_sdk=\"$(\"${XCRUN:-xcrun}\" --sdk iphoneos --show-sdk-path)\" || return 1\n  [[ \"$ios_sdk\" == /* && -d \"$ios_sdk\" ]] \\\n    || { echo \"错误: 已供给Xcode缺少iOS SDK\" >&2; return 1; }\n  cd \"$RUST_DIR\"\n  # 真机Cargo明确消费资源回执的Clang，不从PATH寻找cc或其它版本。\n  local ios_clang=\"${CC:?缺少已验真Xcode的Clang入口}\"\n  [[ \"$ios_clang\" == /* && -f \"$ios_clang\" && -x \"$ios_clang\" && ! -L \"$ios_clang\" ]] \\\n    || { echo \"错误: 缺少已供给Clang规范绝对入口\" >&2; return 1; }\n  SDKROOT=\"$ios_sdk\" CARGO_TARGET_AARCH64_APPLE_IOS_LINKER=\"$ios_clang\" \\\n    CC_aarch64_apple_ios=\"$ios_clang\" cargo build --release --target aarch64-apple-ios\n\n  # iOS 用**静态库**而非 dylib：裸 .dylib 需嵌入 + 单独签名，且 App Store 要求\n  # 动态库必须包在 .framework 里；静态库直接链进 App 二进制，无这些坑。\n  # 符号经 podspec 的 -force_load 保留，Dart 侧用 DynamicLibrary.process() 取。\n  local dest=\"${CITIZENWALLET_NATIVE_IOS_DIR:?缺少CitizenWallet iOS原生库目录}\"\n  mkdir -p \"$dest\"\n  cp \"$CARGO_TARGET_DIR/aarch64-apple-ios/release/$LIB_NAME.a\" \"$dest/\"\n  echo \"iOS arm64: $dest/$LIB_NAME.a ($(wc -c < \"$dest/$LIB_NAME.a\" | tr -d ' ') bytes)\"\n  verify_symbols \"$dest/$LIB_NAME.a\" \"\"\n}\n\nbuild_host() {\n  echo \"\"\n  echo \"=== 编译宿主平台动态库 (flutter test 用) ===\"\n  cd \"$RUST_DIR\"\n  # host 调试库给 Dart FFI / flutter test 直接 dlopen；release profile 已设\n  # strip=false，本机 dyld 不会报 LINKEDIT 对齐错误。\n  cargo build --release\n\n  # 宿主扩展名：macOS 产 .dylib，Linux 产 .so；Dart 侧 native_sr25519.dart 按同一规则取。\n  local host_ext\n  case \"$(uname -s)\" in\n    Darwin) host_ext=dylib ;;\n    *)      host_ext=so ;;\n  esac\n  local host_lib=\"$CARGO_TARGET_DIR/release/$LIB_NAME.$host_ext\"\n  echo \"宿主库: $host_lib ($(wc -c < \"$host_lib\" | tr -d ' ') bytes)\"\n  verify_symbols \"$host_lib\" -g\n}\n\ncase \"$TARGET\" in\n  android) build_android ;;\n  ios)     build_ios ;;\n  host|macos|linux) build_host ;;\n  verify-android-package)\n    [[ \"$#\" -eq 2 ]] || { echo \"用法: $0 verify-android-package <apk|aab>\"; exit 1; }\n    verify_android_package \"$2\"\n    exit 0\n    ;;\n  verify-ios-package)\n    [[ \"$#\" -eq 2 ]] || { echo \"用法: $0 verify-ios-package <Runner.app>\"; exit 1; }\n    verify_ios_package \"$2\"\n    exit 0\n    ;;\n  all)\n    build_android\n    build_ios\n    build_host\n    ;;\n  *)\n    echo \"用法: $0 [android|ios|macos|all|verify-android-package|verify-ios-package]\"\n    exit 1\n    ;;\nesac\n\necho \"\"\necho \"=== 编译完成 ===\"\necho \"flutter build / flutter run 会自动把 native library 打包进 App。\"\n"});

export async function runEmbeddedBuild(command,args,environment=process.env,cwd=process.cwd(),options={}) {
 if(!Object.hasOwn(BUILD_SHELL_SOURCES,command))fail('未知构建子步骤');
 const requested=String(args[0]||'').replace(/^prepare-/, '').replace(/^verify-/, '').replace(/-package$/, '');
 if(command==='wallet')platformContract(requested);
 const supplied=environment.CITIZENWALLET_WORK_DIR||environment.PRODUCT_WORK_DIR;
 if(command==='native'&&!supplied)fail('原生子步骤缺少当前平台现场');
 const work=supplied||temporaryRoot(requested,'build');checkWork(work);
 if(Object.hasOwn(contract.platforms,requested)&&work!==fixedWork('test')&&work!==fixedWork('build/'+requested))fail('子步骤平台与当前任务现场不符');
 return withFixedWork(taskScope(work),()=>embeddedBuildTask(command,args,{...environment,CITIZENWALLET_WORK_DIR:work},cwd,options),{environment});
}
async function embeddedBuildTask(command,args,environment=process.env,cwd=process.cwd(),options={}) {
 const shell=environment.PRODUCT_BASH_BIN||environment.PRODUCT_TEST_SHELL||'/bin/bash';
 const directory=join(environment.CITIZENWALLET_WORK_DIR,'embedded',command);mkdirSync(directory,{recursive:true});
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

 return completeBuild(platform,work,receipt,env,base);
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
function buildSourcePath(base,name) {
 if(typeof base!=='string'||!isAbsolute(base)||resolve(base)!==base||realpathSync(base)!==base)fail('商店身份源码根不是准确物理目录');
 if(typeof name!=='string'||!name||name.includes('\\')||/[\x00-\x1f\x7f]/u.test(name)||name.split('/').some(v=>!v||v==='.'||v==='..'))fail('商店身份源码路径无效');
 const path=join(base,name);
 let ancestor=parse(path).root;
 for(const part of relative(ancestor,dirname(path)).split(sep)){
  ancestor=join(ancestor,part);if(!lstatSync(ancestor).isDirectory()||realpathSync(ancestor)!==ancestor)fail('商店身份源码父目录不安全');
 }
 return path;
}
export function readBuildSource(base,name) {
 const path=buildSourcePath(base,name),before=lstatSync(path);
 if(!before.isFile()||before.nlink!==1||before.size<=0||before.size>1_048_576)fail('商店身份源码不是有界独占普通文件');
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const opened=fstatSync(fd);
  if(!opened.isFile()||opened.nlink!==1||opened.dev!==before.dev||opened.ino!==before.ino||opened.size!==before.size)fail('商店身份源码打开期间变化');
  const data=Buffer.alloc(opened.size);let offset=0;
  while(offset<data.length){let count;try{count=readSync(fd,data,offset,data.length-offset,offset);}catch(error){if(error.code==='EINTR')continue;throw error;}if(count<=0)fail('商店身份源码读取失败');offset+=count;}
  const after=fstatSync(fd),current=lstatSync(buildSourcePath(base,name));
  const same=value=>value.isFile()&&value.nlink===1&&['dev','ino','size','mtimeMs','ctimeMs'].every(key=>value[key]===opened[key]);
  if(data.length!==opened.size||!same(after)||!same(current))fail('商店身份源码读取期间变化');
  return data;
 }finally{closeSync(fd);}
}
// OpenStep工程由产品自己的解析器读取。拒绝重复键、未闭合语法、过深结构和尾随内容。
export function androidPackageName() {
 const directory=join(root,'android/app');const paths=['build.gradle.kts','build.gradle'].map(n=>join(directory,n)).filter(existsSync);
 if(paths.length!==1)fail('Android应用工程不唯一');
 const values=[...readFileSync(paths[0],'utf8').matchAll(/\bapplicationId\s*(?:=\s*)?["']([A-Za-z0-9_.]+)["']/gu)].map(row=>row[1]);
 if(values.length!==1||!/^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/u.test(values[0]))fail('Android应用标识无效');return values[0];
}
export function androidUSBSerials(text,{allowPending=false}={}) {
 const lines=text.trim().split(/\r?\n/u);if(lines.shift()!=='List of devices attached')fail('ADB设备列表无效');
 const serials=[],seen=new Set();for(const line of lines.filter(Boolean)){
  const parts=line.trim().split(/\s+/u),serial=parts[0];if(!parts.some(x=>x.startsWith('usb:')))continue;
  if(!(allowPending?['device','unauthorized','offline']:['device']).includes(parts[1])||!serial||serial.includes(':')||serial.startsWith('emulator-')||!/^[A-Za-z0-9._-]+$/u.test(serial)||seen.has(serial))fail('USB设备状态或身份无效');
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
// Xcode的swiftc入口可以是指向swift-frontend的包内链接；消费供给回执中的规范真实目标。
export function swiftCompilerForVerifier(env) {
 const developer=env?.DEVELOPER_DIR,compiler=env?.SWIFT;
 if(typeof developer!=='string'||!isAbsolute(developer)||resolve(developer)!==developer||typeof compiler!=='string')fail('安全验真器必须使用登记Xcode的Swift编译器');
 const entry=join(developer,'Toolchains/XcodeDefault.xctoolchain/usr/bin/swiftc');let actual;
 try{if(realpathSync(developer)!==developer||!lstatSync(developer).isDirectory())throw Error();actual=realpathSync(entry);}catch{fail('安全验真器必须使用登记Xcode的Swift编译器');}
 const info=lstatSync(actual);if(compiler!==actual||!inside(developer,actual)||!info.isFile()||info.isSymbolicLink()||!(info.mode&0o111))fail('安全验真器必须使用登记Xcode的Swift编译器');
 // 官方swiftc是包内入口链接；执行它才能让Swift驱动以swiftc模式解析编译参数。
 return entry;
}
async function nativeVerifier(work,env) {
 const compiler=swiftCompilerForVerifier(env);
 const state=executions.getStore();if(state?.verifier)return state.verifier;
 const dir=join(work,'product-verifier');mkdirSync(dir,{mode:0o700});const source=join(dir,'verify.swift'),binary=join(dir,'verify');
 writeFileSync(source,IOS_VERIFIER_SOURCE,{flag:'wx',mode:0o600});
 await run(compiler,['-O','-module-cache-path',join(work,'cache/swift'),'-framework','Security','-framework','CryptoKit',source,'-o',binary],env,work);
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
// ADB只复用宿主既有授权身份；构建工具仍使用本轮隔离HOME和缓存。
export function androidADBEnvironment(env,base,work) {
 const home=base?.HOME;
 if(typeof home!=='string'||!isAbsolute(home)||realpathSync(home)!==home||home===work||inside(work,home))fail('ADB宿主HOME必须位于当前任务之外');
 const directory=join(home,'.android'),key=join(directory,'adbkey'),info=lstatSync(key,{throwIfNoEntry:false});
 if(!info?.isFile()||info.isSymbolicLink()||realpathSync(key)!==key)fail('ADB既有主机授权身份缺失：'+key);
 return {...env,HOME:home,USERPROFILE:home,ANDROID_USER_HOME:directory,ADB_VENDOR_KEYS:key};
}
function adbDiagnostic(result) {
 return ('退出码 '+result.code+'：'+(result.stderr.trim()||result.stdout.trim()||'ADB未返回诊断')).slice(0,1600);
}
export async function waitAndroidDevice(adb,target,env,work,{signal=executions.getStore()?.signal,timeout=60000,pollMs=1000}={}) {
 const deadline=Date.now()+timeout;let last;
 while(Date.now()<deadline){
  signal?.throwIfAborted();
  try{last=await runBuildProcess(adb,[...target,'get-state'],env,work,{capture:true,accepted:[0,1],signal,timeout:Math.max(1,Math.min(10000,deadline-Date.now()))});}
  catch(error){signal?.throwIfAborted();if(error.message==='产品工具超时'&&Date.now()>=deadline)break;throw error;}
  if(last.code===0&&last.stdout.trim()==='device')return 'ready';
  if(target.length===1&&target[0]==='-d'&&last.stderr.includes('more than one device'))return 'multiple';
  if(Date.now()<deadline)await pauseBuild(Math.min(pollMs,deadline-Date.now()),signal);
 }
 fail('ADB等待USB设备授权超时，'+(last?adbDiagnostic(last):'未取得设备状态'));
}
export async function installAndroidAPK(adb,target,apk,env,work) {
 const result=await runBuildProcess(adb,[...target,'install','-r',apk],env,work,{capture:true,accepted:[0,1],timeout:600000});
 if(result.code!==0||!result.stdout.split(/\r?\n/u).includes('Success'))fail('Android USB安装失败，'+adbDiagnostic(result));
 return result;
}
async function completeAndroid(platform,work,receipt,env,base) {
 const packageName=androidPackageName();
 const definitions=(await Promise.resolve(resourceInternals)).resourceDeclarations().android;
 const {signer,analyzer,adb,keytool}=androidSigningTools(receipt,env,definitions);
 const adbEnv=androidADBEnvironment(env,base,work);
 const adbCall=args=>runBuildProcess(adb,args,adbEnv,work,{capture:true,accepted:[0,1],timeout:600000});
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
  await waitAndroidDevice(adb,target,adbEnv,work);
  if(outputDigest(signed)!==digest)fail('Android安装前签名产物改变');
  await installAndroidAPK(adb,target,signed,adbEnv,work);
  await readback(target,index);
 };
 const readback=async(target,index)=>{
  const result=await adbCall([...target,'shell','pm','path',packageName]);
  if(result.code!==0&&(result.stdout.trim()||result.stderr.trim()))fail('Android安装回读失败，'+adbDiagnostic(result));
  const path=androidInstalledPath(result);
  if(!path)fail('Android安装后包缺失');const file=join(work,'installed-after-'+index+'.apk');
  if(existsSync(file))fail('Android回读路径已存在');const pulled=await adbCall([...target,'pull',path,file]);if(pulled.code!==0)fail('Android APK回读失败，'+adbDiagnostic(pulled));
  if(realpathSync(file)!==file||JSON.stringify(await inspect(file,certificate))!==JSON.stringify(version))fail('Android安装后产品、证书或版本不一致');
 };
 await saveMobileArtifact(platform,work,signed);
 if(outputDigest(signed)!==digest)fail('Android安装前签名产物改变');
 if(await waitAndroidDevice(adb,['-d'],adbEnv,work)==='ready')await install(['-d'],0);
 else{
  const listed=await adbCall(['devices','-l']);if(listed.code!==0)fail('ADB读取USB设备失败，'+adbDiagnostic(listed));
  const serials=androidUSBSerials(listed.stdout,{allowPending:true}),failures=[];
  for(let i=0;i<serials.length;i++){executions.getStore()?.signal?.throwIfAborted();try{await install(['-s',serials[i]],i);}catch(error){executions.getStore()?.signal?.throwIfAborted();failures.push(serials[i]+'：'+error.message);}}
  if(failures.length)fail('Android USB安装或回读失败'+failures.length+'/'+serials.length+'，已尝试全部设备；'+failures.join('；'));
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
async function completeMobile(platform,work,receipt,env,base) {
 executions.getStore()?.signal?.throwIfAborted();if(platform.endsWith('android'))await completeAndroid(platform,work,receipt,env,base);else await completeIOS(platform,work,receipt,env);
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

export async function execute(platform,work,request={},options={}) {
 checkFixedWork(work,{create:true});
 return withFixedWork(taskScope(work),()=>executeTask(platform,work,request,options),{run_id:request.run_id,environment:options.environment||process.env,retain:(options.environment||process.env).PRODUCT_RESOURCE_FD==='4'||(options.environment||process.env).PRODUCT_HOST_FD==='3'});
}
function validateBuildRequest(request){
 if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).some(k=>!['run_id','program_digest'].includes(k))
  ||request.run_id!==undefined&&!/^[1-9][0-9]{8}$/u.test(request.run_id)||request.program_digest!==undefined&&!/^[a-f0-9]{64}$/u.test(request.program_digest)
  )fail('本仓Build只接受任务编号、程序输入记录及显式供给方式');
}
async function executeTask(platform,work,request={},options={}) {
 checkWork(work);platformContract(platform);
 if(!inside(productTarget(platform),work)||work===productTarget(platform))fail('执行工作根与当前产品平台不一致');
 options.signal?.throwIfAborted();
 validateBuildRequest(request);
 chmodSync(work,0o700);
 const lock=join(work,'.product-build.lock'),resultFile=join(work,'build-result.json');
 if(existsSync(resultFile))fail('本轮完整Build已有结果，禁止复用旧终态');
 const handle=openSync(lock,'wx',0o600);closeSync(handle);
 const cancellation=new AbortController(),abort=()=>cancellation.abort();options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();
 const state={signal:cancellation.signal,cancellation,host:options.host,unconfirmed:false,finished:false};
 try{return await executions.run(state,async()=>{
  const stages=options.stages||{requirements,resources:(...args)=>Promise.resolve(resourceInternals).then(m=>m.resources(...args)),prepare,build};
  const resourcesOptions={signal:state.signal,offline:Boolean(options.offline),environment:options.environment||process.env};
  if((options.environment||process.env).PRODUCT_RESOURCE_FD==='4'){
   state.resourceClient=options.resourceClient||createResourceSupplyClient(new Socket({fd:4,readable:true,writable:true}),state.signal);
   resourcesOptions.supply=previous=>state.resourceClient({previous});
  }
  await stages.requirements(platform,work);state.signal.throwIfAborted();
  let receipt=await stages.resources(platform,work,request,resourcesOptions);state.signal.throwIfAborted();
  await stages.prepare(platform,work,receipt,resourcesOptions.environment);state.signal.throwIfAborted();
  await stages.requirements(platform,work);
  receipt=await stages.resources(platform,work,receipt,resourcesOptions);state.signal.throwIfAborted();
  const result=await stages.build(platform,work,receipt,resourcesOptions.environment);state.signal.throwIfAborted();
  checkBuildResult(result,platform,work,request.run_id);
  writeFileSync(resultFile,JSON.stringify(result)+'\n',{flag:'wx',mode:0o600});return result;
 });}catch(error){if(String(error?.message).includes('退出未确认'))state.unconfirmed=true;throw error;}finally{state.finished=true;state.socket?.destroy();options.signal?.removeEventListener('abort',abort);state.resourceClient?.close?.();if(!state.unconfirmed){unlinkSync(lock);if((options.environment||process.env).PRODUCT_RESOURCE_FD!=='4')clearWork(work);}}
}
export function checkBuildResult(value,platform,work,runId) {
 const wallet=platformContract(platform);
 if(value===null||typeof value!=='object'||Array.isArray(value)||value.product_id!==product
  ||value.platform!==platform||value.work!==work||value.schema!==1||value.run_id!==runId||value.completion!=='device-install')fail('钱包设备安装结果身份错误');
 if(wallet.completion!=='device-install'||!Array.isArray(value.files))fail('钱包本机接口必须回读真机安装');
 // iOS钱包在本仓直接验签和安装App，不虚构zip交付；Android保留已验真的APK。
 if(platform==='ios'){
  if(wallet.files.length||value.files.length)fail('钱包iOS安装回执不能夹带分发包');
 }else if(platform==='android'){
  if(wallet.files.length!==1||!wallet.files[0].endsWith('.apk')||value.files.length!==1)fail('钱包Android必须交付自身签名APK');
  const apk=value.files[0],expected=join(work,wallet.files[0]);
  if(apk.path!==expected||Object.keys(apk).sort().join(',')!=='path,sha256'||!inside(work,expected)||realpathSync(expected)!==expected
   ||!/^[a-f0-9]{64}$/u.test(apk.sha256)||outputDigest(expected)!==apk.sha256)fail('钱包APK与设备安装时的输出不同');
 }else fail('钱包未实现该设备平台');
 if(Object.keys(value).sort().join(',')!==(runId?'completion,files,platform,product_id,run_id,schema,work':'completion,files,platform,product_id,schema,work'))fail('钱包本机结果字段错误');
 return value;
}
async function completeBuild(platform,work,receipt,env,base) {
 const declared=platformContract(platform);
 if(declared.completion==='device-install')await completeMobile(platform,work,receipt,env,base);
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
export function createResourceSupplyClient(stream,signal){
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
  stream.write(JSON.stringify({...value,id,operation:'prepare'})+'\n');
 });
 request.close=()=>{signal?.removeEventListener('abort',abort);reject('资源供给已关闭');};return request;
}

// 模块先完成初始化，资源模块才能反向导入本文件的唯一校验；异步CLI在独立Promise中执行。

// 本产品在独立编译与调度编译中均清理自己的生成物。
export function cleanBuildPath(path,options={},environment=executions.getStore()?.buildEnvironment||process.env){
 const work=environment.PRODUCT_WORK_DIR||[...Object.keys(contract.platforms).map(platform=>fixedWork('build/'+platform)),fixedWork('test')].find(work=>path?.startsWith(work+sep));if(typeof work!=='string'||typeof path!=='string'||resolve(path)!==path||!path.startsWith(work+sep))fail('编译清理路径越界');
 checkFixedWork(work);let parent=dirname(path);while(!existsSync(parent))parent=dirname(parent);if(realpathSync(parent)!==parent)fail('编译清理父目录经过链接');
 rmSync(path,options);
}
export function cleanShellPaths(args,environment=process.env){
 const paths=args.filter(value=>!value.startsWith('-')),options={recursive:args.some(value=>/^-[^-]*[rR]/u.test(value)),force:args.some(value=>/^-[^-]*f/u.test(value))};if(!paths.length)fail('清理路径缺失');for(const path of paths)cleanBuildPath(resolve(path),options,environment);
}


async function runCLI(){
 const [operation,platform,flag,work]=process.argv.slice(2);
 if(operation==='execute'&&process.env.PRODUCT_RESOURCE_FD!=='4'){if(flag!=='--work'||work!==fixedWork('build/'+platform))fail('平台编译现场不符');return withFixedWork('build/'+platform,()=>runCommand(),{environment:process.env,retain:process.env.PRODUCT_HOST_FD==='3'});}
 if(operation==='execute')return runCommand();
 if(['resources','prepare','build'].includes(operation)&&flag==='--work'){
  checkWork(work);
  return withFixedWork(taskScope(work),()=>runCommand(),{environment:process.env,retain:process.env.PRODUCT_HOST_FD==='3'||process.env.PRODUCT_RESOURCE_FD==='4'});
 }
 return runCommand();
}
async function runCommand(){
 const [command,platform,option,work,...extra]=process.argv.slice(2);
 if(command==='finish'){
  if(platform!=='test'&&!Object.hasOwn(contract.platforms,platform)||work!==undefined||extra.length)fail('平台收尾入口参数无效');
  finishFixedWork(fixedWork(platform==='test'?'test':'build/'+platform),{run_id:option});return;
 }
 if(command==='clean'){cleanShellPaths(process.argv.slice(3));return;}
 if(command==='rsync'){const owned=process.env.PRODUCT_WORK_DIR;checkWork(owned);await withFixedWork(taskScope(owned),()=>copyFlutterArtifact(process.argv.slice(3),process.env),{environment:process.env});return;}
 if(command==='describe'){
  if(process.argv.length!==3)fail('编译声明只读入口不接受参数');
  process.stdout.write(JSON.stringify(contract)+'\n');return;
 }

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
 if(command==='execute'){platformContract(platform);if(work!==fixedWork('build/'+platform))fail('平台编译现场不符');}else checkWork(work);
 if(command==='requirements')process.stdout.write(JSON.stringify(requirements(platform,work))+'\n');
 else{
  const cancellation=new AbortController();for(const name of ['SIGTERM','SIGINT'])process.once(name,()=>cancellation.abort());
  let input='';for await(const chunk of process.stdin){input+=chunk;if(Buffer.byteLength(input)>2*1024*1024)fail('公开输入超限');}
  const request=input?JSON.parse(input):{},options={environment:process.env,signal:cancellation.signal,offline:extra.includes('--offline')};
  let result;
  if(command==='execute')validateBuildRequest(request);
  if(command==='execute'&&process.env.PRODUCT_RESOURCE_FD==='4'){
   result=await execute(platform,work,request,options);
  }else if(command==='execute'){
   const {bootstrapNode}=await Promise.resolve(resourceInternals);const node=await bootstrapNode(work,options);
   if(createHash('sha256').update(readFileSync(process.execPath)).digest('hex')!==createHash('sha256').update(readFileSync(node.path)).digest('hex')){
    const environment=Object.fromEntries(['HOME','USER','LOGNAME','LANG','LC_ALL','PRODUCT_TOOL_ROOT','PRODUCT_DEPENDENCY_ROOT','PRODUCT_HOST_FD','PRODUCT_WORK_LEASE'].filter(k=>typeof process.env[k]==='string').map(k=>[k,process.env[k]]));
    result=JSON.parse((await runBuildProcess(node.path,[fileURLToPath(import.meta.url),command,platform,option,work,...extra],workEnvironment(environment),root,{capture:true,streamError:true,input:JSON.stringify(request),signal:cancellation.signal,passHost:environment.PRODUCT_HOST_FD==='3'})).stdout);
   }else result=await execute(platform,work,request,options);
  }else if(command==='resources')result=await (await Promise.resolve(resourceInternals)).resources(platform,work,request,options);
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
const {readBuildSource,contract,requirements,resourceEnvironment,checkWork,productTarget,createView,prepare,prepareAndroidProjectInputs,checkArchives} = await import('./build.mjs');

const {decodePNG,resizePNG,generatePlatformIcons} = await import('../icons/generate.mjs');

const {default:fs}=await import('node:fs');
const {fixedWork,checkFixedWork,clearFixedWork,finishFixedWork}=await Promise.resolve(targetInternals);
// 本产品测试使用固定根；资源夹具的内部目录不成为另一套工作根。
const scripts=import.meta.dirname;
function fixtureWork(){const work=fixedWork('build/'+Object.keys(contract.platforms)[0]);if(fs.existsSync(work))finishFixedWork(work);return checkFixedWork(work,{create:true});}
function removeFixture(path,options={}){if(path===fixedWork('build/'+Object.keys(contract.platforms)[0])||path===fixedWork('test')){if(fs.existsSync(path))clearFixedWork(path);return;}fs.rmSync(path,options);}
test('iOS验真器接受同一Xcode的swiftc规范目标并拒绝替代入口',()=>{
 const work=fixtureWork(),developer=join(work,'Xcode.app/Contents/Developer'),bin=join(developer,'Toolchains/XcodeDefault.xctoolchain/usr/bin');
 try{
  mkdirSync(bin,{recursive:true});const frontend=join(bin,'swift-frontend'),link=join(bin,'swiftc');writeFileSync(frontend,'#!/bin/sh\nexit 0\n',{mode:0o755});symlinkSync('swift-frontend',link);
  assert.equal(swiftCompilerForVerifier({DEVELOPER_DIR:developer,SWIFT:frontend}),link);
  assert.throws(()=>swiftCompilerForVerifier({DEVELOPER_DIR:developer,SWIFT:link}),/登记Xcode/);
  assert.throws(()=>swiftCompilerForVerifier({DEVELOPER_DIR:developer,SWIFT:'/usr/bin/false'}),/登记Xcode/);
 }finally{removeFixture(work,{recursive:true});}
});
test('Android任务允许本轮native host子步骤并拒绝跨平台子步骤',async()=>{
 await assert.rejects(runEmbeddedBuild('native',['host'],{PATH:'/usr/bin:/bin'},process.cwd()),/原生子步骤缺少当前平台现场/);
 await withFixedWork('build/android',async work=>{
  const environment={PRODUCT_WORK_DIR:work,PRODUCT_BASH_BIN:'/usr/bin/false',PATH:'/usr/bin:/bin'};
  await assert.rejects(runEmbeddedBuild('native',['host'],environment,work),/产品工具执行失败/);
  await assert.rejects(runEmbeddedBuild('wallet',['ios'],environment,work),/子步骤平台与当前任务现场不符/);
 });
 assert.equal(fs.existsSync(fixedWork('build/android')),false);
});
test('iOS受控rsync入口只允许当前平台租约并调用本仓复制实现',async()=>{
 await withFixedWork('build/ios',async work=>{
  const owner=JSON.parse(fs.readFileSync(join(work,'.active.json'),'utf8'));
  const environment={PATH:'/usr/bin:/bin',FLUTTER_ROOT:'/usr',PRODUCT_WORK_DIR:work,PRODUCT_WORK_LEASE:owner.nonce,PRODUCT_RSYNC_BIN:'/usr/bin/true',PRODUCT_BASH_BIN:'/bin/bash'};
  const args=[join(scripts,'build.mjs'),'rsync','-a','/tmp/fixture-source','/tmp/fixture-target'];
  const accepted=spawnSync(process.execPath,args,{env:environment,encoding:'utf8',timeout:10000});assert.equal(accepted.status,0,accepted.stderr);
  const rejected=spawnSync(process.execPath,args,{env:{...environment,PRODUCT_WORK_LEASE:'foreign'},encoding:'utf8',timeout:10000});assert.notEqual(rejected.status,0);assert.match(rejected.stderr,/活跃|领取|守卫/);
  assert.equal(fs.existsSync(join(work,'.active.json')),true);
 });
 assert.equal(fs.existsSync(fixedWork('build/ios')),false);
});

function writeFixture(path,data,options){
 fs.writeFileSync(path,data,options);
 if(String(path).endsWith('/scripts/build.mjs')&&String(data).includes("../icons/generate.mjs")){
  const target=join(dirname(dirname(path)),'icons/generate.mjs');fs.mkdirSync(dirname(target),{recursive:true});
  fs.copyFileSync(join(root,'icons/generate.mjs'),target);
 }
}

function copyFixture(source,destination,...options){
 fs.copyFileSync(source,destination,...options);
 if(String(destination).endsWith('/scripts/build.mjs')){
  const target=join(dirname(dirname(destination)),'icons/generate.mjs');fs.mkdirSync(dirname(target),{recursive:true});
  fs.copyFileSync(join(root,'icons/generate.mjs'),target);
 }
}

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
 const {androidSigningTools}=await import('./build.mjs'),{resourceDeclarations}=await Promise.resolve(resourceInternals);
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
test('ADB使用宿主已有身份且不改变构建HOME和缓存，不生成替代身份',()=>{
 const area=sandbox();try{
  const home=join(area,'host'),work=join(area,'task'),directory=join(home,'.android'),key=join(directory,'adbkey');
  mkdirSync(directory,{recursive:true});mkdirSync(work);writeFixture(key,'synthetic-adb-identity');
  const env={HOME:work,USERPROFILE:work,ANDROID_USER_HOME:join(work,'android-user'),PUB_CACHE:join(work,'pub'),GRADLE_USER_HOME:join(work,'gradle'),CARGO_HOME:join(work,'cargo')};
  const adb=androidADBEnvironment(env,{HOME:home},work);
  assert.equal(adb.HOME,home);assert.equal(adb.USERPROFILE,home);assert.equal(adb.ANDROID_USER_HOME,directory);assert.equal(adb.ADB_VENDOR_KEYS,key);
  assert.equal(env.HOME,work);for(const name of ['PUB_CACHE','GRADLE_USER_HOME','CARGO_HOME'])assert.equal(adb[name],env[name]);
  assert.equal(readFileSync(key,'utf8'),'synthetic-adb-identity');
  assert.throws(()=>androidADBEnvironment(env,{HOME:work},work),/宿主HOME/);
  rmSync(key);assert.throws(()=>androidADBEnvironment(env,{HOME:home},work),/既有主机授权身份缺失/);assert.equal(existsSync(key),false);
 }finally{removeFixture(area,{recursive:true,force:true});}
});

test('ADB实际子进程先等待授权再安装，超时取消多USB和原始安装错误准确保留',async()=>{
 const area=sandbox();try{
  const work=join(area,'task'),adb=join(area,'adb-fixture'),trace=join(area,'trace'),counter=join(area,'count');mkdirSync(work);
  writeFixture(adb,'#!'+process.execPath+'\n'+[
   'import fs from "node:fs";',
   'const args=process.argv.slice(2),mode=process.env.TEST_MODE;',
   'fs.appendFileSync(process.env.TRACE,JSON.stringify(args)+"\\n");',
   'if(args.includes("get-state")){',
   ' if(mode==="multiple"){process.stderr.write("error: more than one device/emulator\\n");process.exit(1);}',
   ' const count=fs.existsSync(process.env.COUNTER)?Number(fs.readFileSync(process.env.COUNTER)):0;fs.writeFileSync(process.env.COUNTER,String(count+1));',
   ' if(mode==="never"||count===0){process.stderr.write("error: device unauthorized\\n");process.exit(1);}process.stdout.write("device\\n");',
   '}else if(args.includes("install")){',
   ' if(mode==="install-failure"){process.stderr.write("Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE]\\n");process.exit(1);}process.stdout.write("Success\\n");',
   '}else process.exit(91);',
  ].join('\n'),{mode:0o700});
  const env={HOME:work,TRACE:trace,COUNTER:counter},options={timeout:2000,pollMs:5};
  assert.equal(await waitAndroidDevice(adb,['-d'],env,work,options),'ready');
  const before=readFileSync(trace,'utf8').trim().split('\n').map(JSON.parse);assert.equal(before.length,2);assert.ok(before.every(args=>args.at(-1)==='get-state'));
  await installAndroidAPK(adb,['-d'],join(work,'signed.apk'),env,work);
  const calls=readFileSync(trace,'utf8').trim().split('\n').map(JSON.parse);assert.deepEqual(calls.at(-1),['-d','install','-r',join(work,'signed.apk')]);
  await assert.rejects(installAndroidAPK(adb,['-d'],'fixture.apk',{...env,TEST_MODE:'install-failure'},work),/退出码 1：Failure \[INSTALL_FAILED_UPDATE_INCOMPATIBLE\]/);
  await assert.rejects(waitAndroidDevice(adb,['-d'],{...env,TEST_MODE:'never'},work,{timeout:1500,pollMs:5}),/等待USB设备授权超时.*unauthorized/);
  assert.equal(await waitAndroidDevice(adb,['-d'],{...env,TEST_MODE:'multiple'},work,options),'multiple');
  assert.deepEqual(androidUSBSerials('List of devices attached\nFIRST unauthorized usb:1\nSECOND device usb:2\n',{allowPending:true}),['FIRST','SECOND']);
  const abort=new AbortController();abort.abort();const previous=readFileSync(trace,'utf8');
  await assert.rejects(waitAndroidDevice(adb,['-d'],env,work,{...options,signal:abort.signal}),/abort/i);assert.equal(readFileSync(trace,'utf8'),previous);
 }finally{removeFixture(area,{recursive:true,force:true});}
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
  const {prepareGradleResources}=await Promise.resolve(resourceInternals);
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

// 合并声明与资源同属当前编译入口，普通导入不启动任何流程。
test('唯一编译入口直接交付本仓声明并拒绝多余参数',()=>{
 const file=join(root,'scripts/build.mjs');
 const run=args=>spawnSync(process.execPath,[file,...args],{encoding:'utf8',env:{HOME:process.env.HOME,LANG:'C',PATH:''}});
 const ok=run(['describe']);assert.equal(ok.status,0,ok.stderr);assert.equal(ok.stderr,'');
 const value=JSON.parse(ok.stdout);assert.equal(value.product_id,'citizenwallet');
 assert.equal(value.entry,'scripts/build.mjs');assert.equal(value.resource_entry,'scripts/build.mjs');
 assert.deepEqual(Object.keys(value.platforms).sort(),['android','ios']);
 const invalid=run(['describe','extra']);assert.notEqual(invalid.status,0);assert.match(invalid.stderr,/只读入口不接受参数/);
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
test('公开资源客户端串行交付产品回执，错序回执、并发和取消直接失败',async()=>{
 const [client,provider]=resourcePipe(),supply=createResourceSupplyClient(client);let seq=0;
 provider.on('data',line=>{const request=JSON.parse(line);assert.deepEqual(Object.keys(request).sort(),['id','operation','previous']);assert.equal(request.operation,'prepare');assert.deepEqual(request.previous,{stage:seq});assert.equal(request.id,String(++seq));const reply=JSON.stringify({id:request.id,ok:true,value:{stage:seq}})+'\n';client.emit('data',reply.slice(0,4));client.emit('data',reply.slice(4));});
 assert.deepEqual(await supply({previous:{stage:0}}),{stage:1});assert.deepEqual(await supply({previous:{stage:1}}),{stage:2});supply.close();
 const [one]=resourcePipe(),bad=createResourceSupplyClient(one),pending=bad({previous:{}});one.emit('data',JSON.stringify({id:'2',ok:true,value:{}})+'\n');await assert.rejects(pending,/帧或请求身份/);await assert.rejects(bad({}),/禁止独立下载/);
 const [two]=resourcePipe(),abort=new AbortController(),cancelled=createResourceSupplyClient(two,abort.signal),waiting=cancelled({});await assert.rejects(cancelled({}),/禁止独立下载/);abort.abort();await assert.rejects(waiting,/取消/);cancelled.close();
});
test('供给模式在prepare前后使用同一资源通道；失败停止且不执行build',async()=>{
 for(const failing of [false,true]){const work=fixtureWork();try{
  const receipt=fixture(work),seen=[],request={run_id:'123456789'};
  const resourceClient=async message=>{seen.push('supply');assert.deepEqual(Object.keys(message),['previous']);if(failing)throw Error('supply unavailable');return receipt;};resourceClient.close=()=>seen.push('closed');
  const stages={requirements:()=>seen.push('requirements'),resources:async(_,__,previous,options)=>{assert.equal(typeof options.supply,'function');return options.supply(previous);},prepare:()=>seen.push('prepare'),build:()=>{seen.push('build');const file=join(work,contract.platforms.android.files[0]);writeFixture(file,'fixture');return {schema:1,product_id:contract.product_id,platform:'android',work,run_id:request.run_id,completion:contract.platforms.android.completion,files:[{path:file,sha256:outputDigest(file)}]};}};
  if(failing){await assert.rejects(execute('android',work,request,{stages,resourceClient,environment:{PRODUCT_RESOURCE_FD:'4'}}),/supply unavailable/);assert.deepEqual(seen,['requirements','supply','closed']);}
  else{await execute('android',work,request,{stages,resourceClient,environment:{PRODUCT_RESOURCE_FD:'4'}});assert.deepEqual(seen,['requirements','supply','prepare','requirements','supply','build','closed']);}
 }finally{removeFixture(work,{recursive:true,force:true});}}
});
test('CLI只接受本轮运行编号，额外字段在启动资源流程前拒绝',()=>{
 const work=sandbox();try{const plan=requirements('ios',work),pod=plan.locks.find(x=>x.ecosystem==='cocoapods');assert.equal(pod.path,'ios/Podfile.lock');assert.equal(pod.sha256,createHash('sha256').update(readFileSync(join(base,pod.path))).digest('hex'));
 const request={run_id:'123456789',unexpected:'provided'},result=spawnSync(process.execPath,[join(root,'scripts/build.mjs'),'execute','android','--work',work],{input:JSON.stringify(request),encoding:'utf8',env:{HOME:work,LANG:'C',PATH:''}});
 assert.notEqual(result.status,0);assert.match(result.stderr,/本仓Build只接受/);assert.deepEqual(readdirSync(work),[]);
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
 const value={schema:1,product_id:contract.product_id,platform:'ios',work,completion:'device-install',files:[]};assert.equal(checkBuildResult(value,'ios',work),value);assert.throws(()=>checkBuildResult({...value,completion:'compile-only'},'ios',work),/身份错误/);assert.throws(()=>checkBuildResult({...value,files:[{path:join(work,'ios.app.zip'),sha256:'a'.repeat(64)}]},'ios',work),/不能夹带分发包/);
 }finally{removeFixture(work,{recursive:true,force:true});}
});

test('合并构建入口输出原有分析规则且拒绝多余参数',()=>{
 const result=spawnSync(process.execPath,[import.meta.filename,'analysis-options'],{encoding:'utf8',env:{PATH:'',HOME:process.env.HOME}});
 assert.equal(result.status,0,result.stderr);
 assert.equal(result.stdout,'# 本产品独立维护的 Flutter 分析规则。\ninclude: package:flutter_lints/flutter.yaml\n\nanalyzer:\n  exclude:\n    - "**/*.g.dart"\n\nlinter:\n  rules:\n    use_build_context_synchronously: true\n');
 const invalid=spawnSync(process.execPath,[import.meta.filename,'analysis-options','extra'],{encoding:'utf8'});
 assert.equal(invalid.status,1);assert.equal(invalid.stdout,'');assert.match(invalid.stderr,/不接受参数/u);
});

// 平台工程与原生入口回归统一归属构建脚本，普通编译不运行脚本自测。
{
const {cpSync,unlinkSync}=fs;
const settings = readFileSync(new URL('../android/settings.gradle.kts', import.meta.url), 'utf8');
const root = readFileSync(new URL('../android/build.gradle.kts', import.meta.url), 'utf8');
const application = readFileSync(new URL('../android/app/build.gradle.kts', import.meta.url), 'utf8');
const properties = readFileSync(new URL('../android/gradle.properties', import.meta.url), 'utf8');
const wrapper = readFileSync(new URL('../android/gradle-wrapper.properties', import.meta.url), 'utf8');
const runner = BUILD_SHELL_SOURCES.wallet;
const signerPodspec = readFileSync(new URL('../ios/native/citizenwallet_signer.podspec', import.meta.url), 'utf8');
const iosProject = readFileSync(new URL('../ios/project/Runner.pbxproj', import.meta.url), 'utf8');
const iosScheme = readFileSync(new URL('../ios/project/Runner.xcscheme', import.meta.url), 'utf8');
const iosUiTestPlan = JSON.parse(readFileSync(new URL('../ios/tests/RunnerUITests.xctestplan', import.meta.url), 'utf8'));
const createUiTest = readFileSync(new URL('../ios/tests/CreateWalletUITests.swift', import.meta.url), 'utf8');
const importUiTest = readFileSync(new URL('../ios/tests/ImportWalletUITests.swift', import.meta.url), 'utf8');

// 构建脚本回归由门禁统一运行，夹具只消费明确交付的工具。
function tools() {
  const shell=process.env.PRODUCT_TEST_SHELL||process.env.PRODUCT_BASH_BIN;
  const python=process.env.PRODUCT_TEST_PYTHON||process.env.PYTHON;
  assert.ok(shell&&python,'须交付已验真Shell与Python入口');
  const path=process.env.PRODUCT_TEST_POSIX_BIN||process.env.PATH;
  assert.ok(path,'须交付已验真基础工具PATH');
  return {shell,env:{PATH:[dirname(shell),dirname(python),path,dirname(process.execPath)].join(':'),
    PRODUCT_NODE_BIN:process.execPath,PRODUCT_BASH_BIN:shell,PYTHONHOME:dirname(dirname(python)),LANG:'C'}};
}
// 夹具也拥有独立产品根及平台target，不能借用当前真实Build工作目录。
async function checkout(source) {
  mkdirSync(join(source,'scripts'),{recursive:true});
  copyFixture(fileURLToPath(new URL('../scripts/build.mjs',import.meta.url)),join(source,'scripts/build.mjs'));
  const put=(name,data)=>{mkdirSync(dirname(join(source,name)),{recursive:true});writeFileSync(join(source,name),data);};
  put('pubspec.yaml','name: citizenwallet\n');
  for(const name of ['ios/project/Runner.xcscheme','ios/Podfile.lock','android/gradle-wrapper.properties','android/settings.gradle.kts'])put(name,readFileSync(new URL('../'+name,import.meta.url)));
  for(const name of ['citizen-logo.png','app-icon.png','launch-logo.png','android-launcher.png','android-foreground.png'])put('icons/'+name,readFileSync(new URL('../icons/'+name,import.meta.url)));
  for(const name of ['config','native','project','resources','source','tests'])cpSync(fileURLToPath(new URL('../ios/'+name,import.meta.url)),join(source,'ios',name),{recursive:true});
  cpSync(fileURLToPath(new URL('../android/resources',import.meta.url)),join(source,'android/resources'),{recursive:true});
  return (await import(pathToFileURL(join(source,'scripts/build.mjs')))).withFixedWorkSync;
}

test('钱包嵌套原生入口独立物化Shell，不覆盖正在执行的钱包脚本', async context => {
  const area=realpathSync(mkdtempSync(join(tmpdir(),'wallet-nested-shell-')));context.after(()=>rmSync(area,{recursive:true,force:true}));
  const source=join(area,'independent-checkout'),withWork=await checkout(source),entry=join(source,'scripts/build.mjs'),bin=join(area,'bin'),trace=join(area,'trace'),supplied=tools();
  mkdirSync(join(source,'rust'));mkdirSync(bin);
  writeFileSync(join(bin,'cargo'),'#!'+supplied.shell+'\nprintf "%s" "$PWD" > "$TRACE"; exit 73\n',{mode:0o755});
  // 只缩短外层Shell正文；嵌套调用、脚本物化和原生入口均使用真实实现。
  const code=readFileSync(entry,'utf8'),line=code.split('\n').find(value=>value.startsWith('export const BUILD_SHELL_SOURCES=Object.freeze('));
  const wallet='set -euo pipefail\n"$PRODUCT_NODE_BIN" "$CITIZENWALLET_SOURCE_ROOT/scripts/build.mjs" native host\n';
  writeFileSync(entry,code.replace(line,'export const BUILD_SHELL_SOURCES=Object.freeze('+JSON.stringify({...BUILD_SHELL_SOURCES,wallet})+');'));
  withWork('test',(work,session)=>{
    const run=spawnSync(process.execPath,[entry,'wallet','ios'],{env:{...supplied.env,PATH:bin+':'+supplied.env.PATH,HOME:work,PRODUCT_WORK_DIR:work,PRODUCT_WORK_LEASE:session.owner.nonce,TRACE:trace},encoding:'utf8',timeout:10000});
    assert.equal(run.status,73,run.stderr);assert.equal(readFileSync(trace,'utf8'),join(source,'rust'));assert.doesNotMatch(run.stderr,/EEXIST/);
  });
});

test('钱包真实入口只在当前任务工程执行Pub，缺参和链接逃逸在写入前失败', async context => {
  const fixture=realpathSync(mkdtempSync(join(tmpdir(),'wallet-project-boundary-')));
  context.after(()=>rmSync(fixture,{recursive:true,force:true}));
  const source=join(fixture,'independent-checkout'),withWork=await checkout(source),script=join(source,'scripts/build.mjs'),bin=join(fixture,'bin');mkdirSync(bin);
  const supplied=tools(),trace=join(fixture,'trace');
  // Flutter只记录当前Pub目录并停止，工程边界仍执行真实实现。
  writeFileSync(join(bin,'flutter'),'#!'+supplied.shell+'\ncase "$1" in\nconfig) exit 0;;\npub) mkdir .dart_tool; printf "%s" "$PWD" > "$TRACE"; exit 73;;\n*) exit 90;;\nesac\n',{mode:0o755});
  for(const platform of ['ios','android'])withWork('test',(work,session)=>{
    const project=join(work,'source-view',source.replace(/^\/+/u,''));
    mkdirSync(join(project,'ios'),{recursive:true});writeFileSync(join(project,'pubspec.yaml'),readFileSync(join(source,'pubspec.yaml')));
    for(const name of ['icons','ios/resources','android/resources'])cpSync(join(source,name),join(project,name),{recursive:true});
    const run=projectRoot=>spawnSync(process.execPath,[script,'wallet',platform],{env:{...supplied.env,PATH:bin+':'+supplied.env.PATH,
      HOME:work,TMPDIR:join(work,'tmp'),PRODUCT_WORK_DIR:work,CITIZENWALLET_WORK_DIR:work,PRODUCT_WORK_LEASE:session.owner.nonce,TRACE:trace,
      ...(projectRoot===undefined?{}:{CITIZENWALLET_PROJECT_ROOT:projectRoot})},encoding:'utf8',timeout:10000});
    const missing=run();assert.notEqual(missing.status,0);assert.match(missing.stderr,/当前任务/u);
    for(const wrong of [source,resolve(source,'ios','..'),'.',join(fixture,'other-project')]) {
      const rejected=run(wrong);assert.notEqual(rejected.status,0);assert.match(rejected.stderr,/当前任务/u);assert.equal(existsSync(trace),false);
    }
    const link=join(work,'source-link');symlinkSync(source,link);assert.match(run(link).stderr,/当前任务/u);
    symlinkSync(source,join(project,'.dart_tool'));assert.match(run(project).stderr,/当前任务且不得经过链接/u);assert.equal(existsSync(trace),false);unlinkSync(join(project,'.dart_tool'));
    const kotlin=join(work,'work/kotlin-project');mkdirSync(dirname(kotlin),{recursive:true});symlinkSync(source,kotlin);
    assert.match(run(project).stderr,/当前任务且不得经过链接/u);assert.equal(existsSync(trace),false);unlinkSync(kotlin);
    const sourceLock=join(source,'ios/Podfile.lock'),projectLock=join(project,'ios/Podfile.lock'),original=readFileSync(sourceLock);
    if(platform==='ios') {
      const foreign=join(fixture,'foreign-lock');writeFileSync(foreign,'unrelated');symlinkSync(foreign,projectLock);
      assert.match(run(project).stderr,/锁文件链接目标不是本产品源码/u);assert.equal(existsSync(trace),false);unlinkSync(projectLock);symlinkSync(sourceLock,projectLock);
    }
    const accepted=run(project);assert.equal(accepted.status,73,accepted.stderr);assert.equal(readFileSync(trace,'utf8'),project);
    assert.equal(existsSync(join(project,'.dart_tool')),true);assert.deepEqual(readFileSync(sourceLock),original);
    if(platform==='ios'){assert.equal(lstatSync(projectLock).isSymbolicLink(),false);assert.deepEqual(readFileSync(projectLock),original);}
    unlinkSync(trace);
  });
});


test('钱包源码身份来自唯一产品包名而非检出目录名称', async context => {
  const fixture=realpathSync(mkdtempSync(join(tmpdir(),'wallet-source-identity-')));context.after(()=>rmSync(fixture,{recursive:true,force:true}));
  const source=join(fixture,'independent-checkout'),withWork=await checkout(source),script=join(source,'scripts/build.mjs'),manifest=join(source,'pubspec.yaml'),supplied=tools();
  withWork('test',(work,session)=>{
    const project=join(work,'source-view',source.replace(/^\/+/u,''));
    const run=()=>spawnSync(process.execPath,[script,'wallet','ios'],{env:{...supplied.env,HOME:work,TMPDIR:join(work,'tmp'),PRODUCT_WORK_DIR:work,CITIZENWALLET_WORK_DIR:work,PRODUCT_WORK_LEASE:session.owner.nonce},encoding:'utf8',timeout:10000});
    assert.match(run().stderr,/当前任务/u);
    for(const value of ['name: other_product\n','name: citizenwallet\nname: citizenwallet\n']) {
      writeFileSync(manifest,value);assert.match(run().stderr,/源码身份无效/u);assert.equal(existsSync(project),false);
    }
    unlinkSync(manifest);const foreign=join(fixture,'foreign.yaml');writeFileSync(foreign,'name: citizenwallet\n');symlinkSync(foreign,manifest);
    assert.match(run().stderr,/源码身份无效/u);assert.equal(existsSync(project),false);
  });
});


test('Android从当前任务工程启动Gradle并把可写状态放入本轮工作目录', () => {
  // 中文注释：JNI只消费唯一CMake版本，不修改上游插件或要求另一套工具。
  const jni = root.match(/if \(name == "jni"\) \{([\s\S]*?)\n    \}/u)?.[1];
  assert.equal(typeof jni, 'string');
  assert.match(jni, /plugins\.withId\("com\.android\.library"\)/u);
  assert.match(jni, /extensions\.configure<com\.android\.build\.api\.dsl\.LibraryExtension>/u);
  assert.match(jni, /externalNativeBuild\.cmake\.version = "3\.31\.6"/u);
  const appCmake = root.match(/else if \(name == "app"\) \{([\s\S]*?)\n    \}/u)?.[1];
  assert.equal(typeof appCmake, 'string');
  assert.match(appCmake, /plugins\.withId\("com\.android\.application"\)/u);
  assert.match(appCmake, /extensions\.configure<com\.android\.build\.api\.dsl\.ApplicationExtension>/u);
  assert.match(appCmake, /externalNativeBuild\.cmake\.version = "3\.31\.6"/u);
  assert.equal((root.match(/externalNativeBuild\.cmake\.version/g) ?? []).length, 2);
  // 两处版本必须在应用求值锁定DSL之前登记。
  const evaluation = root.indexOf('project.evaluationDependsOn(":app")');
  assert.ok(evaluation > 0);
  for (const version of root.matchAll(/externalNativeBuild\.cmake\.version/g)) {
    assert.ok(version.index < evaluation, 'CMake版本登记不得晚于应用求值');
  }
  assert.match(settings, /System\.getenv\("CITIZENWALLET_PROJECT_ROOT"\)/u);
  assert.match(settings, /settingsDir\.parentFile/u);
  assert.match(settings, /resolve\("android\/local\.properties"\)/u);
  assert.match(settings, /\.flutter-plugins-dependencies/u);
  assert.doesNotMatch(settings, /dev\.flutter\.flutter-plugin-loader|System\.getProperty\("user\.dir"\)/u);
  assert.doesNotMatch(settings, /id\("com\.android\.(?:application|library)"\)\s+version/u);
  assert.match(root, /System\.getenv\("CITIZENWALLET_BUILD_DIR"\)/u);
  assert.match(root, /System\.getProperty\("java\.io\.tmpdir"\)/u);
  assert.match(application, /import java\.util\.Properties/u);
  assert.doesNotMatch(application, /java\.util\.Properties\(\)/u);
  assert.match(application, /compileSdk = 36/u);
  assert.match(application, /ndkVersion = "28\.2\.13676358"/u);
  assert.match(application, /minSdk = 24/u);
  assert.match(application, /targetSdk = 36/u);
  assert.doesNotMatch(application, /(?:compileSdk|ndkVersion|minSdk|targetSdk)\s*=.*\bflutter\./u);
  assert.deepEqual(properties.split('\n').filter((line) => /^android\.(?:builtInKotlin|newDsl)=/u.test(line)), [
    'android.builtInKotlin=true',
    'android.newDsl=true',
  ]);
  assert.match(root, /classpath\("com\.android\.tools\.build:gradle:9\.0\.1"\)/u);
  assert.match(root, /classpath\("org\.jetbrains\.kotlin:kotlin-gradle-plugin:2\.2\.20"\)/u);
  assert.match(wrapper, /gradle-9\.1\.0-bin\.zip/u);
  assert.match(wrapper, /distributionSha256Sum=a17ddd85a26b6a7f5ddb71ff8b05fc5104c0202c6e64782429790c933686c806/u);
  assert.doesNotMatch(`${root}\n${wrapper}`, /gradle-(?:8\.|9\.1\.0-all)/u);
  assert.match(application, /System\.getenv\("CITIZENWALLET_PROJECT_ROOT"\) \?: "\.\.\/\.\."/u);
  assert.match(application, /System\.getenv\("CITIZENWALLET_NATIVE_ANDROID_DIR"\)/u);
  assert.match(runner, /cd "\$CITIZENWALLET_PROJECT_ROOT\/android"/u);
  assert.match(runner, /gradle_bin="\$\{CITIZENWALLET_GRADLE_BIN:\?Android Build必须提供绝对Gradle工具路径\}"/u);
  assert.match(runner, /distributionUrl=\.\*gradle-/u);
  assert.match(runner, /actual_gradle_version=.*"\$gradle_bin" --version/u);
  assert.match(runner, /FLUTTER_ROOT="\$flutter_sdk" "\$gradle_bin" "\$\{GRADLE_ARGS\[@\]\}"/u);
  assert.doesNotMatch(runner, /"\$CITIZENWALLET_DIR\/android\/gradlew"/u);
  assert.match(runner, /--init-script "\$CITIZENWALLET_GRADLE_INIT_SCRIPT"/u);
  assert.match(runner, /-Pkotlin\.project\.persistent\.dir="\$BUILD_WORK_DIR\/kotlin-project"/u);
  assert.match(runner, /CITIZENWALLET_FLUTTER_GRADLE_ROOT="\$flutter_sdk\/packages\/flutter_tools\/gradle"/u);
  assert.match(runner, /cp "\$ANDROID_APK" "\$ARTIFACT_ROOT\/android\.apk"/u);

  assert.ok(application.includes('sourceSets.getByName("main").kotlin.directories.apply { clear(); add("source") }'));
  assert.ok(application.includes('manifest.srcFile("source/AndroidManifest.xml")'));
  assert.ok(existsSync(fileURLToPath(new URL('../android/app/source/AndroidManifest.xml', import.meta.url))));
  assert.ok(application.includes('sourceSets.getByName("test").kotlin.directories.clear()'));
  assert.ok(application.includes('if (name.endsWith("UnitTestKotlin"))'));
  assert.ok(application.includes('source(layout.projectDirectory.file("HardwareSecretvaultPluginTest.kt"))'));
  assert.doesNotMatch(application, /setSrcDirs|include\("HardwareSecretvaultPluginTest/u);

  const javaSources = application.slice(application.indexOf('sourceSets.getByName("main").java.directories.apply'),
    application.indexOf('sourceSets.getByName("main").java.directories.apply') + 260);
  assert.ok(javaSources.includes('add(flutterProductRoot.resolve("android/app/src/main/java").absolutePath)'));
});

test('CitizenWallet依赖准备默认联网且离线模式必须显式选择', () => {
  assert.match(runner, /PUB_GET_ARGS=\(--enforce-lockfile\)/u);
  assert.match(runner, /CITIZENWALLET_OFFLINE:-false/u);
  assert.match(runner, /CITIZENWALLET_PUB_OFFLINE:-false/u);
  assert.match(runner, /GRADLE_ARGS=\(--no-daemon\)/u);
  assert.match(runner, /project\.extensions\.extraProperties\.set\("kotlin\.project\.persistent\.dir", new File\(output, suffix \+ "\/kotlin-project"\)\.path\)/u);
  assert.match(runner, /true\) PUB_OFFLINE=true; GRADLE_ARGS\+=\(--offline\); export CARGO_NET_OFFLINE=true/u);
  assert.match(runner, /"\$gradle_bin" "\$\{GRADLE_ARGS\[@\]\}" --stacktrace/u);
  assert.match(runner, /if \[\[ "\$PUB_OFFLINE" == true \]\]; then PUB_GET_ARGS\+=\(--offline\); fi/u);
  assert.match(runner, /flutter pub get "\$\{PUB_GET_ARGS\[@\]\}"/u);
});

test('本机钱包Build在平台编译前先运行依赖宿主FFI的Flutter测试', () => {
  const pub = runner.indexOf('flutter pub get "${PUB_GET_ARGS[@]}"');
  const host = runner.indexOf('"${PRODUCT_NODE_BIN:-${NODE:-node}}" "$CITIZENWALLET_DIR/scripts/build.mjs" native host');
  const tests = runner.indexOf('flutter test --no-pub');
  const platform = runner.indexOf('"${PRODUCT_NODE_BIN:-${NODE:-node}}" "$CITIZENWALLET_DIR/scripts/build.mjs" native "$PLATFORM"');
  assert.ok(pub >= 0 && pub < host && host < tests && tests < platform);
  assert.match(runner, /set -euo pipefail/u);
  assert.doesNotMatch(runner, /--test/u);
});

// 中文注释：执行真实测试段，验证输出恢复及失败阻断；不执行编译或钱包操作。
test('宿主测试缓存保持工程视图内，成功恢复平台输出且失败阻断', () => {
  const begin = runner.indexOf('flutter config --build-dir=test-build');
  const endText = 'flutter config --build-dir="$FLUTTER_BUILD_RELATIVE" >/dev/null';
  const end = runner.indexOf(endText, begin) + endText.length;
  assert.ok(begin > 0 && end > begin);
  const fragment = runner.slice(begin, end);
  for (const status of [0, 73]) {
    const result = spawnSync('/bin/bash', ['-c',
      'set -euo pipefail\nFLUTTER_BUILD_RELATIVE=../../../../work/flutter\n'
      + 'flutter() { case "$1" in config) printf "%s\\n" "$2" >&2;; test) printf "%s\\n" "$*" >&2; return "$TEST_STATUS";; *) return 90;; esac; }\n'
      + fragment + '\nprintf "platform-ready"'], {
      env: { TEST_STATUS: String(status) }, encoding: 'utf8', timeout: 3000,
    });
    assert.equal(result.status, status, result.stderr);
    assert.deepEqual(result.stderr.trim().split('\n'), status === 0
      ? ['--build-dir=test-build', 'test --no-pub', '--build-dir=../../../../work/flutter']
      : ['--build-dir=test-build', 'test --no-pub']);
    assert.equal(result.stdout, status === 0 ? 'platform-ready' : '');
  }
  const project = '/fixture/work/project';
  const cache = resolve(project, 'test-build', 'test_cache', 'test-build', 'cache.dill');
  assert.ok(cache.startsWith(project + '/'));
});

test('iOS真机只在Release配置运行钱包两页UI测试且不触发有效钱包操作', () => {
  assert.match(iosProject, /RunnerUITests\.xctest.*com\.apple\.product-type\.bundle\.ui-testing/su);
  assert.match(iosProject, /RunnerTests\.xctest.*DEVELOPMENT_TEAM = MHYMVRN6FC/su);
  assert.match(iosScheme, /<TestAction\s+buildConfiguration = "Release"/u);
  assert.match(iosProject, /RunnerUITests\.xctestplan.*path = RunnerUITests\.xctestplan/su);
  assert.match(iosScheme, /reference = "container:RunnerUITests\/RunnerUITests\.xctestplan"/u);
  assert.doesNotMatch(iosScheme, /<Testables>/u);
  assert.equal(iosUiTestPlan.defaultOptions.uiTestingScreenshotsLifetime, 'keepNever');
  assert.deepEqual(iosUiTestPlan.testTargets.map(({ target }) => target.name), ['RunnerTests', 'RunnerUITests']);
  assert.match(runner, /-only-testing:RunnerUITests -parallel-testing-enabled NO/u);
  assert.match(runner, /-collect-test-diagnostics never/u);
  assert.match(runner, /-destination "platform=iOS,id=\$device_id"/u);
  assert.match(runner, /-resultBundlePath "\$BUILD_WORK_DIR\/ios-ui-tests\.xcresult"/u);
  assert.match(createUiTest, /192 位熵，词数与安全性平衡/u);
  assert.match(createUiTest, /XCTAssertEqual\(password\.frame\.width, optionWidth/u);
  assert.doesNotMatch(createUiTest, /app\.buttons\["创建钱包"\]\.tap\(\)/u);
  assert.match(importUiTest, /count: 23/u);
  assert.match(importUiTest, /label CONTAINS %@", "助记词必须为 12、18 或 24 个单词"/u);
  assert.match(importUiTest, /input\.typeText\(" zzzz"\)/u);
  assert.doesNotMatch(importUiTest, /typeText\("(?:abandon|ability|able)/u);
});

test('iOS签名库只强制链接四个sr25519导出', () => {
  assert.match(signerPodspec, /library_path = File\.expand_path\('libcitizenwallet_signer\.a', native_dir\)/u);
  assert.doesNotMatch(signerPodspec, /s\.vendored_libraries\s*=/u);
  assert.doesNotMatch(signerPodspec, /account_crypto_/u);
  assert.match(signerPodspec, /'OTHER_LDFLAGS' => "-force_load #\{library_path\} /u);
  for (const symbol of [
    'citizen_sr25519_derive_hard',
    'citizen_sr25519_public_key',
    'citizen_sr25519_sign',
    'citizen_sr25519_verify',
  ]) {
    assert.ok(signerPodspec.includes(`-Wl,-u,_${symbol}`), `缺少链接符号 ${symbol}`);
  }
});

// 执行真实装配入口，不启动 Flutter、相机或密钥操作。
test('钱包平台装配读取唯一扁平来源并拒绝重复目标', async context => {
  const fixture=realpathSync(mkdtempSync(join(tmpdir(),'citizenwallet-platform-')));context.after(()=>rmSync(fixture,{recursive:true,force:true}));
  const source=join(fixture,'independent-checkout'),withWork=await checkout(source),script=join(source,'scripts/build.mjs'),supplied=tools(),flutter=join(fixture,'flutter');
  const generated=['GeneratedPluginRegistrant.h','GeneratedPluginRegistrant.m'];
  mkdirSync(join(source,'ios/Runner'),{recursive:true});
  for(const name of generated)writeFileSync(join(source,'ios/Runner',name),'old generated file');
  const names=['gradlew','gradlew.bat','gradle/wrapper/gradle-wrapper.jar'];
  for(const name of names){const path=join(flutter,'bin/cache/artifacts/gradle_wrapper',name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,'synthetic wrapper '+name);}
  for(const platform of ['android','ios'])withWork('test',(work,session)=>{
    const env={...supplied.env,HOME:work,TMPDIR:join(work,'tmp'),PRODUCT_WORK_DIR:work,FLUTTER_ROOT:flutter,CITIZENWALLET_WORK_DIR:work,PRODUCT_WORK_LEASE:session.owner.nonce};
    const run=(extra={})=>spawnSync(process.execPath,[script,'wallet',`prepare-${platform}`],{env:{...env,...extra},encoding:'utf8',timeout:10000});
    const prepared=run();assert.equal(prepared.status,0,prepared.stderr);
    const project=prepared.stdout.trim();assert.equal(project,join(work,'source-view'));
    assert.equal(existsSync(join(project,'target')),false);assert.equal(lstatSync(join(project,'pubspec.yaml')).isSymbolicLink(),false);
    for(const name of generated){assert.equal(existsSync(join(project,'ios/Runner',name)),false);assert.equal(readFileSync(join(source,'ios/Runner',name),'utf8'),'old generated file');}
    const target=platform==='ios'?'ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme':'android/gradle/wrapper/gradle-wrapper.properties';
    const original=platform==='ios'?'ios/project/Runner.xcscheme':'android/gradle-wrapper.properties';
    assert.deepEqual(readFileSync(join(project,target)),readFileSync(join(source,original)));assert.equal(lstatSync(join(project,target)).isSymbolicLink(),false);
    assert.notEqual(run().status,0,'重复目标不能覆盖已有工程');
    for(const name of names){
      const output=join(project,'android',name),original=join(flutter,'bin/cache/artifacts/gradle_wrapper',name);
      if(platform==='android'){assert.equal(lstatSync(output).isSymbolicLink(),false);assert.deepEqual(readFileSync(output),readFileSync(original));}
      else assert.equal(existsSync(output),false);
      assert.equal(readFileSync(original,'utf8'),'synthetic wrapper '+name);
    }
    if(platform==='android'){
      assert.ok(lstatSync(join(project,'android/gradlew')).mode&0o100);
      rmSync(project,{recursive:true,force:true});assert.notEqual(run({FLUTTER_ROOT:join(fixture,'absent')}).status,0);
      rmSync(project,{recursive:true,force:true});
      const sourceWrapper=join(source,'android/gradlew');writeFileSync(sourceWrapper,'unexpected source wrapper');
      assert.match(run().stderr,/源码残留Wrapper/u);unlinkSync(sourceWrapper);
    }else{writeFileSync(join(project,'pubspec.yaml'),'isolated');assert.equal(readFileSync(join(source,'pubspec.yaml'),'utf8'),'name: citizenwallet\n');}
  });
});






test('原生构建只检查当前Rust目标库，缺失或查询失败不得自动补装', context => {
  const native = BUILD_SHELL_SOURCES.native;
  const ensure = native.match(/^ensure_target\(\) \{\n[\s\S]*?^\}/mu)?.[0];
  assert.ok(ensure, '目标库检查函数存在');
  assert.doesNotMatch(native, /rustup|sh[.]rustup[.]rs/u);
  const fixture = mkdtempSync(join(tmpdir(), 'wallet-rust-target-'));
  context.after(() => rmSync(fixture, { recursive: true, force: true }));
  const library = join(fixture, 'target libraries');
  mkdirSync(library);
  const core = join(library, 'libcore-fixture.rlib');
  const standard = join(library, 'libstd-fixture.rlib');
  const trace = join(fixture, 'query');
  // 运行真实检查函数；仅模拟Rust查询与标准库文件，不执行编译或下载。
  function run(mode = 'ready', directory = library) {
    const script = [
      'set -euo pipefail',
      'rustc() { printf "%s\\n" "$*" >"$TRACE"; [[ "$MODE" != query_failure ]] || return 85; printf "%s" "$LIBDIR"; }',
      'rustup() { echo "禁止调用安装器" >&2; exit 95; }',
      ensure,
      'ensure_target aarch64-linux-android',
    ].join('\n');
    const supplied=tools();
    return spawnSync(supplied.shell, ['-c', script], {
      env: { ...supplied.env, HOME:fixture, TMPDIR:fixture, TRACE: trace, MODE: mode, LIBDIR: directory },
      encoding: 'utf8', timeout: 3000,
    });
  }
  writeFileSync(core, 'fixture');
  writeFileSync(standard, 'fixture');
  const ready = run();
  assert.equal(ready.status, 0, ready.stderr);
  assert.equal(readFileSync(trace, 'utf8'), '--print target-libdir --target aarch64-linux-android\n');
  for (const missing of [standard, core]) {
    unlinkSync(missing);
    const rejected = run();
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stderr, /缺少已安装目标库/u);
    assert.doesNotMatch(rejected.stderr, /禁止调用安装器/u);
    writeFileSync(missing, 'fixture');
  }
  for (const [mode, directory] of [
    ['query_failure', library], ['ready', 'relative'],
    ['ready', join(fixture, 'not-installed')],
  ]) {
    const rejected = run(mode, directory);
    assert.notEqual(rejected.status, 0);
    assert.doesNotMatch(rejected.stderr, /禁止调用安装器/u);
  }
});

// 真正执行原生入口；Cargo只记录经过验真的工作目录后退出，不模拟路径检查。
test('原生宿主库消费固定任务目录，外部缓存归位且输出链接在Cargo前拒绝', async context => {
  const fixture=realpathSync(mkdtempSync(join(tmpdir(),'wallet-native-boundary-')));context.after(()=>rmSync(fixture,{recursive:true,force:true}));
  const source=join(fixture,'independent-checkout'),withWork=await checkout(source);mkdirSync(join(source,'rust'));
  const supplied=tools(),bin=join(fixture,'bin'),trace=join(fixture,'trace');mkdirSync(bin);
  writeFileSync(join(bin,'cargo'),'#!'+supplied.shell+'\nprintf "%s\\n%s" "$PWD" "$CARGO_TARGET_DIR" > "$TRACE"; exit 73\n',{mode:0o755});
  for(const platform of ['ios','android'])withWork('test',(work,session)=>{
    const target=join(work,'work/cargo-target'),env={...supplied.env,PATH:bin+':'+supplied.env.PATH,HOME:work,
      TMPDIR:join(work,'tmp'),PLATFORM:platform,PRODUCT_WORK_DIR:work,PRODUCT_WORK_LEASE:session.owner.nonce,TRACE:trace,CARGO_TARGET_DIR:target};
    const run=(extra={},kind='host')=>spawnSync(process.execPath,[join(source,'scripts/build.mjs'),'native',kind],{env:{...env,...extra},encoding:'utf8',timeout:10000});
    // 生命周期将外部缓存输入归位到当前现场，不能把非零Cargo状态误判为边界拒绝。
    for(const extra of [{CARGO_TARGET_DIR:source},{CARGO_TARGET_DIR:'.'},{CARGO_TARGET_DIR:join(fixture,'foreign')},{TMPDIR:source}]) {
      const normalized=run(extra);assert.equal(normalized.status,73,normalized.stderr);
      assert.equal(readFileSync(trace,'utf8'),join(source,'rust')+'\n'+(extra.CARGO_TARGET_DIR?join(work,'cargo'):target));unlinkSync(trace);
    }
    for(const name of ['CITIZENWALLET_NATIVE_WORK_DIR','CITIZENWALLET_NATIVE_ANDROID_DIR','CITIZENWALLET_NATIVE_IOS_DIR']){
      assert.notEqual(run({[name]:source}).status,0);assert.equal(existsSync(trace),false);
    }
    const link=join(work,'escape');symlinkSync(source,link);
    assert.match(run({CARGO_TARGET_DIR:join(link,'generated')}).stderr,/链接/u);assert.equal(existsSync(trace),false);
    assert.notEqual(run({},platform==='ios'?'android':'ios').status,0);assert.equal(existsSync(trace),false);
    for(const wrong of [source,join(work,'current')]){assert.notEqual(run({PRODUCT_WORK_DIR:wrong}).status,0);assert.equal(existsSync(trace),false);}
    const accepted=run();assert.equal(accepted.status,73,accepted.stderr);assert.equal(readFileSync(trace,'utf8'),join(source,'rust')+'\n'+target);unlinkSync(trace);
    // 独立入口拥有自己的固定build现场，不继承测试任务的租约或可写状态。
    const independent=run({PRODUCT_WORK_DIR:'',PRODUCT_WORK_LEASE:'',CARGO_TARGET_DIR:'',TMPDIR:''});assert.equal(independent.status,73,independent.stderr);
    assert.equal(readFileSync(trace,'utf8'),join(source,'rust')+'\n'+join(source,'target/build/cargo'));unlinkSync(trace);
  });
});


test('iOS原生目标使用已交付Xcode的iphoneos SDK，查询或缺件失败在Cargo前停止', async context => {
  const fixture=realpathSync(mkdtempSync(join(tmpdir(),'wallet-native-ios-sdk-')));context.after(()=>rmSync(fixture,{recursive:true,force:true}));
  const source=join(fixture,'independent-checkout'),withWork=await checkout(source);mkdirSync(join(source,'rust'));
  const supplied=tools();
  withWork('test',(work,session)=>{
    const bin=join(work,'bin'),sdk=join(work,'iphoneos-sdk'),stdlib=join(work,'stdlib');
    for(const dir of [bin,sdk,stdlib])mkdirSync(dir,{recursive:true});
    for(const name of ['libcore-fixture.rlib','libstd-fixture.rlib'])writeFileSync(join(stdlib,name),'existing');
    const trace=join(work,'trace'),xcrun=join(bin,'xcrun'),clang=join(bin,'clang');
    writeFileSync(clang,'#!'+supplied.shell+'\nexit 0\n',{mode:0o755});
    writeFileSync(join(bin,'rustc'),'#!'+supplied.shell+'\nprintf "%s" "$STDLIB"\n',{mode:0o755});
    writeFileSync(xcrun,'#!'+supplied.shell+'\n[[ "$*" == "--sdk iphoneos --show-sdk-path" ]] || exit 91; printf "%s" "$IOS_SDK"\n',{mode:0o755});
    writeFileSync(join(bin,'cargo'),'#!'+supplied.shell+'\nprintf "%s\\n%s\\n%s" "$SDKROOT" "$CARGO_TARGET_AARCH64_APPLE_IOS_LINKER" "$CC_aarch64_apple_ios" > "$TRACE"; exit 73\n',{mode:0o755});
    const env={...supplied.env,PATH:bin+':'+supplied.env.PATH,HOME:work,PRODUCT_WORK_DIR:work,PRODUCT_WORK_LEASE:session.owner.nonce,TMPDIR:join(work,'tmp'),STDLIB:stdlib,
      CC:clang,XCRUN:xcrun,IOS_SDK:sdk,SDKROOT:join(work,'macos-sdk'),TRACE:trace};
    const run=extra=>spawnSync(process.execPath,[join(source,'scripts/build.mjs'),'native','ios'],{env:{...env,...extra},encoding:'utf8',timeout:10000});
    const ready=run({});assert.equal(ready.status,73,ready.stderr);assert.equal(readFileSync(trace,'utf8'),[sdk,clang,clang].join('\n'));unlinkSync(trace);
    for(const extra of [{CC:''},{CC:join(bin,'missing-clang')},{IOS_SDK:''},{IOS_SDK:join(work,'missing-sdk')},{XCRUN:join(bin,'missing-xcrun')}]){
      assert.notEqual(run(extra).status,0);assert.equal(existsSync(trace),false);
    }
  });
});
}
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
