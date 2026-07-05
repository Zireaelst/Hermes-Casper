import type { Amount } from "@hermes/types";

/**
 * Base-unit money math. Amounts are non-negative integer strings (see Amount in
 * @hermes/types); all arithmetic uses BigInt — never floats.
 */

const AMOUNT_RE = /^\d+$/;

function toBig(amount: Amount): bigint {
  if (!AMOUNT_RE.test(amount)) {
    throw new RangeError(`invalid base-unit amount: ${amount}`);
  }
  return BigInt(amount);
}

/** Sum a list of base-unit amounts, returning a base-unit string. */
export function addAmounts(...amounts: Amount[]): Amount {
  return amounts.reduce((acc, a) => acc + toBig(a), 0n).toString();
}

/** True if `amount` can be spent from `remaining` budget (amount <= remaining). */
export function withinBudget(remaining: Amount, amount: Amount): boolean {
  return toBig(amount) <= toBig(remaining);
}

/** Subtract `amount` from `remaining`; throws if it would go negative. */
export function subtractAmount(remaining: Amount, amount: Amount): Amount {
  const r = toBig(remaining);
  const a = toBig(amount);
  if (a > r) {
    throw new RangeError(`insufficient budget: ${amount} > ${remaining}`);
  }
  return (r - a).toString();
}

/** Compare two base-unit amounts: -1 | 0 | 1. */
export function compareAmounts(a: Amount, b: Amount): -1 | 0 | 1 {
  const x = toBig(a);
  const y = toBig(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

/**
 * Format a base-unit amount for display given token decimals (e.g. 9 for HERMES).
 * Purely presentational — never feed the result back into arithmetic.
 */
export function formatAmount(base: Amount, decimals: number): string {
  if (decimals < 0 || !Number.isInteger(decimals)) {
    throw new RangeError(`invalid decimals: ${decimals}`);
  }
  const digits = toBig(base).toString().padStart(decimals + 1, "0");
  const whole = digits.slice(0, digits.length - decimals);
  const frac = digits.slice(digits.length - decimals).replace(/0+$/, "");
  return frac.length > 0 ? `${whole}.${frac}` : whole;
}
