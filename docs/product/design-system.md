# Design System

> Status: Draft (Phase 4) · Updated: 2026-07-07 · Token home: `@theme` in `apps/web/src/app/globals.css`
> (Tailwind v4 — there is no separate preset in `packages/config`). Language: calm, precise,
> **financial-grade**, **light-first**. See skills `shadcn-design-system`, `ui-ux`.

> **Direction change (2026-07-07):** the system is now **light-first** — warm off-white surface, deep
> green accent, Inter type — replacing the earlier dark-first aesthetic. This is a deliberate override of
> CLAUDE.md §9 ("dark-first"), adopted as the source of truth for look, motion, and interaction. The new
> light surface currently ships on the **marketing landing only** (scoped via a `.theme-light` class).
> The dark console (`dashboard/marketplace/orders/approvals`) still uses the legacy dark palette; migrating
> it to the light system is a tracked follow-up (see `NEXT_SESSION.md`). Until that migration, both
> palettes coexist: light values under `.theme-light`, dark values at `:root`.

## 1. Principles
- **Legible density** — show a lot without clutter; strong hierarchy; generous but purposeful spacing.
- **Trust cues** — money/settlement states are unambiguous; never guess or imply a paid state.
- **Calm motion** — subtle, <300ms, `prefers-reduced-motion` respected.
- **Accessible by default** — WCAG AA, keyboard, visible focus, semantic structure (Radix under shadcn).

## 2. Tokens (semantic — CSS variables in `@theme`)
Defined as CSS variables; components reference **semantic** tokens, never raw hex. The dark console keeps
the `:root` defaults; the light marketing surface overrides the same tokens under `.theme-light`.

| Token | Role | Light (`.theme-light`) | Dark (`:root`) |
|-------|------|------------------------|-----------------|
| `--color-surface` | app background | `#FFFFFF` | `#0B0E14` |
| `--color-surface-raised` | cards / panels / banner | `#FAFBF9` | `#12161F` |
| `--color-surface-sunken` | inactive fills / hover base | `#F1F3F1` | `#1A1F2B` |
| `--color-border` | hairlines / pill border | `#F1F3F1` | `#232936` |
| `--color-text` | primary text | `#1C2E1E` | `#E6E9F0` |
| `--color-text-strong` | headline / nav (max contrast) | `#000000` | `#FFFFFF` |
| `--color-text-muted` | secondary text | `#5A635A` | `#8B93A7` |
| `--color-text-subtle` | tertiary / captions | `#738273` | `#6B7280` |
| `--color-accent` | brand / primary action | `#1C2E1E` | `#6C8CFF` |
| `--color-accent-fg` | text on accent | `#FFFFFF` | `#0B0E14` |
| `--color-accent-soft` | quiet accent (CTA arrow) | `#4D6D47` | `#6C8CFF` |
| `--color-focus` | focus ring | `#1C2E1E` | `#6C8CFF` |
| `--color-selection` | text-selection background | `#EAECE9` | `#2A3350` |

State colors (shared): `--color-success` (settled) · `--color-warning` (waiting/HITL) ·
`--color-danger` (failed) · `--color-info` (pending/verifying). **No inline hex, no ad-hoc CSS** — the
rendered result must match the hero spec exactly, but every value flows from a token.

Typeface: **Inter** on the light surface (`--font-sans` in `.theme-light`), monospace for hashes/amounts.

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
