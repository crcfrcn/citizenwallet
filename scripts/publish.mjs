#!/usr/bin/env node
// 商店发布只读取本仓原始应用身份；正式编译包的证明由build.mjs独立验真。
import {createHash} from 'node:crypto';
import {constants,closeSync,fstatSync,lstatSync,openSync,readSync,realpathSync} from 'node:fs';
import {dirname,isAbsolute,join,parse,relative,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const product='citizenwallet';
const fail=message=>{throw Error('公民钱包分发：'+message);};
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

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
 const names=['pubspec.yaml','scripts/publish.mjs','ios/Runner.pbxproj','android/App.gradle.kts'];
 const sources=names.map(name=>readStoreSource(root,name));
 const manifest=sources[0].toString('utf8');
 if([...manifest.matchAll(/^name:[ \t]*([^\r\n]+)[ \t]*$/gmu)].map(row=>row[1]).join('\0')!=='citizenwallet')fail('产品原始名称无效');
 const receipt={schema:1,product_id:product,bundle_id:iosStoreBundleID(sources[2].toString('utf8')),
  package_name:androidStorePackageName(sources[3].toString('utf8')),
  source_files:names.map((path,index)=>({path,sha256:sha256(sources[index])}))};
 for(const item of receipt.source_files)if(sha256(readStoreSource(root,item.path))!==item.sha256)fail('商店身份源码解析期间变化');
 return receipt;
}

// 渠道发布不参与本机或 GitHub Runner 的签名及产物验真。
const direct=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
const testing=direct&&Boolean(process.env.NODE_TEST_CONTEXT)&&process.argv.length===2;
if(direct&&!testing){
 try{
  const [command,...args]=process.argv.slice(2);
  if(command==='identity'&&args.length===0)process.stdout.write(JSON.stringify(storeIdentity())+'\n');
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
}
