import { formatAmount } from "@hermes/shared";
import { type NextRequest, NextResponse } from "next/server";
import { getOrderDetail } from "@/lib/commerce";
import { apiKeyOk, unauthorized } from "@/lib/api";
import { deployUrl } from "@/lib/explorer";

export const dynamic = "force-dynamic";

/** GET /api/agent/orders/:id — order status + receipt (with explorer link). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!apiKeyOk(req)) return unauthorized();
  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) return NextResponse.json({ error: "order not found" }, { status: 404 });

  const { order, listing, seller, receipt } = detail;
  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    title: listing?.title ?? null,
    seller: seller?.displayName ?? null,
    amountHermes: Number(formatAmount(order.priceAmount, 9)),
    receipt: receipt
      ? {
          deployHash: receipt.deployHash,
          explorerUrl: deployUrl(receipt.deployHash),
          settledAt: receipt.settledAt,
        }
      : null,
  });
}
