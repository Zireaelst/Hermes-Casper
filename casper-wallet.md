# Casper Testnet Account (Hermes deploy)

> **PUBLIC bilgiler** — buraya ASLA secret key yapıştırma. Secret key sadece
> `casper-keys/secret_key.pem` içinde (git-ignored). Bu dosya commit edilebilir ama gerek yok.

- **Algorithm:** secp256k1
- **Public key (hex):** `0203bc7a84445a8c4a26ce8853e64cbb6acc5be2474ccb9a2651ff12d23a44f02bc5`
- **Secret key:** `casper-keys/secret_key.pem` (git-ignored, taşındı)
- **Explorer:** https://testnet.cspr.live/account/0203bc7a84445a8c4a26ce8853e64cbb6acc5be2474ccb9a2651ff12d23a44f02bc5
  (buradan account hash + bakiyeyi gör — funding'i doğrula)

## Deploy env (Session J — docs/setup/testnet-deploy.md)
```bash
export ODRA_CASPER_LIVENET_SECRET_KEY_PATH=./casper-keys/secret_key.pem
export ODRA_CASPER_LIVENET_NODE_ADDRESS=https://node.testnet.casper.network/rpc
export ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test
```

## Deployed contracts (Casper testnet, 2026-07-06) ✅
- **HermesToken:**      `hash-3db363dfcf10f877c8ce93655ffc7003a632df6e2fecabff13fd7a1a929e905d`
- **AgentRegistry:**    `hash-2135533ff2b3f75d6ecfafedb98427cdf3d4982064d5d7d57f068ec70edcd349`
- **ReputationAnchor:** `hash-8f6d6e6ab2f398cc2e139ab7a77e33d34ecb59953f0825df0277ed459e04cd4f`

x402 asset (token package hash, `hash-` prefix'siz):
`3db363dfcf10f877c8ce93655ffc7003a632df6e2fecabff13fd7a1a929e905d`

Deploy tx'leri (cspr.live/transaction/...):
- token: `fe4d3d96d38542bd0fe1d86e1060b23fb57ac3a5b48c0a7c05ab4d080f3087c7`
- registry: `9c706628941aff2a5d71abff6d930fdfaec00908ef1d29aac7c63a048a8c1541`
- reputation: `6bf6bda7d07f1fbabc9e4d6e188d61026d6920979f5d42cf9a0f6bc3e75cfbb6`
