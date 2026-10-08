# CitizenWallet 技术文档

## 当前工作目录归属（第8步，2026-10-06）

本产品全部测试、编译临时数据和产物归 `/Users/rhett/citizenwallet/target`。多平台先使用声明中的完整平台身份，再在平台内按build、ci、release、publish、test、tmp隔离。独立入口与控制台调用消费同一产品流程；控制台仅创建任务、调用与跟踪，不准备产品专用版本、依赖或步骤。下载半包、工具编译候选、工程视图、Runner步骤临时状态和测试夹具均属于当前产品工作区；永久工具与依赖原件继续归原件库。整个根target不进入Git、源码快照、程序摘要或打包输入。准确流程短锁、活跃任务保护、成功产物保护和原清理规则继续适用。

第8、9步完成目录与路径实现、根文档迁移及测试源码维护，未运行测试、门禁、编译或安装。本文唯一原件位于/Users/rhett/citizenwallet/CitizenWallet.md；产品接口及流程直接以本仓实际代码和声明为准，业务字典库与其检查已撤销，不另建登记副本。历史验收事实不表示本轮改造已经通过验收，统一测试在第10步进行。根技术文档由本仓门禁按原文、JSON解码值及既有补丁快照扫描机密，仅报告路径；文档迁出不减少资料安全检查。


## 聊天功能的唯一产品归属

**聊天客户端的逻辑功能只能在 TataChatSDK 中实现；聊天服务端的逻辑功能只能在 TataChatServer 中实现。公民、途遇及其他产品只依赖使用。**

CitizenWallet 涉及聊天时只作为依赖使用方；本条不代表尚未接入聊天的产品已经具备聊天能力。

- 消息、会话、群组、加密、协议、传输、同步、重试、聊天存储、附件、通话及聊天界面行为，按客户端与服务端职责分别归 TataChatSDK 和 TataChatServer；新增功能、缺陷修复和平台差异也必须在所属塔塔聊天产品内完成。
- 消费产品只提供产品入口、身份与业务权益结果、服务地址及授权、主题和公开接口要求的平台配置；只通过公开接口接入，禁止复制、重写、包装成另一套聊天内核或维护产品专属聊天实现。CitizenServe、TuyuServe 的产品身份与权益授权不包含聊天数据面的实现职责。
- 本机开发直接依赖仓库路径；公民、途遇等产品的正式版本依赖塔塔聊天正式 Release；第三方市场分发使用公开市场版本。依赖使用不以公开市场发布为前置条件，也不改变实现归属。

钱包签名模式由实际签名路由定义；与CitizenSDK通过实际公开接口保持准确命名和闭集。

受控缓存固定为 `citizenwallet/target/<platform>/<build|ci|release|publish>/`；四个流程目录永久独立，启动不建目录。本机 Flutter 只读工程视图、`.dart_tool`、Gradle、Pods、临时文件、日志和候选均属于准确流程目录，源码目录不得承载生成状态。

当前依赖边界：钱包自己的源码和锁文件决定依赖、版本和来源。本机iOS、Android适配分别在各自完整流程中交付既有验真工具，并按钱包pubspec.lock与rust/Cargo.lock离线准备本任务Pub和Cargo目录；原件缺失、新增Git来源或回执越界立即失败，禁止自动下载。两个平台独立实现，不调用对方流程或公民SDK实现。Android继续交付已登记Gradle并由钱包入口对照自身声明回验；iOS交付Flutter随包Dart、Python、Rust/Cargo、Git、CocoaPods和同一登记Xcode工具，现有pod入口绑定受控Ruby和Gem。工具版本不变，独立环境仍由调用方按钱包声明准备。

iOS 原生签名库由钱包脚本编译到本轮外部目录，`ios/signer/citizenwallet_signer.podspec` 通过既有 `-force_load` 绝对路径及八个 `-Wl,-u` 符号将其链接到 App；不设置 CocoaPods 只接受相对路径的 `vendored_libraries`。此调整仅修复 Pod 安装阶段的路径校验，不改变签名库实现或 FFI 合同。

本机 Build 边界：Worker创建独立任务并清空本产品平台固定缓存；钱包对应平台适配交付既有验真工具和锁定依赖，再调用钱包产品入口。测试、编译、密码学实现和产品失败条件由CitizenWallet独立维护。钱包入口在 Pub 依赖就绪后，先用已登记 Node 运行钱包自身构建合同测试，再将宿主 FFI 动态库编译到本轮源码外 Cargo 目录，运行 `flutter test --no-pub` 全套钱包单元与组件测试；测试失败即停止该端 Build，不进入平台编译、签名或安装。Android产品入口把本轮Flutter配置选出的Android SDK及调用方JDK传给同一次Gradle调用，固定携带 `--no-daemon`，仅整体离线模式再追加 `--offline`；本机未提供JDK时使用Android Studio随包JBR，不在Worker增加前置检查。iOS/Android 编译成功后进入设备安装收尾，日志只写对应缓存目录。

公民钱包 iOS 本机 Build 在已签名 Release 编译后、交付原生安装收尾前，使用钱包工程的 `RunnerUITests` 在唯一可用 iOS 真机运行 XCUITest。现有 Runner 方案只引用 `RunnerUITests/RunnerUITests.xctestplan`；计划保留原有 `RunnerTests` 和新增 UI 目标，并将自动屏幕采集设为关闭，避免测试采集触发钱包既有录屏保护。创建页测试只切换 12/18/24 词，以当前熵说明核验选择状态、比较密码框与词数选项宽度；导入页只输入非词表占位词，按 Flutter 可访问标签核验非法词数提示与第 25 词被拒绝。选择页左缘返回和备份页返回拦截由钱包组件测试覆盖；真机合成左缘拖动未能稳定复现原生手势，不能以该动作的 XCUITest 断言证明真实手势行为。测试不创建、导入或导出真实钱包，不输入真实密码或助记词；设备未解锁、设备不唯一、敏感页录屏保护触发或测试失败时 Build 失败，绝不绕过保护。Xcode 入口按控制台唯一登记版本校验后传给钱包脚本，测试编译物及结果仅写本轮钱包 iOS Build 工作目录，失败时禁止 Xcode 自动采集设备诊断包。
真机 UI 测试从首页进入创建/导入页时，无钱包直接点击首页按钮；已有钱包先点“添加钱包”，再按标题前缀定位底部菜单的 `StaticText`。真机可访问树显示该 Flutter InkWell 把标题与副标题合并到同一个 `StaticText` 标签。

iOS `Podfile` 的 post-install 钩子修正 Isar 静态 XCFramework 的输出清单。首次安装时先创建准确的 Isar 目标支持目录，再写 `libisar.a` 清单；生成物只位于本轮工程的 `Pods` 目录。
`Podfile` 从本轮工程目录读取 Flutter 插件清单，即使本轮工程的 Podfile 由源码链接而来，也不回到源码根。钱包 iOS 构建入口在运行 CocoaPods 前把指向源码的 `Podfile.lock` 链接原子替换为本轮工程普通文件，构建生成的锁文件不回写源码；产品锁文件仍以钱包源码为唯一受控输入。

钱包两端 Build 适配将产品候选产物目录明确设为本身份固定 Build 根；iOS `ios.app.zip`、Android `android.apk` 因此可由同一任务的原生签名安装阶段按固定名称读取。Android 产品脚本把 Flutter Gradle 插件的 Kotlin 持久会话目录和插件编译目录一同导向本轮外部工作目录，避免向只读工具原件写入；不改变插件或 Kotlin 版本。

本文是公民钱包（CitizenWallet）唯一技术事实文档。

公民钱包的 Dart 静态分析规则唯一位于 `citizenwallet/scripts/analysis_options.yaml`；塔塔任务只在受控工作目录生成 Flutter 工具要求的根配置，不向产品源码根写入配置或分析产物。
公民钱包根 `pubspec.yaml` 与 `pubspec.lock` 保持 Flutter 工程和依赖锁真源；源码不跟踪 Flutter 自动生成的 `.metadata`，塔塔任务在自己的受控工作目录生成所需项目元数据。

## Android受控工具配置

共享hardware-secretvault插件只消费宿主的受控AGP与内置Kotlin，删除插件独立版本声明和kotlin-android入口；使用公开compilerOptions保持JVM17、API36和最低API24，不改变硬件密钥实现、命名空间或依赖。

当前仅仓库 Push 可执行 GMB 塔塔门禁；CitizenWallet 的 Build、CI、Release、Publish 不经过控制台依赖或工具门禁。

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

- CitizenWallet 复用统一 QR_V1 动作 `publish=15` 为 TataConsole 生产发布提供离线批准。
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

- `citizenwallet.ios.ci` 与 `citizenwallet.android.ci` 的 CI 只执行索引同步、Flutter
  依赖安装、`flutter analyze`、`flutter test` 和本端 Release 配置检查构建；不生成 Debug 产品包。
- 本机移动端Build在进入依赖准备前交付已验真Flutter与随包Dart，工具缺失或验真失败立即停止；CI和Release继续由钱包自己的独立入口执行。
- CI 与本地启动脚本同步的转账入口是 `OnchainTransaction(4).transfer_with_remark(0)`；公民钱包不得恢复 `Balances` 直签入口。
- 两条 GitHub Release workflow 各自复核本端指定 `ci_run_id` 对应的成功 CI，在 runner 内构建公民钱包
  Android APK/AAB 或 iOS IPA、正式签名、回读核验并直接创建本端正式 GitHub Release。
  iOS 与 Android 版本和 build number 按端独立推进。
- `APP_KEY` 与 CitizenApp 共用，作为固定 GitHub Repository Secret，内容至少包含
  `keystore=<base64后的jks>` 和 `password=<keystore密码>`；默认 alias 为 `upload`，可增加
  `alias=<key别名>`，key password 默认复用 `password`。禁止普通查看、长期 keystore 文件和
  调试签名回退。
- `IOS_KEY` 同样与 CitizenApp 共用，CitizenWallet 描述文件由固定 Secret
  `WALLET_PROFILE` 提供。加密 PKCS#12 与临时钥匙串只在 Release
  runner 当前 job 内存在，随后立即清除。禁止普通查看、登录钥匙串长期私钥和密码认证回退。
- 禁止 `continue-on-error`；单端失败必须使该端 Release 失败，但不得阻断另一端独立成功。

## CI 增量缓存

Android 与 iOS CI 已接入统一 CI 缓存。移动端 Rust target 与 Flutter build 使用受控目录链接，保持产品源码目录不承载 CI 缓存；最终 APK、Bundle 和 iOS App 不写入缓存。

## Release 全量构建（第 7.4 步）

正式 Release 固定从干净源码执行全量构建，显式关闭 Rust 增量编译及工具链内置缓存，不读取CI作业缓存且不复用本机编译中间物。版本、签名、校验、产物和发布流程保持原有产品合同。

## 双仓统一流程最终收口（第 7.5 步）

本产品本机iOS、Android分别使用固定`citizenwallet/target/<platform>/build/`；
同一Build完成编译、签名验真、真机安装和回读，候选只在本轮缓存，不新增target产品目录。固定平台流程目录不得在终态删除；控制台核对当前任务
所有权后只清除该任务生成内容。Flutter 从本端普通配置文件运行，原生签名构建器仍从真实
源码调用；Pub、Gradle、CocoaPods 和临时目录都属于本端，脚本不再退出时清理共享源码。
`pallet_registry.dart` 与 Isar/QR 已跟踪生成文件只作为构建输入，本机编译不回写它们。
不同产品、不同平台编译可并行，准确相同身份仍由控制台独占。GitHub CI 缓存与正式 Release
流程未因本机目录隔离而改变。

## Android 平台与 ABI 文档分域（GMB 第 2.3 步，2026-09-02）

- CitizenWallet 涉及 Android 的公开平台名只写 `Android`；`arm64-v8a` 仅作为 Android
  官方 ABI 技术值。该分域不改变同一产品既有的 iOS 支持。
- `citizenwallet/design-qa.md` 已把旧的架构拼接式平台表述改为 `Android` 平台与
  `arm64-v8a` ABI 的类型化表述。
- GMB `repo_guard` 正向锁定新表述并反向拒绝架构值回流到 Android 公开平台名。
- 本步不改变 Android 构建目标、原生库、钱包、安全、CI、Release 或发布合同，也不修改
  TataConsole 可执行流程。
- `rustfmt --edition 2021 --check` 通过；使用受控隔离目录执行
  `cargo test -p qr-protocol --test repo_guard`，最终 10/10 通过。
- 本轮 112MB 受控测试目录已移至系统废纸篓
  `/Users/rhett/.Trash/gmb-platform-naming-step2-3-20260902`，GMB 源码树和活动受控目录均无测试产物残留。

## 移动 Release manifest 公开平台身份（GMB 第 2.12 步，2026-09-02）

- Android 正式 APK/AAB 的公开 manifest 资产项统一使用 `Android`，iOS 正式 IPA 统一使用
  `iOS`。内部 action target、workflow、版本 Tag 与签名 wire 继续使用既有小写机器值；本步只在
  明确的公开制品边界映射，没有建立第二套 CI 或 Release 流程。
- `citizenwallet/test/release_manifest.test.mjs` 直接提取并执行 TataConsole 受控复合 Action 的真实
  Node writer，锁定 writer 所属 Release job、七个顶层字段、三个资产字段、产品与原生应用身份、
  实际文件 SHA-256 和精确资产闭集。两个移动 CI 都永久执行该测试，不存在人工测试孤岛。
- TataConsole 的 Citizen 移动严格验证器由 CitizenApp 与 CitizenWallet 共用。CitizenWallet iOS
  只接受 `citizenwallet.ipa`，Android 只接受 `citizenwallet.apk` 与 `citizenwallet.aab`；两个平台
  都同时固定 Bundle ID `ios.citizenwallet` 和 Android package
  `com.crcfrcn.citizenwallet`。TUYU 产品在进入字段或平台解析前旁路，未被本步提前迁移。
- 严格验证先于候选二进制读取、Keychain 凭据访问和 App Store Connect/Google Play 网络写入；
  GMB 跨仓守卫同时冻结正式发布入口的顺序，避免只验证候选检查入口而遗漏真实发布路径。
- 本机最终定向验证 39/39 通过：真实 writer 3/3、受控路由与缓存 3/3、GMB Rust 守卫
  20/20、原生发布器 XCTest 13/13；Node、JSON、YAML 与 Rust 格式检查也通过。XCTest 仅以命令级
  排除正式打包阶段才注入的 `tataconsole` 与 `node` 运行资源，不冒充正式 TataConsole 安装包。
- 299MB 测试与编译输出只进入受控目录，已整体移至可恢复的系统废纸篓
  `/Users/rhett/.Trash/gmb-platform-naming-step2-12-final-20260902-165915`。未运行远程 CI、正式
  Release、商店发布或部署，也未启动、停止、安装或重启 TataConsole。

## 发布授权签名

发布解码器只登记现存产品与准确平台；previous_deployment_id必须非空。外层期限、0x24签名域、一次性请求和尾随字节校验保持。

## Flutter 独立缓存工程视图（2026-09-10）

本机产品入口必须显式传入 `CITIZENWALLET_PROJECT_ROOT`，指向已有的源码外 Flutter 工程目录；独立调用也使用同一参数。入口在执行任何 Flutter 命令或创建目录前，验证工程根、`.dart_tool` 和其它输出目录的真实路径，拒绝缺参、相对路径、源码内目录及链接回源码。两端 Build 适配将已创建的工程视图传给该参数；只切换工作目录不足以改变产品入口的工程根。`flutter config --build-dir` 只设置编译输出，不能代替 Pub 工程根隔离。

CitizenWallet 的 iOS、Android 本机 Build 分别用准确平台缓存的 `flutter-project/` 承接 Flutter 生成状态。产品脚本的真实路径决定只读钱包源码根；签名原生库的 Cargo 输出、Pub、Gradle、Pods、Flutter build 和临时文件均进入该平台缓存。不得因控制台工程视图改变钱包依赖、业务入口或原生签名实现。

Android 的 Flutter/Pub 阶段先在缓存根生成 `local.properties` 和插件清单，Gradle 阶段只从 `/Users/rhett/citizenwallet/android/` 真实根启动。产品 Gradle 根据当前 Flutter 根读取这些生成状态，并把项目缓存、依赖缓存和编译物继续写入准确 Android 缓存；不再让跨根 `settings.gradle.kts` 符号链接参与 Gradle 根解析。

Kotlin 的工程持久状态独立于 Gradle 项目缓存；产品入口通过官方 `kotlin.project.persistent.dir` 工程属性定向到 `${BUILD_WORK_DIR}/kotlin-project`，禁止在源码 `android/.kotlin` 写入。入口的写前真实路径校验同时覆盖该目录，已有链接指回源码时立即失败。Flutter 插件工程继续使用其独立的外部 Kotlin 目录。属性职责以 [Kotlin 官方文档](https://kotlinlang.org/docs/gradle-configure-project.html#kotlin-gradle-plugin-data-in-a-project) 为准。

受控 Flutter 插件工程只开放 Gradle 9.1要求的目录所有者写位，插件文件仍为只读验真原件。CitizenWallet Android 的任务级 Gradle初始化脚本把插件构建目录导向本平台缓存，并关闭源码根 Problems Report，禁止重新产生产品源码 `android/build/`。

## 2026-09-11 Android 产品侧 JDK 路由

CitizenWallet Android 从真实产品 `android/` 根调用自己的 Gradle Wrapper。产品入口保留调用方显式 `JAVA_HOME`；本机任务未提供时，将 `/Applications/Android Studio.app/Contents/jbr/Contents/Home` 作为本次 Gradle 子进程的 `JAVA_HOME`，并把其 `bin` 置于该子进程 `PATH` 首位。产品不运行 Java 版本探测或准入检查，Gradle 对实际工具可用性负责并直接返回结果。

该路由只属于 CitizenWallet 产品脚本。Worker 仍只创建任务、清空准确 Android 缓存并启动产品入口，不注入、校验或等待 JDK，因此控制台不会因产品 Java 状态阻塞任务创建和流程转交。

真实任务 `789452335` 已由 `/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/java` 启动产品 Wrapper 与 Gradle 9.1.0，旧的“Unable to locate a Java Runtime”没有再出现。Gradle 随后因产品 Kotlin 2.2.10 低于当前 Flutter 最低 2.2.20 而停止；本轮没有跳过产品依赖校验，没有生成 APK，也没有安装手机。

## 2026-09-11 Android AGP 9 插件兼容与本机安装验收

CitizenWallet Android 的实际 KGP 已与受控 Flutter 修订统一为 2.2.20。锁文件只推进现有约束内的 Android 平台实现：`image_picker_android` 0.8.13+23 和 `mobile_scanner` 7.4.2；`lib/ui/scan_page.dart` 继续通过 `image_picker` 读取相册二维码，因此该依赖有真实业务用途且未删除。两项新版实现均已在 AGP 9.0.1、Gradle 9.1.0 下完成 Kotlin 编译。

产品脚本在原生库和 APK 包内符号验证通过后，将无私钥候选复制到当前产品/平台缓存根的固定 `android.apk`。此文件只作为同一 Build 的原生安全收尾输入；原生层继续独立验证普通文件、包名、未签名状态、版本与签名证书，不从产品脚本接收私钥。

真实任务 `676370011` 报告 `BUILD SUCCESSFUL in 49s`，429 个 Gradle 任务全部执行；`citizen_sr25519_*`、`account_crypto_*` 与 APK 内 arm64 原生库门禁通过。随后原生安全进程完成签名验真与受控产物保存，设备安装及产品身份、版本回读通过，最终状态为“任务完成”。
### Build与Start物理归属（2026-09-12）

本产品Build、CI和Release唯一实现位于产品scripts目录；TataConsole只按固定身份调用。Start由TataConsole启动产物库中的macOS成功产物，产品不实现Start。

- citizenwallet：
  - `citizenwallet.ios.build` → `tataconsole/console/citizenwallet/ios/build.sh`
  - `citizenwallet.android.build` → `tataconsole/console/citizenwallet/android/build.sh`

## CI与Release入口归属

本产品CI与Release由所属仓当前`scripts/flows.json`的remote_routes及各平台Workflow声明定位，完整执行入口为本仓`scripts/flow.mjs`。控制台读取当前声明、创建原有真实任务、获取准确仓权限并跟踪原Run；旧控制台CI/Release Shell与Swift执行文件已删除，不作为入口。

## 独立 GitHub CI 与 Release 工作流

本产品每个实际产品、平台、流程身份使用下列独立文件，主 Job 为 `flow`；CI 验证源码，Release 生成正式产物，发布由塔塔控制台的独立 Publish 流程负责。

- `.github/workflows/citizenwallet-android-ci.yml`
- `.github/workflows/citizenwallet-android-release.yml`
- `.github/workflows/citizenwallet-ios-ci.yml`
- `.github/workflows/citizenwallet-ios-release.yml`

## 目录整合与平台输入

Android 主源码及 Manifest 位于 `android/app/src/`，单测 `android/app/HardwareSecretvaultPluginTest.kt` 单独登记测试源集，禁止进入正式包。`resources/android/` 的四个扁平资源 XML 由 Gradle 生成限定目录；iOS 字符串目录位于 `resources/ios/InfoPlist.xcstrings`，单测与 Runner scheme 位于 `ios/`。

`citizenwallet-run.sh prepare-ios|prepare-android` 仅装配本产品源码外工程，拒绝重复目标和链接回写；本机 Build 消费调用方工程，远端 Pub/构建使用已装配工程。远端 `prepare-android` 从 `FLUTTER_ROOT` 指定 Flutter 的 `bin/cache/artifacts/gradle_wrapper/` 逐字节复制三个 Wrapper 工具文件，工具缺失、链接或重复来源直接失败；本机 Android 使用已登记 Gradle，产品不保存 Wrapper 副本。iOS 注册表与 SwiftPM 生成状态不进入源码视图，Android 配置唯一源为 `android/gradle-wrapper.properties`。扫码测试归入 `test/qr/`。

AGP 9 将 Kotlin 与 Java 源集分开处理：扁平 Kotlin 目录必须通过 `sourceSets.<name>.kotlin` 显式登记。仅修改 Java 源目录会生成缺少 MainActivity 的 APK；验收必须检查入口类及真机启动，不能以 Gradle 成功或安装成功代替。

AGP 9 新 DSL 的源码路径使用 `directories`，不调用已废弃的 `setSrcDirs`；钱包根目录的单个 Kotlin 测试通过 `UnitTestKotlin` 编译任务登记单文件，不能递归扫描整个 app 根。

Flutter 插件注册表只生成于当轮外部工程的 `android/app/src/main/java`，main Java 源集显式消费这一目录。清理源码旧注册表后仍须能完整构建；APK 验收同时检查 MainActivity 与 GeneratedPluginRegistrant，并验证真实平台通道可用。

Android CI 使用实际登记的 `:app:testDebugUnitTest` 运行硬件金库单元测试；正式应用仍仅构建和安装签名 Release。
## 完整产品组织与执行合同

所有者：`citizenwallet`，正式源码根 `/Users/rhett/citizenwallet`；本说明属于该完整产品。组件不会拆成独立仓库或目录产品。所有执行身份统一为 `产品.平台.流程`，单平台仅在控制台显示和物理目录中省略平台层。

真实平台目标：`ios`、`android`。

推送门禁唯一源码位于 `/Users/rhett/citizenwallet/.github/tatagate/`，GitHub入口 `/Users/rhett/citizenwallet/.github/workflows/tatagate.yml`。控制台先从本仓已保存提交执行这份门禁，通过后推送准确SHA；GitHub main push再执行同一提交的门禁，控制台核对所属仓、Workflow、main、SHA、Run和attempt，只有success并再次回查main一致才完成推送。失败、取消、超时或身份漂移均不得显示成功，不自动重试或派发CI/Release。

技术文档由所属完整产品仓根唯一持有；私有规则和任务库由控制台私仓持有，公开产品不读取它们。公开门禁不依赖私仓资料、安装包源码、其它本机产品或个人账号；必要链真源先锁定公开main的实际SHA后只读该SHA。本机开发跨产品验收仍比较三仓已保存快照与各端真实镜像。

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

本产品的scripts/flows.json声明自身平台、准确工具版本、原始锁以及既有CI/Release入口；scripts/build.mjs独立实现requirements、prepare、build三个阶段，拥有工程准备、编译命令、候选验真和失败条件。产品只消费调用方交付的公开资源回执，按本仓原始锁取得依赖，所有生成状态进入规范源码外工作目录。平台或资源身份不符、版本错误、缺锁、链接越界、归档摘要错误、旧工程复用或编译器失败均立即失败。

本产品平台闭集为`ios`、`android`。调用格式为`node scripts/build.mjs <requirements|prepare|build> <platform> --work <绝对工作目录>`；requirements只读并输出唯一JSON，prepare/build从标准输入读取schema=1的资源回执。调用方交付准确工具执行器、锁定依赖目录、Git来源和归档后先prepare，再读取展开来源新增的需求，完整交付后执行build。准备、展开和编译属于同一调用工作根，各平台互不共享可写状态。独立调用方按本仓声明准备资源即可运行，无需读取其他产品工作树或私有资料。

Git依赖只接受本仓声明与锁一致的HTTPS地址及40位固定提交；原生归档只接受本产品锁定坐标及完整SHA-256。工程副本排除旧生成物，内部文件链接重映射到同轮副本，外部链接与已有工程拒绝。原始依赖缓存必须显式交付，不能落入用户默认缓存；离线编译禁止隐式取得缺失资源。已有CI/Release Workflow仍各自调用本仓scripts，不受本机可视化入口是否存在影响。入口回归由本仓`scripts/build.test.mjs`负责，适配与资源服务的验证不替代产品编译和真实候选验收。


## 2026-10-06 产品自主资源阶段（第2步）

本仓`scripts/resources.mjs`拥有工具准确来源/版本/配方、递归锁解析、缺失获取、验真、复用和本轮依赖准备；`scripts/build.mjs resources <platform> --work <绝对外部工作根>`调用同一实现，独立入口为`resources.mjs <platform> --work <工作根> [--offline]`。前者从stdin读取公开身份回执；后者允许空请求。最小宿主必须使用本仓声明的官方Node25.2.1绝对入口，本机配方限定macOS ARM；资源阶段回读官方发行归档与运行Node字节，不能从PATH取同名程序。工作根预先存在、位于源码外且不经过链接。

可选`PRODUCT_TOOL_ROOT`只供读取工具原件，`PRODUCT_DEPENDENCY_ROOT`只供读取依赖原件；产品不读取供给者的版本决策或私有任务变量。独立缺省原件库为源码外`~/.local/share/product-resources`，本轮可写状态仅在work。GNU Bash/grep/sed纳入自身需求；发行件旧Shell仅用于声明中的首次GNU构建，不进入正式PATH。下载/源码工具编译不持全局锁，最终不可变对象提交使用短锁，取消传递到工具进程组。错误摘要、损坏、未锁来源、路径越界和显式离线缺失失败并保留可疑原件。

Pub/npm/Cargo按原始锁准备；Git按固定HTTPS提交检出，Git Cargo目录源展开workspace继承并锁定相对包版本；CocoaPods按准确锁摘要恢复验真快照，缺失spec校验规范摘要，未锁源码来源拒绝取得。Android固定包与修订归产品；额外平台仅消费官方固定发行来源与发行树摘要，不借宿主历史SDK目录。Maven供给只读验真后复制到独占Gradle缓存，由产品准备现有配置，消费仍离线；全库坐标导入与旧目录清理留到第5步。

`PRODUCT_WORK_DIR`、`PRODUCT_BASH_BIN`、`PRODUCT_RSYNC_BIN`及`PRODUCT_SOURCE_DIR`是公开工作/工具/工程入口；Flutter修订不读取调用方私有变量，也不回退系统rsync。旧Flutter补丁对象与当前配方不符时拒绝复用，真实替换须按准确资源操作另行授权。本步不改变编译、签名、安装及回读顺序，不修改产品UI，也未执行真实工具下载/安装。受控资源测试不能代替官方首次取得、正式编译或最终真实运行验收；第4至7步仍待逐步确认实施。

资源原件按完整内容验真后整体提交：Git bundle与固定来源/摘要回执处于同一个不可变对象，不暴露中间状态；可选依赖供给读取`objects/<SHA256>.blob`。锁解析器、源码工具依赖与官方有序补丁也从同一产品原件存储复用。Pod spec每次按锁中的规范checksum回验，Git tag只核对发行声明并消费本产品预锁提交；HTTP发行件消费固定SHA256，首次源码准备命令来自该已验真spec并由GNU Bash执行。spec、准备后源码与文件清单整体提交，再复制到本轮缓存；供给索引不决定产品版本。正式PATH排除旧POSIX Shell，`sh`对应已验真的GNU Bash。

独立缺省资源目录内`tools`保存工具发行件及工具编译输入，`rely`保存产品依赖的归档、Git和Pod原件；工作区只承载本轮可写视图。根据用户最新要求，分步骤先完成实现与用例，整项解耦任务完成后统一测试；本步实施记录不等于真实工具首次取得、完整Build或安装验收通过。


### 第3步：产品完整Build入口（2026-10-06）

本产品的正式完整入口为已锁定Node的绝对路径调用`/Users/rhett/citizenwallet/scripts/build.mjs execute <platform> --work <已存在绝对工作根>`，可选`--offline`。输入stdin可为空；调用方可传schema/product_id/platform/work及真实run_id/program_digest，禁止私有变量或执行命令。入口内部完成需求→资源→准备→再次需求/资源闭包→编译→适用签名/安装/回读；独立与控制台调用同一实现。最小引导Node只启动本产品的资源引导器，产品按自己的官方Node声明验真、准备并重入，控制台运行Node不决定产品Node版本。

标准输出只有唯一有界JSON：schema、product_id、platform、work、completion、files及可选真实run_id。completion沿用固定平台的device-install/macos-artifact/compile-only；files按本产品flows.json登记路径和SHA256。编译日志使用stderr进入现有任务日志，不新增资源任务或任务状态。完整结果只在各阶段成功、源码/锁不漂移、工具进程确认退出后落入本轮build-result.json；同根并发或复用旧结果拒绝，取消/失联/错误身份/损坏候选不得成功。

控制台每次Build直接读取本产品当前flows.json入口，调用一次execute；控制台只跟踪真实任务、核验公开结果和保存产物，不解释产品工具、依赖、编译参数或设备规则。当前控制台静态菜单、其它产品流程/安装器与程序摘要的历史耦合仍归第4步解除，本步不能当作整项解耦已完成。

Android开发材料读取和仅首次创建可由专用PRODUCT_HOST_FD=3提供，原生端仅保管既有DEV_KEY；产品自身负责材料解析、工具、临时密钥、Release包签名、证书/版本核对、先直接USB安装以及多USB分支逐台安装回读。独立调用由产品自己的Keychain保管开发材料。材料不写入公开结果或日志，临时密钥只在工具确认退出后删除。iOS归档由产品解包并验证唯一Runner.app、原始Release配置、Apple签名profile、团队/设备授权、代码签名和entitlement，再完成主动真机探测、防降级、安装及bundleVersion回读。控制台不再包含LocalMobileTask/MobileSecurityManager执行链。

产物保持固定android.apk/ios.app.zip；控制台通用artifact能力在产品验真后、设备安装前保存候选，保存失败阻止安装，安装失败不伪造成功。iOS profile/entitlement原生用例迁入本产品Swift验真器测试；统一验收须显式交付产品锁定Xcode的PRODUCT_TEST_SWIFT及PRODUCT_TEST_DEVELOPER_DIR，缺失时测试失败，不静默跳过。

本步同步完整入口、失败/取消/并发、结果/路径/摘要及适用移动端用例，但未运行测试、语法检查、编译、签名、安装或工具下载/替换；全部实现步骤完成后统一验收。源码交付与用例存在不代表真实Build已经通过。


### 第4步实施中：远端路由当前声明

CI/Release的规范身份、标题、版本前缀和正式版本记录标志已迁入所属仓现有scripts/flows.json的remote_routes。调用方按固定已接入动作重读当前声明；原生授权与流程查询不再使用编译期产品路由常量。产品声明只提供数据，不授予凭据、扩大平台矩阵或新增按钮。损坏、重复、越仓、字段越界及超限拒绝。

本次同步路线读取、热更新和失败边界用例，未运行测试、语法检查、编译、签名、安装或下载。第4步仍在开发中：Publish执行器、聊天安装器、Start、固定菜单声明与完整程序摘要的其余实际耦合尚未解除，不能报告该步或整项任务完成。

### 产品远端完整入口

本仓`scripts/flows.json`的`flow_entry`定位公开`scripts/flow.mjs`。`run ci <platform>`和`run release <platform>`分别执行同一产品流程，当前读取本仓Workflow与路由；Release的`version_source`声明准确版本文件类型和相对路径。成功CI选择、同源候选复用、版本递增、正式Release验真与旧Run/Artifact清理均由本产品入口完成。独立执行只需等价的本仓短期GitHub权限；没有宿主控制管道时入口自行跟踪Run，不依赖其它产品程序。

可选`PRODUCT_CONTROL_FD=3`只接受当前Run绑定确认、候选持久化确认和二值远端终态；令牌仅进入HTTPS请求头，未知身份、越仓、无成功CI、候选错源、控制帧错误、超时或取消均失败。宿主重启后的`recover`使用同一公开入口核验原Run、原候选并清理，不重新派发。公开控制协议不携带私有调用方变量，现有授权及用户操作顺序保持。源码、声明或Workflow在本次流程期间变化将拒绝继续。

相关正常、失败、身份、版本来源、独立远端跟踪、候选重试和真实控制管道边界用例位于本仓`scripts/flow.test.mjs`；当前只完善源码，尚未运行用例或远端操作。

原生离线签名器、QR_V1解码及拒签回归使用本产品真实宿主签名库和锁定依赖；Revive35、未知调用、错链或错交易版本必须在签名回调前拒绝。宿主签名/二维码测试与正式移动设备上的扫码、硬件认证及最终用户确认分别验收，不能以宿主结果替代正式包。


### 产品软件记录与正式版本恢复

本仓公开`scripts/flow.mjs records`使用准确同仓短期GitHub权限，重读本仓当前路由，复用远端流程同一Run保留器并确认实际删除，再读取各平台最新正式版本。来源合同归本仓release.record_source：按实际产品选择Tag、单包正文或正式元数据资产验真，标题、版本、源码与适用不可变标志不能由调用方推测。准确元数据资产仅经官方HTTPS地址读取，跨主机不转发仓库令牌。正式资产和Tag不会在记录刷新中删除。公开结果仍是records/removed_run_ids，原记录页行为保持。

`recover`不重新派发；重新核验原候选、成功CI、原Run终态、正式资产来源与Tag，输出formal_release/removed_run_ids。控制调用方仅绑定原任务身份、原候选和产品公开回执，更新现有持久发布目标；产品验真算法不再随调用方程序编译。相关正常、失败、错资产/正文/来源、重定向隔离、独立记录刷新和恢复用例源码归本仓flow.test.mjs。

资源工具取消、超时、输出超限和异常收尾均等待主进程与整个后代组退出；无法确认退出时保留工作根和候选，禁止删除输入或改为可写。真实取消退出顺序用例仅写入resources.test.mjs，尚未执行。


### 发布实现范围

本轮新增产品发布实现已撤销，发布功能由后续逐个产品重建。现有操作入口与界面保留，当前不提供已删除实现的执行保证；Build、CI、Release和Start继续按各自现有入口运行。


### 产品独立资源与唯一依赖供给

本产品的scripts/resources.mjs拥有资源解析、来源与摘要验证、缺件取得、可写视图和失败条件。PRODUCT_DEPENDENCY_ROOT是可选只读供给；没有供给时使用源码外的本产品原件存储，产品需求仍只由当前源码、声明和锁决定。依赖索引读取仅接受schema_version=2及packages、git_sources、pods，不恢复旧目录或整锁快照。

Maven的具体JAR、AAR、POM、module及分类器文件统一由packages的group:artifact、version、准确上游URL、SHA256和SRI定位objects中的原件。产品在本轮work/dependencies/maven按上游分区复制独占文件；不复制Gradle二进制元数据、锁和下载状态。产品生成本轮GRADLE_USER_HOME/init.d初始化脚本，只在自身已声明的同源仓库之前加入本轮原件视图，缺件仍按产品原仓库解析，明确离线则失败。Gradle解析、工程状态和后续编译都属于同一产品任务。

Pod由pods中的name、version、checksum匹配当前Podfile.lock；spec保存官方CDN地址和原件摘要，source保存官方podspec来源，files保存发布树相对路径、文件内容摘要与权限或安全内部链接。只物化本产品所需的单个发布坐标；其它Pod、整锁、平台或宿主变化不要求复制全树。产品仍按CocoaPods官方规范回验SPEC CHECKSUMS，再验证本产品预锁定Git提交或HTTP发行摘要与源码回执。可写缓存和工具VERSION仅在本轮work产生，不能写回共享原件。

错来源、摘要、重复同源内容、生成状态、硬链接、内部链接越界或循环、取消及任务副本漂移均据实失败。独立与控制台调用使用同一实现；控制台只提供可选原件并跟踪原有任务，UI、功能、按钮、平台与操作顺序保持。用例源码已同步，执行留待整项实现结束后的统一测试。


### 独立入口回归验真边界

资源回归使用自带固定提交、源码字节和spec的合成Pod，不借用产品真实Pod清单提供测试输入；无真实Pod需求的平台也验证来源、摘要、链接、循环、取消和物化失败。测试现场仍位于本产品target的准确平台，不写源码或其它产品目录。资源声明与生产依赖坐标不因测试夹具改变。

Apple验真器回归显式使用已验真的锁定Xcode及其SDK；官方swift入口允许包内链接，但规范目标必须属于同一Xcode且为有执行权限的普通文件。不得因此借用PATH或另一套工具。

资源取消对同一真实进程组每轮只发送一次信号；组不存在或Windows时才发送给主进程。仍等待主进程和后代实际退出，8秒未退出才强杀，12秒仍未确认则保留现场并失败；取消不能成为成功。

Apple验真器测试由同一锁定Xcode的swiftc编译实际XCTest Bundle，使用该包随附XCTest框架与Swift overlay，再由同包xctest执行；必须回读5项测试全部成功，空测试套件不得算通过。Bundle、模块缓存和临时输出仅归本产品target准确平台。


### 产品只读商店身份公开边界（2026-10-07）

现有scripts/build.mjs增加唯一只读命令：`node scripts/build.mjs store-identity`，不接受平台、工作目录或额外参数，不启动Build/CI/Release/Start、不读取凭据、不创建工作数据、不获取工具依赖，也不执行发布。独立调用不需要控制台环境或PATH中的工具。控制台商店凭据配置调用同一命令，产品身份变更无需改控制台。

本产品自己选择唯一原始iOS Runner工程与唯一Android应用Gradle配置。iOS使用PBXProject中的唯一Runner应用目标，分别取项目与目标唯一Release配置，目标覆盖项目，与本产品已有签名验真使用的配置关系一致；缺失、歧义、未解析变量或非法标识均失败。Android沿用本产品原有applicationId读取规则，不更改Build签名、安装或完成条件。

回执固定为schema=1、product_id、bundle_id、package_name、source_files。每个source_files元素仅含本仓相对path与SHA-256，列出scripts/flows.json、scripts/build.mjs及本次读取的两个原始配置。父目录和文件均拒绝链接，原始文件必须是单链接、非空、至多1MiB的普通文件；同一描述符有界读取，核验inode/大小/时间及当前路径，解析后再次验真全部来源。入口或配置缺失、重复、被替换或摘要变化均失败，不回退到控制台静态产品登记，不恢复已删除的产品Publish实现。

本轮仅维护现有build.test.mjs的身份解析、源码边界、真实只读入口及合成原始配置回归；测试现场仍在本产品target真实平台下。依赖版本、锁、资源登记、平台声明和原有流程步骤保持。


### 门禁官方归档字段与平台命名边界（2026-10-07）

平台禁用值继续来自本仓既有门禁登记。仅scripts/resources.mjs的唯一规范toolDefinitions声明内、唯一Flutter工具的archive.url可以按对应数字版本核对官方稳定版macOS归档；source、root和executable必须匹配原有官方坐标。识别后仅从平台扫描输入移除该URL，原资源源码、工具版本、来源及依赖锁均不修改。重复声明、重复键、转义或不可解析字面量、错版本、错来源及错形字段不予豁免；其它工具、字段、源码、注释和目录中的旧平台标识继续拒绝。

既有门禁测试覆盖本仓真实资源声明、官方字段、伪造来源和字段、歧义字面量、额外源码、旧平台注释与目录；全部夹具只在本产品target真实平台测试目录生成，并在finally清理。工作树诊断与绑定已保存提交SHA的正式门禁分别记录，不能将缺少Git跟踪文件的工作树冒充正式通过。

当前完整门禁回归13/13通过，失败/取消/跳过/待办均0；本仓真实根技术文档、机密扫描及平台命名检查通过。完整资源源码和补丁边界、既有链接/临时目录/根文档夹具的失败已消除。测试及工作树检查不代替绑定已保存提交SHA的正式门禁，也不代替产品真实Build、签名安装及启动验收。本轮自有日志与夹具在结果记录后按原规则删除。


### 补丁原上下文与测试夹具边界（2026-10-07）

平台扫描只对scripts/resources.mjs中唯一规范flutterPatch JSON字面量执行原上下文识别：补丁登记字段严格为path、sha256、source；path为flutter.patch，source为Flutter官方固定40位提交，正文首行固定来源必须一致，全文SHA-256必须匹配本仓登记。仅当native_assets_host.dart准确文件、hunk及lipoDylibs邻接上下文唯一匹配时，从扫描副本移除那一行已核对的上游原注释。实际资源源码和补丁正文不修改；其它补丁行、源码、字段和目录继续完整扫描。错误来源、摘要、重复声明、非规范转义、上下文漂移和新增旧平台文字均不豁免，不跳过整段补丁。

既有门禁夹具以unlinkSync删除测试目录中的链接自身；测试临时目录仅调用本仓唯一testRoot，无旧API别名。机密扫描夹具生成本仓必需的合成根文档，原文档检查及拒绝断言保持。补丁正常、错源、错摘要、错形、重复、上下文外残留等边界同步在既有test.mjs，现场在本产品target内并由finally清理。补充实现后的统一门禁验收已通过，正式提交门禁及产品真实Build/启动验收仍待完成。


本产品scripts/build.mjs的模块初始化与CLI执行分离：私有异步runCLI承载原命令主体，仅在直接执行文件时启动，拒绝时输出错误并以退出码1失败。模块求值先完成，scripts/resources.mjs可反向导入同一checkWork、requirements和平台校验，不复制实现或增加启动入口；普通import不启动CLI。现有公开参数、JSON请求、--offline、锁定Node验真和必要重入、资源/准备/编译/适用签名安装回读步骤以及取消与结果合同保持。离线缺件和非法输入必须真实失败，禁止以未完成顶层await退出替代完整结果。对应真实CLI回归只在自有target测试现场替换资源供给边界，验证反向导入、参数与错误传播，不据此声称实际产品编译通过。


本产品scripts/resources.mjs的普通inventory清单保持独占文件要求；工具原件toolInventory复用同一扫描实现，只允许全部真实名称均位于同一规范payload内的硬链接组。扫描按dev/ino分组，实际名称数量必须与nlink闭合；工具普通文件以O_NOFOLLOW打开，打开及读取后复验身份、计数、权限和字节相关元数据，扫描结束再回读全部目录、文件及链接身份与规范目标。原件外额外名称、目录或链接越界、特殊项、读取期间替换/权限/内容变化均失败。清单仍逐路径保留原有path/sha256/executable或directory/target格式，继续由既有回执、准确官方归档/版本、配方和编译输入证明验真；regular与其它资源默认独占校验不放宽。不新增公开命令、参数、声明字段或原件登记，不改版本、锁、配方和工具原件，不以拆分内部链接、重新安装或下载解决验真。回归复制本仓完整实现到所属target测试现场，仅替换文件IO边界以确定性制造读取变化，并在夹具内暴露已有私有验真函数；纯合成对象覆盖正常、拒绝与回执漂移，不据此宣称真实工具或产品编译通过。


本产品资源验真将下载运输元数据与源码工具编译身份分开：仅在源码工具证明和本产品声明的比较副本中，验证并移除archive.mirrors与upstream_patches各项mirrors。镜像须为非空、无重复、无控制字符/空白、无账号/口令/片段的准确规范HTTPS地址数组；错误格式直接失败。官方来源URL、版本、归档字节摘要、kind/root/executable、补丁来源/摘要/顺序、前置与依赖闭包、其它位置同名字段及未知字段继续严格比较。Xcode/POSIX输入、recipe.source和source.archive/source.gem摘要、原回执清单及入口独占规则不变；比较不改写原证明、声明或回执，不改变原件/登记/配方/版本/锁和实际下载策略，不读取控制台登记作为产品版本或策略来源。既有回归使用完整本仓资源实现及纯合成物理证明，逐次重算清单，验证运输差异可复用与真正输入漂移必须失败；测试不启动工具或冒充真实编译交付。


资源回归中的两个明文负向地址按片段构造，实际传给拒绝用例的值保持逐字一致；HTTPS错误断言与来源越权拒绝保持，生产连接规则不放宽。本轮临时边界验证不替代准确保存提交的完整门禁和同SHA远端验收。
