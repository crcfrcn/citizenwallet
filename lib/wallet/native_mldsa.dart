import 'dart:convert';
import 'dart:ffi';
import 'dart:typed_data';
import 'package:ffi/ffi.dart';
import 'native_sr25519.dart';

/// 算法、哈希与二维码分帧均复用 runtime/transaction/mldsa。
final class NativeMldsa {
  NativeMldsa._();
  static const publicBytes = 1952, signatureBytes = 3309;
  static final _lib = NativeSr25519.library;
  static final _defaultAlgorithm =
      _lib.lookupFunction<Uint8 Function(), int Function()>(
          'gmb_mldsa_default_algorithm');
  static int get defaultAlgorithm => _defaultAlgorithm();
  static final _public = _lib.lookupFunction<
      Int32 Function(Pointer<Uint8>, Pointer<Uint8>),
      int Function(Pointer<Uint8>, Pointer<Uint8>)>('gmb_mldsa_public_key');
  static final _account = _lib.lookupFunction<
      Int32 Function(Pointer<Uint8>, Pointer<Uint8>),
      int Function(Pointer<Uint8>, Pointer<Uint8>)>('gmb_mldsa_account_id');
  static final _sign = _lib.lookupFunction<
      Int32 Function(Pointer<Uint8>, Pointer<Uint8>, UintPtr, Pointer<Uint8>,
          Pointer<Uint8>),
      int Function(Pointer<Uint8>, Pointer<Uint8>, int, Pointer<Uint8>,
          Pointer<Uint8>)>('gmb_mldsa_sign');
  static final _signatureEncode = _lib.lookupFunction<
      Int32 Function(Pointer<Uint8>, Pointer<Uint8>, Pointer<Uint8>),
      int Function(Pointer<Uint8>, Pointer<Uint8>,
          Pointer<Uint8>)>('gmb_mldsa_signature_encode');
  static final _signatureDecode = _lib.lookupFunction<
      Int32 Function(Pointer<Uint8>, UintPtr, Pointer<Uint8>, Pointer<Uint8>,
          Pointer<Uint8>),
      int Function(Pointer<Uint8>, int, Pointer<Uint8>, Pointer<Uint8>,
          Pointer<Uint8>)>('gmb_mldsa_signature_decode');
  static final _verify = _lib.lookupFunction<
      Int32 Function(Pointer<Uint8>, Pointer<Uint8>, Pointer<Uint8>, UintPtr),
      int Function(Pointer<Uint8>, Pointer<Uint8>, Pointer<Uint8>,
          int)>('gmb_mldsa_verify');
  static final _review = _lib.lookupFunction<
      Int32 Function(Pointer<Uint8>, Pointer<Uint8>, UintPtr, Pointer<Uint8>),
      int Function(Pointer<Uint8>, Pointer<Uint8>, int,
          Pointer<Uint8>)>('gmb_mldsa_review_message');
  static final _frames = _lib.lookupFunction<
      Int32 Function(
          Pointer<Uint8>, UintPtr, Pointer<Uint8>, UintPtr, Pointer<UintPtr>),
      int Function(Pointer<Uint8>, int, Pointer<Uint8>, int,
          Pointer<UintPtr>)>('gmb_qr_encode');
  static final _join = _lib.lookupFunction<
      Int32 Function(
          Pointer<Uint8>, UintPtr, Pointer<Uint8>, UintPtr, Pointer<UintPtr>),
      int Function(Pointer<Uint8>, int, Pointer<Uint8>, int,
          Pointer<UintPtr>)>('gmb_qr_join');
  static Pointer<Uint8> _copy(List<int> bytes) {
    final pointer = calloc<Uint8>(bytes.isEmpty ? 1 : bytes.length);
    pointer.asTypedList(bytes.length).setAll(0, bytes);
    return pointer;
  }

  static void _free(Pointer<Uint8> pointer, int length) {
    pointer.asTypedList(length).fillRange(0, length, 0);
    calloc.free(pointer);
  }

  static void _check(int result) {
    if (result != 0) throw StateError('ML-DSA native operation failed');
  }

  static Uint8List _fixed(List<int> input, int expected, int outputBytes,
      int Function(Pointer<Uint8>, Pointer<Uint8>) call) {
    if (input.length != expected) {
      throw ArgumentError('Invalid native input length');
    }
    final source = _copy(input), output = calloc<Uint8>(outputBytes);
    try {
      _check(call(source, output));
      return Uint8List.fromList(output.asTypedList(outputBytes));
    } finally {
      _free(source, input.length);
      _free(output, outputBytes);
    }
  }

  static Uint8List publicKey(List<int> child) =>
      _fixed(child, 32, publicBytes, _public);
  static Uint8List accountId(List<int> public) =>
      _fixed(public, publicBytes, 32, _account);
  static ({Uint8List publicKey, Uint8List signature}) sign(
      List<int> child, List<int> message) {
    if (child.length != 32) {
      throw ArgumentError('Account seed must be 32 bytes');
    }
    final seed = _copy(child),
        data = _copy(message),
        public = calloc<Uint8>(publicBytes),
        signature = calloc<Uint8>(signatureBytes);
    try {
      _check(_sign(seed, data, message.length, public, signature));
      return (
        publicKey: Uint8List.fromList(public.asTypedList(publicBytes)),
        signature: Uint8List.fromList(signature.asTypedList(signatureBytes))
      );
    } finally {
      _free(seed, 32);
      _free(data, message.length);
      _free(public, publicBytes);
      _free(signature, signatureBytes);
    }
  }

  /// 此处仅分配 FFI 缓冲区，信封格式与编解码规则由统一 Rust 核心处理。
  static Uint8List encodeSignature(List<int> public, List<int> signature) {
    if (public.length != publicBytes || signature.length != signatureBytes) {
      throw ArgumentError('签名接口输入长度无效');
    }
    final key = _copy(public),
        sig = _copy(signature),
        out = calloc<Uint8>(publicBytes + signatureBytes);
    try {
      _check(_signatureEncode(key, sig, out));
      return Uint8List.fromList(out.asTypedList(publicBytes + signatureBytes));
    } finally {
      _free(key, public.length);
      _free(sig, signature.length);
      _free(out, publicBytes + signatureBytes);
    }
  }

  static ({Uint8List? publicKey, Uint8List signature}) decodeSignature(
      List<int> wire) {
    if (wire.length > publicBytes + signatureBytes) {
      throw ArgumentError('签名接口输入超长');
    }
    final input = _copy(wire),
        public = calloc<Uint8>(publicBytes),
        signature = calloc<Uint8>(signatureBytes),
        algorithm = calloc<Uint8>();
    try {
      _check(
          _signatureDecode(input, wire.length, public, signature, algorithm));
      if (algorithm.value != 1 && algorithm.value != 2) {
        throw StateError('原生签名接口返回未知算法');
      }
      final pq = algorithm.value == 2;
      return (
        publicKey:
            pq ? Uint8List.fromList(public.asTypedList(publicBytes)) : null,
        signature:
            Uint8List.fromList(signature.asTypedList(pq ? signatureBytes : 64)),
      );
    } finally {
      _free(input, wire.length);
      _free(public, publicBytes);
      _free(signature, signatureBytes);
      calloc.free(algorithm);
    }
  }

  static bool verify(List<int> public, List<int> signature, List<int> message) {
    if (public.length != publicBytes || signature.length != signatureBytes) {
      return false;
    }
    final key = _copy(public), sig = _copy(signature), data = _copy(message);
    try {
      return _verify(key, sig, data, message.length) == 0;
    } finally {
      _free(key, public.length);
      _free(sig, signature.length);
      _free(data, message.length);
    }
  }

  static Uint8List reviewMessage(List<int> account, List<int> review) {
    if (account.length != 32) throw ArgumentError('AccountId must be 32 bytes');
    final id = _copy(account), data = _copy(review), out = calloc<Uint8>(32);
    try {
      _check(_review(id, data, review.length, out));
      return Uint8List.fromList(out.asTypedList(32));
    } finally {
      _free(id, 32);
      _free(data, review.length);
      _free(out, 32);
    }
  }

  static String? _text(String input, bool joining) {
    final bytes = utf8.encode(input),
        source = _copy(utf8.encode(input)),
        required = calloc<UintPtr>();
    Pointer<Uint8>? out;
    try {
      final call = joining ? _join : _frames;
      final status = call(source, bytes.length, nullptr, 0, required);
      if (status == 1 && joining) return null;
      _check(status);
      if (required.value > 196608) throw StateError('QR output exceeds bound');
      out = calloc<Uint8>(required.value == 0 ? 1 : required.value);
      _check(call(source, bytes.length, out, required.value, required));
      return utf8.decode(out.asTypedList(required.value));
    } finally {
      _free(source, bytes.length);
      if (out != null) calloc.free(out);
      calloc.free(required);
    }
  }

  static List<String> frames(String text) => _text(text, false)!.split('\n');
  static String? joinFrames(Iterable<String> frames) =>
      _text(frames.join('\n'), true);
}
