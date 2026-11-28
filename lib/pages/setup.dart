// 选择助记词规格并创建钱包，在受保护页面完成助记词备份。

import 'package:citizenwallet/helpers/sensitive.dart';
import 'package:citizenwallet/pages/mnemonic.dart';
import 'package:citizenwallet/pages/theme.dart';
import 'package:citizenwallet/wallet/manager.dart';
import 'package:citizenwallet/wallet/password.dart';
import 'package:flutter/material.dart';

/// 创建新钱包页面。
///
/// 选择助记词阶段保留正常返回；生成助记词进入备份展示后，
/// 禁止系统返回与边缘返回手势，仅允许“已备份，完成”退出。
class CreateWalletPage extends StatefulWidget {
  const CreateWalletPage({super.key});

  @override
  State<CreateWalletPage> createState() => _CreateWalletPageState();
}

class _CreateWalletPageState extends State<CreateWalletPage>
    with SensitivePageMixin {
  final WalletManager _walletManager = WalletManager();
  bool _creating = false;
  int _wordCount = 12;
  WalletCreationResult? _result;
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    late final WalletPassword password;
    try {
      password = WalletPassword.parse(_passwordController.text);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      return;
    }
    if (!await confirmWalletPasswordUse(context, password) || !mounted) return;
    if (!await ensureScreenshotProtection()) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('屏幕保护不可用，无法创建钱包')));
      }
      return;
    }
    // password 只参与本次派生，确认后立即清空输入框且绝不持久化。
    _passwordController.clear();
    setState(() => _creating = true);
    try {
      final result = await _walletManager.createWallet(
        wordCount: _wordCount,
        password: password.value,
      );
      if (!mounted) return;
      setState(() => _result = result);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('创建失败：$e')));
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  void _confirmBackup() {
    if (_result == null) return;
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final page = _result != null && sensitiveContentHidden
        ? _buildProtectedPlaceholder()
        : Scaffold(
            appBar: AppBar(
              title: const Text('创建钱包'),
              centerTitle: true,
              automaticallyImplyLeading: _result == null,
            ),
            body: _result != null ? _buildMnemonicView() : _buildCreateView(),
          );
    // 生成前不注册返回拦截，保留原有按钮、系统返回和 iOS 左缘手势。
    if (_result == null) return page;
    // 仅已生成助记词的备份展示阶段拦截所有用户返回。
    return PopScope<bool>(canPop: false, child: page);
  }

  Widget _buildProtectedPlaceholder() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('创建钱包'),
        centerTitle: true,
        automaticallyImplyLeading: _result == null,
      ),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.shield, size: 56),
            const SizedBox(height: 16),
            Text(
              sensitiveProtectionFailed
                  ? '屏幕保护不可用，助记词已隐藏'
                  : '助记词已隐藏；如尚未备份，请稍后在钱包详情中验证查看',
            ),
            if (sensitiveProtectionFailed) ...[
              const SizedBox(height: 20),
              FilledButton(
                onPressed: retryScreenshotProtection,
                child: const Text('重试屏幕保护'),
              ),
            ],
            if (_result != null) ...[
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _confirmBackup,
                child: const Text('已备份，完成'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCreateView() {
    // 从顶部开始排布，避免内容随可用高度垂直居中后落得过低；ListView 同时保证小屏不溢出。
    return ListView(
      padding: const EdgeInsets.fromLTRB(32, 16, 32, 32),
      children: [
        Column(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary.withAlpha(50),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Icon(
                Icons.add_rounded,
                size: 36,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              '选择助记词数量',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 32),
            // 选中态仅用原有颜色区分，不显示勾号；词数选项与下方密码框同宽。
            SizedBox(
              width: double.infinity,
              child: SegmentedButton<int>(
                showSelectedIcon: false,
                segments: const [
                  ButtonSegment(value: 12, label: Text('12 个单词')),
                  ButtonSegment(value: 18, label: Text('18 个单词')),
                  ButtonSegment(value: 24, label: Text('24 个单词')),
                ],
                selected: {_wordCount},
                onSelectionChanged: (v) => setState(() => _wordCount = v.first),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              // 18 词说明与实际 192 位熵一致；12/24 词说明保持原样。
              _wordCount == 24
                  ? '256 位熵，安全性更高'
                  : _wordCount == 18
                      ? '192 位熵，词数与安全性平衡'
                      : '128 位熵，标准安全强度',
              style: const TextStyle(
                color: AppTheme.textTertiary,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: WalletPasswordField(controller: _passwordController),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: 260,
              child: FilledButton(
                onPressed: _creating ? null : _create,
                child: _creating
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('创建钱包'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMnemonicView() {
    final result = _result!;
    final words = result.mnemonic.split(' ');
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // 警告横幅
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: AppTheme.bannerDecoration(AppTheme.warning),
          child: const Row(
            children: [
              Icon(
                Icons.warning_amber_rounded,
                color: AppTheme.warning,
                size: 20,
              ),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  '请安全保存助记词；设置密码时还必须单独记住密码',
                  style: TextStyle(
                    color: AppTheme.warning,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        // 助记词卡片
        Container(
          padding: const EdgeInsets.all(20),
          decoration: AppTheme.cardDecoration(radius: AppTheme.radiusLg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(
                    Icons.key_rounded,
                    color: AppTheme.primaryLight,
                    size: 18,
                  ),
                  SizedBox(width: 8),
                  Text(
                    '助记词（请手抄备份，不支持复制）',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: List.generate(words.length, (i) {
                  return Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceElevated,
                      borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: '${i + 1}. ',
                            style: const TextStyle(
                              color: AppTheme.textTertiary,
                              fontFamily: 'monospace',
                              fontSize: 13,
                            ),
                          ),
                          TextSpan(
                            text: words[i],
                            style: const TextStyle(
                              color: AppTheme.textPrimary,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        // 钱包信息卡片
        Container(
          padding: const EdgeInsets.all(16),
          decoration: AppTheme.cardDecoration(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      gradient: AppTheme.primaryGradient,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.account_balance_wallet_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    result.wallet.walletName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                result.primaryAccount.ss58Address,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                  fontFamily: 'monospace',
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 28),
        FilledButton(onPressed: _confirmBackup, child: const Text('已备份，完成')),
      ],
    );
  }
}

// 通过助记词和可选密码导入钱包，校验输入并提示导入结果。

/// 导入钱包页面（通过助记词）。
class ImportWalletPage extends StatefulWidget {
  const ImportWalletPage({super.key});

  @override
  State<ImportWalletPage> createState() => _ImportWalletPageState();
}

class _ImportWalletPageState extends State<ImportWalletPage>
    with SensitivePageMixin {
  final WalletManager _walletManager = WalletManager();
  final TextEditingController _mnemonicController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _importing = false;

  @override
  void dispose() {
    _mnemonicController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _import() async {
    final mnemonic = _mnemonicController.text.trim();
    if (mnemonic.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请输入助记词')),
      );
      return;
    }

    // 在密码确认前提示词数错误；钱包导入入口仍会独立执行同一闭集校验。
    final wordCount = mnemonic.split(RegExp(r'\s+')).length;
    if (wordCount != 12 && wordCount != 18 && wordCount != 24) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('助记词必须为 12、18 或 24 个单词')),
      );
      return;
    }

    setState(() => _importing = true);
    try {
      final password = WalletPassword.parse(_passwordController.text);
      if (!await confirmWalletPasswordUse(context, password) || !mounted) {
        return;
      }
      final result = await _walletManager.importWallet(
        mnemonic,
        password: password.value,
      );
      _mnemonicController.clear();
      _passwordController.clear();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('已导入「${result.wallet.walletName}」')),
      );
      Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('导入失败：$e')),
      );
    } finally {
      if (mounted) setState(() => _importing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (sensitiveContentHidden) {
      return buildHiddenPlaceholder(message: '助记词输入已隐藏');
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('输入助记词'),
        centerTitle: true,
      ),
      // 候选词 Wrap 位于输入框**下方**，键盘升起时最容易被盖住。
      // 顶部留白压到最小、标题与输入框间距收紧，把输入框和候选区整体上提，
      // 让候选词落在键盘上沿之上。
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
        children: [
          Bip39InputField(controller: _mnemonicController, wordCount: 0),
          const SizedBox(height: 16),
          WalletPasswordField(controller: _passwordController),
          const SizedBox(height: 28),
          FilledButton(
            onPressed: _importing ? null : _import,
            child: _importing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('导入钱包'),
          ),
        ],
      ),
    );
  }
}
