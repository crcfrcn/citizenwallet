// 导出统一二维码设备适配接口，向业务层提供识别原文。

library;

export 'scanner_backend.dart'
    show ScannerCandidatesCallback, ScannerDeviceBackend;
export 'scanner_controller.dart' show ScannerController;
export 'scanner_failure.dart' show ScannerFailure, ScannerFailureKind;
export 'scanner_view.dart' show ScannerView;
