# Contracts Documentation Index

| Doc | Scope |
|-----|-------|
| [smart-contract-specification.md](./smart-contract-specification.md) | Odra contract set: HermesToken (CEP-18), AgentRegistry, ReputationAnchor, optional Escrow — entry points, events, errors, tests |

Related: [architecture/11-smart-contract](../architecture/11-smart-contract.md) ·
[research/odra](../research/odra.md) · [research/casper-x402](../research/casper-x402.md) ·
skill `odra-contracts`. Deploy how-to: [setup/testnet-deploy.md](../setup/testnet-deploy.md).

## Deploy log — Casper testnet (`casper-test`), 2026-07-06
| Contract | Package hash | Deploy tx |
|----------|--------------|-----------|
| **HermesToken** (CEP-18 + CEP-3009) | `hash-846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c` | `846fdfc6…` |
| **AgentRegistry** | `hash-2135533ff2b3f75d6ecfafedb98427cdf3d4982064d5d7d57f068ec70edcd349` | `9c706628…8c1541` |
| **ReputationAnchor** | `hash-8f6d6e6ab2f398cc2e139ab7a77e33d34ecb59953f0825df0277ed459e04cd4f` | `6bf6bda7…5cfbb6` |

- **HermesToken was redeployed** with `chain_name="casper:casper-test"` (the EIP-712 domain `chainId`
  must equal the x402 CAIP-2 network id, else on-chain sig verify reverts `37003`). Old token
  `3db363…905d` is superseded.
- x402 asset = HermesToken package hash without the `hash-` prefix.
- **✅ Real on-chain x402 settlement proven** end-to-end (casper-x402 client + facilitator, 7.5 HERMES
  `transfer_with_authorization`): tx `66151d11dc3b2d6ef356e243e885e21b10f4fefb1c51079d8eef48fbabef95bf`.
- Explorer: `https://testnet.cspr.live/transaction/<tx>`. Deployer: see `casper-wallet.md`.
