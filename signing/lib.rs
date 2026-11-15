//! 公民钱包离线签名库：保留 sr25519，并复用 mldsa 的 ML-DSA-65 与传输接口。

mod sr25519;
pub use mldsa::ffi::*;

export_citizen_signer_ffi!();
