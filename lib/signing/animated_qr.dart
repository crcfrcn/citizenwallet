import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../wallet/native_mldsa.dart';

/// 此处仅播放传输帧，分帧编码与完整性校验统一归 mldsa 模块。
class AnimatedSigningQr extends StatefulWidget {
  const AnimatedSigningQr({super.key, required this.data, this.size = 360});
  final String data;
  final double size;
  @override
  State<AnimatedSigningQr> createState() => _AnimatedSigningQrState();
}

class _AnimatedSigningQrState extends State<AnimatedSigningQr> {
  Timer? _timer;
  List<String> _frames = const [];
  int _index = 0;
  void _load() {
    _timer?.cancel();
    _index = 0;
    _frames = utf8.encode(widget.data).length <= 2331
        ? [widget.data]
        : NativeMldsa.frames(widget.data);
    if (_frames.length > 1) {
      _timer = Timer.periodic(const Duration(milliseconds: 400), (_) {
        if (mounted) setState(() => _index = (_index + 1) % _frames.length);
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant AnimatedSigningQr oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.data != widget.data) _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      Column(mainAxisSize: MainAxisSize.min, children: [
        QrImageView(
            data: _frames[_index],
            version: QrVersions.auto,
            size: widget.size,
            errorCorrectionLevel: QrErrorCorrectLevel.M),
        if (_frames.length > 1) Text('${_index + 1}/${_frames.length}'),
      ]);
}
