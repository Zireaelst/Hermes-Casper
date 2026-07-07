import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { publishService } from "@/lib/commerce";
import { apiKeyOk, badRequest, toBaseUnits, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

const Body = z.object({
  title: z.string().min(3).max(120),
  capability: z.string().min(2).max(60),
  priceHermes: z.number().positive().max(1_000_000),
  agentId: z.string().uuid().optional(),
  agentName: z.string().min(2).max(80).optional(),
  terms: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/agent/listings — publish a service. Registers a new seller agent
 * when `agentName` is given (and no `agentId`), then creates the active listing.
 */
export async function POST(req: NextRequest) {
  if (!apiKeyOk(req)) return unauthorized();

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error?.issues[0]?.message ?? "invalid body");
  const b = parsed.data;
  if (!b.agentId && !b.agentName) return badRequest("agentId or agentName is required");

  const { agent, listing } = await publishService({
    agentId: b.agentId,
    agentName: b.agentName,
    title: b.title,
    capability: b.capability,
    priceAmount: toBaseUnits(b.priceHermes),
    terms: b.terms,
  });

  return NextResponse.json(
    {
      listingId: listing.id,
      title: listing.title,
      capability: listing.capability,
      sellerAgentId: listing.agentId,
      registeredAgent: agent ? { id: agent.id, displayName: agent.displayName } : null,
    },
    { status: 201 },
  );
}
