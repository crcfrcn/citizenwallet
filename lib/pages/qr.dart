// 统一扫描框布局，绘制遮罩挖空区域和边角标记。

import 'package:citizenwallet/pages/theme.dart';
import 'package:citizenwallet/scanner/scanner.dart' show NativeQrTransport;
import 'package:citizenwallet/protocol/envelope.dart';
import 'package:citizenwallet/protocol/identity.dart';
import 'package:citizenwallet/protocol/qr.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

/// 扫描框布局常量（单源，scan_page 与 offline_sign_page 共用）。
const double scanBoxSize = 260;
// 对准框、遮罩挖空区域和下方提示文字共用偏移量，整体上移 24 个逻辑像素。
const double scanBoxOffsetY = -64;

/// 扫描框半透明遮罩：整屏压暗并挖空中心方框。
class ScanOverlayPainter extends CustomPainter {
  ScanOverlayPainter({required this.scanBoxSize, this.offsetY = 0});

  final double scanBoxSize;
  final double offsetY;

  @override
  void paint(Canvas canvas, Size size) {
    final bgPaint = Paint()..color = Colors.black.withAlpha(140);
    final clearPaint = Paint()..blendMode = BlendMode.clear;

    final center = Offset(size.width / 2, size.height / 2 + offsetY);
    final rect = Rect.fromCenter(
      center: center,
      width: scanBoxSize,
      height: scanBoxSize,
    );

    canvas.saveLayer(Offset.zero & size, Paint());
    canvas.drawRect(Offset.zero & size, bgPaint);
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, const Radius.circular(12)),
      clearPaint,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant ScanOverlayPainter oldDelegate) =>
      oldDelegate.scanBoxSize != scanBoxSize || oldDelegate.offsetY != offsetY;
}

/// 扫描框四角装饰线。
class ScanCornerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const cornerLen = 28.0;
    const strokeWidth = 3.5;
    const cornerRadius = 12.0;

    final paint = Paint()
      ..color = AppTheme.primaryLight
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final w = size.width;
    final h = size.height;

    // 左上
    final topLeftPath = Path()
      ..moveTo(0, cornerLen)
      ..lineTo(0, cornerRadius)
      ..quadraticBezierTo(0, 0, cornerRadius, 0)
      ..lineTo(cornerLen, 0);
    canvas.drawPath(topLeftPath, paint);

    // 右上
    final topRightPath = Path()
      ..moveTo(w - cornerLen, 0)
      ..lineTo(w - cornerRadius, 0)
      ..quadraticBezierTo(w, 0, w, cornerRadius)
      ..lineTo(w, cornerLen);
    canvas.drawPath(topRightPath, paint);

    // 左下
    final bottomLeftPath = Path()
      ..moveTo(0, h - cornerLen)
      ..lineTo(0, h - cornerRadius)
      ..quadraticBezierTo(0, h, cornerRadius, h)
      ..lineTo(cornerLen, h);
    canvas.drawPath(bottomLeftPath, paint);

    // 右下
    final bottomRightPath = Path()
      ..moveTo(w - cornerLen, h)
      ..lineTo(w - cornerRadius, h)
      ..quadraticBezierTo(w, h, w, h - cornerRadius)
      ..lineTo(w, h - cornerLen);
    canvas.drawPath(bottomRightPath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// 统一构造并展示固定账户码，保证钱包各入口使用相同载荷。

/// 账户码（`QR_V1 k=5 account_id_code`）的构造与展示单源。
///
/// 账户详情页与钱包详情页的账户列表共用本文件：同一个账户在两处入口打开的二维码
/// 必须逐字节一致，不得各造一份。

/// 为账户生成固定账户码（`k=5`）。
///
/// 账户码只声明账户，不带时效、不带账户名、不带 CID/昵称。公民钱包完全离线、无 NTP，
/// 不得签发带绝对时间戳的凭证；也没有 CID↔AccountId 链上真源，不得伪造 `k=3` 用户码。
String buildWalletQr({required String accountId}) {
  return QrEnvelope<AccountIdCodeBody>(
    kind: QrKind.accountIdCode,
    id: null,
    expiresAt: null,
    body: AccountIdCodeBody(accountId: accountId),
  ).toRawJson();
}

/// 弹出该账户的账户码。
///
/// [accountName] 只在弹窗顶部本机展示，**绝不进载荷**——本机标签用户可随意改写，
/// 一旦进入二维码就会被扫码端当成对方公开身份显示。
Future<void> showWalletQrDialog(
  BuildContext context, {
  required String accountId,
  required String accountName,
  required String ss58Address,
}) {
  final qrData = buildWalletQr(accountId: accountId);
  return showDialog<void>(
    context: context,
    builder: (context) => Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              accountName,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            Flexible(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final code = QrValidator.validate(
                      data: qrData,
                      version: QrVersions.auto,
                      errorCorrectionLevel: QrErrorCorrectLevel.M,
                    ).qrCode;
                    if (code == null) return const Text('二维码生成失败');
                    final ratio = MediaQuery.devicePixelRatioOf(context),
                        quiet = NativeQrTransport.quietZone;
                    final modules = code.moduleCount + 2 * quiet;
                    // 静区已包含在码面内，使用实际可用宽度，避免重复留白挤小账户码。
                    var side = constraints.maxWidth < 320
                        ? constraints.maxWidth
                        : 320.0;
                    if (constraints.maxHeight < side) {
                      side = constraints.maxHeight;
                    }
                    final unit =
                        (side * ratio / modules).floorToDouble() / ratio;
                    return SizedBox(
                      width: side,
                      height: side,
                      child: Center(
                        child: QrImageView.withQr(
                          qr: code,
                          version: code.typeNumber,
                          size: unit * modules,
                          padding: EdgeInsets.all(unit * quiet),
                          backgroundColor: NativeQrTransport.background,
                          errorCorrectionLevel: QrErrorCorrectLevel.M,
                          eyeStyle: QrEyeStyle(
                            eyeShape: QrEyeShape.square,
                            color: NativeQrTransport.foreground,
                          ),
                          dataModuleStyle: QrDataModuleStyle(
                            dataModuleShape: QrDataModuleShape.square,
                            color: NativeQrTransport.foreground,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 12),
            SelectableText(
              ss58Address,
              style: const TextStyle(
                fontSize: 11,
                color: AppTheme.textSecondary,
                fontFamily: 'monospace',
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            // 关闭|复制 左右对称;复制账户地址后不关弹窗,方便继续展示二维码。
            Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('关闭'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextButton(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: ss58Address));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('账户地址已复制'),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    },
                    child: const Text('复制'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}
