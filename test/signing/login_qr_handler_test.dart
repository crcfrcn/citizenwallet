// 验证登录请求标识、响应关联及有效期边界。

import 'package:flutter_test/flutter_test.dart';
import 'package:citizenwallet/protocol/qr.dart';
import 'package:citizenwallet/protocol/envelope.dart';
import 'package:citizenwallet/protocol/sign.dart';
import 'package:citizenwallet/signing/login.dart';

String _loginRaw(String id, {int? expiresAt}) {
  final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
  return QrEnvelope<SignRequestBody>(
    kind: QrKind.signRequest,
    id: id,
    expiresAt: expiresAt ?? now + maxQrRequestLifetimeSeconds,
    body: SignRequestBody.fromHex(
      action: QrActions.login,
      signerPublicKeyHex: '0x${'ab' * 32}',
      payloadHex: '0x6f6e6368696e61', // 'onchina'
    ),
  ).toRawJson();
}

void main() {
  test('所有临时签名共用300秒上限及过期边界', () {
    const now = 1800000000;
    expect(maxQrRequestLifetimeSeconds, 300);
    expect(isQrRequestExpiryValid(now + 300, now), true);
    expect(isQrRequestExpiryValid(now + 301, now), false);
    expect(isQrRequestExpiryValid(now, now), false);
    expect(isQrRequestExpiryValid(now - 1, now), false);
  });

  group('parseLoginSignRequest 请求 id 校验', () {
    test('合法 id 通过并回传', () {
      final env = parseLoginSignRequest(_loginRaw('offline-req-test-0001'));
      expect(env.id, 'offline-req-test-0001');
      expect(env.body.action, QrActions.login);
    });

    test('id 含非法字符(竖线)被拒', () {
      expect(
        () => parseLoginSignRequest(_loginRaw('abcdef|1234567890ab')),
        throwsA(isA<LoginQrException>()),
      );
    });

    test('id 过短被拒(< 16)', () {
      expect(
        () => parseLoginSignRequest(_loginRaw('short')),
        throwsA(isA<LoginQrException>()),
      );
    });

    test('拒绝远未来期限，避免永久保留已签请求', () {
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      expect(
        () => parseLoginSignRequest(
          _loginRaw(
            'offline-req-test-0002',
            expiresAt: now + maxQrRequestLifetimeSeconds + 1,
          ),
        ),
        throwsA(isA<LoginQrException>()),
      );
    });
  });
}
