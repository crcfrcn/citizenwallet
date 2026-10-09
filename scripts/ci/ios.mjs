#!/usr/bin/env node
const directEntry = process.argv[1] === import.meta.filename && !process.execArgv.some(argument => /^(?:-e|-p|--eval|--print)(?:=|$)/u.test(argument));
const inlineTestEntry = directEntry && Boolean(process.env.NODE_TEST_CONTEXT) && process.argv.length === 2;
import { remoteEnvironment as productRemoteEnvironment } from '../build.mjs';
if(directEntry&&!inlineTestEntry&&process.env.GITHUB_ACTIONS==='true'&&String(process.env.GITHUB_WORKFLOW||'').startsWith('citizenwallet.'))Object.assign(process.env,productRemoteEnvironment());
import { spawnSync as runExactProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

// 缓存身份使用固定语义前缀，不把内部实现误当成版本化协议。
export const CI_CACHE_SCHEMA = 'ci';

function required(value, label) {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`缺少${label}`);
  return normalized;
}

function token(value, label) {
  const normalized = required(value, label).toLowerCase();
  // GitHub 作业名允许下划线；仍禁止路径分隔符、空白和越界长度。
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(normalized)) {
    throw new Error(`${label}不是安全缓存标识`);
  }
  return normalized;
}

function positiveInteger(value, label) {
  const normalized = required(value, label);
  if (!/^[1-9][0-9]*$/.test(normalized)) throw new Error(`${label}必须是正整数`);
  return normalized;
}

function repositoryIdentity(value) {
  const normalized = required(value, '仓库身份');
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(normalized)) {
    throw new Error('仓库身份必须使用owner/repository');
  }
  return {
    api: normalized,
    key: normalized.toLowerCase().replace('/', '.'),
  };
}

export function cacheIdentity(input) {
  const repository = repositoryIdentity(input.repository);
  const toolchain = required(input.toolchainFingerprint, '工具链指纹').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(toolchain)) throw new Error('工具链指纹必须是SHA-256');
  const identity = Object.freeze({
    repository: repository.api,
    repositoryKey: repository.key,
    product: token(input.product, '产品'),
    platform: token(input.platform, '平台'),
    architecture: token(input.architecture, '架构'),
    component: token(input.component, 'CI组件'),
    runnerOs: token(input.runnerOs, 'Runner系统'),
    runnerArch: token(input.runnerArch, 'Runner架构'),
    toolchainFingerprint: toolchain,
  });
  const logicalKey = [
    CI_CACHE_SCHEMA,
    identity.product,
    identity.platform,
    identity.architecture,
    identity.component,
    identity.runnerOs,
    identity.runnerArch,
  ].join('-');
  const baseKey = `${logicalKey}-${toolchain.slice(0, 16)}`;
  if (baseKey.length > 400) throw new Error('缓存身份超过安全长度');
  return Object.freeze({ ...identity, logicalKey, baseKey });
}

export function cacheKeys(identity, runId, attempt) {
  const run = positiveInteger(runId, 'GitHub Run ID');
  const runAttempt = positiveInteger(attempt, 'GitHub Run Attempt');
  return Object.freeze({
    successPrefix: `${identity.baseKey}-success-`,
    failurePrefix: `${identity.baseKey}-failure-`,
    successKey: `${identity.baseKey}-success-${run}-${runAttempt}`,
    failureKey: `${identity.baseKey}-failure-${run}-${runAttempt}`,
  });
}

export function parseCacheKey(identity, key) {
  const parsed = parseLogicalCacheKey(identity, key);
  return parsed?.toolchain === identity.toolchainFingerprint.slice(0, 16) ? parsed : null;
}

export function parseLogicalCacheKey(identity, key) {
  const prefix = `${identity.logicalKey}-`;
  if (!String(key).startsWith(prefix)) return null;
  const remainder = String(key).slice(prefix.length);
  const toolchain = remainder.slice(0, 16);
  if (!/^[0-9a-f]{16}$/.test(toolchain) || remainder[16] !== '-') return null;
  const stateAndRun = remainder.slice(17);
  for (const state of ['success', 'failure']) {
    const statePrefix = `${state}-`;
    if (!stateAndRun.startsWith(statePrefix)) continue;
    const match = stateAndRun.slice(statePrefix.length).match(/^([1-9][0-9]*)-([1-9][0-9]*)$/);
    if (!match) return null;
    return Object.freeze({ toolchain, state, runId: match[1], attempt: match[2] });
  }
  return null;
}

function compareCache(left, right) {
  for (const field of ['runId', 'attempt', 'id']) {
    const difference = BigInt(left[field]) - BigInt(right[field]);
    if (difference !== 0n) return difference > 0n ? 1 : -1;
  }
  return 0;
}

function recognizedCaches(identity, caches, ref, currentToolchainOnly = false) {
  const rows = [];
  for (const cache of caches) {
    if (ref && cache.ref !== ref) continue;
    const parsed = parseLogicalCacheKey(identity, cache.key);
    if (!parsed || !/^[1-9][0-9]*$/.test(String(cache.id ?? ''))) continue;
    if (currentToolchainOnly
        && parsed.toolchain !== identity.toolchainFingerprint.slice(0, 16)) continue;
    rows.push({ ...cache, ...parsed, id: String(cache.id) });
  }
  return rows;
}

export function selectLatestCache(identity, caches, state = 'success', ref = '') {
  if (!['success', 'failure'].includes(state)) throw new Error('缓存状态无效');
  const rows = recognizedCaches(identity, caches, ref, true)
    .filter((cache) => cache.state === state);
  rows.sort(compareCache);
  return rows.at(-1) ?? null;
}

export function planCachePrune(identity, caches, ref = '') {
  const rows = recognizedCaches(identity, caches, ref);
  const retained = new Set();
  for (const state of ['success', 'failure']) {
    const candidates = rows.filter((cache) => cache.state === state).sort(compareCache);
    const latest = candidates.at(-1);
    if (latest) retained.add(latest.id);
  }
  return Object.freeze({
    retain: rows.filter((cache) => retained.has(cache.id)),
    remove: rows.filter((cache) => !retained.has(cache.id)),
  });
}

function pathImplementation(runnerOs) {
  return runnerOs === 'windows' ? path.win32 : path.posix;
}

export function cachePathPlan(identity, runnerTemp, entries) {
  const pathApi = pathImplementation(identity.runnerOs);
  const temp = required(runnerTemp, 'Runner临时目录');
  if (!pathApi.isAbsolute(temp)) throw new Error('Runner临时目录必须是绝对路径');
  const names = String(entries ?? '')
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (names.length === 0) throw new Error('至少需要一个成功缓存路径');
  if (new Set(names).size !== names.length) throw new Error('成功缓存路径不能重复');
  for (const name of names) {
    if (!/^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)*$/.test(name)) {
      throw new Error(`缓存相对路径无效：${name}`);
    }
  }
  const digest = createHash('sha256').update(identity.baseKey).digest('hex').slice(0, 20);
  const rootName = `${identity.product}-${identity.platform}-${identity.component}-${digest}`;
  const root = pathApi.resolve(temp, 'ci-cache', rootName);
  const expectedParent = pathApi.resolve(temp, 'ci-cache');
  const relative = pathApi.relative(expectedParent, root);
  if (!relative || relative.startsWith('..') || pathApi.isAbsolute(relative)) {
    throw new Error('缓存根目录逃出Runner临时目录');
  }
  return Object.freeze({
    root,
    successPaths: names.map((name) => pathApi.join(root, ...name.split('/'))),
    failurePath: pathApi.join(root, 'failure-diagnostic'),
  });
}

function relativeEntries(value, label) {
  const entries = String(value ?? '').split(/[\n,]/).map((entry) => entry.trim()).filter(Boolean);
  for (const entry of entries) {
    if (!/^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)*$/.test(entry)) {
      throw new Error(`${label}相对路径无效：${entry}`);
    }
  }
  return entries;
}

function resolvedChild(pathApi, parent, relative, label) {
  const target = pathApi.resolve(parent, ...relative.split('/'));
  const child = pathApi.relative(parent, target);
  if (!child || child.startsWith('..') || pathApi.isAbsolute(child)) {
    throw new Error(`${label}逃出允许根`);
  }
  return target;
}

export function wireCacheLinks(identity, runnerTemp, entries, workspace, links) {
  const pathApi = pathImplementation(identity.runnerOs);
  const plan = cachePathPlan(identity, runnerTemp, entries);
  const workspaceRoot = required(workspace, 'GitHub工作区');
  if (!pathApi.isAbsolute(workspaceRoot)) throw new Error('GitHub工作区必须是绝对路径');
  const rows = String(links ?? '').split(/\n/).map((entry) => entry.trim()).filter(Boolean);
  for (const row of rows) {
    const separator = row.indexOf('=');
    if (separator <= 0) throw new Error(`缓存目录链接无效：${row}`);
    const sourceRelative = row.slice(0, separator);
    const cacheRelative = row.slice(separator + 1);
    relativeEntries(sourceRelative, '工作区生成目录');
    relativeEntries(cacheRelative, '受控缓存目录');
    const source = resolvedChild(pathApi, workspaceRoot, sourceRelative, '工作区生成目录');
    const target = resolvedChild(pathApi, plan.root, cacheRelative, '受控缓存目录');
    mkdirSync(pathApi.dirname(source), { recursive: true });
    mkdirSync(target, { recursive: true });
    if (existsSync(source)) {
      const status = lstatSync(source);
      if (status.isSymbolicLink()) {
        const linked = pathApi.resolve(pathApi.dirname(source), readlinkSync(source));
        if (linked === target) continue;
      }
      throw new Error(`工作区生成目录已存在且不是准确缓存链接：${sourceRelative}`);
    }
    symlinkSync(target, source, identity.runnerOs === 'windows' ? 'junction' : 'dir');
  }
  return plan;
}

export function sanitizeCacheFinals(identity, runnerTemp, entries, finals) {
  const pathApi = pathImplementation(identity.runnerOs);
  const plan = cachePathPlan(identity, runnerTemp, entries);
  for (const relative of relativeEntries(finals, '最终候选')) {
    rmSync(resolvedChild(pathApi, plan.root, relative, '最终候选'), {
      recursive: true,
      force: true,
    });
  }
}

function identityFromEnvironment(environment) {
  return cacheIdentity({
    repository: environment.GITHUB_REPOSITORY,
    product: environment.CI_CACHE_PRODUCT,
    platform: environment.CI_CACHE_PLATFORM,
    architecture: environment.CI_CACHE_ARCHITECTURE,
    component: environment.CI_CACHE_COMPONENT,
    runnerOs: environment.RUNNER_OS,
    runnerArch: environment.RUNNER_ARCH,
    toolchainFingerprint: environment.CI_CACHE_TOOLCHAIN_FINGERPRINT,
  });
}

function githubHeaders(tokenValue) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${required(tokenValue, 'GitHub Actions令牌')}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ci-cache',
  };
}

async function githubRequest(url, tokenValue, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...githubHeaders(tokenValue), ...(options.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`GitHub缓存API失败：${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

async function listRepositoryCaches(repository, tokenValue) {
  const caches = [];
  for (let page = 1; ; page += 1) {
    const endpoint = `https://api.github.com/repos/${repository}/actions/caches?per_page=100&page=${page}`;
    const result = await githubRequest(endpoint, tokenValue);
    const rows = Array.isArray(result?.actions_caches) ? result.actions_caches : [];
    caches.push(...rows);
    if (rows.length < 100) break;
  }
  return caches;
}

async function deleteRepositoryCache(repository, cacheId, tokenValue) {
  await githubRequest(
    `https://api.github.com/repos/${repository}/actions/caches/${cacheId}`,
    tokenValue,
    { method: 'DELETE' },
  );
}

function output(name, value, environment) {
  const target = environment.GITHUB_OUTPUT;
  if (!target) return;
  const text = String(value);
  if (text.includes('\n')) {
    const delimiter = `CI_CACHE_${name.toUpperCase()}_EOF`;
    if (text.includes(delimiter)) throw new Error('GitHub多行输出包含保留分隔符');
    appendFileSync(target, `${name}<<${delimiter}\n${text}\n${delimiter}\n`);
  } else {
    appendFileSync(target, `${name}=${text}\n`);
  }
}

function persistEnvironment(name, value, environment) {
  const target = environment.GITHUB_ENV;
  if (!target) return;
  const text = String(value ?? '');
  if (text.includes('\n')) {
    const delimiter = `CI_CACHE_ENV_${name}_EOF`;
    if (text.includes(delimiter)) throw new Error('GitHub环境变量包含保留分隔符');
    appendFileSync(target, `${name}<<${delimiter}\n${text}\n${delimiter}\n`);
  } else {
    appendFileSync(target, `${name}=${text}\n`);
  }
}

function commandContext(environment) {
  environment = productRemoteEnvironment(environment);
  requireExactRemoteJobEnvironment();
  const identity = identityFromEnvironment(environment);
  const keys = cacheKeys(identity, environment.GITHUB_RUN_ID, environment.GITHUB_RUN_ATTEMPT);
  const paths = cachePathPlan(identity, environment.RUNNER_TEMP, environment.CI_CACHE_PATHS);
  const ref = required(environment.GITHUB_REF, 'GitHub Ref');
  const tokenValue = environment.GH_TOKEN || environment.GITHUB_TOKEN;
  return { identity, keys, paths, ref, tokenValue };
}

async function prepare(environment) {
  environment = productRemoteEnvironment(environment);
  const context = commandContext(environment);
  const caches = await listRepositoryCaches(context.identity.repository, context.tokenValue);
  const latest = selectLatestCache(context.identity, caches, 'success', context.ref);
  for (const directory of [...context.paths.successPaths, context.paths.failurePath]) {
    mkdirSync(directory, { recursive: true });
  }
  const restoreKey = latest?.key ?? `${context.keys.successPrefix}none`;
  output('cache_root', context.paths.root, environment);
  output('success_paths', context.paths.successPaths.join('\n'), environment);
  output('failure_paths', context.paths.failurePath, environment);
  output('restore_key', restoreKey, environment);
  output('success_key', context.keys.successKey, environment);
  output('failure_key', context.keys.failureKey, environment);
  for (const name of [
    'CI_CACHE_PRODUCT', 'CI_CACHE_PLATFORM', 'CI_CACHE_ARCHITECTURE',
    'CI_CACHE_COMPONENT', 'CI_CACHE_TOOLCHAIN_FINGERPRINT', 'CI_CACHE_PATHS',
    'CI_CACHE_LINKS', 'CI_CACHE_FINALS', 'CI_CACHE_WORKFLOW', 'CI_CACHE_JOB',
  ]) persistEnvironment(name, environment[name] ?? '', environment);
  persistEnvironment('CI_INCREMENTAL_ROOT', context.paths.root, environment);
  const pathByName = new Map(
    relativeEntries(environment.CI_CACHE_PATHS, '成功缓存').map(
      (name, index) => [name, context.paths.successPaths[index]],
    ),
  );
  const environmentPaths = {
    'cargo-home': 'CARGO_HOME',
    'cargo-target': 'CARGO_TARGET_DIR',
    'dart-pub': 'PUB_CACHE',
    gradle: 'GRADLE_USER_HOME',
    cocoapods: 'CP_HOME_DIR',
    npm: 'npm_config_cache',
    xdg: 'XDG_CACHE_HOME',
  };
  for (const [cacheName, environmentName] of Object.entries(environmentPaths)) {
    if (pathByName.has(cacheName)) persistEnvironment(environmentName, pathByName.get(cacheName), environment);
  }
  if (pathByName.has('cargo-target')) persistEnvironment('CARGO_INCREMENTAL', '1', environment);
  if (pathByName.has('cargo-home') && environment.GITHUB_PATH) {
    appendFileSync(environment.GITHUB_PATH, `${path.join(pathByName.get('cargo-home'), 'bin')}\n`);
  }
  if (!environment.GITHUB_OUTPUT) {
    process.stdout.write(`${JSON.stringify({
      cacheRoot: context.paths.root,
      restoreKey,
      successKey: context.keys.successKey,
      failureKey: context.keys.failureKey,
    })}\n`);
  }
}

function wire(environment) {
  const context = commandContext(environment);
  wireCacheLinks(
    context.identity,
    environment.RUNNER_TEMP,
    environment.CI_CACHE_PATHS,
    environment.GITHUB_WORKSPACE,
    environment.CI_CACHE_LINKS,
  );
}

function sanitize(environment) {
  const context = commandContext(environment);
  sanitizeCacheFinals(
    context.identity,
    environment.RUNNER_TEMP,
    environment.CI_CACHE_PATHS,
    environment.CI_CACHE_FINALS,
  );
}

function writeTerminalRecord(environment) {
  const context = commandContext(environment);
  const state = token(environment.CI_CACHE_TERMINAL_STATE, '终态');
  if (!['success', 'failure'].includes(state)) throw new Error('终态只能是success或failure');
  const sourceSha = required(environment.GITHUB_SHA, 'GitHub源码SHA').toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('GitHub源码SHA无效');
  const directory = state === 'success' ? context.paths.successPaths[0] : context.paths.failurePath;
  mkdirSync(directory, { recursive: true });
  const record = {
    schema: CI_CACHE_SCHEMA,
    state,
    repository: context.identity.repository,
    product: context.identity.product,
    platform: context.identity.platform,
    architecture: context.identity.architecture,
    component: context.identity.component,
    runner_os: context.identity.runnerOs,
    runner_arch: context.identity.runnerArch,
    source_sha: sourceSha,
    run_id: positiveInteger(environment.GITHUB_RUN_ID, 'GitHub Run ID'),
    run_attempt: positiveInteger(environment.GITHUB_RUN_ATTEMPT, 'GitHub Run Attempt'),
    workflow: token(environment.CI_CACHE_WORKFLOW, 'Workflow'),
    job: token(environment.CI_CACHE_JOB, 'Job'),
  };
  const receipt = path.join(directory, `${state}.json`);
  // 成功目录可能来自上一份成功缓存；新成功只替换旧成功回执，不累积代次文件。
  rmSync(receipt, { force: true });
  writeFileSync(
    receipt,
    `${JSON.stringify(record, null, 2)}\n`,
    { flag: 'wx' },
  );
}

async function prune(environment) {
  environment = productRemoteEnvironment(environment);
  const context = commandContext(environment);
  const state = token(environment.CI_CACHE_TERMINAL_STATE, '终态');
  if (!['success', 'failure'].includes(state)) throw new Error('终态只能是success或failure');
  const currentKey = state === 'success' ? context.keys.successKey : context.keys.failureKey;
  const caches = await listRepositoryCaches(context.identity.repository, context.tokenValue);
  const currentExists = caches.some(
    (cache) => cache.key === currentKey && cache.ref === context.ref,
  );
  if (!currentExists) throw new Error('新缓存槽尚未确认存在，拒绝删除历史缓存');
  const plan = planCachePrune(context.identity, caches, context.ref);
  for (const cache of plan.remove) {
    await deleteRepositoryCache(context.identity.repository, cache.id, context.tokenValue);
  }
  process.stdout.write(
    `CI缓存收口完成：保留${plan.retain.length}个，删除${plan.remove.length}个\n`,
  );
}


// iOS CI 的检查与构建共用一个入口；作业参数只选择本仓既有步骤。
export const EXACT_REMOTE_JOB_IDENTITIES = Object.freeze({
  check: Object.freeze({pipeline: 'citizenwallet.ios.ci', job: 'check'}),
  ios: Object.freeze({pipeline: 'citizenwallet.ios.ci', job: 'ios'}),
});

function requireExactRemoteJobEnvironment() {
  if (process.env.GITHUB_REPOSITORY !== 'crcfrcn/citizenwallet') {
    throw new Error('准确远端Job仓库身份无效');
  }
}
const workflowSteps = Object.freeze({"check":{"0":{"shell":"bash","source":"echo \"CARGO_TARGET_DIR=$RUNNER_TEMP/citizenwallet/cargo-target\" >> \"$GITHUB_ENV\"\necho \"CITIZENWALLET_NATIVE_ANDROID_DIR=$RUNNER_TEMP/citizenwallet/native/android\" >> \"$GITHUB_ENV\"\necho \"CITIZENWALLET_NATIVE_IOS_DIR=$RUNNER_TEMP/citizenwallet/native/ios\" >> \"$GITHUB_ENV\"\n"},"1":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" prepare"},"2":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" wire"},"3":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" sanitize"},"4":{"shell":"bash","source":"node citizenchain/scripts/generate-logo-assets.mjs --check"},"5":{"shell":"bash","source":"test \"$(git rev-parse HEAD)\" = \"$GMB_SOURCE_SHA\"\n"},"6":{"shell":"bash","source":"# 版本只读受控工具登记，不读取产品依赖合同中的副本。\nprintf 'version=3.47.2\n' >> \"$GITHUB_OUTPUT\"\n"},"7":{"shell":"bash","source":"# 安装后先验真，再统一准备目标平台缓存与受控修订。\nflutter --version --machine >/dev/null\nplatform=\"ios\"\nflutter --version >/dev/null\n"},"8":{"shell":"bash","source":"node ./scripts/build.mjs sync"},"9":{"shell":"bash","source":"flutter pub get --enforce-lockfile\n"},"10":{"shell":"bash","source":"test ! -e analysis_options.yaml && test ! -L analysis_options.yaml\ntrap 'rm -f -- analysis_options.yaml' EXIT\nnode scripts/build.mjs analysis-options > analysis_options.yaml\nflutter analyze --no-pub lib/scanner test/scanner\nrm -f -- analysis_options.yaml\ntrap - EXIT\nflutter test --no-pub test/scanner\n"},"11":{"shell":"bash","source":"test ! -e analysis_options.yaml && test ! -L analysis_options.yaml\ntrap 'rm -f -- analysis_options.yaml' EXIT\nnode scripts/build.mjs analysis-options > analysis_options.yaml\nflutter analyze --no-fatal-infos\n"},"12":{"shell":"bash","source":"node ./scripts/build.mjs native host"},"13":{"shell":"bash","source":"flutter test"},"14":{"shell":"bash","source":"node --test test/release_manifest.test.mjs\n"},"15":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" sanitize\nnode \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" record\n"},"16":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" prune"},"17":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" sanitize\nnode \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" record\n"},"18":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" prune"}},"ios":{"0":{"shell":"bash","source":"echo \"CARGO_TARGET_DIR=$RUNNER_TEMP/citizenwallet/cargo-target\" >> \"$GITHUB_ENV\"\necho \"CITIZENWALLET_NATIVE_ANDROID_DIR=$RUNNER_TEMP/citizenwallet/native/android\" >> \"$GITHUB_ENV\"\necho \"CITIZENWALLET_NATIVE_IOS_DIR=$RUNNER_TEMP/citizenwallet/native/ios\" >> \"$GITHUB_ENV\"\n"},"1":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" prepare"},"2":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" wire"},"3":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" sanitize"},"4":{"shell":"bash","source":"test \"$(git rev-parse HEAD)\" = \"$GMB_SOURCE_SHA\"\n"},"5":{"shell":"bash","source":"# 版本只读受控工具登记，不读取产品依赖合同中的副本。\nprintf 'version=3.47.2\n' >> \"$GITHUB_OUTPUT\"\n"},"6":{"shell":"bash","source":"# 安装后先验真，再统一准备目标平台缓存与受控修订。\nflutter --version --machine >/dev/null\nplatform=\"ios\"\nflutter --version >/dev/null\n"},"7":{"shell":"bash","source":"node ./scripts/build.mjs sync"},"8":{"shell":"bash","source":"set -euo pipefail\nexport CITIZENWALLET_WORK_DIR=\"$RUNNER_TEMP/citizenwallet-ios-view-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT\"\nproject=\"$(node \"$GITHUB_WORKSPACE/scripts/build.mjs\" wallet prepare-ios)\"\n# 原流程的产物路径继续指向同一个已隔离构建目录。\nbuild=\"$(cd \"$GITHUB_WORKSPACE/build\" && pwd -P)\"\nln -s \"$build\" \"$project/build\"\nexport CITIZENWALLET_PROJECT_ROOT=\"$project\"\nprintf 'CITIZENWALLET_PROJECT_ROOT=%s\\n' \"$project\" >> \"$GITHUB_ENV\"\ncd \"$project\"\nflutter pub get --enforce-lockfile\n"},"9":{"shell":"bash","source":"cd \"$CITIZENWALLET_PROJECT_ROOT\"\nnode ./scripts/build.mjs native ios"},"10":{"shell":"bash","source":"cd \"$CITIZENWALLET_PROJECT_ROOT\"\nflutter build ios --release --no-codesign"},"11":{"shell":"bash","source":"cd \"$CITIZENWALLET_PROJECT_ROOT\"\nnode ./scripts/build.mjs native verify-ios-package build/ios/iphoneos/Runner.app"},"12":{"shell":"bash","source":"codesign --force --deep --sign - build/ios/iphoneos/Runner.app\ncodesign --verify --deep --strict build/ios/iphoneos/Runner.app\n"},"13":{"shell":"bash","source":"set -euo pipefail\nmkdir -p build/release-candidate/ios\nasset='公民钱包-iOS-CI.app.zip'\nditto -c -k --keepParent build/ios/iphoneos/Runner.app \\n  \"build/release-candidate/ios/${asset}\"\n"},"14":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" sanitize\nnode \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" record\n"},"15":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" prune"},"16":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" sanitize\nnode \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" record\n"},"17":{"shell":"bash","source":"node \"$GITHUB_WORKSPACE/scripts/ci/ios.mjs\" prune"}}});

export function workflowStep(job, index) {
  if (!Object.hasOwn(workflowSteps, job)
    || !/^(?:0|[1-9][0-9]*)$/.test(String(index ?? ''))
    || !Object.hasOwn(workflowSteps[job], String(index))) {
    throw new Error('准确远端Job阶段无效');
  }
  return workflowSteps[job][String(index)];
}

function runExactWorkflowStep(job, index) {
  requireExactRemoteJobEnvironment();
  const step = workflowStep(job, index);
  const command = step.shell === 'pwsh' ? 'pwsh' : (process.platform === 'win32' ? 'bash' : '/bin/bash');
  const args = step.shell === 'pwsh'
    ? ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', step.source]
    : ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', step.source];
  const result = runExactProcess(command, args, { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
  if (result.error) throw new Error('准确远端Job阶段无法启动');
  if (result.status !== 0) process.exitCode = Number.isInteger(result.status) ? result.status : 1;
}

async function main() {
  const command = process.argv[2];
  if (command === 'workflow-step') return runExactWorkflowStep(process.argv[3], process.argv[4]);
  if (command === 'prepare') return prepare(process.env);
  if (command === 'wire') return wire(process.env);
  if (command === 'sanitize') return sanitize(process.env);
  if (command === 'record') return writeTerminalRecord(process.env);
  if (command === 'prune') return prune(process.env);
  throw new Error('用法：ios.mjs workflow-step <check|ios> <阶段>；或 ios.mjs <prepare|wire|sanitize|record|prune>');
}

if (!inlineTestEntry && directEntry) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

// 内嵌测试：正式实现之后，仅由 node --test 直接运行本文件时注册。
if (inlineTestEntry) {
  void (async () => {
    const { default: assert } = await import('node:assert/strict');
    const { readFileSync, mkdtempSync, rmSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { spawnSync } = await import('node:child_process');
    const { testRoot } = await import('../build.mjs');
    const { default: test } = await import('node:test');

    test('iOS CI 的检查与构建通过同一文件执行各自全部步骤', () => {
      const workflow = readFileSync(new URL('../../.github/workflows/citizenwallet-ios-ci.yml', import.meta.url), 'utf8');
      const jobs = [['check', workflow.split('  stage_1:\n')[1].split('  flow:\n')[0], 19],
        ['ios', workflow.split('  flow:\n')[1], 18]];
      for (const [job, source, count] of jobs) {
        const calls = [...source.matchAll(/scripts\/ci\/ios\.mjs" workflow-step (check|ios) (\d+)/gu)];
        assert.equal(calls.length, count);
        assert.deepEqual(calls.map(call => [call[1], Number(call[2])]),
          Array.from({length: count}, (_, index) => [job, index]));
        for (const call of calls) assert.equal(workflowStep(job, call[2]).shell, 'bash');
      }
      assert.match(workflowStep('check', 11).source, /flutter analyze/u);
      assert.match(workflowStep('check', 13).source, /flutter test/u);
      assert.match(workflowStep('ios', 10).source, /flutter build ios --release --no-codesign/u);
      assert.match(workflowStep('ios', 11).source, /verify-ios-package/u);
    });

    test('iOS CI 拒绝未知作业、越界及无效阶段', () => {
      for (const [job, index] of [['other', 0], ['__proto__', 0], ['check', 19], ['ios', 18],
        ['check', -1], ['ios', '01'], ['ios', undefined], ['check', '1.0']]) {
        assert.throws(() => workflowStep(job, index), /准确远端Job阶段无效/u);
      }
    });

    test('iOS CI 两个作业的真实命令入口均执行既有初始化步骤', () => {
      const root = mkdtempSync(join(testRoot(), 'citizenwallet-ios-entry-'));
      try {
        for (const job of ['check', 'ios']) {
          const file = join(root, job + '.env');
          const result = spawnSync(process.execPath, [import.meta.filename, 'workflow-step', job, '0'], {
            encoding: 'utf8', env: {...process.env, GITHUB_ACTIONS: 'false',
              GITHUB_REPOSITORY: 'crcfrcn/citizenwallet', RUNNER_TEMP: root, GITHUB_ENV: file},
          });
          assert.equal(result.status, 0, result.stderr);
          assert.equal(readFileSync(file, 'utf8'),
            'CARGO_TARGET_DIR=' + root + '/citizenwallet/cargo-target\n'
            + 'CITIZENWALLET_NATIVE_ANDROID_DIR=' + root + '/citizenwallet/native/android\n'
            + 'CITIZENWALLET_NATIVE_IOS_DIR=' + root + '/citizenwallet/native/ios\n');
        }
      } finally { rmSync(root, {recursive: true, force: true}); }
    });
  })().catch(error => { console.error(error); process.exitCode = 1; });
}
