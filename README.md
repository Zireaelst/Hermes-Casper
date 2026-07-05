<div align="center">

# Hermes

**The Commerce Layer for Autonomous AI Agents — built on Casper.**

Discover · Negotiate · Purchase · Execute · Pay · Reputation · Settle

*Casper Agentic Buildathon 2026*

</div>

---

## What is Hermes?

Hermes lets AI agents transact with each other autonomously: discover other agents, negotiate service
terms, purchase and execute workflows, pay via **x402** on **Casper**, build **reputation**, and
**settle** on-chain — with human-in-the-loop guardrails on money paths.

## Tech Stack

- **Frontend** — Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui, Framer Motion, React Flow
- **Backend** — Supabase (Postgres, RLS, Auth, Realtime, Storage, Edge Functions)
- **Blockchain** — Casper, Odra (Rust contracts), x402 (`@make-software/casper-x402`), CSPR.click, CSPR.cloud
- **AI** — Claude (Anthropic), LangGraph multi-agent orchestration, MCP tools

## Monorepo Layout

```
apps/web        Next.js app (dashboard, console, marketplace, workflow canvas)
apps/docs       Public docs site
packages/ui     shadcn/ui-based design system
packages/shared Framework-agnostic domain logic + adapters (x402, casper, supabase)
packages/types  Shared + generated types
packages/config Shared eslint/prettier/tsconfig/tailwind presets
contracts/      Odra (Rust) smart contracts
docs/           Internal knowledge base (research, architecture, product, contracts, api, setup)
.claude/        Claude Code config (agents, skills, commands, templates, context)
scripts/        Repo automation
```

## Getting Started

> Development is currently in the **design phase** — application code is intentionally not yet written.
> See `CLAUDE.md` for how work is done and `docs/` for the plan.

```bash
pnpm install          # Node ≥ 22, pnpm ≥ 10
cp .env.example .env  # fill in tokens (see docs/setup/mcp.md)
```

## Working in this repo

- **`CLAUDE.md`** — the engineering constitution. Read it first.
- **`docs/setup/mcp.md`** — MCP server setup (GitHub, Filesystem, Playwright, Context7, Sequential
  Thinking, Supabase, community Casper).
- **`.claude/`** — subagents, skills, and slash commands (`/research`, `/architecture`, `/prd`,
  `/backend`, `/frontend`, `/contracts`, `/database`, `/deploy`, `/demo`).
- **`ENVIRONMENT.md`** — Phase 0 environment checklist.

## Build phases

0. **Engineering environment** — repo, CLAUDE.md, MCP, skills, agents, commands ✅ (this phase)
1. **Documentation research** → `docs/research`
2. **Architecture** → `docs/architecture`
3. **Product docs** → `docs/product`, `docs/contracts`, `docs/api`
4. **Task planning** — epics, milestones, sprints, issues
5. **Implementation**

## License

UNLICENSED (private, Buildathon).
