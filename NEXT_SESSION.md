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
- **Session L — light-first landing + design tokens ✅ (2026-07-07):** new **light-first** design system
  (warm off-white surface, deep green accent, Inter) replaces dark-first as the source of truth
  (deliberate override of CLAUDE.md §9; `docs/product/design-system.md` updated, other UI docs flagged).
  Semantic tokens live in `@theme` in `apps/web/src/app/globals.css` (Tailwind v4 — no `packages/config`
  preset); light values scoped under `.theme-light`, dark console keeps `:root`. Built the marketing
  landing at `app/(marketing)/` (hero spec: Inter, blink cursor, `useTypewriter`, motion drop-ins,
  mouse-scrub / mobile-autoplay background video, multi-select capability pills + AnimatePresence banner),
  rebranded Hermes®. Console routes moved into `app/(app)/` group (pure move, unchanged styling). Flow
  verified with Playwright: **landing → Connect Wallet (CSPR.click, CDN client) → /dashboard**, with
  `HERMES_FORCE_DEMO=1` demo entry + graceful fallback when the SDK is unavailable. Screenshots in
  `docs/product/demo/hermes-landing-*.png`. lint + typecheck + `next build` green.
  - **⚠️ Placeholder to replace before demo:** background video URL (third-party CloudFront asset) in
    `BackgroundVideo.tsx`; CSPR.click `appId` (`csprclick-template`) in `useCsprClick.ts` → real Hermes appId.
  - **↪ Follow-up (needs approval):** migrate the dark console (`(app)/dashboard/marketplace/orders/approvals`)
    to the light-first design system. Not touched this session by scope guardrail.
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
- **✅ REAL x402 SETTLEMENT PROVEN ON TESTNET (2026-07-06):** ran casper-x402 server(4021)+facilitator(4022)
  +client with our HermesToken → on-chain `transfer_with_authorization` succeeded, tx
  `66151d11…ef95bf`. **Signer/domain spike solved:** the token's `chain_name` must be the full CAIP-2
  `casper:casper-test` (redeployed → `846fdfc6…12df2c`). Facilitator config in `../casper-x402/js/examples/{facilitator,server}/.env`.
- **✅ APP INTEGRATION DONE — the Hermes app itself settles on-chain (2026-07-06):** `apps/web/src/lib/x402-real.ts`
  uses casper-x402's client `ExactCasperScheme` + `createClientCasperSigner` to sign, posts to the
  facilitator `/settle`; `actions.ts` runs the policy gate then records a real Payment+Receipt.
  Verified: "Buy now" in the app → real testnet tx `69951a62…be233c`, deploy hash persisted in Supabase
  + shown in the UI Receipt. Wire payload nests requirements under `accepted` (not top-level scheme/network).
  Chain mode gated by env (`X402_FACILITATOR_URL` + `X402_PAYMENT_TOKEN_CONTRACT` + `HERMES_BUYER_KEY_PATH`,
  off when `HERMES_FORCE_DEMO=1`); demo + Supabase modes still work (E2E green).
  **To run chain mode:** start facilitator (`../casper-x402/js/examples/facilitator`, §5) + `pnpm dev`.
- **MVP COMPLETE.** Optional next: mint HERMES to distinct buyer/seller agents for varied balances;
  wire the on-chain AgentRegistry/ReputationAnchor; production hardening of the collapsed facilitator.
- Demo mode currently powers the app end-to-end (in-memory store, simulated settlement — labeled in UI).
