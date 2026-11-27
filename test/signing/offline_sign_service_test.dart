// 验证离线请求完整审阅、真实验签、账户绑定及过期和重放拒绝。

import 'dart:typed_data';
import 'dart:convert';
import 'dart:io';

import 'payload_decoder_test.dart'
    show topupText, cidRebindPayload, selfRebindCall;

import 'package:flutter_test/flutter_test.dart';
import 'package:citizenwallet/wallet/wallet_mini_secret.dart';
import 'package:citizenwallet/signing/chain_constants.dart';
import 'package:citizenwallet/wallet/native_sr25519.dart';
import 'package:citizenwallet/wallet/native_mldsa.dart';
import 'package:polkadart_keyring/polkadart_keyring.dart';
import 'package:citizenwallet/signing/offline_sign_service.dart';
import 'package:citizenwallet/signing/payload_decoder.dart';
import 'package:citizenwallet/protocol/qr_protocols.dart';
import 'package:citizenwallet/protocol/envelope.dart';
import 'package:citizenwallet/protocol/bodies/sign_request_body.dart';
import 'package:citizenwallet/signing/qr_signer.dart';
import 'package:citizenwallet/storage/wallet_isar.dart';
import 'package:citizenwallet/wallet/wallet_manager.dart';

/// 构造解码测试样本；正常版本统一引用钱包的唯一声明。
/// 链上载荷必须携带完整签名上下文，裸 call_data 拒签。
String signingPayloadHex(
  String callDataHex, {
  String genesisHash = ChainConstants.genesisHash,
  int specVersion = 1,
  int transactionVersion = ChainConstants.transactionVersion,
}) {
  final genesis = _hexToBytes(genesisHash);
  final tail = <int>[
    0x00, // era: immortal
    0x04, // Compact(nonce=1)
    0x00, // Compact(tip=0)
    0x00, // CheckMetadataHash mode=Disabled
    ..._u32Le(specVersion),
    ..._u32Le(transactionVersion),
    ...genesis,
    ...genesis, // immortal: birth hash = genesis hash
    0x00, // CheckMetadataHash Option::None
  ];
  return '0x${_toHex([..._hexToBytes(callDataHex), ...tail])}';
}

SignRequestEnvelope _buildTestRequest({
  required String requestId,
  required String signerPublicKey,
  required String payloadHex,
  required int action,
  int? expiresAt,
}) {
  final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
  return QrEnvelope<SignRequestBody>(
    kind: QrKind.signRequest,
    id: requestId,
    expiresAt: expiresAt ?? now + maxQrRequestLifetimeSeconds,
    body: SignRequestBody.fromHex(
      action: action,
      signerPublicKeyHex: signerPublicKey,
      payloadHex: payloadHex,
    ),
  );
}

List<int> _u64Le(int value) =>
    List<int>.generate(8, (index) => (value >> (index * 8)) & 0xff);

List<int> _u32Le(int value) =>
    List<int>.generate(4, (index) => (value >> (index * 8)) & 0xff);

List<int> _compactU32(int value) {
  if (value < 64) return <int>[value << 2];
  final encoded = (value << 2) | 1;
  return <int>[encoded & 0xff, (encoded >> 8) & 0xff];
}

List<int> _scaleString(String value) {
  final bytes = value.codeUnits;
  return <int>[..._compactU32(bytes.length), ...bytes];
}

List<int> _mlsDeviceBindPayload({
  required String cidNumber,
  required String accountId,
  required int issuedAtMillis,
}) =>
    <int>[
      ..._scaleString(cidNumber),
      ..._u64Le(4),
      ..._scaleString(accountId),
      ..._scaleString('0x${'ab' * 32}'),
      ..._u64Le(issuedAtMillis),
    ];

List<int> _squareAccountActionPayload({
  required String accountId,
  required int expiresAt,
  String action = 'cancel_membership',
}) =>
    <int>[
      ..._scaleString(action),
      ..._scaleString(accountId),
      ..._scaleString('sqa_test'),
      ..._u64Le(expiresAt * 1000),
    ];

List<int> _occupyAuthorizationTemplate(String cid, int expiresAt) => [
      ..._hexToBytes(ChainConstants.genesisHash),
      cid.length << 2,
      ...cid.codeUnits,
      ...List<int>.filled(32, 0),
      ..._u64Le(0),
      ..._u64Le(expiresAt),
    ];

List<int> _rebindAuthorizationTemplate(String cid, int expiresAt) => [
      ..._hexToBytes(ChainConstants.genesisHash),
      cid.length << 2,
      ...cid.codeUnits,
      ...List<int>.filled(32, 0x55),
      ...List<int>.filled(32, 0),
      ..._u64Le(7),
      ..._u64Le(expiresAt),
    ];

List<int> _switchDefaultAccountPayload({
  required String currentDefaultAccountId,
  required int expiresAt,
}) =>
    [
      ..._hexToBytes(ChainConstants.genesisHash),
      ..._hexToBytes(currentDefaultAccountId),
      2 << 2,
      ...List<int>.filled(32, 0x55),
      ..._hexToBytes(currentDefaultAccountId),
      ..._u64Le(expiresAt),
      ...List<int>.filled(16, 0x66),
    ];

/// 中文注释：公民服务端独立动作在产物摘要后追加最终配置摘要；
/// 其它产品仍使用原 SCALE 发布布局和相同发布签名域。
List<int> _publishAuthorizationPayload({
  required String product,
  required String platform,
  required int expiresAt,
}) =>
    <int>[
      ..._scaleString(product),
      ..._scaleString(platform),
      ..._scaleString('1.2.3'),
      ...List<int>.generate(20, (index) => index + 1),
      ...List<int>.generate(32, (index) => index + 21),
      if (product == 'citizenserve') ...List<int>.filled(32, 0x44),
      ..._scaleString('deployment-stable-1'),
      ..._u64Le(expiresAt),
      ...List<int>.filled(32, 0x66),
    ];

// 与共享协议及控制台使用同一公开样例；仅替换本轮期限，不要求Tag或源码提交。
List<int> _nodeDeployPayload(int expiresAt) => <int>[
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
      ..._u64Le(expiresAt),
      ...List<int>.filled(32, 0x33),
    ];

void main() {
  test('联系人整批删除完整审阅，签名字节与App一致', () {
    final account = '0x${'04' * 32}';
    final intent = <String, dynamic>{
      'scope': 'citizenapp.contacts.delete.v1',
      'cid_number': 'CN-owner',
      'account_id': account,
      'bind_rev': 1,
      'batch_id': 'aa' * 16,
      'contacts': [
        {'cid_number': 'CN-a', 'change_version': 1},
        {'cid_number': 'CN-b', 'change_version': 2}
      ]
    };
    final bytes = utf8.encode(jsonEncode(intent));
    final hex =
        '0x${bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';
    final request = _buildTestRequest(
        requestId: QrSigner.generateRequestId(),
        signerPublicKey: account,
        payloadHex: hex,
        action: QrActions.contactsDelete);
    expect(OfflineSignService().verifyPayload(request).canSign, isTrue);
    expect(QrSigner.signingBytesFor(request.body), bytes);
    final wrong = _buildTestRequest(
        requestId: QrSigner.generateRequestId(),
        signerPublicKey: '0x${'05' * 32}',
        payloadHex: hex,
        action: QrActions.contactsDelete);
    expect(OfflineSignService().verifyPayload(wrong).canSign, isFalse);
  });

  test('充值签名指定账户须与原文目标相同，未知动作不能冒用', () {
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final service = OfflineSignService();
    for (final account in ['0x${'04' * 32}', '0x${'05' * 32}']) {
      final body = SignRequestBody.fromHex(
        action: QrActions.topup,
        signerPublicKeyHex: account,
        payloadHex:
            '0x${utf8.encode(topupText()).map((b) => b.toRadixString(16).padLeft(2, '0')).join()}',
      );
      final request = QrEnvelope<SignRequestBody>(
        kind: QrKind.signRequest,
        id: QrSigner.generateRequestId(),
        expiresAt: now + 120,
        body: body,
      );
      expect(
        service.verifyPayload(request).canSign,
        account == '0x${'04' * 32}',
      );
    }
  });

  group('OfflineSignService', () {
    late _FakeWalletManager walletManager;
    late OfflineSignService service;
    late Account signingAccount;

    setUp(() async {
      await WalletIsar.instance.resetForTest();
      walletManager = _FakeWalletManager();
      service = OfflineSignService(walletManager: walletManager);
      signingAccount = await walletManager.ensureAccount();
    });

    tearDown(() => WalletIsar.instance.resetForTest());

    test('官方Utility27完整审阅与真实签名绑定全部子项，模式篡改拒签', () async {
      final fixture=jsonDecode(File('test/signing/fixtures/call_data.json').readAsStringSync()) as Map<String,dynamic>;
      for(final name in ['batch','batch_all','force_batch']) {
        final entry=(fixture['cases'] as List).singleWhere((v)=>v['name']==name) as Map<String,dynamic>;
        final payload=signingPayloadHex(entry['expected_call_data_hex'] as String,specVersion:9);
        final request=_buildTestRequest(requestId:'utility-$name',signerPublicKey:signingAccount.accountId,payloadHex:payload,action:QrActions.fromDecodedAction(name));
        final verification=service.verifyPayload(request);
        expect(verification.status,SignDecisionStatus.normal);
        expect(verification.decoded!.reviewFields['account_id'],signingAccount.accountId);
        expect(verification.decoded!.reviewFields['transfers'],contains('第8笔'));
        final response=await service.signParsedRequest(accountId:signingAccount.accountId,request:request);
        expect(_verifySr25519(signerPublicKeyHex:signingAccount.accountId,message:_messageForRequest(request),signatureHex:response.body.signatureHex),isTrue);
        final wrong=_buildTestRequest(requestId:'wrong-$name',signerPublicKey:signingAccount.accountId,payloadHex:payload,action:QrActions.fromDecodedAction(name=='batch_all'?'force_batch':'batch_all'));
        expect(service.verifyPayload(wrong).status,SignDecisionStatus.reject);
        final bare=_buildTestRequest(requestId:'bare-$name',signerPublicKey:signingAccount.accountId,payloadHex:entry['expected_call_data_hex'] as String,action:QrActions.fromDecodedAction(name));
        expect(service.verifyPayload(bare).status,SignDecisionStatus.reject);
      }
      expect(walletManager.signCallCount,3);
    });

    test('两阶段冷签完整审阅并真实验签，旧动作/错账户/过期/尾随与重放均拒绝', () async {
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      final targetSeed = Uint8List.fromList(List.filled(32, 3));
      final targetId = '0x${_toHex(NativeSr25519.publicKeyOf(targetSeed))}';
      final authorization = cidRebindPayload(
          currentAccountId: signingAccount.accountId, newAccountId: targetId);
      SignRequestEnvelope request(List<int> bytes,
              {int? action, String? signer, int? end}) =>
          _buildTestRequest(
            requestId: QrSigner.generateRequestId(),
            signerPublicKey: signer ?? signingAccount.accountId,
            payloadHex: '0x${_toHex(bytes)}',
            action: action ?? QrActions.cidRebind,
            expiresAt: end ?? now + 300,
          );
      final first = request(authorization);
      expect(service.verifyPayload(first).canSign, true);
      final originalDigest = QrSigner.signingBytesFor(first.body);
      for (final bad in [
        request(List.filled(32, 0xab), action: 17),
        request(originalDigest),
        request([...authorization, 0]),
        request(authorization, signer: targetId),
        request(authorization, end: now - 1),
        request([...authorization, ..._u64Le(now - 1)]),
        request(cidRebindPayload(
            currentAccountId: signingAccount.accountId,
            newAccountId: signingAccount.accountId)),
        request(cidRebindPayload(
            genesisHash: '0x${'22' * 32}',
            currentAccountId: signingAccount.accountId,
            newAccountId: targetId)),
      ]) {
        expect(service.verifyPayload(bad).canSign, false);
        await expectLater(
            service.signParsedRequest(
                accountId: signingAccount.accountId, request: bad),
            throwsA(isA<OfflineSignException>()));
      }
      expect(walletManager.signCallCount, 0);
      final firstResponse = await service.signParsedRequest(
          accountId: signingAccount.accountId, request: first);
      expect(
          _verifySr25519(
              signerPublicKeyHex: signingAccount.accountId,
              message: originalDigest,
              signatureHex: firstResponse.body.signatureHex),
          true);
      expect(first.body.payloadBytes, authorization);
      await expectLater(
          service.signParsedRequest(
              accountId: signingAccount.accountId, request: first),
          throwsA(isA<OfflineSignException>()));
      expect(walletManager.signCallCount, 1);

      final targetManager = _FakeWalletManager();
      targetManager._miniSecretHex = _toHex(targetSeed);
      targetManager._account = Account(
          masterId: targetId,
          accountIndex: 0,
          accountId: targetId,
          accountName: '目标账户');
      final secondService = OfflineSignService(walletManager: targetManager);
      final call = selfRebindCall(
          signature: _hexToBytes(firstResponse.body.signatureHex));
      final second = request(
          _hexToBytes(signingPayloadHex('0x${_toHex(call)}')),
          action: QrActions.selfRebindCidAccountId,
          signer: targetId);
      final decision = secondService.verifyPayload(second);
      expect(decision.canSign, true);
      expect(decision.decoded!.reviewFields['new_account_id'], targetId);
      expect(decision.decoded!.reviewFields['cid_number'],
          'CN951-CTZN1-539598435-2026');
      await expectLater(
          secondService.signParsedRequest(
              accountId: signingAccount.accountId, request: second),
          throwsA(isA<OfflineSignException>()));
      expect(targetManager.signCallCount, 0);
      final secondResponse = await secondService.signParsedRequest(
          accountId: targetId, request: second);
      expect(
          _verifySr25519(
              signerPublicKeyHex: targetId,
              message: _messageForRequest(second),
              signatureHex: secondResponse.body.signatureHex),
          true);
      expect(targetManager.signCallCount, 1);
      for (final bad in [
        request(call,
            action: QrActions.selfRebindCidAccountId, signer: targetId),
        request([...second.body.payloadBytes, 0],
            action: QrActions.selfRebindCidAccountId, signer: targetId)
      ]) {
        expect(secondService.verifyPayload(bad).canSign, false);
        await expectLater(
            secondService.signParsedRequest(accountId: targetId, request: bad),
            throwsA(isA<OfflineSignException>()));
      }
      expect(targetManager.signCallCount, 1);
    });

    test('充值冷签真实签完整13行原文，并拒绝重复签同一请求', () async {
      final text = topupText().replaceFirst(
        'account_id=0x${'04' * 32}',
        'account_id=${signingAccount.accountId}',
      );
      final raw = Uint8List.fromList(utf8.encode(text));
      final request = _buildTestRequest(
        requestId: QrSigner.generateRequestId(),
        signerPublicKey: signingAccount.accountId,
        payloadHex: '0x${_toHex(raw)}',
        action: QrActions.topup,
        expiresAt: DateTime.now().millisecondsSinceEpoch ~/ 1000 + 120,
      );
      expect(service.verifyPayload(request).canSign, true);
      final response = await service.signParsedRequest(
        accountId: signingAccount.accountId,
        request: request,
      );
      expect(walletManager.signCallCount, 1);
      expect(
        _verifySr25519(
          signerPublicKeyHex: response.body.signerPublicKeyHex,
          message: raw,
          signatureHex: response.body.signatureHex,
        ),
        true,
      );
      await expectLater(
        service.signParsedRequest(
          accountId: signingAccount.accountId,
          request: request,
        ),
        throwsA(isA<OfflineSignException>()),
      );
      expect(walletManager.signCallCount, 1);
    });
    test('首次绑定/换绑仅接受完整授权模板且展示防重放字段', () {
      final expiresAt = DateTime.now().millisecondsSinceEpoch ~/ 1000 + 90;
      const cid = 'CN220-CTZN2-198805200-2026';
      final occupyRequest = _buildTestRequest(
        requestId: 'offline-cid-occupy-template',
        signerPublicKey: '',
        payloadHex: '0x${_toHex(_occupyAuthorizationTemplate(cid, expiresAt))}',
        action: QrActions.citizenOccupy,
        expiresAt: expiresAt,
      );
      final occupy = service.verifyPayload(occupyRequest);
      expect(occupy.status, SignDecisionStatus.normal);
      expect(
        occupy.decoded?.fields['genesis_hash'],
        ChainConstants.genesisHash,
      );
      expect(occupy.decoded?.fields['expected_binding_revision'], '0');
      expect(occupy.decoded?.fields['expires_at'], expiresAt.toString());

      final rebindRequest = _buildTestRequest(
        requestId: 'offline-cid-rebind-template',
        signerPublicKey: '',
        payloadHex: '0x${_toHex(_rebindAuthorizationTemplate(cid, expiresAt))}',
        action: QrActions.citizenRebind,
        expiresAt: expiresAt,
      );
      final rebind = service.verifyPayload(rebindRequest);
      expect(rebind.status, SignDecisionStatus.normal);
      expect(rebind.decoded?.fields['current_account_id'], '0x${'55' * 32}');
      expect(rebind.decoded?.fields['expected_binding_revision'], '7');
    });

    test('域签名拒绝 envelope expiry 不一致和已废弃的 CID-only 载荷', () {
      final expiresAt = DateTime.now().millisecondsSinceEpoch ~/ 1000 + 90;
      const cid = 'CN220-CTZN2-198805200-2026';
      final mismatch = _buildTestRequest(
        requestId: 'offline-cid-expiry-mismatch',
        signerPublicKey: '',
        payloadHex: '0x${_toHex(_occupyAuthorizationTemplate(cid, expiresAt))}',
        action: QrActions.citizenOccupy,
        expiresAt: expiresAt + 1,
      );
      expect(service.verifyPayload(mismatch).status, SignDecisionStatus.reject);
      expect(service.verifyPayload(mismatch).rejectReason, contains('过期时间'));

      final legacy = _buildTestRequest(
        requestId: 'offline-cid-legacy-payload',
        signerPublicKey: '',
        payloadHex: '0x${_toHex([cid.length << 2, ...cid.codeUnits])}',
        action: QrActions.citizenOccupy,
        expiresAt: expiresAt,
      );
      expect(service.verifyPayload(legacy).status, SignDecisionStatus.reject);
    });

    test('默认账户切换只接受原默认冷账户和一致期限，并使用 0x21 出签', () async {
      final expiresAt = DateTime.now().millisecondsSinceEpoch ~/ 1000 + 90;
      final payload = _switchDefaultAccountPayload(
        currentDefaultAccountId: signingAccount.accountId,
        expiresAt: expiresAt,
      );
      final request = _buildTestRequest(
        requestId: 'offline-switch-default-account',
        signerPublicKey: signingAccount.accountId,
        payloadHex: '0x${_toHex(payload)}',
        action: QrActions.switchDefaultAccount,
        expiresAt: expiresAt,
      );

      final verification = service.verifyPayload(request);
      expect(verification.status, SignDecisionStatus.normal);
      expect(verification.actionLabel, '切换默认账户');
      expect(
        verification.decoded?.fields['current_default_account_id'],
        signingAccount.accountId,
      );

      final response = await service.signParsedRequest(
        accountId: signingAccount.accountId,
        request: request,
      );
      expect(
        _verifySr25519(
          signerPublicKeyHex: response.body.signerPublicKeyHex,
          message: _messageForRequest(request),
          signatureHex: response.body.signatureHex,
        ),
        isTrue,
      );

      final mismatchedExpiry = _buildTestRequest(
        requestId: 'offline-switch-default-expiry',
        signerPublicKey: signingAccount.accountId,
        payloadHex: '0x${_toHex(payload)}',
        action: QrActions.switchDefaultAccount,
        expiresAt: expiresAt + 1,
      );
      expect(
        service.verifyPayload(mismatchedExpiry).status,
        SignDecisionStatus.reject,
      );
    });

    test('发布授权严格绑定外层期限、使用 0x24 域且同一请求只能签一次', () async {
      final expiresAt = DateTime.now().millisecondsSinceEpoch ~/ 1000 + 90;
      final payload = _publishAuthorizationPayload(
        product: 'citizenserve',
        platform: 'cloudflare',
        expiresAt: expiresAt,
      );
      final request = _buildTestRequest(
        requestId: 'offline-publish-authorization',
        signerPublicKey: signingAccount.accountId,
        payloadHex: '0x${_toHex(payload)}',
        action: QrActions.citizenserveCloudflarePublish,
        expiresAt: expiresAt,
      );

      final verification = service.verifyPayload(request);
      expect(verification.status, SignDecisionStatus.normal);
      expect(verification.actionLabel, '公民服务端 Cloudflare 发布授权');
      expect(verification.decoded?.fields['config_sha256'], '0x${'44' * 32}');
      expect(verification.decoded?.fields['product_id'], 'citizenserve');
      expect(verification.decoded?.fields['platform'], 'cloudflare');
      expect(
        verification.decoded?.fields['previous_deployment_id'],
        'deployment-stable-1',
      );
      expect(verification.decoded?.summary, '授权发布 公民服务端 1.2.3 到 Cloudflare');

      final response = await service.signParsedRequest(
        accountId: signingAccount.accountId,
        request: request,
      );
      expect(
        _verifySr25519(
          signerPublicKeyHex: response.body.signerPublicKeyHex,
          message: _messageForRequest(request),
          signatureHex: response.body.signatureHex,
        ),
        isTrue,
      );
      await expectLater(
        service.signParsedRequest(
          accountId: signingAccount.accountId,
          request: request,
        ),
        throwsA(
          isA<OfflineSignException>().having(
            (error) => error.code,
            'code',
            OfflineSignErrorCode.replayed,
          ),
        ),
      );

      final mismatch = _buildTestRequest(
        requestId: 'offline-publish-expiry-mismatch',
        signerPublicKey: signingAccount.accountId,
        payloadHex: '0x${_toHex(payload)}',
        action: QrActions.citizenserveCloudflarePublish,
        expiresAt: expiresAt + 1,
      );
      expect(service.verifyPayload(mismatch).status, SignDecisionStatus.reject);
      expect(service.verifyPayload(mismatch).rejectReason, contains('过期时间'));
    });

    test('节点部署冷签展示准确目标、期限一致且一次请求只能签一次', () async {
      final expiresAt = DateTime.now().millisecondsSinceEpoch ~/ 1000 + 90;
      final payload = _nodeDeployPayload(expiresAt);
      final request = _buildTestRequest(
        requestId: 'offline-node-deploy-authorization',
        signerPublicKey: signingAccount.accountId,
        payloadHex: '0x${_toHex(payload)}',
        action: QrActions.nodeDeploy,
        expiresAt: expiresAt,
      );
      final verified = service.verifyPayload(request);
      expect(verified.status, SignDecisionStatus.normal);
      expect(verified.actionLabel, '节点部署批准');
      expect(verified.decoded?.fields['node_id'], 'node-01');
      expect(verified.decoded?.fields['server_ip'], '192.0.2.10');
      expect(verified.decoded?.fields['platform'], 'arm64');
      expect(verified.decoded?.fields['version'], '1.0.0');
      expect(verified.decoded?.fields.containsKey('source_sha'), isFalse);
      final response = await service.signParsedRequest(
        accountId: signingAccount.accountId,
        request: request,
      );
      expect(
        _verifySr25519(
          signerPublicKeyHex: response.body.signerPublicKeyHex,
          message: _messageForRequest(request),
          signatureHex: response.body.signatureHex,
        ),
        isTrue,
      );
      await expectLater(
        service.signParsedRequest(
          accountId: signingAccount.accountId,
          request: request,
        ),
        throwsA(
          isA<OfflineSignException>().having(
            (error) => error.code,
            'code',
            OfflineSignErrorCode.replayed,
          ),
        ),
      );
      final mismatch = _buildTestRequest(
        requestId: 'offline-node-deploy-expiry',
        signerPublicKey: signingAccount.accountId,
        payloadHex: '0x${_toHex(payload)}',
        action: QrActions.nodeDeploy,
        expiresAt: expiresAt + 1,
      );
      expect(service.verifyPayload(mismatch).status, SignDecisionStatus.reject);
    });

    test('MLS设备登记统一300秒，保留账户及精确过期校验', () async {
      const cid = 'CN220-CTZN2-198805200-2026';
      final issuedAtMillis = DateTime.now().millisecondsSinceEpoch;
      final payload = _mlsDeviceBindPayload(
        cidNumber: cid,
        accountId: signingAccount.accountId,
        issuedAtMillis: issuedAtMillis,
      );
      final request = _buildTestRequest(
        requestId: 'offline-mls-device-bind',
        signerPublicKey: signingAccount.accountId,
        payloadHex: '0x${_toHex(payload)}',
        action: QrActions.mlsDeviceBind,
        expiresAt: issuedAtMillis ~/ 1000 + 300,
      );

      final verification = service.verifyPayload(request);
      expect(verification.status, SignDecisionStatus.normal);
      expect(verification.actionLabel, 'MLS设备登记');
      expect(verification.decoded?.fields['cid_number'], cid);
      final response = await service.signParsedRequest(
        accountId: signingAccount.accountId,
        request: request,
      );
      expect(
        _verifySr25519(
          signerPublicKeyHex: response.body.signerPublicKeyHex,
          message: _messageForRequest(request),
          signatureHex: response.body.signatureHex,
        ),
        isTrue,
      );

      for (final seconds in [120, 299, 301]) {
        final mismatchedExpiry = _buildTestRequest(
          requestId: 'offline-mls-device-bind-expiry-$seconds',
          signerPublicKey: signingAccount.accountId,
          payloadHex: '0x${_toHex(payload)}',
          action: QrActions.mlsDeviceBind,
          expiresAt: issuedAtMillis ~/ 1000 + seconds,
        );
        expect(
          service.verifyPayload(mismatchedExpiry).status,
          SignDecisionStatus.reject,
          reason: '只接受300秒，拒绝$seconds秒',
        );
      }
      final wrongAccount = _buildTestRequest(
        requestId: 'offline-mls-device-bind-account',
        signerPublicKey: signingAccount.accountId,
        payloadHex: '0x${_toHex(_mlsDeviceBindPayload(
          cidNumber: cid,
          accountId: '0x${'11' * 32}',
          issuedAtMillis: issuedAtMillis,
        ))}',
        action: QrActions.mlsDeviceBind,
        expiresAt: issuedAtMillis ~/ 1000 + 300,
      );
      expect(service.verifyPayload(wrongAccount).status,
          SignDecisionStatus.reject);
    });

    test('首次绑定按所选账户签署精确授权并在响应带回 account_id', () async {
      final expiresAt = DateTime.now().millisecondsSinceEpoch ~/ 1000 + 90;
      const cid = 'CN220-CTZN2-198805200-2026';
      final request = _buildTestRequest(
        requestId: 'offline-cid-occupy-sign',
        signerPublicKey: '',
        payloadHex: '0x${_toHex(_occupyAuthorizationTemplate(cid, expiresAt))}',
        action: QrActions.citizenOccupy,
        expiresAt: expiresAt,
      );
      final response = await service.signParsedRequest(
        accountId: signingAccount.accountId,
        request: request,
      );
      expect(response.body.signerPublicKeyHex, signingAccount.accountId);
      final signingBytes = QrSigner.signingBytesFor(
        request.body,
        selfAccountId: Uint8List.fromList(
          _hexToBytes(signingAccount.accountId),
        ),
      );
      expect(
        _verifySr25519(
          signerPublicKeyHex: response.body.signerPublicKeyHex,
          message: signingBytes,
          signatureHex: response.body.signatureHex,
        ),
        isTrue,
      );
    });

    test('signParsedRequest should sign normal internal_vote (统一入口)', () async {
      // 所有管理员投票走 InternalVote(20).cast(0)
      // payload = [0x14][0x00][u128_le proposal_id=1][Personal=0][approve=1] + 扩展尾
      final payloadHex =
          signingPayloadHex('0x1400010000000000000000000000000000000001');
      final request = _buildTestRequest(
        requestId: 'offline-req-test-0001',
        signerPublicKey: signingAccount.accountId,
        payloadHex: payloadHex,
        action: QrActions.internalVote,
      );

      final response = await service.signParsedRequest(
        accountId: signingAccount.accountId,
        request: request,
      );

      expect(walletManager.signCallCount, 1);
      expect(response.id, request.id);
      expect(response.body.signerPublicKeyHex, signingAccount.accountId);
      expect(
        _verifySr25519(
          signerPublicKeyHex: response.body.signerPublicKeyHex,
          message: _messageForRequest(request),
          signatureHex: response.body.signatureHex,
        ),
        isTrue,
      );
    });

    test('非法表决bool即使携带合法签名尾也拒签且不调用签名器', () async {
      final id = List<int>.filled(16, 0)..[0] = 1;
      final cases = <(int, List<int>)>[
        (QrActions.internalVote, [20, 0, ...id, 0]),
        (
          QrActions.jointVote,
          [
            21,
            0,
            ...id,
            ..._scaleString('LN001-NRC0G-944805165-2026'),
            ..._scaleString('COMMITTEE_MEMBER')
          ]
        ),
        (QrActions.castReferendum, [21, 1, ...id]),
        (
          QrActions.castRepresentativeVote,
          [26, 1, ...id, ..._scaleString('HOUSE_MEMBER')]
        ),
        (QrActions.castLegislationReferendum, [26, 2, ...id]),
        (QrActions.executiveSign, [26, 3, ...id]),
        (QrActions.overrideSign, [26, 4, ...id]),
        (QrActions.guardVote, [26, 5, ...id]),
      ];
      for (var index = 0; index < cases.length; index++) {
        final (action, prefix) = cases[index];
        for (final value in [2, 255]) {
          final request = _buildTestRequest(
            requestId: 'invalid-vote-bool-$index-$value',
            signerPublicKey: signingAccount.accountId,
            payloadHex: signingPayloadHex('0x${_toHex([...prefix, value])}'),
            action: action,
          );
          expect(
              service.verifyPayload(request).status, SignDecisionStatus.reject);
          await expectLater(
            service.signParsedRequest(
                accountId: signingAccount.accountId, request: request),
            throwsA(isA<OfflineSignException>()),
          );
        }
      }
      expect(walletManager.signCallCount, 0);
    });

    test('同一请求 id 到期前只能签名一次', () async {
      final payloadHex =
          signingPayloadHex('0x1400010000000000000000000000000000000001');
      final request = _buildTestRequest(
        requestId: 'offline-replay-test-0001',
        signerPublicKey: signingAccount.accountId,
        payloadHex: payloadHex,
        action: QrActions.internalVote,
      );

      await service.signParsedRequest(
        accountId: signingAccount.accountId,
        request: request,
      );

      expect(
        () => service.signParsedRequest(
          accountId: signingAccount.accountId,
          request: request,
        ),
        throwsA(
          isA<OfflineSignException>().having(
            (e) => e.code,
            'code',
            OfflineSignErrorCode.replayed,
          ),
        ),
      );
      expect(walletManager.signCallCount, 1);
    });

    test('signParsedRequest 拒绝 action 与 payload 不一致', () async {
      // decode 成功但 QR action 和 decoded.action 不一致 → 红色拒签。
      final payloadHex =
          signingPayloadHex('0x1400070000000000000000000000000000000001');
      expect(PayloadDecoder.decode(payloadHex)?.action, 'internal_vote');
      final request = _buildTestRequest(
        requestId: 'offline-req-test-action-mismatch',
        signerPublicKey: signingAccount.accountId,
        payloadHex: payloadHex,
        action: QrActions.jointVote,
      );

      expect(
        () => service.signParsedRequest(
          accountId: signingAccount.accountId,
          request: request,
        ),
        throwsA(
          isA<OfflineSignException>().having(
            (e) => e.code,
            'code',
            OfflineSignErrorCode.contentMismatch,
          ),
        ),
      );
      expect(walletManager.signCallCount, 0);
    });

    test('verifyPayload decodes transfer payload', () {
      // OnchainTransaction::transfer_with_remark: pallet=4, call=0。
      // beneficiary 32B, amount u128_le, remark 空 Vec。
      final request = _buildTestRequest(
        requestId: 'offline-req-test-known',
        signerPublicKey: signingAccount.accountId,
        // call_data: [04][00][dest 32B][u128_le(1)][Vec(0)] → 0.01 GMB
        payloadHex: signingPayloadHex(
          '0x0400aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0100000000000000000000000000000000',
        ),
        action: QrActions.transferWithRemark,
      );

      final verification = service.verifyPayload(request);
      expect(verification.status, SignDecisionStatus.normal);
      expect(verification.canSign, isTrue);
      expect(verification.actionLabel, '转账');
      expect(verification.decoded, isNotNull);
      expect(verification.decoded!.action, 'transfer');
      expect(
        verification.decoded!.reviewFields['genesis_hash'],
        ChainConstants.genesisHash,
      );
      expect(verification.decoded!.reviewFields['spec_version'], '1');
      expect(
        verification.decoded!.reviewFields['transaction_version'],
        ChainConstants.transactionVersion.toString(),
      );
    });

    test('链交易仅接受当次交易版本，拒绝其它版本和未知版本，不锁 spec_version', () {
      const callData =
          '0x0400aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0100000000000000000000000000000000';

      SignDecisionStatus verify(String payloadHex) => service
          .verifyPayload(
            _buildTestRequest(
              requestId: 'offline-chain-context-${payloadHex.hashCode}',
              signerPublicKey: signingAccount.accountId,
              payloadHex: payloadHex,
              action: QrActions.transferWithRemark,
            ),
          )
          .status;

      expect(
        verify(signingPayloadHex(callData, transactionVersion: ChainConstants.transactionVersion)),
        SignDecisionStatus.normal,
      );
      expect(
        verify(signingPayloadHex(callData, genesisHash: '0x${'99' * 32}')),
        SignDecisionStatus.reject,
      );
      // 钱包以已部署链为准，候选版本不得在Runtime生效前取得签名资格。
      for (final version in [0, 5, 6, 8, 9, 0xffffffff]) {
        expect(
          verify(signingPayloadHex(callData, transactionVersion: version)),
          SignDecisionStatus.reject,
        );
      }
      expect(verify(callData), SignDecisionStatus.reject);

      final highSpec = service.verifyPayload(
        _buildTestRequest(
          requestId: 'offline-chain-high-spec',
          signerPublicKey: signingAccount.accountId,
          payloadHex: signingPayloadHex(
            callData,
            specVersion: 9876,
          ),
          action: QrActions.transferWithRemark,
        ),
      );
      expect(highSpec.status, SignDecisionStatus.normal);
      expect(highSpec.decoded?.reviewFields['spec_version'], '9876');
      expect(
        highSpec.decoded?.reviewFields['transaction_version'],
        ChainConstants.transactionVersion.toString(),
      );
      expect(walletManager.signCallCount, 0);
    });

    test('自助占号完整审阅CID和签名账户，仅接受当次交易版本', () {
      const cid = 'CN739-CTZN3-996321164-2026';
      final callData = '0x${_toHex([10, 5, cid.length << 2, ...cid.codeUnits])}';
      for (final version in [0, 6, ChainConstants.transactionVersion, 8, 9, 0xffffffff]) {
        final request = _buildTestRequest(
          requestId: 'offline-cid-version-$version',
          signerPublicKey: signingAccount.accountId,
          payloadHex: signingPayloadHex(
            callData,
            specVersion: 7,
            transactionVersion: version,
          ),
          action: QrActions.fromDecodedAction('self_occupy_cid'),
        );
        final verification = service.verifyPayload(request);
        expect(
          verification.status,
          version == ChainConstants.transactionVersion ? SignDecisionStatus.normal : SignDecisionStatus.reject,
        );
        if (version == ChainConstants.transactionVersion) {
          expect(verification.decoded!.reviewFields['cid_number'], cid);
          expect(
            verification.decoded!.reviewFields['account_id'],
            signingAccount.accountId,
          );
          expect(verification.decoded!.reviewFields['spec_version'], '7');
          expect(verification.decoded!.reviewFields['transaction_version'], ChainConstants.transactionVersion.toString());
        }
      }
      expect(walletManager.signCallCount, 0);
    });

    test('verifyPayload accepts exact SquarePost platform price action', () {
      const cid = 'GZ018-SFGYR-201206100-2026';
      final cidBytes = cid.codeUnits;
      const role = 'GENESIS_PRODUCT_MANAGER';
      final roleBytes = role.codeUnits;
      final price = List<int>.filled(16, 0)..[0] = 100;
      final payloadHex = signingPayloadHex(
        '0x${_toHex([
              34,
              5,
              cidBytes.length << 2,
              ...cidBytes,
              roleBytes.length << 2,
              ...roleBytes,
              2,
              ...price
            ])}',
      );
      final request = _buildTestRequest(
        requestId: 'offline-platform-price',
        signerPublicKey: signingAccount.accountId,
        payloadHex: payloadHex,
        action: QrActions.proposeSetPlatformPrice,
      );

      final verification = service.verifyPayload(request);
      expect(verification.status, SignDecisionStatus.normal);
      expect(verification.actionLabel, '发起平台会员调价提案');
      expect(verification.decoded!.fields['membership_level'], '薪火会员');
    });

    test('verifyPayload accepts exact SquarePost Cold subscription action', () {
      final price = List<int>.filled(16, 0)
        ..[0] = 0x7c
        ..[1] = 0x15
        ..[2] = 0x09;
      final request = _buildTestRequest(
        requestId: 'offline-square-subscribe',
        signerPublicKey: signingAccount.accountId,
        payloadHex: signingPayloadHex(
          '0x${_toHex([34, 1, 0, 0, 1, ...price])}',
        ),
        action: QrActions.subscribe,
      );

      final verification = service.verifyPayload(request);
      expect(verification.status, SignDecisionStatus.normal);
      expect(verification.actionLabel, '订阅会员');
      expect(verification.decoded?.fields['issuer'], '平台');
      expect(verification.decoded?.fields['membership_level'], '民主会员');
      expect(verification.decoded?.fields['expected_price_fen'], contains('分'));
    });

    test('verifyPayload rejects platform price payload with mismatched action',
        () {
      const cid = 'GZ018-SFGYR-201206100-2026';
      final cidBytes = cid.codeUnits;
      const role = 'GENESIS_PRODUCT_MANAGER';
      final roleBytes = role.codeUnits;
      final price = List<int>.filled(16, 0)..[0] = 100;
      final request = _buildTestRequest(
        requestId: 'offline-platform-price-mismatch',
        signerPublicKey: signingAccount.accountId,
        payloadHex: signingPayloadHex(
          '0x${_toHex([
                34,
                5,
                cidBytes.length << 2,
                ...cidBytes,
                roleBytes.length << 2,
                ...roleBytes,
                0,
                ...price
              ])}',
        ),
        action: QrActions.transferWithRemark,
      );

      final verification = service.verifyPayload(request);
      expect(verification.status, SignDecisionStatus.reject);
      expect(verification.rejectReason, contains('不匹配'));
    });

    test('verifyPayload 拒绝普通链交易 32 字节 hash-only payload', () {
      final request = _buildTestRequest(
        requestId: 'offline-req-test-hash-only-reject',
        signerPublicKey: signingAccount.accountId,
        payloadHex:
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        action: QrActions.privateInstitutionGovernance,
      );

      final verification = service.verifyPayload(request);

      expect(verification.status, SignDecisionStatus.reject);
      expect(verification.canSign, isFalse);
      expect(verification.actionLabel, '发起私权机构治理');
      expect(verification.rejectReason, contains('普通链交易不能只签 32 字节哈希'));
    });

    for (final variant in [0, 2]) {
      test('旧机构完整名册动作$variant不能解码或签名', () async {
        const cid = 'GZ018-SFGYR-201206100-2026';
        final call = <int>[
          31,
          8,
          ..._scaleString(cid),
          variant,
          4,
          ...List<int>.filled(32, 0x11),
          0,
          ..._scaleString('F'),
          ..._scaleString('G'),
          if (variant == 2) ...[
            4,
            1,
            ..._scaleString('R_GOV'),
            ..._scaleString('Renamed'),
            0,
            0
          ],
          ..._scaleString(cid),
          ..._scaleString('R_GOV'),
        ];
        final request = _buildTestRequest(
          requestId: 'retired-institution-action-$variant',
          signerPublicKey: signingAccount.accountId,
          payloadHex: signingPayloadHex('0x${_toHex(call)}'),
          action: QrActions.privateInstitutionGovernance,
        );
        final verified = service.verifyPayload(request);
        expect(verified.status, SignDecisionStatus.reject);
        expect(verified.decoded, isNull);
        expect(verified.canSign, isFalse);
        expect(verified.rejectReason, contains('无法解码'));
        await expectLater(
          service.signParsedRequest(
              accountId: signingAccount.accountId, request: request),
          throwsA(isA<OfflineSignException>().having((error) => error.code,
              'code', OfflineSignErrorCode.contentMismatch)),
        );
        expect(walletManager.signCallCount, 0);
      });
    }

    // 固定公开合成载荷，验证新动作可签及旧格式/伪装/错误链不能被放行。
    for (final kind in ['CTZN', 'NATP']) {
      test('verifyPayload 严格支持自助注册 $kind CID', () {
        final cid = 'CN202-$kind${kind == 'CTZN' ? 6 : 9}-123456789-1234';
        final call = <int>[10, 5, ..._scaleString(cid)];
        final request = _buildTestRequest(
          requestId: 'self-occupy-$kind',
          signerPublicKey: signingAccount.accountId,
          payloadHex: signingPayloadHex('0x${_toHex(call)}'),
          action: 0x0a05,
        );
        final verified = service.verifyPayload(request);
        expect(verified.canSign, isTrue);
        expect(verified.actionLabel, '自助注册CID');
        expect(verified.decoded?.fields['cid_number'], cid);
        expect(
          verified.decoded?.reviewFields['account_id'],
          signingAccount.accountId,
        );
      });
    }
    for (final variant in [
      'bare',
      'truncated',
      'extra',
      'old',
      'wrong_chain',
      'wrong_version',
      'wrong_action',
      'wrong_type',
      'noncanonical',
      'wrong_checksum',
    ]) {
      test('verifyPayload 自助注册拒绝 $variant 载荷', () {
        const cid = 'CN202-CTZN6-123456789-1234';
        var call = <int>[10, 5, ..._scaleString(cid)];
        if (variant == 'wrong_checksum') {
          call = [10, 5, ..._scaleString('CN202-CTZN7-123456789-1234')];
        }
        if (variant == 'extra') call.add(0);
        if (variant == 'old') {
          call.addAll([..._u64Le(1800000000), ...List.filled(64, 1)]);
        }
        if (variant == 'wrong_type') {
          call = [10, 5, ..._scaleString('CN202-SMTP6-123456789-1234')];
        }
        if (variant == 'noncanonical') {
          call = [10, 5, (cid.length << 2) | 1, 0, ...cid.codeUnits];
        }
        var payload = signingPayloadHex(
          '0x${_toHex(call)}',
          genesisHash: variant == 'wrong_chain'
              ? '0x${'11' * 32}'
              : ChainConstants.genesisHash,
          transactionVersion: variant == 'wrong_version'
              ? ChainConstants.transactionVersion + 1
              : ChainConstants.transactionVersion,
        );
        if (variant == 'bare') payload = '0x${_toHex(call)}';
        if (variant == 'truncated') {
          payload = payload.substring(0, payload.length - 2);
        }
        final request = _buildTestRequest(
          requestId: 'self-occupy-reject-$variant',
          signerPublicKey: signingAccount.accountId,
          payloadHex: payload,
          action: variant == 'wrong_action' ? 0x0a06 : 0x0a05,
        );
        expect(service.verifyPayload(request).canSign, isFalse);
      });
    }

    // 新动作沿用签名主体、时效和防重放校验，拒绝时不能触发密钥签名。
    for (final invalid in ['expired', 'wrong_account']) {
      test('signParsedRequest 自助注册拒绝 $invalid', () async {
        final request = _buildTestRequest(
          requestId: 'self-occupy-sign-$invalid',
          signerPublicKey: invalid == 'wrong_account'
              ? '0x${'aa' * 32}'
              : signingAccount.accountId,
          payloadHex: signingPayloadHex(
            '0x${_toHex([
                  10,
                  5,
                  ..._scaleString('CN202-CTZN6-123456789-1234')
                ])}',
          ),
          action: 0x0a05,
          expiresAt: invalid == 'expired'
              ? DateTime.now().millisecondsSinceEpoch ~/ 1000 - 1
              : null,
        );
        await expectLater(
          service.signParsedRequest(
            accountId: signingAccount.accountId,
            request: request,
          ),
          throwsA(
            isA<OfflineSignException>().having(
              (e) => e.code,
              'code',
              invalid == 'expired'
                  ? OfflineSignErrorCode.expired
                  : OfflineSignErrorCode.accountMismatch,
            ),
          ),
        );
        expect(walletManager.signCallCount, 0);
      });
    }
    test('公私权岗位治理和登记完整冷签，经真实原生验签并拒绝重放和错动作', () async {
      final fixture = jsonDecode(
              File('test/signing/fixtures/call_data.json').readAsStringSync())
          as Map<String, dynamic>;
      final rows = (fixture['cases'] as List)
          .cast<Map<String, dynamic>>()
          .where((row) => [30, 31].contains(row['pallet_index']));
      for (final row in rows) {
        final action = QrActions.chain(
            row['pallet_index'] as int, row['call_index'] as int);
        final request = _buildTestRequest(
          requestId: 'institution-roles-${row['name']}',
          signerPublicKey: signingAccount.accountId,
          payloadHex:
              signingPayloadHex(row['expected_call_data_hex'] as String),
          action: action,
        );
        final verification = service.verifyPayload(request);
        expect(verification.canSign, isTrue, reason: verification.rejectReason);
        expect(verification.decoded!.reviewFields['governance_detail'],
            contains('CN220-CTZN2-198805200-2026'));
        final response = await service.signParsedRequest(
            accountId: signingAccount.accountId, request: request);
        expect(
            _verifySr25519(
                signerPublicKeyHex: response.body.signerPublicKeyHex,
                message: _messageForRequest(request),
                signatureHex: response.body.signatureHex),
            isTrue);
        await expectLater(
            service.signParsedRequest(
                accountId: signingAccount.accountId, request: request),
            throwsA(isA<OfflineSignException>()
                .having((e) => e.code, 'code', OfflineSignErrorCode.replayed)));
        final mismatch = _buildTestRequest(
          requestId: 'institution-roles-mismatch-${row['name']}',
          signerPublicKey: signingAccount.accountId,
          payloadHex: request.body.payloadHex,
          action: action ^ 1,
        );
        expect(service.verifyPayload(mismatch).canSign, isFalse);
      }
      expect(walletManager.signCallCount, 4);
    });

    test('岗位访问和清算解密冷签原始97/92字节，拒绝错误账户和交叉动作', () async {
      const cid = 'LN001-NRC0G-944805165-2026';
      final cidSlot = Uint8List(32)..setAll(0, utf8.encode(cid));
      for (final action in [QrActions.roleAccess, QrActions.clearingDecrypt]) {
        final payload = <int>[
          0x47,
          0x4d,
          0x42,
          action == QrActions.roleAccess ? 0x18 : 0x19,
          ...cidSlot,
          if (action == QrActions.roleAccess) ...[78, 82, 67, 0, 0],
          ..._hexToBytes(signingAccount.accountId),
          ..._u64Le(123),
          ...List.filled(16, 8)
        ];
        final request = _buildTestRequest(
            requestId: 'binary-role-domain-$action',
            signerPublicKey: signingAccount.accountId,
            payloadHex: '0x${_toHex(payload)}',
            action: action);
        final verification = service.verifyPayload(request);
        expect(verification.canSign, isTrue, reason: verification.rejectReason);
        expect(verification.decoded!.fields['signer_public_key'],
            signingAccount.accountId);
        if (action == QrActions.roleAccess) {
          final invalidCode = Uint8List.fromList(payload)..[39] = 48;
          expect(
              service
                  .verifyPayload(_buildTestRequest(
                    requestId: 'binary-role-invalid-code',
                    signerPublicKey: signingAccount.accountId,
                    payloadHex: '0x${_toHex(invalidCode)}',
                    action: action,
                  ))
                  .canSign,
              isFalse);
        }
        expect(QrSigner.signingBytesFor(request.body), orderedEquals(payload));
        final response = await service.signParsedRequest(
            accountId: signingAccount.accountId, request: request);
        expect(
            _verifySr25519(
                signerPublicKeyHex: response.body.signerPublicKeyHex,
                message: Uint8List.fromList(payload),
                signatureHex: response.body.signatureHex),
            isTrue);
        final changed = Uint8List.fromList(payload)..[3] ^= 1;
        expect(
            _verifySr25519(
                signerPublicKeyHex: response.body.signerPublicKeyHex,
                message: changed,
                signatureHex: response.body.signatureHex),
            isFalse);
        final mismatch = _buildTestRequest(
            requestId: 'binary-role-wrong-account-$action',
            signerPublicKey: '0x${'11' * 32}',
            payloadHex: request.body.payloadHex,
            action: action);
        expect(service.verifyPayload(mismatch).canSign, isFalse);
        final wrongAction = _buildTestRequest(
            requestId: 'binary-role-wrong-action-$action',
            signerPublicKey: signingAccount.accountId,
            payloadHex: request.body.payloadHex,
            action: action == QrActions.roleAccess
                ? QrActions.clearingDecrypt
                : QrActions.roleAccess);
        expect(service.verifyPayload(wrongAction).canSign, isFalse);
      }
      expect(walletManager.signCallCount, 2);
    });

    test('链上中国确认使用真实account_id字段与原0x20域，旧管理员入口拒签', () async {
      final expiry = DateTime.now().millisecondsSinceEpoch ~/ 1000 + 120;
      final payload = <String, Object>{
        'domain': 'onchina_admin_governance',
        'qr_proto': 'QR_V1',
        'action_id': 'onchina-confirm-real-wire',
        'action_type': 'INSTITUTION_CREATE_ACCOUNT',
        'account_id': signingAccount.accountId,
        'actor_cid_number': 'ZS001-FRG07-249474503-2026',
        'actor_province_name': '中枢省',
        'target': 'LN001-NRC0G-944805165-2026',
        'request_hash': '0x${'ab' * 32}',
        'before_hash': 'none',
        'after_hash': '0x${'cd' * 32}',
        'expires_at': expiry,
      };
      SignRequestEnvelope request(String id) => _buildTestRequest(
          requestId: id,
          signerPublicKey: signingAccount.accountId,
          payloadHex: '0x${_toHex(utf8.encode(jsonEncode(payload)))}',
          action: QrActions.onchinaConfirm,
          expiresAt: expiry);
      final valid = request('onchina-confirm-signed');
      final checked = service.verifyPayload(valid);
      expect(checked.canSign, isTrue, reason: checked.rejectReason);
      expect(checked.decoded!.reviewFields['account_id'],
          signingAccount.accountId);
      final response = await service.signParsedRequest(
          accountId: signingAccount.accountId, request: valid);
      expect(
          _verifySr25519(
              signerPublicKeyHex: response.body.signerPublicKeyHex,
              message: QrSigner.signingBytesFor(valid.body),
              signatureHex: response.body.signatureHex),
          isTrue);
      payload['account_id'] = '0x${'11' * 32}';
      expect(service.verifyPayload(request('onchina-wrong-account')).canSign,
          isFalse);
      payload['account_id'] = signingAccount.accountId;
      for (final old in ['CREATE_ADMIN', 'UPDATE_ADMIN', 'DELETE_ADMIN']) {
        payload['action_type'] = old;
        expect(service.verifyPayload(request('onchina-rejected-$old')).canSign,
            isFalse);
      }
      payload['action_type'] = 'INSTITUTION_CREATE_ACCOUNT';
      payload['actor_public_key'] = payload.remove('account_id')!;
      expect(
          service.verifyPayload(request('onchina-legacy-public-key')).canSign,
          isFalse);
    });

    test('signParsedRequest 自助注册签完整载荷且拒绝重放', () async {
      final request = _buildTestRequest(
        requestId: 'self-occupy-signed-once',
        signerPublicKey: signingAccount.accountId,
        payloadHex: signingPayloadHex(
          '0x${_toHex([10, 5, ..._scaleString('CN202-CTZN6-123456789-1234')])}',
        ),
        action: 0x0a05,
      );
      final response = await service.signParsedRequest(
        accountId: signingAccount.accountId,
        request: request,
      );
      expect(response.body.signerPublicKeyHex, signingAccount.accountId);
      expect(
        _verifySr25519(
          signerPublicKeyHex: signingAccount.accountId,
          message: _messageForRequest(request),
          signatureHex: response.body.signatureHex,
        ),
        isTrue,
      );
      await expectLater(
        service.signParsedRequest(
          accountId: signingAccount.accountId,
          request: request,
        ),
        throwsA(
          isA<OfflineSignException>().having(
            (e) => e.code,
            'code',
            OfflineSignErrorCode.replayed,
          ),
        ),
      );
      expect(walletManager.signCallCount, 1);
    });

    test('伪装为已登记转账动作的Revive载荷不能调用签名器', () async {
      for (final call in [0, 1, 4, 7, 10, 11]) {
        final request = _buildTestRequest(
          requestId: 'offline-revive-$call',
          signerPublicKey: signingAccount.accountId,
          payloadHex: signingPayloadHex(
            '0x23${call.toRadixString(16).padLeft(2, '0')}00',
          ),
          action: 0x0400,
        );
        expect(
          service.verifyPayload(request).status,
          SignDecisionStatus.reject,
        );
        await expectLater(
          service.signParsedRequest(
            accountId: signingAccount.accountId,
            request: request,
          ),
          throwsA(isA<OfflineSignException>()),
        );
      }
      expect(walletManager.signCallCount, 0);
    });

    test('verifyPayload 拒绝未登记 action', () {
      final request = _buildTestRequest(
        requestId: 'offline-req-test-unknown-action',
        signerPublicKey: signingAccount.accountId,
        payloadHex: signingPayloadHex('0x1400010000000000000001'),
        action: 0x7fff,
      );

      final verification = service.verifyPayload(request);

      expect(verification.status, SignDecisionStatus.reject);
      expect(verification.actionLabel, isNull);
      expect(verification.rejectReason, contains('未登记的签名动作'));
    });

    test('verifyPayload 允许 Cold 对同账户广场动作按 0x1D 域签名', () {
      final expiresAt = DateTime.now().millisecondsSinceEpoch ~/ 1000 + 90;
      final request = _buildTestRequest(
        requestId: 'offline-req-test-square-action',
        signerPublicKey: signingAccount.accountId,
        payloadHex:
            '0x${_toHex(_squareAccountActionPayload(accountId: signingAccount.accountId, expiresAt: expiresAt))}',
        action: QrActions.squareAccountAction,
        expiresAt: expiresAt,
      );

      final verification = service.verifyPayload(request);

      expect(verification.status, SignDecisionStatus.normal);
      expect(verification.canSign, isTrue);
      expect(verification.actionLabel, '广场账户动作签名');
      expect(
        verification.decoded?.fields['account_id'],
        signingAccount.accountId,
      );
      expect(QrSigner.signingBytesFor(request.body), hasLength(32));
    });

    test('verifyPayload 拒绝广场动作载荷账户与请求签名账户不一致', () {
      final expiresAt = DateTime.now().millisecondsSinceEpoch ~/ 1000 + 90;
      final request = _buildTestRequest(
        requestId: 'offline-req-square-account-mismatch',
        signerPublicKey: signingAccount.accountId,
        payloadHex:
            '0x${_toHex(_squareAccountActionPayload(accountId: '0x${'ab' * 32}', expiresAt: expiresAt))}',
        action: QrActions.squareAccountAction,
        expiresAt: expiresAt,
      );

      final verification = service.verifyPayload(request);

      expect(verification.status, SignDecisionStatus.reject);
      expect(verification.rejectReason, contains('账户或过期时间'));
    });

    test('signParsedRequest should reject wrong signer public key', () async {
      final request = _buildTestRequest(
        requestId: 'offline-req-test-0002',
        signerPublicKey:
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        payloadHex: '0x0102',
        action: QrActions.login,
      );

      expect(
        () => service.signParsedRequest(
          accountId: signingAccount.accountId,
          request: request,
        ),
        throwsA(
          isA<OfflineSignException>().having(
            (e) => e.code,
            'code',
            OfflineSignErrorCode.accountMismatch,
          ),
        ),
      );
    });

    test('signParsedRequest should reject unknown account', () async {
      final request = _buildTestRequest(
        requestId: 'offline-req-test-unknown-account',
        signerPublicKey: signingAccount.accountId,
        payloadHex:
            signingPayloadHex('0x1400010000000000000000000000000000000001'),
        action: QrActions.internalVote,
      );

      expect(
        () => service.signParsedRequest(
          accountId:
              '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb0',
          request: request,
        ),
        throwsA(
          isA<OfflineSignException>().having(
            (e) => e.code,
            'code',
            OfflineSignErrorCode.accountNotFound,
          ),
        ),
      );
    });
  });
}

bool _verifySr25519({
  required String signerPublicKeyHex,
  required Uint8List message,
  required String signatureHex,
}) {
  // 与生产同一条原生路径（全仓 sr25519 唯一实现）。
  try {
    return NativeSr25519.verify(
      _hexToBytes(signerPublicKeyHex),
      _hexToBytes(signatureHex),
      message,
    );
  } on Object {
    return false;
  }
}

List<int> _hexToBytes(String input) {
  final text = (input.startsWith('0x') || input.startsWith('0X'))
      ? input.substring(2)
      : input;
  if (text.isEmpty || text.length.isOdd) return const <int>[];
  return List<int>.generate(
    text.length ~/ 2,
    (i) => int.parse(text.substring(i * 2, i * 2 + 2), radix: 16),
    growable: false,
  );
}

String _toHex(List<int> bytes) {
  const chars = '0123456789abcdef';
  final buf = StringBuffer();
  for (final b in bytes) {
    buf
      ..write(chars[(b >> 4) & 0x0f])
      ..write(chars[b & 0x0f]);
  }
  return buf.toString();
}

/// 假 WalletManager:按账户提供签名（不触存储/生物识别）。
class _FakeWalletManager extends WalletManager {
  static const int _ss58 = 2027;
  static const String _mnemonic =
      'bottom drive obey lake curtain smoke basket hold race lonely fit walk';

  Account? _account;
  String? _miniSecretHex;
  int signCallCount = 0;

  Future<Account> ensureAccount() async {
    final existing = _account;
    if (existing != null) {
      return existing;
    }
    final miniSecret = await WalletMiniSecret.fromMnemonic(_mnemonic);
    final pair = Keyring.sr25519.fromSeed(Uint8List.fromList(miniSecret));
    pair.ss58Format = _ss58;
    // 中文注释：测试账户公钥与签名必须走生产唯一的原生 schnorrkel 实现；
    // 禁止用第三方纯 Dart keyring 出签、再拿原生实现验签形成双口径夹具。
    final accountId = '0x${_toHex(NativeSr25519.publicKeyOf(miniSecret))}';
    _miniSecretHex = _toHex(miniSecret);
    _account = Account(
      masterId: accountId,
      accountIndex: 0,
      accountId: accountId,
      accountName: '账户0',
    );
    return _account!;
  }

  @override
  Future<Account?> getAccountByAccountId(String accountId) async {
    final account = await ensureAccount();
    return account.accountId == accountId ? account : null;
  }

  @override
  Future<Uint8List> signForAccount(String accountId, Uint8List payload,
      {Uint8List? transactionReview}) async {
    signCallCount += 1;
    final account = await ensureAccount();
    if (accountId != account.accountId) {
      throw const WalletAuthException('未找到指定账户');
    }
    final message = transactionReview == null
        ? payload
        : NativeMldsa.reviewMessage(_hexToBytes(accountId), transactionReview);
    return NativeSr25519.sign(_hexToBytes(_miniSecretHex!), message);
  }
}

// 使用同一公开核心核对链交易摘要，业务域签名与hash-only升级请求保持原字节。
Uint8List _messageForRequest(SignRequestEnvelope request) {
  final body = request.body;
  if (QrActions.isChainAction(body.action) &&
      !QrActions.isRuntimeHashOnly(body.action)) {
    return NativeMldsa.reviewMessage(
        _hexToBytes(body.signerPublicKeyHex), body.payloadBytes);
  }
  return QrSigner.signingBytesFor(body);
}
