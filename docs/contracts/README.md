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
| **HermesToken** (CEP-18 + CEP-3009) | `hash-3db363dfcf10f877c8ce93655ffc7003a632df6e2fecabff13fd7a1a929e905d` | `fe4d3d96…3087c7` |
| **AgentRegistry** | `hash-2135533ff2b3f75d6ecfafedb98427cdf3d4982064d5d7d57f068ec70edcd349` | `9c706628…8c1541` |
| **ReputationAnchor** | `hash-8f6d6e6ab2f398cc2e139ab7a77e33d34ecb59953f0825df0277ed459e04cd4f` | `6bf6bda7…5cfbb6` |

- x402 asset = HermesToken package hash without the `hash-` prefix.
- Explorer: `https://testnet.cspr.live/transaction/<tx>`. Deployer: see `casper-wallet.md`.
- Cost ≈ 900 CSPR total. wasm was MVP-lowered with `wasm-opt` before deploy (see runbook §3).
