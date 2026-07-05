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
export ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test
```

## 3. Build the wasm
```bash
cd contracts
cargo odra build         # emits wasm/HermesToken.wasm, AgentRegistry.wasm, ReputationAnchor.wasm
```

## 4. Deploy
```bash
cargo run --bin deploy_testnet --features livenet
```
Prints three hashes:
```
HermesToken      : hash-...
AgentRegistry    : hash-...
ReputationAnchor : hash-...
```
Record them in `/docs/contracts` (deploy log) and wire the token hash below.

## 5. Point the app + facilitator at testnet
- `apps/web/.env.local` (git-ignored): set `X402_PAYMENT_TOKEN_CONTRACT=<HermesToken package hash>`
  and `X402_FACILITATOR_URL=<facilitator url>`.
- Run the **make-software/casper-x402** facilitator against HermesToken (its funded gas key = your
  account). See its `js/examples/facilitator` README; endpoints `/supported /verify /settle /health`
  (shapes in `docs/research/casper-x402.md`).
- Swap the app's `DemoFacilitator` → `HttpFacilitatorClient` (already written,
  `apps/web/src/lib/facilitator-http.ts`) in `getDeps()`.

## 6. The remaining spike (real signing)
`DemoSigner` returns a structurally-valid but not chain-valid signature. Real settlement needs an
**EIP-712 signer** compatible with the facilitator's verification (`casper-eip-712`, seeded by the
token's `chain_name` + name/version). Prove signer↔facilitator compatibility against testnet before
wiring `payment_pay` to the live facilitator — this is the #1 de-risking task and is intentionally the
last step. Until it's green, keep `DemoFacilitator`/`DemoSigner` so the demo stays working.

## Verification
- `cargo odra build` produces three wasm files.
- Deploy prints three hashes; each is queryable on https://testnet.cspr.live.
- A funded test buyer completes one x402 `transfer_with_authorization` with a real deploy hash in the Receipt.
