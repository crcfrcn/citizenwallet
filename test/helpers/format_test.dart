// 验证金额格式、CID显示及账户标识。

import 'package:citizenwallet/helpers/format.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('format', _registerFormat);
  group('cid', _registerCid);
}

// 验证金额的小数位、千分位、币种后缀和既有字符串格式化。

void _registerFormat() {
  group('AmountFormat.format', () {
    test('基本金额格式化', () {
      expect(AmountFormat.format(100), '100.00 元');
      expect(AmountFormat.format(0), '0.00 元');
      expect(AmountFormat.format(99.99), '99.99 元');
    });

    test('千分位分隔', () {
      expect(AmountFormat.format(1234567.89), '1,234,567.89 元');
      expect(AmountFormat.format(1000), '1,000.00 元');
      expect(AmountFormat.format(1000000), '1,000,000.00 元');
    });

    test('自定义小数位', () {
      expect(AmountFormat.format(100, decimals: 0), '100 元');
      expect(AmountFormat.format(100, decimals: 4), '100.0000 元');
    });

    test('无币种后缀', () {
      expect(AmountFormat.format(100, symbol: ''), '100.00');
      expect(AmountFormat.format(1234, symbol: ''), '1,234.00');
    });

    test('自定义币种', () {
      expect(AmountFormat.format(50, symbol: 'BTC'), '50.00 BTC');
    });
  });

  group('AmountFormat.formatString', () {
    test('已有金额字符串添加千分位', () {
      expect(AmountFormat.formatString('1234567.89 GMB'), '1,234,567.89 GMB');
      expect(AmountFormat.formatString('100.00'), '100.00');
    });

    test('已有千分位不重复处理', () {
      // 纯数字 + 后缀
      expect(AmountFormat.formatString('999.99 GMB'), '999.99 GMB');
    });

    test('非数字输入原样返回', () {
      expect(AmountFormat.formatString('abc'), 'abc');
      expect(AmountFormat.formatString(''), '');
    });

    test('无小数部分', () {
      expect(AmountFormat.formatString('1000 GMB'), '1,000 GMB');
    });
  });
}

// 验证CID显示缩写、系统标签及选区复制时恢复完整标识的规则。

void _registerCid() {
  const full = 'GZ018-CREGM-159197206-2026';
  const short = 'GZ018-CREGM-159197206';
  test('display only hides the final CID year and normalizes system labels',
      () {
    expect(formatIdentityCidText(full), short);
    expect(identityCidUiText('CID编号'), identityCidLabel);
    expect(identityCidReviewText('CID编号', full), short);
    expect(identityCidReviewText('姓名', full), full);
    expect(full, 'GZ018-CREGM-159197206-2026');
    expect(formatIdentityCidText(short), short);
    expect(identityCidFieldText('remark', full), full);
    expect(identityCidFieldText('actor_cid_number', full), short);
    expect(identityCidFieldText('admins', '张三 / $full'), '张三 / $short');
    expect(formatIdentityCidText('CN001-NATP4-123456789-10000'),
        'CN001-NATP4-123456789');
    for (final other in [
      '2026-11-22',
      'personal-account:0x1234',
      '0xabcdef',
      'GZ018-CREGM-159197206-20261234567'
    ]) {
      expect(formatIdentityCidText(other), other);
    }
    expect(identityCidUiText('公民CID号 / 居民CID号 / 机构CID号 / 身份ID / 公民号'),
        '身份CID号 / 身份CID号 / 身份CID号 / 身份CID号 / 身份CID号');
  });
  test(
      'selection copying restores full identifiers and preserves partial selection',
      () {
    expect(identityCidSelectionText(full, 0, short.length), full);
    expect(identityCidSelectionText(full, 0, 5), 'GZ018');
    final other = full.replaceFirst('2026', '2036');
    final original = '甲：$full；乙：$other';
    final display = '甲：$short；乙：$short';
    expect(identityCidSelectionText(original, 0, display.length), original);
    expect(identityCidSelectionText(original, 2 + short.length, display.length),
        '；乙：$other');
  });
}
