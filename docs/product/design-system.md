# Design System

> Status: Draft (Phase 3) · Updated: 2026-07-05 · Home: `packages/ui` + Tailwind preset in `packages/config`.
> Language: calm, precise, **financial-grade**, dark-first. See skills `shadcn-design-system`, `ui-ux`.

## 1. Principles
- **Legible density** — show a lot without clutter; strong hierarchy; generous but purposeful spacing.
- **Trust cues** — money/settlement states are unambiguous; never guess or imply a paid state.
- **Calm motion** — subtle, <300ms, `prefers-reduced-motion` respected.
- **Accessible by default** — WCAG AA, keyboard, visible focus, semantic structure (Radix under shadcn).

## 2. Tokens (semantic — mapped in the Tailwind preset)
Defined as CSS variables; components reference **semantic** tokens, never raw hex.
```
--surface        app background            --surface-raised  cards/panels
--border         hairlines                 --text            primary text
--text-muted     secondary text           --accent          brand/primary action
--accent-fg      text on accent            --focus           focus ring
-- state colors --
--success  (settled)   --warning (waiting/HITL)   --danger (failed)   --info (pending/verifying)
```
Dark-first palette; a light theme maps the same semantic tokens. **No inline hex, no ad-hoc CSS.**

## 3. Typography & spacing
- Type scale (suggested): `xs 12 / sm 14 / base 15 / lg 18 / xl 24 / 2xl 30 / 3xl 38`. UI base 14–15.
- Monospace for hashes/amounts/ids (deploy hashes, account hashes, token amounts).
- Spacing on a 4px grid; radius scale `sm/md/lg` from the preset; elevation via subtle borders + shadow.

## 4. Motion tokens
`duration: fast 120ms / base 200ms / slow 280ms`; `easing: standard, emphasized`. Use `AnimatePresence`
for enter/exit; animate transform/opacity only. Status transitions (e.g. → settled) get a brief pulse.

## 5. Component inventory
**Primitives (shadcn, wrapped):** Button, Input, Select, Dialog, Sheet, Tabs, Tooltip, Badge, Toast,
DropdownMenu, Table, Card, Skeleton, Avatar, Switch.

**Hermes patterns (in `packages/ui`):**
| Component | Purpose | Notable states |
|-----------|---------|----------------|
| `AgentCard` | agent identity + reputation | active / paused |
| `ListingCard` | marketplace listing | active / negotiating |
| `OfferPanel` | live Offer exchange | proposing / countered / accepted |
| `OrderTimeline` | order + payment lifecycle | quoted→authorized→settling→settled / failed |
| `ReceiptCard` | settlement proof | shows deploy hash, amount, parties |
| `SpendApproval` | HITL approval item | pending / approved / rejected / expired |
| `PolicyEditor` | budget/allowlist/threshold | valid / invalid |
| `WorkflowCanvas` | React Flow run graph | node: idle/active/waiting/done/failed |
| `StatBadge` / `AmountText` | KPIs + token amounts | monospace amount + asset |

## 6. Status color mapping (canonical)
`pending/verifying → info` · `authorized/settling/waiting-HITL → warning` · `settled/done → success` ·
`failed/expired/rejected → danger`. Use the same mapping everywhere (timeline, canvas, badges).

## 7. Accessibility checklist (per component)
Semantic role · keyboard operable · visible focus · AA contrast (incl. state colors) · reduced-motion
fallback · non-color status indicator (icon/label, not color alone).

## 8. Governance
Wrap, don't fork, shadcn primitives; new visual patterns must add a token/spec here first; component
catalog documented with props/variants/states. Design ↔ code kept in sync (Figma MCP when a source exists).
