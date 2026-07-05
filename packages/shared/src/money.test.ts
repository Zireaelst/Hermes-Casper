import { describe, expect, it } from "vitest";
import {
  addAmounts,
  compareAmounts,
  formatAmount,
  subtractAmount,
  withinBudget,
} from "./money";

describe("money", () => {
  it("adds base-unit amounts without float error", () => {
    expect(addAmounts("7500000000", "2500000000")).toBe("10000000000");
    expect(addAmounts()).toBe("0");
    // beyond Number.MAX_SAFE_INTEGER — BigInt keeps precision
    expect(addAmounts("9007199254740993", "1")).toBe("9007199254740994");
  });

  it("checks budgets inclusively", () => {
    expect(withinBudget("1000", "1000")).toBe(true);
    expect(withinBudget("1000", "1001")).toBe(false);
    expect(withinBudget("1000", "0")).toBe(true);
  });

  it("subtracts and rejects overspend", () => {
    expect(subtractAmount("1000", "250")).toBe("750");
    expect(() => subtractAmount("1000", "1001")).toThrow(/insufficient budget/);
  });

  it("compares amounts", () => {
    expect(compareAmounts("10", "20")).toBe(-1);
    expect(compareAmounts("20", "20")).toBe(0);
    expect(compareAmounts("30", "20")).toBe(1);
  });

  it("formats with decimals for display", () => {
    expect(formatAmount("7500000000", 9)).toBe("7.5");
    expect(formatAmount("1000000000", 9)).toBe("1");
    expect(formatAmount("1", 9)).toBe("0.000000001");
    expect(formatAmount("0", 9)).toBe("0");
  });

  it("rejects malformed amounts", () => {
    expect(() => addAmounts("1.5")).toThrow(/invalid base-unit amount/);
    expect(() => withinBudget("abc", "1")).toThrow(/invalid base-unit amount/);
  });
});
