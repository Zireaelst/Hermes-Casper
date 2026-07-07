import { type NextRequest, NextResponse } from "next/server";
import { discoverServices } from "@/lib/commerce";
import { apiKeyOk, serviceDto, toBaseUnits, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/agent/services — discover active services.
 * Query: capability?, max_price? (HERMES), min_reputation? (0–5).
 */
export async function GET(req: NextRequest) {
  if (!apiKeyOk(req)) return unauthorized();

  const { searchParams } = req.nextUrl;
  const capability = searchParams.get("capability") ?? undefined;
  const maxPriceRaw = searchParams.get("max_price");
  const minRepRaw = searchParams.get("min_reputation");

  const services = await discoverServices({
    capability,
    maxPrice: maxPriceRaw ? toBaseUnits(Number(maxPriceRaw)) : undefined,
    minReputation: minRepRaw ? Math.round(Number(minRepRaw) * 100) : undefined,
  });

  return NextResponse.json({ services: services.map(serviceDto) });
}
