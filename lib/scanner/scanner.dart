// 导出统一二维码设备适配接口，向业务层提供识别原文。

library ;
import 'package:citizenwallet/scanner/view.dart' show MobileScannerBackend;
import 'package:flutter/widgets.dart';
export 'package:citizenwallet/scanner/view.dart' show ScannerView;



// 定义扫码设备的识别回调、生命周期和预览接口。

/// 设备识别结果回调。一次捕获可能包含多个二维码或空值。
typedef ScannerCandidatesCallback = void Function(Iterable<String?> values);

/// Flutter 扫码设备后端接口。
///
/// 正式环境由 mobile_scanner 实现；接口公开仅用于包测试和特殊宿主注入，业务页面不得
/// 借此实现第二套 QR_V1 解析器。
abstract interface class ScannerDeviceBackend {
  Widget buildPreview({required ScannerCandidatesCallback onCandidates});

  Future<void> start();

  Future<void> stop();

  Future<void> toggleTorch();

  Future<Iterable<String?>> analyzeImage(String imagePath);

  Future<void> dispose();
}

// 管理扫码设备生命周期、图片识别和单次结果领取。

/// 统一扫码设备生命周期与单次识别门控。
final class ScannerController {
  ScannerController({ScannerDeviceBackend? backend})
    : _backend = backend ?? MobileScannerBackend();

  final ScannerDeviceBackend _backend;
  bool _claimed = false;
  bool _running = false;
  bool _disposed = false;

  bool get hasClaimedValue => _claimed;

  Widget buildPreview({required ScannerCandidatesCallback onCandidates}) {
    _ensureActive();
    return _backend.buildPreview(onCandidates: onCandidates);
  }

  /// 从一次捕获中领取第一个非空原文；领取后忽略后续重复帧，直至 [resetDetection]。
  String? claimFirst(Iterable<String?> values) {
    _ensureActive();
    if (_claimed) return null;
    for (final value in values) {
      if (value != null && value.isNotEmpty) {
        _claimed = true;
        return value;
      }
    }
    return null;
  }

  void resetDetection() {
    _ensureActive();
    _claimed = false;
  }

  Future<void> start() async {
    _ensureActive();
    if (_running) return;
    await _run('启动摄像头', _backend.start);
    _running = true;
  }

  Future<void> stop() async {
    _ensureActive();
    if (!_running) return;
    await _run('停止摄像头', _backend.stop);
    _running = false;
  }

  Future<void> toggleTorch() => _run('切换手电筒', _backend.toggleTorch);

  /// 识别业务页面已经选择的本地图片，只返回二维码原文。
  Future<String> scanImage(String imagePath) async {
    _ensureActive();
    try {
      final values = await _backend.analyzeImage(imagePath);
      final raw = claimFirst(values);
      if (raw == null) {
        throw const ScannerFailure(
          kind: ScannerFailureKind.noQrCode,
          message: '图片中未识别到二维码',
        );
      }
      return raw;
    } on ScannerFailure {
      rethrow;
    } catch (error) {
      throw ScannerFailure.fromDeviceError(error, operation: '识别图片');
    }
  }

  Future<void> dispose() async {
    if (_disposed) return;
    _disposed = true;
    try {
      if (_running) await _backend.stop();
      await _backend.dispose();
      _running = false;
    } catch (error) {
      throw ScannerFailure.fromDeviceError(error, operation: '释放扫码设备');
    }
  }

  Future<void> _run(String operation, Future<void> Function() action) async {
    _ensureActive();
    try {
      await action();
    } catch (error) {
      throw ScannerFailure.fromDeviceError(error, operation: operation);
    }
  }

  void _ensureActive() {
    if (_disposed) {
      throw const ScannerFailure(
        kind: ScannerFailureKind.disposed,
        message: '扫码设备已经释放',
      );
    }
  }
}

// 定义扫码设备及生命周期错误的分类和统一异常。

enum ScannerFailureKind {
  permissionDenied,
  cameraUnavailable,
  noQrCode,
  disposed,
  operationFailed,
}

/// 统一扫码设备错误。
class ScannerFailure implements Exception {
  const ScannerFailure({required this.kind, required this.message, this.cause});

  final ScannerFailureKind kind;
  final String message;
  final Object? cause;

  factory ScannerFailure.fromDeviceError(
    Object error, {
    required String operation,
  }) {
    final normalized = error.toString().toLowerCase();
    final ScannerFailureKind kind;
    if (normalized.contains('permission') || normalized.contains('denied')) {
      kind = ScannerFailureKind.permissionDenied;
    } else if (normalized.contains('unavailable') ||
        normalized.contains('not available') ||
        normalized.contains('no camera')) {
      kind = ScannerFailureKind.cameraUnavailable;
    } else {
      kind = ScannerFailureKind.operationFailed;
    }
    return ScannerFailure(kind: kind, message: '$operation失败', cause: error);
  }

  @override
  String toString() => 'ScannerFailure($kind): $message';
}
