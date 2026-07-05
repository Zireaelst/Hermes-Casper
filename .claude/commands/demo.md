---
description: Build/verify an end-to-end demo of a Hermes flow and capture evidence (screenshots).
argument-hint: <flow, e.g. "agent discovers, negotiates, pays, settles">
---

Demo flow: **$ARGUMENTS**

Use the **qa** subagent, `testing` skill, and **Playwright MCP**. Steps:
1. Identify the shortest real path that exercises the flow end-to-end (UI + agent + x402 + chain).
2. Ensure the app is running (`pnpm dev`); drive it with Playwright; assert on UI + on-chain/DB state.
3. Capture screenshots at each key step and save under `docs/product/demo/<kebab-flow>/`.
4. Write a short runbook (`docs/product/demo/<kebab-flow>.md`) so the demo is reproducible.
5. Report what worked and any gaps truthfully — no faked results.
