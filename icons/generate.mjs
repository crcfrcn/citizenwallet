#!/usr/bin/env node
import {inflateSync,deflateSync} from 'node:zlib';
import {lstatSync,realpathSync,readdirSync,rmSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {basename,dirname,join,isAbsolute,resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

// 图标原件与派生规则由本功能目录持有；只写本仓已验证的 target 工程。
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
function generatePlatformIcons(project,platform,authorizedWork,environment=process.env){
 if(!['ios','android'].includes(platform)||!isAbsolute(project)||resolve(project)!==project)throw Error('图标生成平台或工程无效');
 const sourceWork=join(root,'target'),work=authorizedWork||sourceWork;
 if(!isAbsolute(work)||resolve(work)!==work)throw Error('图标工作根无效');
 if(work!==sourceWork){
  const runner=environment.RUNNER_TEMP,run=environment.GITHUB_RUN_ID,attempt=environment.GITHUB_RUN_ATTEMPT;
  if(!runner||!run||!attempt||resolve(runner)!==runner||!work.startsWith(runner+sep)
   ||basename(work)!==`citizenwallet-${platform}-view-${run}-${attempt}`)throw Error('图标自动化工作根身份无效');
  ordinary(work,true);
 }
 const parts=relative(work,project).split(sep);
 if(work===sourceWork?!['build','test'].includes(parts[0])||!parts.includes('source-view')||parts.includes('..')
  :project!==join(work,'source-view'))throw Error('图标只能生成到当前build或test的target工程');
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

const direct=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(direct&&!process.env.NODE_TEST_CONTEXT){
 try{
  const [platform,project,work,...extra]=process.argv.slice(2);
  if(!platform||!project||!work||extra.length)throw Error('图标自动化入口参数无效');
  generatePlatformIcons(project,platform,work);
 }catch(error){console.error(error.message);process.exitCode=1;}
}

// 图标格式和工程边界的回归归图标功能所有；普通导入不注册测试。
if(process.env.NODE_TEST_CONTEXT&&process.argv[1]===import.meta.filename){
 const {default:test}=await import('node:test');
 const {default:assert}=await import('node:assert/strict');
 test('图标缩放保持像素与PNG完整性，损坏摘要失败',()=>{
  const source={width:2,height:2,channels:4,pixels:Buffer.from([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]),color:[]};
  const encoded=resizePNG(source,1),image=decodePNG(encoded);
  assert.equal(image.width,1);assert.equal(image.height,1);assert.equal(image.channels,4);
  assert.throws(()=>resizePNG(source,3),/放大/);
  encoded[encoded.length-1]^=1;assert.throws(()=>decodePNG(encoded),/损坏/);
 });
 test('图标派生拒绝源码根与未声明平台',()=>{
  assert.throws(()=>generatePlatformIcons(root,'ios'),/target工程/);
  assert.throws(()=>generatePlatformIcons(root,'web'),/工程无效/);
 });
}

