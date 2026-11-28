// 展示摄像头预览，并向调用方交付一次二维码原始字符串。

import 'dart:async';
import 'package:citizenwallet/scanner/scanner.dart';
import 'package:flutter/widgets.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

/// 统一摄像头预览组件，只向调用方交付一次二维码原始字符串。
class ScannerView extends StatefulWidget {
  const ScannerView({
    super.key,
    required this.controller,
    required this.onRawValue,
    this.onFailure,
  });

  final ScannerController controller;
  final ValueChanged<String> onRawValue;
  final ValueChanged<ScannerFailure>? onFailure;

  @override
  State<ScannerView> createState() => _ScannerViewState();
}

class _ScannerViewState extends State<ScannerView> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) unawaited(_start());
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        unawaited(_start());
      case AppLifecycleState.inactive:
      case AppLifecycleState.paused:
      case AppLifecycleState.hidden:
      case AppLifecycleState.detached:
        unawaited(_stop());
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.controller.buildPreview(
      onCandidates: (values) {
        try {
          final raw = widget.controller.claimFirst(values);
          if (raw != null) widget.onRawValue(raw);
        } on ScannerFailure catch (failure) {
          widget.onFailure?.call(failure);
        }
      },
    );
  }

  Future<void> _start() async {
    try {
      await widget.controller.start();
    } on ScannerFailure catch (failure) {
      widget.onFailure?.call(failure);
    }
  }

  Future<void> _stop() async {
    try {
      await widget.controller.stop();
    } on ScannerFailure catch (failure) {
      widget.onFailure?.call(failure);
    }
  }
}

// 将mobile_scanner设备识别、预览和图片扫描接入统一扫码接口。

/// `mobile_scanner` 唯一设备接线层。
final class MobileScannerBackend implements ScannerDeviceBackend {
  MobileScannerBackend()
    : _controller = MobileScannerController(
        autoStart: false,
        detectionSpeed: DetectionSpeed.normal,
        facing: CameraFacing.back,
        torchEnabled: false,
      );

  final MobileScannerController _controller;

  @override
  Widget buildPreview({required ScannerCandidatesCallback onCandidates}) {
    return MobileScanner(
      controller: _controller,
      onDetect: (capture) {
        onCandidates(capture.barcodes.map((barcode) => barcode.rawValue));
      },
    );
  }

  @override
  Future<Iterable<String?>> analyzeImage(String imagePath) async {
    final capture = await _controller.analyzeImage(imagePath);
    return capture?.barcodes.map((barcode) => barcode.rawValue) ??
        const <String?>[];
  }

  @override
  Future<void> dispose() => _controller.dispose();

  @override
  Future<void> start() => _controller.start();

  @override
  Future<void> stop() => _controller.stop();

  @override
  Future<void> toggleTorch() => _controller.toggleTorch();
}
