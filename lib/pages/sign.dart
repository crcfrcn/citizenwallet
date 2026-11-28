// 展示登录请求，确认后为指定账户签名并显示响应二维码。

import 'dart:async';
import 'package:citizenwallet/helpers/format.dart';
import 'package:citizenwallet/helpers/sensitive.dart';
import 'package:citizenwallet/pages/theme.dart';
import 'package:citizenwallet/protocol/qr.dart';
import 'package:citizenwallet/signing/labels.dart';
import 'package:citizenwallet/signing/login.dart';
import 'package:citizenwallet/signing/qr.dart';
import 'package:citizenwallet/signing/service.dart';
import 'package:citizenwallet/wallet/manager.dart';
import 'package:flutter/material.dart';

/// 登录签名页面：显示登录签名请求详情 → 用户确认 → 签名 → 展示签名响应 QR。
class LoginSignPage extends StatefulWidget {
  const LoginSignPage({
    super.key,
    required this.account,
    required this.walletName,
    required this.raw,
  });

  /// 签名主体账户（由 ScanPage 按 QR 的 signerPublicKey 定位后传入）。
  final Account account;
  final String walletName;
  final String raw;

  @override
  State<LoginSignPage> createState() => _LoginSignPageState();
}

class _LoginSignPageState extends State<LoginSignPage> {
  LoginSignRequestEnvelope? _request;
  LoginSignResponseEnvelope? _response;
  String? _error;
  bool _signing = false;
  Timer? _timer;
  int _remainingSeconds = 0;

  @override
  void initState() {
    super.initState();
    _parseSignRequest();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _parseSignRequest() {
    try {
      final request = parseLoginSignRequest(widget.raw);
      if (isLoginSignRequestExpired(request)) {
        setState(() => _error = '登录二维码已过期');
        return;
      }
      if (!loginRequestTargetsAccountId(request, widget.account.accountId)) {
        setState(() => _error = '登录二维码指定的账户与当前账户不一致');
        return;
      }
      final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      setState(() {
        _request = request;
        _remainingSeconds = (request.expiresAt ?? 0) - now;
      });
      _startCountdown();
    } on LoginQrException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = '解析失败: $e');
    }
  }

  void _startCountdown() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _remainingSeconds--;
        if (_remainingSeconds <= 0) {
          _timer?.cancel();
          if (_response == null) {
            _error = '登录二维码已过期';
          }
        }
      });
    });
  }

  Future<void> _confirmAndSign() async {
    final request = _request;
    if (request == null || _signing) return;
    // 私钥调用前再次校验目标账户，避免页面状态变化后误用其他账户签名。
    if (!loginRequestTargetsAccountId(request, widget.account.accountId)) {
      setState(() => _error = '登录二维码指定的账户与当前账户不一致');
      return;
    }

    setState(() => _signing = true);

    try {
      final walletManager = WalletManager();
      // 响应使用目标 AccountId，签名算法由该账户的派生来源确定。
      final signMessage = buildSignMessage(request, widget.account.accountId);
      final result = await walletManager.signUtf8ForAccount(
        widget.account.accountId,
        signMessage,
      );

      final response = buildLoginSignResponse(
        request: request,
        signerPublicKey: result.signerPublicKey,
        signatureHex: result.signatureHex,
      );

      if (!mounted) return;
      setState(() {
        _response = response;
        _signing = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '签名失败: $e';
        _signing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceDark,
      appBar: AppBar(
        title: const Text('登录确认'),
        backgroundColor: AppTheme.surfaceDark,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
      ),
      body: SafeArea(
        child: _error != null
            ? _buildError()
            : _response != null
                ? _buildResponse()
                : _request != null
                    ? _buildConfirm()
                    : const Center(child: CircularProgressIndicator()),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.redAccent),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: const TextStyle(color: Colors.redAccent, fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('返回'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConfirm() {
    final c = _request!;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            color: AppTheme.surfaceCard,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '扫码登录',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _infoRow('系统', loginSystemDisplayName(c)),
                  _infoRow(
                    '账户',
                    '${widget.walletName} · ${widget.account.accountName}',
                  ),
                  _infoRow(
                    '地址',
                    _shortenSs58Address(widget.account.ss58Address),
                  ),
                  _infoRow(
                    '剩余时间',
                    _remainingSeconds > 0 ? '$_remainingSeconds秒' : '已过期',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '确认后将使用当前钱包签名登录 ${loginSystemDisplayName(c)}',
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
            textAlign: TextAlign.center,
          ),
          const Spacer(),
          ElevatedButton(
            onPressed:
                _signing || _remainingSeconds <= 0 ? null : _confirmAndSign,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: AppTheme.primary,
            ),
            child: _signing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('确认登录', style: TextStyle(fontSize: 16)),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildResponse() {
    final json = _response!.toRawJson();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        children: [
          const SizedBox(height: 16),
          const Text(
            '请用登录页面扫描此二维码',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            loginSystemDisplayName(_request!),
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                ),
                child: AnimatedSigningQr(
                  data: json,
                  size: 280,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('完成'),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style:
                  const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  String _shortenSs58Address(String ss58Address) {
    if (ss58Address.length <= 16) return ss58Address;
    return '${ss58Address.substring(0, 8)}...'
        '${ss58Address.substring(ss58Address.length - 8)}';
  }
}

// 审阅扫码传入的离线签名请求，在本机签名并展示响应二维码。

/// 离线签名页面。
///
/// 扫码与账户定位由 [ScanPage] 全局完成并传入 [account]+[raw];本页只解析该
/// 签名请求、展示中文摘要、在本机完成签名并展示响应二维码(不再自带扫码)。
class OfflineSignPage extends StatefulWidget {
  const OfflineSignPage({
    super.key,
    required this.account,
    required this.walletName,
    required this.raw,
  });

  /// 签名主体账户（由 ScanPage 按 QR 的 signerPublicKey 定位后传入）。
  final Account account;
  final String walletName;
  final String raw;

  @override
  State<OfflineSignPage> createState() => _OfflineSignPageState();
}

class _OfflineSignPageState extends State<OfflineSignPage> {
  final OfflineSignService _offlineSignService = OfflineSignService();
  Timer? _timer;
  bool _signing = false;
  SignRequestEnvelope? _request;
  SignResponseEnvelope? _response;
  OfflineSignVerification? _verification;
  String? _parseError;
  int _remainingSeconds = 0;
  bool _screenshotGuardActive = false;
  int _securityEpoch = 0;

  @override
  void initState() {
    super.initState();
    unawaited(_prepareRequest());
  }

  Future<void> _prepareRequest() async {
    try {
      // 签名请求及响应二维码仅在平台保护就绪后才进入页面状态。
      await ScreenshotGuard.enable(_onSecurityEvent);
      if (!mounted) {
        await ScreenshotGuard.disable(_onSecurityEvent);
        return;
      }
      _screenshotGuardActive = true;
      _parseRequest(widget.raw);
    } catch (_) {
      if (mounted) setState(() => _parseError = '屏幕保护不可用，签名内容已隐藏');
    }
  }

  void _onSecurityEvent(String event) {
    if (!mounted ||
        (event != 'screenshot_taken' &&
            event != 'screen_recording_started' &&
            event != 'protection_failed')) {
      return;
    }
    _securityEpoch++;
    _timer?.cancel();
    setState(() {
      _request = null;
      _response = null;
      _verification = null;
      _parseError = '检测到屏幕采集或保护失效，签名内容已隐藏';
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    if (_screenshotGuardActive) {
      unawaited(ScreenshotGuard.disable(_onSecurityEvent));
    }
    super.dispose();
  }

  int _secondsLeft(SignRequestEnvelope request) {
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final left = (request.expiresAt ?? 0) - now;
    return left > 0 ? left : 0;
  }

  void _startCountdown(SignRequestEnvelope request) {
    _timer?.cancel();
    _remainingSeconds = _secondsLeft(request);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _remainingSeconds = _secondsLeft(request);
      });
    });
  }

  void _parseRequest(String raw) {
    try {
      final request = _offlineSignService.parseRequest(raw);
      final verification = _offlineSignService.verifyPayload(request);
      if (!mounted) return;
      setState(() {
        _request = request;
        _verification = verification;
      });
      _startCountdown(request);
    } on QrSignException catch (e) {
      if (!mounted) return;
      setState(() => _parseError = e.message);
    }
  }

  Future<void> _signRequest() async {
    final request = _request;
    // 同一个已扫描请求只允许进入一次密钥签名：签名进行中或
    // 已生成响应二维码时直接返回，不叠加任何确认签名。
    if (request == null ||
        _signing ||
        _response != null ||
        !_screenshotGuardActive ||
        !ScreenshotGuard.canDisplaySensitiveContent) {
      return;
    }
    final epoch = _securityEpoch;
    if (_remainingSeconds <= 0) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('签名请求已过期，请重新扫描')));
      return;
    }

    setState(() {
      _signing = true;
    });
    try {
      final response = await _offlineSignService.signParsedRequest(
        accountId: widget.account.accountId,
        request: request,
      );
      if (!mounted ||
          epoch != _securityEpoch ||
          !ScreenshotGuard.canDisplaySensitiveContent) {
        return;
      }
      setState(() {
        _response = response;
      });
    } on OfflineSignException catch (e) {
      if (!mounted) return;
      _showError('离线签名失败', e.message);
    } on WalletAuthException catch (e) {
      if (!mounted) return;
      _showError('身份验证', e.message);
    } catch (e) {
      if (!mounted) return;
      _showError('离线签名失败', '$e');
    } finally {
      if (mounted) {
        setState(() {
          _signing = false;
        });
      }
    }
  }

  Future<void> _showError(String title, String message) async {
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(identityCidUiText(message)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('确定'),
          ),
        ],
      ),
    );
  }

  String _truncate(String text, {int head = 12, int tail = 8}) {
    if (text.length <= head + tail + 3) return text;
    return '${text.substring(0, head)}...${text.substring(text.length - tail)}';
  }

  // 扫码确认页字段名必须显示中文,翻译单源在 signer/field_labels.dart。

  Widget _buildTransactionDetails(
    SignRequestEnvelope request,
    OfflineSignVerification verification,
  ) {
    final decoded = verification.decoded;
    final rejected = verification.status == SignDecisionStatus.reject;
    // normal 但无逐字段解码 = runtime 升级哈希签(verifyPayload 唯一产生该组合的路径):
    // 合法可签,只是内容是 32B 摘要而非可逐字段展开的交易。
    final hashOnly = !rejected && decoded == null;

    final Widget statusBanner;
    switch (verification.status) {
      case SignDecisionStatus.normal:
        statusBanner = _buildBanner(
          color: AppTheme.success,
          icon: Icons.verified_rounded,
          text: hashOnly ? '签名状态正常，升级摘要哈希已核对，可以签名' : '签名状态正常，内容已完整中文解释，可以签名',
        );
      case SignDecisionStatus.reject:
        statusBanner = _buildBanner(
          color: AppTheme.danger,
          icon: Icons.dangerous_rounded,
          text: verification.rejectReason ?? '签名请求已拒绝',
        );
    }

    final actionLabel = verification.actionLabel ?? '未登记签名动作';

    // 三分支,消除“绿 banner 可以签名 + 明细却写拒绝签名”的自相矛盾:
    // 拒绝态 → 拒绝行;正常且有解码 → 逐字段;正常且哈希签 → 摘要说明。
    final List<Widget> detailRows;
    if (rejected) {
      detailRows = [
        _detailRow('交易类型', identityCidUiText(actionLabel)),
        _detailRow('状态', '拒绝签名'),
        _detailRow('原因', identityCidUiText(verification.rejectReason ?? '签名请求已拒绝')),
      ];
    } else if (decoded != null) {
      detailRows = [
        _detailRow('交易类型', identityCidUiText(actionLabel)),
        ...decoded.reviewFields.entries.map((e) {
          final label = fieldLabelTextOrNull(e.key);
          return _detailRow(identityCidUiText(label ?? '未翻译字段'), identityCidFieldText(e.key, fieldValueText(e.key, e.value)));
        }),
      ];
    } else {
      // hash-only:runtime 升级仅对 32B 摘要签名,原始 WASM 留在发起端 session。
      detailRows = [
        _detailRow('交易类型', identityCidUiText(actionLabel)),
        _detailRow('签名内容', '32 字节升级摘要（哈希）'),
        _detailRow('说明', 'Runtime 升级仅对 32 字节摘要签名，原始升级内容留在发起端'),
      ];
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        statusBanner,
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: AppTheme.cardDecoration(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: detailRows,
          ),
        ),
      ],
    );
  }

  Widget _buildBanner({
    required Color color,
    required IconData icon,
    required String text,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: AppTheme.bannerDecoration(color),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              identityCidUiText(text),
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequestSummary(SignRequestEnvelope request) {
    final expired = _remainingSeconds <= 0;
    final verification = _verification;
    final isRejected = verification?.status == SignDecisionStatus.reject;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // 有效期横幅
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: AppTheme.bannerDecoration(
            expired ? AppTheme.danger : AppTheme.success,
          ),
          child: Row(
            children: [
              Icon(
                expired ? Icons.timer_off_rounded : Icons.timer_rounded,
                color: expired ? AppTheme.danger : AppTheme.success,
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                expired ? '签名请求已过期，请重新扫描' : '签名请求有效期剩余：${_remainingSeconds}s',
                style: TextStyle(
                  color: expired ? AppTheme.danger : AppTheme.success,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // 请求基本信息
        Container(
          padding: const EdgeInsets.all(16),
          decoration: AppTheme.cardDecoration(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _detailRow('请求 ID', request.id ?? ''),
              _detailRow(
                '签名账户',
                // 占号/换绑:请求 b.u 留空(signerPublicKeyHex getter 对空 u 会抛),
                // 按动作判断展示用户自选的绑定账户,不触碰会抛异常的 getter。
                _truncate(
                  QrActions.isSelfAccountDomainAction(request.body.action)
                      ? widget.account.accountId
                      : request.body.signerPublicKeyHex,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (verification != null)
          _buildTransactionDetails(request, verification),
        const SizedBox(height: 16),
        if (isRejected) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: AppTheme.bannerDecoration(AppTheme.danger),
            child: Text(
              identityCidUiText(verification?.rejectReason ?? '签名请求已拒绝'),
              style: const TextStyle(
                color: AppTheme.danger,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('返回'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed:
                    (_signing || expired || isRejected) ? null : _signRequest,
                child: _signing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('确认签名'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildResponseView(SignResponseEnvelope response) {
    final responseJson = response.toRawJson();
    final signerPublicKey = response.body.signerPublicKeyHex;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // 成功横幅
        _buildBanner(
          color: AppTheme.success,
          icon: Icons.check_circle_rounded,
          text: '签名已完成，请用在线手机扫描下方签名响应二维码',
        ),
        const SizedBox(height: 24),
        // QR 码容器
        Center(
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppTheme.radiusLg),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withAlpha(20),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: AnimatedSigningQr(data: responseJson, size: 360),
          ),
        ),
        const SizedBox(height: 20),
        // 信息
        Container(
          padding: const EdgeInsets.all(16),
          decoration: AppTheme.cardDecoration(),
          child: Column(
            children: [
              _detailRow('请求 ID', response.id ?? ''),
              _detailRow('签名账户', _truncate(signerPublicKey)),
            ],
          ),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('完成'),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final request = _request;
    final response = _response;
    final parseError = _parseError;
    return Scaffold(
      appBar: AppBar(title: const Text('扫码签名'), centerTitle: true),
      body: parseError != null
          ? _buildParseError(parseError)
          : response != null
              ? _buildResponseView(response)
              : request != null
                  ? _buildRequestSummary(request)
                  : const Center(child: CircularProgressIndicator()),
    );
  }

  Widget _buildParseError(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 56, color: AppTheme.danger),
            const SizedBox(height: 16),
            Text(
              identityCidUiText(message),
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.danger, fontSize: 15),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('返回'),
            ),
          ],
        ),
      ),
    );
  }
}
