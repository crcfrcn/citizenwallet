// 集中定义离线签名使用的公民链固定参数。

class ChainConstants {
  const ChainConstants._();

  /// SS58 地址前缀（CitizenChain 注册编号）。
  static const int ss58Prefix = 2027;

  /// 2026-08-07 冻结并已部署的唯一正式创世哈希；Runtime 升级不会改变该值。
  static const String genesisHash =
      '0x18847a5dfd263272f2e7727836fe6582f8c4463ff48609df7b96d5e4d9dd24dd';

  /// 本轮Runtime候选9/8的唯一交易版本；该钱包仅随候选生效后启用，安装另行授权。
  /// V5 交易格式号不等于 transaction_version。其他模块和测试仅引用此值。
  static const int transactionVersion = 8;

  /// 钱包交易版本有效性的唯一判断入口。
  static bool supportsTransactionVersion(int version) =>
      version == transactionVersion;
}
