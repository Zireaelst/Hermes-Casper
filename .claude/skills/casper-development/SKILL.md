---
name: casper-development
description: Playbook for building on the Casper Network — RPC, deploys, keys/wallets, CSPR.click and CSPR.cloud, events, and SDK usage (casper-js-sdk). Use when interacting with Casper chain data, wallets, or network APIs.
---

# Casper Development

## Purpose
Ground all Casper interactions in verified, current APIs and safe key handling.

## Scope
Casper RPC & deploys, account/keys, CEP-18/CEP-78 assets, events/streaming, CSPR.click (wallet connect
+ auth) and CSPR.cloud (indexed data/API), and `casper-js-sdk` usage from `packages/shared`.

## Best Practices
- **Verify every API via Context7 / official docs** (`docs.casper.network`) before use — never invent
  RPC methods, deploy args, or SDK signatures.
- Isolate chain access behind an adapter interface in `packages/shared`; UI never calls RPC directly.
- Use CSPR.click for wallet connection/signing in the browser; use CSPR.cloud for read/indexed data.
- Prefer testnet (`casper-test`) for all development; parameterize network via env, never hardcode.
- Handle deploy lifecycle explicitly: build → sign → put_deploy → poll status → confirm finality.

## Constraints
- Never handle raw private keys in app code or logs. Signing happens in the wallet (CSPR.click).
- Money paths are idempotent and fail closed; store deploy/tx ids and reconcile via events.
- Read data from the Casper MCP is convenience only — not a source of truth for design decisions.

## Common Patterns
- **Adapter + Zod:** wrap RPC/cloud responses, validate with Zod, expose typed domain functions.
- **Event indexer:** subscribe to contract events → normalize → write to Supabase → Realtime to UI.
- **Wallet flow:** CSPR.click connect → session → sign deploy → submit → track status in UI.

## Hermes notes
Payments/settlement go through x402 (see `x402-payments` skill); this skill covers the surrounding
chain plumbing (accounts, deploys, events, wallet, indexed reads).
