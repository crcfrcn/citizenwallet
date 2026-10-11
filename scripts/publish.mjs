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

// 本机签名只消费本仓公开声明与同一成功自动化的未签名产物；签名材料由调用方瞬时交付。
const signedProofs=new WeakSet();
const localSigningSteps=Object.freeze({"android":"cd \"$CITIZENWALLET_PROJECT_ROOT\"\nset -euo pipefail\numask 077\nwork=\"$RUNNER_TEMP/citizenwallet-android-signing\"\npublish=\"build/release\"\nrm -rf \"$work\" \"$publish\"\nmkdir -p \"$work\" \"$publish\"\ntrap 'rm -rf \"$work\"' EXIT\npython3 - \"$work\" <<'PY'\nimport base64, os, pathlib, re, sys\nroot = pathlib.Path(sys.argv[1])\nfields = {}\nfor raw in os.environ.get(\"APP_KEY\", \"\").splitlines():\n    line = raw.strip()\n    if not line or line.startswith(\"#\"):\n        continue\n    name, sep, value = line.partition(\"=\")\n    if not sep or name.strip() in fields or not value.strip():\n        raise SystemExit(\"APP_KEY 行格式无效\")\n    fields[name.strip()] = value.strip()\nif set(fields) - {\"keystore\", \"password\", \"alias\", \"keyPassword\"}:\n    raise SystemExit(\"APP_KEY 包含未登记字段\")\nalias = fields.get(\"alias\", \"upload\")\nif not re.fullmatch(r\"[A-Za-z0-9._-]{1,128}\", alias):\n    raise SystemExit(\"APP_KEY alias 无效\")\ntry:\n    key = base64.b64decode(fields[\"keystore\"], validate=True)\n    password = fields[\"password\"]\nexcept (KeyError, ValueError) as exc:\n    raise SystemExit(\"APP_KEY 缺少有效签名材料\") from exc\nif not 1024 <= len(key) <= 32 * 1024 * 1024:\n    raise SystemExit(\"APP_KEY keystore 大小无效\")\n(root / \"release.keystore\").write_bytes(key)\n(root / \"password\").write_text(password)\n(root / \"key-password\").write_text(fields.get(\"keyPassword\", password))\n(root / \"alias\").write_text(alias)\nPY\nGMB_ANDROID_STORE_PASSWORD=\"$(cat \"$work/password\")\"\nGMB_ANDROID_KEY_PASSWORD=\"$(cat \"$work/key-password\")\"\nexport GMB_ANDROID_STORE_PASSWORD GMB_ANDROID_KEY_PASSWORD\nalias=\"$(cat \"$work/alias\")\"\napksigner=\"$ANDROID_HOME/build-tools/37.0.1/apksigner\"\ntest -x \"$apksigner\"\n\"$apksigner\" sign --ks \"$work/release.keystore\" \\\n  --ks-pass env:GMB_ANDROID_STORE_PASSWORD --key-pass env:GMB_ANDROID_KEY_PASSWORD \\\n  --v4-signing-enabled false \\\n  --ks-key-alias \"$alias\" --out \"$publish/citizenwallet.apk\" \\\n  build/app/outputs/flutter-apk/app-release.apk\ncp build/app/outputs/bundle/release/app-release.aab \"$publish/citizenwallet.aab\"\njarsigner -keystore \"$work/release.keystore\" \\\n  -storepass:env GMB_ANDROID_STORE_PASSWORD -keypass:env GMB_ANDROID_KEY_PASSWORD \\\n  \"$publish/citizenwallet.aab\" \"$alias\"\n\"$apksigner\" verify --verbose --print-certs \"$publish/citizenwallet.apk\" \\\n  | tee \"$work/apk-verification.txt\"\ngrep -F 'Verified using v2 scheme (APK Signature Scheme v2): true' \"$work/apk-verification.txt\"\n# Android 上传证书按平台规范可以自签名；只验证包完整性，再从三处回读同一证书。\njarsigner -verify \"$publish/citizenwallet.aab\"\napk_certificate_sha256=\"$(sed -n 's/^Signer #1 certificate SHA-256 digest: //p' \"$work/apk-verification.txt\")\"\nkey_certificate_sha256=\"$(keytool -exportcert -alias \"$alias\" \\\n  -keystore \"$work/release.keystore\" -storepass:env GMB_ANDROID_STORE_PASSWORD -rfc \\\n  | openssl x509 -outform DER | shasum -a 256 | awk '{print $1}')\"\naab_certificate_sha256=\"$(keytool -printcert -jarfile \"$publish/citizenwallet.aab\" -rfc \\\n  | openssl x509 -outform DER | shasum -a 256 | awk '{print $1}')\"\n[[ \"$apk_certificate_sha256\" =~ ^[0-9a-f]{64}$ ]]\ntest \"$apk_certificate_sha256\" = \"$key_certificate_sha256\"\ntest \"$apk_certificate_sha256\" = \"$aab_certificate_sha256\"\ntest \"$(apkanalyzer manifest application-id \"$publish/citizenwallet.apk\")\" = com.crcfrcn.citizenwallet\ntest \"$(apkanalyzer manifest version-code \"$publish/citizenwallet.apk\")\" = \"$CITIZENWALLET_BUILD_NUMBER\"","ios":"cd \"$CITIZENWALLET_PROJECT_ROOT\"\nset -euo pipefail\numask 077\nwork=\"$RUNNER_TEMP/citizenwallet-ios-signing\"\npublish=\"build/release\"\nrm -rf \"$work\" \"$publish\"\nmkdir -p \"$work\" \"$publish\"\nkeychain=\"$work/release.keychain-db\"\nkeychain_password=\"$(openssl rand -hex 32)\"\n# 本机钥匙串搜索列表属共享用户状态；先保存，结束时恢复。\noriginal_keychains=()\nwhile IFS= read -r line; do\n  [[ \"$line\" =~ ^[[:space:]]*\\\"([^\\\"]+)\\\"$ ]] || exit 1\n  original_keychains+=(\"${BASH_REMATCH[1]}\")\ndone < <(security list-keychains -d user)\n(( ${#original_keychains[@]} > 0 )) || exit 1\ncleanup() {\n  security list-keychains -d user -s \"${original_keychains[@]}\" >/dev/null 2>&1 || true\n  security delete-keychain \"$keychain\" >/dev/null 2>&1 || true\n  rm -rf \"$work\"\n}\ntrap cleanup EXIT\npython3 - \"$work\" <<'PY'\nimport base64, os, pathlib, re, sys\nroot = pathlib.Path(sys.argv[1])\nfields = {}\nfor raw in os.environ.get(\"IOS_KEY\", \"\").splitlines():\n    line = raw.strip()\n    if not line or line.startswith(\"#\"):\n        continue\n    name, sep, value = line.partition(\"=\")\n    if not sep or name.strip() in fields or not value.strip():\n        raise SystemExit(\"IOS_KEY 行格式无效\")\n    fields[name.strip()] = value.strip()\nif set(fields) != {\"pkcs12\", \"password\", \"certificate_sha1\"}:\n    raise SystemExit(\"IOS_KEY 字段集合无效\")\nif not re.fullmatch(r\"[0-9A-F]{40}\", fields[\"certificate_sha1\"]):\n    raise SystemExit(\"Apple Distribution 证书摘要无效\")\ntry:\n    pkcs12 = base64.b64decode(fields[\"pkcs12\"], validate=True)\n    profile = base64.b64decode(os.environ.get(\"IOS_PROVISIONING_PROFILE\", \"\"), validate=True)\nexcept ValueError as exc:\n    raise SystemExit(\"Apple Distribution 或 provisioning profile Base64 无效\") from exc\nif not 1024 <= len(pkcs12) <= 32 * 1024 * 1024 or not 1024 <= len(profile) <= 1024 * 1024:\n    raise SystemExit(\"Apple Distribution 签名材料大小无效\")\n(root / \"distribution.p12\").write_bytes(pkcs12)\n(root / \"password\").write_text(fields[\"password\"])\n(root / \"certificate-sha1\").write_text(fields[\"certificate_sha1\"])\n(root / \"profile.mobileprovision\").write_bytes(profile)\nPY\nsecurity create-keychain -p \"$keychain_password\" \"$keychain\"\nsecurity set-keychain-settings -lut 21600 \"$keychain\"\nsecurity unlock-keychain -p \"$keychain_password\" \"$keychain\"\n# 中文注释：codesign 查找 identity 依赖用户钥匙串搜索列表；仅传 --keychain\n# 不能保证干净 runner 能从证书继续定位到同钥匙串中的私钥。\nsecurity list-keychains -d user -s \"$keychain\" \"${original_keychains[@]}\"\nsecurity import \"$work/distribution.p12\" -k \"$keychain\" -P \"$(cat \"$work/password\")\" -T /usr/bin/codesign\nsecurity set-key-partition-list -S apple-tool:,apple:,codesign: -s -k \"$keychain_password\" \"$keychain\" >/dev/null\ncertificate_sha1=\"$(cat \"$work/certificate-sha1\")\"\nsecurity find-certificate -a -Z \"$keychain\" | grep -F \"SHA-1 hash: $certificate_sha1\"\nsecurity find-identity -v -p codesigning \"$keychain\" | grep -Fq \"$certificate_sha1\"\n# 中文注释：干净 runner 的钥匙串不保证预装描述文件 CMS 签发链；LibreSSL\n# 直接验证 CMS 密码学签名并解出载荷，再用正式证书摘要锁定唯一配对。\n/usr/bin/openssl smime -verify -inform DER -in \"$work/profile.mobileprovision\" \\\n  -noverify -out \"$work/profile.plist\" >/dev/null\nprofile_certificate_sha1=\"$(\n  plutil -extract DeveloperCertificates.0 raw -o - \"$work/profile.plist\" \\\n    | base64 -D | shasum -a 1 | awk '{print toupper($1)}'\n)\"\ntest \"$profile_certificate_sha1\" = \"$certificate_sha1\"\ntest \"$(/usr/libexec/PlistBuddy -c 'Print :TeamIdentifier:0' \"$work/profile.plist\")\" = MHYMVRN6FC\ntest \"$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' \"$work/profile.plist\")\" = MHYMVRN6FC.ios.citizenwallet\ntest \"$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:get-task-allow' \"$work/profile.plist\")\" = false\nplutil -extract Entitlements xml1 -o \"$work/entitlements.plist\" \"$work/profile.plist\"\napp=\"build/ios/iphoneos/Runner.app\"\ntest \"$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' \"$app/Info.plist\")\" = ios.citizenwallet\ncp \"$work/profile.mobileprovision\" \"$app/embedded.mobileprovision\"\nfind \"$app\" -type f -name '*.dylib' -print0 | while IFS= read -r -d '' item; do\n  codesign --force --sign \"$certificate_sha1\" --keychain \"$keychain\" --timestamp=none \"$item\"\ndone\nfind \"$app\" -type d \\( -name '*.framework' -o -name '*.appex' \\) -print0 \\\n  | while IFS= read -r -d '' item; do\n      codesign --force --sign \"$certificate_sha1\" --keychain \"$keychain\" --timestamp=none \"$item\"\n    done\ncodesign --force --sign \"$certificate_sha1\" --keychain \"$keychain\" --timestamp=none \\\n  --generate-entitlement-der --entitlements \"$work/entitlements.plist\" \"$app\"\ncodesign --verify --deep --strict \"$app\"\ncodesign -dv --verbose=4 \"$app\" 2> \"$work/codesign.txt\"\ngrep -F 'TeamIdentifier=MHYMVRN6FC' \"$work/codesign.txt\"\nmkdir -p \"$work/package/Payload\"\ncp -R \"$app\" \"$work/package/Payload/Runner.app\"\n(cd \"$work/package\" && ditto -c -k --sequesterRsrc --keepParent Payload \"$CITIZENWALLET_PROJECT_ROOT/$publish/citizenwallet.ipa\")\nunzip -Z1 \"$publish/citizenwallet.ipa\" | grep -Fx 'Payload/Runner.app/Info.plist'"});
const localBundleID="ios.citizenwallet",localPackageName="com.crcfrcn.citizenwallet",localProfileName="WALLET_PROFILE";
function localNames(platform) {
 if(platform==='android')return [product+'-unsigned.apk',product+'-unsigned.aab'];
 if(platform==='ios')return [product+'-unsigned-ios.zip'];
 throw Error('本产品未声明的签名平台');
}
export function testFiles(){return ['scripts/publish.mjs','.github/workflows/release-android.mjs','.github/workflows/release-ios.mjs'];}
// 测试工具由本仓声明；调度方交付登记版本，不借用系统Python。
export async function testTools(){
 const {contract}=await localSource('./build.mjs');
 const python=contract.platforms.android.tools.find(item=>item.id==='python');
 if(!python?.version)throw Error('本产品测试Python声明缺失');
 return [{id:python.id,version:python.version}];
}
export function unsignedArtifactNames(platform) {return ['automation.json',product+'-unsigned-'+platform+'.json',...localNames(platform)];}
function localSignedNames(platform) {if(platform==='android')return [product+'.apk',product+'.aab'];if(platform==='ios')return [product+'.ipa'];throw Error('本产品未声明的签名平台');}
// 长驻控制台按准确源码摘要重读本产品公开声明，避免保存和签名消费不同修订。
async function localSource(name){
 const {lstat,realpath,readFile}=await import('node:fs/promises'),{fileURLToPath,pathToFileURL}=await import('node:url');
 const path=fileURLToPath(new URL(name,import.meta.url)),stat=await lstat(path);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4*1024*1024||await realpath(path)!==path)
   throw Error('本产品公开声明源无效');
 const digest=createHash('sha256').update(await readFile(path)).digest('hex');
 return import(pathToFileURL(path).href+'?revision='+digest);
}
export async function signingTools(platform) {
 const {contract}=await localSource('./build.mjs');const tools=contract.platforms?.[platform]?.tools;
 const required=platform==='android'?['java','android','android-sdk']:platform==='ios'?['xcode']:null;
 if(!required||!Array.isArray(tools))throw Error('本产品签名工具声明缺失');
 const result=required.map(id=>tools.find(item=>item.id===id));
 if(result.some(item=>!item||typeof item.version!=='string'||!item.version))throw Error('本产品签名工具版本无效');
 return result.map(({id,version})=>({id,version}));
}
export async function signingConfiguration(platform) {
 const kind=platform==='android'?'android-signing':platform==='ios'?'ios-signing':null;
 if(!kind)throw Error('本产品未声明的签名平台');
 const {describeConfiguration}=await localSource('./config.mjs');
 const items=describeConfiguration().configuration.items.filter(item=>item.kind===kind);
 const expected=platform==='android'?['APP_KEY']:['IOS_KEY',localProfileName];
 if(items.length!==expected.length||items.some(item=>item.environment!=='release'||item.accessLevel!=='protected')
   ||items.map(item=>item.name).sort().join('\0')!==expected.sort().join('\0'))throw Error('产品签名配置需求与真实消费者不一致');
 return items.map(item=>({environment:item.environment,name:item.name}));
}
// 本机签名工具异步运行并等进程组退出，避免阻塞其它产品的控制台任务。
async function localCommand(command,args,{cwd,env,capture=false,timeout=1800000}={}) {
 const {spawn}=await import('node:child_process');
 return new Promise((resolve,reject)=>{
   let child;try{child=spawn(command,args,{cwd,env,detached:true,stdio:['ignore',capture?'pipe':'ignore','ignore']});}
   catch{reject(Error('本机签名工具无法启动'));return;}
   const parts=[];let size=0,failed=false,settled=false;
   const stop=()=>{if(!child.pid)return;try{process.kill(-child.pid,'SIGTERM');}catch{child.kill();}};
   const timer=setTimeout(()=>{failed=true;stop();},timeout);
   if(capture&&child.stdout)child.stdout.on('data',part=>{size+=part.length;if(size>16*1024*1024){failed=true;stop();}else parts.push(part);});
   child.once('error',()=>{if(settled)return;settled=true;clearTimeout(timer);reject(Error('本机签名工具无法启动'));});
   child.once('close',(code,signal)=>{if(settled)return;settled=true;clearTimeout(timer);
     if(failed||code!==0||signal)reject(Error('本机签名工具失败或超时'));
     else resolve({output:capture?Buffer.concat(parts).toString('utf8'):''});
   });
 });
}
async function localDigest(path) {
 const {createReadStream}=await import('node:fs');const hash=createHash('sha256');
 for await(const part of createReadStream(path))hash.update(part);
 return hash.digest('hex');
}
function localRegular(fs,path,limit) {
 const stat=fs.lstatSync(path);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1||stat.size<1||stat.size>limit||fs.realpathSync(path)!==path)
   throw Error('本机发布资产不是准确有界普通文件');
 return stat;
}
export async function verifyUnsigned(platform,directory,run) {
 const fs=await import('node:fs'),path=await import('node:path');
 const names=localNames(platform),manifestName=product+'-unsigned-'+platform+'.json';
 if(typeof directory!=='string'||!path.isAbsolute(directory)||fs.realpathSync(directory)!==directory
   ||!fs.lstatSync(directory).isDirectory()||fs.readdirSync(directory).sort().join('\0')!==['automation.json',manifestName,...names].sort().join('\0'))
   throw Error('未签名资产目录不属于准确闭集');
 if(!Number.isSafeInteger(run?.id)||run.id<1||!Number.isSafeInteger(run?.run_attempt)||run.run_attempt<1
   ||!Number.isSafeInteger(run?.run_number)||run.run_number<1||run.status!=='completed'||run.conclusion!=='success'
   ||run.head_branch!=='main'||run.event!=='workflow_dispatch'||run.repository?.full_name!==repository
   ||String(run.path||'').split('@')[0]!=='.github/workflows/release-'+platform+'.yml'
   ||!/^[a-f0-9]{40}$/u.test(run.head_sha||''))throw Error('未签名资产没有同一成功自动化身份');
 const metadata=JSON.parse(fs.readFileSync(path.join(directory,'automation.json'),'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,manifestName),'utf8'));
 const version=metadata.version,tag=`${product}-${platform}-v${version}-r${run.id}-a${run.run_attempt}`;
 if(metadata.schema!==1||metadata.repository!==repository||metadata.product_id!==product||metadata.platform!==platform
   ||metadata.run_id!==run.id||metadata.run_attempt!==run.run_attempt||metadata.run_number!==run.run_number
   ||metadata.source_sha!==run.head_sha||metadata.workflow!=='.github/workflows/release-'+platform+'.yml'
   ||metadata.tag!==tag||!/^[0-9]+\.[0-9]+\.[0-9]+$/u.test(version||'')
   ||manifest.product_id!==product||manifest.version!==version||manifest.github_run_number!==run.run_number
   ||manifest.head_sha!==run.head_sha||manifest.bundle_id!==localBundleID||manifest.package_name!==localPackageName
   ||!Array.isArray(metadata.assets)||metadata.assets.length!==names.length+1
   ||!Array.isArray(manifest.assets)||manifest.assets.length!==names.length)throw Error('未签名资产清单与成功自动化不一致');
 for(const name of [...names,manifestName]){
   const row=metadata.assets.find(item=>item?.name===name);
   if(!row||metadata.assets.filter(item=>item?.name===name).length!==1||!/^[a-f0-9]{64}$/u.test(row.sha256||''))throw Error('未签名资产摘要声明无效');
   const file=path.join(directory,name),stat=localRegular(fs,file,2*1024**3);
   if(stat.size!==row.size||await localDigest(file)!==row.sha256)throw Error('未签名资产字节不符');
   if(name!==manifestName){const proof=manifest.assets.find(item=>item?.asset_name===name);
     if(!proof||manifest.assets.filter(item=>item?.asset_name===name).length!==1
       ||proof.platform!==(platform==='ios'?'iOS':'Android')||proof.asset_sha256!==row.sha256)throw Error('未签名产物声明不一致');}
 }
 return {product_id:product,platform,version,tag,run_id:run.id,run_attempt:run.run_attempt,
   run_number:run.run_number,source_sha:run.head_sha,bundle_id:localBundleID,package_name:localPackageName,
   unsigned_assets:metadata.assets.filter(item=>names.includes(item.name))};
}
export async function signUnsigned(platform,directory,run,material,workRoot,{environment:tools=process.env}={}) {
 const fs=await import('node:fs'),path=await import('node:path');
 const proof=await verifyUnsigned(platform,directory,run),refs=await signingConfiguration(platform);
 if(!material||typeof material!=='object'||refs.some(ref=>{
   const value=material[ref.environment+':'+ref.name];return !Buffer.isBuffer(value)||value.length<1||value.length>32*1024*1024;
 }))throw Error('本次产品签名材料缺失或超限');
 if(typeof workRoot!=='string'||!path.isAbsolute(workRoot)||fs.realpathSync(workRoot)!==workRoot
   ||!fs.lstatSync(workRoot).isDirectory())throw Error('本机签名现场无效');
 const stage=fs.mkdtempSync(path.join(workRoot,'sign-'));
 try{
   if(platform==='android'){
     const apk=path.join(stage,'build/app/outputs/flutter-apk'),aab=path.join(stage,'build/app/outputs/bundle/release');
     fs.mkdirSync(apk,{recursive:true,mode:0o700});fs.mkdirSync(aab,{recursive:true,mode:0o700});
     fs.copyFileSync(path.join(directory,product+'-unsigned.apk'),path.join(apk,'app-release.apk'));
     fs.copyFileSync(path.join(directory,product+'-unsigned.aab'),path.join(aab,'app-release.aab'));
   } else {
     const archive=path.join(directory,product+'-unsigned-ios.zip');
     const listing=await localCommand('/usr/bin/unzip',['-Z1',archive],{capture:true,timeout:300000});
     const entries=listing.output.trim().split('\n');
     if(entries.length<2||entries.length>20000||new Set(entries).size!==entries.length
       ||entries.some(name=>name!=='__MACOSX/'&&!name.startsWith('Runner.app/')&&!name.startsWith('__MACOSX/Runner.app/'))
       ||entries.some(name=>{const parts=name.endsWith('/')?name.slice(0,-1).split('/'):name.split('/');return parts.some(part=>part==='..'||part==='.'||part==='');}))throw Error('iOS未签名包包含越界路径');
     const listingDetails=await localCommand('/usr/bin/bsdtar',['-tvf',archive],{capture:true,timeout:300000});
     if(listingDetails.output.split('\n').filter(Boolean).some(line=>!['-','d'].includes(line[0])))
       throw Error('iOS未签名包包含链接或特殊文件');
     const ios=path.join(stage,'build/ios/iphoneos');fs.mkdirSync(ios,{recursive:true,mode:0o700});
     await localCommand('/usr/bin/ditto',['-x','-k',archive,ios],{timeout:300000});
     const app=path.join(ios,'Runner.app');if(!fs.lstatSync(app).isDirectory()||fs.realpathSync(app)!==app)throw Error('iOS应用目录无效');
     const stack=[ios];let inspected=0;while(stack.length){const current=stack.pop();for(const item of fs.readdirSync(current,{withFileTypes:true})){
       const candidate=path.join(current,item.name),resolved=fs.realpathSync(candidate);
       if(++inspected>50000||!resolved.startsWith(ios+'/')&&resolved!==ios||item.isSymbolicLink())throw Error('iOS未签名包提取越界');
       if(item.isDirectory())stack.push(candidate);
     }}

   }
   for(const item of proof.unsigned_assets){const copied=platform==='android'
     ?path.join(stage,item.name.endsWith('.apk')?'build/app/outputs/flutter-apk/app-release.apk':'build/app/outputs/bundle/release/app-release.aab')
     :path.join(directory,item.name);
     if(await localDigest(copied)!==item.sha256)throw Error('签名前未签名资产发生变化');}
   const env={PATH:tools.PATH||'/usr/bin:/bin',HOME:tools.HOME||process.env.HOME,ANDROID_HOME:tools.ANDROID_HOME,
     JAVA_HOME:tools.JAVA_HOME,RUNNER_TEMP:stage,CITIZENAPP_BUILD_TEMP:stage,
     CITIZENAPP_FLUTTER_ROOT:stage,CITIZENAPP_RELEASE_ROOT:path.join(stage,'build/release'),
     CITIZENAPP_BUILD_NUMBER:String(proof.run_number),CITIZENWALLET_BUILD_NUMBER:String(proof.run_number),CITIZENWALLET_PROJECT_ROOT:stage};
   if(platform==='android')env.APP_KEY=material['release:APP_KEY'].toString('utf8');
   else {env.IOS_KEY=material['release:IOS_KEY'].toString('utf8');env.IOS_PROVISIONING_PROFILE=material['release:'+localProfileName].toString('utf8');}
   await localCommand('bash',['--noprofile','--norc','-e','-o','pipefail','-c',localSigningSteps[platform],'local-mobile-signing'],
     {cwd:stage,env,timeout:1800000});
   delete env.APP_KEY;delete env.IOS_KEY;delete env.IOS_PROVISIONING_PROFILE;
   const output=path.join(stage,'build/release'),names=localSignedNames(platform);
   if(fs.readdirSync(output).sort().join('\0')!==names.slice().sort().join('\0'))throw Error('正式签名产物集合无效');
   const destination=path.join(workRoot,'signed');fs.mkdirSync(destination,{mode:0o700});
   const assets=[];
   for(const name of names){const source=path.join(output,name),stat=localRegular(fs,source,2*1024**3);
     const target=path.join(destination,name);fs.copyFileSync(source,target);
     assets.push({platform:platform==='ios'?'iOS':'Android',asset_name:name,asset_sha256:await localDigest(target),size:stat.size});}
   const manifestName=product+'-release-'+platform+'.json';
   const manifest={product_id:product,version:proof.version,github_run_number:proof.run_number,head_sha:proof.source_sha,
     bundle_id:localBundleID,package_name:localPackageName,
     assets:assets.map(({platform,asset_name,asset_sha256})=>({platform,asset_name,asset_sha256}))};
   fs.writeFileSync(path.join(destination,manifestName),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
   const signedProof={...proof,directory:destination,assets:assets.map(({asset_name,size,asset_sha256})=>({name:asset_name,size,sha256:asset_sha256}))};
   signedProofs.add(signedProof);return signedProof;
 } finally {fs.rmSync(stage,{recursive:true,force:true});}
}

// 正式上传只在本机签名成功且调用方完成最终确认后执行，资产和GitHub写入均按本产品验真。
async function localPublishRequest(token,path,{method='GET',body,size,send=fetch}={}) {
 const address=path.startsWith('https://')?new URL(path):new URL('https://api.github.com/repos/'+repository+'/'+path);
 if(!['api.github.com','uploads.github.com'].includes(address.hostname)||address.protocol!=='https:'
   ||address.username||address.password||address.hash||!address.pathname.startsWith('/repos/'+repository+'/'))
   throw Error('本产品GitHub发布地址无效');
 const response=await send(address.href,{method,redirect:'error',credentials:'omit',
   headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
     'Content-Type':size?'application/octet-stream':'application/json',...(size?{'Content-Length':String(size)}:{}),'X-GitHub-Api-Version':'2026-03-10','User-Agent':product},
   ...(body===undefined?{}:{body:size?body:JSON.stringify(body)}),...(size?{duplex:'half'}:{}),signal:AbortSignal.timeout(180000)});
 if(response.status===404&&method==='GET')return null;
 if(!response.ok)throw Error('本产品GitHub发布请求失败：HTTP '+response.status);
 if(response.status===204)return {};
 if(!response.body)throw Error('本产品GitHub发布回执缺失');
 let count=0;const parts=[];for await(const part of response.body){count+=part.length;if(count>8*1024*1024)throw Error('本产品GitHub发布回执超限');parts.push(part);}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(parts)));}
 catch{throw Error('本产品GitHub发布回执格式无效');}
}
async function localReadbackAsset(token,asset,expected,send) {
 const api='https://api.github.com/repos/'+repository+'/releases/assets/'+asset.id;
 if(asset.url!==api)throw Error('正式资产回读地址不一致');
 const options={method:'GET',redirect:'manual',credentials:'omit',headers:{Authorization:'Bearer '+token,
   Accept:'application/octet-stream','X-GitHub-Api-Version':'2026-03-10','User-Agent':product},signal:AbortSignal.timeout(180000)};
 let response=await send(api,options);
 if(response.status===302){const location=new URL(response.headers.get('location'));
   if(location.protocol!=='https:'||location.username||location.password||location.hash
     ||!/(?:^|\.)githubusercontent\.com$/u.test(location.hostname))throw Error('正式资产下载地址无效');
   await response.body?.cancel();response=await send(location.href,{method:'GET',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(180000)});
 }
 if(!response.ok||!response.body)throw Error('正式资产回读失败');
 let count=0;const hash=createHash('sha256');for await(const part of response.body){count+=part.length;
   if(count>expected.size)throw Error('正式资产回读超过声明大小');hash.update(part);}
 if(count!==expected.size||hash.digest('hex')!==expected.sha256)throw Error('正式资产回读字节不一致');
}
export async function publishSigned(proof,token,{send=fetch,expiresAt}={}) {
 const fs=await import('node:fs'),path=await import('node:path');
 if(typeof token!=='string'||!/^ghs_[^\s\x00-\x1f\x7f]{1,2044}$/u.test(token)
   ||!Number.isSafeInteger(expiresAt)||expiresAt<=Date.now()/1000)throw Error('本产品正式发布短期授权无效');
 if(!proof||typeof proof!=='object'||!signedProofs.has(proof))throw Error('正式发布缺少本次本机签名验真回执');
 const platform=proof.platform,names=localSignedNames(platform),manifestName=product+'-release-'+platform+'.json';
 if(proof.product_id!==product||proof.tag!==`${product}-${platform}-v${proof.version}-r${proof.run_id}-a${proof.run_attempt}`
   ||!/^[0-9]+\.[0-9]+\.[0-9]+$/u.test(proof.version||'')||!/^[a-f0-9]{40}$/u.test(proof.source_sha||'')
   ||!Number.isSafeInteger(proof.run_id)||proof.run_id<1||!Number.isSafeInteger(proof.run_attempt)||proof.run_attempt<1
   ||typeof proof.directory!=='string'||!path.isAbsolute(proof.directory)
   ||fs.realpathSync(proof.directory)!==proof.directory||!fs.lstatSync(proof.directory).isDirectory()
   ||fs.readdirSync(proof.directory).sort().join('\0')!==[...names,manifestName].sort().join('\0'))
   throw Error('本产品正式发布候选身份或资产闭集无效');
 const manifest=JSON.parse(fs.readFileSync(path.join(proof.directory,manifestName),'utf8'));
 if(manifest.product_id!==product||manifest.version!==proof.version||manifest.github_run_number!==proof.run_number
   ||manifest.head_sha!==proof.source_sha||manifest.bundle_id!==localBundleID||manifest.package_name!==localPackageName
   ||!Array.isArray(manifest.assets)||manifest.assets.length!==names.length)throw Error('正式产物清单身份不一致');
 const rows=[];for(const name of [...names,manifestName]){
   const file=path.join(proof.directory,name),stat=localRegular(fs,file,2*1024**3);
   const digest=await localDigest(file),expected=proof.assets?.find(item=>item.name===name);
   if(name!==manifestName&&(!expected||expected.size!==stat.size||expected.sha256!==digest
      ||manifest.assets.filter(item=>item?.asset_name===name&&item.asset_sha256===digest).length!==1))
     throw Error('正式签名产物在上传前变化');
   rows.push({name,size:stat.size,sha256:digest,path:file});
 }
 const request=(target,options={})=>localPublishRequest(token,target,{...options,send});
 const run=await request('actions/runs/'+proof.run_id);
 if(run?.id!==proof.run_id||run.run_attempt!==proof.run_attempt||run.run_number!==proof.run_number
   ||run.head_sha!==proof.source_sha||run.status!=='completed'||run.conclusion!=='success'
   ||run.event!=='workflow_dispatch'||run.head_branch!=='main'||run.repository?.full_name!==repository
   ||String(run.path||'').split('@')[0]!=='.github/workflows/release-'+platform+'.yml')
   throw Error('正式发布前成功自动化身份变化');
 const recent=await request('actions/workflows/release-'+platform+'.yml/runs?branch=main&event=workflow_dispatch&status=completed&per_page=100&page=1');
 if(!Array.isArray(recent?.workflow_runs)||recent.workflow_runs.filter(value=>value?.conclusion==='success').sort((a,b)=>b.id-a.id)[0]?.id!==proof.run_id)
   throw Error('正式发布候选已被更新的成功自动化取代');
 if(await request('git/ref/tags/'+encodeURIComponent(proof.tag))!==null)throw Error('本次正式发布Tag已经存在');
 let createdTag=false,release=null;
 try{
   const reference=await request('git/refs',{method:'POST',body:{ref:'refs/tags/'+proof.tag,sha:proof.source_sha}});
   if(reference?.ref!=='refs/tags/'+proof.tag||reference.object?.sha!==proof.source_sha)throw Error('正式Tag创建未确认');
   createdTag=true;
   release=await request('releases',{method:'POST',body:{tag_name:proof.tag,target_commitish:proof.source_sha,
     name:`${product} · ${platform} · ${proof.version}`,draft:false,prerelease:false,make_latest:'false',
     body:`${product} · ${platform} · ${proof.version}\nSource: ${proof.source_sha}\nRun: ${proof.run_id} / ${proof.run_attempt}`}});
   if(!Number.isSafeInteger(release?.id)||release.id<1||typeof release.upload_url!=='string')throw Error('正式Release创建未确认');
   const uploaded=[];
   for(const item of rows){const url=new URL(release.upload_url.replace(/\{.*$/u,''));url.searchParams.set('name',item.name);
     const asset=await request(url.href,{method:'POST',body:fs.createReadStream(item.path),size:item.size});
     if(!Number.isSafeInteger(asset?.id)||asset.name!==item.name||asset.size!==item.size||asset.state!=='uploaded')
       throw Error('正式资产上传未确认');
     await localReadbackAsset(token,asset,item,send);uploaded.push(asset);
   }
   const current=await request('releases/'+release.id);
   if(current?.tag_name!==proof.tag||current.target_commitish!==proof.source_sha||current.draft||current.prerelease
     ||!Array.isArray(current.assets)||current.assets.length!==rows.length)throw Error('正式Release回查身份不一致');
   for(const item of rows){const asset=current.assets.find(value=>value.name===item.name);
     if(!asset||asset.size!==item.size||asset.state!=='uploaded'||asset.digest!=='sha256:'+item.sha256)
       throw Error('正式Release资产证明不一致');}
 }catch(error){
   const failures=[];
   if(release?.id)try{await request('releases/'+release.id,{method:'DELETE'});}catch(rollback){failures.push(rollback)}
   if(createdTag)try{await request('git/refs/tags/'+encodeURIComponent(proof.tag),{method:'DELETE'});}catch(rollback){failures.push(rollback)}
   if(failures.length)throw new AggregateError([error,...failures],'正式发布失败且撤销未全部确认');
   throw error;
 }
 // 仅新正式包逐件回读成功后清理同目标旧成功；清理失败保留新Release并报告准确坐标。
 try{const module=await import(new URL('../.github/workflows/release-'+platform+'.mjs',import.meta.url));
   await module.cleanup('success',{run_id:proof.run_id},request);
 }catch{throw Error('新正式Release已创建并验真，旧成功记录清理失败：'+proof.tag);}
 return {product_id:product,platform,tag:proof.tag,release_id:release.id,source_sha:proof.source_sha,run_id:proof.run_id};
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
 test('产品签名需求与成功自动化未签名资产精确闭合',async()=>{
  const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
  for(const platform of ['android','ios']){
   const names=localNames(platform),refs=await signingConfiguration(platform);
   assert.equal(refs.length,platform==='android'?1:2);
   // macOS临时根可能含系统链接；夹具先取得真实目录，正式入口仍拒绝非规范路径。
   const directory=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),product+'-unsigned-fixture-')));
   try{
    const run={id:42,run_attempt:2,run_number:17,status:'completed',conclusion:'success',head_branch:'main',
      event:'workflow_dispatch',repository:{full_name:repository},head_sha:'a'.repeat(40),
      path:'.github/workflows/release-'+platform+'.yml'};
    const version='1.2.3',manifestName=product+'-unsigned-'+platform+'.json';
    const assets=[];
    for(const name of names){const bytes=Buffer.from('unsigned-'+name);fs.writeFileSync(path.join(directory,name),bytes);
      assets.push({name,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
    const manifest={product_id:product,version,github_run_number:17,head_sha:run.head_sha,
      bundle_id:localBundleID,package_name:localPackageName,
      assets:assets.map(value=>({platform:platform==='ios'?'iOS':'Android',asset_name:value.name,asset_sha256:value.sha256}))};
    const manifestBytes=Buffer.from(JSON.stringify(manifest));fs.writeFileSync(path.join(directory,manifestName),manifestBytes);
    assets.push({name:manifestName,size:manifestBytes.length,sha256:createHash('sha256').update(manifestBytes).digest('hex')});
    const metadata={schema:1,repository,product_id:product,platform,source_sha:run.head_sha,run_id:42,
      run_number:17,run_attempt:2,workflow:run.path,version,tag:`${product}-${platform}-v${version}-r42-a2`,assets};
    fs.writeFileSync(path.join(directory,'automation.json'),JSON.stringify(metadata));
    assert.equal((await verifyUnsigned(platform,directory,run)).run_id,42);
    await assert.rejects(verifyUnsigned(platform,directory+'/.',run),/目录/u);
    fs.writeFileSync(path.join(directory,'unexpected'), 'extra');
    await assert.rejects(verifyUnsigned(platform,directory,run),/闭集/u);
    fs.rmSync(path.join(directory,'unexpected'));
    fs.writeFileSync(path.join(directory,names[0]),'tampered');
    await assert.rejects(verifyUnsigned(platform,directory,run),/字节不符/u);
   }finally{fs.rmSync(directory,{recursive:true,force:true});}
  }
  assert.deepEqual(testFiles(),['scripts/publish.mjs','.github/workflows/release-android.mjs','.github/workflows/release-ios.mjs']);
  assert.deepEqual(await testTools(),[{id:'python',version:(await localSource('./build.mjs')).contract.platforms.android.tools.find(item=>item.id==='python').version}]);
  await assert.rejects(signingConfiguration('windows'),/平台/u);
  assert.deepEqual((await signingTools('android')).map(item=>item.id),['java','android','android-sdk']);
  assert.deepEqual((await signingTools('ios')).map(item=>item.id),['xcode']);
  for(const platform of ['android','ios'])await localCommand('bash',['-n','-c',localSigningSteps[platform]]);
  assert.equal((await localCommand('/usr/bin/printf',['ok'],{capture:true})).output,'ok');
  await assert.rejects(localCommand('/usr/bin/false',[]),/失败/u);
 });
 test('本机签名回执绑定正式上传，远端回读逐件验真',async()=>{
  const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
  const directory=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),product+'-signed-fixture-')));
  try{
   const platform='ios',name=product+'.ipa',manifestName=product+'-release-ios.json';
   const bytes=Buffer.from('signed-fixture'),digest=createHash('sha256').update(bytes).digest('hex');
   fs.writeFileSync(path.join(directory,name),bytes);
   const source='a'.repeat(40),tag=product+'-ios-v1.2.3-r42-a2';
   const manifest={product_id:product,version:'1.2.3',github_run_number:17,head_sha:source,
     bundle_id:localBundleID,package_name:localPackageName,
     assets:[{platform:'iOS',asset_name:name,asset_sha256:digest}]};
   fs.writeFileSync(path.join(directory,manifestName),JSON.stringify(manifest));
   const proof={product_id:product,platform,version:'1.2.3',tag,run_id:42,run_attempt:2,run_number:17,
     source_sha:source,directory,assets:[{name,size:bytes.length,sha256:digest}]};
   const token='ghs_synthetic',expiresAt=Math.floor(Date.now()/1000)+300;
   await assert.rejects(publishSigned(proof,token,{expiresAt,send:()=>assert.fail('未签名回执不得联网')}),/回执/u);
   signedProofs.add(proof);
   const api='https://api.github.com/repos/'+repository+'/',uploaded=new Map(),calls=[];let newer=false;
   const run={id:42,run_attempt:2,run_number:17,head_sha:source,status:'completed',conclusion:'success',
     event:'workflow_dispatch',head_branch:'main',repository:{full_name:repository},
     path:'.github/workflows/release-ios.yml',created_at:'2026-10-11T00:00:00Z'};
   const response=(value,status=200,headers={})=>new Response(value===null?null:JSON.stringify(value),{status,headers});
   const send=async(url,options)=>{const address=new URL(url),target=address.href;calls.push(options.method+' '+target);
     if(target.startsWith(api+'actions/workflows/release-ios.yml/runs?'))return response({workflow_runs:newer?[{...run,id:43},run]:[run]});
     if(target===api+'actions/runs/42')return response(run);
     if(target.startsWith(api+'actions/runs?'))return response({workflow_runs:[run]});
     if(target.startsWith(api+'releases?'))return response([]);
     if(target===api+'git/ref/tags/'+encodeURIComponent(tag))return response({message:'missing'},404);
     if(target===api+'git/refs'&&options.method==='POST')return response({ref:'refs/tags/'+tag,object:{sha:source}});
     if(target===api+'releases'&&options.method==='POST')return response({id:7,upload_url:'https://uploads.github.com/repos/'+repository+'/releases/7/assets{?name,label}'});
     if(address.hostname==='uploads.github.com'){
       const item=address.searchParams.get('name'),size=Number(options.headers['Content-Length']);
       assert.equal(size,fs.statSync(path.join(directory,item)).size);
       const asset={id:uploaded.size+1,name:item,size,state:'uploaded',url:api+'releases/assets/'+(uploaded.size+1),
         digest:'sha256:'+createHash('sha256').update(fs.readFileSync(path.join(directory,item))).digest('hex')};
       uploaded.set(asset.id,asset);return response(asset);
     }
     const asset=/releases\/assets\/(\d+)$/u.exec(address.pathname);
     if(asset&&address.hostname==='api.github.com')return new Response(null,{status:302,
       headers:{location:'https://release-assets.githubusercontent.com/fixture/'+asset[1]}});
     if(address.hostname==='release-assets.githubusercontent.com'){
       const item=uploaded.get(Number(address.pathname.split('/').at(-1)));
       return new Response(fs.readFileSync(path.join(directory,item.name)),{status:200});
     }
     if(target===api+'releases/7')return response({tag_name:tag,target_commitish:source,draft:false,prerelease:false,
       assets:[...uploaded.values()]});
     throw Error('意外模拟发布请求：'+target);
   };
   const properDirectory=proof.directory;proof.directory+='/.';
   await assert.rejects(publishSigned(proof,token,{send,expiresAt}),/身份或资产闭集/u);
   proof.directory=properDirectory;
   const result=await publishSigned(proof,token,{send,expiresAt});
   assert.equal(result.release_id,7);assert.equal(uploaded.size,2);
   assert.equal(calls.filter(value=>value.includes('uploads.github.com')).length,2);
   newer=true;await assert.rejects(publishSigned(proof,token,{send,expiresAt}),/取代/u);newer=false;
   fs.writeFileSync(path.join(directory,name),'tampered');
   await assert.rejects(publishSigned(proof,token,{send,expiresAt}),/变化/u);
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
 });
}
