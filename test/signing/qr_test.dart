// 验证二维码签名原文及业务签名域。

import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:citizenwallet/protocol/envelope.dart';
import 'package:citizenwallet/protocol/qr.dart';
import 'package:citizenwallet/protocol/sign.dart';
import 'package:citizenwallet/signing/login.dart';
import 'package:citizenwallet/signing/qr.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pointycastle/digests/blake2b.dart';
import 'package:polkadart_keyring/polkadart_keyring.dart';

import 'decoder_test.dart' show topupText, cidRebindPayload;

void main() {
  group('qr', _registerQr);
  group('domain', _registerDomain);
}

// 验证二维码签名原文、业务签名域及跨端固定向量。

String _hexBytes(List<int> bytes) =>
    bytes.map((byte) => byte.toRadixString(16).padLeft(2, '0')).join();

List<int> _u64Le(int value) =>
    List<int>.generate(8, (index) => (value >> (index * 8)) & 0xff);

List<int> _occupyAuthorizationTemplate(String cid, int expiresAt) => [
      ...List<int>.filled(32, 0x44),
      cid.length << 2,
      ...cid.codeUnits,
      ...List<int>.filled(32, 0),
      ..._u64Le(0),
      ..._u64Le(expiresAt),
    ];

List<int> _rebindAuthorizationTemplate(String cid, int expiresAt) => [
      ...List<int>.filled(32, 0x44),
      cid.length << 2,
      ...cid.codeUnits,
      ...List<int>.filled(32, 0x55),
      ...List<int>.filled(32, 0),
      ..._u64Le(7),
      ..._u64Le(expiresAt),
    ];

void _registerQr() {
  late QrSigner signer;
  late String testSignerPublicKeyHex;

  setUp(() {
    signer = QrSigner();
    final pair = Keyring.sr25519.fromSeed(Uint8List(32));
    pair.ss58Format = 2027;
    testSignerPublicKeyHex =
        '0x${pair.bytes().map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';
  });

  test('充值超过256字节仍签完整原文，与SDK raw完全一致', () {
    final raw = Uint8List.fromList(utf8.encode(topupText()));
    expect(raw.length, greaterThan(256));
    final body = SignRequestBody.fromHex(
      action: QrActions.topup,
      signerPublicKeyHex: '0x${'04' * 32}',
      payloadHex: '0x${_hexBytes(raw)}',
    );
    expect(QrSigner.signingBytesFor(body), raw);
    final pair = Keyring.sr25519.fromSeed(Uint8List(32));
    final signature = pair.sign(raw);
    expect(pair.verify(QrSigner.signingBytesFor(body), signature), true);
  });
  test('自助换绑完整授权只做一次GMB+0x11摘要，与App和Runtime原金标相同', () {
    final payload = cidRebindPayload(
        genesisHash: '0x${'22' * 32}', revision: BigInt.from(0x01020304));
    final body = SignRequestBody.fromHex(
        action: QrActions.cidRebind,
        signerPublicKeyHex: '0x${'33' * 32}',
        payloadHex: '0x${_hexBytes(payload)}');
    final digest = QrSigner.signingBytesFor(body);
    expect(payload.length, 131);
    expect(_hexBytes(digest),
        '648df90f231b32d1e0665fd54a9dca94381a739689a665a69d83857941520d4d');
    final registrar = SignRequestBody.fromHex(
        action: QrActions.citizenRebind,
        signerPublicKeyHex: '',
        payloadHex:
            '0x${_hexBytes(_rebindAuthorizationTemplate('CN951-CTZN1-539598435-2026', 0x11121314))}');
    expect(
        QrSigner.signingBytesFor(registrar,
            selfAccountId: Uint8List.fromList(List.filled(32, 0x11))),
        isNot(digest));
  });

  group('QrSigner.generateRequestId', () {
    test('生成 base64url 短 ID', () {
      final id = QrSigner.generateRequestId();
      expect(id.length, 22);
      expect(RegExp(r'^[A-Za-z0-9_-]{22}$').hasMatch(id), isTrue);
    });

    test('带前缀的 ID', () {
      final id = QrSigner.generateRequestId(prefix: 'tx-');
      expect(id.startsWith('tx-'), isTrue);
      expect(id.length, greaterThan(22));
    });

    test('每次生成不同 ID', () {
      final ids = List.generate(10, (_) => QrSigner.generateRequestId());
      expect(ids.toSet().length, 10);
    });
  });

  group('QrSigner.parseRequest', () {
    Map<String, dynamic> validEnvelope() {
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      return {
        'p': QrProtocols.qrV1,
        'k': QrKind.signRequest.code,
        'i': 'test-valid-req-id-0001',
        'e': now + 90,
        'b': SignRequestBody.fromHex(
          action: QrActions.transferWithRemark,
          signerPublicKeyHex: testSignerPublicKeyHex,
          payloadHex: '0x0102',
        ).toJson(),
      };
    }

    test('序列化和反序列化一致', () {
      final envelope = validEnvelope();
      final encoded = jsonEncode(envelope);
      final parsed = signer.parseRequest(encoded);

      expect(parsed.kind, QrKind.signRequest);
      expect(parsed.id, 'test-valid-req-id-0001');
      expect(parsed.body.action, QrActions.transferWithRemark);
      expect(parsed.body.signerPublicKeyHex, testSignerPublicKeyHex);
      expect(parsed.body.payloadHex, '0x0102');
    });

    test('拒绝非 JSON', () {
      expect(
        () => signer.parseRequest('not json'),
        throwsA(
          isA<QrSignException>().having(
            (e) => e.code,
            'code',
            QrSignErrorCode.invalidFormat,
          ),
        ),
      );
    });

    test('未知码型6不能进入签名请求或通用二维码解析', () {
      final envelope = validEnvelope()..['k'] = 6;
      expect(
        () => signer.parseRequest(jsonEncode(envelope)),
        throwsA(
          isA<QrSignException>().having(
            (error) => error.code,
            'code',
            QrSignErrorCode.invalidFormat,
          ),
        ),
      );
      expect(() => QrEnvelope.fromJson(envelope), throwsFormatException);
    });

    test('拒绝错误协议版本', () {
      final json = validEnvelope()..['p'] = 'WRONG_PROTO';
      expect(
        () => signer.parseRequest(jsonEncode(json)),
        throwsA(isA<QrSignException>()),
      );
    });

    test('拒绝非签名请求 kind', () {
      final json = validEnvelope()..['k'] = QrKind.signResponse.code;
      expect(
        () => signer.parseRequest(jsonEncode(json)),
        throwsA(
          isA<QrSignException>().having(
            (e) => e.code,
            'code',
            QrSignErrorCode.invalidField,
          ),
        ),
      );
    });

    test('拒绝缺少 action', () {
      final json = validEnvelope();
      (json['b'] as Map<String, dynamic>).remove('a');
      expect(
        () => signer.parseRequest(jsonEncode(json)),
        throwsA(isA<QrSignException>()),
      );
    });

    test('拒绝 envelope 与 body 未知字段', () {
      final envelopeUnknown = validEnvelope()..['extra'] = true;
      expect(
        () => signer.parseRequest(jsonEncode(envelopeUnknown)),
        throwsA(isA<QrSignException>()),
      );

      final bodyUnknown = validEnvelope();
      (bodyUnknown['b'] as Map<String, dynamic>)['extra'] = true;
      expect(
        () => signer.parseRequest(jsonEncode(bodyUnknown)),
        throwsA(isA<QrSignException>()),
      );
    });

    test('拒绝字符串 kind 与带填充 base64url', () {
      final stringKind = validEnvelope()..['k'] = '1';
      expect(
        () => signer.parseRequest(jsonEncode(stringKind)),
        throwsA(isA<QrSignException>()),
      );

      final padded = validEnvelope();
      final body = padded['b'] as Map<String, dynamic>;
      body['u'] = '${body['u']}=';
      expect(
        () => signer.parseRequest(jsonEncode(padded)),
        throwsA(isA<QrSignException>()),
      );
    });

    test('拒绝已过期请求', () {
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      final json = validEnvelope()..['e'] = now - 100;
      expect(
        () => signer.parseRequest(jsonEncode(json)),
        throwsA(
          isA<QrSignException>().having(
            (e) => e.code,
            'code',
            QrSignErrorCode.expired,
          ),
        ),
      );
    });

    test('到期秒等于当前秒也拒绝', () {
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      final json = validEnvelope()..['e'] = now;
      expect(
        () => signer.parseRequest(jsonEncode(json)),
        throwsA(
          isA<QrSignException>().having(
            (e) => e.code,
            'code',
            QrSignErrorCode.expired,
          ),
        ),
      );
    });

    test('拒绝远未来期限，正常短期请求保持可解析', () {
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      final distant = validEnvelope()
        ..['e'] = now + maxQrRequestLifetimeSeconds + 1;
      expect(
        () => signer.parseRequest(jsonEncode(distant)),
        throwsA(
          isA<QrSignException>().having(
            (e) => e.code,
            'code',
            QrSignErrorCode.invalidField,
          ),
        ),
      );
      expect(signer.parseRequest(jsonEncode(validEnvelope())).id, isNotNull);
    });

    test('拒绝空 payload', () {
      final json = validEnvelope();
      (json['b'] as Map<String, dynamic>)['d'] = '';
      expect(
        () => signer.parseRequest(jsonEncode(json)),
        throwsA(isA<QrSignException>()),
      );
    });

    test('构造请求拒绝非规范签名公钥文本', () {
      expect(
        () => SignRequestBody.fromHex(
          action: QrActions.login,
          signerPublicKeyHex: testSignerPublicKeyHex.toUpperCase(),
          payloadHex: '0x0102',
        ),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => SignRequestBody.fromHex(
          action: QrActions.login,
          signerPublicKeyHex: testSignerPublicKeyHex.substring(2),
          payloadHex: '0x0102',
        ),
        throwsA(isA<FormatException>()),
      );
    });
  });

  group('QrSigner.buildResponse', () {
    test('构建 compact sign_response envelope', () {
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      final request = QrEnvelope<SignRequestBody>(
        kind: QrKind.signRequest,
        id: 'resp-test-req-id-0001',
        expiresAt: now + 90,
        body: SignRequestBody.fromHex(
          action: QrActions.login,
          signerPublicKeyHex: testSignerPublicKeyHex,
          payloadHex: '0x01020304',
        ),
      );

      final response = signer.buildResponse(
        request: request,
        signatureHex: '0x${'aa' * 64}',
      );

      expect(response.kind, QrKind.signResponse);
      expect(response.id, request.id);
      expect(response.body.signerPublicKeyHex, testSignerPublicKeyHex);
      expect(response.body.signatureHex, '0x${'aa' * 64}');

      final json = jsonDecode(response.toRawJson()) as Map<String, dynamic>;
      expect(json['p'], QrProtocols.qrV1);
      expect(json['k'], QrKind.signResponse.code);
      expect(json['b']['u'], isA<String>());
      expect(json['b']['s'], isA<String>());
      expect(json['b'].containsKey('payload_hash'), isFalse);
    });
  });

  group('登录请求目标钱包', () {
    test('只允许 b.u 指定的同一钱包', () {
      final request = QrEnvelope<SignRequestBody>(
        kind: QrKind.signRequest,
        id: 'targeted-login-request',
        expiresAt: DateTime.now().millisecondsSinceEpoch ~/ 1000 + 90,
        body: SignRequestBody.fromHex(
          action: QrActions.login,
          signerPublicKeyHex: testSignerPublicKeyHex,
          payloadHex: '0x6f6e6368696e61',
        ),
      );

      expect(
        loginRequestTargetsAccountId(request, testSignerPublicKeyHex),
        isTrue,
      );
      expect(loginRequestTargetsAccountId(request, '0x${'22' * 32}'), isFalse);
      expect(
        loginRequestTargetsAccountId(
          request,
          testSignerPublicKeyHex.toUpperCase(),
        ),
        isFalse,
      );
      expect(
        loginRequestTargetsAccountId(
          request,
          testSignerPublicKeyHex.substring(2),
        ),
        isFalse,
      );
    });
  });

  group('QrSigner.computePayloadHash', () {
    test('相同输入产生相同哈希', () {
      final h1 = QrSigner.computePayloadHash('0x01020304');
      final h2 = QrSigner.computePayloadHash('0x01020304');
      expect(h1, h2);
    });

    test('不同输入产生不同哈希', () {
      final h1 = QrSigner.computePayloadHash('0x01020304');
      final h2 = QrSigner.computePayloadHash('0x05060708');
      expect(h1, isNot(h2));
    });

    test('哈希长度为 0x + 64 字符 hex', () {
      final h = QrSigner.computePayloadHash('0x0102');
      expect(h.startsWith('0x'), isTrue);
      expect(h.length, 66);
    });

    test('拒绝非规范 payload hex', () {
      expect(
        () => QrSigner.computePayloadHash('0102'),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => QrSigner.computePayloadHash('0X0102'),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => QrSigner.computePayloadHash('0xAA'),
        throwsA(isA<FormatException>()),
      );
    });
  });

  group('QrSigner.signingBytesFor', () {
    test('节点部署使用独立链下签名域，不与生产发布互认', () {
      // 共享协议格式2公开金标，与Rust及Swift使用相同目标、包和挑战。
      final payload = <int>[
        2,
        ...'citizenchain'.codeUnits,
        1,
        7,
        ...'node-01'.codeUnits,
        10,
        ...'192.0.2.10'.codeUnits,
        5,
        ...'arm64'.codeUnits,
        5,
        ...'1.0.0'.codeUnits,
        ...List<int>.filled(32, 0x22),
        ...'123456789'.codeUnits,
        ..._u64Le(1800000000),
        ...List<int>.filled(32, 0x33),
      ];
      final node = SignRequestBody.fromHex(
        action: QrActions.nodeDeploy,
        signerPublicKeyHex: testSignerPublicKeyHex,
        payloadHex: '0x${_hexBytes(payload)}',
      );
      final publish = SignRequestBody.fromHex(
        action: QrActions.publish,
        signerPublicKeyHex: testSignerPublicKeyHex,
        payloadHex: '0x${_hexBytes(payload)}',
      );
      final citizenserve = SignRequestBody.fromHex(
        action: QrActions.citizenserveCloudflarePublish,
        signerPublicKeyHex: testSignerPublicKeyHex,
        payloadHex: '0x${_hexBytes(payload)}',
      );
      expect(
        _hexBytes(QrSigner.signingBytesFor(node)),
        'cfe59b95d1bf3f53eedd4afc1a89ec408d52bed8c110e4e5c0489bfa639989c1',
      );
      expect(
        QrSigner.signingBytesFor(node).toList(),
        isNot(QrSigner.signingBytesFor(publish).toList()),
      );
      expect(
        QrSigner.signingBytesFor(citizenserve).toList(),
        QrSigner.signingBytesFor(publish).toList(),
      );
    });
    test('公民签名确认使用 GMB OP_SIGN_CITIZEN_IDENTITY 哈希域', () {
      final body = SignRequestBody.fromHex(
        action: QrActions.citizenIdentity,
        signerPublicKeyHex: testSignerPublicKeyHex,
        payloadHex: '0x01020304',
      );
      final input = Uint8List.fromList([0x47, 0x4d, 0x42, 0x10, 1, 2, 3, 4]);
      final digest = Blake2bDigest(digestSize: 32)
        ..update(input, 0, input.length);
      final expected = Uint8List(32);
      digest.doFinal(expected, 0);

      final actual = QrSigner.signingBytesFor(body);

      expect(actual.toList(), expected.toList());
      expect(actual.toList(), isNot(body.payloadBytes.toList()));
    });

    test('注册局首次绑定按精确 CidOccupyAuthorization 槽位签名', () {
      const cid = 'CN220-CTZN2-198805200-2026';
      const expiresAt = 1800000000;
      final template = _occupyAuthorizationTemplate(cid, expiresAt);
      final account = List<int>.filled(32, 0xab);
      final body = SignRequestBody.fromHex(
        action: QrActions.citizenOccupy,
        signerPublicKeyHex: testSignerPublicKeyHex, // 占号下 b.u 被忽略
        payloadHex: '0x${_hexBytes(template)}',
      );
      final exactAuthorization = List<int>.from(template)
        ..setRange(32 + 1 + cid.length, 32 + 1 + cid.length + 32, account);
      final input = Uint8List.fromList([
        0x47,
        0x4d,
        0x42,
        0x12,
        ...exactAuthorization,
      ]);
      final digest = Blake2bDigest(digestSize: 32)
        ..update(input, 0, input.length);
      final expected = Uint8List(32);
      digest.doFinal(expected, 0);

      final actual = QrSigner.signingBytesFor(
        body,
        selfAccountId: Uint8List.fromList(account),
      );
      expect(actual.toList(), expected.toList());
    });

    test('注册局换绑域签名用 OP_SIGN_CID_ADMIN_REBIND(0x1F)', () {
      const cid = 'CN220-CTZN2-198805200-2026';
      const expiresAt = 1800000000;
      final template = _rebindAuthorizationTemplate(cid, expiresAt);
      final account = List<int>.filled(32, 0xcd);
      final body = SignRequestBody.fromHex(
        action: QrActions.citizenRebind,
        signerPublicKeyHex: testSignerPublicKeyHex,
        payloadHex: '0x${_hexBytes(template)}',
      );
      const accountOffset = 32 + 1 + cid.length + 32;
      final exactAuthorization = List<int>.from(template)
        ..setRange(accountOffset, accountOffset + 32, account);
      final input = Uint8List.fromList([
        0x47,
        0x4d,
        0x42,
        0x1f,
        ...exactAuthorization,
      ]);
      final digest = Blake2bDigest(digestSize: 32)
        ..update(input, 0, input.length);
      final expected = Uint8List(32);
      digest.doFinal(expected, 0);

      expect(
        QrSigner.signingBytesFor(
          body,
          selfAccountId: Uint8List.fromList(account),
        ).toList(),
        expected.toList(),
      );
    });

    test('占号缺少本账户时返回空(不盲签)', () {
      const cid = 'CN220-CTZN2-198805200-2026';
      final template = _occupyAuthorizationTemplate(cid, 1800000000);
      final body = SignRequestBody.fromHex(
        action: QrActions.citizenOccupy,
        signerPublicKeyHex: testSignerPublicKeyHex,
        payloadHex: '0x${_hexBytes(template)}',
      );
      expect(QrSigner.signingBytesFor(body).isEmpty, isTrue);
    });

    test('域签名拒绝非零占位、旧尾拼接与换绑到当前账户', () {
      const cid = 'CN220-CTZN2-198805200-2026';
      final malformedOccupy = _occupyAuthorizationTemplate(cid, 1800000000);
      malformedOccupy[32 + 1 + cid.length] = 1;
      final occupyBody = SignRequestBody.fromHex(
        action: QrActions.citizenOccupy,
        signerPublicKeyHex: testSignerPublicKeyHex,
        payloadHex: '0x${_hexBytes(malformedOccupy)}',
      );
      expect(
        QrSigner.signingBytesFor(
          occupyBody,
          selfAccountId: Uint8List.fromList(List<int>.filled(32, 0xab)),
        ),
        isEmpty,
      );

      final legacyBody = SignRequestBody.fromHex(
        action: QrActions.citizenOccupy,
        signerPublicKeyHex: testSignerPublicKeyHex,
        payloadHex: '0x${_hexBytes([cid.length << 2, ...cid.codeUnits])}',
      );
      expect(
        QrSigner.signingBytesFor(
          legacyBody,
          selfAccountId: Uint8List.fromList(List<int>.filled(32, 0xab)),
        ),
        isEmpty,
      );

      final rebindBody = SignRequestBody.fromHex(
        action: QrActions.citizenRebind,
        signerPublicKeyHex: testSignerPublicKeyHex,
        payloadHex:
            '0x${_hexBytes(_rebindAuthorizationTemplate(cid, 1800000000))}',
      );
      expect(
        QrSigner.signingBytesFor(
          rebindBody,
          selfAccountId: Uint8List.fromList(List<int>.filled(32, 0x55)),
        ),
        isEmpty,
      );
    });
  });

  test('普通链交易无论长度都保留完整审阅材料，摘要由账户签名端统一处理', () {
    for (final length in [255, 256, 257, 400]) {
      final bytes = Uint8List.fromList(List<int>.filled(length, 0x55));
      final body = SignRequestBody.fromHex(
          action: 0x0400,
          signerPublicKeyHex: '0x${'07' * 32}',
          payloadHex: '0x${_hexBytes(bytes)}');
      expect(QrSigner.signingBytesFor(body), bytes);
    }
  });

  group('QrSigner.verifySr25519Signature', () {
    test('有效签名验证通过', () {
      final pair = Keyring.sr25519.fromSeed(Uint8List(32));
      final message = Uint8List.fromList([1, 2, 3, 4]);
      final signature = pair.sign(message);
      final signerPublicKey =
          '0x${pair.bytes().map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';
      final sigHex =
          '0x${signature.map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';

      expect(
        QrSigner.verifySr25519Signature(
          signerPublicKeyHex: signerPublicKey,
          signatureHex: sigHex,
          message: message,
        ),
        isTrue,
      );
    });

    test('无效签名验证失败', () {
      expect(
        QrSigner.verifySr25519Signature(
          signerPublicKeyHex: '0x${'00' * 32}',
          signatureHex: '0x${'ff' * 64}',
          message: Uint8List.fromList([1, 2, 3, 4]),
        ),
        isFalse,
      );
    });
  });

  _onchinaConfirmSigningDomain();
}

/// 链上中国治理动作签名域(op_tag 0x20)与链端金标逐字节对拍。
///
/// 该域此前对**裸 JSON 文本直签**(无 GMB 前缀、无 op_tag、不进 SIGN_OP_TAGS),
/// 2026-08-06 审计后收敛到统一哈希域。金标真源:
/// `citizenchain/runtime/primitives/tests/fixtures/signing_domain_vectors.json`
void _onchinaConfirmSigningDomain() {
  test('onchina 治理动作签 signing_message(0x20),与链端金标逐字节相同', () {
    // 金标向量:op_tag=0x20, scale_payload=0102030405060708
    final payload = Uint8List.fromList([1, 2, 3, 4, 5, 6, 7, 8]);
    final body = SignRequestBody(
      action: QrActions.onchinaConfirm,
      alg: 1,
      signerPublicKey: base64Url.encode(Uint8List(32)).replaceAll('=', ''),
      payload: base64Url.encode(payload).replaceAll('=', ''),
    );

    final bytes = QrSigner.signingBytesFor(body);
    final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();

    expect(
      hex,
      '466ec54a3b9e92db537733a0ee4c386c8968d8b4d54ac7ae2b18bdb192028c6b',
      reason: '与 signing_domain_vectors.json 的 0x20 向量不一致 = 冷端与链端签名域漂移',
    );
  });
}

// 用链端黄金向量核对公民各业务操作的签名域摘要。

// 冷钱包哈希域金标锁(citizenwallet ⇔ citizenchain)。
//
// 本测试读取本仓镜像；镜像更新必须与公民链公开真源一致。
//
// 为什么必须有这个文件:qr_signer_test.dart 里三处签名域断言都是**自证**——
// 测试自己用 Blake2bDigest 算一遍当 expected,再与实现比。那只证明了「实现调用了
// pointycastle」,没证明「结果与链端一致」。若 pointycastle 的 Blake2b 与 Rust 的
// blake2_256 在任何参数上有差异,或两处同时用错,测试照样全绿,而冷钱包是**真正
// 拿私钥出签的那一端**,签出链端不认的签名要到线上才暴露。
//
// 本文件的期望值一律来自真源(Rust 生成),自证由此变他证。
//
// 真源:citizenchain/runtime/primitives/tests/fixtures/signing_domain_vectors.json
// 规范实现:citizenchain/runtime/primitives/src/sign.rs::signing_message
// 契约:被签消息 = blake2_256( GMB(3B) || op_tag(1B) || payload )

const String _vectorsPath = 'test/signing/domain.json';

/// 测试签名公钥占位:哈希域摘要不含 b.u,取值不影响被签字节。
const String _testSignerPublicKeyHex =
    '0x8eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48';

Uint8List _hexToBytes(String hex) {
  final clean = hex.toLowerCase().replaceFirst('0x', '');
  final out = Uint8List(clean.length ~/ 2);
  for (var i = 0; i < out.length; i += 1) {
    out[i] = int.parse(clean.substring(i * 2, i * 2 + 2), radix: 16);
  }
  return out;
}

String _bytesToHex(List<int> bytes) =>
    bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();

/// 与 `QrSigner._gmbSigningMessage` 同构的独立实现。
///
/// 此处**只做摘要**,期望值来自真源而非本函数,故不构成自证:本函数算错,
/// 与真源比对立即失败。
Uint8List _blake2Digest(List<int> input) {
  final digest = Blake2bDigest(digestSize: 32)
    ..update(Uint8List.fromList(input), 0, input.length);
  final out = Uint8List(32);
  digest.doFinal(out, 0);
  return out;
}

void _registerDomain() {
  final file = File(_vectorsPath);
  final canonical = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  final domain = canonical['domain'] as String;
  final vectors = (canonical['vectors'] as List).cast<Map<String, dynamic>>();
  final gmbPrefix = utf8.encode(domain);

  group('哈希域摘要原语与已验真链端镜像一致', () {
    test('真源可读、域为 GMB 且向量非空', () {
      // 读成空数组时下面的循环一条用例都不生成而整体显示通过,这条挡住金标静默失效。
      expect(
        file.existsSync(),
        isTrue,
        reason: '真源不可达,cwd=${Directory.current.path}',
      );
      expect(domain, 'GMB');
      expect(vectors, isNotEmpty);
    });

    // 覆盖真源全部 op_tag。冷钱包只签其中三个域,但摘要原语是共用的:
    // 一旦 pointycastle 与 Rust 的 blake2_256 有任何差异,这里会全线飘红。
    for (final vector in vectors) {
      final name = vector['name'] as String;
      final opTag = int.parse(vector['op_tag'] as String);
      final payload = _hexToBytes(vector['scale_payload_hex'] as String);
      final expected = (vector['message_hex'] as String).toLowerCase();

      test('$name (op_tag ${vector['op_tag']}) 摘要与链端逐字节一致', () {
        final actual = _blake2Digest([...gmbPrefix, opTag, ...payload]);
        expect(_bytesToHex(actual), expected);
      });
    }
  });

  group('冷钱包公开出签路径与链端一致', () {
    // 摘要原语对了,不代表 QrSigner 拼装对。这里走真实出签入口 signingBytesFor,
    // 端到端验证「冷钱包实际签的字节」== 链端金标。
    //
    // 可直接覆盖 OP_SIGN_CITIZEN_IDENTITY 与默认账户切换；另两个域
    // (cid_occupy / cid_admin_rebind)
    // 要求 payload 是结构化的 Authorization 模板并原位替换账户槽,真源向量的
    // 任意字节 payload 套不进该结构。这两个域的槽位与 op_tag 组装由
    // qr_signer_test.dart 覆盖,其摘要正确性已由上一组独立锁住。
    Map<String, dynamic>? vectorNamed(String name) {
      for (final vector in vectors) {
        if (vector['name'] == name) return vector;
      }
      return null;
    }

    test('OP_SIGN_CITIZEN_IDENTITY 走 signingBytesFor 产出链端金标摘要', () {
      final vector = vectorNamed('OP_SIGN_CITIZEN_IDENTITY');
      expect(vector, isNotNull, reason: '真源缺少 OP_SIGN_CITIZEN_IDENTITY 向量');

      final body = SignRequestBody.fromHex(
        action: QrActions.citizenIdentity,
        signerPublicKeyHex: _testSignerPublicKeyHex,
        payloadHex: '0x${vector!['scale_payload_hex']}',
      );

      final actual = QrSigner.signingBytesFor(body);

      expect(
        _bytesToHex(actual),
        (vector['message_hex'] as String).toLowerCase(),
      );
      // 顺带钉死「签的是摘要不是原文」——回归成透传即被抓住。
      expect(actual.toList(), isNot(body.payloadBytes.toList()));
    });

    test('OP_SIGN_SWITCH_DEFAULT_ACCOUNT 走 signingBytesFor 产出链端金标摘要', () {
      final vector = vectorNamed('OP_SIGN_SWITCH_DEFAULT_ACCOUNT');
      expect(
        vector,
        isNotNull,
        reason: '真源缺少 OP_SIGN_SWITCH_DEFAULT_ACCOUNT 向量',
      );
      final body = SignRequestBody.fromHex(
        action: QrActions.switchDefaultAccount,
        signerPublicKeyHex: _testSignerPublicKeyHex,
        payloadHex: '0x${vector!['scale_payload_hex']}',
      );

      final actual = QrSigner.signingBytesFor(body);

      expect(
        _bytesToHex(actual),
        (vector['message_hex'] as String).toLowerCase(),
      );
    });

    test('OP_SIGN_SQUARE_ACTION 走 signingBytesFor 产出链端金标摘要', () {
      final vector = vectorNamed('OP_SIGN_SQUARE_ACTION');
      expect(vector, isNotNull, reason: '真源缺少 OP_SIGN_SQUARE_ACTION 向量');
      final body = SignRequestBody.fromHex(
        action: QrActions.squareAccountAction,
        signerPublicKeyHex: _testSignerPublicKeyHex,
        payloadHex: '0x${vector!['scale_payload_hex']}',
      );

      final actual = QrSigner.signingBytesFor(body);

      expect(
        _bytesToHex(actual),
        (vector['message_hex'] as String).toLowerCase(),
      );
    });

    test('OP_SIGN_MLS_DEVICE_BIND保留0x1C并与链端金标一致', () {
      final vector = vectorNamed('OP_SIGN_MLS_DEVICE_BIND')!;
      final body = SignRequestBody.fromHex(
        action: QrActions.mlsDeviceBind,
        signerPublicKeyHex: _testSignerPublicKeyHex,
        payloadHex: '0x${vector['scale_payload_hex']}',
      );
      expect(
        _bytesToHex(QrSigner.signingBytesFor(body)),
        vector['message_hex'],
      );
      expect(vector['op_tag'], '0x1c');
    });

    test('OP_SIGN_PUBLISH 走 signingBytesFor 产出链端金标摘要', () {
      final vector = vectorNamed('OP_SIGN_PUBLISH');
      expect(vector, isNotNull, reason: '真源缺少 OP_SIGN_PUBLISH 向量');
      final body = SignRequestBody.fromHex(
        action: QrActions.publish,
        signerPublicKeyHex: _testSignerPublicKeyHex,
        payloadHex: '0x${vector!['scale_payload_hex']}',
      );
      expect(
        _bytesToHex(QrSigner.signingBytesFor(body)),
        (vector['message_hex'] as String).toLowerCase(),
      );
    });

    test('冷钱包哈希域的 op_tag 均在真源登记', () {
      // 冷钱包私有常量 _opSignCitizenIdentity/_opSignCidOccupy/_opSignCidAdminRebind
      // 测试访问不到,改为断言真源侧登记值,任一端重排域编号都会在此暴露。
      expect(vectorNamed('OP_SIGN_CITIZEN_IDENTITY')?['op_tag'], '0x10');
      expect(vectorNamed('cid_occupy')?['op_tag'], '0x12');
      expect(vectorNamed('cid_admin_rebind')?['op_tag'], '0x1f');
      expect(vectorNamed('OP_SIGN_SWITCH_DEFAULT_ACCOUNT')?['op_tag'], '0x21');
      expect(vectorNamed('OP_SIGN_SQUARE_ACTION')?['op_tag'], '0x1d');
      expect(vectorNamed('OP_SIGN_MLS_DEVICE_BIND')?['op_tag'], '0x1c');
      expect(vectorNamed('OP_SIGN_PUBLISH')?['op_tag'], '0x24');
      expect(vectorNamed('OP_SIGN_INSTITUTION_WALLET')?['op_tag'], '0x25');
    });
  });
}
