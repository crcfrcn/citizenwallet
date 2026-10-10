#!/usr/bin/env node
// 本仓本目标的完整自动化只由同名Workflow调用；版本与产物均在GitHub生成。
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { appendFileSync, chmodSync, copyFileSync, cpSync, createReadStream, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {generatePlatformIcons} from '../../icons/generate.mjs';

export const owner = Object.freeze({"product": "citizenwallet", "platform": "android", "repository": "crcfrcn/citizenwallet", "version_source": {"kind": "pubspec", "path": "pubspec.yaml"}, "required_assets": ["citizenwallet.apk", "citizenwallet.aab", "citizenwallet-release-android.json"]});
const commands = Object.freeze({
  "1": {
    "shell": "bash",
    "source": "set -euo pipefail\ntest \"$(git rev-parse HEAD)\" = \"$SOURCE_SHA\"\npython3 - <<'PY_VERSION'\nimport os, re\nversion, build = os.environ[\"SOFTWARE_VERSION\"], os.environ[\"GITHUB_RUN_NUMBER\"]\nif not re.fullmatch(r\"\\d+\\.\\d{1,2}\\.\\d{1,2}\", version) or not re.fullmatch(r\"[1-9]\\d*\", build):\n    raise SystemExit(\"CitizenWallet 本次版本输入无效\")\nPY_VERSION"
  },
  "2": {
    "shell": "bash",
    "source": "# 版本只读受控工具登记，不读取产品依赖合同中的副本。\nprintf 'version=3.47.2\n' >> \"$GITHUB_OUTPUT\""
  },
  "3": {
    "shell": "bash",
    "source": "# 安装后先验真，再统一准备目标平台缓存与受控修订。\nflutter --version --machine >/dev/null\nplatform=\"android\"\nflutter --version >/dev/null"
  },
  "4": {
    "shell": "bash",
    "source": "sdkmanager \"platforms;android-36\" \"build-tools;37.0.1\" \"platform-tools\" \"cmdline-tools;22.0\""
  },
  "5": {
    "shell": "bash",
    "source": "set -euo pipefail\npython3 - <<'VERIFY_REGISTRY'\nfrom pathlib import Path\nfrom urllib.request import Request, build_opener, HTTPRedirectHandler\nimport re\n\nclass NoRedirect(HTTPRedirectHandler):\n    def redirect_request(self, request, fp, code, message, headers, url):\n        raise SystemExit('Android钱包链真源禁止重定向')\n\nsource = Path('lib/signing/chain_constants.dart').read_text()\nrefs = re.findall(r\"static const String registrySourceSha\\s*=\\s*'([a-f0-9]{40})';\", source)\nif len(refs) != 1:\n    raise SystemExit('Android钱包链真源坐标无效')\nsha = refs[0]\nopener = build_opener(NoRedirect())\ndef read(relative):\n    url = f'https://raw.githubusercontent.com/crcfrcn/citizenchain/{sha}/{relative}'\n    with opener.open(Request(url, headers={'Accept': 'text/plain'}), timeout=15) as response:\n        if response.status != 200 or response.geturl() != url:\n            raise SystemExit('Android钱包链真源读取失败')\n        data = response.read(2 * 1024 * 1024 + 1)\n        if len(data) > 2 * 1024 * 1024:\n            raise SystemExit('Android钱包链真源超限')\n        return data.decode('utf-8')\n\nchain = read('runtime/src/lib.rs')\nregistry = Path('lib/signing/pallet_registry.dart').read_text()\nindices = {}\nfor index, name in re.findall(r'#\\[runtime::pallet_index\\((\\d+)\\)\\]\\s*\\n\\s*pub type (\\w+)\\s*=', chain):\n    if int(index) in indices:\n        raise SystemExit('Android链Pallet索引重复')\n    indices[int(index)] = name\nlocal = re.findall(r'static const int (\\w+Pallet)\\s*=\\s*(\\d+);', registry)\nif len(local) < 20 or len({name for name, _ in local}) != len(local):\n    raise SystemExit('Android钱包注册表不完整')\nfor name, index in local:\n    if indices.get(int(index)) != name[:-6][0].upper() + name[:-6][1:]:\n        raise SystemExit('Android钱包Pallet索引漂移')\nfor relative, function, constant in [\n    ('runtime/transaction/multisig/src/lib.rs', 'propose_transfer', 'proposeTransferCall'),\n    ('runtime/votingengine/joint-vote/src/lib.rs', 'cast_admin', 'jointVoteCall'),\n    ('runtime/votingengine/joint-vote/src/lib.rs', 'cast_referendum', 'castReferendumCall'),\n]:\n    text = read(relative)\n    at = text.find('fn ' + function + '(')\n    values = re.findall(r'#\\[pallet::call_index\\((\\d+)\\)\\]', text[max(0, at-300):at]) if at >= 0 else []\n    actual = re.findall(r'static const int ' + constant + r'\\s*=\\s*(\\d+);', registry)\n    if not values or len(actual) != 1 or values[-1] != actual[0]:\n        raise SystemExit('Android钱包业务调用索引漂移')\nprint('Android钱包注册表与固定公开链提交一致')\nVERIFY_REGISTRY"
  },
  "6": {
    "shell": "bash",
    "source": "set -euo pipefail\nproject=\"$(node \"$GITHUB_WORKSPACE/.github/workflows/release-android.mjs\" project)\"\nexport CITIZENWALLET_PROJECT_ROOT=\"$project\"\ncd \"$project\"\nflutter pub get --enforce-lockfile"
  },
  "7": {
    "shell": "bash",
    "source": "cd \"$CITIZENWALLET_PROJECT_ROOT\"\nnode \"$GITHUB_WORKSPACE/.github/workflows/release-android.mjs\" native"
  },
  "8": {
    "shell": "bash",
    "source": "cd \"$CITIZENWALLET_PROJECT_ROOT\"\nflutter build apk --release --target-platform android-arm64\nflutter build appbundle --release --target-platform android-arm64"
  },
  "9": {
    "shell": "bash",
    "source": "cd \"$CITIZENWALLET_PROJECT_ROOT\"\nnode \"$GITHUB_WORKSPACE/.github/workflows/release-android.mjs\" verify-native"
  },
  "10": {
    "shell": "bash",
    "source": "cd \"$CITIZENWALLET_PROJECT_ROOT\"\nset -euo pipefail\numask 077\nwork=\"$RUNNER_TEMP/citizenwallet-android-signing\"\npublish=\"build/release\"\nrm -rf \"$work\" \"$publish\"\nmkdir -p \"$work\" \"$publish\"\ntrap 'rm -rf \"$work\"' EXIT\npython3 - \"$work\" <<'PY'\nimport base64, os, pathlib, re, sys\nroot = pathlib.Path(sys.argv[1])\nfields = {}\nfor raw in os.environ.get(\"APP_KEY\", \"\").splitlines():\n    line = raw.strip()\n    if not line or line.startswith(\"#\"):\n        continue\n    name, sep, value = line.partition(\"=\")\n    if not sep or name.strip() in fields or not value.strip():\n        raise SystemExit(\"APP_KEY 行格式无效\")\n    fields[name.strip()] = value.strip()\nif set(fields) - {\"keystore\", \"password\", \"alias\", \"keyPassword\"}:\n    raise SystemExit(\"APP_KEY 包含未登记字段\")\nalias = fields.get(\"alias\", \"upload\")\nif not re.fullmatch(r\"[A-Za-z0-9._-]{1,128}\", alias):\n    raise SystemExit(\"APP_KEY alias 无效\")\ntry:\n    key = base64.b64decode(fields[\"keystore\"], validate=True)\n    password = fields[\"password\"]\nexcept (KeyError, ValueError) as exc:\n    raise SystemExit(\"APP_KEY 缺少有效签名材料\") from exc\nif not 1024 <= len(key) <= 32 * 1024 * 1024:\n    raise SystemExit(\"APP_KEY keystore 大小无效\")\n(root / \"release.keystore\").write_bytes(key)\n(root / \"password\").write_text(password)\n(root / \"key-password\").write_text(fields.get(\"keyPassword\", password))\n(root / \"alias\").write_text(alias)\nPY\nGMB_ANDROID_STORE_PASSWORD=\"$(cat \"$work/password\")\"\nGMB_ANDROID_KEY_PASSWORD=\"$(cat \"$work/key-password\")\"\nexport GMB_ANDROID_STORE_PASSWORD GMB_ANDROID_KEY_PASSWORD\nalias=\"$(cat \"$work/alias\")\"\napksigner=\"$ANDROID_HOME/build-tools/37.0.1/apksigner\"\ntest -x \"$apksigner\"\n\"$apksigner\" sign --ks \"$work/release.keystore\" \\\n  --ks-pass env:GMB_ANDROID_STORE_PASSWORD --key-pass env:GMB_ANDROID_KEY_PASSWORD \\\n  --v4-signing-enabled false \\\n  --ks-key-alias \"$alias\" --out \"$publish/citizenwallet.apk\" \\\n  build/app/outputs/flutter-apk/app-release.apk\ncp build/app/outputs/bundle/release/app-release.aab \"$publish/citizenwallet.aab\"\njarsigner -keystore \"$work/release.keystore\" \\\n  -storepass:env GMB_ANDROID_STORE_PASSWORD -keypass:env GMB_ANDROID_KEY_PASSWORD \\\n  \"$publish/citizenwallet.aab\" \"$alias\"\n\"$apksigner\" verify --verbose --print-certs \"$publish/citizenwallet.apk\" \\\n  | tee \"$work/apk-verification.txt\"\ngrep -F 'Verified using v2 scheme (APK Signature Scheme v2): true' \"$work/apk-verification.txt\"\n# Android 上传证书按平台规范可以自签名；只验证包完整性，再从三处回读同一证书。\njarsigner -verify \"$publish/citizenwallet.aab\"\napk_certificate_sha256=\"$(sed -n 's/^Signer #1 certificate SHA-256 digest: //p' \"$work/apk-verification.txt\")\"\nkey_certificate_sha256=\"$(keytool -exportcert -alias \"$alias\" \\\n  -keystore \"$work/release.keystore\" -storepass:env GMB_ANDROID_STORE_PASSWORD -rfc \\\n  | openssl x509 -outform DER | sha256sum | awk '{print $1}')\"\naab_certificate_sha256=\"$(keytool -printcert -jarfile \"$publish/citizenwallet.aab\" -rfc \\\n  | openssl x509 -outform DER | sha256sum | awk '{print $1}')\"\n[[ \"$apk_certificate_sha256\" =~ ^[0-9a-f]{64}$ ]]\ntest \"$apk_certificate_sha256\" = \"$key_certificate_sha256\"\ntest \"$apk_certificate_sha256\" = \"$aab_certificate_sha256\"\ntest \"$(apkanalyzer manifest application-id \"$publish/citizenwallet.apk\")\" = com.crcfrcn.citizenwallet\ntest \"$(apkanalyzer manifest version-code \"$publish/citizenwallet.apk\")\" = \"$GITHUB_RUN_NUMBER\""
  },
  "11": {
    "shell": "bash",
    "source": "cd \"$CITIZENWALLET_PROJECT_ROOT\"\nset -euo pipefail\n# 中文边界：platform 是对外身份，固定为 Android；内部 Tag/target/workflow、资产名与字段保持原 wire。\nnode <<'NODE'\n  const { createHash } = require(\"node:crypto\");\n  const fs = require(\"node:fs\");\n  const root = \"build/release\";\n  const digest = (name) => createHash(\"sha256\").update(fs.readFileSync(`${root}/${name}`)).digest(\"hex\");\n  fs.writeFileSync(`${root}/citizenwallet-release-android.json`, `${JSON.stringify({\n    product_id: \"citizenwallet\", version: process.env.SOFTWARE_VERSION,\n    github_run_number: Number(process.env.GITHUB_RUN_NUMBER), head_sha: process.env.SOURCE_SHA,\n    bundle_id: \"ios.citizenwallet\", package_name: \"com.crcfrcn.citizenwallet\",\n    assets: [\n      { platform: \"Android\", asset_name: \"citizenwallet.apk\", asset_sha256: digest(\"citizenwallet.apk\") },\n      { platform: \"Android\", asset_name: \"citizenwallet.aab\", asset_sha256: digest(\"citizenwallet.aab\") },\n    ],\n  }, null, 2)}\\n`);\nNODE\ntest \"$(find build/release -type f | wc -l | tr -d ' ')\" = 3"
  }
});
const shaPattern = /^[0-9a-f]{40}$/u;
const fail = message => { throw new Error(message); };
// GitHub Release 的 Tag 与真实提交只由本平台自动化验真。
async function walletRelease(release,platform,readTag){
 if(platform!==owner.platform)fail('Release平台不属于当前工作流');
 const beginning=owner.product+'-'+platform+'-v',name=release?.tag_name;
 if(typeof name!=='string'||!name.startsWith(beginning))return null;
 const result=/^([0-9]+\.[0-9]+\.[0-9]+)-r([1-9][0-9]*)-a([1-9][0-9]*)$/u.exec(name.slice(beginning.length));
 if(!result)fail('钱包正式安装包版本格式错误');
 const [runId,attempt]=result.slice(2).map(Number);
 if(!Number.isSafeInteger(runId)||!Number.isSafeInteger(attempt))fail('钱包正式安装包运行编号越界');
 const reference=await readTag(name),object=reference?.object;
 if(reference?.ref!=='refs/tags/'+name||object?.type!=='commit'||!/^[a-f0-9]{40}$/u.test(object.sha||''))fail('钱包正式安装包没有准确构建来源');
 return {platform,version:result[1],tag:name,run_id:runId,run_attempt:attempt,source_sha:object.sha};
}

const root = fileURLToPath(new URL('../../', import.meta.url));
const workflowPath = `.github/workflows/release-${owner.platform}.yml`;
const prefix = `${owner.product}-${owner.platform}-v`;

export function context(environment = process.env) {
  const number = name => {
    const value = environment[name];
    if (!/^[1-9][0-9]*$/u.test(value || '') || !Number.isSafeInteger(Number(value))) fail('GitHub运行坐标无效');
    return Number(value);
  };
  if (environment.GITHUB_ACTIONS !== 'true' || environment.GITHUB_REPOSITORY !== owner.repository
    || environment.GITHUB_REF !== 'refs/heads/main' || environment.GITHUB_EVENT_NAME !== 'workflow_dispatch'
    || !shaPattern.test(environment.GITHUB_SHA || '')
    || environment.GITHUB_WORKFLOW_REF !== `${owner.repository}/${workflowPath}@refs/heads/main`) fail('所属GitHub运行身份无效');
  return { repository: owner.repository, product_id: owner.product, platform: owner.platform,
    source_sha: environment.GITHUB_SHA, run_id: number('GITHUB_RUN_ID'),
    run_number: number('GITHUB_RUN_NUMBER'), run_attempt: number('GITHUB_RUN_ATTEMPT'), workflow: workflowPath };
}

export async function request(path, { method = 'GET', body, raw = false, size, fetch: send = globalThis.fetch } = {}) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token || /[\s\u0000-\u001f\u007f]/u.test(token)) fail('缺少GitHub任务令牌');
  const url = path.startsWith('https://') ? new URL(path) : new URL(`https://api.github.com/repos/${owner.repository}/${path}`);
  if (!['api.github.com', 'uploads.github.com'].includes(url.hostname) || url.protocol !== 'https:' || url.username || url.password || !url.pathname.startsWith(`/repos/${owner.repository}/`)) fail('GitHub接口地址无效');
  const headers = { Authorization: `Bearer ${token}`, Accept: raw ? 'application/octet-stream' : 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2026-03-10', 'User-Agent': owner.product };
  if (body !== undefined) headers['Content-Type'] = body?.pipe ? 'application/octet-stream' : 'application/json';
  if(body?.pipe){if(!Number.isSafeInteger(size)||size<=0)fail('资产上传长度无效');headers['Content-Length']=String(size);}
  let response = await send(url, { method, headers, redirect: raw ? 'manual' : 'error', signal: AbortSignal.timeout(300_000),
    ...(body === undefined ? {} : { body: body?.pipe ? body : JSON.stringify(body), ...(body?.pipe ? { duplex: 'half' } : {}) }) });
  if(raw&&response.status===302){
    const location=new URL(response.headers.get('location'));
    if(location.protocol!=='https:'||location.username||location.password)fail('正式资产回读地址无效');
    response=await send(location,{method:'GET',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(300_000)});
  }
  if (response.status === 404) return null;
  if (!response.ok) fail(`GitHub接口失败：${response.status}，操作未确认`);
  if (raw) return response;
  return response.status === 204 ? {} : response.json();
}

export async function pages(path, field = null, api = request) {
  const rows = [];
  for (let page = 1; ; page++) {
    const data = await api(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    const values = field ? data?.[field] : data;
    if (!Array.isArray(values)) fail('GitHub分页数据无效');
    rows.push(...values);
    if (values.length < 100) return rows;
  }
}

function seedVersion() {
  const source = owner.version_source;
  if (source.kind === 'sequence') return '0.0.0';
  const text = readFileSync(join(root, source.path), 'utf8');
  if (source.kind === 'json') return String(JSON.parse(text).version);
  if (source.kind === 'spec') {
    const matches = [...text.matchAll(/^\s*spec_version:\s*(\d+)\s*,\s*$/gm)];
    if (matches.length !== 1) fail('Runtime版本真源不唯一');
    return matches[0][1];
  }
  if (source.kind === 'cargo') {
    const value = /^\[package\][\s\S]*?^version\s*=\s*"(\d+\.\d+\.\d+)"/mu.exec(text)?.[1];
    if (!value) fail('本仓Cargo版本真源无效');
    return value;
  }
  const value = /^version:\s*(\d+\.\d+\.\d+)(?:\+\d+)?\s*$/mu.exec(text)?.[1];
  if (!value) fail('本仓软件版本真源无效');
  return value;
}

export function nextVersion(seed, versions, protocol = false, runNumber = 1) {
  if (protocol) {
    if (!/^\d+$/u.test(seed) || versions.some(value => !/^\d+$/u.test(value))) fail('协议版本无效');
    const value = Math.max(Number(seed), ...versions.map(Number)) + (versions.length ? 1 : 0);
    if (!Number.isSafeInteger(value) || value < 1 || value > 0xffffffff) fail('协议版本越界');
    return String(value);
  }
  const parse = value => {
    const match = /^(0|[1-9]\d*)\.(0|[1-9]\d?)\.(0|[1-9]\d?)$/u.exec(value);
    if (!match) fail('软件版本无效');
    const parts=match.slice(1).map(Number);if(parts.some(value=>!Number.isSafeInteger(value)))fail('软件版本越界');return parts;
  };
  const values = [seed, ...versions].map(parse).sort((a,b) => a[0]-b[0] || a[1]-b[1] || a[2]-b[2]);
  let [major, minor, patch] = values.at(-1);
  if (versions.length) { if (++patch > 99) { patch = 0; if (++minor > 99) { minor = 0; major++; } } }
  if(!Number.isSafeInteger(runNumber)||runNumber<1)fail('版本运行序号无效');
  const initial=parse(seed),floor=BigInt(initial[0])*10000n+BigInt(initial[1])*100n+BigInt(initial[2])+BigInt(runNumber-1);
  const historical=BigInt(major)*10000n+BigInt(minor)*100n+BigInt(patch);
  if(floor>historical){major=Number(floor/10000n);minor=Number(floor/100n%100n);patch=Number(floor%100n);}
  if(![major,minor,patch].every(Number.isSafeInteger))fail('软件版本越界');
  return `${major}.${minor}.${patch}`;
}

function output(name, value, file = process.env.GITHUB_OUTPUT) {
  if (!file || /[\r\n]/u.test(String(value))) fail('GitHub步骤输出无效');
  appendFileSync(file, `${name}=${value}\n`);
}

export async function prepare(api=request,emit=output,environment=process.env) {
  const identity = context(environment);
  const releases = await pages('releases',null,api);
  const versions = [];
  for (const release of releases) {
    if (release.draft || release.prerelease || !String(release.tag_name).startsWith(prefix)) continue;
    const notes = (await walletRelease(release,owner.platform,tag=>api('git/ref/tags/'+encodeURIComponent(tag))));
    if (!notes || notes.platform !== owner.platform) continue;
    const run = await api(`actions/runs/${notes.run_id}`);
    if (run?.id===notes.run_id&&run.run_attempt===notes.run_attempt&&run.status==='completed'
      &&run.conclusion==='success'&&run.path===workflowPath&&run.event==='workflow_dispatch'
      &&run.head_branch==='main'&&run.head_sha===notes.source_sha
      &&(!run.repository||run.repository.full_name===owner.repository)) versions.push(notes.version);
  }
  const version = nextVersion(seedVersion(), versions, owner.version_source.kind === 'spec', identity.run_number);
  const tag = `${prefix}${version}-r${identity.run_id}-a${identity.run_attempt}`;
  for (const [name,value] of Object.entries({version, tag, source_sha:identity.source_sha,
    run_id:identity.run_id, run_attempt:identity.run_attempt, run_number:identity.run_number})) emit(name,value);
}

function runVersion(environment=process.env) {
  const identity = context(environment);
  const version = environment.RELEASE_VERSION;
  const tag = environment.RELEASE_TAG;
  nextVersion(version, [], owner.version_source.kind === 'spec');
  if (tag !== `${prefix}${version}-r${identity.run_id}-a${identity.run_attempt}`) fail('本次版本与Tag不一致');
  return {...identity, version, tag};
}

export function job(environment=process.env,{head=()=>execFileSync('git', ['rev-parse','HEAD'], {cwd:root,encoding:'utf8'}).trim()}={}) {
  const identity = runVersion(environment),temp=environment.RUNNER_TEMP;
  if(!temp||!isAbsolute(temp)||resolve(temp)!==temp||realpathSync(temp)!==temp||environment.GITHUB_JOB!=='flow')fail('本目标Runner任务根无效');
  if(head() !== identity.source_sha) fail('检出源码不符');
  const work = join(temp, owner.product, owner.platform, String(identity.run_id), String(identity.run_attempt), environment.GITHUB_JOB);
  mkdirSync(work,{recursive:true});
  const variables = {RELEASE_WORK:work, RELEASE_ASSETS_DIR:join(work,'assets'), SOURCE_SHA:identity.source_sha,
    SOFTWARE_VERSION:identity.version, VERSION_TAG:identity.tag, BUILD_NUMBER:String(identity.run_number),
    CITIZENWALLET_NATIVE_ANDROID_DIR:join(work,'native/android'),
    CARGO_HOME:join(work,'cargo-home'), CARGO_TARGET_DIR:join(work,'cargo'), PUB_CACHE:join(work,'pub'),
    GRADLE_USER_HOME:join(work,'gradle'), npm_config_cache:join(work,'npm'), XDG_CACHE_HOME:join(work,'cache'),
    TMPDIR:join(work,'tmp'), TMP:join(work,'tmp'), TEMP:join(work,'tmp')};
  for (const path of ['cargo-home','cargo','pub','gradle','npm','cache','tmp','assets']) mkdirSync(join(work,path),{recursive:true});
  for (const [name,value] of Object.entries(variables)) { environment[name]=value; output(name,value,environment.GITHUB_ENV); }
  return work;
}

export function step(key) {
  runVersion();
  const value = commands[key];
  if (!value || !['bash','pwsh'].includes(value.shell)) fail('本目标构建步骤无效');
  const directory = join(process.env.RELEASE_WORK,'commands');mkdirSync(directory,{recursive:true});
  const file = join(directory, value.shell === 'pwsh' ? 'step.ps1' : 'step.sh');
  writeFileSync(file, value.shell === 'bash' ? 'set -euo pipefail\n'+value.source : "$ErrorActionPreference = 'Stop'\n"+value.source,{mode:0o700});
  const result = spawnSync(value.shell === 'pwsh' ? 'pwsh' : 'bash', value.shell === 'pwsh' ? ['-NoProfile','-File',file] : [file],
    {cwd:process.cwd(),env:process.env,stdio:'inherit'});
  rmSync(file,{force:true});
  if (result.error || result.status !== 0) fail(`本仓构建步骤失败：${key}`);
}

// Android 工程从本目标检出建立；Wrapper 来自同轮 Flutter 原件。
export function prepareProject(environment=process.env,{sourceRoot=root}={}){
 if(sourceRoot!==root&&(!process.env.NODE_TEST_CONTEXT||!realpathSync(sourceRoot).startsWith(join(root,'target/test')+'/')))fail('Android 测试源码边界无效');
 const identity=context(environment),source=realpathSync(sourceRoot),temp=environment.RUNNER_TEMP,flutter=environment.FLUTTER_ROOT;
 if(!temp||!isAbsolute(temp)||resolve(temp)!==temp||realpathSync(temp)!==temp
  ||resolve(environment.GITHUB_WORKSPACE||'')!==source||!flutter||!isAbsolute(flutter)||realpathSync(flutter)!==flutter)fail('Android 自动化工作根或 Flutter 输入无效');
 const work=join(temp,`citizenwallet-android-view-${identity.run_id}-${identity.run_attempt}`),view=join(work,'source-view');
 if(existsSync(work))fail('Android 自动化工作根已有内容');mkdirSync(work,{mode:0o700});
 const omitted=new Set(['.git','target','node_modules','build','dist','.dart_tool','.gradle','.symlinks','Pods','ephemeral','.DS_Store','swiftpm',
  'local.properties','Generated.xcconfig','flutter_export_environment.sh','.flutter-plugins-dependencies',
  'GeneratedPluginRegistrant.java','GeneratedPluginRegistrant.h','GeneratedPluginRegistrant.m','GeneratedPluginRegistrant.swift']);
 cpSync(source,view,{recursive:true,dereference:true,filter:path=>{
  if(path!==source&&omitted.has(basename(path)))return false;
  const info=lstatSync(path);if(info.isSymbolicLink()){
   const target=realpathSync(path);
   if(!target.startsWith(source+'/')||!lstatSync(target).isFile())fail('Android 源码链接越界或指向特殊文件');
  }else if(!info.isFile()&&!info.isDirectory())fail('Android 源码存在特殊文件');
  return true;
 }});
 // 运行版本只写本次 Runner 工程；原始检出仍是准确提交的只读输入。
 const version=environment.SOFTWARE_VERSION,versionFile=join(view,'pubspec.yaml');
 if(!/^\d+\.\d{1,2}\.\d{1,2}$/u.test(version||''))fail('Android 自动化版本无效');
 const originalVersion=readFileSync(versionFile,'utf8'),matches=[...originalVersion.matchAll(/^version:[ \t]*\d+\.\d+\.\d+\+\d+[ \t]*$/gmu)];
 if(matches.length!==1)fail('Android 原始版本不唯一');
 writeFileSync(versionFile,originalVersion.replace(matches[0][0],`version: ${version}+${identity.run_number}`));
 const pairs=[['android/gradle-wrapper.properties','android/gradle/wrapper/gradle-wrapper.properties']];
 for(const [origin,destination] of pairs){
  const input=join(view,origin),output=join(view,destination);regular(input);
  if(existsSync(output))fail('Android 工程目标重复');mkdirSync(dirname(output),{recursive:true});copyFileSync(input,output);
 }
 const wrapper=join(flutter,'bin/cache/artifacts/gradle_wrapper');
 for(const name of ['gradlew','gradlew.bat','gradle/wrapper/gradle-wrapper.jar']){
  const input=join(wrapper,name),output=join(view,'android',name);regular(input);
  if(existsSync(output))fail('Android Wrapper 目标重复');mkdirSync(dirname(output),{recursive:true});copyFileSync(input,output);
  if(name==='gradlew')chmodSync(output,0o755);
 }
 generatePlatformIcons(view,'android',work,environment);
 if(!environment.GITHUB_ENV||!isAbsolute(environment.GITHUB_ENV))fail('GitHub 环境回执路径无效');
 appendFileSync(environment.GITHUB_ENV,`CITIZENWALLET_PROJECT_ROOT=${view}\nCITIZENWALLET_WORK_DIR=${work}\n`);
 return view;
}

function runOwned(command,args,{cwd=root,env=process.env,buffer=false}={}){
 const result=spawnSync(command,args,{cwd,env,encoding:buffer?null:'utf8',maxBuffer:64*1024*1024});
 if(result.error||result.signal||result.status!==0)fail('Android 自动化原生工具失败：'+String(result.stderr||result.error?.message||command).slice(0,2000));
 return result.stdout;
}
function verifySymbols(path){
 const ndk=process.env.ANDROID_NDK_HOME||join(process.env.ANDROID_HOME||'','ndk/28.2.13676358');
 const nm=join(ndk,'toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-nm');regular(nm);
 const names=String(runOwned(nm,['-D',path])).split(/\r?\n/u).map(line=>line.trim().split(/\s+/u).at(-1));
 if(names.filter(name=>name?.startsWith('citizen_sr25519_')).length!==4
  ||names.some(name=>name?.startsWith('account_crypto_')))fail('Android 原生签名导出不完整或包含禁用符号');
}
export function buildNative(){
 context();const target='aarch64-linux-android',temp=process.env.RUNNER_TEMP;
 if(!temp||!isAbsolute(temp)||realpathSync(temp)!==temp)fail('Android 原生任务根无效');
 const libdir=String(runOwned('rustc',['--print','target-libdir','--target',target])).trim();
 if(!isAbsolute(libdir)||!readdirSync(libdir).some(name=>/^libcore-.*\.rlib$/u.test(name))
  ||!readdirSync(libdir).some(name=>/^libstd-.*\.rlib$/u.test(name)))fail('Android Rust 目标库未安装');
 const ndk=process.env.ANDROID_NDK_HOME||join(process.env.ANDROID_HOME||'','ndk/28.2.13676358');
 const toolchain=join(ndk,'toolchains/llvm/prebuilt/linux-x86_64/bin'),clang=join(toolchain,'aarch64-linux-android24-clang'),ar=join(toolchain,'llvm-ar');
 for(const path of [clang,ar])regular(path);
 const cargo=process.env.CARGO_TARGET_DIR,destination=process.env.CITIZENWALLET_NATIVE_ANDROID_DIR;
 if(!cargo?.startsWith(temp+'/')||!destination?.startsWith(temp+'/'))fail('Android 原生输出越出当前任务');
 runOwned('cargo',['build','--release','--target',target],{cwd:join(root,'rust'),env:{...process.env,
  CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER:clang,CC_aarch64_linux_android:clang,AR_aarch64_linux_android:ar}});
 const original=join(cargo,target,'release/libcitizenwallet_signer.so'),output=join(destination,'arm64-v8a/libcitizenwallet_signer.so');
 regular(original);mkdirSync(dirname(output),{recursive:true});copyFileSync(original,output);verifySymbols(output);
}
export function verifyNativePackage(){
 context();const project=process.env.CITIZENWALLET_PROJECT_ROOT,temp=process.env.RUNNER_TEMP;
 if(!project||!isAbsolute(project)||!temp||!isAbsolute(temp))fail('Android 工程未交付');
 for(const [relative,entry] of [['build/app/outputs/flutter-apk/app-release.apk','lib/arm64-v8a/libcitizenwallet_signer.so'],
  ['build/app/outputs/bundle/release/app-release.aab','base/lib/arm64-v8a/libcitizenwallet_signer.so']]){
  const packageFile=join(project,relative);regular(packageFile);
  const members=String(runOwned('unzip',['-Z1',packageFile]));
  if(!members.split(/\r?\n/u).includes(entry)||/(?:^|\/)lib\/(?:armeabi-v7a|x86|x86_64)\/libcitizenwallet_signer\.so$/mu.test(members))fail('Android 包原生库架构集合无效');
  const work=mkdtempSync(join(temp,'citizenwallet-native-check-'));
  try{
   const output=join(work,'libcitizenwallet_signer.so'),bytes=runOwned('unzip',['-p',packageFile,entry],{buffer:true});
   if(!bytes.length)fail('Android 包内原生库为空');writeFileSync(output,bytes);
   if(!/ARM aarch64|ARM64/u.test(String(runOwned('file',[output]))))fail('Android 包内原生库不是 arm64');
   verifySymbols(output);
  }finally{rmSync(work,{recursive:true,force:true});}
 }
}

function regular(path) {
  const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.size<=0)fail('正式产物不是非空普通文件');return stat;
}
async function digestFile(path) { const hash=createHash('sha256');for await(const bytes of createReadStream(path))hash.update(bytes);return hash.digest('hex'); }
function assetName(name) { if(!name||name!==basename(name)||/[\u0000-\u001f\u007f]/u.test(name))fail('正式资产文件名无效');return name; }

async function collect(paths,environment=process.env) {
  const identity=runVersion(environment),destination=environment.RELEASE_ASSETS_DIR;
  if(!destination||destination!==join(environment.RELEASE_WORK||'','assets')
    ||paths.map(path=>basename(path)).sort().join('\0')!==[...owner.required_assets].sort().join('\0'))fail('本目标正式资产闭集无效');
  if(!existsSync(destination)||!lstatSync(destination).isDirectory()||readdirSync(destination).length)fail('正式资产交付目录未独占');
  const files=[];
  for(const path of paths){const file=resolve(path),stat=regular(file),name=assetName(basename(file));
    if(stat.nlink!==1||realpathSync(file)!==file||files.some(row=>row.name===name))fail('正式资产不是独占普通文件');
    const target=join(destination,name);if(file!==target)copyFileSync(file,target);
    files.push({name,size:stat.size,sha256:await digestFile(target)});
  }
  const metadata={schema:1,...identity,assets:files};
  writeFileSync(join(destination,'automation.json'),JSON.stringify(metadata,null,2)+'\n');
  output('assets',destination,environment.GITHUB_OUTPUT);return metadata;
}

export async function collectProduced(environment=process.env) {
  const work=environment.CITIZENWALLET_WORK_DIR,project=environment.CITIZENWALLET_PROJECT_ROOT,temp=environment.RUNNER_TEMP;
  if(!work||!project||!temp||!isAbsolute(work)||!isAbsolute(temp)||work!==resolve(work)
    ||!work.startsWith(temp+'/')||project!==join(work,'source-view')
    ||realpathSync(work)!==work||realpathSync(project)!==project)fail('本目标资产工程越界');
  const directory=join(project,'build/release');
  if(!lstatSync(directory).isDirectory()||realpathSync(directory)!==directory
    ||readdirSync(directory).sort().join('\0')!==[...owner.required_assets].sort().join('\0'))fail('本目标正式资产集合不准确');
  return collect(owner.required_assets.map(name=>join(directory,name)),environment);
}



export async function publish(directory,environment=process.env) {
  const identity=runVersion(environment);const metadata=JSON.parse(readFileSync(join(directory,'automation.json'),'utf8'));
  if(Object.entries(identity).some(([key,value])=>metadata[key]!==value)||!Array.isArray(metadata.assets)
    ||metadata.assets.map(file=>file?.name).sort().join('\0')!==[...owner.required_assets].sort().join('\0'))fail('完整产物身份或资产闭集无效');
  const files=metadata.assets;
  if(readdirSync(directory).sort().join('\0')!==[...files.map(value=>value.name),'automation.json'].sort().join('\0'))fail('产物目录与完整资产集合不符');
  for(const file of files){const path=join(directory,assetName(file.name));if(regular(path).size!==file.size||await digestFile(path)!==file.sha256)fail('正式产物在交付前改变');}
  if(await request(`git/ref/tags/${encodeURIComponent(identity.tag)}`)!==null)fail('本次Tag已经存在');
  await request('git/refs',{method:'POST',body:{ref:`refs/tags/${identity.tag}`,sha:identity.source_sha}});
  const release=await request('releases',{method:'POST',body:{tag_name:identity.tag,target_commitish:identity.source_sha,
    name:`${owner.product} · ${owner.platform} · ${identity.version}`,draft:false,prerelease:false,make_latest:'false',
    body:`${owner.product} · ${owner.platform} · ${identity.version}\nSource: ${identity.source_sha}\nRun: ${identity.run_id} / ${identity.run_attempt}`}});
  if(!Number.isSafeInteger(release?.id)||!release.upload_url)fail('正式Release创建未确认');
  for(const file of files){const url=new URL(release.upload_url.replace(/\{.*$/u,''));url.searchParams.set('name',file.name);
    const asset=await request(url.href,{method:'POST',body:createReadStream(join(directory,file.name)),size:file.size});
    if(asset?.name!==file.name||asset.size!==file.size||asset.state!=='uploaded')fail('正式资产上传未确认');
    const response=await request(asset.url,{raw:true});if(!response?.body)fail('正式资产回读失败');
    const hash=createHash('sha256');let size=0;for await(const bytes of response.body){hash.update(bytes);size+=bytes.length;if(size>file.size)fail('正式资产回读超过声明大小');}
    if(size!==file.size||hash.digest('hex')!==file.sha256)fail('GitHub资产逐件回读不一致');
  }
  const readback=await request(`releases/${release.id}`);if((await walletRelease(readback,owner.platform,tag=>request('git/ref/tags/'+encodeURIComponent(tag))))?.run_id!==identity.run_id||readback.draft||readback.prerelease
    ||readback.assets?.length!==files.length)fail('完整正式Release回查失败');
  for(const file of files){const asset=readback.assets.find(value=>value.name===file.name);if(!asset||asset.state!=='uploaded'||asset.size!==file.size||asset.digest!==`sha256:${file.sha256}`)fail('完整正式资产证明回查失败');}
  output('verified','true');output('release_id',release.id);output('tag',identity.tag);
}

function ownedRun(run) {
  // 每个目标只处理自身现行Workflow；文件缺失不能证明历史任务归属。
  return Number.isSafeInteger(run?.id)&&run.id>0&&run.path===workflowPath
    &&run.head_branch==='main'&&run.event==='workflow_dispatch'
    &&(!run.repository||run.repository.full_name===owner.repository);
}

export function cleanupPlan(runs,current,result) {
  if(!['success','failed'].includes(result)||!ownedRun(current)||!Number.isFinite(Date.parse(current.created_at)))fail('清理所属任务身份无效');
  const earlier=run=>Date.parse(run.created_at)<Date.parse(current.created_at)
    ||Date.parse(run.created_at)===Date.parse(current.created_at)&&run.id<current.id;
  return runs.filter(run=>ownedRun(run)&&run.id!==current.id&&run.status==='completed'&&earlier(run)
    &&(run.conclusion==='success'?'success':'failed')===result).sort((a,b)=>a.id-b.id);
}

async function remove(path,api) { await api(path,{method:'DELETE'});const readPath=path.replace(/^git\/refs\//u,'git/ref/');if(await api(readPath)!==null)fail('删除回查仍存在，清理失败'); }
async function removeRunRelease(run,releases,api) {
  for(const release of releases){
    const metadata=(await walletRelease(release,owner.platform,tag=>api('git/ref/tags/'+encodeURIComponent(tag))));
    if(!metadata||metadata.run_id!==run.id)continue;
    if(metadata.source_sha!==run.head_sha)fail('正式Release与所属Run不一致');
    const tag=metadata.tag;
    const again=await api(`actions/runs/${run.id}`);
    if(again&&again.id!==Number(process.env.GITHUB_RUN_ID)
      &&(again.status!=='completed'||again.run_attempt!==run.run_attempt||again.conclusion!==run.conclusion))fail('所属任务已变化，停止清理');
    await remove(`releases/${release.id}`,api);
    const beforeTag=await api(`actions/runs/${run.id}`);
    if(beforeTag&&beforeTag.id!==Number(process.env.GITHUB_RUN_ID)
      &&(beforeTag.status!=='completed'||beforeTag.run_attempt!==run.run_attempt||beforeTag.conclusion!==run.conclusion))fail('所属任务已变化，停止清理');
    await remove(`git/refs/tags/${encodeURIComponent(tag)}`,api);
  }
}
export async function cleanup(result,identity=context(),api=request) {
  const current=await api(`actions/runs/${identity.run_id}`);
  const plan=cleanupPlan(await pages('actions/runs','workflow_runs',api),current,result);
  const releases=await pages('releases',null,api),removed=[];
  for(const row of plan){const run=await api(`actions/runs/${row.id}`);if(!run){removed.push(row.id);continue;}
    if(run.run_attempt!==row.run_attempt||cleanupPlan([run],current,result).length!==1)continue;
    await removeRunRelease(run,releases,api);
    // 失败若只形成Tag也按它的准确Run坐标处理，不能留下同类孤立产物。
    const tags=await api(`git/matching-refs/tags/${prefix}`);
    if(!Array.isArray(tags))fail('所属Tag集合无效');
    for(const reference of tags){
      const tag=String(reference.ref||'').slice('refs/tags/'.length);
      if(!String(reference.ref||'').startsWith('refs/tags/'+prefix)
        ||!new RegExp(`-r${run.id}-a[1-9][0-9]*$`,'u').test(tag)||Number(tag.slice(tag.lastIndexOf('-a')+2))>run.run_attempt)continue;
      if(reference.object?.type!=='commit'||reference.object.sha!==run.head_sha)fail('所属Tag来源已改变，停止清理');
      const again=await api(`actions/runs/${run.id}`);
      if(!again||cleanupPlan([again],current,result).length!==1)fail('所属任务已改变，停止清理');
      await remove(`git/refs/tags/${encodeURIComponent(tag)}`,api);
    }
    for(const asset of await pages(`actions/runs/${run.id}/artifacts`,'artifacts',api)){
      if(!Number.isSafeInteger(asset.id)||asset.id<=0)fail('所属Artifact坐标无效');
      const again=await api(`actions/runs/${run.id}`);if(!again||again.status!=='completed'||again.run_attempt!==run.run_attempt||again.conclusion!==run.conclusion)fail('历史任务已变化，停止清理');
      await remove(`actions/artifacts/${asset.id}`,api);
    }
    const final=await api(`actions/runs/${run.id}`);
    if(final&&(final.run_attempt!==run.run_attempt||cleanupPlan([final],current,result).length!==1))fail('历史任务状态改变，停止清理');
    if(final)await remove(`actions/runs/${run.id}`,api);removed.push(run.id);
  }
  return removed;
}

export function precedingResult(needs) {
  if(!needs||typeof needs!=='object'||Array.isArray(needs)||!Object.keys(needs).length)fail('前置任务结果缺失');
  return Object.values(needs).every(value=>value?.result==='success')?'success':'failed';
}
async function discardCurrent(identity,api) {
  for(const release of await pages('releases',null,api)){
    const metadata=(await walletRelease(release,owner.platform,tag=>api('git/ref/tags/'+encodeURIComponent(tag))));
    if(metadata?.run_id===identity.run_id&&metadata.run_attempt===identity.run_attempt)
      await removeRunRelease({id:identity.run_id,head_sha:identity.source_sha},[release],api);
  }
  const tag=process.env.RELEASE_TAG;
  if(tag&&tag.startsWith(prefix)&&tag.endsWith(`-r${identity.run_id}-a${identity.run_attempt}`)){
    const path=`git/refs/tags/${encodeURIComponent(tag)}`;
    if(await api(path.replace(/^git\/refs\//u,'git/ref/'))!==null)await remove(path,api);
  }
}
export async function finish(needs=JSON.parse(process.env.RELEASE_NEEDS||'null'),api=request,identity=context()) {
  const result=precedingResult(needs),errors=[];
  const attempt=async action=>{try{return await action();}catch(error){errors.push(error);return null;}};
  let removed;
  if(result==='success') {
    removed=await attempt(()=>cleanup('success',identity,api));
    if(errors.length) {
      await attempt(()=>discardCurrent(identity,api));
      await attempt(()=>cleanup('failed',identity,api));
    }
  } else {
    // 本次撤销失败也必须尝试清理同目标旧失败；各项真实错误均保留。
    await attempt(()=>discardCurrent(identity,api));
    removed=await attempt(()=>cleanup('failed',identity,api));
  }
  if(errors.length)throw new AggregateError(errors,'本目标最后处理失败：'+errors.map(error=>error.message).join('；'));
  if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,`本目标${result==='success'?'成功':'失败'}；已清理同类旧Run：${removed.join('、')||'无'}。\n`);
  if(result==='failed')fail('前置任务未全部成功');
}

const direct=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
const testing=direct&&Boolean(process.env.NODE_TEST_CONTEXT)&&process.argv.length===2;
if(direct&&!testing){
  try{const [command,...args]=process.argv.slice(2);
    if(command==='prepare')await prepare();else if(command==='job')job();else if(command==='step')step(args[0]);
    else if(command==='project'&&args.length===0)process.stdout.write(prepareProject()+'\n');
    else if(command==='native'&&args.length===0)buildNative();
    else if(command==='verify-native'&&args.length===0)verifyNativePackage();
    else if(command==='collect-produced')await collectProduced();else if(command==='publish')await publish(args[0]);else if(command==='finish')await finish();
    else fail('自动化命令无效');
  }catch(error){console.error(error.message);process.exitCode=1;}
}

if(testing){
  const {default:assert}=await import('node:assert/strict');const {default:test}=await import('node:test');

  test('旧入口不能成为任一现行平台的清理归属证明',()=>{
    const current={id:9,path:workflowPath,head_branch:'main',event:'workflow_dispatch',created_at:'2026-01-02T00:00:00Z'};
    const old={...current,id:1,status:'completed',conclusion:'success',created_at:'2026-01-01T00:00:00Z'};
    for(const path of ['.github/workflows/release.yml',`.github/workflows/${owner.product}-${owner.platform}-ci.yml`,'.github/workflows/deleted.yml'])
      assert.deepEqual(cleanupPlan([{...old,path}],current,'success'),[]);
  });
  test('撤销当前产物失败仍处理旧失败且最终失败',async()=>{
    const current={id:9,path:workflowPath,head_branch:'main',event:'workflow_dispatch',created_at:'2026-01-02T00:00:00Z'};
    let releases=0,history=0;
    const api=async path=>{
      if(path.startsWith('releases?')){if(++releases===1)throw Error('撤销中断');return [];}
      if(path==='actions/runs/9')return current;
      if(path.startsWith('actions/runs?')){history++;return {workflow_runs:[]};}
      throw Error('未声明请求');
    };
    await assert.rejects(finish({build:{result:'failure'}},api,{run_id:9}),/撤销中断/);
    assert.equal(history,1);assert.equal(releases,2);
  });
  test('清理旧失败Run同时回收其多个Attempt的准确孤立Tag',async()=>{
    const old={id:2,run_attempt:2,path:workflowPath,head_branch:'main',event:'workflow_dispatch',head_sha:'a'.repeat(40),status:'completed',conclusion:'failure',created_at:'2026-01-01T00:00:00Z'},current={...old,id:9,status:'in_progress',created_at:'2026-01-02T00:00:00Z'};
    const deleted=new Set(),tags=[1,2].map(attempt=>({ref:`refs/tags/${prefix}1.0.0-r2-a${attempt}`,object:{type:'commit',sha:old.head_sha}}));
    const api=async(path,options={})=>{
      if(options.method==='DELETE'){deleted.add(path);return {};}
      if(deleted.has(path)||deleted.has(path.replace('git/ref/','git/refs/')))return null;
      if(path.startsWith('actions/runs?'))return {workflow_runs:[old,current]};
      if(path.startsWith('releases?')||path.includes('/artifacts?'))return path.includes('/artifacts?')?{artifacts:[]}:[];
      if(path.startsWith('git/matching-refs/'))return tags;
      if(path==='actions/runs/2')return old;if(path==='actions/runs/9')return current;
      throw Error('未声明的请求');
    };
    assert.deepEqual(await cleanup('failed',{run_id:9},api),[2]);assert.equal([...deleted].filter(path=>path.startsWith('git/refs/')).length,2);
  });
  test('全部前置成功才成功，其余结论一律失败',()=>{
    assert.equal(precedingResult({build:{result:'success'},publish:{result:'success'}}),'success');
    for(const result of ['failure','cancelled','skipped','timed_out',undefined])assert.equal(precedingResult({build:{result}}),'failed');
    assert.throws(()=>precedingResult({}));
  });
  test('当前Run尚在运行也能清理同目标旧结果，保护其它目标和活动任务',()=>{
    const row=(id,conclusion='success',status='completed',path=workflowPath)=>({id,conclusion,status,path,head_branch:'main',event:'workflow_dispatch',created_at:new Date(1700000000000+id*1000).toISOString()});
    const current=row(6,null,'in_progress');const rows=[row(1),row(2,'failure'),row(3,'success','in_progress'),row(4,'success','completed','.github/workflows/release-other.yml'),current,row(7)];
    assert.deepEqual(cleanupPlan(rows,current,'success').map(row=>row.id),[1]);
    assert.deepEqual(cleanupPlan(rows,current,'failed').map(row=>row.id),[2]);
  });
  test('软件版本进位与协议版本边界',()=>{
    assert.equal(nextVersion('1.0.0',['1.99.99']),'2.0.0');assert.equal(nextVersion('9',['9'],true),'10');
    assert.throws(()=>nextVersion(String(0xffffffff),[String(0xffffffff)],true));
  });
  test('历史完整分页不截断超过1000条记录',async()=>{
    const rows=Array.from({length:1005},(_,id)=>({id}));const api=async path=>rows.slice((Number(/page=(\d+)$/u.exec(path)[1])-1)*100,Number(/page=(\d+)$/u.exec(path)[1])*100);
    assert.equal((await pages('releases',null,api)).length,1005);
  });
  test('失败清理只删除所属旧失败产物及Run，成功和活动任务独立保留',async()=>{
    const row=(id,conclusion,status='completed')=>({id,run_attempt:1,conclusion,status,path:workflowPath,head_branch:'main',event:'workflow_dispatch',repository:{full_name:owner.repository},head_sha:'a'.repeat(40),created_at:new Date(1700000000000+id*1000).toISOString()});
    const current=row(10,null,'in_progress'),rows=[row(1,'success'),row(2,'failure'),row(3,null,'in_progress'),current];
    const gone=new Set(),removed=[];
    const api=async(path,options={})=>{
      if(options.method==='DELETE'){removed.push(path);gone.add(path);return {};}
      if(gone.has(path))return null;
      if(path.startsWith('actions/runs?'))return {workflow_runs:rows};
      if(path.startsWith('releases?')||path.startsWith('git/matching-refs/'))return [];
      if(path.startsWith('actions/runs/2/artifacts?'))return {artifacts:[{id:20}]};
      if(path==='actions/artifacts/20')return {id:20};
      const match=/^actions\/runs\/(\d+)$/u.exec(path);if(match)return rows.find(row=>row.id===Number(match[1]))??null;
      throw Error('未声明的模拟接口：'+path);
    };
    assert.deepEqual(await cleanup('failed',{run_id:10},api),[2]);
    assert.deepEqual(removed,['actions/artifacts/20','actions/runs/2']);
  });

  test('GitHub运行序号保证成功历史清理后版本不会回到初始值',()=>{
    assert.equal(nextVersion('1.0.0',[],false,4),'1.0.3');
    assert.equal(nextVersion('1.99.99',[],false,2),'2.0.0');
    assert.equal(nextVersion('1.0.0',['3.0.0'],false,4),'3.0.1');
    assert.throws(()=>nextVersion('1.0.0',[],false,0));
  });

  test('历史成功Release决定后续版本，错误Run来源不得参与',async()=>{
    const sha='a'.repeat(40),tag=`${prefix}3.0.0-r2-a1`,release={tag_name:tag,draft:false,prerelease:false};
    const environment={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:owner.repository,GITHUB_REF:'refs/heads/main',
      GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_SHA:'b'.repeat(40),GITHUB_WORKFLOW_REF:`${owner.repository}/${workflowPath}@refs/heads/main`,
      GITHUB_RUN_ID:'9',GITHUB_RUN_NUMBER:'4',GITHUB_RUN_ATTEMPT:'1'};
    const run={id:2,run_attempt:1,status:'completed',conclusion:'success',path:workflowPath,
      event:'workflow_dispatch',head_branch:'main',head_sha:sha,repository:{full_name:owner.repository}};
    let historical=run;const api=async path=>path.startsWith('releases?')?[release]:path.startsWith('git/ref/tags/')
      ?{ref:'refs/tags/'+tag,object:{type:'commit',sha}}:historical;
    const outputValues={};await prepare(api,(name,value)=>{outputValues[name]=value;},environment);
    assert.equal(outputValues.version,'3.0.1');
    historical={...run,head_sha:'c'.repeat(40)};
    const rejected={};await prepare(api,(name,value)=>{rejected[name]=value;},environment);
    assert.equal(rejected.version,'1.0.3');
  });

  test('Android flow先领取独占任务根并交付原生目录，错误Job和提交拒绝',()=>{
    const area=mkdtempSync(join(root,'target/test/android-job-'));
    try{
      const outputFile=join(area,'github-env'),sha='a'.repeat(40);writeFileSync(outputFile,'');
      const environment={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:owner.repository,GITHUB_REF:'refs/heads/main',
        GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_SHA:sha,GITHUB_WORKFLOW_REF:`${owner.repository}/${workflowPath}@refs/heads/main`,
        GITHUB_RUN_ID:'9',GITHUB_RUN_NUMBER:'10',GITHUB_RUN_ATTEMPT:'1',GITHUB_JOB:'flow',RUNNER_TEMP:area,GITHUB_ENV:outputFile,
        RELEASE_VERSION:'1.0.3',RELEASE_TAG:`${prefix}1.0.3-r9-a1`};
      const work=job(environment,{head:()=>sha});
      assert.equal(environment.RELEASE_WORK,work);assert.equal(environment.CARGO_TARGET_DIR,join(work,'cargo'));
      assert.equal(environment.CITIZENWALLET_NATIVE_ANDROID_DIR,join(work,'native/android'));
      assert.equal(environment.CITIZENWALLET_NATIVE_IOS_DIR,undefined);
      assert.match(readFileSync(outputFile,'utf8'),/CITIZENWALLET_NATIVE_ANDROID_DIR=/u);
      assert.throws(()=>job({...environment,GITHUB_JOB:'publish'},{head:()=>sha}),/任务根/);
      assert.throws(()=>job({...environment},{head:()=> 'b'.repeat(40)}),/检出源码/);
    }finally{rmSync(area,{recursive:true,force:true});}
  });

  test('Android工作流自行装配Gradle、资源与Flutter Wrapper，拒绝重复目标',()=>{
    const area=mkdtempSync(join(root,'target/test/android-workflow-'));
    try{
      const source=join(area,'source'),temp=join(area,'runner'),flutter=join(area,'flutter'),envFile=join(area,'github-env');
      mkdirSync(source);mkdirSync(temp);
      cpSync(join(root,'android'),join(source,'android'),{recursive:true});
      cpSync(join(root,'icons'),join(source,'icons'),{recursive:true});copyFileSync(join(root,'pubspec.yaml'),join(source,'pubspec.yaml'));
      for(const name of ['gradlew','gradlew.bat','gradle/wrapper/gradle-wrapper.jar']){
        const file=join(flutter,'bin/cache/artifacts/gradle_wrapper',name);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,'fixture');
      }
      writeFileSync(envFile,'');
      const environment={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:owner.repository,GITHUB_REF:'refs/heads/main',
        GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_SHA:'a'.repeat(40),GITHUB_WORKFLOW_REF:`${owner.repository}/${workflowPath}@refs/heads/main`,
        GITHUB_RUN_ID:'9',GITHUB_RUN_NUMBER:'10',GITHUB_RUN_ATTEMPT:'1',GITHUB_WORKSPACE:source,RUNNER_TEMP:temp,GITHUB_ENV:envFile,FLUTTER_ROOT:flutter,SOFTWARE_VERSION:'1.0.3'};
      const view=prepareProject(environment,{sourceRoot:source});
      assert.equal(existsSync(join(source,'build')),false);
      assert.equal(existsSync(join(view,'build')),false);
      assert.equal(readFileSync(join(view,'pubspec.yaml'),'utf8').includes('version: 1.0.3+10'),true);
      assert.equal(readFileSync(join(source,'pubspec.yaml'),'utf8'),readFileSync(join(root,'pubspec.yaml'),'utf8'));
      assert.equal(readFileSync(join(view,'android/gradle/wrapper/gradle-wrapper.properties'),'utf8'),
        readFileSync(join(source,'android/gradle-wrapper.properties'),'utf8'));
      assert.ok(lstatSync(join(view,'android/gradlew')).mode&0o111);
      assert.ok(lstatSync(join(view,'android/build/generated-icons/mipmap-mdpi/ic_launcher.png')).isFile());
      assert.throws(()=>prepareProject(environment,{sourceRoot:source}),/已有内容/);
      assert.throws(()=>prepareProject({...environment,FLUTTER_ROOT:'/missing'},{sourceRoot:source}));
    }finally{rmSync(area,{recursive:true,force:true});}
  });

  test('Android资产只从本轮工程精确收集，缺件、多件和链接拒绝',async()=>{
    const area=mkdtempSync(join(root,'target/test/android-assets-'));
    try{
      const temp=join(area,'runner'),work=join(temp,'citizenwallet-android-view-9-1'),project=join(work,'source-view');
      const release=join(project,'build/release'),task=join(temp,'task'),assets=join(task,'assets'),githubOutput=join(area,'github-output');
      mkdirSync(release,{recursive:true});mkdirSync(assets,{recursive:true});writeFileSync(githubOutput,'');
      const environment={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:owner.repository,GITHUB_REF:'refs/heads/main',
        GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_SHA:'a'.repeat(40),GITHUB_WORKFLOW_REF:`${owner.repository}/${workflowPath}@refs/heads/main`,
        GITHUB_RUN_ID:'9',GITHUB_RUN_NUMBER:'10',GITHUB_RUN_ATTEMPT:'1',RELEASE_VERSION:'1.0.3',
        RELEASE_TAG:`${prefix}1.0.3-r9-a1`,RUNNER_TEMP:temp,CITIZENWALLET_WORK_DIR:work,CITIZENWALLET_PROJECT_ROOT:project,
        RELEASE_WORK:task,RELEASE_ASSETS_DIR:assets,GITHUB_OUTPUT:githubOutput};
      for(const name of owner.required_assets)writeFileSync(join(release,name),name);
      const extra=join(release,'extra.json');writeFileSync(extra,'extra');await assert.rejects(collectProduced(environment),/集合/);rmSync(extra);
      const apk=join(release,'citizenwallet.apk');rmSync(apk);await assert.rejects(collectProduced(environment),/集合/);
      writeFileSync(join(area,'other'),'other');symlinkSync(join(area,'other'),apk);await assert.rejects(collectProduced(environment),/普通文件/);
      rmSync(apk);writeFileSync(apk,'apk');const result=await collectProduced(environment);
      assert.deepEqual(result.assets.map(file=>file.name).sort(),[...owner.required_assets].sort());
      assert.deepEqual(readdirSync(assets).sort(),[...owner.required_assets,'automation.json'].sort());
      writeFileSync(join(assets,'automation.json'),JSON.stringify({...result,assets:[...result.assets,{name:'extra.json',size:1,sha256:'a'.repeat(64)}]}));
      await assert.rejects(publish(assets,environment),/闭集/);
    }finally{rmSync(area,{recursive:true,force:true});}
  });

  test('Android注册表检查脚本为完整Python且不调用Build',()=>{
    const source=commands['5'].source;
    assert.doesNotMatch(source,/scripts\/build\.mjs/u);
    const marker="python3 - <<'VERIFY_REGISTRY'\n",start=source.indexOf(marker),end=source.lastIndexOf('\nVERIFY_REGISTRY');
    assert.ok(start>=0&&end>start);
    const python=source.slice(start+marker.length,end),result=spawnSync(process.env.PRODUCT_TEST_PYTHON||'python3',
      ['-c','import ast,sys;ast.parse(sys.stdin.read())'],{input:python,encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
  });

}
