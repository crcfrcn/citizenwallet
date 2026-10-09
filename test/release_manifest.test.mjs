import assert from 'node:assert/strict';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { testRoot as tmpdir, BUILD_SHELL_SOURCES } from '../scripts/build.mjs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

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

// 本机Build直接调用本测试；工具来自当前流程验真环境，独立验收显式交付同样入口。
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
function checkout(source) {
  mkdirSync(join(source,'scripts'),{recursive:true});
  for(const name of ['build.mjs','flows.json'])writeFileSync(join(source,'scripts',name),readFileSync(new URL('../scripts/'+name,import.meta.url)));
  const put=(name,data)=>{mkdirSync(dirname(join(source,name)),{recursive:true});writeFileSync(join(source,name),data);};
  put('pubspec.yaml','name: citizenwallet\n');
  for(const name of ['ios/project/Runner.xcscheme','ios/Podfile.lock','android/gradle-wrapper.properties','android/settings.gradle.kts'])put(name,readFileSync(new URL('../'+name,import.meta.url)));
  for(const name of ['citizen-logo.png','app-icon.png','launch-logo.png','android-launcher.png','android-foreground.png'])put('icons/'+name,readFileSync(new URL('../icons/'+name,import.meta.url)));
  for(const name of ['config','native','project','resources','source','tests'])cpSync(fileURLToPath(new URL('../ios/'+name,import.meta.url)),join(source,'ios',name),{recursive:true});
  cpSync(fileURLToPath(new URL('../android/resources',import.meta.url)),join(source,'android/resources'),{recursive:true});
  return join(source,'scripts/build.mjs');
}

test('钱包真实入口只在当前任务工程执行Pub，缺参和链接逃逸在写入前失败', context => {
  const fixture=realpathSync(mkdtempSync(join(tmpdir(),'wallet-project-boundary-')));
  context.after(()=>rmSync(fixture,{recursive:true,force:true}));
  const source=join(fixture,'independent-checkout'),script=checkout(source),bin=join(fixture,'bin');mkdirSync(bin);
  const supplied=tools(),trace=join(fixture,'trace');
  // 真实执行Shell路径检查，只有Flutter记录本轮Pub目录后停止昂贵编译。
  writeFileSync(join(bin,'flutter'),'#!'+supplied.shell+'\ncase "$1" in\nconfig) exit 0;;\npub) mkdir .dart_tool; printf "%s" "$PWD" > "$TRACE"; exit 73;;\n*) exit 90;;\nesac\n',{mode:0o755});
  for(const platform of ['ios','android']) {
    const work=join(source,'target','test',platform+'-current'),project=join(work,'source-view',source.replace(/^\/+/u,''));
    mkdirSync(join(project,'ios'),{recursive:true});writeFileSync(join(project,'pubspec.yaml'),readFileSync(join(source,'pubspec.yaml')));
    for(const name of ['icons','ios/resources','android/resources'])cpSync(join(source,name),join(project,name),{recursive:true});
    const run=projectRoot=>spawnSync(process.execPath,[script,'wallet',platform],{env:{...supplied.env,PATH:bin+':'+supplied.env.PATH,
      HOME:work,TMPDIR:join(work,'tmp'),PRODUCT_WORK_DIR:work,CITIZENWALLET_WORK_DIR:work,TRACE:trace,
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
  }
});

// 检出目录名称任意；错误、重复或链接包名仍在平台生成物写入前拒绝。
test('钱包源码身份来自唯一产品包名而非检出目录名称', context => {
  const fixture=realpathSync(mkdtempSync(join(tmpdir(),'wallet-source-identity-')));context.after(()=>rmSync(fixture,{recursive:true,force:true}));
  const source=join(fixture,'independent-checkout'),script=checkout(source),manifest=join(source,'pubspec.yaml');
  const work=join(source,'target/test/current'),project=join(work,'source-view',source.replace(/^\/+/u,'')),supplied=tools();
  const run=()=>spawnSync(process.execPath,[script,'wallet','ios'],{env:{...supplied.env,HOME:work,TMPDIR:join(work,'tmp'),PRODUCT_WORK_DIR:work,CITIZENWALLET_WORK_DIR:work},encoding:'utf8',timeout:10000});
  assert.match(run().stderr,/当前任务/u);
  for(const value of ['name: other_product\n','name: citizenwallet\nname: citizenwallet\n']) {
    writeFileSync(manifest,value);assert.match(run().stderr,/源码身份无效/u);assert.equal(existsSync(project),false);
  }
  unlinkSync(manifest);const foreign=join(fixture,'foreign.yaml');writeFileSync(foreign,'name: citizenwallet\n');symlinkSync(foreign,manifest);
  assert.match(run().stderr,/源码身份无效/u);assert.equal(existsSync(project),false);
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
  const contract = runner.indexOf('"$node_bin" --test "$CITIZENWALLET_DIR/test/release_manifest.test.mjs"');
  const host = runner.indexOf('"${PRODUCT_NODE_BIN:-${NODE:-node}}" "$CITIZENWALLET_DIR/scripts/build.mjs" native host');
  const tests = runner.indexOf('flutter test --no-pub');
  const platform = runner.indexOf('"${PRODUCT_NODE_BIN:-${NODE:-node}}" "$CITIZENWALLET_DIR/scripts/build.mjs" native "$PLATFORM"');
  assert.ok(pub >= 0 && pub < contract && contract < host && host < tests && tests < platform);
  assert.match(runner, /set -euo pipefail/u);
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
test('钱包平台装配读取唯一扁平来源并拒绝重复目标', () => {
  const work = realpathSync(mkdtempSync(join(tmpdir(), 'citizenwallet-platform-')));
  const source=join(work,'independent-checkout'),script=checkout(source),supplied=tools();
  try {
    // 工具原件用独立夹具提供，避免继承宿主环境或读取已删除的产品副本。
    const flutter = join(work, 'flutter');
    const names = ['gradlew', 'gradlew.bat', 'gradle/wrapper/gradle-wrapper.jar'];
    for (const name of names) {
      const path = join(flutter, 'bin/cache/artifacts/gradle_wrapper', name);
      mkdirSync(join(path, '..'), { recursive: true });
      writeFileSync(path, 'synthetic wrapper ' + name);
    }
    for (const platform of ['android', 'ios']) {
      const task=join(source,'target','test',platform+'-assembly');
      const env={...supplied.env,HOME:task,TMPDIR:join(task,'tmp'),PRODUCT_WORK_DIR:task,FLUTTER_ROOT:flutter,CITIZENWALLET_WORK_DIR:task};
      delete env.CITIZENWALLET_PROJECT_ROOT;
      const run = () => spawnSync(process.execPath, [script, 'wallet', `prepare-${platform}`], { env, encoding: 'utf8' });
      const prepared = run();
      assert.equal(prepared.status, 0, prepared.stderr);
      const project = prepared.stdout.trim();
      const target = platform === 'ios' ? 'ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme'
        : 'android/gradle/wrapper/gradle-wrapper.properties';
      const original = platform === 'ios' ? 'ios/project/Runner.xcscheme' : 'android/gradle-wrapper.properties';
      assert.deepEqual(readFileSync(join(project, target)), readFileSync(join(source, original)));
      assert.equal(lstatSync(join(project, target)).isSymbolicLink(), false);
      assert.notEqual(run().status, 0, '重复目标不能覆盖已有工程');
      for (const name of names) {
        const output = join(project, 'android', name);
        const original = join(flutter, 'bin/cache/artifacts/gradle_wrapper', name);
        if (platform === 'android') {
          assert.equal(lstatSync(output).isSymbolicLink(), false);
          assert.deepEqual(readFileSync(output), readFileSync(original));
        } else {
          assert.equal(existsSync(output), false);
        }
        assert.equal(readFileSync(original, 'utf8'), 'synthetic wrapper ' + name);
      }
      if (platform === 'android') assert.ok(lstatSync(join(project, 'android/gradlew')).mode & 0o100);
    }
  } finally { rmSync(work, { recursive: true }); }
});

// 防止 AGP 9 只登记 Java 源集而漏编 Kotlin：APK 可构建成功，但真机找不到 MainActivity。
test('Android入口及测试显式登记独立Kotlin源集', () => {
  assert.ok(application.includes('sourceSets.getByName("main").kotlin.directories.apply { clear(); add("source") }'));
  assert.ok(application.includes('manifest.srcFile("source/AndroidManifest.xml")'));
  assert.ok(existsSync(fileURLToPath(new URL('../android/app/source/AndroidManifest.xml', import.meta.url))));
  assert.ok(application.includes('sourceSets.getByName("test").kotlin.directories.clear()'));
  assert.ok(application.includes('if (name.endsWith("UnitTestKotlin"))'));
  assert.ok(application.includes('source(layout.projectDirectory.file("HardwareSecretvaultPluginTest.kt"))'));
  assert.doesNotMatch(application, /setSrcDirs|include\("HardwareSecretvaultPluginTest/u);
});

test('Android插件注册表来自本轮外部Flutter工程', () => {
  const javaSources = application.slice(application.indexOf('sourceSets.getByName("main").java.directories.apply'),
    application.indexOf('sourceSets.getByName("main").java.directories.apply') + 260);
  assert.ok(javaSources.includes('add(flutterProductRoot.resolve("android/app/src/main/java").absolutePath)'));
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
test('原生宿主库消费准确平台任务目录，错误任务或输出链接在Cargo前拒绝', context => {
  const fixture=realpathSync(mkdtempSync(join(tmpdir(),'wallet-native-boundary-')));
  context.after(()=>rmSync(fixture,{recursive:true,force:true}));
  const source=join(fixture,'independent-checkout');checkout(source);mkdirSync(join(source,'rust'));
  const supplied=tools(),bin=join(fixture,'bin'),trace=join(fixture,'trace');mkdirSync(bin);
  writeFileSync(join(bin,'cargo'),'#!'+supplied.shell+'\nprintf "%s\\n%s" "$PWD" "$CARGO_TARGET_DIR" > "$TRACE"; exit 73\n',{mode:0o755});
  for(const platform of ['ios','android']) {
    const work=join(source,'target','test',platform+'-current');mkdirSync(work,{recursive:true});
    const target=join(work,'work/cargo-target'),env={...supplied.env,PATH:bin+':'+supplied.env.PATH,HOME:work,
      TMPDIR:join(work,'tmp'),PLATFORM:platform,PRODUCT_WORK_DIR:work,TRACE:trace,CARGO_TARGET_DIR:target};
    const run=(extra={},kind='host')=>spawnSync(process.execPath,[join(source,'scripts/build.mjs'),'native',kind],{env:{...env,...extra},encoding:'utf8',timeout:10000});
    for(const wrong of [source,join(source,'target','test','other'),'.',join(fixture,'foreign')]) {
      assert.notEqual(run({CARGO_TARGET_DIR:wrong}).status,0);assert.equal(existsSync(trace),false);
    }
    for(const name of ['CITIZENWALLET_NATIVE_WORK_DIR','CITIZENWALLET_NATIVE_ANDROID_DIR','CITIZENWALLET_NATIVE_IOS_DIR','TMPDIR']) {
      assert.notEqual(run({[name]:source}).status,0);assert.equal(existsSync(trace),false);
    }
    const link=join(work,'escape');symlinkSync(source,link);
    assert.match(run({CARGO_TARGET_DIR:join(link,'generated')}).stderr,/当前任务且不得经过链接/u);assert.equal(existsSync(trace),false);
    assert.notEqual(run({},platform==='ios'?'android':'ios').status,0);assert.equal(existsSync(trace),false);
    assert.notEqual(run({PRODUCT_WORK_DIR:source}).status,0);assert.equal(existsSync(trace),false);
    const accepted=run();assert.equal(accepted.status,73,accepted.stderr);
    assert.equal(readFileSync(trace,'utf8'),join(source,'rust')+'\n'+target);unlinkSync(trace);
    const independent=run({PRODUCT_WORK_DIR:'',CARGO_TARGET_DIR:'',TMPDIR:''});assert.equal(independent.status,73,independent.stderr);
    assert.equal(readFileSync(trace,'utf8'),join(source,'rust')+'\n'+join(source,'target/build/work/native/cargo-target'));unlinkSync(trace);
  }
});

// 交替编译宿主与真机时，Cargo的真机链接不能继承宿主SDKROOT。
test('iOS原生目标使用已交付Xcode的iphoneos SDK，查询或缺件失败在Cargo前停止', context => {
  const fixture=realpathSync(mkdtempSync(join(tmpdir(),'wallet-native-ios-sdk-')));
  context.after(()=>rmSync(fixture,{recursive:true,force:true}));
  const source=join(fixture,'independent-checkout');checkout(source);mkdirSync(join(source,'rust'));
  const work=join(source,'target/test/current'),bin=join(work,'bin'),sdk=join(work,'iphoneos-sdk'),stdlib=join(work,'stdlib');
  for(const dir of [bin,sdk,stdlib])mkdirSync(dir,{recursive:true});
  for(const name of ['libcore-fixture.rlib','libstd-fixture.rlib'])writeFileSync(join(stdlib,name),'existing');
  const supplied=tools(),trace=join(work,'trace'),xcrun=join(bin,'xcrun'),clang=join(bin,'clang');
  writeFileSync(clang,'#!'+supplied.shell+'\nexit 0\n',{mode:0o755});
  writeFileSync(join(bin,'rustc'),'#!'+supplied.shell+'\nprintf "%s" "$STDLIB"\n',{mode:0o755});
  writeFileSync(xcrun,'#!'+supplied.shell+'\n[[ "$*" == "--sdk iphoneos --show-sdk-path" ]] || exit 91; printf "%s" "$IOS_SDK"\n',{mode:0o755});
  writeFileSync(join(bin,'cargo'),'#!'+supplied.shell+'\nprintf "%s\\n%s\\n%s" "$SDKROOT" "$CARGO_TARGET_AARCH64_APPLE_IOS_LINKER" "$CC_aarch64_apple_ios" > "$TRACE"; exit 73\n',{mode:0o755});
  const env={...supplied.env,PATH:bin+':'+supplied.env.PATH,HOME:work,PRODUCT_WORK_DIR:work,TMPDIR:join(work,'tmp'),STDLIB:stdlib,
    CC:clang,XCRUN:xcrun,IOS_SDK:sdk,SDKROOT:join(work,'macos-sdk'),TRACE:trace};
  const run=extra=>spawnSync(process.execPath,[join(source,'scripts/build.mjs'),'native','ios'],{env:{...env,...extra},encoding:'utf8',timeout:10000});
  const ready=run({});assert.equal(ready.status,73,ready.stderr);assert.equal(readFileSync(trace,'utf8'),[sdk,clang,clang].join('\n'));unlinkSync(trace);
  for(const extra of [{CC:''},{CC:join(bin,'missing-clang')},{IOS_SDK:''},{IOS_SDK:join(work,'missing-sdk')},{XCRUN:join(bin,'missing-xcrun')}]) {
    assert.notEqual(run(extra).status,0);assert.equal(existsSync(trace),false);
  }
});
