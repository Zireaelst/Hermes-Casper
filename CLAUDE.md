# CLAUDE.md — Hermes Engineering Constitution

> This file is the single source of truth for how work is done in this repository.
> Claude Code (and every human contributor) must read and follow it before making any change.
> If a rule here conflicts with a request, surface the conflict — do not silently break the rule.

---

## 1. Project Philosophy

**Hermes is the Commerce Layer for Autonomous AI Agents, built on Casper.**

It lets AI agents **discover** each other, **negotiate** terms, **purchase** services, **execute**
workflows, **pay autonomously**, **maintain reputation**, and **settle on-chain**.

We build like a YC-backed, Stripe-grade startup — never like a hackathon demo:

- **Architecture > speed.** A correct, legible design is worth more than fast output.
- **Production-grade by default.** Modular, documented, testable, observable, scalable.
- **Truthful engineering.** Never invent APIs, SDK methods, contract entry points, or on-chain
  behavior. If something is unverified, say so and verify via Context7 / official docs / source.
- **Small, reversible steps.** Prefer incremental PRs with green CI over big-bang drops.
- **Docs are a deliverable, not an afterthought.** Every subsystem has a doc under `/docs`.

### Non-negotiable guardrails
- **Do not invent Casper functionality.** Verify against `docs.casper.network`, the `casper-network`
  and `make-software` GitHub orgs, or the installed SDK source. Cite the source in the PR/doc.
- **Never commit secrets.** Keys, API tokens, `secret_key.pem` never enter git. Use `.env` + examples.
- **No implementation before its design exists** in `/docs/architecture` (during the design phases).

---

## 2. Repository Map & Folder Responsibilities

```
hermes/
├── apps/
│   ├── web/            # Next.js (App Router) — dashboard, agent console, workflow canvas
│   └── docs/           # Public docs site (Nextra/Fumadocs) — NOT the /docs knowledge base
├── packages/
│   ├── ui/             # shadcn/ui-based design system + shared React components
│   ├── shared/         # Framework-agnostic domain logic, utils, clients (x402, casper, supabase)
│   ├── types/          # Shared TypeScript types + generated (Supabase, contract, protocol) types
│   └── config/         # Shared config: eslint, prettier, tsconfig, tailwind presets
├── contracts/          # Odra (Rust) smart contracts — created during the contract phase
├── docs/               # INTERNAL knowledge base (research, architecture, product, contracts, api, setup)
├── .claude/            # Claude Code config: agents, skills, commands, templates, context
├── scripts/            # Repo automation (codegen, deploy helpers, local infra)
└── supabase/           # Migrations, seed, edge functions, config (created during backend phase)
```

**Rule:** code lives in `apps/*` and `packages/*`; knowledge lives in `docs/*`. Never mix them.
Anything imported by two or more apps belongs in a `package`, never copy-pasted.

### Dependency direction (must not be violated)
`apps/*` → `packages/ui` → `packages/shared` → `packages/types`.
`packages/types` depends on nothing internal. No circular deps. No `apps/*` importing another app.

---

## 3. Tech Stack (authoritative)

| Layer        | Choice                                                                     |
|--------------|----------------------------------------------------------------------------|
| Frontend     | Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui, Framer Motion, React Flow |
| Backend      | Supabase (Postgres + RLS + Auth + Realtime + Storage + Edge Functions)     |
| Blockchain   | Casper, Odra (Rust contracts), x402 (`@make-software/casper-x402`), CSPR.click, CSPR.cloud |
| AI           | Claude (Anthropic API), LangGraph (multi-agent orchestration) via MCP tools |
| Tooling      | pnpm workspaces, TypeScript strict, Vitest/Playwright, ESLint, Prettier      |

**Model policy:** default to the latest, most capable Claude models. Current IDs — Opus 4.8
`claude-opus-4-8`, Sonnet 5 `claude-sonnet-5`, Haiku 4.5 `claude-haiku-4-5-20251001`. Never hardcode
a model in more than one place; centralize in `packages/shared` config.

---

## 4. Coding Standards

### TypeScript
- `strict` everywhere; `noUncheckedIndexedAccess` on. No `any` — use `unknown` + narrowing.
- No non-null `!` assertions except at verified invariants (with a comment saying why).
- Validate all external input (HTTP, RPC, DB rows, LLM output) at the boundary with **Zod**.
- Prefer pure functions and explicit return types on exported functions.
- Errors: throw typed error classes or return `Result`-style unions — never swallow errors silently.
- Async: no floating promises; always `await` or explicitly `void`.

### Rust / Odra contracts
- `cargo fmt` + `cargo clippy -D warnings` clean before commit.
- No `unwrap()`/`panic!` on user-controlled paths; use Odra's error enums + `revert`.
- Every entry point documents: access control, inputs, events emitted, and state mutated.

### General
- Files: one clear responsibility. Split when a file exceeds ~300 LOC or two concerns.
- No dead code, no commented-out code, no TODO without an issue link.
- Match the surrounding code's style; don't reformat unrelated lines in a PR.

---

## 5. Naming Conventions

| Kind                         | Convention             | Example                        |
|------------------------------|------------------------|--------------------------------|
| Directories / files (TS)     | `kebab-case`           | `agent-registry.ts`            |
| React components + files     | `PascalCase`           | `WorkflowCanvas.tsx`           |
| React hooks                  | `useCamelCase`         | `useAgentSession.ts`           |
| Variables / functions        | `camelCase`            | `settlePayment()`              |
| Types / interfaces / enums   | `PascalCase` (no `I`)  | `AgentListing`, `PaymentState` |
| Constants / env keys         | `SCREAMING_SNAKE_CASE` | `CSPR_CLOUD_API_KEY`           |
| DB tables / columns          | `snake_case` plural    | `agent_listings`, `created_at` |
| Rust items                   | `snake_case` / types `PascalCase` | `transfer_with_authorization` |
| Branches                     | `type/scope-summary`   | `feat/x402-client`             |

Domain vocabulary is fixed — use exactly: **Agent, Listing, Offer, Negotiation, Order, Workflow,
Task, Payment, Settlement, Reputation, Receipt**. Do not introduce synonyms.

---

## 6. Architecture Principles

1. **Layered & hexagonal.** Domain logic in `packages/shared` is free of framework/UI/DB specifics;
   adapters (Supabase, Casper RPC, x402, LLM) sit at the edges behind interfaces.
2. **Contracts are the trust root.** On-chain state (payments, settlements, reputation anchors) is
   authoritative; Supabase is an indexed, low-latency mirror + off-chain metadata store.
3. **Event-driven.** State transitions emit events (contract events → indexer → Supabase Realtime →
   UI). The UI never polls the chain directly for hot paths.
4. **Agent actions are typed tools.** Every capability an agent can invoke is an MCP tool / typed
   function with a Zod-validated schema and an authorization check.
5. **Idempotency & determinism.** Payment, settlement, and workflow steps must be idempotent and
   safely retryable (x402 retry flow, exactly-once settlement).
6. **Fail closed.** On ambiguity in money/settlement paths, stop and require explicit resolution.

---

## 7. AI Agent Development Rules

- **Orchestration = LangGraph.** Use `StateGraph` + the supervisor pattern for multi-agent flows;
  persist state via a checkpointer; add human-in-the-loop interrupts on spend/settlement steps.
- **Tools over free-form.** Agents act only through registered, schema-validated tools (MCP or typed
  functions). No shelling out, no unvalidated network calls, no raw SQL from the model.
- **Money needs a gate.** Any tool that spends funds or settles on-chain requires an explicit policy
  check (budget, allowlist, human interrupt above threshold). Log every spend with a receipt.
- **Deterministic boundaries.** Treat LLM output as untrusted input — validate with Zod before use.
- **Observability.** Every agent run is traceable: run id, node transitions, tool calls, token/costs.
- **Never invent an SDK/tool signature** for the model to call; wire real, tested tools only.

---

## 8. Smart Contract Rules (Casper / Odra)

- Use **Odra** for contract development, testing (Odra test env), and multi-backend builds.
- Design contracts around **x402 settlement**: CEP-18 token payments authorized via signed
  authorizations and settled with `transfer_with_authorization` (per `make-software/casper-x402`).
- Checks-Effects-Interactions; validate every input; explicit access control on each entry point.
- Emit a domain event for every state mutation (for the off-chain indexer).
- Every contract ships with: unit tests, integration tests on testnet, an entry-point table in
  `/docs/contracts`, and gas/allowance notes. No mainnet deploy without an audit checklist.
- **Never claim on-chain behavior you have not verified** against Odra docs or a passing test.

---

## 9. UI / UX Guidelines

- Component library: **shadcn/ui** primitives, composed in `packages/ui`. Don't fork primitives; wrap.
- **Tailwind only** for styling (design tokens in the shared preset). No inline hex, no ad-hoc CSS.
- **Framer Motion** for motion — purposeful, <300ms, respects `prefers-reduced-motion`.
- **React Flow** for the workflow/agent graph canvas.
- Accessibility is a requirement: semantic HTML, keyboard nav, visible focus, WCAG AA contrast.
- Design language: calm, precise, "financial-grade" — dense but legible; dark-first.
- Every interactive state (loading, empty, error, success) is designed, never an afterthought.
- Server Components by default; `"use client"` only when interactivity requires it.

---

## 10. Documentation Rules

- The internal knowledge base is `/docs`, organized as `research/`, `architecture/`, `product/`,
  `contracts/`, `api/`, `setup/`. Each subsystem gets its own markdown file.
- Research docs summarize a source with: Architecture · APIs · SDK usage · Best practices · Patterns ·
  Examples · Limitations · Integration opportunities · Key snippets · **Notes specific to Hermes**.
- Keep an index (`README.md`) in each `/docs` subfolder linking its files.
- Docs cite sources (URL + repo + version/commit). Prefer official docs via Context7 over memory.
- Update the doc in the same PR as the code it describes. Stale docs are treated as bugs.

---

## 11. Git & PR Conventions

- **Conventional Commits:** `type(scope): summary` — types: `feat, fix, docs, refactor, test, chore,
  build, ci, perf`. Example: `feat(x402): add client payment-signature builder`.
- **Branch first.** Never commit directly to `main`. Branch names: `feat/…`, `fix/…`, `docs/…`.
- **Commit/push only when the user asks.** Do not auto-push.
- Every commit message ends with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- PRs: clear description, linked issue/epic, test evidence, and doc updates. Keep them reviewable.
- PR bodies end with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- Green CI (lint + typecheck + test + contract build) is required before merge.

---

## 12. Definition of Done

A change is done only when: it compiles, `pnpm lint && pnpm typecheck && pnpm test` pass, new logic
has tests, the relevant `/docs` file is updated, no secrets/dead code were added, and behavior was
verified (not assumed). If tests fail or a step was skipped, say so explicitly.

---

## 13. Working With This Repo (for Claude)

- Use the **skills** in `.claude/skills` for domain playbooks and the **subagents** in `.claude/agents`
  for specialized work. Use `.claude/commands` to run standard workflows (`/research`, `/architecture`…).
- Prefer **Context7** for any official SDK/API detail; prefer **Sequential Thinking** for architecture
  and debugging; use **GitHub/Supabase/Playwright/Filesystem** MCPs per `docs/setup/mcp.md`.
- When unsure about a Casper/x402/Odra detail: stop, verify, cite — then proceed.
