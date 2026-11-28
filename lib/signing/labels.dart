// 从生成注册表取得签名动作中文名，拒绝未登记动作。

import 'dart:typed_data';
import 'package:citizenwallet/helpers/format.dart';
import 'package:citizenwallet/protocol/qr_action_registry.g.dart';
import 'package:citizenwallet/signing/registry.dart';
import 'package:polkadart_keyring/polkadart_keyring.dart' show Keyring;

/// 交易 action 英文标识 → 中文显示名映射。
///
/// 钱包 UI 显示时查此表翻译，未命中必须红色拒绝，不允许原样显示英文。
/// 本表直接来自 qr-protocol 生成文件，禁止在钱包端另写第二套动作名。
const Map<String, String> actionLabels =
    GeneratedQrActionRegistry.actionLabelZhByKey;

/// QR 数字 action → decoder action_key。
///
/// 这里用于无法解码 payload 时仍能判断“动作是否已登记并有中文名”。
/// UI 只能显示中文动作名；查不到时必须红色拒绝。
const Map<int, String> actionKeyByCode =
    GeneratedQrActionRegistry.actionKeyByCode;

String? actionLabelForDecodedAction(String actionKey) =>
    actionLabels[actionKey];

String? actionLabelForQrAction(int actionCode) {
  final actionKey = actionKeyByCode[actionCode];
  if (actionKey == null) return null;
  return actionLabels[actionKey];
}

// 将交易审阅字段转换为注册表中的中文标签和规范展示值。

/// fields value 转换。
///
/// - `approve` 布尔 → 赞成/反对。
/// - 账户字段（`account_id` 或 `*_account_id`）的 32 字节
///   公钥 hex 一律转成 SS58 地址展示 —— 人看的地方统一 SS58,hex 公钥只给系统用。
///   公钥字段(`*_public_key`)、哈希字段(`*_hash`)按明确标注保持 0x hex 不转。
String fieldValueText(String key, String value) {
  if (key == 'approve') return value == 'true' ? '赞成' : '反对';
  if (_isAccountIdKey(key)) {
    final ss58 = _accountHexToSs58OrNull(value);
    if (ss58 != null) return ss58;
  }
  return value;
}

/// 单账户使用 `account_id`，多账户使用 `<角色>_account_id`。
bool _isAccountIdKey(String key) =>
    key == 'account_id' || key.endsWith('_account_id');

/// 规范 32 字节账户 hex(`0x` + 64 位小写)→ SS58;不匹配返回 null 按原值展示。
String? _accountHexToSs58OrNull(String value) {
  if (!isAccountIdText(value)) return null;
  final hex = value.substring(2);
  final bytes = Uint8List(32);
  for (var i = 0; i < 32; i++) {
    bytes[i] = int.parse(hex.substring(i * 2, i * 2 + 2), radix: 16);
  }
  return Keyring().encodeAddress(bytes, ChainConstants.ss58Prefix);
}

bool hasFieldLabel(String key) => fieldLabelTextOrNull(key) != null;

/// reviewFields key → 中文字段名；未登记返回 null,调用方必须红色拒绝。
///
/// 标签唯一真源 = qr-protocol 生成表(fields.yaml)。不得在此加英文兜底,
/// 否则未登记字段会以英文 key 泄漏到确认页(如历史上 `amount_yuan` 被
/// `amount_` 前缀规则误拆成「yuan金额」)。
String? fieldLabelTextOrNull(String key) {
  return GeneratedQrActionRegistry.fieldLabelForKey(key);
}

/// reviewFields key → 中文字段名。
///
/// 仅保留给既有测试和非签名确认辅助场景；真正签名放行必须使用
/// [fieldLabelTextOrNull] / [hasFieldLabel]。未登记字段直接抛错,不能生成展示兜底。
String fieldLabelText(String key) {
  final label = fieldLabelTextOrNull(key);
  if (label == null) {
    throw StateError('签名字段缺少中文名称');
  }
  return label;
}
