// 集中定义离线签名使用的公民链固定参数。

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

  /// 本钱包唯一支持的交易版本；按正式节点已部署 RuntimeVersion 核对。
  /// V5 交易格式号不等于 transaction_version。其他模块和测试仅引用此值。
  static const int transactionVersion = 5;

  /// 钱包交易版本有效性的唯一判断入口。
  static bool supportsTransactionVersion(int version) =>
      version == transactionVersion;
}
