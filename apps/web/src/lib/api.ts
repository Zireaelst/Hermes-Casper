import "server-only";

import { formatAmount } from "@hermes/shared";
import { NextResponse } from "next/server";
import type { ServiceView } from "./commerce";

/**
 * Optional bearer-token gate for the agent HTTP API. When HERMES_API_KEY is set,
 * requests must send `Authorization: Bearer <key>`; when unset (demo), the API is
 * open. This is the surface external agents (Claude Code, the MCP server) call.
 */
export function apiKeyOk(req: Request): boolean {
  const required = process.env.HERMES_API_KEY;
  if (!required) return true;
  return req.headers.get("authorization") === `Bearer ${required}`;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** HERMES has 9 decimals. Convert a human amount to base units. */
export function toBaseUnits(hermes: number): string {
  return BigInt(Math.round(hermes * 1e9)).toString();
}

/** Serialize a discovered service into a clean, agent-friendly DTO. */
export function serviceDto(s: ServiceView) {
  return {
    listingId: s.listing.id,
    title: s.listing.title,
    capability: s.listing.capability,
    seller: s.seller?.displayName ?? null,
    sellerAgentId: s.listing.agentId,
    priceHermes: Number(formatAmount(s.listing.priceAmount, 9)),
    priceBase: s.listing.priceAmount,
    reputation: Number((s.reputation / 100).toFixed(1)),
    terms: s.listing.terms,
  };
}
