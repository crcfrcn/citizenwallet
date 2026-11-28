// 验证PIN派生、防胁迫擦除及恢复。

import 'dart:convert';
import 'dart:io';

import 'package:citizenwallet/pages/pin.dart';
import 'package:citizenwallet/pages/settings.dart';
import 'package:citizenwallet/pages/theme.dart';
import 'package:citizenwallet/security/lock.dart';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('pin', _registerPin);
  group('duress', _registerDuress);
}

// 以标准向量核对PBKDF2-HMAC-SHA256的迭代和输出长度。

/// PBKDF2-HMAC-SHA256 标准测试向量验证。
///
/// 与 AppLockService 中的 _pbkdf2HmacSha256 实现逻辑相同，
/// 此处独立实现以交叉验证正确性。
/// 测试向量来源：RFC 6070 / NIST SP 800-132。
void _registerPin() {
  group('PBKDF2-HMAC-SHA256', () {
    test('RFC 6070 向量: password="password", salt="salt", c=1, dkLen=32', () {
      final result = _pbkdf2HmacSha256(
        utf8.encode('password'),
        utf8.encode('salt'),
        1,
        32,
      );
      expect(
        result,
        '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b',
      );
    });

    test('RFC 6070 向量: password="password", salt="salt", c=2, dkLen=32', () {
      final result = _pbkdf2HmacSha256(
        utf8.encode('password'),
        utf8.encode('salt'),
        2,
        32,
      );
      expect(
        result,
        'ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43',
      );
    });

    test('RFC 6070 向量: password="password", salt="salt", c=4096, dkLen=32', () {
      final result = _pbkdf2HmacSha256(
        utf8.encode('password'),
        utf8.encode('salt'),
        4096,
        32,
      );
      expect(
        result,
        'c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a',
      );
    });

    test('短密码短盐', () {
      final result = _pbkdf2HmacSha256(
        utf8.encode('1'),
        utf8.encode('s'),
        1,
        32,
      );
      // 确保不会崩溃，且产出 64 字符 hex
      expect(result.length, 64);
      expect(RegExp(r'^[0-9a-f]{64}$').hasMatch(result), isTrue);
    });

    test('输出长度可指定', () {
      final r16 = _pbkdf2HmacSha256(utf8.encode('p'), utf8.encode('s'), 1, 16);
      final r64 = _pbkdf2HmacSha256(utf8.encode('p'), utf8.encode('s'), 1, 64);
      expect(r16.length, 32); // 16 字节 = 32 hex
      expect(r64.length, 128); // 64 字节 = 128 hex
      // r16 应是 r64 的前缀（PBKDF2 块拼接特性）
      // 注意：仅当 dkLen <= 32 时第一块相同，dkLen > 32 时会有第二块
      expect(r64.startsWith(r16), isTrue);
    });
  });
}

/// 与 AppLockService._pbkdf2HmacSha256 完全相同的实现。
String _pbkdf2HmacSha256(
  List<int> password,
  List<int> salt,
  int iterations,
  int keyLength,
) {
  final numBlocks = (keyLength + 31) ~/ 32;
  final result = <int>[];
  for (var block = 1; block <= numBlocks; block++) {
    final blockBytes = [
      ...salt,
      (block >> 24) & 0xff,
      (block >> 16) & 0xff,
      (block >> 8) & 0xff,
      block & 0xff,
    ];
    final hmac = Hmac(sha256, password);
    var u = hmac.convert(blockBytes).bytes;
    var xor = List<int>.from(u);
    for (var i = 1; i < iterations; i++) {
      u = Hmac(sha256, password).convert(u).bytes;
      for (var j = 0; j < xor.length; j++) {
        xor[j] ^= u[j];
      }
    }
    result.addAll(xor);
  }
  return result
      .sublist(0, keyLength)
      .map((b) => b.toRadixString(16).padLeft(2, '0'))
      .join();
}

// 验证普通PIN与防共匪密码隔离，以及持久擦除和恢复终态。

void _registerDuress() {
  setUp(() {
    FlutterSecureStorage.setMockInitialValues(<String, String>{});
    AppLockService.debugResetForTest();
  });

  tearDown(AppLockService.debugResetForTest);

  test('普通应用锁与防共匪密码使用各自固定迭代次数', () {
    expect(AppLockService.appLockPinHashIterations, 100000);
    expect(AppLockService.duressModePinHashIterations, 10000);
  });

  test('防共匪密码独立保存、识别且不计入普通密码错误次数', () async {
    await AppLockService.setPin('123456');

    expect(await AppLockService.setDuressModePin('123456'), isFalse);
    expect(await AppLockService.setDuressModePin('654321'), isTrue);
    expect(
      await AppLockService.verifyPin('123456'),
      AppPinVerificationResult.verified,
    );
    expect(
      await AppLockService.verifyPin('654321'),
      AppPinVerificationResult.duressMode,
    );
    expect(await AppLockService.getFailCount(), 0);
  });

  test('关闭普通应用锁会同步清除防共匪模式', () async {
    await AppLockService.setPin('123456');
    await AppLockService.setDuressModePin('654321');

    await AppLockService.removePin();

    expect(await AppLockService.isPinSet(), isFalse);
    expect(await AppLockService.isDuressModeEnabled(), isFalse);
  });

  testWidgets('应用锁关闭时显示防共匪锁标题', (tester) async {
    await tester.pumpWidget(
      MaterialApp(theme: AppTheme.darkTheme, home: const SettingsPage()),
    );
    await tester.pumpAndSettle();

    expect(find.text('应用锁（防共匪锁）'), findsOneWidget);
  });

  testWidgets('防共匪密码两个输入框保持独立间距', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => TextButton(
            onPressed: () => showDuressModeSetupDialog(context),
            child: const Text('打开设置'),
          ),
        ),
      ),
    );
    await tester.tap(find.text('打开设置'));
    await tester.pumpAndSettle();

    final fields = find.byType(TextField);
    expect(fields, findsNWidgets(2));
    final gap = tester.getTopLeft(fields.at(1)).dy -
        tester.getBottomLeft(fields.at(0)).dy;
    expect(gap, greaterThanOrEqualTo(16));
  });

  testWidgets('单次命中防共匪密码立即落门闩、擦除并退出', (tester) async {
    var latchCalls = 0;
    var wipeCalls = 0;
    var exitCalls = 0;
    final events = <String>[];
    AppLockService.debugConfigureForTest(
      isLocked: () async => false,
      verifyPin: (pin) async => pin == '654321'
          ? AppPinVerificationResult.duressMode
          : AppPinVerificationResult.rejected,
      latchPersistentWipe: () async {
        latchCalls += 1;
        events.add('latch');
      },
      wipeAllData: () async {
        wipeCalls += 1;
        events.add('wipe');
      },
    );
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async {
        if (call.method == 'SystemNavigator.pop') {
          exitCalls += 1;
          events.add('exit');
        }
        return null;
      },
    );
    const securityChannel = MethodChannel('citizenwallet/security');
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      securityChannel,
      (call) async {
        events.add(call.method);
        return null;
      },
    );
    addTearDown(
      () async {
        tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
          SystemChannels.platform,
          null,
        );
        tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
          securityChannel,
          null,
        );
      },
    );
    await tester.pumpWidget(
      const MaterialApp(home: PinInputPage(mode: PinInputMode.verify)),
    );
    await tester.pump();
    await _enterSixDigitPin(tester, <int>[6, 5, 4, 3, 2, 1]);
    // 第一个新帧先提交不可返回的中性遮蔽页，随后才开始后台擦除。
    await tester.pumpAndSettle(const Duration(milliseconds: 100));
    expect(find.byType(AlertDialog), findsNothing);
    expect(find.textContaining('密码错误'), findsNothing);
    expect(latchCalls, 1);
    expect(wipeCalls, 1);
    expect(exitCalls, 1);
    expect(events, <String>[
      'latch',
      'beginEmergencyWipe',
      'wipe',
      'finishEmergencyWipe',
      'exit',
    ]);
  });

  testWidgets('单次命中但擦除门闩失败时不得退出或启动擦除', (tester) async {
    var wipeCalls = 0;
    var exitCalls = 0;
    AppLockService.debugConfigureForTest(
      isLocked: () async => false,
      verifyPin: (_) async => AppPinVerificationResult.duressMode,
      latchPersistentWipe: () async => throw StateError('latch failed'),
      wipeAllData: () async => wipeCalls += 1,
    );
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async {
        if (call.method == 'SystemNavigator.pop') exitCalls += 1;
        return null;
      },
    );
    addTearDown(
      () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        null,
      ),
    );

    await tester.pumpWidget(
      const MaterialApp(home: PinInputPage(mode: PinInputMode.verify)),
    );
    await tester.pump();
    await _enterSixDigitPin(tester, <int>[6, 5, 4, 3, 2, 1]);
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('操作未完成，请稍后重试'), findsOneWidget);
    expect(wipeCalls, 0);
    expect(exitCalls, 0);
  });

  testWidgets('数字键盘连续按下六位时完整保留输入顺序', (tester) async {
    String? verifiedPin;
    AppLockService.debugConfigureForTest(
      isLocked: () async => false,
      verifyPin: (pin) async {
        verifiedPin = pin;
        return AppPinVerificationResult.verified;
      },
    );
    await tester.pumpWidget(
      const MaterialApp(home: PinInputPage(mode: PinInputMode.verify)),
    );
    await tester.pump();

    for (final digit in <int>[1, 2, 3, 4, 5, 6]) {
      await tester.tap(find.text('$digit'), warnIfMissed: false);
    }
    await tester.pumpAndSettle();

    expect(verifiedPin, '123456');
  });

  test('pending 擦除门闩会阻止普通启动并进入恢复擦除', () async {
    final directory = await Directory.systemTemp.createTemp(
      'citizenwallet_duress_mode_',
    );
    addTearDown(() => directory.delete(recursive: true));
    Future<Directory> directoryProvider() async => directory;

    await AppLockService.latchPersistentWipe(
      debugDocumentsDirectoryProvider: directoryProvider,
    );
    final result = await AppLockService.recoverPersistentWipeAtStartup(
      debugDocumentsDirectoryProvider: directoryProvider,
      debugDeleteSecureStorage: () async {},
      debugClearSharedPreferences: () async {},
    );

    // 测试库中没有真实硬件钥；恢复完成后当前进程仍只进入擦除终态。
    expect(result, AppDataWipeStartupResult.dataWiped);
  });
}

Future<void> _enterSixDigitPin(
  WidgetTester tester,
  List<int> digits,
) async {
  for (final digit in digits) {
    await tester.tap(find.text('$digit'));
    await tester.pump();
  }
}
