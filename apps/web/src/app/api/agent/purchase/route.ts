import { formatAmount } from "@hermes/shared";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { purchaseService } from "@/lib/commerce";
import { apiKeyOk, badRequest, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

const Body = z.object({ listingId: z.string().uuid() });

/**
 * POST /api/agent/purchase { listingId } — an agent buys a service.
 * Runs the x402 money path (policy gate → sign → settle) and returns the
 * outcome: settled (with deploy hash + explorer link), awaiting_approval, or failed.
 */
export async function POST(req: NextRequest) {
  if (!apiKeyOk(req)) return unauthorized();

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("expected { listingId: uuid }");

  const outcome = await purchaseService(parsed.data.listingId);
  return NextResponse.json({
    status: outcome.status,
    orderId: outcome.orderId,
    orderUrl: `/orders/${outcome.orderId}`,
    deployHash: outcome.deployHash ?? null,
    explorerUrl: outcome.explorerUrl ?? null,
    amountHermes: outcome.amount ? Number(formatAmount(outcome.amount, 9)) : null,
    reason: outcome.reason ?? null,
  });
}
