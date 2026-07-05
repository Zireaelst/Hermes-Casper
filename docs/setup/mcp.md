# MCP Setup — Hermes

Hermes uses **project-scoped MCP** so every contributor (and Claude Code) gets the same tools.
Configuration lives in [`.mcp.json`](../../.mcp.json) at the repo root; secrets live in your local
`.env` (never committed). Claude Code prompts for approval the first time it loads project MCP servers.

> **Why project-scoped?** The brief requires repository-level over global config. Claude Code reads
> `.mcp.json` at the project root and merges it with user/local scopes. Team-shared servers go here;
> personal overrides go in `.claude/settings.local.json` (git-ignored).

## Prerequisites
- **Node ≥ 22** and **pnpm ≥ 10** (for `npx`-based servers).
- **Docker** running (for the GitHub and Casper servers, which ship as containers).
- A local `.env` created from [`.env.example`](../../.env.example).

## One-time setup
1. `cp .env.example .env` and fill in the tokens below.
2. Ensure Docker Desktop is running.
3. Launch Claude Code in the repo. Approve the project MCP servers when prompted
   (or pre-approve in `.claude/settings.json` via `enabledMcpjsonServers`).
4. Verify with `claude mcp list` — every enabled server should report **Connected**.

## Environment variable expansion
`.mcp.json` uses `${VAR}` / `${VAR:-default}` expansion. Values come from your shell/`.env`.
Missing optional vars fall back to a safe default (e.g. read-only, testnet, empty key).

---

## Servers

### 1. Filesystem MCP — `@modelcontextprotocol/server-filesystem`
**Purpose:** safe, scoped read/write over the repo (read files, refactor, generate docs/folders).
**Config:** rooted at `${HERMES_ROOT:-.}` — the repo root. Do **not** widen the root to `$HOME`.
**Verify:** ask Claude to list a directory; confirm it cannot escape the repo root.

### 2. Sequential Thinking MCP — `@modelcontextprotocol/server-sequential-thinking`
**Purpose:** structured multi-step reasoning for architecture decisions, feature/implementation
planning, and debugging. No credentials. **Use it for the design phases (Phase 2).**

### 3. Context7 MCP — `@upstash/context7-mcp`
**Purpose:** pull **official, version-accurate** SDK/API docs on demand (Next.js, Supabase, React,
Tailwind, LangGraph, casper-js-sdk, etc.). **Always prefer this over memory; never invent APIs.**
**Config:** `CONTEXT7_API_KEY` optional (raises rate limits). **Verify:** request Next.js App Router
docs and confirm current content is returned.

### 4. Playwright MCP — `@playwright/mcp`
**Purpose:** drive a real browser for UI/E2E testing, screenshots, and demo verification.
**Config:** none required; first run downloads browsers. **Verify:** navigate to `localhost` app and
capture a screenshot once `apps/web` exists.

### 5. GitHub MCP — official `ghcr.io/github/github-mcp-server`
**Purpose:** read repos, create/manage issues, PRs, milestones, projects, and review code.
**Config:** requires `GITHUB_PERSONAL_ACCESS_TOKEN` (fine-grained PAT with `repo`, `issues`,
`pull_requests`). Runs via Docker. **Enable in settings only after the token is set.**
**Verify:** ask Claude to list open issues on the Hermes repo.
> Alternative: GitHub's hosted remote server (`https://api.githubcopilot.com/mcp/`) if you prefer
> OAuth over a PAT + Docker. Swap the `github` block to a `type: "http"` entry if so.

### 6. Supabase MCP — `@supabase/mcp-server-supabase`
**Purpose:** SQL generation, migrations, schema updates, auth/storage/edge-function management.
**Config:** `SUPABASE_ACCESS_TOKEN` (personal access token) + `SUPABASE_PROJECT_REF`. Runs
`--read-only` by default here — **remove that flag only for intentional, reviewed writes.**
**Verify:** ask Claude to list tables once a project is linked.

### 7. Casper MCP — community `msanlisavas/casper-mcp` *(opt-in)*
**Status / decision:** There is **no first-party "official" Casper MCP server**. The Casper AI Toolkit
references **community-built** servers. We integrate the most complete one —
[`msanlisavas/casper-mcp`](https://github.com/msanlisavas/casper-mcp) (82 read-only tools + 5
local-signing write tools over CSPR.cloud) — as an **opt-in** server, and treat it as untrusted
third-party code until reviewed.
**Alternatives considered:** [`Tairon-ai/casper-network-mcp`](https://github.com/Tairon-ai/casper-network-mcp)
and CasperAgentKit. Revisit in Phase 1 research and pick the best-maintained option.
**Config:** `CSPR_CLOUD_API_KEY` (from cspr.cloud) + `CASPER_MCP_NETWORK` (`testnet`/`mainnet`).
It is intentionally **left out of `enabledMcpjsonServers`** in `.claude/settings.json` — enable it
explicitly after review. **Never rely on it to assert on-chain behavior; verify against docs/SDK.**

---

## Enable / disable a server
`.claude/settings.json → enabledMcpjsonServers` controls which project servers auto-load. Default set:
`filesystem`, `sequential-thinking`, `context7`, `playwright`. Add `github` / `supabase` / `casper`
once their credentials are configured and (for Casper) the image is reviewed.

## Troubleshooting
- **`Needs authentication` / not connected:** a required env var is empty — check `.env`.
- **Docker server won't start:** confirm Docker is running and the image pulled.
- **Wrong/old docs from Context7:** specify the library + version explicitly in the prompt.
- Re-run `claude mcp list` after any change to `.mcp.json` or `.env`.
