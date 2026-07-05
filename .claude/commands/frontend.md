---
description: Implement or modify frontend UI (apps/web, packages/ui) per the design system.
argument-hint: <task, e.g. "build marketplace list page" | "workflow canvas node">
---

Frontend task: **$ARGUMENTS**

Use the **frontend** subagent (and **ui-designer** for new visual patterns). Rules:
- Server Components by default; `"use client"` only when needed. Compose shadcn/ui via `packages/ui`.
- Tailwind + tokens only; Framer Motion for subtle motion; design all states; WCAG AA.
- Verify Next/React/Tailwind APIs via **Context7**; keep business logic in `packages/shared`.
- Verify the result with the **Playwright MCP** (interaction + screenshot) before marking done.
- Run `pnpm lint && pnpm typecheck && pnpm test`. Report truthfully. Commit/push only if I ask.
