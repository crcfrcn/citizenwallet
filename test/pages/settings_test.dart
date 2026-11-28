// 验证手册、安装版本及生物识别文案。


import 'package:citizenwallet/pages/biometric.dart';
import 'package:citizenwallet/pages/manual.dart';
import 'package:citizenwallet/pages/settings.dart';
import 'package:citizenwallet/pages/theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:local_auth_android/local_auth_android.dart';
import 'package:local_auth_darwin/local_auth_darwin.dart';
import 'package:package_info_plus/package_info_plus.dart';

void main() {
  group('biometric', _registerBiometric);
  group('manual', _registerManual);
}

// 验证生物识别弹窗的语言回退及禁用系统密码回退规则。

/// 生物识别对话框文案口径:默认中文,只有英文手机显示英文,其余语言一律回落中文。
/// 与 CitizenApp 热端同一条规则(双端一致铁律)。
void _registerBiometric() {
  tearDown(() => BiometricAuthText.debugLocale = null);

  void setLocale(String languageCode, {String? countryCode}) {
    BiometricAuthText.debugLocale = () => Locale(languageCode, countryCode);
  }

  test('中文手机 → 中文', () {
    setLocale('zh', countryCode: 'CN');
    expect(BiometricAuthText.isEnglish, isFalse);
    expect(BiometricAuthText.pick(zh: '中', en: 'en'), '中');
  });

  test('英文手机 → 英文(含各英语地区)', () {
    for (final country in <String?>[null, 'US', 'GB', 'AU']) {
      setLocale('en', countryCode: country);
      expect(BiometricAuthText.isEnglish, isTrue, reason: 'en_$country');
      expect(BiometricAuthText.pick(zh: '中', en: 'en'), 'en');
    }
  });

  test('其它语言(日/法/德/韩/西)一律回落中文,不得漏成英文', () {
    for (final code in <String>['ja', 'fr', 'de', 'ko', 'es']) {
      setLocale(code);
      expect(BiometricAuthText.isEnglish, isFalse, reason: '$code 应回落中文');
      expect(BiometricAuthText.pick(zh: '中', en: 'en'), '中', reason: code);
    }
  });

  test('messages 同时覆盖 Android 与 iOS 两侧,且随语言切换', () {
    setLocale('zh');
    final zh = BiometricAuthText.messages();
    expect(zh.whereType<AndroidAuthMessages>().single.cancelButton, '取消');
    expect(zh.whereType<AndroidAuthMessages>().single.signInTitle, '身份验证');
    expect(zh.whereType<IOSAuthMessages>().single.cancelButton, '取消');

    setLocale('en');
    final en = BiometricAuthText.messages();
    expect(en.whereType<AndroidAuthMessages>().single.cancelButton, 'Cancel');
    expect(en.whereType<IOSAuthMessages>().single.cancelButton, 'Cancel');
  });

  test('冷钱包死规则:绝不提供 iOS 回退按钮(biometricOnly,禁密码/图案回退)', () {
    setLocale('zh');
    final ios =
        BiometricAuthText.messages().whereType<IOSAuthMessages>().single;
    // localizedFallbackTitle 一旦给值,iOS 会渲染出"使用密码"回退按钮,
    // 与冷钱包 biometricOnly 契约直接冲突,必须恒为 null。
    expect(ios.localizedFallbackTitle, isNull);
  });
}

// 验证产品手册入口、密钥关系展示及真实安装包版本呈现。

void _registerManual() {
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
