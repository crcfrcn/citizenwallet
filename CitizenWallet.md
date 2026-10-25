# CitizenWallet 技术文档

当前编译入口已在本产品正式main检出原路径最简重建；配置只声明，测试、编译和自动化验收结果以实际执行回执为准。

## 聊天功能的唯一产品归属

**聊天客户端的逻辑功能只能在 TataChatSDK 中实现；聊天服务端的逻辑功能只能在 CitizenServe.tatachat 中实现。公民、途遇及其他产品只依赖使用。**

CitizenWallet 涉及聊天时只作为依赖使用方；本条不代表尚未接入聊天的产品已经具备聊天能力。

- 消息、会话、群组、加密、协议、传输、同步、重试、聊天存储、附件、通话及聊天界面行为，按客户端与服务端职责分别归 TataChatSDK 和 CitizenServe.tatachat；新增功能、缺陷修复和平台差异也必须在所属产品内完成。
- 消费产品只提供产品入口、身份与业务权益结果、服务地址及授权、主题和公开接口要求的平台配置；只通过公开接口接入，禁止复制、重写、包装成另一套聊天内核或维护产品专属聊天实现。CitizenServe、TuyuServe 的产品身份与权益授权不包含聊天数据面的实现职责。
- 本机开发直接依赖仓库路径；公民、途遇等产品的正式版本依赖塔塔聊天正式 Release；第三方市场分发使用公开市场版本。依赖使用不以公开市场发布为前置条件，也不改变实现归属。

钱包签名模式由实际签名路由定义；与CitizenSDK通过实际公开接口保持准确命名和闭集。

iOS 原生签名库由钱包脚本编译到本轮外部目录，Podspec 原文位于 `ios/inputs.json` 的 `project/citizenwallet_signer.podspec` 条目，装配到任务工程 `ios/signer/`。该本地 Pod 不包含独立源文件；`preserve_paths` 仅保留真实Podspec以满足CocoaPods文件模式校验，不添加占位源码。静态库仍通过既有 `-force_load` 绝对路径及八个 `-Wl,-u` 符号链接到 App；不设置只接受相对路径的 `vendored_libraries`。此调整不改变签名库实现或 FFI 合同。

本文是公民钱包（CitizenWallet）唯一技术事实文档。

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
- 公民链权威或权益节点部署使用同一 QR_V1 信封中的独立 `node_deploy=16` 链下动作。钱包只接受节点载荷格式2，完整解码并审阅节点类别、编号、目标IP、安装包平台、实际版本、SHA-256、本次任务、期限与随机挑战；节点动作不读取源码摘要，不要求中文Tag、Run或构建证明。共享编解码与动作声明真源归citizenchain/crates/protocol，签名字节只使用共享 QR 协议的 `GMB\0TATA_NODE_DEPLOY_V1\0` 独立域。错误产品、类别、尾字节、信封期限不一致及已签请求均拒绝。节点部署签名不提交链交易，也不借用发布动作签名。
- 生产发布授权闭集固定为十一个产品端：`citizenapp/ios|android`、
  `citizenserve/cloudflare`、`citizenweb/web`、
  `tuyulove/ios|android`、`tuyuserve/cloudflare`、`tuyuweb`、
  `tuyubooking/macos|linux|windows`。钱包自身不再接受iOS或Android独立发布冷签请求，完整旧请求同样拒绝；不保留自身发布展示名或兼容映射。审阅摘要必须显示准确中文产品名“公民”
  “公民服务端”“公民官网”“途遇”“途遇服务端”“途遇官网”“途遇商家端”；旧产品标识、
  非法产品端交叉组合和调用端自带展示名一律拒绝，不保留兼容映射。

##### 永久应用标识与平台接线（2026-08-09）

- Android 的唯一永久应用标识与 namespace 均为 `com.crcfrcn.citizenwallet`，Kotlin 入口包为
  `com.crcfrcn.citizenwallet`；iOS 的唯一永久 Bundle ID 为 `ios.citizenwallet`，真机 UI 测试目标为
  `ios.citizenwallet.RunnerUITests`，签名团队为付费团队 `MHYMVRN6FC`。
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

## 发布授权签名

发布解码器只登记现存产品与准确平台；previous_deployment_id必须非空。外层期限、0x24签名域、一次性请求和尾随字节校验保持。

## 产品介绍与开源许可

根目录 `README.md` 仅提供本产品简明介绍，不承载技术方案、任务记录或验收结论。独立自有代码采用根 `LICENSE` 的MIT；上游代码、衍生修改、依赖及组合分发遵循各自原许可、版权、例外与附加要求。

离线签名Rust包及iOS podspec的第一方作者字段使用同一准确作者署名，组织仓库仍只使用产品登记来源。

自助占号冷签 self_occupy_cid 固定动作0x0a05，解析当前单 cid_number 参数与完整 SigningPayload，显示自助注册CID、目标CID及指定签名账户；CID校验位按Runtime四字符盈利码M1规则核验；旧参数、非规范长度、错误校验位、未知动作、裸call/哈希、错误链或交易版本必须拒绝。

## 第7步原生客户端适配（2026年10月6日，源码回归通过，正式页面验收待完成）

链端Revive为pallet35；本钱包继续只接受已登记的原生sr25519和QR_V1业务动作。Revive的eth_transact、普通call/upload/map_account，以及经过SetOrigin验证的转换入口均不登记冷签；未知调用即使伪装成转账action也必须在调用签名器前拒绝。pallet_registry.dart说明该边界，payload_decoder_test.dart与offline_sign_service_test.dart覆盖各入口拒绝及签名器零调用。

SigningPayload保持era、Compact nonce/tip、metadata mode、spec/transaction版本、genesis/birth hash及metadata None字节。真实metadata的identifier为EthSetOrigin、类型为SetOrigin，原生默认扩展不增加签名字节；spec_version仅用于展示，链身份和transaction_version继续严格核对。现有二维码、sr25519及账户金标保持。

本轮保留原任务的self_occupy_cid单参数差异，Rust签名及QR实现已检查无需修改；实际接口已检查，没有新增业务字段或闭集值。完整离线源码回归、静态分析与Release manifest合同通过，准确日志见唯一任务卡。正式移动包及XCTest/XCUITest页面验收尚未执行。

## 独立派生账户序号范围

公民钱包在自己的WalletManager中独立维护maxAccountIndex=19890604，不引用公民SDK代码或常量。创建保留账户0（//0）；新增只允许1～19890604中尚未添加的序号，可任意跳号，只派生并保存实际选择的账户。指定序号越界在读取种子前拒绝，数据库写事务内继续复核范围和重复；顺序添加在事务内计算已有最大序号加一，超出19890604必须拒绝。

详情页到顶后“添加下一个账户”不可点击，显示已达账户序号上限；“指定序号添加”仍可回填合法空缺。八位序号继续使用原有自适应徽章。独立种子存储、派生算法、已有账户地址、二维码与最多六项助记词候选保持现状。SDK中导入的公开冷账户属于另一产品目录，不参与本产品的派生序号校验。

本产品测试覆盖旧上界后的合法序号、新上界、越界与重复拒绝、顺序到顶、空缺回填、硬件解封前拒绝、高序号读取及派生一致、到顶界面和八位徽章。

本次账户序号修改的离线验证：WalletManager及WalletDetailPage共48项测试全部通过，四个修改过的Dart源码/测试文件静态分析无问题；高序号签名由独立参考公钥验通。未执行移动端正式构建和真机验收。测试工程及生成物均在源码外，保留既有独立原生签名库和Isar依赖原件。

## MLS公钥登记签名合同

公民 App 的同一本机 MLS 身份使用动作 `mls_device_bind`（二维码 `a=13`）请求登记授权。冷端只解析完整 SCALE 载荷：`cid_number`、`binding_revision u64LE`、`account_id`、`public_key`、`issued_at u64LE`。账户与 MLS 公钥必须为小写 `0x` 加64位十六进制，公钥为32字节；载荷必须完整消费，登记版本与签发时间为正值，账户必须等于当前签名账户，请求过期秒数必须等于签发毫秒数整除1000加120。

签名域唯一为 `OP_SIGN_MLS_DEVICE_BIND = 0x1C`，签署 `blake2_256(GMB ‖ 0x1C ‖ SCALE)`。二维码码型闭集为1至5，不提供额外应用密钥的派生、加密交付或响应。原生签名库只导出4个既有 sr25519 接口；钱包私钥保存、认证与其他扫码签名能力保持各自既有合同。登记端只接收公开 MLS 公钥，不接收 MLS 私钥或协议状态。

### 新法地域解码

propose_enact_law的原四字节地域槽按两字节原省码加u16小端原省内市号解码，不再按u32数字省码展示。全国明确四零字节；省级为两位大写字母和零市号；市级为原省码及原三位市号数值，展示补齐原前导零。非法层级、字母或地域形状拒签，不回退全国。复用原确认页scope_code字段及行政区代码标签显示CN、原省码或原省码加市号，不新增控件或扫码交互。CID、CN、现有省市规则及宪法修改流程保持。

transaction_version属于框架原生RuntimeVersion，不是新增公民链字段。遵循CitizenChainRuntime.md的统一政策，每次正式Runtime升级，spec_version和transaction_version各自在此前实际部署值上加1；本钱包chain_constants.dart同步支持该次交易版本。编辑、测试或重复编译不递增版本，不按改动种类另作判断，也不把spec_version当成transaction_version。本轮没有执行升级，保留版本数值。现有offline_sign_service交易版本拒签机制不改，测试以支持版本加一构造不支持版本，避免把某个固定合法版本永久当作错误。既有载荷夹具增加原字母、省内市号、不同省同市号及非法值断言；全国改为合法四零字节。均仅为源码维护，未运行测试、类型检查、编译、安装或签名。

## 当前编译与自动化合同

scripts/config.mjs仅声明产品、工具、平台、配置需求与公开入口引用；不计算版本、不访问GitHub、不启动进程、不生成文件。scripts/build.mjs拥有本产品入口，独立CLI与控制台调用同一实现；导入不执行命令。控制台不拥有产品依赖或流程，不导入其私有宿主模块。

本机与GitHub均沿原始依赖锁执行，缺缓存按原锁正常取得；真实下载、测试、编译、签名或验收失败必须失败。官方缓存只存可再生依赖与编译状态，不含签名材料；恢复/保存故障不阻塞。每轮现场归target/test或target/build的唯一目录，缓存原子领取且不等待，取消等待本轮进程组退出后清理；无法确认退出则保留现场并明确失败。

产品命令：node scripts/build.mjs test <平台>、build <平台>、candidate <平台>、automate <平台>、cleanup <平台>，以及供Android工作流调用的upload android。自动化按准确main提交和平台Workflow执行，派发前检查活动Run，官方派发回执直接提供Run ID；不确定不补发。控制台恢复只观察原Run，产品cleanup命令独立执行历史收尾。成功版本补丁加一，失败不加。商店上传或后续步骤失败时，原always收尾核对本轮Run、attempt、源码和Tag归属后撤回本轮Tag与Release并回查，保留失败Run、日志和Artifact，不占用同版本重试；不删除其他Run的候选。自动化候选版本仅存在本轮派生工程与产物，不回写产品版本和依赖锁。

固定Workflow为产品·平台；Run、Job、Artifact、正式Tag、Release及附件显示标签为产品·平台·vX.Y.Z，必要文件扩展名保留。Workflow创建准确源码Tag，正式附件先逐个下载比较再确认正式Release；清理按本产品平台最新成功和非成功终态各留一条，活动任务保留，删除后回查。淘汰旧成功前必须确认新正式Release/Tag与Artifact；不按界面隐藏代替实际删除。

产品测试、塔塔鹿鹿和自动化均通过控制台发起；本机塔塔安装器与GitHub塔塔自动化共用本仓唯一编译实现，分别沿用下述已确认的签名方式。钱包不设独立发布文件、命令或控制台发布按钮。iOS在同一Run的测试、编译、正式附件验收及逐字节回读成功后，沿公民App现有方式调用xcrun altool --upload-package --wait，将同一份IPA上传App Store Connect；上传失败即失败，自动化不提交审核或公开上架。上传复用控制台中已获准的公民App App Store Connect配置，通过现有保密流程交付钱包仓库的APPSTORE_KEYID、APPSTORE_ISSUERID、APPSTORE_PRIVATEKEY，不新增密钥或将值写入源码。私钥仅写本轮signing/appstore现场，上传成败均立即删除，不进入正式附件；原always签名清理和GitHub历史清理保持。IOS_KEY、CITIZENWALLET_PROFILE及导出方式不变，不为上传修改描述文件或重签。Android与公民App各自声明PLAY_SERVICEACCOUNT，按同名共用控制台唯一值；配置复用及追加归属入口已删除，GitHub名称迁移另按准确授权交付，不新增服务账号或密钥；现有服务账号仅追加钱包应用的只读查看及测试轨道权限（含草稿上传），不授予正式发布权限。由Google官方认证Action取得仅androidpublisher作用域的短期令牌，不生成凭据文件；现有scripts/build.mjs的upload android入口调用Google Play官方API，核对本轮proof、AAB字节与版本后创建edit、上传AAB、核对摘要、提交保存，再从新edit回读版本和摘要并删除回读edit，不修改轨道、不公开投放。有审核中的变更、权限、网络或回读失败均明确失败，不自动重发。任何失败先查原因、报告推荐方案，待用户确认后修复并继续。

钱包平台为ios、android；宿主Rust签名库只作为真实Flutter测试输入。编译使用Flutter 3.47.2、Rust 1.97.1、Gradle 9.1.0、AGP 9.0.1、KGP 2.2.20、NDK 28.2.13676358、CocoaPods 1.17.0。Android使用官方Flutter插件加载器和当前原锁插件支持的KGP/DSL设置，不修订Flutter、Gradle或插件缓存；工程和硬件金库单测按官方布局装配到本轮source-view。图标使用macOS sips与既有原件、尺寸声明，不包含自编图片编解码器。

iOS消费现有原工程与Pod锁，使用CocoaPods官方disable_input_output_paths选项代替手写Isar输出清单；相关复制脚本可能每次构建执行。正式IPA通过Flutter官方导出，验收应用标识、版本、团队签名和四个sr25519导出。Android保留最低API24、目标API36及唯一ARM64 ABI；Gradle正式签名后验收APK/AAB身份、签名证书、ZIP/ELF16KB对齐。缺正式材料时自动化失败，不使用调试签名。本机build只编译无签名候选，不安装设备、不冒充正式产物。

签名材料只在获准步骤临时使用，Apple钥匙串搜索列表按原值恢复，本轮profile与临时钥匙串随后删除。test/build.test.mjs覆盖构建规则和失败边界，signing原生测试、现有全部Dart测试及Android硬件金库单测仍由真实官方工具执行。现有XCUITest保留；未执行的真机UI或实际设备安装不得记为通过。

官方工具缺件时由产品入口在本仓target/cache内准备：Flutter官方归档、rustup准确工具链和CocoaPods准确版本；Cargo/Pub/Gradle/Gem用户缓存均交付本产品现场或缓存路径。控制台只交付普通工具路径和获准输入。删除历史资产先移除已验真Tag，再移除其Release，失败重试仍保留归属回执；相关中断回归归test/build.test.mjs。

载荷解码只对三处多行if补齐花括号，原条件、return null及后续业务表达式保持，既有断言不变，严格分析规则不关闭。

工具退出回执先保留原工具失败及诊断，再以系统ps只读获取PID/PGID表；只在有效快照包含调用进程、且本轮进程组已空时允许收尾。查询错误、无效或不完整快照、后代未退出均明确失败并附本轮PID/PGID、保留现场。现有Node内置Mock回归保留原失败/EPERM/留场断言，另验证无效快照和真实同组后代完成，不新增框架、接口或控制台改动。

Flutter测试使用官方JSON reporter，Bash pipefail与tee将原始报告同时交付控制台和本轮target/test现场的flutter-report.jsonl；工具非零退出、报告解析或原有完整性断言失败均保留报告及现场供取证，不改变原断言，不自动修复业务失败。


工具准备唯一归scripts/build.mjs，工作流只准备所属平台外部SDK并调用产品入口，不重复安装Flutter、Rust或CocoaPods，也不安装另一平台Rust目标。原生库通过官方cargo rustc --lib --crate-type按消费者选择：宿主及Android为cdylib，iOS为staticlib；Rust原单测、Flutter原测试、APK及AAB交付均保留。截图保护测试读取物化工程标准路径，业务与安全断言保留；Isar构建细节改为断言CocoaPods官方选项并拒绝旧手写输出清单。

Android在官方android DSL中声明testBuildType = "release"，使AGP9仅为选定Release构建类型创建单测组件，沿用testReleaseUnitTest入口；不恢复同时创建Debug与Release单测的旧全局开关，不新增编译任务或修改业务与安全断言。本机调用通过JAVA_HOME和PATH交付现有Android Studio JBR，配置不安装Java。

iOS签名静态库的符号验收使用现有Apple nm -g --no-llvm-bc，只读取已生成机器码的导出，避免Apple LLVM读取较新Rust LLVM的上游bitcode。四个必需sr25519导出断言、工具非零退出失败处理均保留；不安装其他LLVM工具，不调整Rust编译参数，宿主及Android检查不变。通过实际iOS编译入口验收，不以文本匹配测试代替真实符号检查。

Runner的Release配置按Flutter静态FFI官方建议声明STRIP_STYLE = "non-global"，正式归档保留全局符号并继续裁剪非全局符号，避免默认All Symbols裁剪影响FFI验收；Debug配置、Rust实现、签名及四个导出断言不变。现有装配回归通过官方plutil解析真实物化工程，核对该声明只落在Runner Release配置；正式IPA仍执行原符号验收。


## 本机编译与GitHub终态清理

本机只通过scripts/build.mjs compile PLATFORM编译当前源码，签名和设备安装由控制台唯一原生安装器负责；产品不实现GitHub安装包下载、最新包缓存或安装回退。

scripts/build.mjs以中文注释明确标出控制台本机编译代码块，唯一入口为compile ios或compile android。本块交付已有~/.cargo/bin及Android SDK/JBR环境，复用同一buildProduct；经TATA_COMPILE和stdin EOF把本轮产物交给原生安装器消费并清场。各端工程和临时目录独立，工具与包复用本仓target/cache；删除自建整库锁、空缓存回退及无用release，沿官方工具自身并发机制处理缓存，避免双端并行时因改用空缓存重复下载Flutter。版本、原锁、正式编译及签名/商店上传流程保持。



GitHub正式附件文件名唯一采用citizenwallet-ios-vX.Y.Z.ipa及citizenwallet-android-vX.Y.Z.apk/aab，清单和摘要使用同一ASCII基名。中文产品·平台·vX.Y.Z及扩展名由GitHub官方file#label提供显示；Run、Job、Artifact、Tag与Release显示名保持原合同。编译输出、打包证明、验收与逐字节下载回读共同消费artifactBaseName，不假设GitHub保留特殊字符文件名。原cmp、安全、签名与符号断言全部保留。安装仍读取GitHub真实附件名称，IPA/APK直接保存在/Users/rhett/citizenwallet/target/，无新增子目录、框架或发布实现。

创建Release使用GitHub CLI官方--target "$GITHUB_SHA"，明确将target_commitish设为本次编译提交；已有Tag仍通过--verify-tag及原Tag SHA回读独立核验。回归模拟GitHub默认目标为main，覆盖省略--target时原准确SHA断言失败并撤回候选，保留附件逐字节回读及损坏附件撤回断言。该附件修复不改业务和控制台。


本机蓝色入口统一称塔塔安装器，唯一实现位于塔塔控制台app/source/Installer.swift。钱包scripts/build.mjs的compile PLATFORM调用同一buildProduct完成本机编译并交付本轮App/APK及原声明Android工具入口，调用方消费结束后清场；不再下载GitHub正式包或实现设备安装。GitHub流程仍称塔塔自动化，正式签名、上传和记录保留规则保持。

Android本机安装器沿用现有APP_KEY，与公民App按同名APP_KEY共用唯一值，并记录已签APK的公开证书指纹；不生成新密钥。iOS本机继续使用先前安装成功的已有Apple Development身份和系统设备描述文件，按安装器原规则选择；不创建、下载或重建描述文件，不强制使用正式分发证书。GitHub塔塔自动化继续使用原IOS_KEY及CITIZENWALLET_PROFILE完成正式签名，App Store Connect上传保持原流程。

节点部署冷签只接受公民链·LinuxARM·vX.Y.Z正式标签：字段按UTF-8读取且最多64字节，三段版本为无前导零的非负UInt64，完整保留中文及中点，不转换或接受旧英文别名。原产品、节点类别、目标IP、任务、摘要、期限、nonce、签名域及防重放校验保持；非法UTF-8、错误长度、截断和尾随字节仍拒绝。


节点冷签回归同时覆盖格式2真实解码、独立签名域金标、实际签名验签与防重放，以及页面绿色批准和旧格式红色拒签。公开样例与共享协议fixtures/sign_request.json及控制台测试逐字节一致。控制台本机compile入口先调用本产品testProduct完整回归，失败不进入设备安装；所有验证仍使用本产品原依赖锁与工具声明。

本产品scripts/config.mjs的describeAction仅返回repository、workflow、ref、inputs，或既有本地进程命令声明；不导入构建实现、不派发GitHub请求、不处理令牌、版本或历史。控制台使用统一数据接口直接派发并只读观察准确Run；产品GitHub业务归所属既有YAML。本次自动化Run名称使用运行编号，正式构建及产物保持版本名称。已有工具和依赖复用，缺少时才按原声明准备。

本产品配置项统一为name、description、accessLevel、kind、format五个必填字段；不适用规则明确填写“不适用”。name严格使用两组大写字母和一个下划线，同名共用控制台唯一值，当前页仅汇总实际声明的使用产品。操作列固定写入/更换、查看、删除；保密查看保留生物识别。现有配置消费者随声明同步改名，官方工具/API字段保持官方名称，不新增旧名兼容或配置副本。
描述文件使用CITIZENWALLET_PROFILE，format绑定真实iOS Bundle身份；不能将其它产品描述文件冒认成本产品已配置。
