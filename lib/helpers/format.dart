// 校验账户标识为小写0x前缀的32字节十六进制公钥文本。

library ;

final RegExp _accountIdPattern = RegExp(r'^0x[0-9a-f]{64}$');

/// `value` 是否为规范 `account_id` 文本。
bool isAccountIdText(String value) => _accountIdPattern.hasMatch(value);

// 格式化金额的小数位、千分位和可选币种后缀。

class AmountFormat {
  AmountFormat._();

  /// 将数值格式化为带千分位逗号的字符串。
  ///
  /// [amount] 金额数值
  /// [decimals] 小数位数，默认 2
  /// [symbol] 货币单位后缀，默认 '元'，传空字符串则不加
  ///
  /// ```dart
  /// AmountFormat.format(1234567.89)       // "1,234,567.89 元"
  /// AmountFormat.format(100)              // "100.00 元"
  /// AmountFormat.format(100, symbol: '')  // "100.00"
  /// ```
  static String format(
    double amount, {
    int decimals = 2,
    String symbol = '元',
  }) {
    final fixed = amount.toStringAsFixed(decimals);
    final formatted = _addThousandSeparator(fixed);
    return symbol.isEmpty ? formatted : '$formatted $symbol';
  }

  /// 将已有的金额字符串添加千分位逗号。
  ///
  /// 自动识别并保留末尾的币种后缀（如 " 元"）。
  ///
  /// ```dart
  /// AmountFormat.formatString("1234567.89 元")  // "1,234,567.89 元"
  /// AmountFormat.formatString("100.00")           // "100.00"
  /// ```
  static String formatString(String value) {
    final match = RegExp(r'^([\d.]+)(.*)$').firstMatch(value.trim());
    if (match == null) return value;
    final numPart = match.group(1)!;
    final suffix = match.group(2)!;
    return '${_addThousandSeparator(numPart)}$suffix';
  }

  static String _addThousandSeparator(String numStr) {
    final parts = numStr.split('.');
    final intPart = parts[0].replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]},',
    );
    final decimal = parts.length > 1 ? '.${parts[1]}' : '';
    return '$intPart$decimal';
  }
}

// 缩写展示CID并统一系统标签，复制完整选区时恢复原始完整标识。

const identityCidLabel = '身份CID号';
final _identityCidPattern = RegExp(
  r'(?<![A-Za-z0-9-])([A-Z0-9]{5}-[A-Z0-9]{5}-[0-9]{9})-[0-9]{4,10}(?![A-Za-z0-9-])',
);

String formatIdentityCidText(String value) => value.replaceAllMapped(
      _identityCidPattern,
      (match) => match.group(1)!,
    );

/// 仅用于系统标签/提示；不用于昵称、聊天正文或用户文档。
String identityCidUiText(String value) =>
    formatIdentityCidText(value).replaceAll(
      RegExp(
          r'机构身份CID号|身份\s*ID|(?:公民|居民|机构|身份)\s*CID(?:\s*(?:编号|号码|号))?|公民号|(?:身份\s*)?CID\s*(?:编号|号码|号)|\bCID(?![A-Za-z0-9_])'),
      identityCidLabel,
    );

/// 显示选区映射回原文；完整选中的短号仍复制完整 CID，其他选区原样保留。
String identityCidSelectionText(String original, int start, int end) {
  final display = formatIdentityCidText(original);
  if (start < 0 || end < start || end > display.length) return '';
  int originalOffset(int offset) {
    var hidden = 0;
    for (final match in _identityCidPattern.allMatches(original)) {
      final displayEnd = match.start - hidden + match.group(1)!.length;
      if (offset < displayEnd) break;
      hidden += match.group(0)!.length - match.group(1)!.length;
    }
    return offset + hidden;
  }

  return original.substring(originalOffset(start), originalOffset(end));
}

/// 按既有字段语义格式化确认页，用户备注、姓名和正文保持原文。
String identityCidFieldText(String key, String value) {
  const composite = {
    'admins',
    'governance_detail',
    'issuer',
    'target',
    'houses',
    'fee_payer_description',
    'execution_fee_payer_description',
    'operation_fee_payer_description',
    'contact_list',
  };
  return key == 'cid_number' ||
          key.endsWith('_cid_number') ||
          composite.contains(key)
      ? formatIdentityCidText(value)
      : value;
}

/// 已有中文审阅条目只在身份字段上隐藏年份，姓名和其他内容不改。
String identityCidReviewText(String label, String value) =>
    identityCidUiText(label).contains(identityCidLabel)
        ? formatIdentityCidText(value)
        : value;
