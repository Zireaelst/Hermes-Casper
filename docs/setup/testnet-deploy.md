# Testnet Deploy Runbook (Session J)

> Deploys the Hermes contracts to Casper **testnet** and points the app at real settlement.
> Everything except this runbook is already built (deploy binary, env template, HTTP facilitator client).
> **Never commit keys.** `*.pem` and `casper-keys/` are git-ignored.

## Prerequisites (one-time)
- Rust + `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`) ✅ installed
- `cargo-odra` (`cargo install cargo-odra --locked`) ✅ installed
- **binaryen** for `wasm-opt` (`brew install binaryen`) — optional; without it `cargo odra build`
  still emits working wasm, just unoptimized (larger, slightly more gas)
- `casper-client` for key generation (`cargo install casper-client`), OR use an existing wallet key
- Docker (only if running the facilitator via the casper-x402 container)

> **Build already verified:** `cargo odra build` produces `wasm/{HermesToken,AgentRegistry,ReputationAnchor}.wasm`
> and `cargo test` passes 8/8. Only steps 1, 2, 4–6 below need your funded key.

## 1. Create + fund an account
Key generation (per https://docs.casper.network/concepts/accounts-and-keys):
```bash
mkdir -p casper-keys
casper-client keygen casper-keys        # writes secret_key.pem, public_key.pem, public_key_hex
```
Fund the `public_key_hex` from the **testnet faucet**: https://testnet.cspr.live/tools/faucet
(one grant per account). Confirm a non-zero balance before deploying.

## 2. Configure env
Copy the deploy vars from `.env.example` into your shell / `.env`:
```bash
export ODRA_CASPER_LIVENET_SECRET_KEY_PATH=./casper-keys/secret_key.pem
export ODRA_CASPER_LIVENET_NODE_ADDRESS=https://node.testnet.casper.network/rpc
export ODRA_CASPER_LIVENET_EVENTS_URL=https://node.testnet.casper.network/events
export ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test
```
> All four are required — Odra livenet listens on the SSE `EVENTS_URL` for deploy execution results.

## 3. Build the wasm — then LOWER it to MVP (required!)
```bash
cd contracts
cargo odra build         # emits wasm/{HermesToken,AgentRegistry,ReputationAnchor}.wasm
```
Recent Rust emits wasm with **bulk-memory + sign-ext** ops, which the Casper VM rejects
(`Wasm preprocessing error: Bulk memory operations are not supported`). Lower each wasm to MVP with
`wasm-opt` (binaryen) — this is the step that actually makes it deployable:
```bash
cd wasm
for w in HermesToken AgentRegistry ReputationAnchor; do
  wasm-opt "$w.wasm" --enable-bulk-memory --enable-sign-ext \
    --signext-lowering --llvm-memory-copy-fill-lowering -O1 -o "$w.tmp.wasm"
  wasm-opt "$w.tmp.wasm" --mvp-features -o "$w.wasm"   # re-emit strict MVP (errors if any feature remains)
  rm -f "$w.tmp.wasm"
done
cd ..
```

## 4. Deploy
```bash
cargo run --bin deploy_testnet --features livenet
```
**Gas:** testnet `block_gas_limit ≈ 812.5 CSPR` per transaction. The HermesToken install (CEP-18 +
CEP-3009) needs ~800 CSPR — `deploy_testnet.rs` sets it to `800_000_000_000` motes (just under the
limit); registry/reputation use `400_000_000_000`. Total ≈ 900 CSPR actually charged. Prints three hashes:
```
HermesToken      : hash-...
AgentRegistry    : hash-...
ReputationAnchor : hash-...
```
Record them in `/docs/contracts` (deploy log) and wire the token hash below.

> **Already deployed once** (2026-07-06) — see `casper-wallet.md` + `docs/contracts/README.md` for the
> live testnet package hashes. Re-run only to redeploy fresh contracts.

## 5. Point the app + facilitator at testnet
- `apps/web/.env.local` (git-ignored): set `X402_PAYMENT_TOKEN_CONTRACT=<HermesToken package hash>`
  and `X402_FACILITATOR_URL=<facilitator url>`.
- **Run the facilitator** (make-software/casper-x402). Verified working procedure:
  ```bash
  git clone --depth 1 https://github.com/make-software/casper-x402
  cd casper-x402/js && pnpm install && pnpm build
  cd examples/facilitator
  # create .env (secret PEM is the funded deployer key; algo secp256k1 for a Casper Wallet key):
  cat > .env <<EOF
  PORT=4022
  CASPER_NETWORKS=casper:casper-test
  SECRET_KEY_ALGO_CASPER_CASPER_TEST=secp256k1
  RPCURL_CASPER_CASPER_TEST=https://node.testnet.casper.network/rpc
  SECRET_KEY_PEM_CASPER_CASPER_TEST="$(cat /path/to/casper-keys/secret_key.pem)"
  EOF
  pnpm exec tsx index.ts   # 🚀 Facilitator listening on http://localhost:4022
  ```
  Verify: `curl localhost:4022/health` → `{"status":"ok"}`; `curl localhost:4022/supported` shows the
  `exact` scheme + `casper:casper-test` + your account as `feePayer`. **Status: running ✅.**
- `apps/web/.env.local`: `X402_FACILITATOR_URL=http://localhost:4022` (done).
- **Remaining:** swap `DemoFacilitator` → `HttpFacilitatorClient` (`apps/web/src/lib/facilitator-http.ts`)
  in `getDeps()` — but first the real signer + HERMES token distribution (below), or `/verify` returns
  `invalid_signature`.

> **⚠️ Critical — EIP-712 domain:** deploy HermesToken with `chain_name` = the **full CAIP-2 id**
> (`casper:casper-test`), NOT bare `casper-test`. The on-chain CEP-3009 domain `chainId` = `chain_name`,
> and the x402 SDK uses `requirements.network` (the CAIP-2 id). A mismatch passes the facilitator's
> off-chain `/verify` but reverts on-chain with `User error: 37003` (InvalidSignature). Verified fix.

## 6. Real settlement — PROVEN ✅ (2026-07-06)
Ran the casper-x402 example trio against HermesToken and settled a real `transfer_with_authorization`
on testnet (tx `66151d11…ef95bf`):
```bash
# facilitator (already running, §5) on :4022
# resource server on :4021 — examples/server/.env:
#   PAYEE_ADDRESS=00<seller account hash>   FACILITATOR_URL=http://localhost:4022
#   CAIP2_CHAIN_ID=casper:casper-test        ASSET_PACKAGE=<HermesToken pkg hash>
#   ASSET_NAME=Hermes Credit                 (must equal the CEP-18 token name)
cd casper-x402/js/examples/server   && pnpm exec tsx index.ts
# client pays (buyer key needs HERMES balance; deployer holds all 1M):
cd ../client && CLIENT_PRIVATE_KEY_PATH=<key> CLIENT_KEY_ALGO=secp256k1 \
  SERVER_URL=http://localhost:4021 pnpm exec tsx index.ts
# → 💰 Payment Details: { success: true, transaction: '66151d11…' }
```
Address format: x402 account addresses are `"00" + <64-hex account hash>` (66 chars).

## 7. The remaining spike (real signing)
`DemoSigner` returns a structurally-valid but not chain-valid signature. Real settlement needs an
**EIP-712 signer** compatible with the facilitator's verification (`casper-eip-712`, seeded by the
token's `chain_name` + name/version). Prove signer↔facilitator compatibility against testnet before
wiring `payment_pay` to the live facilitator — this is the #1 de-risking task and is intentionally the
last step. Until it's green, keep `DemoFacilitator`/`DemoSigner` so the demo stays working.

## Verification
- `cargo odra build` produces three wasm files.
- Deploy prints three hashes; each is queryable on https://testnet.cspr.live.
- A funded test buyer completes one x402 `transfer_with_authorization` with a real deploy hash in the Receipt.
