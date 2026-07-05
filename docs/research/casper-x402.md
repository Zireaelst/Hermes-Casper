# Research: Casper x402

> Source: https://github.com/make-software/casper-x402 (default branch `master`) ·
> Package: `@make-software/casper-x402` (npm) · Upstream: `@x402/core`, `@x402/express`,
> `casper-js-sdk`, `@casper-ecosystem/casper-eip-712` · License: Apache-2.0 · Reviewed: 2026-07-05
>
> **This is the core of Hermes.** Agent-to-agent commerce is settled through this flow.

## Architecture
Monorepo with **two interoperable implementations** (a client built against one works with a server/
facilitator of the other):
- **Go** (`go/`) — server middleware, signers, reference facilitator/resource-server/client + CSPR.click React app, on the official Casper Go SDK.
- **TypeScript** (`js/`) — `@make-software/casper-x402` package + Express demos, on `casper-js-sdk`. **Hermes uses this.**

Both target the same `casper:*` CAIP-2 family and the same CEP-18 `transfer_with_authorization` entry point. Only the **`exact`** scheme is implemented, backed by the `casper-ecosystem/casper-eip-712` typed-data spec.

Three roles:
- **Resource server** — exposes a paid endpoint; challenges with `402`, forwards payments to the facilitator, returns the protected response.
- **Client** — on `402`, builds + signs an EIP-712 authorization and replays the request with a payment header.
- **Facilitator** — verifies the signed authorization and settles it on-chain (pays gas, submits the CEP-18 deploy). It is the only role that holds a funded Casper key.

## The x402 payment flow (verified)
```
C = Client   R = Resource Server   F = Facilitator   N = Casper Network
1. C -> R : GET /resource
2. R -> C : 402 Payment Required  + PAYMENT-REQUIRED header (base64 JSON PaymentRequirements)
3. C      : build ExactCasperPayload = EIP-712 signed TransferWithAuthorization
4. C -> R : GET /resource  + PAYMENT-SIGNATURE header (base64 JSON PaymentPayload)
5. R -> F : POST /verify  then POST /settle
6. F -> N : transfer_with_authorization deploy on the CEP-18 contract (F pays gas)
7. N -> F : deploy execution result
8. R -> C : 200 OK + PAYMENT-RESPONSE header (settlement details)
```

### HTTP headers (exact names)
- **`PAYMENT-REQUIRED`** — on the 402; base64-encoded JSON `PaymentRequirements`.
- **`PAYMENT-SIGNATURE`** — client → server on retry; base64-encoded JSON `PaymentPayload`.
- **`PAYMENT-RESPONSE`** — on the 200; base64-encoded JSON settlement result (`transaction`, `network`, `payer`, `requirements`).
- Facilitator auth: optional `Authorization` header via `FACILITATOR_API_KEY`.

### PaymentRequirements (Casper fields)
`scheme:"exact"`, `network` (CAIP-2), `payTo` (66-char `00`-prefixed account-hash), `amount` (base units string), `asset` (64-char CEP-18 contract-**package** hash), `extra.name` + `extra.version` + `extra.decimals` (seed the EIP-712 domain), `maxTimeoutSeconds` (e.g. 900).

### PaymentPayload → `payload`
`signature` (130 hex = 65 bytes), `publicKey` (65/68 hex, algo-prefixed), and `authorization`:
`from`, `to` (both `00<64hex>`), `value` (base units), `validAfter`, `validBefore` (unix secs), `nonce` (64 hex = 32 bytes).

## APIs — Facilitator HTTP (default port `4022`)
- **`GET /supported`** → `{ kinds: [{ x402Version:2, scheme, network, extra:{ feePayer, decimals, name, version } }] }`. `extra.feePayer` = facilitator's own account hash (pays gas).
- **`POST /verify`** → validates payload vs requirements, no chain writes → `{ isValid, payer, invalidReason?, invalidMessage? }`.
- **`POST /settle`** → verify → build deploy → sign → put_deploy → wait → `{ success, transaction (deploy hash), network, payer, errorReason?, errorMessage? }`.
- **`GET /health`** → `{ status:"ok" }`, unauthenticated.

### Facilitator validation rules (enforced for Casper)
- `scheme=="exact"`, `payload.network == requirements.network`.
- `authorization.to == requirements.payTo`; `authorization.value == requirements.amount` (both non-zero).
- `asset` is 64-hex CEP-18 package hash; `validAfter <= now <= validBefore`; `validBefore - now >= 6s`.
- `extra.name` + `extra.version` present (EIP-712 domain); signature is 65 bytes and verifies against the `TransferWithAuthorization` EIP-712 digest.
- Error codes: `unsupported_scheme, network_mismatch, malformed_payload, pay_to_mismatch, amount_mismatch, invalid_pay_to, invalid_amount, invalid_asset, not_yet_valid, payload_expired, insufficient_time, missing_token_name/version, failed_to_hash, invalid_signature`; settlement adds `verification_failed, build_deploy_failed, sign_deploy_failed, put_deploy_failed, wait_deploy_failed`.

## SDK usage (TypeScript)
```bash
npm install @make-software/casper-x402   # peers: @x402/core, casper-js-sdk, @casper-ecosystem/casper-eip-712
```
Package internals: `exact/client`, `exact/server`, `exact/facilitator`, `signer.ts` (`ClientCasperSigner` /
facilitator signer on `casper-js-sdk`), `types.ts`, `utils.ts`, `constants.ts`. Root exports
`NETWORK_CASPER_MAINNET` (`casper:casper`) and `NETWORK_CASPER_TESTNET` (`casper:casper-test`).

### Server (Express) — protect a route
```typescript
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactCasperScheme } from "@make-software/casper-x402/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const casperScheme = new ExactCasperScheme()
  .registerAsset(chainID, assetPackage, 9)
  .registerMoneyParser(() => Promise.resolve(assetAmount)); // { asset, amount, extra:{name,version,decimals} }

app.use(paymentMiddleware(
  { "GET /weather": { accepts: [{ scheme: "exact", price: "$0.001", network: chainID, payTo: payeeAddress }],
                      description: "Get weather data", mimeType: "application/json" } },
  new x402ResourceServer(facilitatorClient).register(chainID, casperScheme),
));
```

### Server env (from `.env.template`)
`PAYEE_ADDRESS` (66-char account-hash), `FACILITATOR_URL` (default `http://localhost:4022`),
`FACILITATOR_API_KEY?`, `CAIP2_CHAIN_ID` (e.g. `casper:casper-test`), `ASSET_PACKAGE` (64-char CEP-18
package hash), `ASSET_NAME`, `PORT` (4021), `LOG_LEVEL`.

## Network identifiers (CAIP-2)
`casper:casper` (mainnet), `casper:casper-test` (testnet), `casper:casper-net-1` (NCTL local).

## Best Practices
- Amount is a **base-unit string** (e.g. `"7500000000"` at 9 decimals = 7.5 tokens). Human price like `"$0.001"` is parsed server-side via the money parser. Never do float math on amounts.
- Keep the facilitator as the **only funded key**; clients only sign authorizations (no gas). Agents never hold node RPC creds.
- Treat `validAfter`/`validBefore`/`nonce` as replay protection — enforce single-use nonces and short windows (`>=6s` remaining required).
- Interop is real: a Hermes TS client can pay a Go server and vice-versa.

## Common Patterns
- **Paid agent service:** wrap a Hermes agent capability endpoint with `paymentMiddleware`; the buying agent's x402 client auto-pays on 402.
- **Verify-then-settle:** call `/verify` for a cheap pre-check (e.g. during negotiation), `/settle` to finalize an Order.
- **Receipt trail:** persist `PAYMENT-RESPONSE.transaction` (deploy hash) + payer/payee/amount/nonce as a Hermes **Receipt**.

## Limitations
- Only the `exact` scheme (fixed amount) — no streaming/subscription/variable pricing out of the box.
- CEP-18-token-only settlement (not native CSPR transfer). Requires a deployed CEP-18 token contract as the `asset`.
- Facilitator is a trusted, funded service; its availability + key security are critical (SPOF for settlement).
- EIP-712 signing scheme is Ethereum-style typed data adapted to Casper via `casper-eip-712` — verify signer compatibility with the chosen wallet (CSPR.click).

## Integration Opportunities (Hermes)
- **Run our own facilitator** (from the JS example) so Hermes controls settlement, gas, and receipts.
- Expose every purchasable agent capability as an x402-protected MCP tool / HTTP endpoint.
- Gate the client's signing step behind the LangGraph **policy gate** (budget/allowlist/HITL) before building the authorization — see [[langgraph-agents]] skill.
- Mirror settlement events (deploy hash → status) into Supabase for the UI (Receipts, Orders).

## Notes specific to Hermes
- The **Payment/Settlement** domain objects map directly onto x402: Payment = signed `PaymentPayload`; Settlement = facilitator `/settle` result (deploy hash + status); Receipt = persisted `PAYMENT-RESPONSE`.
- Contract design in [[odra-contracts]] must stay consistent with CEP-18 `transfer_with_authorization` semantics; do not invent alternative settlement paths.
- Config to thread through Hermes env: `X402_FACILITATOR_URL`, `X402_PAYMENT_TOKEN_CONTRACT` (asset package hash), `CASPER_NETWORK_NAME` (CAIP-2), payee account-hash.

## Open Questions
- Which CEP-18 token is Hermes's unit of account on testnet (deploy our own vs use an existing one)?
- Do we host one shared facilitator or per-tenant? Key custody + gas funding model?
- Wallet signing: does CSPR.click produce the EIP-712 signature the facilitator expects, or is a dedicated signer needed for autonomous agents (no human)?
