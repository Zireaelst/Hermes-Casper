import "server-only";
import { createClientCasperSigner } from "@make-software/casper-x402";
import { ExactCasperScheme } from "@make-software/casper-x402/exact/client";
import casperSdk from "casper-js-sdk";
import type { Order } from "@hermes/types";

/**
 * Real on-chain x402 settlement. Reuses casper-x402's PROVEN client scheme to
 * build + sign the EIP-712 `transfer_with_authorization`, then settles via a
 * running facilitator. See docs/setup/testnet-deploy.md — settlement verified on
 * testnet (tx 66151d11…). Server-only; the buyer key never reaches the client.
 */
const facilitatorUrl = process.env.X402_FACILITATOR_URL;
const tokenPackage = process.env.X402_PAYMENT_TOKEN_CONTRACT; // 64-hex, no "hash-" prefix
const buyerKeyPath = process.env.HERMES_BUYER_KEY_PATH;
const buyerKeyAlgo = process.env.HERMES_BUYER_KEY_ALGO ?? "secp256k1";
const network = (process.env.CASPER_NETWORK_NAME ?? "casper:casper-test") as `${string}:${string}`;

/** The `authorization` shape inside a signed x402 payload (loosely typed by the SDK). */
interface SignedAuthorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

/** Chain settlement is on only when fully configured and not forced into demo mode (E2E). */
export function chainSettlementEnabled(): boolean {
  return (
    Boolean(facilitatorUrl && tokenPackage && buyerKeyPath) &&
    process.env.HERMES_FORCE_DEMO !== "1"
  );
}

/**
 * Liveness probe for the settlement facilitator. Chain settlement can be
 * configured yet non-functional if the facilitator process is down — this lets
 * the UI report the true state instead of a misleading "On-chain" badge.
 */
export async function facilitatorHealthy(): Promise<boolean> {
  if (!facilitatorUrl) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${facilitatorUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export interface ChainSettleResult {
  deployHash: string;
  payer: string;
  payee: string;
  amount: string;
  nonce: string;
}

/** Sign + settle a real HERMES `transfer_with_authorization` for an Order. */
export async function settleOrderOnChain(
  order: Order,
  sellerAccountHash: string,
): Promise<ChainSettleResult> {
  if (!facilitatorUrl || !tokenPackage || !buyerKeyPath) {
    throw new Error("chain settlement not configured");
  }

  const requirements = {
    scheme: "exact" as const,
    network,
    payTo: sellerAccountHash, // already "00"+64hex (x402 address format)
    amount: order.priceAmount,
    asset: tokenPackage,
    extra: { name: "Hermes Credit", version: "1", decimals: "9" },
    maxTimeoutSeconds: 900,
  };

  const algo =
    buyerKeyAlgo === "secp256k1"
      ? casperSdk.KeyAlgorithm.SECP256K1
      : casperSdk.KeyAlgorithm.ED25519;
  const signer = await createClientCasperSigner(buyerKeyPath, algo);
  const scheme = new ExactCasperScheme(signer);
  const { payload } = (await scheme.createPaymentPayload(2, requirements)) as unknown as {
    payload: { signature: string; publicKey: string; authorization: SignedAuthorization };
  };

  const res = await fetch(`${facilitatorUrl}/settle`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      // The wire PaymentPayload nests the accepted requirements under `accepted`
      // (facilitator reads payload.accepted.scheme/network), not top-level fields.
      paymentPayload: { x402Version: 2, accepted: requirements, payload },
      paymentRequirements: requirements,
    }),
  });
  if (!res.ok) {
    throw new Error(`facilitator ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    success: boolean;
    transaction?: string;
    errorReason?: string;
    errorMessage?: string;
  };
  if (!data.success || !data.transaction) {
    throw new Error(`settle failed: ${data.errorReason ?? ""} ${data.errorMessage ?? ""}`.trim());
  }

  return {
    deployHash: data.transaction,
    payer: payload.authorization.from,
    payee: payload.authorization.to,
    amount: payload.authorization.value,
    nonce: payload.authorization.nonce,
  };
}
