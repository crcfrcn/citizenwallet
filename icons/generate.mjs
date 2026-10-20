#!/usr/bin/env node
// 图标只调用macOS官方sips；原件、尺寸和任务边界由公民钱包持有。
import {execFileSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,copyFileSync,lstatSync,realpathSync} from 'node:fs';
import {join,resolve,relative,sep,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export function generatePlatformIcons(project,platform){
 const base=join(root,'target'),difference=relative(base,project).split(sep);
 if(!['ios','android'].includes(platform)||!project.startsWith(base+sep)||difference.includes('..')||!['build','test'].includes(difference[0])||!difference.includes('source-view')||realpathSync(project)!==project)throw Error('图标只能生成到本产品target工程');
 const output=join(project,platform,'build',platform==='ios'?'Assets.xcassets':'generated-icons');
 const emit=(path,source,size)=>{
  const file=join(project,'icons',source);if(!lstatSync(file).isFile()||realpathSync(file)!==file)throw Error('图标原件无效');mkdirSync(dirname(path),{recursive:true});
  const properties=execFileSync('/usr/bin/sips',['-g','pixelWidth','-g','pixelHeight',file],{encoding:'utf8'}),width=Number(/pixelWidth: (\d+)/u.exec(properties)?.[1]),height=Number(/pixelHeight: (\d+)/u.exec(properties)?.[1]);
  if(!Number.isInteger(size)||size<1||width<size||height<size)throw Error('图标尺寸无效或需要放大');
  if(width===size&&height===size)copyFileSync(file,path);else execFileSync('/usr/bin/sips',['--resampleHeightWidth',String(size),String(size),file,'--out',path],{stdio:'pipe'});
 };
 if(platform==='android')for(const [density,scale]of [['mdpi',1],['hdpi',1.5],['xhdpi',2],['xxhdpi',3],['xxxhdpi',4]]){
  const dir=join(output,'mipmap-'+density);for(const [name,source,size]of [['ic_launcher.png','android-launcher.png',48],['ic_launcher_foreground.png','android-foreground.png',108],['launch_image.png','launch-logo.png',120]])emit(join(dir,name),source,size*scale);
 }else for(const [name,source,manifestName]of [['AppIcon.appiconset','app-icon.png','AppIcon.json'],['CitizenLaunchLogo.imageset','launch-logo.png','CitizenLaunchLogo.json']]){
  const manifest=JSON.parse(readFileSync(join(project,'ios/resources',manifestName),'utf8')),dir=join(output,name),seen=new Set();
  for(const item of manifest.images){if(!/^[\w@.-]+\.png$/u.test(item.filename))throw Error('图标文件名无效');if(seen.has(item.filename))continue;seen.add(item.filename);const size=name==='AppIcon.appiconset'?Number(item.size.split('x')[0])*Number(item.scale[0]):160*Number(item.scale[0]);emit(join(dir,item.filename),source,size);}
  writeFileSync(join(dir,'Contents.json'),JSON.stringify(manifest,null,2)+'\n');
 }return output;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)&&!process.env.NODE_TEST_CONTEXT){try{generatePlatformIcons(process.argv[3],process.argv[2]);}catch(error){console.error(error.message);process.exitCode=1;}}
