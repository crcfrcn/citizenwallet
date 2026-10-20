/// CitizenChain 链级常量。
///
/// 所有与链相关的固定参数统一在此维护，
/// 避免散落在多个文件中导致升级遗漏。
class ChainConstants {
  const ChainConstants._();

  /// 本钱包注册表核对使用的公民链公开提交；不跟随链仓 main 自动漂移。
  static const String registrySourceSha =
      '72690d8dc6e8fc1335c67a6dbc83bd40d6ef7b26';

  /// SS58 地址前缀（CitizenChain 注册编号）。
  static const int ss58Prefix = 2027;

  /// 2026-08-07 冻结并已部署的唯一正式创世哈希；Runtime 升级不会改变该值。
  static const String genesisHash =
      '0x18847a5dfd263272f2e7727836fe6582f8c4463ff48609df7b96d5e4d9dd24dd';

  /// 当前钱包支持的 Substrate `transaction_version`。
  ///
  /// 按公民链版本政策，每次正式 Runtime 升级，两个版本各自在此前部署值上加1；
  /// 本值同步为该次 Runtime 的 transaction_version，旧钱包继续严格拒签。
  /// 钱包对 spec_version 仍只解析展示；编辑或重复编译不触发版本递增。
  static const int transactionVersion = 0;
}
