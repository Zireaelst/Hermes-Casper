# Architecture Decision Log (seed)

Lightweight ADRs. One entry per significant decision. Newest on top.
Format: **ADR-NNN — Title** · Status · Context · Decision · Consequences.

---

## ADR-002 — Casper MCP: use community server, opt-in
- **Status:** Accepted (2026-07-05)
- **Context:** The brief asks for an official Casper MCP. Verification shows **no first-party official
  server**; the AI Toolkit references community-built ones.
- **Decision:** Integrate `msanlisavas/casper-mcp` as an **opt-in, unverified-third-party** server
  (left out of the default `enabledMcpjsonServers`); treat it as read convenience, not truth. Revisit
  vs `Tairon-ai/casper-network-mcp` / CasperAgentKit in Phase 1.
- **Consequences:** On-chain behavior must be verified against docs/SDK/tests, never the MCP.

## ADR-001 — Project-scoped MCP via `.mcp.json`
- **Status:** Accepted (2026-07-05)
- **Context:** Team needs consistent, shareable tooling; brief prefers repo-level over global config.
- **Decision:** Commit `.mcp.json` at the repo root; secrets via local `.env`; personal overrides in
  git-ignored `.claude/settings.local.json`.
- **Consequences:** Reproducible toolchain; secrets stay local; setup documented in `docs/setup/mcp.md`.
