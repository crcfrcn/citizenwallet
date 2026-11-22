// 校验账户标识为小写0x前缀的32字节十六进制公钥文本。

library;

final RegExp _accountIdPattern = RegExp(r'^0x[0-9a-f]{64}$');

/// `value` 是否为规范 `account_id` 文本。
bool isAccountIdText(String value) => _accountIdPattern.hasMatch(value);
