const gateTestEntry = Boolean(process.env.NODE_TEST_CONTEXT) && process.argv.length === 2
 && Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
import {fixedWork,withFixedWork,checkFixedWork,assertTargetTopology} from '../../scripts/build.mjs';
import {gateToolInterfaces,gateCleanupAllowed,runResourceProcess,prepareGateResources,verifyGateResourceDelivery} from '../../scripts/build.mjs';
const {toolEnvironment}=gateToolInterfaces;
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync,
} from 'node:fs';
import { basename, dirname, extname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Readable } from 'node:stream';
import { spec } from 'node:test/reporters';

const emptyTreeSHA = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
// 仅排除已核实的上游源码；本仓第一方及自有归档消费者测试均纳入功能清单。
const functionalIgnoredPrefixes=[];

const commitPattern = /^[0-9a-f]{40}$/u;
function registrySourceSha(root){
 const source=readFileSync(resolve(root,'lib/signing/chain_constants.dart'),'utf8');
 const values=[...source.matchAll(/static const String registrySourceSha\s*=\s*'([0-9a-f]{40})';/gu)];
 if(values.length!==1||!commitPattern.test(values[0][1]))fail('钱包固定链真源无效');
 return values[0][1];
}
const implementationExtensions = new Set([
  '.c', '.cc', '.cpp', '.dart', '.go', '.h', '.hpp', '.java', '.js', '.jsx', '.kt',
  '.kts', '.mjs', '.pbxproj', '.proto', '.py', '.rs', '.sh', '.sql', '.swift', '.toml',
  '.ts', '.tsx', '.yaml', '.yml',
]);
const commentExtensions = new Set([
  '.c', '.cc', '.cpp', '.dart', '.go', '.h', '.hpp', '.java', '.js', '.jsx', '.kt',
  '.kts', '.mjs', '.py', '.rs', '.sh', '.sql', '.swift', '.ts', '.tsx',
]);

function fail(message) { throw new Error(message); }

function exactKeys(value, expected, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join('\0') !== [...expected].sort().join('\0')) {
    fail(label + '字段闭集无效');
  }
}

function git(root, arguments_) {
  try {
    const checked=toolEnvironment();
    return execFileSync(checked.PRODUCT_GIT_BIN, ['-C', root, ...arguments_], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      env: checked,
    });
  } catch {
    fail('产品门禁读取Git提交失败');
  }
}

export function validateRange({ root, baseSHA, headSHA }) {
  if (!isAbsolute(root) || realpathSync(root) !== root) fail('产品门禁仓库根无效');
  if (!commitPattern.test(baseSHA) || !commitPattern.test(headSHA) || baseSHA === headSHA) {
    fail('产品门禁提交范围无效');
  }
  if (git(root, ['rev-parse', 'HEAD']).trim() !== headSHA) fail('产品门禁目标与当前检出不一致');
  if (baseSHA !== emptyTreeSHA) git(root, ['merge-base', '--is-ancestor', baseSHA, headSHA]);
  const range = baseSHA === emptyTreeSHA ? headSHA : `${baseSHA}..${headSHA}`;
  const commits = git(root, ['rev-list', '--reverse', '--topo-order', range]).trim().split(/\r?\n/u).filter(Boolean);
  if (commits.length === 0 || commits.some((commit) => !commitPattern.test(commit))) {
    fail('产品待推送提交范围无效');
  }
  return Object.freeze(commits);
}



function currentFiles(root) {
  return [...new Set(git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '.']).split('\0').filter(path => path && existsSync(resolve(root, path))))].sort();
}

function isTestPath(path) {
  const segments = path.split('/').map((segment) => segment.toLowerCase());
  const name = basename(path).toLowerCase();
  return segments.some((segment) => ['test', 'tests', 'integration_test'].includes(segment))
    || /(?:^|[._-])(?:test|spec)(?:[._-]|$)/u.test(name);
}

function isImplementationPath(path) {
  return implementationExtensions.has(extname(path).toLowerCase())
    || ['Dockerfile', 'Makefile'].includes(basename(path));
}

// 词法扫描保留真实代码与注释位置；字符串、正则及模板正文不作为实现注释。
export function lexicalParts(path, source) {
  const extension=extname(path).toLowerCase(), javascript=['.js','.jsx','.mjs','.ts','.tsx'].includes(extension);
  const comments=[], code=source.split('');let index=0;
  const blank=(begin,end)=>{for(let at=begin;at<end;at++)if(source[at]!=='\n'&&source[at]!=='\r')code[at]=' ';};
  const quote=(delimiter,triple=false,interpolated=false)=>{
    const size=triple?3:1;blank(index,index+size);index+=size;
    while(index<source.length){
      if(source[index]==='\\'){blank(index,index+2);index+=2;continue;}
      if(interpolated&&source.startsWith('${',index)){blank(index,index+2);index+=2;scan(true);continue;}
      if(source.startsWith(delimiter.repeat(size),index)){blank(index,index+size);index+=size;return;}
      blank(index,index+1);index++;
    }
  };
  const scan=(interpolation=false)=>{
    let previous='',word='',depth=1;
    while(index<source.length){
      const value=source[index];
      if(/\s/u.test(value)){index++;continue;}
      if(interpolation&&value==='}'){if(--depth===0){blank(index,index+1);index++;return;}index++;previous='}';continue;}
      if(interpolation&&value==='{')depth++;
      const lineComment=(['.py','.sh'].includes(extension)&&value==='#'&&!source.startsWith('#!',index))
        ||extension==='.sql'&&source.startsWith('--',index)
        ||!['.py','.sh','.sql'].includes(extension)&&source.startsWith('//',index);
      if(lineComment){const begin=index,end=source.indexOf('\n',index);index=end<0?source.length:end;comments.push(source.slice(begin,index));blank(begin,index);continue;}
      if(!['.py','.sh'].includes(extension)&&source.startsWith('/*',index)){
        const begin=index;let nested=1;index+=2;
        while(index<source.length&&nested){if(extension==='.rs'&&source.startsWith('/*',index)){nested++;index+=2;}else if(source.startsWith('*/',index)){nested--;index+=2;}else index++;}
        comments.push(source.slice(begin,index));blank(begin,index);continue;
      }
      if(extension==='.rs'){
        const raw=/^(?:b)?r(#+)?"/u.exec(source.slice(index));
        if(raw){const begin=index,close='"'+(raw[1]||''),end=source.indexOf(close,index+raw[0].length);index=end<0?source.length:end+close.length;blank(begin,index);previous='literal';continue;}
        if(value==="'"&&!/^'(?:\\(?:u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|.)|[^'\\\n])'/u.test(source.slice(index))){index++;previous=value;continue;}
      }
      if(value==='"'||value==="'"||value==='`'){
        quote(value,['.dart','.py'].includes(extension)&&source.startsWith(value.repeat(3),index),javascript&&value==='`'||extension==='.dart'&&source[index-1]!=='r');previous='literal';word='';continue;
      }
      if(javascript&&value==='/'&&(!previous||/[=(:,!\[{};?]/u.test(previous)||['return','throw','yield','case'].includes(word))){
        const begin=index++;let bracket=false;
        while(index<source.length){const current=source[index++];if(current==='\\'){index++;continue;}if(current==='[')bracket=true;else if(current===']')bracket=false;else if(current==='/'&&!bracket)break;else if(current==='\n')break;}
        while(/[a-z]/iu.test(source[index]||''))index++;blank(begin,index);previous='literal';word='';continue;
      }
      if(/[A-Za-z_$]/u.test(value)){const begin=index++;while(/[A-Za-z0-9_$]/u.test(source[index]||''))index++;word=source.slice(begin,index);previous='word';continue;}
      previous=value;word='';index++;
    }
  };
  scan();return {comments:comments.join('\n'),code:code.join('')};
}

export function commentText(path, source) { return lexicalParts(path,source).comments; }


function temporaryComments(path, source) {
  return commentText(path, source).split('\n').filter((line) => /(?:TODO|FIXME|HACK|XXX)\b/u.test(line));
}

// 上游说明只能逐字、按原有数量保留；复制同一句到新位置不能增加允许数量。

export function hasFirstPartyTemporaryComments(path, source, upstream = '') {
  const retained = new Map();
  for (const comment of temporaryComments(path, upstream)) retained.set(comment, (retained.get(comment) ?? 0) + 1);
  return temporaryComments(path, source).some((comment) => {
    const count = retained.get(comment) ?? 0;
    if (count === 0) return true;
    retained.set(comment, count - 1);
    return false;
  });
}









export function validateDependencyPlans(lock, plans, platforms) {
  if (lock?.schema !== 1 || !lock.environment || !lock.native?.sources) fail('产品依赖锁结构无效');
  const entries = [...Object.entries(lock.environment), ...Object.entries(lock.native.sources)];
  const sources = new Map(entries);
  if (!entries.length || sources.size !== entries.length) fail('产品依赖锁名称为空或重复');
  const keys = ['name', 'version', 'url', 'size', 'sha256', 'archive_root'];
  const coordinates = keys.slice(1);
  for (const [name, value] of sources) {
    if (!/^[A-Za-z0-9_.+-]+$/u.test(name) || !value || typeof value.version !== 'string'
      || !value.version.trim() || !Number.isSafeInteger(value.size) || value.size <= 0
      || !/^[0-9a-f]{64}$/u.test(value.sha256)
      || typeof value.archive_root !== 'string' || !/^[A-Za-z0-9_+-][A-Za-z0-9_.+-]*$/u.test(value.archive_root)) {
      fail('产品依赖锁归档坐标无效');
    }
    let url;
    try { url = new URL(value.url); } catch { fail('产品依赖锁来源无效'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) fail('产品依赖锁来源无效');
  }
  if (!Array.isArray(plans) || !Array.isArray(platforms) || !platforms.length
    || new Set(platforms).size !== platforms.length || plans.length !== platforms.length) fail('产品依赖计划平台不完整');
  const covered = new Set();
  for (const [index, plan] of plans.entries()) {
    exactKeys(plan, ['schema', 'platform', 'archives'], '产品依赖计划');
    if (plan.schema !== 1 || plan.platform !== platforms[index]
      || !Array.isArray(plan.archives) || !plan.archives.length) fail('产品依赖计划身份或归档无效');
    const names = new Set();
    for (const archive of plan.archives) {
      exactKeys(archive, keys, '产品依赖计划归档');
      const expected = sources.get(archive.name);
      if (!expected || names.has(archive.name)
        || coordinates.some((key) => archive[key] !== expected[key])) fail('产品依赖计划与锁不一致');
      names.add(archive.name);
      covered.add(archive.name);
    }
  }
  if (covered.size !== sources.size) fail('产品依赖计划未覆盖全部锁定归档');
  return true;
}

// 准确中文注释属于开发逐项复核；仓库门禁不把保留源码逐文件出现汉字当作开发凭证。
export async function validateQuality(root, baseSHA, headSHA, repository) {
  const changed = git(root, ['diff', '--name-only', '-z', baseSHA, headSHA]).split('\0').filter(Boolean);
  const temporary = [];
  for (const path of changed.filter((item) => isImplementationPath(item) && !isTestPath(item) && !ignoredPrefixesFor(repository).some(prefix => item.startsWith(prefix)))) {
    const absolute = resolve(root, path);
    if (!existsSync(absolute) || !commentExtensions.has(extname(path).toLowerCase())) continue;
    const comments = commentText(path, readFileSync(absolute, 'utf8'));
    if (!/(?:TODO|FIXME|HACK|XXX)\b/u.test(comments)) continue;
    if (hasFirstPartyTemporaryComments(path, readFileSync(absolute, 'utf8'))) temporary.push(path);
  }
  if (temporary.length > 0) fail('产品实现代码保留临时注释：' + temporary.join('、'));
  const tests = currentFiles(root).filter((path) => isTestPath(path)
    && !ignoredPrefixesFor(repository).some((prefix) => path.startsWith(prefix)));
  if (tests.length === 0) fail('产品没有受控测试代码');
  for (const path of tests) {
    const info = lstatSync(resolve(root, path), { throwIfNoEntry: false });
    if (!info || !info.isFile() || info.isSymbolicLink() || info.size === 0) fail('产品测试代码无效：' + path);
  }
}

function validateSyntax(root, execute, environment, repository) {
  for (const path of currentFiles(root)) {
    if (ignoredPrefixesFor(repository).some((prefix) => path.startsWith(prefix))) continue;
    const absolute = resolve(root, path);
    let result = null;
    if (path.endsWith('.mjs')) result = execute(process.execPath, ['--check', absolute], { cwd: root, env: environment, stdio: 'inherit' });
    else if (path.endsWith('.sh')) result = execute(environment.PRODUCT_BASH_BIN, ['-n', absolute], { cwd: root, env: environment, stdio: 'inherit' });
    else if (path.endsWith('.json')) {
      try { JSON.parse(readFileSync(absolute, 'utf8')); } catch { fail('JSON语法无效：' + path); }
    }
    if (result && (result.error || result.signal || result.status !== 0)) fail('源码语法无效：' + path);
  }
}

// 逐文件与最终汇总必须对应同一非空清单，拒绝漏文件、重复汇总及伪造总数。
export default async function* reporter(events) {
  async function* checked() {
    let list;
    try{list=JSON.parse(process.env.TATAGATE_NODE_TESTS||'null');}catch{list=null;}
    const validList=Array.isArray(list)&&list.length>0&&list.every(file=>typeof file==='string'&&isAbsolute(file)&&resolve(file)===file)&&new Set(list).size===list.length;
    const expected=new Set(validList?list:[]),seen=new Set(),functionalFiles=[];let cumulative=false,total=0,invalid=!validList;
    for await(const event of events){
      if(event.type==='test:summary'){
        const data=event.data;let valid=successfulTestSummary(data);
        if(data?.file!==undefined){
          if(typeof data.file!=='string'||!data.file)valid=false;
          else{const file=resolve(data.file);if(!expected.has(file)||seen.has(file)||cumulative)valid=false;seen.add(file);total+=data.counts?.tests||0;functionalFiles.push({path:file,counts:data.counts});}
        }else{if(cumulative||seen.size!==expected.size||[...expected].some(file=>!seen.has(file))||data?.counts?.tests!==total)valid=false;cumulative=true;}
        if(!valid)invalid=true;
      }
      yield event;
    }
    if(invalid||!cumulative||seen.size!==expected.size){process.exitCode=1;yield{type:'test:diagnostic',data:{nesting:0,message:'产品门禁缺少逐文件完整成功回执。'}};}
    else if(process.env.TATAGATE_REPOSITORY_ROOT&&process.env.TATAGATE_WORK_DIR){
      const root=process.env.TATAGATE_REPOSITORY_ROOT,actual=[resolve(root,'.github/tatagate/tatagate.mjs'),...contract.node_tests.map(path=>resolve(root,path))];
      if(JSON.stringify(list)===JSON.stringify(actual))writeFunctionalRecord(process.env.TATAGATE_WORK_DIR,'node',root,{files:functionalFiles});
    }
  }
  yield* Readable.from(checked()).pipe(spec());
}

function embeddedNodeTest(path, root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')) {
  const file = resolve(root, path);
  return contract.node_tests.includes(path) && path.endsWith('.mjs') && existsSync(file)
    && isInlineNodeTest(path,root);
}

// 核对本仓当前存在的Node测试集合，不接受漏登记、失效登记或重复入口。
export function validateNodeInventory(paths, registered, repository = contract.repository) {
  if (!Array.isArray(paths) || !Array.isArray(registered)) fail('本仓测试清单类型无效');
  const owned = paths.filter(path => !path.startsWith('.github/tatagate/')
    && !ignoredPrefixesFor(repository).some(prefix => path.startsWith(prefix))
    && (/(?:^|\/)(?:test\.mjs|[^/]+[._-](?:test|spec)\.mjs)$/u.test(path) || embeddedNodeTest(path))).sort();
  if (!owned.length || new Set(paths).size !== paths.length
    || new Set(registered).size !== registered.length
    || owned.join('\0') !== [...registered].sort().join('\0')) fail('本仓实际测试与门禁登记不闭合');
  return Object.freeze(owned);
}

// 本机与远端检出均独立验证真实Git根、唯一origin及同一个已保存提交。
export function validateRepositoryIdentity(root, { remote = false } = {}) {
  if (git(root, ['rev-parse', '--show-toplevel']).trim() !== root
    || git(root, ['rev-parse', '--is-bare-repository']).trim() !== 'false'
    || resolve(root, git(root, ['rev-parse', '--git-common-dir']).trim()) !== resolve(root, '.git')
    || !lstatSync(resolve(root, '.git')).isDirectory() || lstatSync(resolve(root, '.git')).isSymbolicLink()
    || git(root, ['remote', 'get-url', '--all', 'origin']).trim() !== 'https://github.com/' + contract.github_repository + '.git') {
    fail('本仓独立Git根或准确HTTPS来源不符');
  }
  if (!remote && git(root, ['symbolic-ref', '--quiet', '--short', 'HEAD']).trim() !== 'main') fail('本机门禁只接受本仓main');
  if (remote && (process.env.GITHUB_REPOSITORY !== contract.github_repository
    || process.env.GITHUB_WORKSPACE !== root || process.env.GITHUB_REF !== 'refs/heads/main')) fail('远端所属仓上下文不符');
}

// 汇总必须非空且没有失败、取消、待办或跳过，不能用零用例退出码冒充验收。
export function successfulTestSummary(data) {
  const counts = data?.counts;
  return data?.success === true && counts && Number.isSafeInteger(counts.tests) && counts.tests > 0
    && ['failed', 'skipped', 'todo', 'cancelled'].every(name => counts[name] === 0)
    && Number.isSafeInteger(counts.passed) && counts.passed === counts.tests;
}


function ignoredPrefixesFor(){return [];}
// 技术文档只属于本仓根；保留README简介，拒绝副本、链接、空文件与额外根技术文档。
const productDocumentNames = Object.freeze(["CitizenWallet.md"]);
export function validateProductDocuments(root) {
  const allowed = new Set([...productDocumentNames, 'README.md']);
  for (const name of productDocumentNames) {
    const path = resolve(root, name), info = lstatSync(path, { throwIfNoEntry: false });
    if (!info || !info.isFile() || info.isSymbolicLink() || !info.size || realpathSync(path) !== path) fail('所属产品根技术文档缺失或类型无效：' + name);
  }
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!/\.md$/iu.test(entry.name)) continue;
    if (!allowed.has(entry.name)) fail('所属产品根存在额外技术文档：' + entry.name);
    const path = resolve(root, entry.name), info = lstatSync(path);
    if (!info.isFile() || info.isSymbolicLink() || !info.size || realpathSync(path) !== path) fail('所属产品根文档必须是非空普通原件：' + entry.name);
  }
  return true;
}
export function assertNoProductOutputDirectories(root, repository) {
 if(root===resolve(import.meta.dirname,'../..'))assertTargetTopology();
  const ignored = new Set(['.git', 'node_modules', 'vendor', 'Pods', '.pub-cache', '.gradle']);
  const forbidden = new Set(['build', 'target', '.dart_tool', '.kotlin']);
  const violations = [];
  const visit = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name), relative = path.slice(root.length + 1);
      if (ignoredPrefixesFor(repository).some(prefix => (relative + '/').startsWith(prefix))) continue;
      // 仅本仓根target是生成边界，检查准确目录且不递归扫描任务现场。
      if (directory === root && entry.name === 'target') {
        if (!entry.isDirectory() || entry.isSymbolicLink() || realpathSync(path) !== path) violations.push(relative);
        continue;
      }
      if (forbidden.has(entry.name)) violations.push(relative);
      if (entry.isDirectory() && !ignored.has(entry.name)) visit(path);
    }
  };
  visit(root);
  if (violations.length) fail('产品源码存在生成状态目录：' + violations.sort().join('、'));
}
export async function checkDependencies(root, { execute = spawnSync, report = console.log, env = {} } = {}) {
  const directory = resolve(root, 'scripts');
  const lock = JSON.parse(readFileSync(resolve(directory, 'dependencies.lock.json'), 'utf8'));
  const { assertCitizenSdkNativeContract } = await import(pathToFileURL(resolve(directory, 'release.mjs')).href);
  assertCitizenSdkNativeContract(lock.native);
  const platforms = ['Android', 'macOS', ...Object.keys(lock.native.platforms)];
  const plans = platforms.map(platform => {
    const result = execute(process.execPath, [resolve(directory, 'dependencies.mjs'), 'plan', '--platform', platform],
      { cwd: root, env, encoding: 'utf8', timeout: 30_000, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    if (result.error || result.signal || result.status !== 0) fail('产品依赖计划执行失败');
    try { return JSON.parse(result.stdout); } catch { fail('产品依赖计划回执无效'); }
  });
  validateDependencyPlans(lock, plans, platforms);
  report('产品依赖合同与全部锁定归档一致');
}


// 格式识别源码只有PEM头尾文字；实际凭据必须有密钥正文。
// 同时扫描原文、JSON解码值与任务补丁原件，不能用序列化转义隐藏真实材料。
export function hasSecretMaterial(source) {
  if (typeof source !== 'string') fail('机密扫描输入必须是文本');
  const token = /AKIA[0-9A-Z]{16}|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|sk_live_[A-Za-z0-9]{16,}/u;
  const material = text => {
    if (token.test(text)) return true;
    const normalized = text.replace(/\\r\\n|\\n|\\r/gu, '\n');
    for (const match of normalized.matchAll(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s+([A-Za-z0-9+/=\s]+)/gu)) {
      if (match[1].replace(/\s/gu, '').length >= 32) return true;
    }
    return false;
  };
  if (material(source)) return true;
  const documents = [];
  const trimmed = source.trim();
  if (/^(?:\{|\[|")/u.test(trimmed)) {
    try { documents.push(JSON.parse(trimmed)); } catch { /* 非JSON正文仍已执行原文扫描。 */ }
  }
  const begin = '<!-- PATCH_DATA\n', end = '\nPATCH_DATA -->';
  const start = source.indexOf(begin);
  if (start >= 0) {
    const stop = source.indexOf(end, start + begin.length);
    if (stop < 0 || source.indexOf(begin, start + begin.length) >= 0) fail('门禁补丁快照结构不可解析');
    try { documents.push(JSON.parse(source.slice(start + begin.length, stop))); }
    catch { fail('门禁补丁快照结构不可解析'); }
  }
  while (documents.length) {
    const value = documents.pop();
    if (typeof value === 'string') {
      if (material(value)) return true;
      // JSON内再次序列化的字符串仍解码扫描；不能把凭据放进键名或第二层转义。
      if (/^(?:\{|\[|")/u.test(value.trim())) {
        try { documents.push(JSON.parse(value)); } catch { /* 非JSON源码已按原文检查。 */ }
      }
    } else if (value && typeof value === 'object') {
      documents.push(...Object.keys(value), ...Object.values(value));
    }
  }
  return false;
}

// 强特征扫描只返回路径；不将机密值带入回执或日志。
export function validateSecrets(root) {
  // 根技术文档沿用原件的完整转义扫描；其余源码继续执行原有强特征检查。
  for (const name of productDocumentNames) {
    if (hasSecretMaterial(readFileSync(resolve(root, name), 'utf8'))) fail('产品根文档机密扫描未通过，仅报告路径：' + name);
  }
  const pattern = 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|AKIA[0-9A-Z]{16}|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|sk_live_[A-Za-z0-9]{16,}';
  const checked=toolEnvironment();
  const result = spawnSync(checked.PRODUCT_GIT_BIN, ['-C', root, 'grep','--untracked','--exclude-standard','-l','-I','-E',pattern,'--','.'],
    { env:checked,encoding: 'utf8', stdio: ['ignore','pipe','ignore'] });
  if (result.error || ![0,1].includes(result.status)) fail('门禁机密扫描执行失败');
  if (result.status === 0) fail('产品机密扫描未通过，仅报告路径：' + result.stdout.trim().split('\n').join('、'));
}

// 比较语义键及密码学值；描述和数组排列不构成协议差异。
export function validateVectorGroup(canonical, mirror, { keys, values, top, complete = false }) {
  const normalize = value => typeof value === 'string' ? value.toLowerCase() : value;
  function index(document) {
    if (!document || !Array.isArray(document.vectors) || document.vectors.length === 0) fail('金标缺少非空向量');
    const map = new Map();
    for (const vector of document.vectors) {
      if (!vector || keys.some(key => vector[key] === undefined) || values.some(key => vector[key] === undefined)) fail('金标向量字段缺失');
      const key = JSON.stringify(keys.map(field => normalize(vector[field])));
      if (map.has(key)) fail('金标存在重复语义键');
      map.set(key, vector);
    }
    return map;
  }
  const expected = index(canonical), actual = index(mirror);
  if (top.some(field => canonical[field] === undefined || normalize(canonical[field]) !== normalize(mirror[field]))) fail('金标顶层参数漂移');
  for (const [key, vector] of actual) {
    const source = expected.get(key);
    if (!source || values.some(field => normalize(source[field]) !== normalize(vector[field]))) fail('金标密码学值漂移');
  }
  if (complete && expected.size !== actual.size) fail('金标签名域必须完整覆盖');
  return actual.size;
}

// SCALE 夹具是固定公开链提交的本仓镜像；三个真实向量集合必须完整一致。
export function validateScaleVectors(canonical, mirror) {
 const fields=['compact_u32','scale_string','u64_le'];
 if(!canonical||!mirror||fields.some(field=>!Array.isArray(canonical[field])||!canonical[field].length
  ||!Array.isArray(mirror[field])||JSON.stringify(canonical[field])!==JSON.stringify(mirror[field])))fail('SCALE 金标镜像与固定链真源不一致');
 return true;
}

// 上游链索引与本端Dart注册表必须具有真实内容，重复索引不能静默覆盖。
export function validatePalletRegistry(chain, dart = null) {
  const indices = new Map(), names = new Set();
  for (const match of chain.matchAll(/#\[runtime::pallet_index\((\d+)\)\]\s*\n\s*pub type (\w+)\s*=/gu)) {
    const index = Number(match[1]), name = match[2];
    if (indices.has(index) || names.has(name)) fail('金标链Pallet索引或名称重复');
    indices.set(index, name); names.add(name);
  }
  if (!indices.size) fail('金标链Pallet真源为空');
  if (dart === null) return indices.size;
  const constants = new Set();
  for (const match of dart.matchAll(/static const (?:int\s+)?(\w+Pallet)\s*=\s*(\d+);/gu)) {
    if (constants.has(match[1])) fail('金标DartPallet常量重复');
    constants.add(match[1]);
    const base = match[1].replace(/Pallet$/u, '');
    if (indices.get(Number(match[2])) !== base[0].toUpperCase() + base.slice(1)) fail('金标DartPallet索引漂移');
  }
  if (!constants.size) fail('金标DartPallet注册表为空');
  return constants.size;
}

// 公开消费者在一次门禁中先锁定链main的准确SHA，再只读该SHA的固定真源文件。
// 不访问控制台、私仓或本机其它产品，网络失败不得回退到缓存或猜测真源。
// 跨产品只按本仓固定SHA读取公开真源，不跟随其它产品的main。
export async function readPublicChain(path,sha,request=fetch){
 const allowed=new Set(['runtime/src/lib.rs',...['signing_domain_vectors','binary_prefix_domain_vectors','account_derive_vectors','scale_codec_vectors'].map(name=>'runtime/primitives/tests/fixtures/'+name+'.json')]);
 if(!allowed.has(path)||!commitPattern.test(sha))fail('公开链真源坐标无效');
 const url='https://raw.githubusercontent.com/crcfrcn/citizenchain/'+sha+'/'+path;
 try{const response=await request(url,{redirect:'error',credentials:'omit',signal:AbortSignal.timeout(15000),headers:{Accept:'text/plain'}});
  if(!response.ok||!response.body||response.url&&response.url!==url)throw Error();const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>2*1024**2)throw Error();chunks.push(Buffer.from(chunk));}
  return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));
 }catch{fail('公开链准确提交真源读取失败');}
}

export async function checkCrossPlatform(root, { request = fetch, report = console.log } = {}) {
  const sha = registrySourceSha(root);
  const read = path => readPublicChain(path, sha, request);
  const groups = [
    { file: 'signing_domain_vectors.json', keys: ['op_tag','scale_payload_hex'], values: ['message_hex'], top: ['domain'], complete: true },
    { file: 'binary_prefix_domain_vectors.json', keys: ['name'], values: ['op_tag','prefix_hex','payload_hex','total_len'], top: ['domain'] },
    { file: 'account_derive_vectors.json', keys: ['cid_number','kind'], values: ['account_id'], top: ['domain','ss58_format'] },
  ];
  for (const group of groups) {
    const canonical = JSON.parse(await read('runtime/primitives/tests/fixtures/' + group.file));
    if (group.file !== 'account_derive_vectors.json') {
      const mirror = JSON.parse(readFileSync(resolve(root, 'test/signing/fixtures', group.file), 'utf8'));
      validateVectorGroup(canonical, mirror, group);
    }
  }
  const scale=JSON.parse(await read('runtime/primitives/tests/fixtures/scale_codec_vectors.json'));
  validateScaleVectors(scale,JSON.parse(readFileSync(resolve(root,'test/signing/fixtures/scale_codec_vectors.json'),'utf8')));
  const chain = await read('runtime/src/lib.rs');
  validatePalletRegistry(chain, readFileSync(resolve(root, 'lib/signing/pallet_registry.dart'), 'utf8'));
  report('密码学金标与Pallet注册表完成真源校验：citizenchain@' + sha);
}



// 只识别本仓实际执行测试中的拒绝断言；字符串、模板及注释中的同文不构成豁免。
export function protocolAssertionLines(path, source) {
  if (!contract.node_tests.includes(path) || !path.endsWith('.mjs')) return [];
  const literal = String.raw`assert.doesNotMatch(source, /\/v1(?:\/|\b)/);`;
  const opaque = [...source.matchAll(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/(?:\\[^\r\n]|\[(?:\\[^\r\n]|[^\]\\\r\n])*\]|[^\/\\\r\n])+\/[dgimsuvy]*/gu)]
    .map(match => [match.index, match.index + match[0].length]);
  const occurrences = new Map();
  let offset = 0;
  for (const line of source.split('\n')) {
    if (line.trim() === literal) {
      const position = offset + line.indexOf('assert');
      const executable = !opaque.some(([start, end]) => position >= start && position < end);
      occurrences.set(line, (occurrences.get(line) ?? true) && executable);
    }
    offset += line.length + 1;
  }
  return [...occurrences].filter(([, valid]) => valid).map(([line]) => line);
}

// 公民产品原有增量防护完整保留在自身门禁，字典私有资料不进入公开仓。
// 准确拒绝型反例必须保留完整消费者与失败断言；普通地址、改断言或伪造字符串均拒绝。
function closedRejectionRanges(path,source){
 const accepted={"scripts/build.mjs":{"516bc7510a1673b7276b5bc94a67ef91d8e03f686fee932229dc41065d0d35a6":"test('错摘要、错来源、离线缺失、来源越权均失败关闭且无正式原件'","9ef9321adc2bdff30c3dc71233ec1c31cddc09abc814e6e8c9a8401300ba8a1f":"test('源码工具只分离两处有效镜像运输字段，真实编译输入与物理证明仍严格验真'","00aa0e391e2b323b65b3c291fcc316aeb04d36fb123a35621d272a091d695e94":"test('Pod官方CDN严格一跳HTTPS分发，错源、错路径、再跳转、超限和取消拒绝'"}},relative=path.replaceAll('\\','/').replace(/^.*\/(scripts\/build\.mjs)$/u,'$1');
 const records=accepted[relative];if(!records)return [];
 const {code}=lexicalParts(path,source),ranges=[];
 for(const [sha,prefix]of Object.entries(records)){
  let begin=source.indexOf(prefix);
  while(begin>=0){
   const call=prefix.startsWith('it(')?'it(':'test(';
   if(code.slice(begin,begin+call.length)===call){
    let brace=code.indexOf('{',begin),depth=1,end=brace+1;
    for(;end<code.length&&depth;end++){if(code[end]==='{')depth++;else if(code[end]==='}')depth--;}
    if(!depth&&/^\);/u.test(source.slice(end))){end+=2;const body=source.slice(begin,end);if(createHash('sha256').update(body).digest('hex')===sha)ranges.push({start:begin,end});}
   }
   begin=source.indexOf(prefix,begin+prefix.length);
  }
 }
 return ranges;
}

export function insecureTransportLines(path, source) {
  const allowed = closedRejectionRanges(path,source);
  if (/(?:_tests\.rs|\/tests\/[^/]+\.rs)$/u.test(path)) {
    const tokens = [];
    const scanner = /\/\/[^\n]*|\/\*|r(#+)?"|"(?:\\[\s\S]|[^"\\])*"|'(?:\\.|[^'\\])'|[A-Za-z_][A-Za-z0-9_]*|\S/gu;
    let match, valid = true;
    while ((match = scanner.exec(source))) {
      const value = match[0];
      if (value.startsWith('//')) continue;
      if (value === '/*') {
        let depth = 1, end = scanner.lastIndex;
        while (depth && end < source.length) {
          if (source.startsWith('/*', end)) { depth++; end += 2; }
          else if (source.startsWith('*/', end)) { depth--; end += 2; }
          else end++;
        }
        if (depth) { valid = false; break; }
        scanner.lastIndex = end; continue;
      }
      if (/^r#*"$/u.test(value)) {
        const end = source.indexOf('"' + (match[1] || ''), scanner.lastIndex);
        if (end < 0) { valid = false; break; }
        scanner.lastIndex = end + 1 + (match[1] || '').length;
        tokens.push({ value: '<raw>', start: match.index, end: scanner.lastIndex }); continue;
      }
      tokens.push({ value, start: match.index, end: scanner.lastIndex });
    }
    const text = (start, end) => tokens.slice(start, end).map(token => token.value).join(' ');
    if (valid) for (let index = 0; index < tokens.length; index++) {
      if (text(index, index + 5) !== '# [ test ] fn') continue;
      if (!/^[A-Za-z_]\w*$/u.test(tokens[index + 5]?.value || '')
        || text(index + 6, index + 9) !== '( ) {') continue;
      const begin = index + 9;
      let end = begin, depth = 1;
      for (; end < tokens.length && depth; end++) {
        if (tokens[end].value === '{') depth++;
        if (tokens[end].value === '}') depth--;
      }
      if (depth) continue;
      for (let at = begin; at < end; at++) {
        if (tokens[at].value !== 'for') continue;
        const variable = tokens[at + 1]?.value;
        if (!/^[A-Za-z_]\w*$/u.test(variable || '') || text(at + 2, at + 4) !== 'in [') continue;
        let cursor = at + 4;
        const inputs = [];
        while (/^"(?:\\.|[^"\\])*"$/u.test(tokens[cursor]?.value || '')) {
          inputs.push(tokens[cursor++]);
          if (tokens[cursor]?.value !== ',') break;
          cursor++;
        }
        if (!inputs.length || text(cursor, cursor + 2) !== '] {') continue;
        cursor += 2;
        // 循环体必须仅执行一次拒绝断言；多余调用、成功断言或被替换的参数均不豁免。
        const assertion = `assert ! ( endpoint ( ${variable} ) . is_err ( )`;
        if (text(cursor, cursor + 11) !== assertion) continue;
        cursor += 11;
        if (tokens[cursor]?.value === ',') {
          if (tokens[cursor + 1]?.value !== `"{${variable}}"`) continue;
          cursor += 2;
        }
        if (text(cursor, cursor + 3) !== ') ; }' || cursor + 3 > end) continue;
        for (const input of inputs) {
          if (/^"(?:http|ws):\/\/[A-Za-z0-9.-]+\.invalid(?:[/?#][^"\\]*)?"$/u.test(input.value)) allowed.push(input);
        }
      }
    }
  }
  const unsafe = new Set();
  for (const match of source.matchAll(/(?:http|ws):\/\//gu)) {
    if (!allowed.some(({ start, end }) => match.index >= start && match.index < end)) {
      unsafe.add(source.slice(0, match.index).split('\n').length);
    }
  }
  return [...unsafe];
}
const guardrailsSource = "#!/usr/bin/env bash\nset -euo pipefail\n\nbase_ref=\"${BASE_REF:-origin/main}\"\n\n# 中文说明：产品门禁只读取自身提交；私有规则与任务由私仓检查，技术文档只归所属产品根。\nflow_root=\"${TATAGATE_DIRECTORY:?缺少本仓门禁根}\"\nif [[ -e memory || -e \"$(printf '\\124\\141\\164\\141\\103\\157\\156\\163\\157\\154\\145')\" || -e AGENTS.md || -e CODEX.md || -e CLAUDE.md ]]; then\n  echo \"公民产品根目录检测到外部私有资料残留。\" >&2\n  exit 1\nfi\n\n# 中文注释：全仓禁止中国国旗字符；用 UTF-8 八进制构造，避免规则本身成为命中项。\nforbidden_cn_flag=\"$(printf '\\360\\237\\207\\250\\360\\237\\207\\263')\"\nflag_files=\"$(git grep --untracked -l -I -F \"$forbidden_cn_flag\" -- . || true)\"\nif [[ -n \"$flag_files\" ]]; then\n  echo \"检测到禁止使用的中国国旗字符（仅报告文件）：\" >&2\n  printf '  - %s\\n' \"$flag_files\" >&2\n  exit 1\nfi\n\n# 首次推送以空树比较全部已保存内容；已有main必须提供可验证祖先，不主动抓取或猜测分支。\ngit rev-parse --verify \"$base_ref\" >/dev/null 2>&1 || { echo '门禁基线不存在' >&2; exit 1; }\nif [[ \"$base_ref\" == '4b825dc642cb6eb9a060e54bf8d69288fbee4904' ]]; then\n  merge_base=\"$base_ref\"\nelse\n  merge_base=\"$(git merge-base HEAD \"$base_ref\")\"\nfi\n\ndeclare -a changed_files=()\nwhile IFS= read -r file; do\n  [[ -n \"$file\" ]] && changed_files+=(\"$file\")\ndone < <(git diff --name-only \"$merge_base\")\nwhile IFS= read -r file; do\n  [[ -n \"$file\" ]] && changed_files+=(\"$file\")\ndone < <(git ls-files --others --exclude-standard)\n\nif [[ \"${#changed_files[@]}\" -eq 0 ]]; then\n  echo \"未检测到变更文件，跳过公开仓库增量门禁。\"\n  exit 0\nfi\n\n# 中文注释：强特征机密扫描只报告路径，禁止把命中值写入 Actions 日志。\nsecret_files=\"$(git grep --untracked -l -I -E 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|AKIA[0-9A-Z]{16}|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|sk_live_[A-Za-z0-9]{16,}' -- . || true)\"\nif [[ -n \"$secret_files\" ]]; then\n  echo \"公开仓库检测到疑似真实机密（仅报告文件）：\" >&2\n  printf '  - %s\\n' \"$secret_files\" >&2\n  exit 1\nfi\n\ntodo_word=\"TO\"\"DO\"\nfixme_word=\"FIX\"\"ME\"\nresidual_regex=\"(console\\\\.log\\\\(|debugger;|dbg!\\\\(|todo!\\\\(|unimplemented!\\\\(|\\\\b${todo_word}\\\\b|\\\\b${fixme_word}\\\\b)\"\nversion_regex='([A-Za-z0-9][._:-]v[0-9]+|/(api/)?v[0-9]+|[A-Za-z0-9]_V[0-9]+|schema_version|cache_version|protocol_version|tag[[:space:]]*=[[:space:]]*[\\\"]v[0-9]+)'\ndeclare -a residual_hits=()\ndeclare -a version_hits=()\ndeclare -a lint_hits=()\ndeclare -a insecure_transport_hits=()\n\nis_code_file() {\n  case \"$1\" in\n    *.rs|*.dart|*.ts|*.tsx|*.js|*.jsx|*.mjs|*.sh|*.py|*.sql|*.swift|*.kt|*.kts) return 0 ;;\n    *) return 1 ;;\n  esac\n}\n\nskip_generated_or_vendor() {\n  case \"$1\" in\n    */dist/*|*/build/*|*/target/*|*/node_modules/*|*/GeneratedPluginRegistrant.*|*.g.dart|*.pb.dart|*.pbjson.dart|*.pbenum.dart) return 0 ;;\n    *) return 1 ;;\n  esac\n}\n\nhas_chinese_comment() {\n  # 中文注释：Unicode Script=Han 不依赖 runner 的本地排序规则，避免 grep 把汉字端点判为非法范围。\n  node -e 'const fs = require(\"node:fs\"); process.exit(/(?:\\/\\/|\\/\\*|\\*|#).*\\p{Script=Han}/u.test(fs.readFileSync(0, \"utf8\")) ? 0 : 1)'\n}\n\nsanitize_version_line() {\n  local line=\"$1\"\n  # 中文注释：只豁免本钱包现用 QR 协议、Android 资源与架构名称、正式 Release Tag。\n  line=\"${line//QR_V1/}\"\n  line=\"${line//QrProtocols.qrV1/}\"\n  line=\"$(printf '%s\\n' \"$line\" | sed -E \\\n    -e 's/drawable-v21(_launch_background\\.xml|\\/launch_background\\.xml)//g' \\\n    -e 's/arm64-v8a//g' \\\n    -e 's/armeabi-v7a//g' \\\n    -e 's/citizenwallet-(ios|android)-v[0-9]+\\.[0-9]+\\.[0-9]+//g')\"\n  printf '%s\\n' \"$line\"\n}\n\nfor file in \"${changed_files[@]}\"; do\n  [[ -f \"$file\" ]] || continue\n  [[ \"$file\" == .github/tatagate/tatagate.mjs || \"$file\" == .github/tatagate/tatagate.json ]] && continue\n  is_code_file \"$file\" || continue\n  skip_generated_or_vendor \"$file\" && continue\n\n  added_lines=\"$(git diff --unified=0 \"$merge_base\" -- \"$file\" | grep -E '^\\+' | grep -vE '^\\+\\+\\+' || true)\"\n  [[ -n \"$added_lines\" ]] || continue\n\n  # 中文注释：第一方新增网络地址只允许 HTTPS/WSS，禁止明文协议及任何降级入口。\n  if printf '%s\\n' \"$added_lines\" | grep -Eq '(http|ws)://'; then\n    # 读取准确源码上下文，只认可真实拒绝型测试，仍扫描同文件其余明文地址。\n    if ! node --input-type=module - \"$file\" \"$flow_root\" <<'TRANSPORT'\nimport { readFileSync } from 'node:fs';\nimport { pathToFileURL } from 'node:url';\nconst [path, flow] = process.argv.slice(2);\nconst { insecureTransportLines } = await import(pathToFileURL(flow + '/tatagate.mjs'));\nprocess.exitCode = insecureTransportLines(path, readFileSync(path, 'utf8')).length ? 1 : 0;\nTRANSPORT\n    then insecure_transport_hits+=(\"${file}: 本次新增内容使用明文网络协议\"); fi\n  fi\n\n  # 中文注释：只拦本次新增残留；命令行工具的结果输出不是浏览器调试日志。\n  # scripts中的Node命令行结果输出不是浏览器调试；其它残留模式仍完整检查。\n  file_residual_regex=\"$residual_regex\"\n  if [[ \"$file\" == scripts/*.mjs || \"$file\" == .github/tatagate/tatagate.mjs ]]; then\n    file_residual_regex=\"(debugger;|dbg!\\(|todo!\\(|unimplemented!\\(|\\b${todo_word}\\b|\\b${fixme_word}\\b)\"\n  fi\n  if [[ \"$file\" != .github/tatagate/tatagate.mjs ]] && printf '%s\\n' \"$added_lines\" | grep -Eq \"$file_residual_regex\"; then\n    if ! node --input-type=module - \"$file\" \"$flow_root\" <<'RETAINED'\nimport { readFileSync } from 'node:fs';\nimport { pathToFileURL } from 'node:url';\nconst [path, flow] = process.argv.slice(2);\nconst {hasFirstPartyTemporaryComments,lexicalParts}=await import(pathToFileURL(flow+'/tatagate.mjs'));\nconst source=readFileSync(path,'utf8'),code=lexicalParts(path,source).code;\nconst commandLine=/^scripts\\/.*\\.mjs$/u.test(path)||path===\".github/tatagate/tatagate.mjs\";\nprocess.exitCode=hasFirstPartyTemporaryComments(path,source)||/(?:debugger\\s*;|dbg!\\s*\\(|todo!\\s*\\(|unimplemented!\\s*\\()/u.test(code)||(!commandLine&&/\\bconsole\\s*\\.\\s*log\\s*\\(/u.test(code))?1:0;\nRETAINED\n    then residual_hits+=(\"${file}: 本次新增内容含开发残留\"); fi\n  fi\n\n  # 一次读取准确源文判定拒绝断言，再对整批新增行清理上游/既定标识，避免逐行启动外部进程。\n  # 通过stdin传入整批新增内容，不以超长argv或旁路文件承载源码。\n  protocol_lines=\"$(printf '%s\\n' \"$added_lines\" | node --input-type=module -e '\nimport { readFileSync } from \"node:fs\";\nimport { pathToFileURL } from \"node:url\";\nconst [flow, path] = process.argv.slice(1);\nconst { protocolAssertionLines } = await import(pathToFileURL(flow + \"/tatagate.mjs\"));\nconst allowed = new Set(protocolAssertionLines(path, readFileSync(path, \"utf8\")));\nprocess.stdout.write(readFileSync(0, \"utf8\").split(\"\\n\")\n  .filter(line => !allowed.has(line.replace(/^\\+/u, \"\"))).join(\"\\n\"));\n' \"$flow_root\" \"$file\")\"\n  sanitized=\"$(sanitize_version_line \"$protocol_lines\")\" || { echo \"协议归属扫描执行失败\" >&2; exit 1; }\n  if printf '%s\\n' \"$sanitized\" | grep -Eq \"$version_regex\"; then\n    version_hits+=(\"${file}: 新增非 QR_V1 的一方版本化标识\")\n  fi\n\n  if [[ \"$file\" == *.rs ]] && printf '%s\\n' \"$added_lines\" | grep -Eq '#!?\\[allow\\((dead_code|unused)'; then\n    if ! printf '%s\\n' \"$added_lines\" | has_chinese_comment; then\n      lint_hits+=(\"${file}: 新增编译器抑制但没有中文理由\")\n    fi\n  fi\ndone\n\nif [[ \"${#insecure_transport_hits[@]}\" -gt 0 ]]; then\n  echo \"检测到禁止的明文网络协议：\" >&2\n  printf '  - %s\\n' \"${insecure_transport_hits[@]}\" >&2\n  exit 1\nfi\nif [[ \"${#residual_hits[@]}\" -gt 0 ]]; then\n  echo \"检测到开发残留：\" >&2\n  printf '  - %s\\n' \"${residual_hits[@]}\" >&2\n  exit 1\nfi\nif [[ \"${#version_hits[@]}\" -gt 0 ]]; then\n  echo \"检测到非 QR_V1 的一方版本化标识：\" >&2\n  printf '  - %s\\n' \"${version_hits[@]}\" >&2\n  exit 1\nfi\nif [[ \"${#lint_hits[@]}\" -gt 0 ]]; then\n  echo \"检测到缺少中文理由的编译器抑制：\" >&2\n  printf '  - %s\\n' \"${lint_hits[@]}\" >&2\n  exit 1\nfi\n\necho \"公民产品公开仓库门禁通过。\"\n";
export function checkGuardrails(root, env, execute) {
  const result = execute(env.PRODUCT_BASH_BIN, ['--noprofile','--norc','-s'], { cwd: root,
    env: { ...env, TATAGATE_DIRECTORY: gateDirectory, PATH: dirname(process.execPath) + ':' + env.PATH },
    input: guardrailsSource, stdio: ['pipe','inherit','inherit'] });
  if (result.error || result.signal || result.status !== 0) fail('产品增量防护未通过');
}

function platformContent(path,source) {
  if (path==='.github/tatagate/tatagate.json') {
    try { const value=JSON.parse(source);value.platform_forbidden_values=[];return JSON.stringify(value); }
    catch { return source; }
  }
  if (path!=='scripts/build.mjs') return source;
  // 只处理本仓资源声明的官方归档字段及核验后的原补丁上下文；其它内容完整扫描。
  const declarations=[...source.matchAll(/^const toolDefinitions=(\[.*\]);$/gmu)];
  if (declarations.length!==1) return source;
  const [declaration]=declarations;
  try {
    const tools=JSON.parse(declaration[1]);
    // 规范字面量回读阻断重复键、转义伪装和歧义，不能让解析丢失的文本逃过扫描。
    if (!Array.isArray(tools)||JSON.stringify(tools)!==declaration[1]) return source;
    const flutter=tools.filter(tool=>tool?.id==='flutter');
    if (flutter.length!==1) return source;
    const tool=flutter[0],archive=tool.archive;
    if (!/^\d+\.\d+\.\d+$/u.test(tool.version)
      ||tool.source!=='https://storage.googleapis.com/flutter_infra_release/releases/releases_macos.json'
      ||archive?.root!=='flutter'||archive.executable!=='bin/flutter') return source;
    const expected='https://storage.googleapis.com/flutter_infra_release/releases/stable/macos/flutter_'
      +['macos','arm64'].join('_')+'_'+tool.version+'-stable.zip';
    if (archive.url!==expected) return source;
    archive.url='';
    const text=source.slice(0,declaration.index)+'const toolDefinitions='+JSON.stringify(tools)+';'
      +source.slice(declaration.index+declaration[0].length);
    // 只识别唯一规范补丁字面量；整段补丁仍扫描，重复、转义及结构歧义不豁免。
    const patches=[...text.matchAll(/^const flutterPatch=(".*");$/gmu)];
    if (patches.length!==1) return text;
    const [literal]=patches,patch=JSON.parse(literal[1]),metadata=tool.patch;
    const reference=/^https:\/\/github\.com\/flutter\/flutter\/commit\/([0-9a-f]{40})$/u.exec(metadata?.source||'');
    if (typeof patch!=='string'||JSON.stringify(patch)!==literal[1]
      ||!metadata||Object.keys(metadata).sort().join('\0')!=='path\0sha256\0source'
      ||metadata.path!=='flutter.patch'||!/^[0-9a-f]{64}$/u.test(metadata.sha256)||!reference
      ||!patch.startsWith('# Flutter Android new DSL — fixed source '+reference[1]+'\n')
      ||createHash('sha256').update(patch).digest('hex')!==metadata.sha256) return text;
    // 仅移除已核对官方文件的原上下文注释；新增行、其它上下文与产品旧名称继续拒绝。
    const file='packages/flutter_tools/lib/src/isolated/native_assets/macos/native_assets_host.dart';
    const comment=' /// ios device or '+['macos','arm64'].join(' ')+'.';
    const context='--- a/'+file+'\n+++ b/'+file+'\n@@ -66,7 +66,8 @@\n'+comment
      +'\n Future<void> lipoDylibs(File target, List<File> sources) async {\n'
      +'   final RunResult lipoResult = await globals.processUtils.run(<String>[\n';
    if (patch.split(context).length!==2) return text;
    const scanned=patch.replace(context,context.replace(comment,''));
    return text.slice(0,literal.index)+'const flutterPatch='+JSON.stringify(scanned)+';'
      +text.slice(literal.index+literal[0].length);
  } catch { return source; }
}

// 平台命名闭集只来自本仓门禁合同，不读取其它产品或私有资料。
export function validatePlatformNaming(root) {
  const values = contract.platform_forbidden_values;
  if (!Array.isArray(values) || !values.length || values.some(v => typeof v !== 'string' || !v)
    || new Set(values).size !== values.length) fail('门禁平台禁用值登记无效');
  for (const path of currentFiles(root)) {
    if (ignoredPrefixesFor(contract.repository).some(prefix => path.startsWith(prefix))
) continue;
    if (values.slice(1).some(value => path.toLowerCase().includes(value.toLowerCase()))) fail('产品存在禁用平台目录：' + path);
    const text = platformContent(path, readFileSync(resolve(root,path),'utf8')).toLowerCase();
    if (values.some(value => text.includes(value.toLowerCase()))) fail('产品存在禁用平台命名：' + path);
  }
}

// 提交中的本仓合同是唯一门禁执行登记；工作目录仅承接当前门禁的中间物。
const gateDirectory = dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(readFileSync(resolve(gateDirectory, 'tatagate.json'), 'utf8'));
export function gateContract(value = contract) {
  const contract = value;
  exactKeys(contract, ['schema','repository','github_repository','workflows','node_tests','checks','tools','platform_forbidden_values','functions'], '本仓塔塔门禁');
  if (contract.github_repository !== "crcfrcn/citizenwallet") fail('本仓组织与仓库登记不符');
  if (contract.schema !== 1 || contract.repository !== 'citizenwallet'
    || !Array.isArray(contract.workflows) || !Array.isArray(contract.node_tests)
    || !Array.isArray(contract.checks) || contract.node_tests.length === 0
    || new Set(contract.node_tests).size !== contract.node_tests.length
    || new Set(contract.workflows).size !== contract.workflows.length) fail('本仓塔塔门禁登记无效');
  for (const file of contract.node_tests) {
    if (!/^(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+\.mjs$/u.test(file)
      || file.split('/').some(v => ['', '.', '..'].includes(v))) fail('门禁测试路径无效');
  }
  const allowed = ['repository-contracts','cross-platform-contracts'];
  if (contract.checks.some(id => !allowed.includes(id)) || new Set(contract.checks).size !== contract.checks.length) fail('本仓门禁检查闭集无效');
    exactKeys(contract.tools, ['node','actionlint','rust'], '门禁工具');
  if (contract.tools.node !== '25.2.1' || contract.tools.actionlint !== '1.7.12'
    || contract.tools.rust !== null) fail('门禁工具版本无效');
  if (contract.workflows.some(file => !/^release-[a-z][a-z0-9-]*[.]yml$/u.test(file))) fail('本仓目标入口登记无效');
  if (!Array.isArray(contract.platform_forbidden_values) || !contract.platform_forbidden_values.length
    || contract.platform_forbidden_values.some(v => typeof v !== 'string' || !v)
    || new Set(contract.platform_forbidden_values).size !== contract.platform_forbidden_values.length) fail('门禁平台禁用值登记无效');
  const expectedChecks = ['repository-contracts','cross-platform-contracts'];
  if (contract.checks.join('\0') !== expectedChecks.join('\0')) fail('本仓实际检查合同缺失或扩大');
  validateFunctionalContract(contract.functions);
  if(JSON.stringify(contract.functions.filter(item=>item.runner==='node').map(item=>item.path).sort())!==JSON.stringify([...contract.node_tests].sort()))fail('本仓功能Node入口与正式测试集合不一致');
  return contract;
}

// GitHub队列语义在此严格检查；锁定检查器只排除官方queue字段及xcode-27标签两项已知误报。
export function validateWorkflowSource(source, filename, repository = contract.repository) {
  const match = /^release-([a-z][a-z0-9-]*)\.yml$/u.exec(filename);
  if (!match || !source.includes('name: ' + repository + '.' + match[1] + '\n')
    || !/^\s*workflow_dispatch:/mu.test(source) || /^\s*(?:push|pull_request|workflow_run):/mu.test(source)
    || !/^  queue: max$/mu.test(source) || !/^  cancel-in-progress: false$/mu.test(source)
    || (source.match(/^\s*queue:/gmu)||[]).length!==1
    || !source.includes('group: "${{ github.repository }}-' + match[1] + '"')
    || !/^  cleanup:/mu.test(source) || !source.includes('always()')
    || !source.includes('.github/workflows/release-' + match[1] + '.mjs')) fail('本目标Workflow入口或最后处理无效');
  const flow=source.split('\n  flow:\n')[1]?.split('\n  publish:\n')[0],entry=`release-${match[1]}.mjs`;
  const setup=flow?.indexOf('uses: actions/setup-node@'),job=flow?.indexOf(`run: node .github/workflows/${entry} job`);
  const steps=flow?[...flow.matchAll(new RegExp('run: node "\\$GITHUB_WORKSPACE/\\.github/workflows/'+entry.replace('.','\\.')+'" step (\\d+)','gu'))].map(row=>Number(row[1])):[];
  const expected=match[1]==='ios'?10:match[1]==='android'?11:0;
  if(!flow||setup<0||job<setup||!expected||steps.length!==expected
    ||steps.some((value,index)=>value!==index+1)||flow.indexOf(' step 1')<job)fail('本目标Node装载、任务初始化或步骤顺序无效');
  return filename;
}



export function validateWorkflow(root) {
  const directory = resolve(root, '.github/workflows');
  const expected = contract.workflows.flatMap(file => [file, file.replace(/\.yml$/u, '.mjs')]).sort();
  const entries = readdirSync(directory, { withFileTypes: true });
  if (entries.some(entry => !entry.isFile() || lstatSync(resolve(directory, entry.name)).isSymbolicLink())
    || entries.map(entry => entry.name).sort().join('\0') !== expected.join('\0')) fail('本仓目标文件集合不符');
  for (const filename of contract.workflows) validateWorkflowSource(readFileSync(resolve(directory, filename), 'utf8'), filename);
  return contract.workflows.map(filename => '.github/workflows/' + filename);
}



// 路径、源码与测试只消费自身提交；临时目录不能在源码里，也不能复用别仓或别次任务。
function environment(root, work) {
  // 只传真实执行所需的基础环境与Runner身份；其它产品根、私有状态与任何凭据均不继承。
  const names=['HOME','USER','LOGNAME','LANG','LC_ALL','PATH','RUSTUP_HOME','RUSTUP_TOOLCHAIN',
    'GITHUB_ACTIONS','GITHUB_WORKSPACE','GITHUB_SHA','GITHUB_EVENT_NAME','GITHUB_REF',
    'GITHUB_WORKFLOW','GITHUB_JOB','GITHUB_REPOSITORY','RUNNER_TOOL_CACHE','RUNNER_TEMP',
    'GITHUB_RUN_ID','GITHUB_RUN_ATTEMPT'];
  const result=Object.fromEntries(names.filter(name=>typeof process.env[name]==='string').map(name=>[name,process.env[name]]));
  Object.assign(result,{ TMPDIR:resolve(work,'tmp'),CARGO_HOME:resolve(work,'cargo-home'),
    CARGO_TARGET_DIR:resolve(work,'cargo'),CARGO_INCREMENTAL:'0' });
  result[contract.repository.toUpperCase()+'_ROOT']=root;
  mkdirSync(result.TMPDIR,{recursive:true});
  return result;
}
export async function executeGate({ root, baseSHA, headSHA, work, actionlint, cargo, resourceReceipt, signal }, { execute = spawnSync, report = console.log } = {}) {
  gateContract();
  if(!resourceReceipt)fail('本仓门禁缺少所属资源的完整交付');
  const resourceEnvironment=await verifyGateResourceDelivery(resourceReceipt);
  if(actionlint!==resourceEnvironment.TATAGATE_ACTIONLINT||cargo!==resourceEnvironment.CARGO)fail('本仓检查器或Cargo未绑定准确资源交付');
  Object.assign(process.env,resourceEnvironment);
  if (process.version !== 'v' + contract.tools.node) fail('塔塔门禁必须使用本仓登记的唯一Node版本');
  validateRepositoryIdentity(root, { remote: process.env.GITHUB_ACTIONS === 'true' });
  validateRange({ root, baseSHA, headSHA });
  validateNodeInventory(currentFiles(root), contract.node_tests);
  validateFunctionalInventory(root);
  if (!isAbsolute(work) || realpathSync(work) !== work || !lstatSync(work).isDirectory()
    || lstatSync(work).isSymbolicLink() || work === root || !work.startsWith(resolve(root,'target') + '/')
    || root.startsWith(work + '/') || readdirSync(work).length !== 0) fail('门禁独占临时目录边界无效');
  const before = git(root, ['status','--porcelain=v1','--untracked-files=all']);
  if (before.trim()) fail('本仓门禁只接受干净的已保存提交');
  const env = {...environment(root, work),...resourceEnvironment};
  env.TMPDIR=resolve(work,'tmp');mkdirSync(env.TMPDIR,{recursive:true});
  env.BASE_SHA = baseSHA; env.BASE_REF = baseSHA;
  env.TATAGATE_WORK_DIR = work;
  env.TATAGATE_REPOSITORY_ROOT = root;

  const run = async (command, args, label, cwd=root) => {
    signal?.throwIfAborted();
    if(execute===spawnSync){return runResourceProcess(command,args,{cwd,env,signal,timeout:3_600_000,maxBuffer:64*1024**2});}
    else{const result=execute(command,args,{cwd,env,stdio:'inherit'});if(result.error||result.signal||result.status!==0)fail('本仓塔塔门禁失败：'+label);return result;}
    signal?.throwIfAborted();
  };
  assertNoProductOutputDirectories(root, contract.repository);
  validateProductDocuments(root);
  checkChangeEvidence(root,baseSHA,headSHA);
  validateSecrets(root);
  validatePlatformNaming(root);
  checkGuardrails(root, env, execute);
  await validateQuality(root, baseSHA, headSHA, contract.repository);
  const workflowFiles = validateWorkflow(root);
  if (!isAbsolute(String(actionlint || '')) || !lstatSync(actionlint).isFile()
    || lstatSync(actionlint).isSymbolicLink()) fail('Workflow检查器必须是已验真的准确执行器');
  const version = execute(actionlint, ['-version'], { cwd: root, env, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
  if (version.error || version.signal || version.status !== 0
    || !new RegExp('(?:^|\\s)v?' + contract.tools.actionlint.replaceAll('.', '\\.') + '(?:\\s|$)', 'u').test(version.stdout)) fail('Workflow检查器版本不符');
  // 不调用PATH中的可选外部分析器；Shell与JSON/MJS仍由下面的真实语法检查逐文件验真。
  await run(resourceEnvironment.TATAGATE_ACTIONLINT, ['-shellcheck=', '-pyflakes=', '-ignore', '^unexpected key "queue" for "concurrency" section[.]', '-ignore', '^label "xcode-27" is unknown[.]', ...workflowFiles], 'Workflow语法');
  validateSyntax(root, execute, env, contract.repository);
  for (const relative of contract.node_tests) {
    const path = resolve(root, relative), info = lstatSync(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size === 0) fail('本仓真实测试文件缺失');
  }
  report(contract.repository + ' · 本机/GitHub共用塔塔门禁');
  const languageView=ownedLanguageTests(root).length?await (await import('../../scripts/build.mjs')).gateLanguageView(resolve(resourceReceipt.work,'language-source'),resourceReceipt,{signal}):null;
  await prepareNodeDependencyViews(root,work,env,run);
  env.TATAGATE_NODE_TESTS = JSON.stringify([resolve(gateDirectory, 'tatagate.mjs'), ...contract.node_tests.map(path => resolve(root, path))]);
  await run(process.execPath, ['--test', '--test-concurrency=1', '--test-reporter=' + resolve(gateDirectory, 'tatagate.mjs'),
    resolve(gateDirectory, 'tatagate.mjs'), ...contract.node_tests.map(path => resolve(root, path))], '所属仓真实合同测试');
  await executeLanguageTests(root,work,resourceReceipt,env,run,languageView,signal);
  if (contract.checks.includes('dependency-contracts')) await checkDependencies(root, { execute, report, env });
  if (contract.checks.includes('cross-platform-contracts')) await checkCrossPlatform(root, { report });
  if (contract.checks.includes('shared-contracts')) {
    if (!isAbsolute(String(cargo || '')) || !lstatSync(cargo).isFile()) fail('链门禁缺少登记的准确Cargo');
    const cargoVersion = execute(cargo, ['--version'], { cwd: root, env, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
    if (cargoVersion.error || cargoVersion.signal || cargoVersion.status !== 0
      || !/^cargo 1\.97\.1(?:\s|$)/u.test(cargoVersion.stdout)) fail('链门禁Cargo版本不符');
    env.PATH = dirname(cargo) + ':' + env.PATH;
    await run(cargo, ['fmt','--all','--','--check'], 'Rust格式');
    await run(cargo, ['clippy','--workspace','--all-targets','--locked','--','-D','warnings'], 'RustClippy');
    await run(cargo, ['test','--workspace','--all-targets','--locked'], 'Rust工作区测试');
  }

  assertNoProductOutputDirectories(root, contract.repository);
  if (git(root, ['status','--porcelain=v1','--untracked-files=all']) !== before) fail('门禁执行改动了所属提交源码');
  validateFunctionalCompletion(root,headSHA,work);
  return Object.freeze({ repository: contract.repository, base_sha: baseSHA, head_sha: headSHA });
}

// Npm实际安装位于独占门禁视图；根源码、原始锁与任何邻仓保持只读。
async function prepareNodeDependencyViews(root,work,env,run){
 const declaration=(await import('../../scripts/build.mjs')).contract;
 const locks=[...new Set([...Object.values(declaration.platforms).flatMap(platform=>platform.locks).filter(lock=>lock.ecosystem==='npm'&&!lock.source_package).map(lock=>lock.path),...contract.functions.filter(item=>['vitest','node-entry'].includes(item.runner)).map(item=>item.target==='.'?'package-lock.json':item.target+'/package-lock.json')])];
 if(!locks.length)return;
 const {writeFileSync,symlinkSync}=await import('node:fs'),views=[];
 for(const [index,relative]of locks.entries()){
  const packageRoot=dirname(resolve(root,relative)),view=resolve(work,'node-dependencies',String(index));mkdirSync(view,{recursive:true});
  for(const name of ['package.json','package-lock.json']){const input=resolve(packageRoot,name);if(!lstatSync(input).isFile()||lstatSync(input).isSymbolicLink())fail('本仓Node锁定输入不完整');symlinkSync(input,resolve(view,name));}
  const npm=resolve(dirname(env.PRODUCT_NODE_BIN),'npm');
  await run(env.PRODUCT_NODE_BIN,[npm,'ci','--prefix',view,'--offline','--ignore-scripts','--no-audit','--no-fund'],'本仓Node锁定依赖');
  views.push({source:pathToFileURL(packageRoot+'/').href,project:pathToFileURL(resolve(view,'package.json')).href});
 }
 const hook=resolve(work,'node-resolve.mjs');
 writeFileSync(hook,'import {registerHooks,isBuiltin} from "node:module";\nconst views='+JSON.stringify(views)+';\nregisterHooks({resolve(specifier,context,next){const view=views.filter(view=>context.parentURL?.startsWith(view.source)).sort((a,b)=>b.source.length-a.source.length)[0];if(view&&!context.parentURL.includes("/node_modules/")&&!isBuiltin(specifier)&&!/^(?:[./]|[A-Za-z][A-Za-z0-9+.-]*:)/u.test(specifier))return next(specifier,{...context,parentURL:view.project});return next(specifier,context);}});\n',{flag:'wx'});
 env.NODE_OPTIONS='--import='+hook;
}


async function repositoryGateDispatch(args,signal) {
  const [mode, root, baseSHA, headSHA, work] = args;
  if (mode === 'physical' && args.length === 2) {
    if (realpathSync(root) !== root) fail('本仓物理根必须真实');
    assertNoProductOutputDirectories(root, contract.repository);
    return;
  }
  if (mode === 'local' && args.length === 5) {
    const resourceWork=fixedWork('test');
    validateGateRequestWork(root,work);
    const resourceReceipt=await prepareGateResources(resourceWork,{signal});
    const executionWork=resourceWork;
    return executeGate({root,baseSHA,headSHA,work:executionWork,resourceReceipt,signal,
      actionlint:resourceReceipt.environment.TATAGATE_ACTIONLINT,cargo:resourceReceipt.environment.CARGO});
  }

  fail('本仓塔塔门禁参数或身份无效');
}

// 取消只产生失败；长进程交由所属产品确认整个进程组退出后才允许清理。
export async function repositoryGateMain(args){
 const controller=new AbortController(),cancel=()=>controller.abort(Error('门禁取消即失败'));
 for(const name of ['SIGTERM','SIGINT'])process.once(name,cancel);
 try{const result=await (args[0]==='physical'?repositoryGateDispatch(args,controller.signal):withFixedWork('test',()=>repositoryGateDispatch(args,controller.signal)));controller.signal.throwIfAborted();return result;}
 finally{for(const name of ['SIGTERM','SIGINT'])process.removeListener(name,cancel);}
}

if (!gateTestEntry && process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { await repositoryGateMain(process.argv.slice(2)); }
  catch (error) {
    // 仅输出门禁固定诊断或本地受控路径；不得透传网络响应、子进程异常或凭据。
    console.error(error?.message?.startsWith('本仓') || error?.message?.startsWith('产品')
      || error?.message?.startsWith('门禁') || error?.message?.startsWith('公开')
      || error?.message?.startsWith('金标') || error?.message?.startsWith('链门禁')
      ? error.message : '所属仓塔塔门禁失败，请检查以上准确检查项，未放行推送。');
    process.exitCode = 1;
  }
}

// 完整语言执行结果单独验收，声明了入口或零退出码不足以证明实际非空执行。
export function validateLanguageResult(kind,source){
 if(kind==='vitest'){
  const data=JSON.parse(source);if(data.success!==true||!Number.isSafeInteger(data.numTotalTests)||data.numTotalTests<=0||data.numPassedTests!==data.numTotalTests||data.numFailedTests!==0||data.numPendingTests!==0||data.numTodoTests!==0)fail('本仓Vitest测试未完整执行成功');return true;
 }
 if(kind==='flutter'){
  let done=false,passed=0;
  for(const line of source.split(/\r?\n/u)){if(!line.startsWith('{'))continue;let event;try{event=JSON.parse(line);}catch{continue;}
   if(event.type==='error')fail('本仓Flutter测试失败');
   if(event.type==='testDone'){if(event.result!=='success'||event.skipped)fail('本仓Flutter测试失败或跳过');if(!event.hidden)passed++;}
   if(event.type==='done'){if(done||event.success!==true)fail('本仓Flutter最终回执无效');done=true;}
  }if(!done||passed===0)fail('本仓Flutter缺少非空完整执行结果');return true;
 }
 if(kind==='cargo'){
  const results=[...source.matchAll(/test result: ok\. (\d+) passed; (\d+) failed; (\d+) ignored;/gu)];
  if(!results.length||results.some(row=>Number(row[2])!==0||Number(row[3])!==0)||results.reduce((sum,row)=>sum+Number(row[1]),0)===0)fail('本仓Rust测试空执行或存在跳过');return true;
 }
 fail('本仓语言测试类型无效');
}

// 计划消费本仓现有原锁与公开入口，不读取其它产品的当前工作树或main。
export function ownedLanguageTests(root){
 validateFunctionalInventory(root);
 const groups=new Map();
 for(const item of contract.functions){if(item.runner==='node')continue;const key=item.runner+'@'+item.target;if(groups.has(key))continue;
  const plan=item.runner==='cargo'?{kind:'cargo',manifest:item.target}:{kind:'flutter'};
  groups.set(key,plan);
 }
 return [...groups.values()];
}

async function executeLanguageTests(root,work,receipt,env,run,languageView,signal){
 const plans=ownedLanguageTests(root);if(!plans.length)return;
 if(!languageView)fail('本仓语言测试缺少本轮准确工程视图');
 const {view,project}=languageView;
 const originalWork=receipt.work;
 Object.assign(env,await (await import('../../scripts/build.mjs')).prepareGateFunctionalHost(receipt,languageView,{signal,native:false}));
 const call=async(command,args,cwd,label)=>{const result=await run(command,args,label,cwd);if(!result?.stdout&&result?.stdout!=='')fail('本仓语言执行缺少真实输出');return result;};
 for(const plan of plans){
  if(plan.kind==='cargo'){
   const manifest=resolve(view,plan.manifest);if(!existsSync(manifest))fail('本仓Rust测试清单缺少原始manifest');
   const expected=contract.functions.filter(item=>item.runner==='cargo'&&item.target===plan.manifest),files=[];
   for(const name of [...new Set(expected.map(item=>item.package))]){
    const result=await call(env.CARGO,['test','--manifest-path',manifest,'-p',name,'--all-targets','--locked','--offline','--','--color','never'],view,'Rust真实包完整目标测试');
    files.push(...functionalRustCases(result.stdout,expected.filter(item=>item.package===name)));
    await call(env.CARGO,['test','--manifest-path',manifest,'-p',name,'--doc','--locked','--offline'],view,'Rust真实包文档测试');
   }
   writeFunctionalRecord(work,'cargo-'+plan.manifest.replaceAll('/','_'),root,{files});
  }else if(plan.kind==='flutter'){
   Object.assign(env,await (await import('../../scripts/build.mjs')).prepareGateFunctionalHost(receipt,languageView,{signal}));
   env.TMPDIR=resolve(originalWork,'tmp');env.XDG_CONFIG_HOME=resolve(originalWork,'flutter-config');mkdirSync(env.XDG_CONFIG_HOME,{recursive:true});
   await call(env.FLUTTER,['pub','get','--offline','--enforce-lockfile'],project,'Flutter原锁依赖解析');
   await call(env.FLUTTER,['analyze','--no-pub'],project,'Flutter实际静态检查');
   const result=await call(env.FLUTTER,['test','--no-pub','--machine'],project,'Flutter完整测试');
   validateLanguageResult('flutter',result.stdout);
   const expected=contract.functions.filter(item=>item.runner==='flutter');
   const files=functionalFiles('flutter',result.stdout,expected.map(item=>item.path),[root,originalWork]);
   writeFunctionalRecord(work,'flutter-flutter',root,{files});
  }else {fail('本仓未声明的语言测试类型');
  }
 }
}

// 同一提交范围必须包含所属资料和真实回归变化；空白调整不能作为同步证据。
export function validateChangeEvidence(paths,documents,{changed=()=>true,changedTests=()=>false}={}){
 if(!Array.isArray(paths)||!Array.isArray(documents))fail('本仓资料同步清单无效');
 const implementation=paths.filter(path=>isImplementationPath(path)&&!isTestPath(path)&&!path.startsWith('.github/workflows/'));
 if(!implementation.length)return true;
 if(!documents.some(path=>paths.includes(path)&&changed(path)))fail('本仓实现变化未同步所属根技术文档');
 if(!paths.some(path=>(isTestPath(path)||embeddedNodeTest(path))&&path!=='.github/tatagate/tatagate.mjs'&&changed(path)||path==='.github/tatagate/tatagate.mjs'&&changedTests(path)))fail('本仓实现变化缺少同步真实回归');
 return true;
}
function checkChangeEvidence(root,baseSHA,headSHA){
 const paths=git(root,['diff','--name-only','-z',baseSHA,headSHA]).split('\0').filter(Boolean);
 const changed=path=>{const now=resolve(root,path);if(!existsSync(now)||!lstatSync(now).isFile())return false;let old='';const existed=baseSHA!=='4b825dc642cb6eb9a060e54bf8d69288fbee4904'&&git(root,['ls-tree','--name-only',baseSHA,'--',path]).trim();if(existed)old=git(root,['show',baseSHA+':'+path]);return old.replace(/\s/gu,'')!==readFileSync(now,'utf8').replace(/\s/gu,'');};
 const changedTests=path=>{
  if(path!=='.github/tatagate/tatagate.mjs')return false;
  const now=resolve(root,path);if(!existsSync(now)||!lstatSync(now).isFile())return false;
  const existed=baseSHA!=='4b825dc642cb6eb9a060e54bf8d69288fbee4904'&&git(root,['ls-tree','--name-only',baseSHA,'--',path]).trim();
  const old=existed?git(root,['show',baseSHA+':'+path]):'',tests=gateTestSource(readFileSync(now,'utf8'));
  return tests!==''&&tests.replace(/\s/gu,'')!==gateTestSource(old).replace(/\s/gu,'');
 };
 return validateChangeEvidence(paths,productDocumentNames,{changed,changedTests});
}

// 功能执行映射只索引本仓真实用例；业务字段仍由正式实现定义，不在门禁复刻算法。
export function validateFunctionalContract(functions) {
  if(!Array.isArray(functions)||!functions.length)fail('本仓功能测试映射为空');
  const paths=new Set();
  for(const item of functions){
    const fields=['function','path','runner','target',...(item.runner==='cargo'?['package','cases']:[])];
    exactKeys(item,fields,'本仓功能测试映射');
    if(typeof item.function!=='string'||!item.function||typeof item.path!=='string'
      ||!/^(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/u.test(item.path)
      ||item.path.split('/').some(part=>['','.','..'].includes(part))||paths.has(item.path)
      ||typeof item.target!=='string'||!item.target||item.target!=='.'&&(!/^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/u.test(item.target)||item.target.split('/').some(part=>['.','..'].includes(part)))||!['node','flutter','cargo'].includes(item.runner))fail('本仓功能测试映射无效');
    paths.add(item.path);
    if(item.runner==='cargo'&&(!Array.isArray(item.cases)||!item.cases.length
      ||item.cases.some(name=>typeof name!=='string'||!/^\w+$/u.test(name))||new Set(item.cases).size!==item.cases.length))fail('本仓功能真实用例集合无效');
    if(item.runner==='cargo'&&(!/^[A-Za-z0-9_-]+$/u.test(item.package)||!item.target.endsWith('Cargo.toml')))fail('本仓功能Rust包映射无效');
  }
  return true;
}

// 源码清单与受检提交直接回读；新增测试必须进入本仓门禁，声明本身不能证明执行成功。
function isInlineNodeTest(path,root) {
 if(!path.endsWith('.mjs'))return false;
 const source=lexicalParts(path,readFileSync(resolve(root,path),'utf8')).code;
 return /\bNODE_TEST_CONTEXT\b/u.test(source)&&/\btest\s*\(/u.test(source);
}

export function validateFunctionalInventory(root,functions=contract.functions) {
  validateFunctionalContract(functions);
  const owned=currentFiles(root).filter(path=>(!path.startsWith('.github/')||contract.node_tests.includes(path))&&!functionalIgnoredPrefixes.some(prefix=>path.startsWith(prefix)));
  const expected=new Set();
  for(const path of owned){
    if(embeddedNodeTest(path, root) || /(?:^|\/)(?:test\.mjs|[^/]+[._-](?:test|spec)\.mjs)$/u.test(path)
      ||/(?:^|\/)test\/.*_test\.dart$/u.test(path)||/[._](?:test|spec)\.tsx?$/u.test(path)
      ||/(?:^|\/)test_[^/]+\.py$/u.test(path)||path.startsWith('app/Tests/')&&path.endsWith('.swift'))expected.add(path);
    else if(path.endsWith('.rs')&&/#\[(?:test|(?:tokio|async_std)::test(?:\([^\]]*\))?|rstest)\]\s*(?:#\[[\s\S]*?\]\s*)*(?:pub\s+)?(?:async\s+)?fn\s+\w+\s*\(/u.test(lexicalParts(path,readFileSync(resolve(root,path),'utf8')).code))expected.add(path);
  }
  if(functions.length!==expected.size||functions.some(item=>!expected.has(item.path))){
    const listed=new Set(functions.map(item=>item.path));
    fail('本仓功能测试存在遗漏、失效或重复登记：未登记 '+[...expected].filter(path=>!listed.has(path)).join('、')+'；失效 '+functions.filter(item=>!expected.has(item.path)).map(item=>item.path).join('、'));
  }
  for(const item of functions){
    const file=resolve(root,item.path),info=lstatSync(file);
    if(!info.isFile()||info.isSymbolicLink()||!info.size||realpathSync(file)!==file)fail('本仓功能用例不是准确源码文件');
    if(item.runner==='cargo'){
      const source=lexicalParts(item.path,readFileSync(file,'utf8')).code;
      const cases=[...source.matchAll(/#\[(?:test|(?:tokio|async_std)::test(?:\([^\]]*\))?|rstest)\]\s*(?:#\[[\s\S]*?\]\s*)*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*\(/gu)].map(row=>row[1]);
      if(JSON.stringify(cases)!==JSON.stringify(item.cases))fail('本仓Rust功能用例变动未同步登记');
      let directory=dirname(file),text='';while(directory.startsWith(root+'/')){const manifest=resolve(directory,'Cargo.toml');if(existsSync(manifest)){text=readFileSync(manifest,'utf8');break;}directory=dirname(directory);}if(!text&&existsSync(resolve(root,'Cargo.toml')))text=readFileSync(resolve(root,'Cargo.toml'),'utf8');
      if(!new RegExp('^name\\s*=\\s*"'+item.package+'"','m').test(text))fail('本仓Rust功能用例与所属包不符');
    }
  }
  return functions;
}

// 证据只接受本次门禁工作根中的独占普通文件；同仓同SHA绑定，不接受历史成功回执。
export function writeFunctionalRecord(work,kind,root,detail) {
  if(!isAbsolute(work)||realpathSync(work)!==work||!lstatSync(work).isDirectory())fail('本仓功能回执工作目录无效');
  exactKeys(detail,['files'],'本仓功能回执明细');
  const name=kind.replaceAll('/','_');
  if(!/^[A-Za-z0-9_.-]+$/u.test(name))fail('本仓功能回执类型无效');
  const file=resolve(work,'functions-'+name+'.json');
  const value={schema:1,repository:contract.repository,head_sha:git(root,['rev-parse','HEAD']).trim(),kind,...detail};
  const fs=process.getBuiltinModule('node:fs');fs.writeFileSync(file,JSON.stringify(value),{flag:'wx',mode:0o600});
  return value;
}
export function functionalRecord(work,kind,root,headSHA) {
  const file=resolve(work,'functions-'+kind.replaceAll('/','_')+'.json'),info=lstatSync(file,{throwIfNoEntry:false});
  if(!info?.isFile()||info.isSymbolicLink()||realpathSync(file)!==file||info.size>64*1024**2)fail('本仓功能执行回执缺失或越界');
  const value=JSON.parse(readFileSync(file,'utf8'));
  exactKeys(value,['schema','repository','head_sha','kind','files'],'本仓功能执行回执');
  if(value.schema!==1||value.repository!==contract.repository||value.head_sha!==headSHA||value.kind!==kind||git(root,['rev-parse','HEAD']).trim()!==headSHA)fail('本仓功能执行回执身份不符');
  return value;
}

// Flutter/Vitest从实际套件路径回读逐文件完成情况；零退出码、总数非空或加载事件都不足以放行。
export function functionalFiles(kind,source,expected,roots) {
  const counts=new Map(expected.map(path=>[path,0]));
  const own=path=>{
    if(typeof path!=='string')fail('本仓功能运行缺少真实套件路径');
    const actual=path.startsWith('file:')?fileURLToPath(path):path;
    if(!isAbsolute(actual)||!roots.some(root=>actual.startsWith(resolve(root)+'/')))fail('本仓功能套件来源越界');
    const matching=expected.filter(path=>actual.endsWith('/'+path));
    if(matching.length!==1)fail('本仓功能运行出现未登记或歧义套件');return matching[0];
  };
  if(kind==='vitest'){
    const value=JSON.parse(source);validateLanguageResult('vitest',source);
    if(!Array.isArray(value.testResults))fail('本仓Vitest缺少逐文件结果');
    for(const suite of value.testResults){const path=own(suite.name);
      if(counts.get(path)!==0||!Array.isArray(suite.assertionResults)||!suite.assertionResults.length||suite.assertionResults.some(test=>test.status!=='passed'))fail('本仓Vitest套件为空、重复或未成功');counts.set(path,suite.assertionResults.length);}
  }else if(kind==='flutter'){
    validateLanguageResult('flutter',source);const suites=new Map(),tests=new Map(),done=new Set();
    for(const line of source.split(/\r?\n/u)){if(!line.startsWith('{'))continue;let event;try{event=JSON.parse(line);}catch{continue;}
      if(event.type==='suite'){if(suites.has(event.suite.id))fail('本仓Flutter套件重复');suites.set(event.suite.id,event.suite.path);}
      if(event.type==='testStart'){if(tests.has(event.test.id))fail('本仓Flutter用例重复');tests.set(event.test.id,event.test);}
      if(event.type==='testDone'){const test=tests.get(event.testID);if(event.hidden||test?.hidden)continue;if(!test||done.has(event.testID))fail('本仓Flutter用例回执不完整');done.add(event.testID);const path=own(suites.get(test.suiteID));counts.set(path,counts.get(path)+1);}
    }
  }else fail('本仓功能逐文件结果类型无效');
  if(!expected.length||[...counts.values()].some(count=>count===0))fail('本仓功能用例文件漏执行');
  return [...counts].map(([path,tests])=>({path,tests}));
}
// 每次结果只绑定一个准确包；同名用例按真实出现次数核对，不能由别包的成功代替。
export function functionalRustCases(source,items) {
 validateLanguageResult('cargo',source);
 if(!items.length||new Set(items.map(item=>item.package)).size!==1)fail('本仓Rust结果须绑定一个准确包');
 const actual=new Map();for(const row of source.matchAll(/^test\s+(\S+)\s+\.\.\.\s+ok\s*$/gmu)){const name=row[1].split('::').at(-1);actual.set(name,(actual.get(name)||0)+1);}
 const required=new Map();for(const item of items)for(const name of item.cases)required.set(name,(required.get(name)||0)+1);
 if([...required].some(([name,count])=>(actual.get(name)||0)<count))fail('本仓Rust功能用例漏执行');
 return items.map(item=>({path:item.path,cases:item.cases}));
}

export function validateFunctionalCompletion(root,headSHA,work) {
 const groups=new Map();for(const item of contract.functions){const key=item.runner==='node'?'node':item.runner+'-'+item.target.replaceAll('/','_')+(item.runner==='python'?'-'+item.path.replaceAll('/','_'):'');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);}
 for(const [key,items]of groups){const result=functionalRecord(work,key,root,headSHA);
  if(!Array.isArray(result.files)||new Set(result.files.map(file=>file.path)).size!==result.files.length)fail('本仓功能文件结果为空或重复');
  if(key==='node'){
   const expected=[resolve(root,'.github/tatagate/tatagate.mjs'),...items.map(item=>resolve(root,item.path))];
   if(result.files.length!==expected.length||result.files.some(file=>!expected.includes(file.path)||!successfulTestSummary({success:true,counts:file.counts})))fail('本仓功能Node文件漏执行或不完整');
  }else if(result.files.length!==items.length||items.some(item=>!result.files.some(file=>file.path===item.path&&(Number.isSafeInteger(file.tests)&&file.tests>0||Array.isArray(file.cases)&&JSON.stringify(file.cases)===JSON.stringify(item.cases)))))fail('本仓功能缺少真实逐项完成证据');
 }
 return true;
}

// 保留固定调用参数，只验真调用方协调目录；产品测试不向该目录写入临时状态。
export function validateGateRequestWork(root,work){
 if(root!==resolve(import.meta.dirname,'../..')||work!==fixedWork('test'))fail('本仓门禁只接受本产品target/test固定目录');
 return checkFixedWork(work);
}

// 尾部测试以唯一真实代码边界验真；实现变化不能冒充回归变化。
export function gateTestSource(source) {
 const marker='\n// BEGIN INLINE TESTS\nif(gateTestEntry){\n', end='\n}\n// END INLINE TESTS\n';
 const begin=source.indexOf(marker);
 if(begin<0||source.indexOf(marker,begin+marker.length)>=0||!source.endsWith(end))return '';
 const {code}=lexicalParts('.github/tatagate/tatagate.mjs',source);
 const guard=begin+marker.indexOf('if(');
 if(code.slice(guard,begin+marker.length-1)!=='if(gateTestEntry){'||!/\btest\s*\(/u.test(code.slice(guard)))return '';
 return source.slice(begin);
}

// BEGIN INLINE TESTS
if(gateTestEntry){
const gateTestExports = Object.freeze({validateRange,lexicalParts,commentText,hasFirstPartyTemporaryComments,validateDependencyPlans,validateQuality,validateNodeInventory,validateRepositoryIdentity,successfulTestSummary,validateProductDocuments,assertNoProductOutputDirectories,checkDependencies,hasSecretMaterial,validateSecrets,validateVectorGroup,validateScaleVectors,validatePalletRegistry,readPublicChain,checkCrossPlatform,protocolAssertionLines,insecureTransportLines,checkGuardrails,validatePlatformNaming,gateContract,validateWorkflowSource,validateWorkflow,executeGate,repositoryGateMain,validateLanguageResult,ownedLanguageTests,validateChangeEvidence,validateFunctionalContract,validateFunctionalInventory,writeFunctionalRecord,functionalRecord,functionalFiles,functionalRustCases,validateFunctionalCompletion,validateGateRequestWork,gateTestSource});
const { gateToolInterfaces } = await import('../../scripts/build.mjs');
const { toolEnvironment } = gateToolInterfaces;
const {default: assert} = await import('node:assert/strict');
const {default: test} = await import('node:test');

test('双端Workflow先装载Node并初始化任务，再按准确顺序执行本平台步骤',()=>{
 for(const file of gateContract().workflows){
  const source=readFileSync(new URL('../workflows/'+file,import.meta.url),'utf8');
  assert.equal(validateWorkflowSource(source,file),file);
  const entry=file.replace('.yml','.mjs'),job=`    - run: node .github/workflows/${entry} job\n`;
  const flowAt=source.indexOf('\n  flow:\n');
  assert.throws(()=>validateWorkflowSource(source.replace(job,''),file),/顺序/);
  assert.throws(()=>validateWorkflowSource(source.slice(0,flowAt)+source.slice(flowAt).replace('uses: actions/setup-node@','uses: actions/checkout@'),file),/顺序/);
  assert.throws(()=>validateWorkflowSource(source.replace(`step 2`,`step 1`),file),/顺序/);
 }
});


// 本仓登记必须准确闭合；路径、重复和未知工具版本不得被默默接受。


const group={ keys:['name'],values:['hex'],top:['domain'],complete:true };
const vectors={domain:'GMB',vectors:[{name:'a',hex:'AB'},{name:'b',hex:'CD'}]};
test('金标按语义键归一比较并阻断重复、缺项和漂移', () => {
  assert.equal(validateVectorGroup(vectors,{...vectors,vectors:[{name:'b',hex:'cd'},{name:'a',hex:'ab'}]},group),2);
  for (const mirror of [
    {...vectors,domain:'other'}, {...vectors,vectors:[vectors.vectors[0]]},
    {...vectors,vectors:[vectors.vectors[0],vectors.vectors[0]]},
    {...vectors,vectors:[{name:'a',hex:'EE'},vectors.vectors[1]]},
    {...vectors,vectors:[{name:'a'},vectors.vectors[1]]},
    {...vectors,vectors:[]},
  ]) assert.throws(()=>validateVectorGroup(vectors,mirror,group));
  assert.equal(validateVectorGroup(vectors,{...vectors,vectors:[vectors.vectors[0]]},{...group,complete:false}),1);
});
test('SCALE 本仓镜像逐组核对固定链真源，缺项和漂移均失败',()=>{
 const canonical={compact_u32:[{hex:'00',value:0}],scale_string:[{hex:'00',value:''}],u64_le:[{hex:'0000000000000000',value:0}]};
 assert.equal(validateScaleVectors(canonical,structuredClone(canonical)),true);
 for(const mirror of [{...canonical,scale_string:[]},
  {...canonical,u64_le:[{hex:'0100000000000000',value:1}]},
  {...canonical,compact_u32:null}])assert.throws(()=>validateScaleVectors(canonical,mirror));
});
test('Pallet不得错指、为空或重复',()=>{
  const chain='#[runtime::pallet_index(1)]\n pub type Balances = PalletBalances;\n';
  assert.equal(validatePalletRegistry(chain,'static const int balancesPallet = 1;'),1);
  for (const dart of ['', 'static const int balancesPallet = 2;', 'static const int otherPallet = 1;',
    'static const int balancesPallet = 1;\nstatic const int balancesPallet = 1;']) {
    assert.throws(()=>validatePalletRegistry(chain,dart));
  }
  assert.throws(()=>validatePalletRegistry(chain+chain));
});
test('公开链真源只读准确SHA，拒绝main、网络、重定向、超限及伪造坐标',async()=>{
 const sha='a'.repeat(40),path='runtime/src/lib.rs';
 assert.equal(await readPublicChain(path,sha,async(url,options)=>{
  assert.equal(url,'https://raw.githubusercontent.com/crcfrcn/citizenchain/'+sha+'/'+path);
  assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');assert.equal(options.headers.Authorization,undefined);
  return new Response('source');
 }),'source');
 for(const [path,sha]of [[null,null],['../private','a'.repeat(40)],['runtime/src/lib.rs','main'],['runtime/src/lib.rs','a'.repeat(39)]]){
  await assert.rejects(readPublicChain(path,sha,()=>assert.fail('非法坐标禁止联网')));
 }
 for(const request of [async()=>{throw Error('synthetic network failure');},async()=>new Response('',{status:302}),async()=>new Response('',{status:404}),async()=>new Response(Buffer.alloc(2*1024**2+1)),async()=>new Response(new Uint8Array([255]))])await assert.rejects(readPublicChain(path,sha,request),/准确提交真源读取失败/u);
});

// 用隔离的合成Git提交验证门禁读取真实初始内容；不修改产品仓或调用仓库保存/推送。
test('保留源码不按每文件汉字数量判定，真实第一方临时注释仍拒绝', async () => {
  const [{ mkdtempSync, mkdirSync, writeFileSync, rmSync }, { join }, { testRoot: tmpdir }, { execFileSync }, { validateQuality }] = await Promise.all([
    import('node:fs'), import('node:path'), import('../../scripts/build.mjs'), import('node:child_process'), Promise.resolve(gateTestExports),
  ]);
  const root = mkdtempSync(join(tmpdir(), 'tatagate-quality-'));
  const env = { ...toolEnvironment(), HOME: process.env.HOME, LANG: 'C', LC_ALL: 'C',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
    GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid' };
  const git = (...args) => execFileSync(env.PRODUCT_GIT_BIN, ['-C', root, ...args], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git('init', '--quiet', '--initial-branch=main');
    mkdirSync(join(root, 'test'));
    writeFileSync(join(root, 'test', 'example.test.mjs'), 'export const fixture = true;\n');
    const base = git('hash-object', '-w', '-t', 'tree', '/dev/null');
    for (const [source, rejected] of [
      ['export const value = 1;\n', false],
      ['// Retained implementation explanation.\nexport const value = 1;\n', false],
      ['// Generated file; do not edit.\nexport const value = 1;\n', false],
      ['// HACK: unfinished first-party implementation.\nexport const value = 1;\n', true],
    ]) {
      writeFileSync(join(root, 'source.mjs'), source);
      git('add', '--all');
      const head = git('commit-tree', git('write-tree'), '-m', 'synthetic quality input');
      git('update-ref', 'refs/heads/main', head);
      const run = () => validateQuality(root, base, head, gateContract().repository);
      if (rejected) await assert.rejects(run(), /第一方|产品实现代码保留临时注释/u);
      else await assert.doesNotReject(run());
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// 候选文只作为合成测试数据；准确负向断言可识别，同文伪装和运行地址继续被阻断。
test('协议拒绝断言只归属本仓登记测试中的真实代码', async () => {
  const { protocolAssertionLines } = await Promise.resolve(gateTestExports);
  const path = gateContract().node_tests.find(value => value.endsWith('.mjs'));
  assert.ok(path);
  const statement = ['assert.doesNotMatch(source, /\\/', 'v', '1(?:\\/|\\b)/);'].join('');
  const line = '  ' + statement;
  assert.deepEqual(protocolAssertionLines(path, 'test(() => {\n' + line + '\n});\n'), [line]);
  assert.deepEqual(protocolAssertionLines(path, 'const matcher = /[\"\']+/u;\n' + line + '\n'), [line]);
  for (const source of [
    '/*\n' + line + '\n*/', '`\n' + line + '\n`', JSON.stringify(statement),
    '/*\n' + line + '\n*/\ntest(() => {\n' + line + '\n});',
    statement.replace('doesNotMatch', 'match'), statement.replace('source', 'other'),
    'const endpoint = "https://example.invalid/' + 'v' + '9";',
  ]) assert.deepEqual(protocolAssertionLines(path, source), []);
  assert.deepEqual(protocolAssertionLines('source.mjs', line), []);
  assert.deepEqual(protocolAssertionLines('unregistered.test.mjs', line), []);
});

// 执行本仓真实Shell增量防护，检查CLI/浏览器边界、拒绝断言、真实残留和大输入通道。
test('增量防护从现行门禁文件取得扫描接口，正常源码通过且调试残留失败',async()=>{
 const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs');
 const {join}=await import('node:path');
 const {testRoot}=await import('../../scripts/build.mjs');
 const env={...toolEnvironment(),
  GIT_AUTHOR_NAME:'Fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',
  GIT_COMMITTER_NAME:'Fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid'};
 const root=mkdtempSync(join(testRoot(),'guardrails-current-'));
 const git=(...args)=>execFileSync(env.PRODUCT_GIT_BIN,['-C',root,...args],{env,encoding:'utf8'}).trim();
 try{
  git('init','--quiet','--initial-branch=main');
  writeFileSync(join(root,'README.md'),'fixture\n');git('add','README.md');git('commit','--quiet','-m','base');
  env.BASE_REF=git('rev-parse','HEAD');
  writeFileSync(join(root,'source.mjs'),'export const value = 1;\n');git('add','source.mjs');git('commit','--quiet','-m','normal');
  assert.doesNotThrow(()=>checkGuardrails(root,env,spawnSync));
  writeFileSync(join(root,'source.mjs'),'export const value = 1;\nconsole.log(value);\n');git('add','source.mjs');git('commit','--quiet','-m','debug');
  assert.throws(()=>checkGuardrails(root,env,spawnSync),/增量防护/);
 }finally{rmSync(root,{recursive:true,force:true});}
});

// 本仓target是唯一源码内生成边界；嵌套或链接旁路仍必须拒绝。
test('产品门禁允许自有根target并拒绝嵌套与链接输出', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, unlinkSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { testRoot } = await import('../../scripts/build.mjs');
  const { assertNoProductOutputDirectories, gateContract } = await Promise.resolve(gateTestExports);
  const fixture = mkdtempSync(join(testRoot(), 'target-boundary-'));
  const root = join(fixture, 'source'), target = join(root, 'target');
  mkdirSync(root);
  try {
    mkdirSync(join(target, 'test', 'build'), { recursive: true });
    writeFileSync(join(target, 'test', 'build', 'generated.txt'), 'generated fixture');
    assert.doesNotThrow(() => assertNoProductOutputDirectories(root, gateContract().repository));
    const nested = join(root, 'source', 'target');
    mkdirSync(nested, { recursive: true });
    assert.throws(() => assertNoProductOutputDirectories(root, gateContract().repository), /生成状态目录/u);
    rmSync(join(root, 'source'), { recursive: true });
    rmSync(target, { recursive: true });
    const outside = join(fixture, 'outside'); mkdirSync(outside);
    symlinkSync(outside, target, 'dir');
    assert.throws(() => assertNoProductOutputDirectories(root, gateContract().repository), /生成状态目录/u);
    // 仅移除夹具链接自身，保留指向的普通目录，避免误清理目标。
    unlinkSync(target);
    writeFileSync(target, 'ordinary file');
    assert.throws(() => assertNoProductOutputDirectories(root, gateContract().repository), /生成状态目录/u);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});

// 所属根文档验收只读本仓，负向夹具在本产品target内，不借其它仓库资料。
test('所属根技术文档拒绝缺失、空文件、链接、副本与错误文件类型', async () => {
  const { validateProductDocuments } = await Promise.resolve(gateTestExports);
  const { mkdtempSync, writeFileSync, unlinkSync, symlinkSync, mkdirSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { testRoot } = await import('../../scripts/build.mjs');
  const root = mkdtempSync(join(testRoot(), 'product-documents-'));
  const names = ["CitizenWallet.md"];
  try {
    assert.throws(() => validateProductDocuments(root), /根技术文档/u);
    for (const name of names) writeFileSync(join(root, name), '产品技术文档\n');
    writeFileSync(join(root, 'README.md'), '产品简介\n');
    assert.equal(validateProductDocuments(root), true);
    const file = join(root, names[0]);
    writeFileSync(file, '');
    assert.throws(() => validateProductDocuments(root), /根技术文档/u);
    unlinkSync(file); symlinkSync(join(root, 'README.md'), file);
    assert.throws(() => validateProductDocuments(root), /根技术文档/u);
    unlinkSync(file); mkdirSync(file);
    assert.throws(() => validateProductDocuments(root), /根技术文档/u);
    rmSync(file, { recursive: true }); writeFileSync(file, '产品技术文档\n');
    writeFileSync(join(root, 'Extra.md'), '第二技术文档\n');
    assert.throws(() => validateProductDocuments(root), /额外技术文档/u);
    unlinkSync(join(root, 'Extra.md'));
    const readme = join(root, 'README.md'); unlinkSync(readme); symlinkSync(file, readme);
    assert.throws(() => validateProductDocuments(root), /非空普通原件/u);
    unlinkSync(readme); writeFileSync(readme, '产品简介\n');
    assert.equal(validateProductDocuments(root), true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// 文档迁出后保留同等资料扫描，测试只使用合成材料。
test('根技术文档机密扫描保留正文、令牌和转义快照拒绝', async () => {
  const { hasSecretMaterial } = await Promise.resolve(gateTestExports);
  const header = type => '-----BEGIN ' + type + 'PRIVATE KEY-----';
  const footer = type => '-----END ' + type + 'PRIVATE KEY-----';
  for (const type of ['', 'RSA ', 'EC ', 'OPENSSH ']) {
    const begin = header(type), end = footer(type);
    assert.equal(hasSecretMaterial('识别格式 ' + JSON.stringify(begin)), false);
    assert.equal(hasSecretMaterial(begin + '\\n\\(fixtureData.base64EncodedString())\\n' + end), false);
    const shaped = begin + '\n' + 'A'.repeat(96) + '\n' + end;
    assert.equal(hasSecretMaterial(shaped), true);
    assert.equal(hasSecretMaterial(shaped.replaceAll('\n', '\\n')), true);
    assert.equal(hasSecretMaterial(JSON.stringify({ original: shaped })), true);
    const escaped = JSON.stringify({ original: shaped }).replace('BEGIN', '\\u0042EGIN');
    assert.equal(hasSecretMaterial(escaped), true);
    assert.equal(hasSecretMaterial(JSON.stringify({ original: JSON.stringify(shaped).replace('BEGIN', '\\u0042EGIN') })), true);
    assert.equal(hasSecretMaterial(JSON.stringify({ [shaped]: '合成键名' }).replace('BEGIN', '\\u0042EGIN')), true);
    const snapshot = '<!-- PATCH_DATA\n' + escaped + '\nPATCH_DATA -->';
    assert.equal(hasSecretMaterial(snapshot), true);
    assert.equal(hasSecretMaterial(begin + '\n' + 'A'.repeat(32)), true);
  }
  for (const [prefix, length] of [['AKIA', 16], ['github_pat_', 20], ['ghp_', 30], ['sk_live_', 16]]) {
    assert.equal(hasSecretMaterial(prefix + 'A'.repeat(length)), true);
    assert.equal(hasSecretMaterial(JSON.stringify({ example: prefix + 'A'.repeat(length) })), true);
  }
  assert.equal(hasSecretMaterial('格式说明，没有凭据正文'), false);
  assert.equal(hasSecretMaterial(header('') + '\nfixture-only\n' + footer('')), false);
  assert.throws(() => hasSecretMaterial('<!-- PATCH_DATA\n{}'), /快照结构/u);
  assert.throws(() => hasSecretMaterial('<!-- PATCH_DATA\ninvalid\nPATCH_DATA -->'), /快照结构/u);
  assert.throws(() => hasSecretMaterial(null), /输入必须/u);
});

// 真实资源只免除唯一官方归档字段；负向输入仍经完整Git跟踪文件扫描，现场归本产品。
test('官方Flutter归档字段不冒充旧平台标识，其它残留和伪造声明仍拒绝', async () => {
  const { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const { testRoot } = await import('../../scripts/build.mjs');
  const { validatePlatformNaming } = await Promise.resolve(gateTestExports);
  const root = mkdtempSync(join(testRoot(), 'tatagate-platform-'));
  const gitBin = '/usr/bin/git';
  const env = { ...toolEnvironment(), HOME: process.env.HOME, LANG: 'C', LC_ALL: 'C',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
  const git = (...args) => execFileSync(gitBin, ['-C', root, ...args], { env, stdio: ['ignore','pipe','pipe'] });
  const source = readFileSync(new URL('../../scripts/build.mjs', import.meta.url), 'utf8');
  const literal = source.match(/^const toolDefinitions=(\[.*\]);$/mu)[1];
  const tool = JSON.parse(literal).find(value => value.id === 'flutter');
  const legacy = ['macos','arm64'].join('_');
  const declaration = tools => 'const toolDefinitions=' + JSON.stringify(tools) + ';\n';
  try {
    git('init', '--quiet', '--initial-branch=main');
    mkdirSync(join(root, 'scripts')); mkdirSync(join(root, '.github', 'tatagate'), { recursive: true });
    const file = join(root, 'scripts', 'build.mjs');
    writeFileSync(join(root, '.github', 'tatagate', 'tatagate.json'), JSON.stringify(gateContract()));
    writeFileSync(file, source); git('add', '--all');
    assert.doesNotThrow(() => validatePlatformNaming(root));
    // 使用本仓真实补丁；即使伪造登记摘要，原上下文以外的旧平台文字仍须拒绝。
    const { createHash } = await import('node:crypto');
    const patch = JSON.parse(source.match(/^const flutterPatch=(".*");$/mu)[1]);
    const withPatch = (value, body=patch) => declaration([value]) + 'const flutterPatch=' + JSON.stringify(body) + ';\n';
    const altered = (change, metadata=()=>{}, refresh=false) => {
      const value=structuredClone(tool), body=change(patch);
      if (refresh) value.patch.sha256=createHash('sha256').update(body).digest('hex');
      metadata(value.patch);
      return withPatch(value,body);
    };
    writeFileSync(file, withPatch(tool));
    assert.doesNotThrow(() => validatePlatformNaming(root));
    const marker=['macos','arm64'].join(' ');
    const original=' /// ios device or '+marker+'.';
    for (const invalid of [
      altered(body=>body, value=>{value.source='https://example.invalid/commit/'+'a'.repeat(40);}),
      altered(body=>body, value=>{value.source=value.source.replace('https:','http:');}),
      altered(body=>body, value=>{value.source='https://github.com/flutter/flutter/commit/'+'0'.repeat(40);}),
      altered(body=>body, value=>{value.sha256='0'.repeat(64);}),
      altered(body=>body, value=>{value.path='other.patch';}),
      altered(body=>body, value=>{value.extra='unexpected';}),
      altered(body=>body+'\n'),
      altered(body=>body.replace('Future<void> lipoDylibs','Future<void> changed'),()=>{},true),
      altered(body=>body.replaceAll('native_assets_host.dart','other.dart'),()=>{},true),
      altered(body=>body.replace(original,'+/// ios device or '+marker+'.'),()=>{},true),
      altered(body=>body+'\n+// '+marker+'\n',()=>{},true),
      altered(body=>body+'\n'+body,()=>{},true),
      withPatch(tool)+'const flutterPatch='+JSON.stringify(patch)+';\n',
      withPatch(tool).replace('fixed source','fixed\\u0020source'),
      declaration([tool])+'const flutterPatch='+JSON.stringify(patch).slice(0,-1)+';\n',
      withPatch(tool)+'// '+marker+'\n',
    ]) {
      writeFileSync(file,invalid);
      assert.throws(() => validatePlatformNaming(root), /禁用平台命名/u);
    }
    writeFileSync(file, declaration([tool]));
    assert.doesNotThrow(() => validatePlatformNaming(root));
    const changed = change => { const value = structuredClone(tool); change(value); return declaration([value]); };
    for (const invalid of [
      changed(value => { value.archive.url = value.archive.url.replace('storage.googleapis.com','example.invalid'); }),
      changed(value => { value.archive.url = value.archive.url.replace('https:','http:'); }),
      changed(value => { value.version = '0.0.0'; }),
      changed(value => { value.archive.url = value.archive.url.replace('-stable.zip','-other.zip'); }),
      changed(value => { value.source = 'https://example.invalid/releases.json'; }),
      changed(value => { value.archive.root = 'other'; }),
      changed(value => { value.archive.executable = 'other'; }),
      changed(value => { value.title = legacy; }),
      changed(value => { value.archive.extra = legacy; }),
      declaration([tool, tool]),
      declaration([tool]) + declaration([tool]),
      declaration([tool]).replace('"version":', '"id":"other","version":'),
      declaration([tool]).replace('"flutter"', '"flutt\\u0065r"'),
      'const toolDefinitions=[invalid];\n// ' + legacy,
      declaration([tool]) + '// ' + legacy,
    ]) {
      writeFileSync(file, invalid);
      assert.throws(() => validatePlatformNaming(root), /禁用平台命名/u);
    }
    writeFileSync(file, declaration([tool]));
    const other = join(root, 'other.mjs');
    writeFileSync(other, declaration([tool])); git('add', '--all');
    assert.throws(() => validatePlatformNaming(root), /禁用平台命名/u);
    rmSync(other); git('add', '--all');
    for (const alias of gateContract().platform_forbidden_values) {
      writeFileSync(file, declaration([tool]) + '// ' + alias);
      assert.throws(() => validatePlatformNaming(root), /禁用平台命名/u);
    }
    writeFileSync(file, declaration([tool]));
    mkdirSync(join(root, legacy)); writeFileSync(join(root, legacy, 'source.mjs'), 'export const fixture=true;\n');
    git('add', '--all');
    assert.throws(() => validatePlatformNaming(root), /禁用平台目录/u);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// 用真实门禁函数检查登记与执行回执；这些用例在整项实现后统一运行。
test('本仓当前测试集合不得漏项、增项、重复或混入门禁自身', async () => {
  const { validateNodeInventory } = await Promise.resolve(gateTestExports);
  const paths = ['pubspec.yaml', 'scripts/build.mjs', 'test/api.spec.mjs', '.github/tatagate/tatagate.mjs'];
  const registered = ['scripts/build.mjs', 'test/api.spec.mjs'];
  assert.deepEqual(validateNodeInventory(paths, registered), registered);
  for (const listed of [registered.slice(1), [...registered, 'missing.test.mjs'], [...registered, registered[0]], []]) {
    assert.throws(() => validateNodeInventory(paths, listed));
  }
  assert.throws(() => validateNodeInventory([...paths, 'scripts/new.test.mjs'], registered));
  assert.throws(() => validateNodeInventory([...paths, paths[0]], registered));
});
test('成功退出但零用例、失败、取消或跳过不能作为完整测试回执', async () => {
  const { successfulTestSummary } = await Promise.resolve(gateTestExports);
  const counts = { tests: 2, passed: 2, failed: 0, skipped: 0, todo: 0, cancelled: 0 };
  assert.equal(successfulTestSummary({ success: true, counts }), true);
  for (const change of [{ tests: 0 }, { passed: 0 }, { failed: 1 }, { skipped: 1 }, { todo: 1 }, { cancelled: 1 }]) {
    assert.equal(Boolean(successfulTestSummary({ success: true, counts: { ...counts, ...change } })), false);
  }
  assert.equal(Boolean(successfulTestSummary({ success: false, counts })), false);
  assert.equal(Boolean(successfulTestSummary({ success: true })), false);
});
test('资源中的注释文本与正则字面量不是第一方代码注释', async () => {
  const { commentText, hasFirstPartyTemporaryComments } = await Promise.resolve(gateTestExports);
  const source = 'const patch = "// TODO upstream\\n/* FIXME original */";\nconst literal = /\\/\\/ XXX/;\n// 正常中文实现说明\n';
  assert.equal(hasFirstPartyTemporaryComments('scripts/build.mjs', source), false);
  assert.match(commentText('module.mjs', source), /正常中文实现说明/u);
  assert.equal(hasFirstPartyTemporaryComments('module.mjs', source + '// TODO first party\n'), true);
  assert.equal(hasFirstPartyTemporaryComments('module.rs', 'let raw = r##"// TODO raw"##;\n// 中文说明\n'), false);
  assert.equal(hasFirstPartyTemporaryComments('module.rs', "fn bind<'a>() {} // FIXME actual\n"), true);
});

// 真实词法和消费者闭合，模板表达式中的真实注释仍参与检查。
test('注释检查区分模板正文、模板表达式、Python文串和真实行尾注释',async()=>{
 const {hasFirstPartyTemporaryComments}=await Promise.resolve(gateTestExports);
 assert.equal(hasFirstPartyTemporaryComments('module.mjs','const value=`// TODO text ${1}`;'),false);
 assert.equal(hasFirstPartyTemporaryComments('module.mjs','const value=`text ${(()=>{ // FIXME actual\n return 1; })()}`;'),true);
 assert.equal(hasFirstPartyTemporaryComments('module.py','value="""# TODO text"""\nvalue=1 # FIXME actual\n'),true);
 assert.equal(hasFirstPartyTemporaryComments('module.py','value="""# TODO text"""\n'),false);
});
// 使用真实Node运行器和实际门禁Reporter；不以伪造汇总对象代替最终执行回执。
test('实际NodeReporter拒绝漏文件、零用例、跳过和失败',async()=>{
 const [{mkdtempSync,writeFileSync,rmSync},{join},{testRoot},{spawnSync},{fileURLToPath}]=await Promise.all([import('node:fs'),import('node:path'),import('../../scripts/build.mjs'),import('node:child_process'),import('node:url')]);
 const work=mkdtempSync(join(testRoot(),'gate-reporter-')),file=join(work,'case.test.mjs'),reporter=fileURLToPath(new URL('./tatagate.mjs',import.meta.url));
 try{
  for(const [body,extra,success]of [
   ['import test from "node:test";test("正常夹具",()=>{});',[],true],
   ['export const noTests=true;',[],false],
   ['import test from "node:test";test.skip("跳过夹具",()=>{});',[],false],
   ['import test from "node:test";test("失败夹具",()=>{throw Error("synthetic failure")});',[],false],
   ['import test from "node:test";test("漏项夹具",()=>{});',[join(work,'missing.test.mjs')],false],
  ]){
   // 子Node必须是独立运行器；保留产品工具输入，只移除父运行器的内部测试上下文。
   const childEnvironment={...process.env,TATAGATE_NODE_TESTS:JSON.stringify([file,...extra])};delete childEnvironment.NODE_TEST_CONTEXT;
   writeFileSync(file,body);const result=spawnSync(process.execPath,['--test','--test-reporter='+reporter,file],{env:childEnvironment,encoding:'utf8',timeout:30000,maxBuffer:2*1024**2});
   assert.equal(result.error,undefined);assert.equal(result.signal,null);assert.equal(result.status===0,success,result.stdout+result.stderr);
  }
 }finally{rmSync(work,{recursive:true,force:true});}
});

test('实际语言回执拒绝零用例、跳过、失败及不完整终态',async()=>{
 const {validateLanguageResult}=await Promise.resolve(gateTestExports);
 const vitest={success:true,numTotalTests:2,numPassedTests:2,numFailedTests:0,numPendingTests:0,numTodoTests:0};assert.equal(validateLanguageResult('vitest',JSON.stringify(vitest)),true);
 for(const change of [{numTotalTests:0,numPassedTests:0},{numPassedTests:1},{numPendingTests:1},{success:false}])assert.throws(()=>validateLanguageResult('vitest',JSON.stringify({...vitest,...change})));
 const flutter=JSON.stringify({type:'testDone',result:'success',skipped:false,hidden:false})+'\n'+JSON.stringify({type:'done',success:true});assert.equal(validateLanguageResult('flutter',flutter),true);
 for(const invalid of ['',JSON.stringify({type:'done',success:true}),flutter.replace('"skipped":false','"skipped":true'),flutter.replace('"success":true','"success":false')])assert.throws(()=>validateLanguageResult('flutter',invalid));
 assert.equal(validateLanguageResult('cargo','test result: ok. 2 passed; 0 failed; 0 ignored;'),true);
 for(const invalid of ['', 'test result: ok. 0 passed; 0 failed; 0 ignored;', 'test result: ok. 2 passed; 0 failed; 1 ignored;'])assert.throws(()=>validateLanguageResult('cargo',invalid));
});

test('代码变化必须同步所属文档与非空回归差异',async()=>{
 const {validateChangeEvidence}=await Promise.resolve(gateTestExports);
 assert.equal(validateChangeEvidence(['src/main.mjs','Owned.md','scripts/main.test.mjs'],['Owned.md']),true);
 assert.equal(validateChangeEvidence(['Owned.md'],['Owned.md']),true);
 for(const paths of [['src/main.mjs'],['src/main.mjs','Owned.md'],['src/main.mjs','Foreign.md','scripts/main.test.mjs']])assert.throws(()=>validateChangeEvidence(paths,['Owned.md']));
 assert.throws(()=>validateChangeEvidence(['src/main.mjs','Owned.md','scripts/main.test.mjs'],['Owned.md'],{changed:path=>path!=='Owned.md'}));
});

// 调用真实结果核验接口；合成协议事件仅验证核验器，不能作为产品功能通过证据。
test('功能映射必须闭合，拒绝遗漏类型、重复来源和路径越界',async()=>{
 const {validateFunctionalContract,gateContract}=await Promise.resolve(gateTestExports);const list=structuredClone(gateContract().functions);
 assert.equal(validateFunctionalContract(list),true);
 for(const invalid of [[],[...list,list[0]],list.map((item,index)=>index?item:{...item,path:'../foreign.test.mjs'}),list.map((item,index)=>index?item:{...item,target:'/foreign/Cargo.toml'}),list.map((item,index)=>index?item:{...item,runner:'skip'}),list.map((item,index)=>index?item:{...item,unknown:true})])assert.throws(()=>validateFunctionalContract(invalid));
 const value=structuredClone(gateContract());value.functions=value.functions.filter(item=>item.path!==value.node_tests[0]);assert.throws(()=>gateContract(value));
});
test('Vitest必须逐一完成本仓具名文件，错路径、漏跑和重复结果均拒绝',async()=>{
 const {functionalFiles}=await Promise.resolve(gateTestExports);const root='/owned/source',paths=['test/one.test.ts','test/two.test.ts'];
 const suite=name=>({name:root+'/'+name,assertionResults:[{status:'passed'}]}),value={success:true,numTotalTests:2,numPassedTests:2,numFailedTests:0,numPendingTests:0,numTodoTests:0,testResults:paths.map(suite)};
 assert.deepEqual(functionalFiles('vitest',JSON.stringify(value),paths,[root]),paths.map(path=>({path,tests:1})));
 for(const change of [{testResults:[suite(paths[0])]},{testResults:[suite(paths[0]),suite(paths[0])]},{testResults:[suite(paths[0]),{...suite(paths[1]),name:'/foreign/'+paths[1]}]},{testResults:[suite(paths[0]),{...suite(paths[1]),assertionResults:[]}]},{testResults:[suite(paths[0]),{...suite(paths[1]),assertionResults:[{status:'skipped'}]}]}])assert.throws(()=>functionalFiles('vitest',JSON.stringify({...value,...change}),paths,[root]));
});
test('Flutter加载事件不能代替实际用例，每个本仓套件均需成功',async()=>{
 const {functionalFiles}=await Promise.resolve(gateTestExports);const path='test/feature_test.dart',events=[{type:'suite',suite:{id:1,path:'/owned/source/'+path}},{type:'testStart',test:{id:1,suiteID:1,name:'真实协议夹具',hidden:false}},{type:'testDone',testID:1,hidden:false,result:'success',skipped:false},{type:'done',success:true}];
 const text=value=>value.map(row=>JSON.stringify(row)).join('\n');
 assert.deepEqual(functionalFiles('flutter',text(events),[path],['/owned/source']),[{path,tests:1}]);
 for(const value of [events.filter(item=>item.type!=='testDone'),events.map(item=>item.type==='testDone'?{...item,skipped:true}:item),events.map(item=>item.type==='suite'?{...item,suite:{...item.suite,path:'/foreign/'+path}}:item),[events[0],events[1],events[2],events[2],events[3]]])assert.throws(()=>functionalFiles('flutter',text(value),[path],['/owned/source']));
 assert.throws(()=>functionalFiles('flutter',text(events),[path,'test/missing_test.dart'],['/owned/source']));
});
test('Rust功能结果必须属于准确包，完整摘要不等于具名用例执行',async()=>{
 const {functionalRustCases}=await Promise.resolve(gateTestExports),items=[{path:'src/auth.rs',package:'owned-package',cases:['reject_expired']},{path:'tests/boundary.rs',package:'owned-package',cases:['reject_foreign']}];
 const value='test auth::reject_expired ... ok\ntest reject_foreign ... ok\ntest result: ok. 2 passed; 0 failed; 0 ignored;';
 assert.deepEqual(functionalRustCases(value,items),items.map(item=>({path:item.path,cases:item.cases})));
 for(const invalid of [value.replace('test reject_foreign ... ok\n',''),value.replace('0 ignored','1 ignored'),value.replace('2 passed','0 passed')])assert.throws(()=>functionalRustCases(invalid,items));
 assert.throws(()=>functionalRustCases(value,[items[0],{...items[1],package:'foreign-package'}]));
 assert.throws(()=>functionalRustCases(value,[items[0],{...items[1],cases:['reject_expired']} ]));
});

// 固定协调参数不承载产品产物；目录身份及空状态必须真实验证。
test('门禁请求协调目录拒绝相对、源码和无效目录',async()=>{
 const {validateGateRequestWork}=await Promise.resolve(gateTestExports);
 assert.throws(()=>validateGateRequestWork('/owned/source','relative/work'));
 assert.throws(()=>validateGateRequestWork('/owned/source','/nonexistent/owned/gate-work'));
});

// 回读本仓实际已跟踪测试来源；完整映射不可空跑、漏登记或混入不存在的入口。
test('当前功能清单纳入未暂存源码并排除已删除的Git旧路径', async () => {
 const [{mkdtempSync,mkdirSync,writeFileSync,unlinkSync,rmSync},{join},{execFileSync},{testRoot},{validateFunctionalInventory}]=await Promise.all([
  import('node:fs'),import('node:path'),import('node:child_process'),import('../../scripts/build.mjs'),Promise.resolve(gateTestExports),
 ]);
 const root=mkdtempSync(join(testRoot(),'tatagate-current-inventory-'));
 const env=toolEnvironment();
 const git=(...args)=>execFileSync(env.PRODUCT_GIT_BIN,['-C',root,...args],{env,stdio:'pipe'});
 const item=path=>({function:'当前真实入口',path,runner:'node',target:'.'});
 try{
  git('init','--quiet','--initial-branch=main');mkdirSync(join(root,'test'));
  const old='test/previous.test.mjs',current='test/current.test.mjs';
  writeFileSync(join(root,old),"import test from 'node:test';test('真实夹具',()=>{});\n");
  assert.equal(validateFunctionalInventory(root,[item(old)]).length,1);
  git('add','--',old);unlinkSync(join(root,old));
  writeFileSync(join(root,current),"import test from 'node:test';test('当前夹具',()=>{});\n");
  assert.throws(()=>validateFunctionalInventory(root,[item(old)]),/本仓功能测试存在遗漏/u);
  assert.equal(validateFunctionalInventory(root,[item(current)]).length,1);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('本仓真实功能源码清单与登记准确闭合',async()=>{
 const [{validateFunctionalInventory},{fileURLToPath}]=await Promise.all([Promise.resolve(gateTestExports),import('node:url')]);
 const root=fileURLToPath(new URL('../../',import.meta.url)).replace(/\/$/u,'');
 assert.equal(validateFunctionalInventory(root).length,gateContract().functions.length);
 assert.throws(()=>validateFunctionalInventory(root,gateContract().functions.slice(1)),/本仓功能测试存在遗漏/u);
 assert.throws(()=>validateFunctionalInventory(root,[...gateContract().functions,{function:'不存在的入口',path:'missing.test.mjs',runner:'node',target:'.'}]),/本仓功能测试存在遗漏/u);
});

// 尚未暂存的迁移源码也必须接受资料扫描；拒绝回执只允许包含路径。
test('资料扫描覆盖未暂存源码且不泄露被拒绝内容', async () => {
 const [{mkdtempSync,writeFileSync,rmSync},{join},{execFileSync},{testRoot},{validateSecrets}]=await Promise.all([
  import('node:fs'),import('node:path'),import('node:child_process'),import('../../scripts/build.mjs'),Promise.resolve(gateTestExports),
 ]);
 const root=mkdtempSync(join(testRoot(),'tatagate-current-secrets-')),env=toolEnvironment();
 try {
  execFileSync(env.PRODUCT_GIT_BIN,['-C',root,'init','--quiet','--initial-branch=main'],{env});
  writeFileSync(join(root,'CitizenWallet.md'),'产品技术文档');
  const material=['gh','p_', 'x'.repeat(32)].join(''),file=join(root,'candidate.mjs');
  writeFileSync(file,'const rejected = '+JSON.stringify(material)+';');
  assert.throws(()=>validateSecrets(root),error=>error.message.includes('candidate.mjs')&&!error.message.includes(material));
  writeFileSync(file,'export const value = 1;');assert.doesNotThrow(()=>validateSecrets(root));
 } finally {rmSync(root,{recursive:true,force:true});}
});

// 合并后的正式代码与测试代码独立比较；只改实现不能满足回归证据。
test('同文件门禁的真实测试尾部独立提供回归证据',()=>{
 const source=readFileSync(fileURLToPath(import.meta.url),'utf8'),tail=gateTestSource(source);
 assert.ok(tail.includes("test('同文件门禁的真实测试尾部独立提供回归证据'"));
 assert.equal(gateTestSource(JSON.stringify(source)),'');
 assert.equal(gateTestSource('/*'+source+'*/'),'');
 assert.equal(gateTestSource(source+'\nextra'),'');
 assert.equal(gateTestSource(source.replace('const gateTestEntry =','const gateTestEntry  =')),tail);
 const path='.github/tatagate/tatagate.mjs',paths=[path,'Owned.md'];
 assert.equal(validateChangeEvidence(paths,['Owned.md'],{changed:()=>true,changedTests:item=>item===path}),true);
 assert.throws(()=>validateChangeEvidence(paths,['Owned.md'],{changed:()=>true,changedTests:()=>false}),/真实回归/u);
 assert.throws(()=>validateChangeEvidence(paths,['Owned.md'],{changed:item=>item!=='Owned.md',changedTests:()=>true}),/技术文档/u);
});
}
// END INLINE TESTS
