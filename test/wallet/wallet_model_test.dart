import 'package:flutter_test/flutter_test.dart';
import 'package:citizenwallet/wallet/wallet_manager.dart';

void main() {
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
