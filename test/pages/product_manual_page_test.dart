import 'package:citizenwallet/pages/app_theme.dart';
import 'package:citizenwallet/pages/product_manual_page.dart';
import 'package:citizenwallet/pages/settings_page.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:package_info_plus/package_info_plus.dart';

void main() {
  testWidgets('设置页产品手册入口可以进入手册', (tester) async {
    FlutterSecureStorage.setMockInitialValues({});
    PackageInfo.setMockInitialValues(
      appName: '公民钱包',
      packageName: 'com.crcfrcn.citizenwallet',
      version: '1.0.0',
      buildNumber: '1',
      buildSignature: '',
    );
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: const SettingsPage(),
      ),
    );
    await tester.pumpAndSettle();

    final entry = find.widgetWithText(ListTile, '产品手册');
    expect(entry, findsOneWidget);
    await tester.tap(entry);
    await tester.pumpAndSettle();
    expect(find.text('一个钱包，五层关系'), findsOneWidget);
  });

  testWidgets('关于页展示当前安装包版本，不使用固定的旧版本', (tester) async {
    FlutterSecureStorage.setMockInitialValues({});
    PackageInfo.setMockInitialValues(
      appName: '公民钱包',
      packageName: 'com.crcfrcn.citizenwallet',
      version: '1.0.1',
      buildNumber: '42',
      buildSignature: '',
    );
    await tester.pumpWidget(
      MaterialApp(theme: AppTheme.darkTheme, home: const SettingsPage()),
    );
    await tester.pumpAndSettle();
    expect(find.text('v1.0.1'), findsOneWidget);
    expect(find.text('v1.0.0'), findsNothing);
  });

  testWidgets('安装包版本无效时不冒充正式版', (tester) async {
    FlutterSecureStorage.setMockInitialValues({});
    PackageInfo.setMockInitialValues(
      appName: '公民钱包',
      packageName: 'com.crcfrcn.citizenwallet',
      version: 'invalid',
      buildNumber: '42',
      buildSignature: '',
    );
    await tester.pumpWidget(
      MaterialApp(theme: AppTheme.darkTheme, home: const SettingsPage()),
    );
    await tester.pumpAndSettle();
    expect(find.text('版本未知'), findsOneWidget);
    expect(find.text('v1.0.0'), findsNothing);
  });

  testWidgets('产品手册展示完整密钥关系与公开边界', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: const ProductManualPage(),
      ),
    );

    expect(find.text('产品手册'), findsOneWidget);
    expect(find.text('一个钱包，五层关系'), findsOneWidget);
    expect(find.text('助记词'), findsOneWidget);
    expect(find.text('种子'), findsOneWidget);
    expect(find.text('私钥'), findsOneWidget);
    expect(find.text('公钥 / AccountId'), findsOneWidget);

    await tester.drag(
      find.byKey(const Key('product-manual-scroll')),
      const Offset(0, -700),
    );
    await tester.pumpAndSettle();

    expect(find.text('账户地址'), findsOneWidget);
    expect(find.textContaining('备份地址不能恢复钱包'), findsOneWidget);
    expect(find.text('必须\n保密'), findsNWidgets(3));
    expect(find.text('可以\n公开'), findsNWidgets(2));
  });
}
