//! 公民钱包离线签名库：密码学复用mldsa，二维码传输只调用公共协议核心。

mod sr25519;
pub use mldsa::ffi::*;

export_citizen_signer_ffi!();
qr_protocol::export_transport!(wallet_qr_open, wallet_qr_step, wallet_qr_close);
