import 'dart:convert';
import 'dart:typed_data';

import 'package:citizenwallet/protocol/envelope.dart';
import 'package:citizenwallet/wallet/native_mldsa.dart';
import 'package:citizenwallet/protocol/generated/qr_bodies.g.dart';

class SignResponseBody implements QrBody {
  const SignResponseBody({
    required this.signerPublicKey,
    required this.signature,
    this.pqPublicKey,
  });

  /// 签名账户 `u`：32 字节 AccountId 的 base64url 无填充编码。
  final String signerPublicKey;

  /// 原始签名 `s`：sr 为 64 字节，PQ 为 3309 字节，base64url 无填充。
  final String signature;
  final String? pqPublicKey;

  Uint8List get signerPublicKeyBytes =>
      GeneratedQrBodySchema.decodeBase64Url(signerPublicKey, 'u');

  Uint8List get signatureBytes =>
      GeneratedQrBodySchema.decodeBase64Url(signature, 's');

  String get signerPublicKeyHex => '0x${_toHex(signerPublicKeyBytes)}';

  String get signatureHex => '0x${_toHex(signatureBytes)}';

  @override
  Map<String, dynamic> toJson() => <String, dynamic>{
        'u': signerPublicKey,
        's': signature,
        if (pqPublicKey != null) 'q': pqPublicKey,
      };

  static SignResponseBody fromJson(Map<String, dynamic> data) {
    GeneratedQrBodySchema.validateBody(QrKind.signResponse.code, data);
    return SignResponseBody(
      signerPublicKey: data['u'] as String,
      signature: data['s'] as String,
      pqPublicKey: data['q'] as String?,
    );
  }

  static SignResponseBody fromHex({
    required String signerPublicKeyHex,
    required String signatureHex,
  }) {
    final parts = NativeMldsa.decodeSignature(
        _strictHexBytes(signatureHex, field: 'signature'));
    return SignResponseBody(
      signerPublicKey: _b64NoPad(_strictHexBytes(signerPublicKeyHex,
          field: 'signer_account_id', expectedBytes: 32)),
      signature: _b64NoPad(parts.signature),
      pqPublicKey: parts.publicKey == null ? null : _b64NoPad(parts.publicKey!),
    );
  }
}

String _b64NoPad(List<int> bytes) =>
    base64Url.encode(bytes).replaceAll('=', '');

List<int> _strictHexBytes(
  String input, {
  required String field,
  int? expectedBytes,
}) {
  if (!input.startsWith('0x')) {
    throw FormatException('$field 必须以小写 0x 开头');
  }
  final text = input.substring(2);
  if (text.isEmpty ||
      text.length.isOdd ||
      !RegExp(r'^[0-9a-f]+$').hasMatch(text)) {
    throw FormatException('$field 必须是小写偶数字节十六进制');
  }
  if (expectedBytes == null &&
      text.length >
          (NativeMldsa.publicBytes + NativeMldsa.signatureBytes) * 2) {
    throw FormatException('$field 超过原生接口输入上限');
  }
  final bytes = List<int>.generate(
    text.length ~/ 2,
    (i) => int.parse(text.substring(i * 2, i * 2 + 2), radix: 16),
    growable: false,
  );
  if (expectedBytes != null && bytes.length != expectedBytes) {
    throw FormatException('$field 必须是 $expectedBytes 字节');
  }
  return bytes;
}

String _toHex(List<int> bytes) {
  const chars = '0123456789abcdef';
  final buffer = StringBuffer();
  for (final byte in bytes) {
    buffer
      ..write(chars[(byte >> 4) & 0x0f])
      ..write(chars[byte & 0x0f]);
  }
  return buffer.toString();
}
