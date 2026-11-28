// 定义固定账户码的账户标识载荷及解析。

import 'package:citizenwallet/protocol/envelope.dart';
import 'package:citizenwallet/protocol/qr_bodies.g.dart';

/// k = 5 账户码(**固定码**,envelope 顶层无 id / expires_at)。
///
/// 语义 = 「这是**哪个账户**」。**钱包没有码,账户才有码** —— 一个钱包由多个账户组成,
/// 二维码描述的始终是其中某一个账户。冷热两端都能生成。
///
/// body 只有一个单字母键:
///
/// - `n` = `account_id` 账户标识(`0x` 小写 64 位 hex)
///
/// **不得携带账户名、昵称、CID、SS58 或任何时效字段**:本机账户标签用户可随意改写、
/// 无任何链上或服务端约束,一旦进入二维码就会被扫码端当成对方公开身份显示。
/// 展示用 SS58 由扫码端从 `n` 自行派生。
///
/// 冷热两端按同一公开 QR_V1 账户码字段合同交互。
class AccountIdCodeBody implements QrBody {
  const AccountIdCodeBody({required this.accountId});

  /// 小写 `0x` 加 64 位十六进制,即 sr25519 公钥原字节。
  final String accountId;

  @override
  Map<String, dynamic> toJson() => <String, dynamic>{
        'n': accountId,
      };

  static AccountIdCodeBody fromJson(Map<String, dynamic> data) {
    GeneratedQrBodySchema.validateBody(QrKind.accountIdCode.code, data);
    return AccountIdCodeBody(accountId: data['n'] as String);
  }
}

// 定义用于通讯录的固定用户码及其CID资料载荷。

/// k = 3 用户码(**固定码**,envelope 顶层无 id / expires_at)。
///
/// 语义 = 「这是**谁**」。全 App 唯一能写入通讯录的码,只有已注册 CID 的人才有。
///
/// body 键全部单字母(与 k=1/k=2 同风格,单字母全局注册表见 `QrKind` 文档注释):
///
/// - `c` = `cid_number` 身份主键
/// - `n` = `account_id` 账户标识(`0x` 小写 64 位 hex)
///
/// **不得携带昵称**:本机可随意改写、无任何链上或服务端约束,一旦进码就会被扫码端
/// 当成对方公开身份显示,是冒名风险。扫码端应按 `c` 从服务端拉真实公开资料。
///
/// **不得携带 SS58**:SS58 只是给人看的展示形态,机器一律用 `account_id`;
/// 展示用 SS58 由扫码端自行派生。
///
/// 冷热两端按同一公开 QR_V1 用户码字段合同交互。
/// CID 字符集白名单:仅 ASCII 字母数字与连字符。
///
/// 只查「非空 + 无首尾空格 + 字节长度」挡不住零宽字符:`"\u200BCN...\u200B".trim()`
/// 与原串完全相同(Dart 的 trim 不把 U+200B 当空白),纯零宽串也能通过全部检查。
/// `account_id` 因为有锚定正则天然免疫,CID 必须显式加白名单。
class UserContactBody implements QrBody {
  const UserContactBody({
    required this.cidNumber,
    required this.accountId,
  });

  /// 身份主键 CID 号(永久,换绑不变)。
  final String cidNumber;

  /// 小写 `0x` 加 64 位十六进制,即 sr25519 公钥原字节。
  final String accountId;

  @override
  Map<String, dynamic> toJson() => <String, dynamic>{
        'c': cidNumber,
        'n': accountId,
      };

  static UserContactBody fromJson(Map<String, dynamic> data) {
    GeneratedQrBodySchema.validateBody(QrKind.userContact.code, data);
    return UserContactBody(
      cidNumber: data['c'] as String,
      accountId: data['n'] as String,
    );
  }
}
