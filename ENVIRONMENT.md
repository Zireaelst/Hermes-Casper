# Phase 0 — Engineering Environment Checklist

Status of the AI-native engineering workspace. Complete before Phase 1 (documentation research).

## ✅ Done (in this repo)
- [x] Clean pnpm monorepo structure (`apps/`, `packages/`, `docs/`, `.claude/`, `scripts/`)
- [x] Root config: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`,
      `.editorconfig`, `.nvmrc`
- [x] **`CLAUDE.md`** — coding standards, architecture principles, naming, philosophy, folder
      responsibilities, AI-agent / smart-contract / UI / docs / git rules, Definition of Done
- [x] **MCP** — project-scoped `.mcp.json` (filesystem, sequential-thinking, context7, playwright,
      github, supabase, community casper) + `.claude/settings.json` + `docs/setup/mcp.md` + `.env.example`
- [x] **Subagents** (`.claude/agents`, 9): architect, backend, frontend, smart-contract, ai, database,
      ui-designer, qa, devops
- [x] **Skills** (`.claude/skills`, 10): casper-development, odra-contracts, x402-payments,
      langgraph-agents, supabase-backend, nextjs-frontend, shadcn-design-system, ui-ux, testing, deployment
- [x] **Commands** (`.claude/commands`, 9): `/research /architecture /prd /backend /frontend /contracts
      /database /deploy /demo`
- [x] Templates + context (glossary, ADR log) under `.claude/`
- [x] Docs knowledge-base scaffold with indexes (`docs/README.md`, research + architecture indexes)
- [x] All JSON/YAML validated

## ⏳ Requires user action (credentials / local machine)
These cannot be completed by Claude and are **documented** in `docs/setup/mcp.md`:
- [ ] `cp .env.example .env` and fill tokens: `GITHUB_PERSONAL_ACCESS_TOKEN`, `SUPABASE_ACCESS_TOKEN`
      + `SUPABASE_PROJECT_REF`, optional `CONTEXT7_API_KEY`, `CSPR_CLOUD_API_KEY`
- [ ] Docker running (for GitHub + community Casper MCP servers)
- [ ] `pnpm install` at the root
- [ ] `claude mcp list` → confirm enabled servers report **Connected**
- [ ] Enable `github` / `supabase` in `.claude/settings.json → enabledMcpjsonServers` once tokens set;
      enable community `casper` only after reviewing the image

## Key decisions (see `.claude/context/tech-decisions.md`)
- **No official Casper MCP exists** → integrated community `msanlisavas/casper-mcp` as opt-in; verify
  on-chain behavior against docs/SDK, never the MCP.
- **Project-scoped MCP** via committed `.mcp.json`; secrets stay in local `.env`.

## Next: Phase 1
Run `/research <source>` for each entry in `docs/research/README.md`. Do not start implementation
until Phases 1–4 are complete (per the brief).
