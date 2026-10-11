# CitizenWallet 技术文档

## 平台编译现场

本产品编译任务使用本仓 `target/build/<平台>` 独立临时目录，平台键为 `ios`、`android`。不同平台同时领取并执行；同平台已有活跃任务时立即拒绝再次领取。资源准备、工程副本、缓存和编译输出只写本平台现场；确认进程及后代退出、结果被调用方消费后，删除整个平台目录。`target/build` 仅是父目录，`target/test` 仍用于独立测试。独立执行和控制台调度调用同一本仓编译入口与清理接口。

`wallet ios/android` 是完整平台编译入口；`native host` 是该编译任务内的宿主签名库子步骤，沿用已领取的 iOS 或 Android 现场，不另报产品平台。跨平台子步骤仍在执行前拒绝；没有当前任务现场的原生子步骤不得隐式选择平台。

iOS安全验真器消费当前供给的 `SWIFT` 规范真实路径：将其与同一 `DEVELOPER_DIR` 下官方 `Toolchains/XcodeDefault.xctoolchain/usr/bin/swiftc` 的真实目标逐字比较，并确认目标仍在该Xcode内且为可执行普通文件。官方 `swiftc` 可以链接到 `swift-frontend`，不能仅凭真实路径的文件名等于 `swiftc` 拒绝。编译时执行已经核对目标的Xcode原有 `swiftc` 入口，以保持Swift驱动的 `swiftc` 参数模式；不新增替代启动器。

Flutter iOS 的Xcode复制步骤经本仓既有受控 `rsync` 入口调用 `scripts/build.mjs rsync`；该CLI直接使用本仓唯一 `copyFlutterArtifact` 实现，先领取并核对当前平台的 `PRODUCT_WORK_LEASE`，只在本轮目录执行已验真的rsync及产物权限处理。缺失或错误租约在工具启动前拒绝，不新增另一份复制逻辑。

真机XCTest录屏触发导入页保护时，UI回归核对“安全提醒”且敏感输入不存在；未触发保护时继续核对无效词数与第25词拒绝。`test/widget_test.dart` 已独立覆盖24词、超长粘贴及非12/18/24词的输入边界，因此不为通过设备测试关闭或绕过录屏保护。


钱包的iOS和Android安装交付分别确认：iOS在本仓直接验签并安装App，不输出虚构zip；Android保留本仓声明的签名APK并确认交付字节。两个平台均须完成设备回读，编译退出成功不能代替安装终态。

## 三级源码目录与脚本内嵌测试（2026-10-08）

公民钱包根为0级，受控源码目录最大为3级；每个源码目录至少有两个直接文件或子目录。工具约定的`.github`、`lib`、`ios`保留，其他目录以单个小写英文单词命名。`.git`内部状态及整个`target`运行现场不属于源码目录合同；编译工具的必需内部目录只在当前任务现场装配。目录整理不修改功能、页面布局、文案、数据库字段、应用标识、密钥格式或签名算法。

根保留技术文档、README、LICENSE、pubspec及依赖锁；一级源码目录为`.github`、`android`、`icons`、`ios`、`lib`、`rust`、`scripts`、`test`。Dart按wallet、security、storage、protocol、scanner、signing、pages、helpers归档；protocol仅下设bodies和generated，pages仅下设widgets。登录签名处理及链常量归signing，PIN页面归pages。测试按对应职责归档，签名固定向量归test/signing/fixtures。Rust入口为rust/source/lib.rs，由Cargo.toml的lib.path明确指定。

Android源码在android/app/source，资源原件在android/resources；原资源限定目录名成为文件名前缀，装配到当前任务工程时恢复android/app/res下的原限定目录和文件名。iOS原件分别位于config、native、project、resources、source、tests；Xcode工程、workspace、本地化资源、Flutter配置和原生pod目录仅在当前target工程内恢复。同名workspace文件及图标Contents.json通过文件名区分，内容保持唯一原件。图标仍由icons原件生成，无新增设计或图像副本。源码内不得恢复深层原生工程包。

`scripts/` 只保留 `build.mjs` 与 `publish.mjs`。Build 持有本仓编译声明、资源配方与固定工作根，不登记或调用自动化；Publish 独立核验已完成的正式 GitHub Release 资产，实际商店渠道另行确定。iOS、Android 各自的 GitHub 自动化由 `.github/workflows/` 的同名 YAML/MJS 完整创建并回读 Release；自动化生成物只归本次 Runner 临时工程，源码检出根不创建 `build/`。门禁两件文件位于 `.github/tatagate/`，其内嵌增量扫描直接使用现行 `tatagate.mjs` 接口。二维码生成文件唯一真源仍在链端，链端一致性检查路径为 `lib/protocol/generated/qr_bodies.g.dart`。

`node scripts/build.mjs describe` 只读交付产品编译声明；`wallet <ios|android|prepare-ios|prepare-android>`、`native <目标>`、`analysis-options` 继续负责本机工程、原生库与分析规则。图标派生实现位于 `icons/generate.mjs`，Build 仅调用该功能；旧跨仓索引回写已移除，正式自动化对本仓注册表与固定公开链提交只读核对，漂移立即失败。`scripts/publish.mjs identity|inspect` 不调用 Build 或 Workflow，分发输入只来自已完成的正式 Release。


此前目录迁移阶段的隔离验收通过161项Node合同及门禁测试、370项Flutter测试和3项Rust测试，并编译Rust宿主Release签名库；当时Dart静态分析无错误，21条提示所在源码行与整理前相同。该阶段180文件及之后172文件的统计均属于历史快照；现行脚本与自动化目录以下文实际物理结构为准，历史构建、签名安装及真机回读不作为本轮整理的验收。

## 工具与依赖的声明和供给职责（2026-10-08）

本产品完全独立管理全部流程所需的工具、依赖及其它资源需求。需求唯一依据为本仓源码、公开声明、锁文件及本产品拥有的准备配方，包括准确版本、平台、官方来源、摘要或固定提交、闭包、验真方式和失败条件；塔塔控制台按当前产品声明提供资源，不维护另一份产品需求或替产品决定版本、来源与流程步骤。

本产品必须能在没有塔塔控制台时完全独立执行全部已实现流程。独立执行时，本产品自行完成可信引导、资源获取、验真、保存、复用及任务工作视图准备，不依赖控制台源码、私有资料、安装位置或资源库。

通过塔塔控制台执行本产品流程时，本产品向控制台声明所需资源并使用其已准备好的供给。控制台先核对并复用已有的匹配工具与依赖；没有的由控制台按本产品声明下载、准备、验真并保存到控制台工具库或依赖库，再交付本产品复用。本产品负责核验交付与自身需求一致并使用资源，不因控制台缺件或供给失败改为自行下载，也不另建同一资源的永久副本；可写包管理器视图与流程过程数据仍归本产品当前任务工作目录。

两种执行方式使用本产品同一声明、锁和流程实现，仅资源供给职责随执行方式改变。该职责适用于本产品全部平台与已实现流程。独立模式下资源缺失由产品处理；控制台模式下资源缺失由控制台处理。显式离线缺件、交付失败、损坏、错误摘要、来源漂移或越界必须据实失败，不自动升级、覆盖可疑原件或切换执行方式。

当前代码通过公开资源协议执行控制台供给，真实两端完整Build仍待验收；不能以文档更新代替编译、签名、安装及回读成功。

本仓现行入口以 `scripts/build.mjs describe`、独立 `scripts/publish.mjs` 和各平台同名 Workflow 实现为准；本文按日期保留的历史验收只描述当时结果，不作为当前工具、私有调用者或实际商店上传的运行凭证。独立塔塔门禁的职责和未验收状态见文末。


## 当前工作目录归属（第8步，2026-10-06）

本产品测试、编译的当前工作目录及收尾只按本文“本机固定执行目录”执行。独立入口与控制台调用共用本仓流程；永久工具与依赖原件保留在所属执行方式的源码外原件库，本轮可写资源视图、工程、下载半包和测试夹具只进入本产品当前现场。

第8、9步完成目录与路径实现、根文档迁移及测试源码维护，未运行测试、门禁、编译或安装。本文唯一原件位于<本仓根>/CitizenWallet.md；产品接口及流程直接以本仓实际代码和声明为准，业务字典库与其检查已撤销，不另建登记副本。历史验收事实不表示本轮改造已经通过验收，统一测试在第10步进行。根技术文档由本仓门禁按原文、JSON解码值及既有补丁快照扫描机密，仅报告路径；文档迁出不减少资料安全检查。


## 聊天功能的唯一产品归属

**聊天客户端的逻辑功能只能在 TataChatSDK 中实现；聊天服务端的逻辑功能只能在 CitizenServe.tatachat 中实现。公民、途遇及其他产品只依赖使用。**

CitizenWallet 涉及聊天时只作为依赖使用方；本条不代表尚未接入聊天的产品已经具备聊天能力。

- 消息、会话、群组、加密、协议、传输、同步、重试、聊天存储、附件、通话及聊天界面行为，按客户端与服务端职责分别归 TataChatSDK 和 CitizenServe.tatachat；新增功能、缺陷修复和平台差异也必须在所属产品内完成。
- 消费产品只提供产品入口、身份与业务权益结果、服务地址及授权、主题和公开接口要求的平台配置；只通过公开接口接入，禁止复制、重写、包装成另一套聊天内核或维护产品专属聊天实现。CitizenServe、TuyuServe 的产品身份与权益授权不包含聊天数据面的实现职责。
- 本机开发直接依赖仓库路径；公民、途遇等产品的正式版本依赖塔塔聊天正式 Release；第三方市场分发使用公开市场版本。依赖使用不以公开市场发布为前置条件，也不改变实现归属。

钱包签名模式由实际签名路由定义；与CitizenSDK通过实际公开接口保持准确命名和闭集。

本机编译现场为 `citizenwallet/target/build/<平台>/`，测试现场为 `citizenwallet/target/test/`。Flutter 工程视图、`.dart_tool`、Gradle、Pods、临时文件、日志和候选均只属于本轮现场，源码目录不得承载生成状态；每轮工具退出后彻底清空。

当前依赖边界：钱包自己的源码和锁文件决定依赖、版本和来源。本机iOS、Android适配分别在各自完整流程中交付既有验真工具，并按钱包pubspec.lock与rust/Cargo.lock离线准备本任务Pub和Cargo目录；经控制台执行时，已有原件由控制台供给，缺件由控制台按本产品声明取得、验真保存后供给；独立执行由产品自行处理。明确离线缺件、未知来源或回执越界据实失败。两个平台独立实现，不调用对方流程或公民SDK实现。Android继续交付已登记Gradle并由钱包入口对照自身声明回验；iOS交付Flutter随包Dart、Python、Rust/Cargo、Git、CocoaPods和同一登记Xcode工具，现有pod入口绑定受控Ruby和Gem。工具版本不变，独立环境仍由调用方按钱包声明准备。

iOS 原生签名库由钱包脚本编译到本轮外部目录，源码 `ios/native/citizenwallet_signer.podspec`（装配后为任务工程的 `ios/signer/citizenwallet_signer.podspec`） 通过既有 `-force_load` 绝对路径及八个 `-Wl,-u` 符号将其链接到 App；不设置 CocoaPods 只接受相对路径的 `vendored_libraries`。此调整仅修复 Pod 安装阶段的路径校验，不改变签名库实现或 FFI 合同。

本机 Build 边界：Worker创建独立任务并清空本产品固定build现场；控制台按钱包公开资源需求交付验真工具和锁定依赖，再调用钱包完整入口。测试、编译、密码学实现和产品失败条件由CitizenWallet独立维护。钱包入口在 Pub 依赖就绪后，先用已登记 Node 运行钱包自身构建合同测试，再将宿主 FFI 动态库编译到本轮源码外 Cargo 目录，运行 `flutter test --no-pub` 全套钱包单元与组件测试；测试失败即停止该端 Build，不进入平台编译、签名或安装。Android产品入口把本轮Flutter配置选出的Android SDK及调用方JDK传给同一次Gradle调用，固定携带 `--no-daemon`，仅整体离线模式再追加 `--offline`；本机未提供JDK时使用Android Studio随包JBR，不在Worker增加前置检查。iOS/Android 编译成功后进入设备安装收尾，日志只写对应缓存目录。

公民钱包 iOS 本机 Build 在已签名 Release 编译后、交付原生安装收尾前，使用钱包工程的 `RunnerUITests` 在唯一可用 iOS 真机运行 XCUITest。现有 Runner 方案只引用 `RunnerUITests/RunnerUITests.xctestplan`；计划保留原有 `RunnerTests` 和新增 UI 目标，并将自动屏幕采集设为关闭，避免测试采集触发钱包既有录屏保护。创建页测试只切换 12/18/24 词，以当前熵说明核验选择状态、比较密码框与词数选项宽度；导入页只输入非词表占位词，按 Flutter 可访问标签核验非法词数提示与第 25 词被拒绝。选择页左缘返回和备份页返回拦截由钱包组件测试覆盖；真机合成左缘拖动未能稳定复现原生手势，不能以该动作的 XCUITest 断言证明真实手势行为。测试不创建、导入或导出真实钱包，不输入真实密码或助记词；设备未解锁、设备不唯一、敏感页录屏保护触发或测试失败时 Build 失败，绝不绕过保护。Xcode 入口按控制台唯一登记版本校验后传给钱包脚本，测试编译物及结果仅写本轮钱包 iOS Build 工作目录，失败时禁止 Xcode 自动采集设备诊断包。
真机 UI 测试从首页进入创建/导入页时，无钱包直接点击首页按钮；已有钱包先点“添加钱包”，再按标题前缀定位底部菜单的 `StaticText`。真机可访问树显示该 Flutter InkWell 把标题与副标题合并到同一个 `StaticText` 标签。

iOS `Podfile` 的 post-install 钩子修正 Isar 静态 XCFramework 的输出清单。首次安装时先创建准确的 Isar 目标支持目录，再写 `libisar.a` 清单；生成物只位于本轮工程的 `Pods` 目录。
`Podfile` 从本轮工程目录读取 Flutter 插件清单，即使本轮工程的 Podfile 由源码链接而来，也不回到源码根。钱包 iOS 构建入口在运行 CocoaPods 前把指向源码的 `Podfile.lock` 链接原子替换为本轮工程普通文件，构建生成的锁文件不回写源码；产品锁文件仍以钱包源码为唯一受控输入。

钱包两端Build由产品完整入口完成签名验真、安装和回读；iOS直接使用本轮Runner.app，Android未签名候选与已签APK均只属于本轮build现场。Android 产品脚本把 Flutter Gradle 插件的 Kotlin 持久会话目录和插件编译目录一同导向本轮外部工作目录，避免向只读工具原件写入；不改变插件或 Kotlin 版本。

本文是公民钱包（CitizenWallet）唯一技术事实文档。

公民钱包的 Dart 静态分析规则唯一位于 `citizenwallet/scripts/build.mjs` 的 `ANALYSIS_OPTIONS_SOURCE`；塔塔任务只在受控工作目录生成 Flutter 工具要求的根配置，不向产品源码根写入配置或分析产物。
公民钱包根 `pubspec.yaml` 与 `pubspec.lock` 保持 Flutter 工程和依赖锁真源；源码不跟踪 Flutter 自动生成的 `.metadata`，塔塔任务在自己的受控工作目录生成所需项目元数据。

## Android受控工具配置

共享hardware-secretvault插件只消费宿主的受控AGP与内置Kotlin，删除插件独立版本声明和kotlin-android入口；使用公开compilerOptions保持JVM17、API36和最低API24，不改变硬件密钥实现、命名空间或依赖。

CitizenWallet在独立环境由调用方按产品声明交付工具；控制台环境由对应平台适配核验并交付同一工具库原件，产品只读取自己的参数与环境合同。

Android工程统一使用Gradle9.1.0、AGP9.0.1、Kotlin2.2.20，与塔塔工具库及受控Flutter修订一致；开启新DSL与内置Kotlin。根工程把AGP与KGP放入同一个buildscript依赖图，settings不再提前创建只含AGP自带KGP2.2.10的插件类加载器，Flutter读取到的实际KGP因此与声明版本一致。应用不再应用独立Kotlin Android插件，字节码使用公开compilerOptions并保持Java17；应用脚本显式导入JDK类型，资源与JNI源集通过AGP9公开`directories`集合登记。锁文件已无isar_flutter_libs，删除针对它的反射及多接口尝试配置。应用标识、版本、签名、ABI和业务依赖不变；配置合同通过不代表APK构建或设备安装已通过。

### citizenwallet 公民钱包 PQC 抗量子签名升级技术设计

- 状态:设计 / 待实现。**真源 = `CitizenWallet.md`**(取代旧 PQC 迁移方案)。
- 任务卡:`历史实施记录《抗量子钱包派生签名》（卡已删除，规范以本文为准）`。

#### 设计要点

- `citizenwallet` 完全离线,PQC 后仍须纯离线完成 ML-DSA-65 签名,不依赖在线服务。
- **同源派生(model B 全 `//index` 无根,sr25519 不套 HKDF)**:每账户 `account_seed_N` = 该账户 child mini-secret(账户 N = 助记词 `//N` 硬派生,账户0=`//0`,无 bare 根);sr25519 地址锚点 = `sr25519.fromSeed(account_seed_N)` **直接派生**(不经 HKDF);ML-DSA-65/ML-KEM-768 才用 `HKDF-SHA512(account_seed_N, "GMB/account/ml-dsa-65" | ".../ml-kem-768")`。冷热共用 `gmb-pqc` crate(原生 C FFI)。
- **可选 password**：创建/导入可把用户输入的 Substrate BIP-39 `password` 交给
  `miniSecretFromEntropy`；空值保持原钱包不变。四端校验、NFKD、输入框和非空风险确认
  公民钱包实现位于 `citizenwallet/lib/wallet/wallet_password.dart`。CitizenWallet 只加密保存最终 master seed 与标准
  12/18/24 词助记词，不保存 password；日常签名和加账户继续从 master seed 派生，重装恢复
  时由用户重新输入原 password。非空 password 必须为 6–30 位并通过统一字符
  白名单；实际依赖版本由钱包 `pubspec.lock` 锁定。
- **统一硬件严档**：公民钱包 Dart 边界位于
  `citizenwallet/lib/security/hardware_secretvault.dart`，原生实现位于钱包 Android/iOS
  工程。CitizenWallet 每只钱包独占硬件 KEK，Secure Storage 只保存
  master `MiniSecretKey` 和助记词的信封密文；不保留应用级软件加密密钥或旧密文兼容路径。
  Flutter 平台通道返回的 TypedData 按引擎所有的只读借用缓冲区处理，共享包必须立即复制
  为应用自有可修改数组；添加账户、签名、查看助记词和导出私钥仅使用该副本并在
  `finally` 清零。不得直接覆写平台结果，也不得吞掉自有缓冲区的清零异常。
- **签名链身份**：完整 `SigningPayload` 必须严格匹配正式 `genesis_hash`
  和 `transaction_version`；`spec_version` 只解析展示。裸 call data、错链、错交易版本
  和 birth hash 不等于 genesis hash 均拒绝签名。
- 创建页内容从顶部开始排布，主标题固定为“选择助记词数量”；导入页顶部唯一标题固定为
  “输入助记词”，输入框上方不得保留重复标题。共享 password 弹窗标题居中，取消与确认
  按钮左右等宽，四端不得复制第二套布局或风险文案。
- 创建页沿用原有选择控件与备份流程，提供 12、18、24 词，默认 12 词；选中选项
  只保留选中状态，不显示勾号，词数选项与钱包密码输入框使用相同可用宽度。18 词使用
  English BIP-39 的 192 位熵，说明为“192 位熵，词数与安全性平衡”；12/24 词
  说明保持原样。导入页计数提示显示三种词数，键入、粘贴和候选词补全最多 24 词，
  允许修改已输入的词；提交前明确提示非 12/18/24 词错误，钱包导入入口独立执行同一
  词数闭集校验，再走原 BIP-39 拼写及校验和验证。派生、硬件信封存储和备份查看继续
  走公民钱包既有流程，不引入新的钱包格式或额外步骤。
- 创建前的词数选择阶段不注册 `PopScope`，保留 AppBar 返回按钮、系统返回和 iOS 左缘返回手势。只有生成
  助记词并进入备份展示后，才注册禁止用户返回的 `PopScope`；该阶段唯一页面退出入口为底部
  “已备份，完成”。钱包创建入口对 12/18/24 词执行运行时闭集校验，Release 也拒绝
  非法词数，不把非法请求静默改为 12 词。组件测试在真实异步上下文触发创建并等待
  密钥和数据库写入后，分别检查两个阶段的返回交互。
- 助记词、私钥和离线签名内容只在原生屏幕保护确认启用后进入可见状态；启用失败、
  已在录屏或保护事件通道失败时隐藏敏感内容。多个页面共享的保护开关按调用顺序串行化，
  进程级事件订阅只建立一次，页面间不反复取消和重建；无保护租约时忽略事件。
  原生启停队列空闲后释放已完成 Future，下一页从当前异步上下文开始排队，避免
  异步启停和迟到事件污染下一页。创建前的非敏感词数选择页保持原界面，在实际生成钱包前等待保护
  就绪；保护失败时不生成钱包。原生启用失败可重试，安全事件通道失效则在进程重启前持续拒绝展示秘密。备份展示阶段的敏感内容若被隐藏，用户可重试保护，
  该阶段仍只能经“已备份，完成”退出。
- 钱包接受的临时签名/登录请求必须尚未过期，且到期时间距离本机当前时间不超过 24 小时；
  超出范围的请求在展示签名内容和占用防重放记录前拒绝。防重放记录在占用事务中按键前缀
  和过期时间批量清理，避免逐条读入 Dart 与逐条删除。签名二维码解析只进行一次 JSON 解码。
- Flutter 测试加载 Isar Core 时优先使用显式 `ISAR_CORE_LIB_PATH`；未指定时仅从当前工程
  `.dart_tool/package_config.json` 解析锁定的 `isar_community_flutter_libs` 实际路径，
  不扫描用户全局 Pub 缓存中的其他版本。测试清库先等待仍在打开的 Isar 实例完成，
  再关闭并删除测试库，避免页面异步加载与下一例清理交错。
- **无感 bootstrap**:未绑定账户首次扫码,**同一确认**同时出 sr25519 bootstrap 签名(证旧地址主人)+ ML-DSA 交易签名;后续只签 ML-DSA。**无单独绑定步骤、无账户状态切换**。
- **QR 扩展**:`sig_alg(sr25519|ml-dsa-65)` + `auth_mode(normal|pqc|bootstrap-pqc)` + `key_version` + `chunk_index/chunk_total`(ML-DSA ~3.3KB,最坏体积按 bootstrap 实测分片)。
- **安全**:`account_seed`/私钥不出本机、不进二维码；payload 严格匹配 `genesis_hash`
  与 `transaction_version`，`spec_version` 只解析展示；bootstrap 强度=sr25519，窗口须在
  量子破 sr25519 前关闭。

> 本节长期设计以本文为唯一技术事实文档；当前功能须以公民钱包实际代码与测试为准。

#### 当前账户与本地存储模型

- CitizenWallet 是完全离线的 `Cold` 签名设备，不保存也不需要
  CitizenApp/Node 的路由字段；路由由联网端按目标 `account_id` 的 `SignMode`
  决定。CitizenWallet 只接收 `Cold` QR_V1 请求，不能替 `Hot` 账户降级签名。
- SquarePost(34) 的钱包账户冷签已覆盖 `publish_post(0)`、`subscribe(1)`、
  `cancel(2)`、`set_creator_plans(3)`、`change_subscription_plan(4)`、
  `propose_set_platform_price(5)` 和 `update_creator_tier_name(6)`。离线端必须独立
  解码并展示帖子、收款主体、档位、周期、价格和完整 SigningPayload
  链上上下文；收款主体/套餐不匹配、重复档位/周期、零价、无效 UTF-8、
  裸 call data 或任何未登记动作一律红色拒签。
- Android `main` manifest 本来就不申请 `INTERNET`；已删除 debug/profile 变体中
  额外的 `INTERNET` 声明，全部构建变体都不得恢复网络权限。

- `AccountId` 是 CitizenWallet 内的钱包身份、Isar 唯一索引、重复检查和签名目标核验
  真源；Dart 使用 `accountId`，文本固定为小写 `0x` 加 64 位十六进制。
- `ss58Address` 只用于页面展示、用户二维码和扫码输入输出，不作为授权、去重或
  持久化身份主键。
- `signerPublicKey` 只表示真实签名公钥。当前 sr25519 的 `AccountId32` 直接取该公钥
  32 字节，因此登录和离线签名可做字节等值核验；不得据此把字段重新混称为
  `pubkeyHex` 或裸 `address`。
- `WalletProfileEntity` 最终字段保存 `accountId + ss58Address + ss58Prefix` 及钱包
  展示元数据，不重复保存同一 32 字节值的公钥别名。
- 正式创世切换前，CitizenWallet 已只按最终 Isar schema 完成旧业务库重建；运行态不执行
  旧格式 migration，不读取旧 `address` / `pubkeyHex` 字段。正式创世后不得再把开发期
  “删除重建”口径用于现行钱包数据或安全材料。
- Secure Storage、Android Keystore、iOS Keychain 中的 seed、助记词密文、PIN
  派生材料和私钥保护材料不属于 Isar 业务数据，业务库重建不得删除或改写它们。
- CitizenWallet 的 Isar 引擎固定使用 `isar_community`、
  `isar_community_flutter_libs`、`isar_community_generator` 3.3.2。旧 Isar 3.1
  预编译 `libisar.so` 只有 4 KB ELF 对齐，禁止恢复；community 引擎的
  arm64-v8a/x86_64 `libisar.so` 必须保持 `0x4000` 或更高。
- Isar 引擎升级不得改变 `WalletEntity`、`AccountEntity`、`AppKvEntity` 的
  Collection ID、字段或索引。3.1 业务库已用非敏感测试数据验证可由 community 3.3.2
  原地打开、按索引读取并继续写入；生成 schema 只允许更新引擎版本字符串。
- community 引擎使用 `<name>.isar-lck`；启动前幂等删除 Isar 3.1 遗留的空
  `<name>.isar.lock`。该清理只处理旧锁文件，不删除 `<name>.isar` 业务库或任何
  secure storage 数据。
- Android 发布产物必须同时验证两层：APK 用 Build-Tools 35+ 执行 16 KB ZIP
  alignment 检查；APK/AAB 内 arm64-v8a 与 x86_64 每个 `.so` 的 ELF `LOAD` 段不得
  出现 `0x1000`。普通 4 KB 真机或模拟器只能验证升级安装和冷启动，不能冒充 16 KB
  内核运行态。

#### CI 与发布边界

- CitizenWallet 复用统一 QR_V1 动作 `publish=15` 为 外部调用方 生产发布提供离线批准。
  载荷按固定 SCALE 字段序严格解码产品、平台、版本 Tag、源码 SHA、产物 SHA-256、上一部署
  编号、过期时间和 nonce；任何未知组合、截断、尾随字节或信封过期时间不一致都红色拒签。
  签名字节使用全仓 `OP_SIGN_PUBLISH=0x24` 哈希域，不建立第二套扫码协议。
- 生产发布授权闭集固定为十三个产品端：`citizenapp/ios|android`、
  `citizenwallet/ios|android`、`citizenserve/cloudflare`、`citizenweb`、
  `tuyulove/ios|android`、`tuyuserve/cloudflare`、`tuyuweb`、
  `tuyubooking/macos|linux|windows`。审阅摘要必须显示准确中文产品名“公民”“公民钱包”
  “公民服务端”“公民官网”“途遇”“途遇服务端”“途遇官网”“途遇商家端”；旧产品标识、
  非法产品端交叉组合和调用端自带展示名一律拒绝，不保留兼容映射。

##### 永久应用标识与平台接线（2026-08-09）

- Android 的唯一永久应用标识与 namespace 均为 `com.crcfrcn.citizenwallet`，Kotlin 入口包为
  `com.crcfrcn.citizenwallet`；iOS 的唯一永久 Bundle ID 为 `ios.citizenwallet`，测试目标为
  `ios.citizenwallet.RunnerTests`，签名团队为付费团队 `MHYMVRN6FC`。
- 截屏保护和安全事件属于应用内部 Flutter/原生协议，唯一通道分别为
  `citizenwallet/security` 与 `citizenwallet/security_events`，不得与 Android/iOS
  应用标识耦合。
- CitizenWallet 不使用 Firebase、FCM 或 APNs，本次标识切换不新增对应配置。
- 用户已明确选择不迁移旧应用沙箱、Android Keystore 或 iOS Keychain 数据；新标识首次
  安装按新应用初始化，钱包通过既有助记词重新导入。代码不得新增旧标识兼容、旧数据读取
  或卸载旧应用逻辑。
- Apple Developer 付费团队 `MHYMVRN6FC` 已注册显式 App ID `ios.citizenwallet`。本机安装
  继续构建同一 Bundle ID 的 Release 配置，并由 Xcode 自动选择团队通用开发签名；禁止长期
  保留产品专属 Development 描述文件，也不得为强制选用显式描述文件而把 Runner 的签名设置
  传播给不支持描述文件的 CocoaPods targets。
- App Store 分发验收使用 Xcode 自动签名生成 Apple 管理的 Distribution 证书和
  `iOS Team Store Provisioning Profile: ios.citizenwallet`，导出包必须同时满足：Bundle ID
  为 `ios.citizenwallet`、TeamIdentifier 为 `MHYMVRN6FC`、`get-task-allow=false`。本次只验证
  本地 archive 与 IPA 导出，不创建 App Store Connect 应用记录、不上传发布包。
- `isar_community_flutter_libs` 的 iOS 切片是静态库 `libisar.a`。CocoaPods 1.17 生成
  XCFramework 输出清单后，Podfile 必须把唯一输出修正为
  `${PODS_XCFRAMEWORKS_BUILD_DIR}/isar_community_flutter_libs/libisar.a`，避免 Xcode 27
  在静态库复制完成前启动链接器；不得修改 pub cache 或恢复手工预构建流程。

- 现行两端均由 `.github/workflows/release-<平台>.yml` 与同名 MJS 独立执行正式自动化，不恢复旧 CI 文件或 Debug 包。注册表的固定公开链提交由 `lib/signing/chain_constants.dart` 唯一声明；工作流只读核对 Pallet 和业务调用索引，漂移失败，不从邻仓回写钱包源码。
- 本机移动端 Build 在依赖准备前交付已验真 Flutter 与随包 Dart，工具缺失或验真失败立即停止；自动化不调用本机 Build。转账入口保持 `OnchainTransaction(4).transfer_with_remark(0)`，不得恢复 `Balances` 直签入口。
- 自动化逐件验收 Android APK/AAB 或 iOS IPA，完成正式签名、资产回读并直接创建本端 GitHub Release；iOS 与 Android 的版本及 build number 各自独立推进。
- `APP_KEY` 与 CitizenApp 共用，作为固定 GitHub Repository Secret，内容至少包含
  `keystore=<base64后的jks>` 和 `password=<keystore密码>`；默认 alias 为 `upload`，可增加
  `alias=<key别名>`，key password 默认复用 `password`。禁止普通查看、长期 keystore 文件和
  调试签名回退。
- `IOS_KEY` 同样与 CitizenApp 共用，CitizenWallet 描述文件由固定 Secret
  `WALLET_PROFILE` 提供。加密 PKCS#12 与临时钥匙串只在 Release
  runner 当前 job 内存在，随后立即清除。禁止普通查看、登录钥匙串长期私钥和密码认证回退。
- 禁止 `continue-on-error`；单端失败必须使该端 Release 失败，但不得阻断另一端独立成功。

## Release 全量构建（第 7.4 步）

正式 Release 固定从干净源码执行全量构建，显式关闭 Rust 增量编译及工具链内置缓存，不读取CI作业缓存且不复用本机编译中间物。版本、签名、校验、产物和发布流程保持原有产品合同。

## 移动 Release manifest 公开平台身份（GMB 第 2.12 步，2026-09-02）

- Android 正式 APK/AAB 的公开 manifest 资产项统一使用 `Android`，iOS 正式 IPA 统一使用
  `iOS`。内部 action target、workflow、版本 Tag 与签名 wire 继续使用既有小写机器值；本步只在
  明确的公开制品边界映射，没有建立第二套 CI 或 Release 流程。
- 当时的独立发布清单测试（现已并入 `scripts/build.mjs`）直接提取并执行 外部调用方 受控复合 Action 的真实
  Node writer，锁定 writer 所属 Release job、七个顶层字段、三个资产字段、产品与原生应用身份、
  实际文件 SHA-256 和精确资产闭集。该历史测试当时由两个移动CI执行；当前脚本回归统一由塔塔门禁执行。
- 外部调用方 的 Citizen 移动严格验证器由 CitizenApp 与 CitizenWallet 共用。CitizenWallet iOS
  只接受 `citizenwallet.ipa`，Android 只接受 `citizenwallet.apk` 与 `citizenwallet.aab`；两个平台
  都同时固定 Bundle ID `ios.citizenwallet` 和 Android package
  `com.crcfrcn.citizenwallet`。TUYU 产品在进入字段或平台解析前旁路，未被本步提前迁移。
- 严格验证先于候选二进制读取、Keychain 凭据访问和 App Store Connect/Google Play 网络写入；
  GMB 跨仓守卫同时冻结正式发布入口的顺序，避免只验证候选检查入口而遗漏真实发布路径。
- 本机最终定向验证 39/39 通过：真实 writer 3/3、受控路由与缓存 3/3、GMB Rust 守卫
  20/20、原生发布器 XCTest 13/13；Node、JSON、YAML 与 Rust 格式检查也通过。XCTest 仅以命令级
  排除正式打包阶段才注入的 外部宿主专用 运行资源，不冒充正式 外部调用方 安装包。
- 299MB 测试与编译输出只进入受控目录，已整体移至可恢复的系统废纸篓
  `/Users/rhett/.Trash/gmb-platform-naming-step2-12-final-20260902-165915`。未运行远程 CI、正式
  Release、商店发布或部署，也未启动、停止、安装或重启 外部调用方。

## 发布授权签名

发布解码器只登记现存产品与准确平台；previous_deployment_id必须非空。外层期限、0x24签名域、一次性请求和尾随字节校验保持。

## Flutter 独立缓存工程视图（2026-09-10）

本机产品入口必须显式传入 `CITIZENWALLET_PROJECT_ROOT`，指向已有的源码外 Flutter 工程目录；独立调用也使用同一参数。入口在执行任何 Flutter 命令或创建目录前，验证工程根、`.dart_tool` 和其它输出目录的真实路径，拒绝缺参、相对路径、源码内目录及链接回源码。两端 Build 适配将已创建的工程视图传给该参数；只切换工作目录不足以改变产品入口的工程根。`flutter config --build-dir` 只设置编译输出，不能代替 Pub 工程根隔离。

CitizenWallet 的 iOS、Android 本机 Build 分别用准确平台缓存的 `flutter-project/` 承接 Flutter 生成状态。产品脚本的真实路径决定只读钱包源码根；签名原生库的 Cargo 输出、Pub、Gradle、Pods、Flutter build 和临时文件均进入该平台缓存。不得因控制台工程视图改变钱包依赖、业务入口或原生签名实现。

Android 的 Flutter/Pub 阶段先在缓存根生成 `local.properties` 和插件清单，Gradle 阶段只从 `<本仓根>/android/` 真实根启动。产品 Gradle 根据当前 Flutter 根读取这些生成状态，并把项目缓存、依赖缓存和编译物继续写入准确 Android 缓存；不再让跨根 `settings.gradle.kts` 符号链接参与 Gradle 根解析。

Kotlin 的工程持久状态独立于 Gradle 项目缓存；产品入口通过官方 `kotlin.project.persistent.dir` 工程属性定向到 `${BUILD_WORK_DIR}/kotlin-project`，禁止在源码 `android/.kotlin` 写入。入口的写前真实路径校验同时覆盖该目录，已有链接指回源码时立即失败。Flutter 插件工程继续使用其独立的外部 Kotlin 目录。属性职责以 [Kotlin 官方文档](https://kotlinlang.org/docs/gradle-configure-project.html#kotlin-gradle-plugin-data-in-a-project) 为准。

受控 Flutter 插件工程只开放 Gradle 9.1要求的目录所有者写位，插件文件仍为只读验真原件。CitizenWallet Android 的任务级 Gradle初始化脚本把插件构建目录导向本平台缓存，并关闭源码根 Problems Report，禁止重新产生产品源码 `android/build/`。

## 2026-09-11 Android 产品侧 JDK 路由

CitizenWallet Android 从真实产品 `android/` 根调用自己的 Gradle Wrapper。产品入口保留调用方显式 `JAVA_HOME`；本机任务未提供时，将 `/Applications/Android Studio.app/Contents/jbr/Contents/Home` 作为本次 Gradle 子进程的 `JAVA_HOME`，并把其 `bin` 置于该子进程 `PATH` 首位。产品不运行 Java 版本探测或准入检查，Gradle 对实际工具可用性负责并直接返回结果。

该路由只属于 CitizenWallet 产品脚本。Worker 仍只创建任务、清空准确 Android 缓存并启动产品入口，不注入、校验或等待 JDK，因此控制台不会因产品 Java 状态阻塞任务创建和流程转交。

真实任务 `789452335` 已由 `/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/java` 启动产品 Wrapper 与 Gradle 9.1.0，旧的“Unable to locate a Java Runtime”没有再出现。Gradle 随后因产品 Kotlin 2.2.10 低于当前 Flutter 最低 2.2.20 而停止；本轮没有跳过产品依赖校验，没有生成 APK，也没有安装手机。

## 2026-09-11 Android AGP 9 插件兼容与本机安装验收

CitizenWallet Android 的实际 KGP 已与受控 Flutter 修订统一为 2.2.20。锁文件只推进现有约束内的 Android 平台实现：`image_picker_android` 0.8.13+23 和 `mobile_scanner` 7.4.2；`lib/pages/scan_page.dart` 继续通过 `image_picker` 读取相册二维码，因此该依赖有真实业务用途且未删除。两项新版实现均已在 AGP 9.0.1、Gradle 9.1.0 下完成 Kotlin 编译。

产品脚本在原生库和 APK 包内符号验证通过后，将无私钥候选复制到当前产品/平台缓存根的固定 `android.apk`。此文件只作为同一 Build 的原生安全收尾输入；原生层继续独立验证普通文件、包名、未签名状态、版本与签名证书，不从产品脚本接收私钥。

真实任务 `676370011` 报告 `BUILD SUCCESSFUL in 49s`，429 个 Gradle 任务全部执行；`citizen_sr25519_*`、`account_crypto_*` 与 APK 内 arm64 原生库门禁通过。随后原生安全进程完成签名验真与受控产物保存，设备安装及产品身份、版本回读通过，最终状态为“任务完成”。
### 产品流程物理归属





本产品的 iOS、Android 自动化分别使用各自的 YAML/MJS，主 Job 为 `flow`；各端自行完成版本、工程装配、原生构建、签名、资产验真、正式 GitHub Release 与历史清理。独立 `scripts/publish.mjs` 只消费成功的自动化产物并准备商店分发，商店上传渠道尚未实现；三条流程不互相启动或调用。

两端自动化在 `RUNNER_TEMP` 内复制源码并装配 Flutter 工程，图标、Flutter、原生库和签名资产都归本次临时工程。自动化的资产收集只读取该工程的 `build/release`；原始检出只作为只读脚本和配置输入，不创建或链接根层 `build/`。签名域、二进制前缀域与 SCALE 金标由本仓夹具承载，门禁按 `ChainConstants.registrySourceSha` 指定的公开链提交逐项核对；Flutter 测试消费已验真的本仓夹具，不声称运行时读取邻仓。

每个 `flow` Job 先装载本仓声明的 Node 25.2.1，再由同名自动化的 `job` 入口领取并公布本次 Runner 工作目录与原生输出目录，然后顺序执行本平台步骤。iOS 的 IPA 只写入该工程的 `build/release`，与清单生成及资产收集使用同一目录。iOS 正式资产闭集为 `citizenwallet.ipa` 和 `citizenwallet-release-ios.json`；Android 为 `citizenwallet.apk`、`citizenwallet.aab` 和 `citizenwallet-release-android.json`。收集及上传前均拒绝缺件、多件、链接与错误目录，不提供任意路径收集命令。历史版本仅取准确平台、成功 Run、工作流、事件、分支、提交和运行尝试均一致的正式 Release；当前运行序号继续作为版本下界。

账户标识文本的唯一校验入口为 `lib/helpers/account_id_text.dart`；审阅字段转 SS58 也调用同一入口，不另存同形正则。冷端的账户与立法载荷解码只按公开线协议自有实现，不把热端某个源码路径作为执行或维护依赖。

## 目录整合与平台输入

图标原件唯一存放于根目录 `icons/`：界面圆角图、启动页图、iOS 方形应用图、Android 旧版启动器图与自适应前景分别保留原有外观；扫码 SVG 也在该目录。Flutter 仅声明实际使用的界面 PNG 与 SVG，不把平台母图打进 Dart 资源包。`scripts/build.mjs icons` 使用 Node 标准库从原件生成尺寸，Build prepare 与 Shell 平台准备/构建共用该入口，只允许写本轮target/build工程。iOS 图标槽位原件归 `ios/resources/AppIcon.json` 与 `ios/resources/CitizenLaunchLogo.json`，装配为任务工程 `ios/IconAssets/` 的槽位配置；图片生成到任务工程 `ios/build/Assets.xcassets/`；Android 图片生成到任务工程 `android/build/generated-icons/`，由 Gradle 与任务工程 `android/app/res/` 的 XML 合并。圆形启动器名称通过 XML 别名复用普通图标；iOS 相同像素尺寸共用一个文件。源码不保留平台尺寸副本，也不再保留根 resources 目录。

Android 主源码及 Manifest 原件位于 `android/app/source/`，装配为任务工程 `android/app/src/main/`；单测 `android/app/HardwareSecretvaultPluginTest.kt` 单独登记测试源集，禁止进入正式包。Android XML 原件位于 `android/resources/`，装配时恢复任务工程 `android/app/res/` 的标准限定目录。iOS Swift、Plist 与头文件位于 `ios/source/`，Storyboard、字符串与图标配置位于 `ios/resources/`，单测位于 `ios/tests/`，Runner scheme 位于 `ios/project/`；构建只在任务工程恢复 Runner、测试包及资源目录。

`node scripts/build.mjs wallet prepare-ios|prepare-android` 仅装配本产品源码外工程，拒绝重复目标和链接回写；本机 Build 消费调用方工程，远端 Pub/构建使用已装配工程。远端 `prepare-android` 从 `FLUTTER_ROOT` 指定 Flutter 的 `bin/cache/artifacts/gradle_wrapper/` 逐字节复制三个 Wrapper 工具文件，工具缺失、链接或重复来源直接失败；本机 Android 使用已登记 Gradle，产品不保存 Wrapper 副本。iOS 注册表与 SwiftPM 生成状态不进入源码视图，Android 配置唯一源为 `android/gradle-wrapper.properties`。扫码测试归入 `test/scanner/`。

AGP 9 将 Kotlin 与 Java 源集分开处理：扁平 Kotlin 目录必须通过 `sourceSets.<name>.kotlin` 显式登记。仅修改 Java 源目录会生成缺少 MainActivity 的 APK；验收必须检查入口类及真机启动，不能以 Gradle 成功或安装成功代替。

AGP 9 新 DSL 的源码路径使用 `directories`，不调用已废弃的 `setSrcDirs`；钱包根目录的单个 Kotlin 测试通过 `UnitTestKotlin` 编译任务登记单文件，不能递归扫描整个 app 根。

Flutter 插件注册表只生成于当轮外部工程的 `android/app/src/main/java`，main Java 源集显式消费这一目录。清理源码旧注册表后仍须能完整构建；APK 验收同时检查 MainActivity 与 GeneratedPluginRegistrant，并验证真实平台通道可用。

Android CI 使用实际登记的 `:app:testDebugUnitTest` 运行硬件金库单元测试；正式应用仍仅构建和安装签名 Release。
## 完整产品组织与执行合同

本产品为离线冷钱包；名称仅允许`CitizenWallet`、`citizenwallet`、“公民钱包”，禁止旧名与别名。

所有者：`citizenwallet`，正式源码根 `<本仓根>`；本说明属于该完整产品。组件不会拆成独立仓库或目录产品。所有执行身份统一为 `产品.平台.流程`，单平台物理目录省略平台层，执行身份仍保留真实平台。

真实平台目标：`ios`、`android`。

仓库推送仅上传本仓已经保存的main提交。控制台推送的唯一实现为console/tuisong.mjs，每仓一次生物识别，授权成功后建立独立任务，任务栏记录Git进度、准确SHA、取消及成功/失败终态。只执行Git与GitHub main只读回查，不执行源码、依赖、注释、文档、测试、签名或资源门禁；不派发产品Workflow、不运行hooks、不续签或重复认证、不自动重试、合并或强推。

本仓已移除GitHub main推送门禁触发器；main上传后不自动运行产品自动化。自动化由用户单独发起，产品仍拥有自己的Workflow、声明、资源、测试和产物实现；产品不导入控制台源码，不依赖控制台工具库、私有规则或其它仓库工作树。控制台只是可选Git客户端。各仓可独立使用公开Git接口完成仓库操作，公开SDK依赖不构成流程耦合。


技术文档由所属完整产品仓根唯一持有；私有规则和任务库由控制台私仓持有，公开产品不读取它们。公开门禁不依赖私仓资料、安装包源码、其它本机产品或个人账号；必要链真源只读本仓明确固定的公开40位SHA，不在门禁中跟随main。本机开发跨产品验收仍比较三仓已保存快照与各端真实镜像。

### 门禁与开发审查职责

准确中文注释按开发阶段逐项复核，不以保留源码每文件包含汉字作为仓库门禁的开发凭证。初始完整内容、生成文件和上游原件保持原文；真实第一方临时注释、机密、源码输出、Workflow、依赖和适用测试仍由本仓同提交门禁验真。公民门禁只把scripts中的Node命令行结果报告识别为CLI输出；本仓实际执行测试的准确协议拒绝断言不属于新运行协议，字符串、注释、模板和未登记测试中的同文不豁免。保存及推送仍逐仓独立授权，并以本机门禁和同SHA的GitHub门禁双成功为唯一终态。

本仓推送门禁按准确既定资源/API/ABI或正式软件Tag判断协议归属，不把平台资源目录、已冻结接口类型及软件版本当作新增二维码协议。拒绝断言识别同时把JavaScript正则字面量作为不可执行文本边界，避免正则中的引号改变后续语句归属；未知版本化地址、类型、资源及伪装在注释/字符串中的拒绝语句仍失败。既有业务源码与测试不改。

源码身份读取本产品普通 `pubspec.yaml` 中唯一的 `citizenwallet` 包名，拒绝错误名称、重复名称和符号链接；检出目录可以由本机门禁或 GitHub Runner 任意命名。源码外工程、平台输入与链接逃逸的原有真实执行测试保持完整。

## 产品介绍与开源许可

根目录 `README.md` 仅提供本产品简明介绍，不承载技术方案、任务记录或验收结论。独立自有代码采用根 `LICENSE` 的MIT；上游代码、衍生修改、依赖及组合分发遵循各自原许可、版权、例外与附加要求。

离线签名Rust包及iOS podspec的第一方作者字段使用同一准确作者署名，组织仓库仍只使用产品登记来源。

自助占号冷签 self_occupy_cid 固定动作0x0a05，解析当前单 cid_number 参数与完整 SigningPayload，显示自助注册CID、目标CID及指定签名账户；CID校验位按Runtime四字符盈利码M1规则核验；旧参数、非规范长度、错误校验位、未知动作、裸call/哈希、错误链或交易版本必须拒绝。

原生构建只通过当前Rust编译器的 `--print target-libdir --target` 查询已有标准库目录，并要求 `libcore`、`libstd` 的 rlib 文件均存在；查询失败、相对目录或库缺失立即停止。Android和iOS均不再调用目标安装器，独立开发环境也须先自行准备目标库。本项不改变密码学实现、ABI、账户匹配或硬件安全要求。

宿主Flutter测试先将build-dir设为源码外工程视图内的test-build，避免测试编译器重复拼接相对输出路径而越界；测试通过后恢复平台构建的FLUTTER_BUILD_RELATIVE。测试失败立即阻止后续平台构建，不修改工具原件、源码目录、依赖或硬件安全保护。

Android的jni子工程和Flutter应用原生构建均未声明CMake版本；产品根Gradle配置在evaluationDependsOn(":app")求值之前分别通过LibraryExtension和ApplicationExtension注册统一CMake3.31.6，避免应用DSL锁定后设置版本，满足上游最低3.10要求，避免AGP默认选择3.22.1。JNI源码与依赖原件保持不变，独立环境准备同一版本工具即可构建。

## 第7步原生客户端适配（2026年10月6日，源码回归通过，正式页面验收待完成）

链端Revive为pallet35；本钱包继续只接受已登记的原生sr25519和QR_V1业务动作。Revive的eth_transact、普通call/upload/map_account，以及经过SetOrigin验证的转换入口均不登记冷签；未知调用即使伪装成转账action也必须在调用签名器前拒绝。pallet_registry.dart说明该边界，payload_decoder_test.dart与offline_sign_service_test.dart覆盖各入口拒绝及签名器零调用。

SigningPayload保持era、Compact nonce/tip、metadata mode、spec/transaction版本、genesis/birth hash及metadata None字节。真实metadata的identifier为EthSetOrigin、类型为SetOrigin，原生默认扩展不增加签名字节；spec_version仅用于展示，链身份和transaction_version继续严格核对。现有二维码、sr25519及账户金标保持。

本轮保留原任务的self_occupy_cid单参数差异，Rust签名及QR实现已检查无需修改；实际接口已检查，没有新增业务字段或闭集值。完整离线源码回归、静态分析与Release manifest合同通过，准确日志见唯一任务卡。正式移动包及XCTest/XCUITest页面验收尚未执行。

## 独立派生账户序号范围

公民钱包在自己的WalletManager中独立维护maxAccountIndex=19890604，不引用公民SDK代码或常量。创建保留账户0（//0）；新增只允许1～19890604中尚未添加的序号，可任意跳号，只派生并保存实际选择的账户。指定序号越界在读取种子前拒绝，数据库写事务内继续复核范围和重复；顺序添加在事务内计算已有最大序号加一，超出19890604必须拒绝。

详情页到顶后“添加下一个账户”不可点击，显示已达账户序号上限；“指定序号添加”仍可回填合法空缺。八位序号继续使用原有自适应徽章。独立种子存储、派生算法、已有账户地址、二维码与最多六项助记词候选保持现状。SDK中导入的公开冷账户属于另一产品目录，不参与本产品的派生序号校验。

本产品测试覆盖旧上界后的合法序号、新上界、越界与重复拒绝、顺序到顶、空缺回填、硬件解封前拒绝、高序号读取及派生一致、到顶界面和八位徽章。

本次账户序号修改的离线验证：WalletManager及WalletDetailPage共48项测试全部通过，四个修改过的Dart源码/测试文件静态分析无问题；高序号签名由独立参考公钥验通。未执行移动端正式构建和真机验收。测试工程及生成物均在源码外，保留既有独立原生签名库和Isar依赖原件。

## iOS本机工具与工作目录交付

iOS适配在Pub/Cargo准备前显式设置DART_EXECUTABLE、FLUTTER_ROOT、PYTHONHOME、RUSTC与CARGO，清除外部Python和Ruby/Gem覆盖设置。Apple命令入口只位于本任务内并绑定当前验真Xcode，llvm-nm经过同一包路径和Apple签名验证；交付中Xcode选择改变立即失败。钱包入口明确接收工程、工作、编译、依赖和产物目录，生成物不得进入源码或另一平台任务。工具或依赖不足时保留失败现场，不增加下载、安装或系统工具回退。

## MLS公钥登记签名合同

公民 App 的同一本机 MLS 身份使用动作 `mls_device_bind`（二维码 `a=13`）请求登记授权。冷端只解析完整 SCALE 载荷：`cid_number`、`binding_revision u64LE`、`account_id`、`public_key`、`issued_at u64LE`。账户与 MLS 公钥必须为小写 `0x` 加64位十六进制，公钥为32字节；载荷必须完整消费，登记版本与签发时间为正值，账户必须等于当前签名账户，请求过期秒数必须等于签发毫秒数整除1000加120。

签名域唯一为 `OP_SIGN_MLS_DEVICE_BIND = 0x1C`，签署 `blake2_256(GMB ‖ 0x1C ‖ SCALE)`。二维码码型闭集为1至5，不提供额外应用密钥的派生、加密交付或响应。原生签名库只导出4个既有 sr25519 接口；钱包私钥保存、认证与其他扫码签名能力保持各自既有合同。登记端只接收公开 MLS 公钥，不接收 MLS 私钥或协议状态。


### 产品独立资源与编译入口


本产品平台闭集为`ios`、`android`。调用格式为`node scripts/build.mjs <requirements|prepare|build> <platform> --work <绝对工作目录>`；requirements只读并输出唯一JSON，prepare/build从标准输入读取schema=1的资源回执。调用方交付准确工具执行器、锁定依赖目录、Git来源和归档后先prepare，再读取展开来源新增的需求，完整交付后执行build。准备、展开和编译属于同一调用工作根，各平台互不共享可写状态。独立调用方按本仓声明准备资源即可运行，无需读取其他产品工作树或私有资料。



## 2026-10-06 产品自主资源阶段（第2步）

本仓 `scripts/build.mjs` 同文件拥有工具准确来源、版本、配方、递归锁解析、验真、复用和本轮依赖准备。`resources <platform> --work <本仓target固定工作根> [--offline]` 从标准输入读取公开资源请求，不另设资源脚本入口。最小宿主使用本仓声明的 Node 25.2.1 绝对入口；资源工作根预先存在且不经过链接，控制台供给模式不由产品自行取得缺件。

现存`PRODUCT_TOOL_ROOT`与`PRODUCT_DEPENDENCY_ROOT`是工具和依赖的只读路径输入，本身不能完成控制台缺件准备与交付。当前供给职责按本文“工具与依赖的声明和供给职责”执行：经控制台运行由控制台准备、保存与供给，独立运行由产品自行处理；源码外`~/.local/share/product-resources`仅描述现存独立资源存储，本轮可写状态仅在work。GNU Bash/grep/sed纳入自身需求；发行件旧Shell仅用于声明中的首次GNU构建，不进入正式PATH。下载/源码工具编译不持全局锁，最终不可变对象提交使用短锁，取消传递到工具进程组。错误摘要、损坏、未锁来源、路径越界和显式离线缺失失败并保留可疑原件。

Pub/npm/Cargo按原始锁准备；Git按固定HTTPS提交检出，Git Cargo目录源展开workspace继承并锁定相对包版本；CocoaPods按准确锁摘要恢复验真快照，缺失spec校验规范摘要，未锁源码来源拒绝取得。Android固定包与修订归产品；额外平台仅消费官方固定发行来源与发行树摘要，不借宿主历史SDK目录。Maven供给只读验真后复制到独占Gradle缓存，由产品准备现有配置，消费仍离线；全库坐标导入与旧目录清理留到第5步。

`PRODUCT_WORK_DIR`、`PRODUCT_BASH_BIN`、`PRODUCT_RSYNC_BIN`及`PRODUCT_SOURCE_DIR`是公开工作/工具/工程入口；Flutter修订不读取调用方私有变量，也不回退系统rsync。旧Flutter补丁对象与当前配方不符时拒绝复用，真实替换须按准确资源操作另行授权。本步不改变编译、签名、安装及回读顺序，不修改产品UI，也未执行真实工具下载/安装。受控资源测试不能代替官方首次取得、正式编译或最终真实运行验收；第4至7步仍待逐步确认实施。

锁解析器、固定Git bundle与Pod spec/源码只在本轮固定工作根物化使用，不提交共享派生目录；可选依赖供给继续读取已登记的`objects/<SHA256>.blob`原件，独立模式按原锁取得缺件，显式离线缺原件必须失败。源码工具依赖与官方补丁仍按本产品声明准备。Pod spec每次按锁中的规范checksum回验，Git tag只核对发行声明并消费本产品预锁提交；HTTP发行件消费固定SHA256，首次源码准备命令来自该已验真spec并由GNU Bash执行。spec与源码按原锁在本轮使用；供给索引不决定产品版本。正式PATH排除旧POSIX Shell，`sh`对应已验真的GNU Bash。

独立缺省资源目录内`tools`保存工具发行件及工具编译输入，`rely`保存本产品声明允许的原件；锁解析器、Git bundle和Pod物化视图仅归本轮固定工作根，工具退出且结果消费后清理。根据用户最新要求，分步骤先完成实现与用例，整项解耦任务完成后统一测试；本步实施记录不等于真实工具首次取得、完整Build或安装验收通过。


### 第3步：产品完整Build入口（2026-10-06）

每个iOS或Android本机Build任务必须完成本平台的Release配置编译、签名验真、覆盖安装和回读；任一步失败即任务失败。

本产品的正式完整入口为已锁定Node的绝对路径调用`<本仓根>/scripts/build.mjs execute <platform> --work <已存在绝对工作根>`，可选`--offline`。输入stdin可为空；调用方可传schema/product_id/platform/work及真实run_id/program_digest，禁止私有变量或执行命令。入口内部完成需求→资源→准备→再次需求/资源闭包→编译→适用签名/安装/回读；独立与控制台调用同一实现。最小引导Node只启动本产品的资源引导器，产品按自己的官方Node声明准备并重入，控制台运行Node不决定产品Node版本。

标准输出只有唯一有界JSON：schema、product_id、platform、work、completion、files及可选真实run_id。completion固定为device-install；files按 `build.mjs describe` 的本仓声明登记路径和SHA256。编译日志使用stderr进入现有任务日志，不新增资源任务或任务状态。完整结果只在各阶段成功、源码/锁不漂移、工具进程确认退出后落入本轮build-result.json；同根并发或复用旧结果拒绝，取消/失联/错误身份/损坏候选不得成功。

控制台每次Build只读取本产品 `build.mjs describe` 公开声明并调用一次execute；控制台只跟踪真实任务、核验公开结果和保存产物，不解释产品工具、依赖、编译参数或设备规则。

Android只读取本轮获准的既有开发材料，可由专用PRODUCT_HOST_FD=3提供，原生端仅保管既有DEV_KEY；产品自身负责材料解析、工具、临时密钥、Release包签名、证书/版本核对及USB安装回读。独立调用由产品自己的Keychain保管开发材料。材料不写入公开结果或日志，临时密钥只在工具确认退出后删除。iOS由产品直接验证编译生成的Runner.app、原始Release配置、Apple签名profile、团队/设备授权、代码签名和entitlement，再完成主动真机探测、防降级、安装及bundleVersion回读。控制台不再包含LocalMobileTask/MobileSecurityManager执行链。

Android Build必须直接开始编译，禁止编译前选择或等待设备。签名完成后先执行ADB USB安装，不限制品牌、机型或数量，不要求设备登记或另设设备授权门禁；仅当ADB报告多个USB目标时列出全部USB设备号并逐台安装，每台安装后回拉验真。一台失败仍须尝试其余目标，任务最终失败；其他ADB直接安装失败据实失败。禁止固定设备、模拟器和无线安装。

iOS真机交互、页面验收和交易诊断必须使用XCTest，UI测试必须使用XCUITest；禁止用iPhone镜像或macOS系统控制台com.apple.Console执行这些工作。测试不得替用户完成最终交易确认。

本机Build以本轮开发材料签署Release配置候选，签名验真、安装及回读全部通过才可成功；该候选不作为正式发行资产。正式发行包仅由本仓对应Release Workflow完成签名及回读；两种来源均遵守本产品各平台既定应用标识、版本和数据空间合同，禁止另建开发包标识或数据空间。Publish恢复后只能消费正式Workflow包，禁止二次构建或签名。

Android已签APK仍按android.apk声明调用控制台通用artifact能力，保存失败阻止安装。iOS不保存归档，直接验真并安装当前App；两端安装或回读失败都不能返回成功。iOS profile/entitlement原生用例迁入本产品Swift验真器测试；统一验收须显式交付产品锁定Xcode的PRODUCT_TEST_SWIFT及PRODUCT_TEST_DEVELOPER_DIR，缺失时测试失败，不静默跳过。

本步同步完整入口、失败/取消/并发、结果/路径/摘要及适用移动端用例，但未运行测试、语法检查、编译、签名、安装或工具下载/替换；全部实现步骤完成后统一验收。源码交付与用例存在不代表真实Build已经通过。


### 第4步实施中：远端路由当前声明


本次同步路线读取、热更新和失败边界用例，未运行测试、语法检查、编译、签名、安装或下载。第4步仍在开发中：Publish执行器、聊天安装器、Start、固定菜单声明与完整程序摘要的其余实际耦合尚未解除，不能报告该步或整项任务完成。

### 产品远端完整入口




原生离线签名器、QR_V1解码及拒签回归使用本产品真实宿主签名库和锁定依赖；Revive35、未知调用、错链或错交易版本必须在签名回调前拒绝。宿主签名/二维码测试与正式移动设备上的扫码、硬件认证及最终用户确认分别验收，不能以宿主结果替代正式包。


### 产品软件记录与正式版本恢复



资源工具取消、超时、输出超限和异常收尾均等待主进程与整个后代组退出；无法确认退出时保留工作根和候选，禁止删除输入或改为可写。真实取消退出顺序用例仅写入resources.test.mjs，尚未执行。


### 产品独立资源与唯一依赖供给

本产品的scripts/build.mjs独立拥有需求解析、准备配方、来源与摘要验证、可写视图和失败条件。独立执行时由产品获取、保存与复用缺件；经控制台执行时由控制台按产品声明准备、保存并供给，产品核验并使用。PRODUCT_DEPENDENCY_ROOT仅是现存只读路径输入，缺少路径或原件不得在控制台执行模式下触发产品自行下载；实际供给接入仍需代码改造与验收。依赖索引读取仅接受schema_version=2及packages、git_sources、pods，不恢复旧目录或整锁快照。

Maven的具体JAR、AAR、POM、module及分类器文件统一由packages的group:artifact、version、准确上游URL、SHA256和SRI定位objects中的原件。产品在本轮work/dependencies/maven按上游分区复制独占文件；不复制Gradle二进制元数据、锁和下载状态。产品生成本轮GRADLE_USER_HOME/init.d初始化脚本，只在自身已声明的同源仓库之前加入本轮原件视图，缺件仍按产品原仓库解析，明确离线则失败。Gradle解析、工程状态和后续编译都属于同一产品任务。

Pod由pods中的name、version、checksum匹配当前Podfile.lock；spec保存官方CDN地址和原件摘要，source保存官方podspec来源，files保存发布树相对路径、文件内容摘要与权限或安全内部链接。只物化本产品所需的单个发布坐标；其它Pod、整锁、平台或宿主变化不要求复制全树。产品仍按CocoaPods官方规范回验SPEC CHECKSUMS，再验证本产品预锁定Git提交或HTTP发行摘要与源码回执。可写缓存和工具VERSION仅在本轮work产生，不能写回共享原件。

错来源、摘要、重复同源内容、生成状态、硬链接、内部链接越界或循环、取消及任务副本漂移均据实失败。独立与控制台调用使用同一实现；通过控制台执行时由控制台负责准备、保存与供给资源并跟踪原有任务，UI、功能、按钮、平台与操作顺序保持。用例源码已同步，执行留待整项实现结束后的统一测试。


### 独立入口回归验真边界

资源回归使用自带固定提交、源码字节和spec的合成Pod，不借用产品真实Pod清单提供测试输入；无真实Pod需求的平台也验证来源、摘要、链接、循环、取消和物化失败。测试现场仍位于本产品target/test，不写源码或其它产品目录。资源声明与生产依赖坐标不因测试夹具改变。

Apple验真器回归显式使用已验真的锁定Xcode及其SDK；官方swift入口允许包内链接，但规范目标必须属于同一Xcode且为有执行权限的普通文件。不得因此借用PATH或另一套工具。

资源取消对同一真实进程组每轮只发送一次信号；组不存在或Windows时才发送给主进程。仍等待主进程和后代实际退出，8秒未退出才强杀，12秒仍未确认则保留现场并失败；取消不能成为成功。

Apple验真器测试由同一锁定Xcode的swiftc编译实际XCTest Bundle，使用该包随附XCTest框架与Swift overlay，再由同包xctest执行；必须回读5项测试全部成功，空测试套件不得算通过。Bundle、模块缓存和临时输出仅归本产品target/test。


### 产品只读商店身份公开边界（2026-10-07）


本产品自己选择唯一原始iOS Runner工程与唯一Android应用Gradle配置。iOS使用PBXProject中的唯一Runner应用目标，分别取项目与目标唯一Release配置，目标覆盖项目，与本产品已有签名验真使用的配置关系一致；缺失、歧义、未解析变量或非法标识均失败。Android沿用本产品原有applicationId读取规则，不更改Build签名、安装或完成条件。

回执固定为schema=1、product_id、bundle_id、package_name、source_files。每个source_files元素仅含本仓相对path与SHA-256，列出 `pubspec.yaml`、`scripts/publish.mjs` 及两个原始应用配置。父目录和文件均拒绝链接，原始文件必须是单链接、非空、至多1MiB的普通文件；同一描述符有界读取，核验inode/大小/时间及当前路径，解析后再次验真全部来源。入口或配置缺失、重复、被替换或摘要变化均失败，不回退到控制台静态产品登记。

该历史阶段仅维护当时build.test.mjs（现已合并至scripts/build.mjs末尾）的身份解析、源码边界、真实只读入口及合成原始配置回归；测试现场仍在本产品target/test内。依赖版本、锁、资源登记、平台声明和原有流程步骤保持。


### 门禁官方归档字段与平台命名边界（2026-10-07）

平台禁用值继续来自本仓既有门禁登记。仅scripts/build.mjs的唯一规范toolDefinitions声明内、唯一Flutter工具的archive.url可以按对应数字版本核对官方稳定版macOS归档；source、root和executable必须匹配原有官方坐标。识别后仅从平台扫描输入移除该URL，原资源源码、工具版本、来源及依赖锁均不修改。重复声明、重复键、转义或不可解析字面量、错版本、错来源及错形字段不予豁免；其它工具、字段、源码、注释和目录中的旧平台标识继续拒绝。

既有门禁测试覆盖本仓真实资源声明、官方字段、伪造来源和字段、歧义字面量、额外源码、旧平台注释与目录；全部夹具只在本产品target/test生成，并在finally清理。工作树诊断与绑定已保存提交SHA的正式门禁分别记录，不能将缺少Git跟踪文件的工作树冒充正式通过。

当前完整门禁回归13/13通过，失败/取消/跳过/待办均0；本仓真实根技术文档、机密扫描及平台命名检查通过。完整资源源码和补丁边界、既有链接/临时目录/根文档夹具的失败已消除。测试及工作树检查不代替绑定已保存提交SHA的正式门禁，也不代替产品真实Build、签名安装及启动验收。本轮自有日志与夹具在结果记录后按原规则删除。


### 补丁原上下文与测试夹具边界（2026-10-07）

平台扫描只对scripts/build.mjs中唯一规范flutterPatch JSON字面量执行原上下文识别：补丁登记字段严格为path、sha256、source；path为flutter.patch，source为Flutter官方固定40位提交，正文首行固定来源必须一致，全文SHA-256必须匹配本仓登记。仅当native_assets_host.dart准确文件、hunk及lipoDylibs邻接上下文唯一匹配时，从扫描副本移除那一行已核对的上游原注释。实际资源源码和补丁正文不修改；其它补丁行、源码、字段和目录继续完整扫描。错误来源、摘要、重复声明、非规范转义、上下文漂移和新增旧平台文字均不豁免，不跳过整段补丁。

既有门禁夹具以unlinkSync删除测试目录中的链接自身；测试临时目录仅调用本仓唯一testRoot，无旧API别名。机密扫描夹具生成本仓必需的合成根文档，原文档检查及拒绝断言保持。补丁正常、错源、错摘要、错形、重复、上下文外残留等边界同步在既有test.mjs，现场在本产品target内并由finally清理。补充实现后的统一门禁验收已通过，正式提交门禁及产品真实Build/启动验收仍待完成。


本产品 `scripts/build.mjs` 的模块初始化与 CLI 执行分离：异步 `runCLI` 只在直接执行文件时启动，普通导入不启动构建。资源配方与固定工作根已经进入同一文件，不再有反向导入；`describe` 只读交付编译声明。公开参数、JSON请求、显式离线、资源/准备/编译/适用签名安装回读步骤以及取消与结果合同保持；离线缺件和非法输入必须真实失败，不以未完成顶层等待冒充成功。


## 只读塔塔门禁与功能验收边界（2026-10-10）

`.github/tatagate/tatagate.mjs` 只读核对本仓主检出、HTTPS 来源、目录闭集、流程调用方向、Node 语法和登记文件。钱包固定链提交的密码学金标、SCALE 镜像与 Pallet 注册表继续由门禁只读核验；门禁不准备资源、不运行编译或产品测试，也不调用 Build。构建测试由 `scripts/build.mjs` 所属编译入口维护，正式自动化由各平台 Workflow 独立执行。旧门禁资源准备函数已从 Build 删除。当前变更仅经静态检查，尚未执行正式门禁或真实双端构建。

## 公民钱包资源供给接线（2026-10-08）

`build.mjs describe` 以 `resource_entry=scripts/build.mjs` 公开本产品唯一准备配方；完整execute在控制台供给模式通过独立PRODUCT_RESOURCE_FD=4调用同一文件，PRODUCT_HOST_FD=3继续承载既有开发材料和结果。两次资源阶段绑定产品、平台、规范工作根、任务编号和包含原锁SHA256的需求摘要。产品接收供给后回验完整工具/SDK回执及额外平台树，再离线执行既有准备、编译、签名安装回读。供给失败、断开或身份漂移直接失败，不自行获取。独立execute继续自行准备并使用同一公开配方，无控制台私有模块依赖。

控制台已有工具在tools/shared复用，缺件由控制台执行产品公开配方下载、验真并保存；工具归档保存内容地址blob，依赖归档及Pod发布文件保存rely/objects并登记rely/index.json。可写工作视图只归本轮target。Android额外API平台按产品树摘要保存工具库，Gradle按产品工程解析后回验官方Maven发布文件并保存，iOS显式声明ios/Podfile.lock。HTTP请求声明identity；若服务端仍压缩传输，仅按解码后原件摘要验证，不把压缩Content-Length与解码字节数比较。未编码长度不符或摘要不符继续失败。

本条随候选补丁提交审核；临时测试覆盖通道、缓存、取消、异常与两阶段接线，不代表真实双端Build、签名安装回读已通过。正式接线及真实验收完成前，修复任务保持开发中。


## 本仓target内的工程副本边界（2026-10-08）

双端prepare将源码复制到当前已验真工作根的source-view及原绝对源码路径映射，不写入原工程。createView接受prepare显式交付的工作根，仅允许本产品当前源码根和该工作根内的准确映射；已有副本、父路径链接、错任务路径和写回源码仍拒绝。遍历继续排除整棵target及既有生成目录，禁止把输出递归纳入输入。直接调用未交付工作根时仍禁止源码内输出。本轮真实资源供给通过后暴露该旧边界冲突，修正候选不等于双端真实编译、签名安装回读已经完成。


## 工程准备与供给工具入口闭合（2026-10-08）

本轮双端真实流程通过工程副本创建后，iOS实际命中Xcode附带Python与已供给Python库目录混用，Android实际命中资源解析前缺local.properties。产品完整环境优先使用自身声明的语言工具，Xcode附带目录仅在其后使用；HOME和USERPROFILE归准确任务工作根。Android prepare在同一任务工程中写入验真SDK路径和原始pubspec版本，使用已供给Pub原件离线生成工程配置与插件清单，之后再由资源配方进行Maven闭包解析和保存。解析子进程继承同一产品任务工程、已供给工具和配置，不恢复宿主PATH或另选源码工程。

本机Shell与准备入口同样只允许本产品target/build/<平台>或target/test工作根及当前source-view映射；可写工程、缓存、产物不得经过目录链接或属于其它任务。未交付工程的准备入口只在本轮target建立独立文件副本并排除整棵target及原生成文件；原源码不能通过副本链接被改写。Android正式编译从该副本android根执行，并消费prepare生成的同一local.properties，不切回原源码目录。工具版本、来源和原始依赖锁不变，控制台供给失败仍不得改为独立下载。候选回归不代表双端真实编译、签名安装及回读已经完成。

## Pub本轮缓存摘要格式

本仓资源配方在本轮工作根解包已验真的锁定Pub原件，并按Pub实际读取格式写入hosted-hashes：内容严格为原始锁的64位十六进制SHA256，不追加换行。重复物化按相同字节核验，旧格式、错误摘要及取消据实失败；不改变包版本、来源、锁文件、离线策略或控制台供给职责。该实现由独立执行、控制台供给和本仓门禁共同使用；真实Dart离线消费测试验证缓存可用，完整移动编译仍须单独验收。

## 构建脚本回归与本机Build

平台工程装配、工作目录隔离和原生入口回归统一维护在scripts/build.mjs末尾，仅由node --test直接执行该文件时注册。原独立发布清单测试已合并并移除，重复Android源集及注册表检查归入同一平台配置用例，移动CI中的重复工程装配夹具并入同一构建回归；本机Build及移动CI不再重复调用脚本自测，统一由同提交塔塔门禁串行执行并核验完整回执，避免不同脚本测试争用固定现场。正常编译继续执行宿主签名库构建、Flutter业务测试、平台原生库与最终产物校验。

嵌套Shell入口按wallet与native子步骤分别在当前工作根embedded/<command>物化脚本，结束时只清理自己的子步骤目录。跨仓回写索引入口已删除；外层钱包编译调用宿主及移动原生入口时，不竞争同一个implementation.sh，真实嵌套CLI回归须保留Cargo子进程失败状态。

临时工程复制真实build.mjs时复用现有夹具辅助函数，同时带入其功能依赖 `icons/generate.mjs`；工作根与资源实现已在Build同文件。夹具通过本产品withFixedWorkSync领取固定target/test现场，子进程携带当前租约；独立入口使用自己的target/build/<平台>。工程副本、缓存、原生输出和临时状态均归准确固定工作根，平台目录就是准确公开工作根；current或任务编号子目录不是。源码作为工作根、非固定现场和输出链接仍在工具执行前拒绝，外部缓存输入归位到当前现场；测试完成后释放并清空自己的现场。合同通过不能代替完整编译、签名安装回读验收。

验收：合并后的全部181项Node回归通过，正式逐文件回执无失败、取消或跳过；测试登记、功能映射、机密扫描、Workflow与内嵌Shell语法检查通过。控制台实际启动Android和iOS编译时，两端均在钱包流程执行前被工具库根白名单校验拦截，报“工具库根存在未批准源码、链接或数据残留”，因此本轮未完成完整移动编译及安装回读验收。该工具库问题独立于钱包测试夹具修复，未在本次修改中处理。

## Android资源解析的外部原件边界

Gradle资源准备只按releaseCompileClasspath、releaseRuntimeClasspath和构建脚本classpath求取本机arm64 Release外部模块及传递闭包，以严格ArtifactView按ModuleComponentIdentifier获取原件；不在资源阶段选择或编译本工程和插件工程的次级制品。项目内部变体及产物由原有实际Gradle编译任务按属性消费，外部模块缺失、网络或解析失败仍阻止资源交付，不启用宽松视图、不吞异常、不改版本或跳过测试。独立配方与控制台供给共用该实现。


## 原生签名库任务边界

宿主FFI测试库和移动原生库使用相同公开工作根检查，只在本产品target/build或target/test当前现场内生成Cargo产物、平台库和临时状态。独立调用按目标平台选择本产品target临时工作根；控制台调用消费已交付当前工作根。源码、其它任务、错平台与目录链接在编译前拒绝；不改变Rust版本、锁、目标库检查、符号检查、编译或打包步骤。旧脚本把整棵产品源码（包含合法target）都视为禁止输出，因此真实iOS在合同检查通过后误拒绝当前任务Cargo目录，本条修正该边界冲突。完整编译、签名安装与回读仍须实际验收。

原生iOS目标在同一已供给Xcode中通过xcrun只读定位iphoneos SDK，仅对该次Cargo命令覆盖SDKROOT，避免继承宿主测试使用的macOS SDK导致跨平台链接失败。SDK查询失败或目录缺失即停止，不下载或切换Xcode；宿主与Android环境不受该局部选择影响。


## 本机双端构建修复

iOS真机Rust目标明确使用资源回执中的Clang绝对入口与同一Xcode的iphoneos SDK，不依赖生产PATH中存在cc。Android Maven原件按已登记的真实HTTPS来源及摘要重建本轮视图，再交给同一Gradle的原生资源缓存；不要求其它平台或Gradle版本变体齐全，不要求官方metadata额外提供size或强摘要，不要求files.name与url相同。普通供给由Gradle按原工程与原仓库选择实际变体，缺件由控制台当前资源准备取得、验真并保存。显式离线只使用已有同源原件，真正缺少当前所需文件才失败。

本次只修复本机双端Build；完整编译、签名、安装、回读以真实任务验收为准。

Gradle模块元数据保持上游原文，跨版本、跨模块与平台变体交由Gradle解析。控制台保存时读取本轮实际URL与缓存文件摘要，删除缓存名到发布文件名的推算；不建立产品制品映射表。

本机构建环境显式使用UTF-8 LC_ALL，避免C语言区域设置覆盖LANG导致Ruby与CocoaPods按ASCII-8BIT处理路径。

本机签名继续使用原有指定开发身份：iOS在隔离HOME引用既有钥匙串，要求钱包团队有效Apple Development身份唯一，并只复制Apple签名有效、未过期且包含同一证书的钱包与测试授权描述文件；不导出私钥、不修改宿主搜索列表、不生成新身份。Android只读取已有开发材料，缺失即失败，删除自动生成替代密钥的路径。该修改恢复原先自动签名环境的可见性，不把签名缺件误报为用户没有保存密钥。完整Release配置编译、签名、安装和回读仍以真实任务验收为准。


## 本机固定执行目录

钱包安全验真器显式使用同一登记Xcode的swiftc编译成独立二进制；SWIFT公开回执字段交付该编译器入口，禁止把swift解释执行当作编译。

安装前后回验签名叶证书必须与本轮唯一开发身份一致，身份漂移即失败。

Flutter 3.47.2在Xcode成功构建后调用xattr写入com.apple.xcode.CreatedByBuildSystem。iOS资源阶段仅按固定/usr/bin/xattr回读规范路径、可执行权限和Apple签名，在本轮apple-tools创建准确入口并交付XATTR；不把系统目录加入PATH。Android不请求这项入口。控制台资源供给与独立执行使用同一本仓验真和物化配方，缺失、链接或签名失败即失败。

本机iOS直接对本轮编译生成的Runner.app验真、安装并回读，不生成、解包或保留ios.app.zip。完整结果的files为空，completion仍为device-install；成功必须在既有自动签名、真机安装及版本回读全部通过后返回。App树安装前后回验，结束清空工作根。Android仍按声明交付已签APK，并完成全部USB目标的安装及回拉验真。

Maven初始化脚本的下载记录以Java字符串正则匹配原始HTTPS发布URL，避免JavaScript模板吞掉斜杠转义导致Groovy解析失败。初始化脚本在每次Gradle运行时读取实际offline参数：普通模式只接入原生缓存，离线模式挂接已验真的同源文件视图；同一脚本用于资源准备和后续Build，执行期才创建的独立配置也能读取现有原件。统一Swift验真测试使用已登记Xcode的SDKROOT及DEVELOPER_DIR，不借用系统默认SDK。

Maven原件清单在初始化脚本中作为分段JSON数据交给Gradle内置JsonSlurper解析，不为每条原件编译Groovy Map指令。每段按Unicode字符切分，避免大规模供给触发JVM方法或单个字符串常量限制；URL、规范文件路径及SHA256内容保持原值，原件验真、原生缓存接入和真实URL下载记录仍逐件执行。回归以3000条原件超过当前实际2054条供给规模，使用登记Gradle9.1.0真实编译初始化脚本并回读首尾缓存；不运行手机Build或联网下载。

安全验真器的JSON回执按字段名排序输出，避免Swift Dictionary在独立进程间键顺序不同触发安装前后误判；版本、构建号、包标识、团队与App树摘要仍完整比较，签名证书链、profile、entitlement及设备核验保持。Android settings由当前任务资源准备将Flutter插件入口接入本轮flutter-gradle；后续平台装配使用该本轮普通文件并保留其字节，不再与源码模板比较；源码只读、普通文件、链接与工作边界校验保持。对应回归使用真实Swift输出语句和真实资源准备、Python平台装配，验证跨进程顺序、字段变化、重复装配、源码只读及链接越界拒绝；不代替手机完整Build验收。

Maven接入不再接收生成阶段的离线参数，模式只取Gradle本次startParameter.offline。普通资源准备继续按原HTTPS仓库解析并记录真实下载，后续离线Build用同源的已验真本轮视图取得POM、module和当前选定分类器，保留上游元数据、URL来源及逐文件摘要检查；真实缺件仍由Gradle报告，控制台按产品需求准备缺件并保存复用。回归以同一初始化脚本验证普通模式不插入本地仓库、离线任务动作内新建detachedConfiguration可解析已有分类器、移除原件后准确失败，并保留未选平台变体及大库清单检查。

Android签名入口按真实混合资源声明选择唯一Build Tools SDK组件；CMake工具引用不含SDK组件path，不能作为组件路径读取。apksigner从已核验ADB回执所属的同一SDK原件选择，ANDROID_HOME可为附加平台的编译视图，不能作为签名工具原件路径；所选apksigner、apkanalyzer、adb与keytool仍逐项验证普通可执行文件及规范路径，缺件、重复版本、链接或不可执行入口均失败。材料读取、唯一既有身份、APK签名验真、USB安装和回读流程保持。

## 目录与路径复审（2026-10-08）

本次复审以当时工作树为对象，保留已有未提交改动。已修正合并模块普通导入时的远端环境副作用及伪装CLI入口，删除旧app根目录兼容分支和钱包不消费的ChatServer归档环境分支；商店身份与iOS收尾只接受原始工程位置，旧工程单独存在、重复来源及链接继续拒绝。门禁清单与资料扫描覆盖已跟踪和未忽略、未暂存源码，排除已删除的迁移旧路径；现行 Release 增量防护以 `.github/workflows/release-<平台>.mjs` 为实现入口。

已更新文档中的原生源路径、功能登记总数、错误的SDK/MLS宿主说明和历史测试文件说明；修正已删除公民App路径的协议注释及合并后签名测试路径，清理重复忽略项、两个系统目录缓存文件和既有21条Dart静态提示。Isar兼容回归使用本轮独占临时目录，扫码后端的虚拟输入路径明确标为非文件IO夹具。功能、页面设计、数据库字段、签名算法、产品身份与原依赖锁均保持。

实际验收：175项Node合同及门禁测试、28个Flutter套件中的370项真实用例、3项Rust测试全部通过，无跳过；钱包宿主Release签名库编译通过，Flutter静态分析零问题。10份MJS、54段内嵌Shell、7段内嵌Node与10段Python语法检查通过；当前目录、37件功能来源登记、文档、资料、平台命名、Workflow及iOS属性/工程解析检查通过。图标仍为icons中的5份不同PNG原件及1份SVG，两个原生资源目录不保存PNG尺寸副本。本轮未执行双端完整打包、发布、签名安装或真机验收；工作树检查不作为绑定已保存SHA的正式远端门禁回执。

当前 `scripts/`、`.github/` 与图标功能入口的物理结构如下；`target/` 为运行现场，不计入源码清单。

```text
citizenwallet/
├── scripts/
│   ├── build.mjs                 # 编译、资源、固定工作根与公开声明
│   └── publish.mjs               # 已完成GitHub Release的独立分发核验
├── icons/
│   └── generate.mjs              # 图标派生；原始图标仍在同目录
└── .github/
    ├── workflows/
    │   ├── release-ios.yml       # iOS自动化作业
    │   ├── release-ios.mjs       # iOS完整GitHub Release实现
    │   ├── release-android.yml   # Android自动化作业
    │   └── release-android.mjs   # Android完整GitHub Release实现
    └── tatagate/
        ├── tatagate.json        # 本仓门禁合同
        └── tatagate.mjs         # 本仓门禁实现与回归
```

### scripts 同文件回归

正式脚本与对应测试维护在同一文件，测试位于实现末尾；普通导入不注册测试。Node回归仍位于实现文件并由所属编译或自动化流程执行；只读塔塔门禁核对登记与语法，不执行测试。测试工作现场仍由本产品 `scripts/build.mjs` 管理，结束后清空固定目录。


## Android USB安装的宿主身份与授权等待（2026-10-09）

本轮实际Android Release APK编译及原生库校验通过，安装失败发生在ADB的新主机授权请求尚未通过时。此前resourceEnvironment将HOME改为本轮target/build，ADB随之在会被清空的.android目录生成新的主机身份。设备17:14:56请求授权，产品17:14:58记录安装失败，17:15:06设备才确认授权。

Android完成阶段单独构造ADB环境，为ADB单独使用宿主HOME、USERPROFILE和ANDROID_USER_HOME，并将ADB_VENDOR_KEYS指向宿主既有adbkey；仅读取已有adbkey，不复制、不覆盖、不生成替代主机身份。Flutter、Gradle、Cargo和签名子进程继续使用隔离构建环境。宿主HOME由build一路传递至completeAndroid，不从已隔离的环境反推。

USB安装前轮询get-state，最多等待60秒，只有device状态才安装；多USB设备按各自序列号等待并逐台执行，取消立即停止。等待超时、安装、设备列表和APK回读失败保留退出码及有界原始诊断，多设备失败逐项汇总。包名、Release配置、签名证书、原生符号和安装回读校验继续执行。实际子进程回归覆盖先等待后安装、授权超时、取消、多USB及安装错误原文，身份回归覆盖构建环境不变和缺失身份不生成。

iOS当前失败点为真机UI自动化模式初始化超时，测试Runner已安装和启动；本轮不据此修改iOS工程或跳过UI验收。

验收结果：184项Node回归及正式逐文件回执全部通过，无失败、取消或跳过；真实ADB服务使用宿主已有.android/adbkey，USB目标已授权，私钥原件的inode、修改时间和大小未改变。重新执行Android完整Build，Gradle Release构建成功（430项任务），sr25519四个导出及APK内arm64原生库校验通过；已有身份签名、USB安装、包名、证书与版本回读通过，任务完成。iOS真机UI自动化初始化超时仍未解决，本轮未修改iOS实现或设备开关。

## 本机编译入口

本产品完整本机编译只由scripts/build.mjs实现。声明与资源配方归本仓；独立执行自行准备，控制台发起时只消费其明确供给，不因缺件或失败切换到独立下载。控制台调用、移动端安装与macOS App约束归console/build.mjs，控制台供给的原件获取、命令执行和对象提交归tools/toolchain.mjs，产品负责自身现场与资源配方临时路径清理；供给方只收尾自己创建的候选和提交锁。

公开编译组件只有本文件中的正文；确有既有消费者的原路径只转交参数或公开接口，不保存编译命令。本机编译不生成第二份脚本。公开SDK依赖按本仓原锁消费，不读取兄弟仓本机检出或调度兄弟仓任务。GitHub流程不属于本次修改范围。

## GitHub自动化

本仓自动化只在GitHub的main源码上执行；控制台只调用与展示。各目标独立拥有同名的YAML与Node实现，不调用其他仓或其他目标的Workflow。版本、构建、测试、签名、完整产物核验与正式tag/Release均由本仓负责。

- `.github/workflows/release-android.yml`及同名`.mjs`。
- `.github/workflows/release-ios.yml`及同名`.mjs`。

每个目标的最后任务使用always读取所有前置结果：全部成功清本仓本目标旧成功，否则清旧失败并失败退出。仅保留最新成功、最新失败各一条；保护本次Run和所有活动任务，另一类结果与其他目标不受影响。删除关联正式Release、tag、Actions产物和Run后回查；任何清理错误都按实际失败报告，不自动重试。

所属回归位于各目标同名mjs，覆盖前置结果、版本边界、平台隔离、活动保护和完整分页；真实GitHub构建与发布验收依任务授权另行执行。

调度方按本仓supplyRequirements和prepareToolSupply取得工具候选；调度模式的获取、提交及执行使用供给方交付的能力；产品配方自行清理自己的临时生成物。缓存复用消费实际路径，运行Node版本/字节、Apple资源签名及工具全树复验不作为本机编译门禁；上游锁与正式应用签名、安装回读继续由各自真实流程执行。

本机编译现场由本产品领取和收尾。调度任务编号随本产品领取记录保存；本轮结果消费后，只允许匹配该编号的收尾请求。产品确认自身进程及资源供给后代全部退出后才清场；异常、编号不符或退出未确认时保留现场。控制台只持有调度锁、调用本产品入口并供给资源，不实现产品清理。

软件版本计算使用本目标GitHub运行序号作为单调下界，并与本仓已成功版本比较；失败或历史清理不使版本返回源码初值。版本只在GitHub本次运行内产生，同一Run重试保持运行序号，Tag另绑定准确attempt。


### 当前自动化最后处理

本仓每个自动化目标仅由自身release-<平台>.yml与同名mjs执行，最后处理依赖全部前置任务。清理只接受该目标准确Workflow路径、main和手动事件，不根据已删除文件或旧入口名称猜测归属。前置失败时，本次产物撤销与旧失败清理分别尝试并汇总错误；任何一项未确认均失败。固定依赖仍由本仓声明和原锁管理，不参加自产历史结果分类。


### 本仓 GitHub 自动化与塔塔门禁目录

`.github/` 仅保留 `workflows/` 与 `tatagate/` 两个目录。`workflows/` 持有本仓自动化；`tatagate/` 仅保留 `tatagate.json` 与 `tatagate.mjs`。前者登记本仓门禁合同，后者保留正式门禁实现与测试报告器，测试代码统一位于正式代码之后。直接运行执行门禁命令，测试运行只执行末尾测试，普通导入不注册测试；本仓测试清单及逐文件成功回执使用同一个门禁文件且仅执行一次。


## GitHub塔塔门禁与同类记录清理

本仓保留自己的.github/tatagate门禁实现和合同。main的push只触发本仓.github/workflows/tatagate.yml，gate与cleanup在这一个文件内执行；检出准确GITHUB_SHA并验证本仓GitHub事件、main引用和HTTPS origin，门禁继续执行本仓现有检查。gate成功时删除本仓该门禁旧成功Run；gate失败时删除旧失败Run；另一类最近记录和活动Run保留。清理前重新验真Run、Attempt和结论，删除后回查；清理错误如实记录并由后续运行补清，不影响gate检查结论。塔塔控制台通过塔塔鹿鹿的一次生物识别保存、推送本仓，并按准确SHA与Run ID追踪独立门禁任务；门禁结果不影响已确认的推送。

本仓 GitHub 门禁接受 actions/checkout 的准确 HTTPS origin（同一仓库地址有或没有 `.git` 后缀），仓库、事件、提交和工作流身份仍逐项校验。
