import { SettlementError, err, ok } from "@hermes/shared";
import type { FacilitatorClient, Result } from "@hermes/shared";
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResult,
  VerifyResult,
} from "@hermes/types";

/**
 * Real x402 facilitator client (Session J). Talks HTTP to a running
 * make-software/casper-x402 facilitator's /verify and /settle endpoints — shapes
 * verified in docs/research/casper-x402.md.
 *
 * NOT yet wired into getDeps: settling on-chain also needs a real EIP-712 signer
 * (the Session J spike). Until then the app uses DemoFacilitator. This is the
 * drop-in that replaces it once ODRA deploy + signer are live.
 */
export class HttpFacilitatorClient implements FacilitatorClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
  ) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "content-type": "application/json" };
    if (this.apiKey) h["authorization"] = this.apiKey;
    return h;
  }

  async verify(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<VerifyResult> {
    const res = await fetch(`${this.baseUrl}/verify`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ paymentPayload: payload, paymentRequirements: requirements }),
    });
    if (!res.ok) return { isValid: false, invalidReason: `http_${res.status}` };
    return (await res.json()) as VerifyResult;
  }

  async settle(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
  ): Promise<Result<SettleResult, SettlementError>> {
    const res = await fetch(`${this.baseUrl}/settle`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ paymentPayload: payload, paymentRequirements: requirements }),
    });
    if (!res.ok) {
      return err(new SettlementError(`facilitator ${res.status}`, "http_error"));
    }
    const result = (await res.json()) as SettleResult;
    if (!result.success) {
      return err(new SettlementError(result.errorMessage ?? "settle failed", result.errorReason ?? "settle_failed"));
    }
    return ok(result);
  }
}
