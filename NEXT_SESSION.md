# Next Session Pointer

**Read this file first. It is always current.** Full backlog: `docs/product/task-planning.md` § MVP Session Plan.

## MVP profile (locked — do not re-litigate)
- Agent/payment logic runs **in-process TS** inside `apps/web` — no Python/LangGraph service for MVP.
- Signer + Facilitator are **one collapsed TS module** (`packages/shared` or `services/facilitator`) —
  demo key from env var, not real KMS. Labeled as a pre-production shortcut, not a redesign.
- Contracts: build + test against **Odra's local test env only** until the dedicated deploy session.
- No separate indexer service for MVP — poll deploy status on demand from a server action.
- These are deviations from the Phase 2 production architecture, made deliberately for session-budget
  reasons. Do not "fix" them back without asking first.

## Session template (apply every time)
1. Read only this file + the one linked task's row in `task-planning.md`. Do not explore the repo.
2. Scope every command to the package: `pnpm --filter <pkg> <script>` (not the repo-wide `-r` scripts)
   unless the session's exit criterion says otherwise.
3. Do the one artifact. No docs beyond a one-line status update.
4. Run the exit command. If green: commit (small, per established style), update the
   "Current position" section below, push.
5. Stop. Do not start the next session's task.

## Current position
- **Done:** Sessions A–C (foundation + 3 Odra contracts, 8/8 tests, nightly-2026-01-01 pinned),
  F1+G (x402 codecs, policy gate, payForOrder orchestrator — 15/15 tests), H+I (Next.js 16 console:
  dashboard/marketplace/orders/approvals; both money paths verified live in the browser),
  **K** (workflow canvas via React Flow, live reputation, Playwright E2E 2/2 for both money paths,
  demo runbook + screenshot),
  **D** (real Supabase: project `hermes`/gyerdxtaspppyxdqybpn; migrations + seed applied; env-gated
  data layer in `apps/web/src/lib/data.ts` with SupabaseRepo; both money paths verified persisting to
  Postgres). App auto-uses Supabase when `apps/web/.env.local` is present, else in-memory demo.
  E2E forces demo mode: `cd apps/web && pnpm exec playwright test`.
  - **J-prep (done, credential-free):** wasm toolchain installed; `cargo odra build` verified →
    `contracts/wasm/{HermesToken,AgentRegistry,ReputationAnchor}.wasm`; deploy binary
    `contracts/bin/deploy_testnet.rs` (`--features livenet`) + `contracts/Odra.toml`; `HttpFacilitatorClient`
    drop-in (`apps/web/src/lib/facilitator-http.ts`); full runbook `docs/setup/testnet-deploy.md`.
- **Session J — contracts DEPLOYED to testnet ✅ (2026-07-06):** HermesToken/AgentRegistry/ReputationAnchor
  live on `casper-test` (hashes in `casper-wallet.md` + `docs/contracts/README.md`). Deployer key
  `casper-keys/secret_key.pem` (secp256k1, git-ignored), ~3188 CSPR left. Token hash wired into
  `apps/web/.env.local` (`X402_PAYMENT_TOKEN_CONTRACT`). Gotchas solved + documented: wasm must be
  MVP-lowered via `wasm-opt`; livenet needs `EVENTS_URL`; gas ≤ 812.5 CSPR block limit (token=800).
- **Facilitator RUNNING ✅:** make-software/casper-x402 cloned to `../casper-x402`; its
  `js/examples/facilitator` runs on `http://localhost:4022` (secp256k1 deployer key = feePayer;
  `/health` + `/supported` verified). Restart: see `docs/setup/testnet-deploy.md` §5.
  `X402_FACILITATOR_URL` set in `apps/web/.env.local`.
- **Remaining — real settlement:** (1) distribute HERMES to a buyer account (deployer holds all 1M),
  (2) real x402 **client signer** via `@make-software/casper-x402` `toClientCasperSigner` so the app
  produces an EIP-712 sig the facilitator accepts, (3) swap `DemoSigner`+`DemoFacilitator` →
  real signer + `HttpFacilitatorClient` in `getDeps()`. Until then demo mode stays on.
- Demo mode currently powers the app end-to-end (in-memory store, simulated settlement — labeled in UI).
