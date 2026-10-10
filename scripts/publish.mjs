#!/usr/bin/env node
// 商店分发只消费本仓已经完成的正式 GitHub Release；不启动编译或自动化。
import {createHash} from 'node:crypto';
import {constants,closeSync,fstatSync,lstatSync,openSync,readSync,realpathSync} from 'node:fs';
import {dirname,isAbsolute,join,parse,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const product='citizenwallet';
const repository='crcfrcn/citizenwallet';
const apiRoot='https://api.github.com/repos/'+repository+'/';
const fail=message=>{throw Error('公民钱包分发：'+message);};
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const shaPattern=/^[a-f0-9]{40}$/u;
const digestPattern=/^[a-f0-9]{64}$/u;

// 仅读取本仓现存原始文件；同一描述符与路径身份都必须稳定。
export function readStoreSource(base,name){
 if(typeof base!=='string'||!isAbsolute(base)||resolve(base)!==base||realpathSync(base)!==base)fail('商店身份源码根无效');
 if(typeof name!=='string'||!name||name.includes('\\')||/[\x00-\x1f\x7f]/u.test(name)||name.split('/').some(part=>!part||part==='.'||part==='..'))fail('商店身份源码路径无效');
 const path=join(base,name);let at=parse(path).root;
 for(const part of relative(at,dirname(path)).split(sep)){
  at=join(at,part);const info=lstatSync(at);if(!info.isDirectory()||info.isSymbolicLink()||realpathSync(at)!==at)fail('商店身份源码父目录无效');
 }
 const before=lstatSync(path);
 if(!before.isFile()||before.isSymbolicLink()||before.nlink!==1||before.size<1||before.size>1024*1024)fail('商店身份源码不是有界普通文件');
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const opened=fstatSync(fd);if(!opened.isFile()||opened.nlink!==1||opened.dev!==before.dev||opened.ino!==before.ino||opened.size!==before.size)fail('商店身份源码打开时变化');
  const bytes=Buffer.alloc(opened.size);let offset=0;
  while(offset<bytes.length){const n=readSync(fd,bytes,offset,bytes.length-offset,offset);if(n<1)fail('商店身份源码读取中断');offset+=n;}
  const after=fstatSync(fd),current=lstatSync(path);
  for(const info of [after,current])if(!info.isFile()||info.nlink!==1||['dev','ino','size','mtimeMs','ctimeMs'].some(key=>info[key]!==opened[key]))fail('商店身份源码读取期间变化');
  return bytes;
 }finally{closeSync(fd);}
}

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
export function storeIdentity(){
 const names=['pubspec.yaml','scripts/publish.mjs','ios/project/Runner.pbxproj','android/app/build.gradle.kts'];
 const sources=names.map(name=>readStoreSource(root,name));
 const manifest=sources[0].toString('utf8');
 if([...manifest.matchAll(/^name:[ \t]*([^\r\n]+)[ \t]*$/gmu)].map(row=>row[1]).join('\0')!=='citizenwallet')fail('产品原始名称无效');
 const receipt={schema:1,product_id:product,bundle_id:iosStoreBundleID(sources[2].toString('utf8')),
  package_name:androidStorePackageName(sources[3].toString('utf8')),
  source_files:names.map((path,index)=>({path,sha256:sha256(sources[index])}))};
 for(const item of receipt.source_files)if(sha256(readStoreSource(root,item.path))!==item.sha256)fail('商店身份源码解析期间变化');
 return receipt;
}

async function get(url,{send=fetch,raw=false,digestOnly=false,maxBytes=2*1024*1024}={}){
 let current=url;const token=process.env.GITHUB_TOKEN||process.env.GH_TOKEN;
 for(let redirects=0;redirects<6;redirects++){
  const parsed=new URL(current);
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.hash)fail('只允许无凭据 HTTPS 读取');
  const headers={Accept:raw?'application/octet-stream':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  if(token&&parsed.hostname==='api.github.com')headers.Authorization='Bearer '+token;
  const response=await send(current,{method:'GET',headers,redirect:'manual',signal:AbortSignal.timeout(30000)});
  if([301,302,303,307,308].includes(response.status)){
   const location=response.headers.get('location');await response.body?.cancel();
   if(!location)fail('GitHub 回执缺少重定向目标');current=new URL(location,current).href;continue;
  }
  if(!response.ok||!response.body)fail('GitHub 公开读取失败');
  const declared=Number(response.headers.get('content-length'));
  if(Number.isFinite(declared)&&declared>maxBytes)fail('GitHub 声明大小超限');
  const pieces=[],digest=digestOnly?createHash('sha256'):null;let length=0;
  for await(const part of response.body){length+=part.length;if(length>maxBytes)fail('GitHub 回执超限');if(digest)digest.update(part);else pieces.push(Buffer.from(part));}
  if(digestOnly)return {size:length,sha256:digest.digest('hex')};
  const bytes=Buffer.concat(pieces);if(!raw){try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('GitHub JSON 无效');}}
  return bytes;
 }
 fail('GitHub 重定向超限');
}

const assetSets=Object.freeze({ios:['citizenwallet.ipa','citizenwallet-release-ios.json'],
 android:['citizenwallet.apk','citizenwallet.aab','citizenwallet-release-android.json']});
export async function inspect(platform,tag,{send=fetch}={}){
 const names=assetSets[platform];if(!names)fail('未声明的平台');
 const prefix=product+'-'+platform+'-v';
 if(typeof tag!=='string'||!tag.startsWith(prefix))fail('Release Tag 与平台不符');
 const match=/^([0-9]+\.[0-9]+\.[0-9]+)-r([1-9][0-9]*)-a([1-9][0-9]*)$/u.exec(tag.slice(prefix.length));
 if(!match)fail('Release Tag 格式无效');
 const runId=Number(match[2]),attempt=Number(match[3]);
 if(!Number.isSafeInteger(runId)||!Number.isSafeInteger(attempt))fail('Release 运行编号越界');
 const request=(path,options={})=>get(apiRoot+path,{send,...options});
 const [release,ref,run]=await Promise.all([
  request('releases/tags/'+encodeURIComponent(tag)),
  request('git/ref/tags/'+encodeURIComponent(tag)),
  request('actions/runs/'+runId),
 ]);
 if(release?.tag_name!==tag||release.draft||release.prerelease||!Number.isSafeInteger(release.id)
  ||ref?.ref!=='refs/tags/'+tag||ref.object?.type!=='commit'||!shaPattern.test(ref.object.sha||'')
  ||release.target_commitish!==ref.object.sha)fail('Release 与 Tag 来源不一致');
 const sourceSha=ref.object.sha,workflow='.github/workflows/release-'+platform+'.yml';
 if(run?.id!==runId||!Number.isSafeInteger(run.run_number)||run.run_number<1||run.run_attempt!==attempt||run.status!=='completed'||run.conclusion!=='success'
  ||run.event!=='workflow_dispatch'||run.head_branch!=='main'||run.head_sha!==sourceSha
  ||String(run.path||'').split('@')[0]!==workflow)fail('Release 没有同一次成功自动化证明');
 if(!Array.isArray(release.assets)||release.assets.length!==names.length
  ||new Set(release.assets.map(asset=>asset.name)).size!==names.length
  ||names.some(name=>!release.assets.some(asset=>asset.name===name)))fail('正式资产集合不完整');
 const assets=new Map();
 for(const asset of release.assets){
  if(!Number.isSafeInteger(asset.id)||asset.id<1||asset.state!=='uploaded'||!Number.isSafeInteger(asset.size)||asset.size<1
   ||typeof asset.digest!=='string'||!/^sha256:[a-f0-9]{64}$/u.test(asset.digest)
   ||asset.url!==apiRoot+'releases/assets/'+asset.id)fail('正式资产证明无效');
  assets.set(asset.name,asset);
 }
 const manifestName='citizenwallet-release-'+platform+'.json';
 const manifestAsset=assets.get(manifestName),manifestBytes=await get(manifestAsset.url,{send,raw:true,maxBytes:1024*1024});
 if(manifestBytes.length!==manifestAsset.size||sha256(manifestBytes)!==manifestAsset.digest.slice(7))fail('Release 清单字节不符');
 let manifest;try{manifest=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(manifestBytes));}catch{fail('Release 清单 JSON 无效');}
 const identity=storeIdentity();
 if(manifest?.product_id!==product||manifest.version!==match[1]||manifest.github_run_number!==run.run_number
  ||manifest.head_sha!==sourceSha||manifest.bundle_id!==identity.bundle_id
  ||manifest.package_name!==identity.package_name||!Array.isArray(manifest.assets)
  ||manifest.assets.length!==names.length-1)fail('Release 清单身份无效');
 const results=[];
 for(const name of names.filter(value=>value!==manifestName)){
  const proof=manifest.assets.find(value=>value?.asset_name===name);
  if(!proof||proof.platform!==(platform==='ios'?'iOS':'Android')||!digestPattern.test(proof.asset_sha256||''))fail('Release 清单资产无效');
  const asset=assets.get(name);if(asset.digest!=='sha256:'+proof.asset_sha256)fail('Release 资产摘要不一致');
  const bytes=await get(asset.url,{send,digestOnly:true,maxBytes:2*1024**3});
  if(bytes.size!==asset.size||bytes.sha256!==proof.asset_sha256)fail('Release 资产字节不一致');
  results.push({name,size:asset.size,sha256:proof.asset_sha256,asset_id:asset.id});
 }
 if(new Set(manifest.assets.map(value=>value.asset_name)).size!==results.length)fail('Release 清单资产重复');
 return {schema:1,product_id:product,platform,tag,version:match[1],run_id:runId,run_number:run.run_number,run_attempt:attempt,
  source_sha:sourceSha,bundle_id:identity.bundle_id,package_name:identity.package_name,assets:results};
}

const direct=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
const testing=direct&&Boolean(process.env.NODE_TEST_CONTEXT)&&process.argv.length===2;
if(direct&&!testing){
 try{
  const [command,...args]=process.argv.slice(2);
  if(command==='identity'&&args.length===0)process.stdout.write(JSON.stringify(storeIdentity())+'\n');
  else if(command==='inspect'&&args.length===2)process.stdout.write(JSON.stringify(await inspect(args[0],args[1]))+'\n');
  else fail('独立分发命令无效');
 }catch(error){console.error(error.message);process.exitCode=1;}
}

if(testing){
 const {default:test}=await import('node:test');
 const {default:assert}=await import('node:assert/strict');
 test('商店身份来自本仓原始应用工程，拒绝越界读取',()=>{
  const value=storeIdentity();
  assert.equal(value.product_id,product);assert.equal(value.bundle_id,'ios.citizenwallet');
  assert.equal(value.package_name,'com.crcfrcn.citizenwallet');assert.equal(value.source_files.length,4);
  assert.throws(()=>readStoreSource(root,'../citizenchain/Cargo.toml'),/路径/);
  assert.throws(()=>readStoreSource(root,'scripts/missing.mjs'));
 });
 test('独立分发逐件读取准确成功Run、Tag、Release和资产，不发送写请求',async()=>{
  for(const platform of ['ios','android']){
   const identity=storeIdentity(),sourceSha='a'.repeat(40),runId=73,attempt=2,version='1.2.3';
   const tag=`citizenwallet-${platform}-v${version}-r${runId}-a${attempt}`;
   const payloadNames=platform==='ios'?['citizenwallet.ipa']:['citizenwallet.apk','citizenwallet.aab'];
   const payloads=new Map(payloadNames.map((name,index)=>[name,Buffer.from(`asset-${index}-${platform}`)]));
   const manifestName=`citizenwallet-release-${platform}.json`;
   const manifest=Buffer.from(JSON.stringify({product_id:product,version,github_run_number:19,
    head_sha:sourceSha,bundle_id:identity.bundle_id,package_name:identity.package_name,
    assets:payloadNames.map(name=>({platform:platform==='ios'?'iOS':'Android',asset_name:name,asset_sha256:sha256(payloads.get(name))}))}));
   payloads.set(manifestName,manifest);
   const assets=[...payloads].map(([name,bytes],index)=>({id:index+1,name,size:bytes.length,
    state:'uploaded',digest:'sha256:'+sha256(bytes),url:apiRoot+'releases/assets/'+(index+1)}));
   const release={id:9,tag_name:tag,target_commitish:sourceSha,draft:false,prerelease:false,assets};
   const ref={ref:'refs/tags/'+tag,object:{type:'commit',sha:sourceSha}};
   const run={id:runId,run_number:19,run_attempt:attempt,status:'completed',conclusion:'success',event:'workflow_dispatch',
    head_branch:'main',head_sha:sourceSha,path:`.github/workflows/release-${platform}.yml@refs/heads/main`};
   let calls=0;const send=async(url,options)=>{
    calls++;assert.equal(options.method,'GET');
    const path=url.slice(apiRoot.length);let value;
    if(path==='releases/tags/'+encodeURIComponent(tag))value=release;
    else if(path==='git/ref/tags/'+encodeURIComponent(tag))value=ref;
    else if(path==='actions/runs/'+runId)value=run;
    else if(path.startsWith('releases/assets/'))value=payloads.get(assets.find(asset=>asset.url===url)?.name);
    else assert.fail('未声明的GitHub请求');
    return new Response(Buffer.isBuffer(value)?value:JSON.stringify(value),{status:200});
   };
   const result=await inspect(platform,tag,{send});assert.equal(result.assets.length,payloadNames.length);
   assert.equal(result.source_sha,sourceSha);assert.equal(calls,3+assets.length);
   run.conclusion='failure';await assert.rejects(inspect(platform,tag,{send}),/成功自动化/);
   run.conclusion='success';release.assets=[...assets,{...assets[0],id:50,name:'extra'}];
   await assert.rejects(inspect(platform,tag,{send}),/资产集合/);
  }
 });
}
