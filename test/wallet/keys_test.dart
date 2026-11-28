// 验证派生向量、主机密及存储键。

import 'dart:typed_data';

import 'package:citizenwallet/wallet/keys.dart';
import 'package:citizenwallet/wallet/manager.dart';
import 'package:citizenwallet/wallet/password.dart';
import 'package:citizenwallet/wallet/sr25519.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:polkadart_keyring/polkadart_keyring.dart';

void main() {
  group('derivation', _registerDerivation);
  group('secret', _registerSecret);
  group('model', _registerModel);
  group('storage', _registerStorage);
}

// 用公开黄金向量验证助记词密码和各账户硬派生结果。

/// 固定测试助记词（substrate dev 助记词，全网公开，仅测试用）。
const String kDevPhrase =
    'bottom drive obey lake curtain smoke basket hold race lonely fit walk';

/// 本链 SS58 前缀。
const int kSs58 = 2027;

/// substrate 权威向量：dev 助记词 //Alice 的 sr25519 AccountId。
const String kAlicePub =
    'd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d';

/// 金标：dev 助记词下 //0 //1 //2 的 (accountId, ss58, childMiniSecret)。
/// //1 //2 的 accountId/ss58 与旧 bare 模型一致（`//N` 不变），账户0 改 `//0` 换新值。
const List<(String, String, String)> kGoldenAccounts = [
  (
    '0x2afba9278e30ccf6a6ceb3a8b6e336b70068f045c666f2e7f4f9cc5f47db8972',
    'w5CZACAABUbK4jspzPB5be9trhtSgRCRZFafGe7kvFPvxq8M2',
    '0x914dded06277afbe5b0e8a30bce539ec8a9552a784d08e530dc7c2915c478393',
  ),
  (
    '0xb606fc73f57f03cdb4c932d475ab426043e429cecc2ffff0d2672b0df8398c48',
    'w5FhUDLW4BxsE1QXK4sNjPZ8rqSnK2QeVpUfXzqczpWdxChxV',
    '0x4433c3ada0cf37c3050d5435321872f4f84ef53d8b5f1f1560689d500b882245',
  ),
  (
    '0x46f136b564e1fad55031404dd84e5cd3fa76bfe7cc7599b39d38fd06663bbc0a',
    'w5DBpRvbgkersZohanGQiXa4qQLS1n7VQaSFwBaq4irJmgDn5',
    '0x5418179cea7224f2d9d2ab437773c2fdb266e52ef7fa52c0d9c15c6ca6068748',
  ),
];

/// `subkey inspect --password 'Aa1!中华' '<助记词>//index'` 官方金标。
const String kPassword = 'Aa1!中华';
const List<(String, String)> kPasswordGoldenAccounts = [
  (
    '0x582cdc8c9b4c0ab469a54850285004eec274d08baa1ccd885300697c1410a939',
    '0xd2db5cb0ab33f2b28d460ecc98d44606a582560e15217f993dcd0890dc637883',
  ),
  (
    '0xb2e853e5b2338b391203393805fb99b3e698b72a27be2d881ceb5883b8f1ae0e',
    '0x17662e95a4cebb837b63d0a803d30dd183541f6ecb0a3f26fd1e911e30f3a3e0',
  ),
  (
    '0xee6b0534f98e4dd14802f59e44dd962741dd18dfcbdf4614980719b9809b7a61',
    '0xde45491978a38d3f3960e3f7aece9e5d619c81dd2c4cabe1904aa8fef4442201',
  ),
];

List<int> _hexToBytesForTest(String hex) {
  final t = hex.startsWith('0x') ? hex.substring(2) : hex;
  return [
    for (var i = 0; i < t.length; i += 2)
      int.parse(t.substring(i, i + 2), radix: 16),
  ];
}

String _hex(List<int> b) =>
    b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();

Future<Uint8List> _miniSecret(String mnemonic, {String password = ''}) async {
  return WalletMiniSecret.fromMnemonic(mnemonic, password: password);
}

/// 复现 WalletManager 的 child mini-secret 提取（金标据此校验）。
///
/// 与本端生产同一条原生路径（[NativeSr25519] → citizen-signer）；
/// 金标将本端生产实现与 Substrate 官方权威向量直接对拍。
List<int> _childMiniSecret(List<int> seed, int index) {
  final chainCode = WalletMiniSecret.hardJunctionChainCode(index);
  try {
    return NativeSr25519.deriveHard(seed, chainCode);
  } finally {
    WalletMiniSecret.clear(chainCode);
  }
}

void _registerDerivation() {
  test('junction 硬派生对齐 substrate 权威 Alice', () async {
    final alice = await Keyring.sr25519.fromUri('$kDevPhrase//Alice');
    alice.ss58Format = kSs58;
    expect(_hex(alice.bytes().toList(growable: false)), kAlicePub);
  });

  test('model B 核心：fromSeed(childMiniSecret) == <助记词>//index', () async {
    final ms = await _miniSecret(kDevPhrase);
    for (var index = 0; index < 3; index++) {
      final child = _childMiniSecret(ms, index);
      final recon = Keyring.sr25519.fromSeed(Uint8List.fromList(child))
        ..ss58Format = kSs58;
      final ref = await Keyring.sr25519.fromUri('$kDevPhrase//$index');
      ref.ss58Format = kSs58;
      expect(
        _hex(recon.bytes().toList(growable: false)),
        _hex(ref.bytes().toList(growable: false)),
        reason: '//$index 公钥不一致',
      );
      expect(recon.address, ref.address, reason: '//$index ss58 不一致');
    }
  });

  test('//0 //1 //2 金标逐字节钉死（accountId / ss58 / childMiniSecret）', () async {
    final ms = await _miniSecret(kDevPhrase);
    for (var index = 0; index < kGoldenAccounts.length; index++) {
      final child = _childMiniSecret(ms, index);
      final accountId = '0x${_hex(NativeSr25519.publicKeyOf(child))}';
      final (expectedId, expectedSs58, expectedChild) = kGoldenAccounts[index];
      expect(accountId, expectedId, reason: '//$index accountId 漂移');
      expect(
        Keyring().encodeAddress(_hexToBytesForTest(accountId), kSs58),
        expectedSs58,
        reason: '//$index ss58 漂移',
      );
      expect(
        '0x${_hex(child)}',
        expectedChild,
        reason: '//$index childMiniSecret 漂移',
      );
    }
  });

  test('非空 password 对齐 Subkey 且冷热端 //0 //1 //2 金标一致', () async {
    final ms = await _miniSecret(kDevPhrase, password: kPassword);
    for (var index = 0; index < kPasswordGoldenAccounts.length; index++) {
      final child = _childMiniSecret(ms, index);
      final (expectedId, expectedChild) = kPasswordGoldenAccounts[index];
      expect('0x${_hex(NativeSr25519.publicKeyOf(child))}', expectedId);
      expect('0x${_hex(child)}', expectedChild);
    }
  });
}

// 验证助记词密码派生的稳定性、空密码向量及非法密码拒绝。

void _registerSecret() {
  const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  test('相同助记词与 password 派生逐字节稳定，password 改变即得到不同结果', () async {
    final first = await WalletMiniSecret.fromMnemonic(
      mnemonic,
      password: '安全密码A1!',
    );
    final second = await WalletMiniSecret.fromMnemonic(
      mnemonic,
      password: '安全密码A1!',
    );
    final different = await WalletMiniSecret.fromMnemonic(
      mnemonic,
      password: '安全密码A2!',
    );
    try {
      expect(first, hasLength(32));
      expect(second, orderedEquals(first));
      expect(different, isNot(orderedEquals(first)));
    } finally {
      WalletMiniSecret.clear(first);
      WalletMiniSecret.clear(second);
      WalletMiniSecret.clear(different);
    }
  });

  test('空 password 保持既有 Substrate BIP-39 向量', () async {
    final miniSecret = await WalletMiniSecret.fromMnemonic(mnemonic);
    try {
      expect(
        miniSecret,
        orderedEquals(<int>[
          0x4e,
          0xd8,
          0xd4,
          0xb1,
          0x76,
          0x98,
          0xdd,
          0xea,
          0xa1,
          0xf1,
          0x55,
          0x9f,
          0x15,
          0x2f,
          0x87,
          0xb5,
          0xd4,
          0x72,
          0xf7,
          0x25,
          0xca,
          0x86,
          0xd3,
          0x41,
          0xbd,
          0x02,
          0x76,
          0xf1,
          0xb6,
          0x11,
          0x97,
          0xe2,
        ]),
      );
    } finally {
      WalletMiniSecret.clear(miniSecret);
    }
  });

  test('非法 password 在派生真源再次 fail-closed', () async {
    await expectLater(
      WalletMiniSecret.fromMnemonic(mnemonic, password: 'A1!'),
      throwsA(isA<WalletPasswordException>()),
    );
  });
}

// 验证账户0及其他账户均使用带序号的硬派生路径。

void _registerModel() {
  Account account(int index) => Account(
        masterId:
            '0x46ebddef8cd9bb167dc30878d7113b7e168e6f0646beffd77d69d39bad76b47a',
        accountIndex: index,
        accountId: '0x${'aabbccdd' * 8}',
        accountName: '账户$index',
      );

  group('Account.derivationPath', () {
    test('账户0 = //0（无 bare 根）', () {
      expect(account(0).derivationPath, '//0');
    });

    test('账户N = //N', () {
      expect(account(1).derivationPath, '//1');
      expect(account(7).derivationPath, '//7');
    });
  });
}

// 验证钱包主机密存储键的格式、隔离和非法标识拒绝。

void _registerStorage() {
  const masterA =
      '0x2afba9278e30ccf6a6ceb3a8b6e336b70068f045c666f2e7f4f9cc5f47db8972';
  const masterB =
      '0xb606fc73f57f03cdb4c932d475ab426043e429cecc2ffff0d2672b0df8398c48';

  group('WalletSecureKeys', () {
    test('master MiniSecretKey / mnemonic 键格式', () {
      expect(
        WalletSecureKeys.masterMiniSecretKey(masterA),
        'wallet.secret.$masterA.master_mini_secret_key',
      );
      expect(
        WalletSecureKeys.mnemonic(masterA),
        'wallet.secret.$masterA.mnemonic',
      );
    });

    test('不同 masterId 生成不同键', () {
      expect(
        WalletSecureKeys.masterMiniSecretKey(masterA) !=
            WalletSecureKeys.masterMiniSecretKey(masterB),
        isTrue,
      );
    });

    test('同 masterId 下 master MiniSecretKey 与 mnemonic 键不冲突', () {
      expect(
        WalletSecureKeys.masterMiniSecretKey(masterA) !=
            WalletSecureKeys.mnemonic(masterA),
        isTrue,
      );
    });

    test('拒绝非规范 masterId', () {
      expect(
        () => WalletSecureKeys.masterMiniSecretKey('nope'),
        throwsArgumentError,
      );
      expect(
        () => WalletSecureKeys.masterMiniSecretKey('0xABC'),
        throwsArgumentError,
      );
      expect(
        () => WalletSecureKeys.mnemonic('${masterA}extra'),
        throwsArgumentError,
      );
    });
  });
}
