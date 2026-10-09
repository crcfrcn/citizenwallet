# CitizenWallet

公民钱包，面向离线冷钱包管理与二维码交易签名。

本仓库独立自有代码采用 [MIT](LICENSE) 许可证；第三方代码、依赖及其衍生修改遵循各自原许可证。

目录与构建合同见 [CitizenWallet 技术文档](CitizenWallet.md)。源码目录最多三级；正式脚本及其测试归同一文件，测试位于实现之后。图标原件唯一存放在 `icons/`，平台尺寸仅在任务工程中生成。

本仓 Node 合同回归入口：

```sh
node --test .github/tatagate/test.mjs scripts/build.mjs scripts/flow.mjs scripts/resources.mjs scripts/ci/android.mjs scripts/ci/ios.mjs scripts/release/android.mjs scripts/release/ios.mjs test/release_manifest.test.mjs
```

需要真实工具的用例消费已验真的产品工具输入；此命令不代替 Flutter、Rust、双端打包或真机验收。构建辅助入口为 `node scripts/build.mjs wallet <ios|android|prepare-ios|prepare-android>` 与 `node scripts/build.mjs native <目标>`；完整流程以 `scripts/flows.json` 和 `scripts/flow.mjs` 为准。测试和构建生成物仅属于本仓 `target/test` 与 `target/build`。
