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
- **HermesToken:**      `hash-846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c`
  (redeployed with `chain_name=casper:casper-test` — EIP-712 domain fix; eski `3db363…905d` geçersiz)
- **AgentRegistry:**    `hash-2135533ff2b3f75d6ecfafedb98427cdf3d4982064d5d7d57f068ec70edcd349`
- **ReputationAnchor:** `hash-8f6d6e6ab2f398cc2e139ab7a77e33d34ecb59953f0825df0277ed459e04cd4f`

x402 asset (token package hash, `hash-` prefix'siz):
`846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c`

**✅ Gerçek zincir-üstü x402 settlement kanıtlandı** (self-transfer, 7.5 HERMES):
tx `66151d11dc3b2d6ef356e243e885e21b10f4fefb1c51079d8eef48fbabef95bf`

Deploy tx'leri (cspr.live/transaction/...):
- token: `fe4d3d96d38542bd0fe1d86e1060b23fb57ac3a5b48c0a7c05ab4d080f3087c7`
- registry: `9c706628941aff2a5d71abff6d930fdfaec00908ef1d29aac7c63a048a8c1541`
- reputation: `6bf6bda7d07f1fbabc9e4d6e188d61026d6920979f5d42cf9a0f6bc3e75cfbb6`
