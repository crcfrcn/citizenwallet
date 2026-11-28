// 编解码并校验QR_V1信封，限制码型及临时请求有效期。

import 'dart:convert';
import 'package:citizenwallet/protocol/identity.dart';
import 'package:citizenwallet/protocol/qr_bodies.g.dart';
import 'package:citizenwallet/protocol/qr.dart';
import 'package:citizenwallet/protocol/sign.dart';

/// 临时签名请求统一使用300秒上限，供登录、离线签名和MLS绑定共用。
const int maxQrRequestLifetimeSeconds = 300;

bool isQrRequestExpiryValid(int expiresAt, int nowSeconds) =>
    expiresAt > nowSeconds &&
    expiresAt - nowSeconds <= maxQrRequestLifetimeSeconds;

/// QR_V1统一信封；字段与码型由共享注册表生成的Schema严格验证。
class QrEnvelope<T extends QrBody> {
  const QrEnvelope({
    required this.kind,
    required this.id,
    required this.expiresAt,
    required this.body,
  });

  final QrKind kind;
  final String? id;
  final int? expiresAt;
  final T body;

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{'p': QrProtocols.qrV1, 'k': kind.code};
    if (kind.temporary) {
      if (id == null || expiresAt == null) {
        throw StateError('临时码 ${kind.code} 必须包含 i/e');
      }
      map['i'] = id;
      map['e'] = expiresAt;
    } else {
      if (id != null || expiresAt != null) {
        throw StateError('固定码 ${kind.code} 不能包含 i/e');
      }
    }
    map['b'] = body.toJson();
    return map;
  }

  String toRawJson() => jsonEncode(toJson());

  static QrEnvelope<QrBody> parse(String raw) {
    final decoded = jsonDecode(raw);
    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('QR 内容不是 JSON 对象');
    }
    return fromJson(decoded);
  }

  static QrEnvelope<QrBody> fromJson(Map<String, dynamic> data) {
    GeneratedQrBodySchema.validateEnvelope(data);
    final kind = QrKind.fromWire(data['k']);

    String? id;
    int? expiresAt;
    if (kind.temporary) {
      id = data['i'] as String;
      expiresAt = data['e'] as int;
    }

    final bodyRaw = data['b'];
    if (bodyRaw is! Map<String, dynamic>) {
      throw const FormatException('缺少 b 对象');
    }

    final QrBody body;
    switch (kind) {
      case QrKind.signRequest:
        body = SignRequestBody.fromJson(bodyRaw);
      case QrKind.signResponse:
        body = SignResponseBody.fromJson(bodyRaw);
      case QrKind.userContact:
        body = UserContactBody.fromJson(bodyRaw);
      case QrKind.userTransfer:
        // 收款码只属于 CitizenApp:公民钱包完全离线、发不了交易,扫它没有任何用途。
        // 按角色边界报明确错误,不静默忽略。
        throw const FormatException('收款码请用「公民」App 扫描');
      case QrKind.accountIdCode:
        body = AccountIdCodeBody.fromJson(bodyRaw);
    }

    return QrEnvelope<QrBody>(
      kind: kind,
      id: id,
      expiresAt: expiresAt,
      body: body,
    );
  }
}

abstract class QrBody {
  Map<String, dynamic> toJson();
}

// 按QR_V1公开合同拼接二维码请求和响应的签名原文。

/// 本仓唯一的签名原文拼接函数，遵循公开 QR_V1 签名合同。
///
/// 格式:
/// ```
/// QR_V1|<k>|<i>|<system 或空>|<e 或 0>|<principal>
/// ```
String buildSignatureMessage({
  required QrKind kind,
  required String id,
  String? system,
  int? expiresAt,
  required String principal,
}) {
  final sys = system ?? '';
  final exp = expiresAt ?? 0;
  if (!RegExp(r'^0x[0-9a-f]{64}$').hasMatch(principal)) {
    throw const FormatException('principal 必须是小写 0x 加 64 位十六进制');
  }
  final pp = principal.substring(2);
  return '${QrProtocols.qrV1}|${kind.code}|$id|$sys|$exp|$pp';
}
