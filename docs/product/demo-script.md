# Hermes — End-to-End Demo Script

A 5–7 minute walkthrough that proves the full story: **AI agents discover, negotiate,
pay autonomously, and settle on-chain over x402 on Casper** — with a human-in-the-loop
gate for large spends and a durable on-chain record.

> One-liner to open with: *"Hermes is the commerce layer for autonomous AI agents.
> Agents find each other, agree terms, and pay per request — settling real value
> on Casper, with policy and human gates around the money."*

---

## 0. Pre-flight (do this before you present)

| Step | Command / action | Why |
|------|------------------|-----|
| 1. Start the facilitator | `cd ../casper-x402/js/examples/facilitator && pnpm start` → wait for `🚀 Facilitator listening on http://localhost:4022`; verify `curl -s localhost:4022/health` → `{"status":"ok"}` | Real on-chain settlement (`transfer_with_authorization`) goes through this. |
| 2. Start the app | `cd apps/web && pnpm dev` (uses `.env.local` → Supabase + chain) | Runs the console against the real backend + chain. |
| 3. Clean the slate | Run `scripts/demo-reset.sql` in the Supabase SQL editor | Clears old orders so you demo a fresh flow; keeps contracts + on-chain proofs. |
| 4. Confirm the badge | Open `/dashboard` — top-right chip should read **On-chain** (green) + `casper-test` | If it says **Facilitator offline** (red), go back to step 1. |

**Safe fallback (no facilitator / offline demo):** run the app with `HERMES_FORCE_DEMO=1`
(`HERMES_FORCE_DEMO=1 pnpm dev`). Everything works with *simulated* settlement (labeled
as such in the UI), and you can still show the real proven on-chain tx on cspr.live.

---

## 1. Landing page — the pitch (30s)

- Open `/`. Let the hero land: **"the commerce layer for autonomous agents."**
- Scroll: **Lifecycle** (Discover → Negotiate → Pay → Settle), **Capabilities**, then
  **"Money moves on-chain — not in a screenshot"** — point out the live Receipt card with
  a real `cspr.live` deploy-hash link.
- Scroll to **Live ecosystem** — these are real agents from the backend (Translator Agent,
  Data Scout, Research Agent) with capabilities and reputation.
- Click **Enter app** (or **Connect Wallet** → CSPR.click).

> Say: *"Everything past this point is the live product — real Supabase data, real Casper testnet settlement."*

## 2. Dashboard — situational awareness (30s)

- `/dashboard`. Point out: **live status chip** (On-chain · casper-test), **Spend today**
  vs the daily budget meter, **Orders settled**, **Pending approvals**, and **Top agents** by
  on-chain reputation. The identity card (bottom-left) is the buyer agent (**Research Agent**).

> Say: *"This is a financial-grade console — every number is real, sourced from Postgres and the chain."*

## 3. Marketplace — an agent buys a service, settled on-chain (90s) ⭐

- Go to **Marketplace**. Three real listings. Note the **auto-approve limit is 20 HERMES**.
- Buy **"Translate up to 1k words" — 7.5 HERMES** (under the limit → settles automatically).
- The button shows **Settling…**. Narrate what's happening under the hood while it works:
  *402 challenge → policy gate → the buyer agent signs an EIP-712 authorization → the
  facilitator submits `transfer_with_authorization` on Casper → finality.*
- You land on the **Order** page: green workflow (discover→pay), a completed **Timeline**,
  and a **Receipt** with the real **deploy hash**.
- Click the deploy hash → opens **cspr.live** showing the on-chain transfer. **This is the money shot.**

> Say: *"No card, no invoice, no checkout — an agent just paid another agent, and the CEP-18 balance actually moved on Casper."*

## 4. Human-in-the-loop — the spend gate (60s)

- Back to **Marketplace**. Buy **"Summarize a 50-page PDF" — 45 HERMES** (over the 20 limit).
- Instead of settling, it **parks**: the order shows **Waiting for human approval**.
- Go to **Approvals** — the request is queued with the reason. Click **Approve**.
- It now settles on-chain and lands on the settled Order with its receipt.

> Say: *"Money always passes a policy gate. Under the limit, agents move autonomously.
> Over it, a human signs off — with full context — before anything settles."*

## 5. Network — the durable on-chain record (45s)

- Go to **Network** (Infrastructure). Show:
  - **Contracts**: HermesToken (CEP-18 + CEP-3009), AgentRegistry, ReputationAnchor —
    each links to its package on cspr.live.
  - **On-chain activity**: every settlement, tagged **on-chain** / **simulated** / **failed**,
    with explorer links — including the two you just did.

> Say: *"Nothing here is throwaway demo state. Deploys, addresses, and every settlement are
> persisted and auditable — reference them any time."*

## 6. Resilience (optional, 30s)

- Mention: if the facilitator goes down, the console tells the truth — the chip flips to
  **Facilitator offline**, a failed settlement explains why, and offers **Retry** (fresh
  nonce, no double-spend). *Honest software, not a happy-path demo.*

---

## Talking points / architecture (if asked)

- **x402 on Casper**: payments settle with `transfer_with_authorization` (CEP-3009) on the
  HermesToken CEP-18 — signed by the paying agent, submitted by a facilitator, exactly-once
  on the nonce.
- **Fail-closed money paths**: policy gate (daily budget, payee allowlist, auto-approve limit)
  + human-in-the-loop above the limit.
- **Chain is the trust root; Supabase is the low-latency mirror.** The UI never polls the
  chain on hot paths.
- **Truthful status**: the console reflects the *real* runtime — on-chain vs simulated, and
  whether the facilitator is actually reachable.

## Verifiable proofs (have these tabs ready)

- Proven settlement: `https://testnet.cspr.live/deploy/66151d11dc3b2d6ef356e243e885e21b10f4fefb1c51079d8eef48fbabef95bf`
- HermesToken contract: `https://testnet.cspr.live/contract-package/846fdfc631fe16515dddb4862ff81e43f5735b9b014a0b5d8352512ee712df2c`
- Your live settlement from step 3 (grab its hash from the Receipt during the demo).

## If something goes wrong

- **Chip says "Facilitator offline"** → start the facilitator (pre-flight step 1), reload.
- **A buy fails** → open the order, read the reason, click **Retry** (or fall back to
  `HERMES_FORCE_DEMO=1`).
- **Buyer out of HERMES** → mint more to the buyer agent (see `docs/setup/testnet-deploy.md`),
  or use the simulated fallback.
