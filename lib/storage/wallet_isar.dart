import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'dart:isolate';

import 'package:flutter/foundation.dart' show visibleForTesting;
import 'package:isar_community/isar.dart';
import 'package:path_provider/path_provider.dart';

import '../protocol/envelope.dart';

part 'wallet_isar.g.dart';

/// 钱包（master）：一套助记词 = 一个种子 = 一个 master。其下派生多个账户。
@Name('wallet')
@collection
class WalletEntity {
  @Name('row_id')
  Id id = Isar.autoIncrement;

  @Index(unique: true)
  @Name('wallet_index')
  late int walletIndex;

  @Name('wallet_name')
  late String walletName;

  /// 主指纹 = 账户0（`//0`）的 accountId，唯一标识一套助记词。
  /// 冷钱包按 master(此指纹)加密存 master 种子 + 助记词（见 WalletSecureKeys）;
  /// 账户不单独持久化密钥,签名/私钥导出时从种子按 accountIndex 现场派生。
  @Index(unique: true)
  @Name('master_id')
  late String masterId;

  /// 排列顺序（越小越靠前）。
  @Name('sort_order')
  int sortOrder = 0;
}

/// 账户：钱包（master）下按派生序号展开的一对公私钥。
/// 全部 `//index` 硬派生（含账户0 = `//0`，无 bare 根）；每账户密钥独立、单向。
@Name('account')
@collection
class AccountEntity {
  @Name('row_id')
  Id id = Isar.autoIncrement;

  /// 所属钱包（master）指纹。按此过滤取某钱包下全部账户。
  @Index(composite: [CompositeIndex('accountIndex')], unique: true)
  @Name('master_id')
  late String masterId;

  /// 派生序号：N → `//N`（含账户0 = `//0`）。
  @Name('account_index')
  late int accountIndex;

  /// Substrate 账户唯一标识，小写 `0x` 加 64 位十六进制（= 派生公钥原字节）。
  @Index(unique: true)
  @Name('account_id')
  late String accountId;

  /// 账户显示名，默认「账户$accountIndex」。
  @Name('account_name')
  late String accountName;
}

@Name('request')
@collection
class SignedRequest {
  @Name('row_id')
  Id id = Isar.autoIncrement;

  @Name('request_id')
  @Index(unique: true)
  late String requestId;

  /// UTC 秒；只用于原签名请求的一次性占用和到期清理。
  @Name('expires_at')
  late int expiresAt;
}

class WalletIsar {
  WalletIsar._();

  static final WalletIsar instance = WalletIsar._();

  Isar? _isar;
  Future<Isar>? _opening;
  Future<void>? _testCoreInit;
  bool _terminalClosing = false;

  Future<Isar> db() async {
    if (_terminalClosing) throw StateError('WalletIsar 已进入终态擦除');
    final current = _isar;
    if (current != null && current.isOpen) {
      return current;
    }

    final opening = _opening;
    if (opening != null) {
      return opening;
    }

    final task = _openFinalSchema();
    _opening = task;
    try {
      final opened = await task;
      _isar = opened;
      return opened;
    } finally {
      _opening = null;
    }
  }

  /// 只打开最终 schema。
  ///
  /// 只接受本产品当前三集合；不在打开时迁移、重建或清除旧业务数据。
  /// 助记词、seed 与私钥位于硬件保护存储，不属于本库。
  Future<Isar> _openFinalSchema() async {
    await ensureTestCoreInitialized();
    final dir = await _resolveDirectory();
    final schemas = [
      WalletEntitySchema,
      AccountEntitySchema,
      SignedRequestSchema,
    ];
    final name = _isFlutterTest()
        ? 'citizenwallet_${Isolate.current.hashCode}'
        : 'citizenwallet';
    await _deleteLegacyLockFile(dir, name);
    final isar = await Isar.open(schemas, name: name, directory: dir);
    return isar;
  }

  /// 清理 Isar 3.1 遗留的空锁文件。
  ///
  /// community 引擎使用 `<name>.isar-lck`，旧 `<name>.isar.lock` 不再参与互斥；
  /// App 升级会重启进程，因此打开新引擎前可幂等删除该残留，不触碰业务数据库。
  Future<void> _deleteLegacyLockFile(String directory, String name) async {
    final separator = Platform.pathSeparator;
    final legacyLock = File('$directory$separator$name.isar.lock');
    if (await legacyLock.exists()) {
      await legacyLock.delete();
    }
  }

  @visibleForTesting
  Future<void> cleanupLegacyLockFileForTest(String directory, String name) =>
      _deleteLegacyLockFile(directory, name);

  Future<void> ensureTestCoreInitialized() async {
    if (!_isFlutterTest()) {
      return;
    }

    final inflight = _testCoreInit;
    if (inflight != null) {
      return inflight;
    }

    final task = _initTestCoreInternal();
    _testCoreInit = task;
    try {
      await task;
    } finally {
      _testCoreInit = null;
    }
  }

  Future<void> _initTestCoreInternal() async {
    final localPath = _resolveLocalIsarCorePath();
    if (localPath == null) {
      throw StateError(
        'Flutter test 模式未找到锁定版本的 Isar Core 动态库，请先在当前工程执行 flutter pub get。',
      );
    }
    await Isar.initializeIsarCore(
      libraries: <Abi, String>{Abi.current(): localPath},
    );
  }

  Future<void> resetForTest() async {
    if (!_isFlutterTest()) {
      return;
    }
    // 上一页面可能仍在异步打开数据库；先等打开完成，再关闭并删除测试库。
    final opening = _opening;
    if (opening != null) await opening;
    final current = _isar;
    if (current != null && current.isOpen) {
      await current.close(deleteFromDisk: true);
    }
    _isar = null;
    _opening = null;
    _terminalClosing = false;
  }

  /// 终态擦除入口。关闭意图同步生效，阻止当前进程重新打开已删除的数据库。
  Future<void> closeAndDeleteFromDisk() async {
    _terminalClosing = true;
    final opening = _opening;
    if (opening != null) {
      try {
        await opening;
      } catch (_) {
        // 打开失败时继续检查现有实例；失败由后续关闭路径显式暴露。
      }
    }
    final current = _isar;
    if (current != null && current.isOpen) {
      await current.close(deleteFromDisk: true);
    } else {
      final opened = await _openFinalSchema();
      await opened.close(deleteFromDisk: true);
    }
    _isar = null;
    _opening = null;
  }

  Future<String> _resolveDirectory() async {
    if (_isFlutterTest()) {
      return Directory.systemTemp.path;
    }
    final appDir = await getApplicationSupportDirectory();
    return appDir.path;
  }

  bool _isFlutterTest() {
    return Platform.environment.containsKey('FLUTTER_TEST');
  }

  String? _resolveLocalIsarCorePath() {
    final fromEnv = Platform.environment['ISAR_CORE_LIB_PATH'];
    if (fromEnv != null && fromEnv.trim().isNotEmpty) {
      final file = File(fromEnv.trim());
      if (file.existsSync()) {
        return file.path;
      }
      return null;
    }

    final relative = switch (Abi.current()) {
      Abi.macosArm64 || Abi.macosX64 => 'macos/libisar.dylib',
      Abi.linuxX64 => 'linux/libisar.so',
      Abi.windowsArm64 || Abi.windowsX64 => 'windows/isar.dll',
      _ => null,
    };
    if (relative == null) {
      return null;
    }

    // 只读当前工程的 Pub 解析结果，不扫描 HOME 中任意版本的依赖原件。
    final config = File(
      '${Directory.current.path}/.dart_tool/package_config.json',
    );
    if (!config.existsSync()) return null;
    try {
      final data =
          jsonDecode(config.readAsStringSync()) as Map<String, dynamic>;
      final packages = data['packages'] as List<dynamic>;
      final library = packages.cast<Map<String, dynamic>>().singleWhere(
            (entry) => entry['name'] == 'isar_community_flutter_libs',
          );
      final rootUri = config.uri.resolve(library['rootUri'] as String);
      if (rootUri.scheme != 'file') return null;
      // package_config 的 rootUri 可不带尾部斜杠；按目录拼接，避免把包名当文件名替换。
      final file = File('${Directory.fromUri(rootUri).path}/$relative');
      return file.existsSync() ? file.path : null;
    } catch (_) {
      return null;
    }
  }
}

/// 已签 QR 请求持久化防重放仓库。
///
/// 请求 id 在到期前只能被一个签名流程原子占用；到期记录在每次占用时清理。
class SignedQrRequestStore {
  const SignedQrRequestStore._();

  static Future<bool> claim({
    required String requestId,
    required int expiresAt,
  }) async {
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    if (!isQrRequestExpiryValid(expiresAt, now)) return false;

    final isar = await WalletIsar.instance.db();
    late bool claimed;
    await isar.writeTxn(() async {
      // 防重放集合只保存请求；在同一写事务清到期记录并占用准确请求。
      await isar.signedRequests
          .filter()
          .expiresAtLessThan(now, include: true)
          .deleteAll();

      final existing = await isar.signedRequests
          .filter()
          .requestIdEqualTo(requestId)
          .findFirst();
      if (existing != null) {
        claimed = false;
        return;
      }
      await isar.signedRequests.put(
        SignedRequest()
          ..requestId = requestId
          ..expiresAt = expiresAt,
      );
      claimed = true;
    });
    return claimed;
  }

  /// 密钥调用前失败时释放占位；签名一旦成功则保留到请求到期。
  static Future<void> release(String requestId) async {
    final isar = await WalletIsar.instance.db();
    await isar.writeTxn(() async {
      await isar.signedRequests
          .filter()
          .requestIdEqualTo(requestId)
          .deleteFirst();
    });
  }
}
