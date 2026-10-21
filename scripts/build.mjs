#!/usr/bin/env node
// 产品流程只调用官方工具；版本与记录保留是本产品自己的规则。
import childProcess,{spawn} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,copyFileSync,cpSync,rmSync,readdirSync,lstatSync,realpathSync,chmodSync,existsSync,rmdirSync,openSync,closeSync,writeSync,renameSync} from 'node:fs';
import {join,dirname,resolve,relative,sep,basename} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {homedir} from 'node:os';
import {tools,repository,platforms,initialVersion} from './config.mjs';
export const root=fileURLToPath(new URL('../',import.meta.url));
const controller=new AbortController();
export function automationDisplayName(platform,version){
 if(!Object.hasOwn(platforms,platform)||typeof version!=='string'||version.length>64||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(version))throw Error('产品平台或版本无效');
 return productTitle+'·'+platforms[platform]+'·v'+version;
}
// GitHub附件文件名使用稳定ASCII；中文名称只作为Run/Tag/Release及附件label显示。
export function artifactBaseName(platform,version){automationDisplayName(platform,version);return 'citizenwallet-'+platform+'-v'+version;}
export function nextVersion(platform,rows){
 automationDisplayName(platform,initialVersion);
 const latest=[...rows].filter(row=>row.status==='completed'&&row.conclusion==='success'&&row.display_title?.startsWith(productTitle+'·'+platforms[platform]+'·v')).sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at)||b.id-a.id)[0];
 if(!latest)return initialVersion;
 const version=latest.display_title.slice((productTitle+'·'+platforms[platform]+'·v').length);automationDisplayName(platform,version);
 const parts=version.split('.');parts[2]=String(BigInt(parts[2])+1n);const value=parts.join('.');automationDisplayName(platform,value);return value;
}
export function retainedRuns(rows,{currentRun=0,result}={}){
 const keep=new Set(),states=new Set();
 for(const row of [...rows].sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at)||b.id-a.id)){
  // 本轮只按收尾前Job结果计算保留类别，不改写GitHub返回的Run终态。
  if(row.status!=='completed'&&row.id!==currentRun){keep.add(row.id);continue;}
  const state=(row.id===currentRun?result:row.conclusion)==='success'?'success':'failure';
  if(row.id===currentRun)keep.add(row.id);
  if(!states.has(state)){states.add(state);keep.add(row.id);}
 }return keep;
}
export function insideTarget(path){const base=join(root,'target');return typeof path==='string'&&resolve(path)===path&&path.startsWith(base+sep);}
function directory(path){
 if(!insideTarget(path))throw Error('任务目录必须归本产品target');
 for(let at=path;at!==resolve(root);at=dirname(at))if(existsSync(at)&&lstatSync(at).isSymbolicLink())throw Error('任务目录经过链接');
 mkdirSync(path,{recursive:true});if(realpathSync(path)!==path)throw Error('任务目录经过链接');return path;
}
function task(kind,platform){automationDisplayName(platform,initialVersion);return mkdtempSync(join(directory(join(root,'target',kind)),platform+'-'));}
function put(path,bytes){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes,{mode:0o600});}
function copy(from,to){mkdirSync(dirname(to),{recursive:true});cpSync(from,to,{recursive:true,verbatimSymlinks:true});}
function sourceView(work,names){
 const project=join(work,'source-view');mkdirSync(project);
 for(const name of names)copy(join(root,name),join(project,name));return project;
}
// 每次调用拥有独立进程组；取消或未退出的后代禁止提前清场。
export async function run(command,args,{cwd=root,env={},capture=false,input,signal=controller.signal}={}){
 signal.throwIfAborted();const environment={...process.env,...env};delete environment.GH_TOKEN;delete environment.GITHUB_TOKEN;
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
   const original=failure||((code!==0||termination||signal.aborted)?Error(basename(command)+'执行失败，退出码='+code+'，信号='+(termination||'无')+(diagnostic?'：'+diagnostic.trim():'')):undefined);
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
function claimCache(work){
 const base=join(root,'target/cache'),lock=join(base,'lock');let owned=false;
 try{directory(base);mkdirSync(lock);owned=true;for(const name of ['rust','pub','npm','gradle'])directory(join(base,name));return {base,release(){rmdirSync(lock);}};}
 catch{if(owned)rmdirSync(lock);const base=directory(join(work,'cache'));return {base,release(){}};}
}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// 产品直接使用GitHub官方REST；控制台只交付短期令牌，不依赖宿主PATH中的gh。
export async function github(path,{method='GET',body,token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN,fetchImpl=fetch}={}){
 if(typeof path!=='string'||path.startsWith('/')||path.includes('..')||/[\r\n]/u.test(path))throw Error('GitHub产品路径无效');
 const response=await fetchImpl('https://api.github.com/repos/'+repository+'/'+path,{method,redirect:'error',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)]),
  headers:{...(token?{Authorization:'Bearer '+token}:{}),Accept:'application/vnd.github+json','Content-Type':'application/json','User-Agent':repository.split('/')[1],'X-GitHub-Api-Version':'2026-03-10'},
  ...(body===undefined?{}:{body:JSON.stringify(body)})});
 if(!response.ok)throw Object.assign(Error('GitHub HTTP '+response.status),{status:response.status});
 return response.status===204?null:response.json();
}
async function rowsFor(platform,read,allEvents=false){
 automationDisplayName(platform,initialVersion);const rows=[];
 for(let page=1;;page++){
  const result=await read('actions/workflows/'+platform+'.yml/runs?branch=main&'+(allEvents?'':'event=workflow_dispatch&')+'per_page=100&page='+page);
  if(!Array.isArray(result.workflow_runs))throw Error('GitHub Run列表无效');
  if(allEvents&&result.workflow_runs.some(row=>row.path!=='.github/workflows/'+platform+'.yml'||row.head_branch!=='main'||(row.repository?.full_name&&row.repository.full_name!==repository)))throw Error('清理Run归属不符');
  rows.push(...result.workflow_runs);if(result.workflow_runs.length<100)return rows;
 }
}
export async function candidate(platform,{token=process.env.GH_TOKEN,read=path=>github(path,{token}),currentRun=Number(process.env.GITHUB_RUN_ID)}={}){
 const rows=await rowsFor(platform,read);
 if(rows.some(row=>row.status!=='completed'&&row.id!==currentRun))throw Error('同平台已有活动Run，禁止重复派发');return nextVersion(platform,rows);
}
function releaseProof(release){
 try{return JSON.parse(/^<!-- automation:(\{[^\n]*\}) -->$/mu.exec(release.body||'')?.[1]||'null');}catch{return null;}
}
// 只删除同一产品平台已结束的旧记录；新成功正式资产完整后才能淘汰旧成功。
export async function cleanupRuns(platform,{token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN,read=path=>github(path,{token}),remove=path=>github(path,{method:'DELETE',token}),currentRun=0,result,sourceSha,attempt}={}){
 // 历史清理覆盖本平台main的全部触发事件，候选版本查询仍只读workflow_dispatch。
 const rows=await rowsFor(platform,read,true);let current;
 if(currentRun||result!==undefined){
  if(!Number.isSafeInteger(currentRun)||currentRun<=0||!['success','failure','cancelled'].includes(result))throw Error('本轮清理输入无效');
  current=await read('actions/runs/'+currentRun);
  if(current.id!==currentRun||current.repository?.full_name!==repository||current.event!=='workflow_dispatch'||current.path!=='.github/workflows/'+platform+'.yml'||current.head_branch!=='main'||(sourceSha!==undefined&&current.head_sha!==sourceSha)||(attempt!==undefined&&current.run_attempt!==attempt))throw Error('本轮Run身份不符，禁止清理');
  const index=rows.findIndex(row=>row.id===currentRun);if(index<0)rows.push(current);else rows[index]=current;
 }
 const keep=retainedRuns(rows,{currentRun,result}),stale=rows.filter(row=>row.status==='completed'&&row.id!==currentRun&&!keep.has(row.id));
 if(!stale.length)return {completed:true,deleted:[],kept:[...keep]};
 const releases=[];for(let page=1;;page++){const values=await read('releases?per_page=100&page='+page);releases.push(...values);if(values.length<100)break;}
 const absent=async path=>{try{await read(path);return false;}catch(error){if(error.status===404||/HTTP 404/u.test(error.message))return true;throw error;}};
 const success=rows.find(row=>keep.has(row.id)&&(row.id===currentRun?result==='success':row.conclusion==='success'&&row.status==='completed'));let blocked;
 if(stale.some(row=>row.conclusion==='success'))try{
  const release=releases.find(value=>releaseProof(value)?.run_id===success?.id);
  if(!release||release.draft||release.prerelease||release.tag_name!==success.display_title||release.assets?.length!==assetCount(platform))throw Error('最新成功正式Release或附件未确认，保留旧成功');
  const tag=await read('git/ref/tags/'+encodeURIComponent(release.tag_name));if(tag.object?.type!=='commit'||tag.object.sha!==success.head_sha)throw Error('新成功Tag提交不符，保留旧成功');
  const artifacts=await read('actions/runs/'+success.id+'/artifacts?per_page=100');if(artifacts.artifacts?.filter(value=>value.name===success.display_title&&!value.expired&&value.size_in_bytes>0).length!==1)throw Error('最新成功Artifact未确认，保留旧成功');
 }catch(error){blocked=error;}
 const deleted=[];
 for(const row of stale){
  // 保护旧成功不阻挡旧失败清理；真正DELETE失败立即停止，不冒充清理完成。
  if(blocked&&row.conclusion==='success')continue;
  const fresh=await read('actions/runs/'+row.id);if(fresh.status!=='completed'||fresh.head_sha!==row.head_sha||fresh.path!==row.path||fresh.head_branch!==row.head_branch||fresh.run_attempt!==row.run_attempt||fresh.event!==row.event||fresh.conclusion!==row.conclusion)throw Error('删除前Run身份或终态变化');
  for(const release of releases){
   const proof=releaseProof(release);
   const historical=Object.keys(platforms).length===1&&release.body===`Source: ${row.head_sha}\nRun: ${row.id} / ${row.run_attempt}`;
   if(!(proof?.run_id===row.id&&proof.platform===platform)&&!historical)continue;
   if(release.target_commitish!==row.head_sha)throw Error('旧Release提交不符');
   const tagPath='git/ref/tags/'+encodeURIComponent(release.tag_name);
   // 先删Tag后删Release，失败重试仍以原Release回执确认归属。
   if(!await absent(tagPath)){const tag=await read(tagPath);if(tag.object?.type!=='commit'||tag.object.sha!==row.head_sha)throw Error('旧Tag归属不符');await remove('git/refs/tags/'+encodeURIComponent(release.tag_name));}
   await remove('releases/'+release.id);
   if(!await absent('releases/'+release.id)||!await absent(tagPath))throw Error('旧Release或Tag删除未确认');
  }
  await remove('actions/runs/'+row.id);if(!await absent('actions/runs/'+row.id))throw Error('旧Run删除未确认');
  if(!await absent('actions/runs/'+row.id+'/logs'))throw Error('旧Run日志删除未确认');
  try{const assets=await read('actions/runs/'+row.id+'/artifacts?per_page=100');if(!Array.isArray(assets.artifacts)||assets.artifacts.length)throw Error('旧Run附件删除未确认');}catch(error){if(error.status!==404&&!/HTTP 404/u.test(error.message))throw error;}
  deleted.push(row.id);
 }
 const remaining=await rowsFor(platform,read,true);
 if(current){const index=remaining.findIndex(row=>row.id===currentRun);if(index<0)remaining.push(current);else remaining[index]=current;}
 const expected=retainedRuns(remaining,{currentRun,result});
 if(blocked)throw blocked;
 if(remaining.some(row=>row.status==='completed'&&row.id!==currentRun&&!expected.has(row.id)))throw Error('旧记录清理未完成');
 return {completed:true,deleted,kept:[...expected]};
}
// 产品只派发一次并返回原Run；GitHub清理归所属工作流，客户端不执行删除。
export async function automate(platform,{token,read=path=>github(path,{token}),dispatch=spec=>github('actions/workflows/'+spec.workflow+'/dispatches',{method:'POST',body:{ref:spec.ref,inputs:spec.inputs},token})}={}){
 automationDisplayName(platform,initialVersion);const base=directory(join(root,'target/automation')),lock=join(base,platform);mkdirSync(lock);
 try{
  const version=await candidate(platform,{read,currentRun:0}),receipt=await dispatch({workflow:platform+'.yml',ref:'main',inputs:{version}}),runID=receipt?.workflow_run_id;
  if(!Number.isSafeInteger(runID)||runID<=0)throw Error('派发回执不确定，禁止再次派发');return {runID};
 }finally{rmdirSync(lock);}
}
// 对应平台最近一次成功Run决定正式包，不能使用跨平台latest别名。
export async function latestInstallAsset(platform,{token,read=path=>github(path,{token})}={}){
 automationDisplayName(platform,initialVersion);
 const latest=(await rowsFor(platform,read)).filter(row=>row.status==='completed'&&row.conclusion==='success').sort((a,b)=>Date.parse(b.updated_at)-Date.parse(a.updated_at)||b.id-a.id)[0];
 if(!latest)throw Error('对应平台没有成功正式版');
 const prefix=productTitle+'·'+platforms[platform]+'·v',version=latest.display_title?.startsWith(prefix)?latest.display_title.slice(prefix.length):'';
 if(automationDisplayName(platform,version)!==latest.display_title||!Number.isSafeInteger(latest.run_number)||latest.run_number<=0)throw Error('正式Run身份或构建号无效');
 const encoded=encodeURIComponent(latest.display_title),release=await read('releases/tags/'+encoded),tag=await read('git/ref/tags/'+encoded);
 if(release.draft||release.prerelease||release.tag_name!==latest.display_title||release.target_commitish!==latest.head_sha||tag.object?.type!=='commit'||tag.object.sha!==latest.head_sha)throw Error('正式Release与成功Run不一致');
 const assets=release.assets?.filter(asset=>asset.name?.endsWith(platform==='ios'?'.ipa':'.apk'));
 if(assets?.length!==1)throw Error('正式安装附件缺失或不唯一');const asset=assets[0];
 if(!Number.isSafeInteger(asset.id)||asset.id<=0||!Number.isSafeInteger(asset.size)||asset.size<=0||asset.size>512*1024**2||!/^sha256:[0-9a-f]{64}$/u.test(asset.digest||'')||asset.name!==basename(asset.name)||/[\\/\x00-\x1f\x7f]/u.test(asset.name)||asset.name.startsWith('.'))throw Error('正式附件名称、大小或官方摘要无效');
 return {asset,platform,version,buildNumber:String(latest.run_number)};
}
// GitHub官方附件端点；跨域下载不转发令牌，不接受HTTP或任意下载域名。
export async function downloadInstallAsset(asset,path,{token,fetchImpl=fetch}={}){
 let response=await fetchImpl('https://api.github.com/repos/'+repository+'/releases/assets/'+asset.id,{redirect:'manual',signal:controller.signal,headers:{Accept:'application/octet-stream','X-GitHub-Api-Version':'2026-03-10',...(token?{Authorization:'Bearer '+token}:{})}});
 if(response.status===302){
  const url=new URL(response.headers.get('location'));
  if(url.protocol!=='https:'||url.username||url.password||!['release-assets.githubusercontent.com','objects.githubusercontent.com','github.com'].includes(url.hostname))throw Error('正式附件下载地址无效');
  response=await fetchImpl(url,{redirect:'error',signal:controller.signal});
 }
 if(!response.ok||!response.body)throw Error('正式附件下载失败，HTTP '+response.status);
 const fd=openSync(path,'wx',0o600);let size=0;
 try{for await(const bytes of response.body){size+=bytes.length;if(size>asset.size)throw Error('正式附件下载大小超限');writeSync(fd,bytes);}}finally{closeSync(fd);}
}
function installRoot(base=join(root,'target')){if(base!==join(root,'target')&&!insideTarget(base))throw Error('安装现场不属于本产品target');mkdirSync(base,{recursive:true});if(lstatSync(base).isSymbolicLink()||realpathSync(base)!==base)throw Error('target经过链接');return base;}
function validInstallFile(path,asset){
 const stat=lstatSync(path,{throwIfNoEntry:false});if(!stat)return false;
 if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)throw Error('安装包不是独立普通文件');
 return stat.size===asset.size&&'sha256:'+sha(readFileSync(path))===asset.digest;
}
export async function ensureInstallPackage(platform,{token,read,base=join(root,'target'),download=(asset,path)=>downloadInstallAsset(asset,path,{token}),notify=message=>console.log(message)}={}){
 const selected=await latestInstallAsset(platform,{token,read});installRoot(base);const path=join(base,selected.asset.name);
 if(!validInstallFile(path,selected.asset)){
  notify('下载最新正式包：'+selected.asset.name);
  const partial=join(base,selected.asset.name+'.'+randomUUID()+'.part');
  try{await download(selected.asset,partial);if(!validInstallFile(partial,selected.asset))throw Error('正式附件大小或官方摘要不一致');renameSync(partial,path);}finally{rmSync(partial,{force:true});}
 }else notify('本地包与最新正式版一致，直接安装：'+selected.asset.name);
 // 只替换本仓target直属的同平台旧正式包，另一平台和编译现场不动。
 const owned=platform==='ios'?/^citizenwallet-ios-v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.ipa$/u:/^citizenwallet-android-v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.apk$/u;
 for(const name of readdirSync(base))if(name!==selected.asset.name&&owned.test(name)){const old=join(base,name),stat=lstatSync(old);if(!stat.isFile()||stat.nlink!==1)throw Error('旧安装包不是独立普通文件');rmSync(old);}
 return {...selected,path};
}
// 官方设备工具实际安装并回读版本；不卸载、不降级、不重签名、不编译。
export async function installProduct(platform,{token,read,download,prepare=ensureInstallPackage,execute=run,environment:env=process.env,notify=message=>console.log(message)}={}){
 automationDisplayName(platform,initialVersion);const base=installRoot(),lock=join(base,'.citizenwallet-'+platform+'.lock');let fd;
 try{fd=openSync(lock,'wx',0o600);}catch(error){if(error.code==='EEXIST')throw Error('对应平台已有安装任务，禁止并发覆盖');throw error;}
 let work,safe=true;
 try{
  const selected=await prepare(platform,{token,read,download,notify}),capture={capture:true,env};
  notify('安装正式版：'+selected.asset.name+'；安装包位置：'+selected.path);
  if(platform==='android'){
   const sdk=env.ANDROID_HOME||env.ANDROID_SDK_ROOT||join(env.HOME||process.env.HOME,'Library/Android/sdk'),adb=join(sdk,'platform-tools/adb'),analyzer=join(sdk,'cmdline-tools/latest/bin/apkanalyzer');
   const java=env.JAVA_HOME||'/Applications/Android Studio.app/Contents/jbr/Contents/Home',android={...capture,env:{...env,JAVA_HOME:java,PATH:join(java,'bin')+':'+(env.PATH||'/usr/bin:/bin')}};
   // 与公民App一致，由adb的-d选择唯一USB真机；不使用无线设备或模拟器。
   const device=await execute(adb,['-d','get-serialno'],capture),identity='com.crcfrcn.citizenwallet';
   if(!device||device==='unknown')throw Error('需要且只能有一台已授权的USB Android手机');
   const app=await execute(analyzer,['manifest','application-id',selected.path],android),version=await execute(analyzer,['manifest','version-name',selected.path],android),number=await execute(analyzer,['manifest','version-code',selected.path],android);
   if(app!==identity||version!==selected.version||number!==selected.buildNumber)throw Error('正式APK应用标识或版本不一致');
   await execute(join(sdk,'build-tools/36.0.0/apksigner'),['verify',selected.path],android);
   await execute(adb,['-d','install','-r',selected.path],capture);
   const installed=await execute(adb,['-d','shell','dumpsys','package',identity],capture);
   if(!new RegExp('(?:^|\\s)versionName='+selected.version.replaceAll('.','\\.')+'(?:\\s|$)','u').test(installed)||!new RegExp('(?:^|\\s)versionCode='+selected.buildNumber+'(?:\\s|$)','u').test(installed))throw Error('Android安装后版本回读不一致');
  }else{
   const data=JSON.parse(await execute('/usr/bin/xcrun',['devicectl','list','devices','--json-output','-','--omit-deprecated-fields-in-json','--quiet'],capture));
   const devices=data.result?.devices?.filter(device=>device.properties?.hardware?.platform==='iOS'&&device.properties.hardware.reality==='physical'&&device.properties.connection?.pairingState==='paired'&&device.properties.connection.transportType==='wired'&&device.properties.connection.state!=='unavailable');
   if(devices?.length!==1)throw Error('请连接并信任唯一一台要安装的iPhone');const device=devices[0].identifier,identity='ios.citizenwallet';
   work=mkdtempSync(join(base,'.citizenwallet-ios-'));
   const entries=(await execute('/usr/bin/unzip',['-Z','-1',selected.path],capture)).split('\n');
   if(entries.some(name=>name.startsWith('/')||name.includes('\\')||name.split('/').includes('..')))throw Error('IPA成员路径越界');
   await execute('/usr/bin/unzip',['-q',selected.path,'-d',work],capture);
   const payload=join(work,'Payload'),apps=readdirSync(payload).filter(name=>name.endsWith('.app'));if(apps.length!==1)throw Error('IPA应用缺失或不唯一');const app=join(payload,apps[0]);
   const info=JSON.parse(await execute('/usr/bin/plutil',['-convert','json','-o','-',join(app,'Info.plist')],capture));
   if(info.CFBundleIdentifier!==identity||info.CFBundleShortVersionString!==selected.version||String(info.CFBundleVersion)!==selected.buildNumber)throw Error('正式IPA应用标识或版本不一致');
   await execute('/usr/bin/codesign',['--verify','--deep','--strict',app],capture);
   await execute('/usr/bin/xcrun',['devicectl','device','install','app','--device',device,app,'--quiet'],capture);
   const installed=JSON.parse(await execute('/usr/bin/xcrun',['devicectl','device','info','apps','--device',device,'--bundle-id',identity,'--include-all-apps','--json-output','-','--quiet'],capture));
   const found=installed.result?.apps?.filter(value=>value.bundleIdentifier===identity);
   if(found?.length!==1||found[0].version!==selected.version||String(found[0].bundleVersion)!==selected.buildNumber)throw Error('iOS安装后版本回读不一致');
  }
  notify('已安装：'+selected.asset.name);
  return {completed:true,platform,version:selected.version,path:selected.path};
 }catch(error){safe=!error.keepWork;throw error;}
 finally{closeSync(fd);if(safe){if(work)rmSync(work,{recursive:true,force:true});rmSync(lock);}}
}
// 控制台蓝色build动作调用本仓安装；CLI build保留为自动化与独立编译入口。
export function describeAction({flow,platform,inputs={}}){
 automationDisplayName(platform,initialVersion);
 if(flow==='release')return {repository,launch:options=>automate(platform,options)};
 // 沿用公民App公开入口：独立install进程，不领取GitHub令牌、不派发工作流。
 if(flow==='build')return {command:process.execPath,args:[fileURLToPath(import.meta.url),'install',platform],cwd:root,env:{PATH:'/usr/bin:/bin',HOME:homedir()}};
 if(flow==='test')return {command:process.execPath,args:[fileURLToPath(import.meta.url),flow,platform],cwd:root,env:{...process.env,...inputs.environment}};
 throw Error('本产品尚未声明该流程：'+flow);
}

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
async function flutterCheck(env){
 const result=JSON.parse(await run(flutterExecutable(env),['--version','--machine'],{env,capture:true}));if(result.frameworkVersion!==tools.flutter)throw Error('Flutter版本不符合本产品声明');
}
function environment(work,cache){
 const env={PUB_CACHE:join(cache.base,'pub'),GRADLE_USER_HOME:join(cache.base,'gradle'),CARGO_TARGET_DIR:join(cache.base,'rust'),CARGO_HOME:join(cache.base,'cargo'),RUSTUP_HOME:join(cache.base,'rustup'),RUSTUP_TOOLCHAIN:tools.rust,CARGO_INCREMENTAL:'1',TMPDIR:directory(join(work,'tmp')),FLUTTER_ROOT:join(cache.base,'flutter'),FLUTTER_SUPPRESS_ANALYTICS:'true',DART_SUPPRESS_ANALYTICS:'true',CI:'true',ANDROID_USER_HOME:directory(join(work,'android-user')),CP_HOME_DIR:join(cache.base,'cocoapods'),GEM_HOME:join(cache.base,'gems'),GEM_SPEC_CACHE:join(cache.base,'gem-specs'),XDG_CACHE_HOME:directory(join(work,'xdg-cache')),XDG_CONFIG_HOME:directory(join(work,'xdg-config'))};
 for(const key of ['PUB_CACHE','CARGO_HOME','RUSTUP_HOME','CP_HOME_DIR','GEM_HOME','GEM_SPEC_CACHE'])directory(env[key]);return env;
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
  const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;if(!sdk)throw Error('缺少官方Android SDK');
  const property=value=>value.replaceAll('\\','\\\\').replaceAll(':','\\:').replaceAll('=','\\=');
  put(join(project,'android/local.properties'),'sdk.dir='+property(sdk)+'\nflutter.sdk='+property(dirname(dirname(flutterExecutable(env))))+'\n');
  const wrapper=join(dirname(dirname(flutterExecutable(env))),'bin/cache/artifacts/gradle_wrapper');
  for(const file of ['gradlew','gradlew.bat','gradle/wrapper/gradle-wrapper.jar'])copy(join(wrapper,file),join(project,'android',file));chmodSync(join(project,'android/gradlew'),0o700);
 }
 const iconOutput=generatePlatformIcons(project,platform);
 if(platform==='android')for(const name of readdirSync(iconOutput))copy(join(iconOutput,name),join(project,'android/app/src/main/res',name));
 await run(flutterExecutable(env),['pub','get','--enforce-lockfile'],{cwd:project,env});
 if(!readFileSync(join(project,'pubspec.lock')).equals(readFileSync(join(root,'pubspec.lock'))))throw Error('Pub原锁改变');
 return project;
}
export async function native(target,project,work,env){
 const manifest=join(project,'signing/Cargo.toml');let triple,extra={};
 if(target==='ios'){triple='aarch64-apple-ios';extra.SDKROOT=await run('xcrun',['--sdk','iphoneos','--show-sdk-path'],{env,capture:true});}
 else if(target==='android'){
  triple='aarch64-linux-android';const ndk=process.env.ANDROID_NDK_HOME||join(process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT||'', 'ndk',tools.ndk);
  if(!readFileSync(join(ndk,'source.properties'),'utf8').includes('Pkg.Revision = '+tools.ndk))throw Error('NDK版本不符合声明');
  const bin=join(ndk,'toolchains/llvm/prebuilt',process.platform==='darwin'?'darwin-x86_64':'linux-x86_64','bin');
  extra={CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER:join(bin,'aarch64-linux-android24-clang'),CC_aarch64_linux_android:join(bin,'aarch64-linux-android24-clang'),AR_aarch64_linux_android:join(bin,'llvm-ar'),CARGO_TARGET_AARCH64_LINUX_ANDROID_RUSTFLAGS:'-C link-arg=-Wl,-z,max-page-size=16384 -C link-arg=-Wl,-soname,libcitizenwallet_signer.so'};
 }
 else if(target!=='host')throw Error('未知原生目标');
 if(triple)await run('rustup',['target','add','--toolchain',tools.rust,triple],{env});
 // 官方crate-type覆盖仅生成当前消费者需要的库，不额外生成另一种链接产物。
 await run('cargo',['rustc','--lib','--crate-type',target==='ios'?'staticlib':'cdylib','--locked','--release','--manifest-path',manifest,...(triple?['--target',triple]:[])],{env:{...env,...extra},cwd:project});
 const file=join(env.CARGO_TARGET_DIR,...(triple?[triple]:[]),'release',nativeName+(target==='ios'?'.a':target==='android'?'.so':process.platform==='darwin'?'.dylib':'.so'));
 // iOS验收已生成的机器码符号，官方选项避免Apple nm解析Rust上游bitcode；四个导出断言不变。
 const symbols=await run(target==='android'?join(process.env.ANDROID_NDK_HOME||join(process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT,'ndk',tools.ndk),'toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-nm'):'nm',target==='android'?['-D','--defined-only',file]:['-g',...(target==='ios'?['--no-llvm-bc']:[]),file],{env,capture:true});
 for(const name of ['derive_hard','public_key','sign','verify'])if(!new RegExp('(?:^|\\s)_?citizen_sr25519_'+name+'(?:\\s|$)','mu').test(symbols))throw Error('原生签名导出缺失：'+name);
 if(target==='ios'){const output=directory(join(work,'native/ios'));copy(file,join(output,basename(file)));env.CITIZENWALLET_NATIVE_IOS_DIR=output;}
 if(target==='android'){
  const output=directory(join(work,'native/android/arm64-v8a'));copy(file,join(output,basename(file)));env.CITIZENWALLET_NATIVE_ANDROID_DIR=dirname(output);
  const ndk=process.env.ANDROID_NDK_HOME||join(process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT,'ndk',tools.ndk),readelf=join(ndk,'toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-readelf');
  const headers=await run(readelf,['-lW',file],{env,capture:true});const loads=headers.split('\n').filter(line=>/^\s*LOAD\s/u.test(line));if(!loads.length||loads.some(line=>parseInt(line.trim().split(/\s+/u).at(-1),16)<16384))throw Error('Android签名库不满足16KB对齐');
 }
 return file;
}
export async function testProduct(platform='android'){
 nodeCheck();await run(process.execPath,['--test','test/build.test.mjs'],{cwd:root});
 const work=task('test',platform),cache=claimCache(work),env=environment(work,cache);let safe=true;
 try{
  await prepareTools(work,platform,env);const project=await prepare(work,platform,env);
  await run('cargo',['test','--locked','--manifest-path',join(project,'signing/Cargo.toml')],{cwd:project,env});await native('host',project,work,env);
  const packageFile=join(project,'.dart_tool/package_config.json'),packages=JSON.parse(readFileSync(packageFile)),entry=packages.packages.find(value=>value.name==='isar_community_flutter_libs');
  if(!entry)throw Error('原锁缺少Isar宿主测试库');const packageRoot=fileURLToPath(new URL(entry.rootUri,pathToFileURL(packageFile)));
  env.ISAR_CORE_LIB_PATH=join(work,'libisar.dylib');copy(join(packageRoot,'macos/libisar.dylib'),env.ISAR_CORE_LIB_PATH);
  await run(flutterExecutable(env),['analyze','--fatal-infos','--fatal-warnings','--no-pub'],{cwd:project,env});
  // 官方JSON报告同时交付控制台和本轮现场；pipefail保留Flutter退出码，失败保留报告取证。
  const report=join(work,'flutter-report.jsonl');let finished;
  try{
   await run('/bin/bash',['-o','pipefail','-c','"$1" test --no-pub --concurrency=1 --fail-fast --reporter=json | tee "$2"','wallet-test',flutterExecutable(env),report],{cwd:project,env});
   const events=readFileSync(report,'utf8').split('\n').filter(Boolean).map(JSON.parse),done=events.filter(value=>value.type==='done');finished=events.filter(value=>value.type==='testDone');
   if(done.length!==1||done[0].success!==true||!finished.length||finished.some(value=>value.skipped||value.result!=='success'))throw Error('Flutter测试失败、跳过或不完整');
  }catch(error){error.keepWork=true;error.message+='；Flutter报告：'+report;throw error;}
  if(platform==='android')await run(join(project,'android/gradlew'),['testReleaseUnitTest','--no-daemon'],{cwd:join(project,'android'),env});
  return {tests:finished.length,platform};
 }catch(error){safe=!error.keepWork;throw error;}finally{if(safe){cache.release();rmSync(work,{recursive:true,force:true});}}
}
export async function buildProduct(platform){
 nodeCheck();automationDisplayName(platform,process.env.PRODUCT_VERSION||initialVersion);
 const supplied=process.env.PRODUCT_WORK;if(supplied&&!insideTarget(supplied))throw Error('编译现场不属于本产品target');
 const work=supplied?directory(supplied):task('build',platform),cache=claimCache(work),env=environment(work,cache);let safe=true,complete=false;
 try{
  await prepareTools(work,platform,env);const project=await prepare(work,platform,env);await native(platform,project,work,env);
  const version=process.env.PRODUCT_VERSION||initialVersion,number=process.env.GITHUB_RUN_NUMBER||'1',formal=process.env.GITHUB_ACTIONS==='true';
  const args=['--release','--build-name',version,'--build-number',number,'--no-pub'];const output=directory(join(work,'artifact')),title=artifactBaseName(platform,version);
  if(platform==='android'){
   if(formal&&!process.env.ANDROID_KEY_PROPERTIES)throw Error('正式Android签名输入缺失');
   for(const [format,path,suffix]of [['apk','flutter-apk/app-release.apk','apk'],['appbundle','bundle/release/app-release.aab','aab']]){
    await run(flutterExecutable(env),['build',format,'--target-platform','android-arm64',...args],{cwd:project,env});copy(join(project,'build/app/outputs',path),join(output,title+'.'+suffix));
   }
  }else{
   if(formal){
    if(!process.env.IOS_EXPORT_OPTIONS||!process.env.IOS_PROFILE_UUID||!process.env.IOS_SIGNING_CERTIFICATE)throw Error('正式Apple导出配置缺失');
    const pbx=join(project,'ios/Runner.xcodeproj/project.pbxproj'),json=join(work,'project.json');await run('plutil',['-convert','json','-o',json,pbx],{env});
    const document=JSON.parse(readFileSync(json));for(const object of Object.values(document.objects))if(object.name==='Release'&&object.buildSettings?.PRODUCT_BUNDLE_IDENTIFIER==='ios.citizenwallet')Object.assign(object.buildSettings,{CODE_SIGN_STYLE:'Manual',PROVISIONING_PROFILE_SPECIFIER:process.env.IOS_PROFILE_UUID,CODE_SIGN_IDENTITY:process.env.IOS_SIGNING_CERTIFICATE});
    put(json,JSON.stringify(document));await run('plutil',['-convert','xml1','-o',pbx,json],{env});
    await run(flutterExecutable(env),['build','ipa','--export-options-plist',process.env.IOS_EXPORT_OPTIONS,...args],{cwd:project,env});
    const dir=join(project,'build/ios/ipa'),files=readdirSync(dir).filter(name=>name.endsWith('.ipa'));if(files.length!==1)throw Error('IPA缺失或不唯一');copy(join(dir,files[0]),join(output,title+'.ipa'));
   }else{await run(flutterExecutable(env),['build','ios','--no-codesign',...args],{cwd:project,env});copy(join(project,'build/ios/iphoneos/Runner.app'),join(output,title+'.app'));}
  }
  complete=true;return {work,output};
 }catch(error){safe=!error.keepWork;throw error;}finally{if(safe){cache.release();if(!complete)rmSync(work,{recursive:true,force:true});}}
}
export async function packageProduct(platform){
 const work=process.env.PRODUCT_WORK;if(!insideTarget(work))throw Error('正式产物现场无效');const output=join(work,'artifact'),version=process.env.PRODUCT_VERSION,title=artifactBaseName(platform,version);
 const expected=platform==='ios'?['ipa']:['apk','aab'];for(const suffix of expected)if(lstatSync(join(output,title+'.'+suffix)).size<=0)throw Error('正式产物为空');
 const proof={schema:1,product_id:'citizenwallet',platform,version,run_id:Number(process.env.GITHUB_RUN_ID),run_attempt:Number(process.env.GITHUB_RUN_ATTEMPT),source_sha:process.env.GITHUB_SHA};
 proof.assets=expected.map(suffix=>{const name=title+'.'+suffix,bytes=readFileSync(join(output,name));return {name,label:automationDisplayName(platform,version)+'.'+suffix,size:bytes.length,sha256:sha(bytes)};});
 put(join(output,title+'.json'),JSON.stringify(proof,null,2)+'\n');
 put(join(output,title+'.sha256'),readdirSync(output).sort().map(name=>sha(readFileSync(join(output,name)))+'  '+name).join('\n')+'\n');put(join(work,'proof.json'),JSON.stringify(proof));
 return {output};
}
// Google官方认证Action提供短期访问令牌；这里只上传本轮已验收AAB，不改变发布轨道。
export async function uploadAndroid({token=process.env.PLAY_ACCESS_TOKEN,fetchImpl=fetch,work=process.env.PRODUCT_WORK,version=process.env.PRODUCT_VERSION,number=process.env.GITHUB_RUN_NUMBER,runID=process.env.GITHUB_RUN_ID,sourceSha=process.env.GITHUB_SHA}={}){
 automationDisplayName('android',version);
 if(!insideTarget(work)||!token||!/^\d+$/u.test(number||'')||!/^\d+$/u.test(runID||'')||!/^([a-f0-9]{40})$/u.test(sourceSha||''))throw Error('Google上传输入缺失或无效');
 const name=artifactBaseName('android',version)+'.aab',path=join(work,'artifact',name),info=lstatSync(path);
 if(!info.isFile()||info.isSymbolicLink()||info.size<1)throw Error('Google上传AAB无效');
 const bytes=readFileSync(path),digest=sha(bytes),proof=JSON.parse(readFileSync(join(work,'proof.json'))),asset=proof.assets?.find(value=>value.name===name);
 if(proof.product_id!=='citizenwallet'||proof.platform!=='android'||proof.version!==version||String(proof.run_id)!==runID||proof.source_sha!==sourceSha||asset?.sha256!==digest||asset.size!==bytes.length)throw Error('Google上传AAB与本轮验收不一致');
 const base='https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.crcfrcn.citizenwallet/edits';
 async function request(method,url,body,media=false){
  let response;try{response=await fetchImpl(url,{method,redirect:'error',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(120000)]),headers:{Authorization:'Bearer '+token,'Content-Type':media?'application/octet-stream':'application/json'},...(body===undefined?{}:{body:media?body:JSON.stringify(body)})});}catch{throw Error('Google上传网络请求未确认，禁止自动重发');}
  if(!response.ok)throw Error('Google上传HTTP '+response.status);
  return response.status===204?null:response.json();
 }
 const edit=await request('POST',base,{});
 if(typeof edit.id!=='string'||!/^\d+$/u.test(edit.id))throw Error('Google编辑编号无效');
 let committed=false;
 try{
  const bundle=await request('POST','https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/com.crcfrcn.citizenwallet/edits/'+edit.id+'/bundles?uploadType=media',bytes,true);
  if(String(bundle.versionCode)!==number||bundle.sha256!==digest)throw Error('Google上传AAB版本或摘要回读不符');
  // 只保存上传，不指定轨道或提交面向用户的发行；有审核中的变更则明确失败。
  const result=await request('POST',base+'/'+edit.id+':commit?changesInReviewBehavior=ERROR_IF_IN_REVIEW');
  if(result.id!==edit.id)throw Error('Google上传保存回执不符');
  committed=true;
 }finally{if(!committed)await request('DELETE',base+'/'+edit.id);}
 const readback=await request('POST',base,{});
 if(typeof readback.id!=='string'||!/^\d+$/u.test(readback.id))throw Error('Google回读编辑编号无效');
 try{
  const result=await request('GET',base+'/'+readback.id+'/bundles'),matches=result.bundles?.filter(value=>String(value.versionCode)===number);
  if(matches?.length!==1||matches[0].sha256!==digest)throw Error('Google已保存AAB回读不符');
 }finally{await request('DELETE',base+'/'+readback.id);}
 return {uploaded:true,platform:'android',version,buildNumber:number};
}
async function main(){
 const [command,platform='android',...extra]=process.argv.slice(2);if(extra.length)throw Error('参数过多');
 if(command==='upload'&&platform==='android')return uploadAndroid();
 if(command==='test')return testProduct(platform);if(command==='build')return buildProduct(platform);if(command==='package')return packageProduct(platform);if(command==='install')return installProduct(platform,{token:process.env.GH_TOKEN||process.env.GITHUB_TOKEN});
 if(command==='candidate')return candidate(platform);if(command==='automate')return automate(platform,{token:process.env.GH_TOKEN});if(command==='cleanup')return cleanupRuns(platform,{currentRun:Number(process.env.GITHUB_RUN_ID||0),result:process.env.PRODUCT_RESULT,sourceSha:process.env.GITHUB_SHA,attempt:process.env.GITHUB_RUN_ATTEMPT===undefined?undefined:Number(process.env.GITHUB_RUN_ATTEMPT)});
 throw Error('未知产品命令');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)&&!process.env.NODE_TEST_CONTEXT){
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>controller.abort());
 try{const result=await main();process.stdout.write(typeof result==='string'?result+'\n':JSON.stringify(result)+'\n');}catch(error){console.error(error.message);process.exitCode=1;}
}
