import { describe, it, expect } from "vitest";
import { calculateBuyHold } from "../buyHold";
import { Strategy } from "../types";

describe("calculateBuyHold", () => {
  it("returns expected cash flow and metrics for baseline case", () => {
    const result = calculateBuyHold({
      strategy: Strategy.BUY_HOLD,
      purchasePrice: 200_000,
      rehabCost: 0,
      arv: 200_000,
      purchaseClosingCostRate: 0,
      annualAppreciationRate: 0,
      annualRentIncreaseRate: 0,
      propertyTaxRate: 0.012,
      insurancePerMonth: 100,
      monthlyRent: 2000,
      vacancyRate: 0.05,
      repairsRate: 0.08,
      capexRate: 0,
      managementRate: 0,
      leaseUpFee: 0,
      loanTermMonths: 360,
      interestRateAnnual: 0.06,
      ltv: 0.8,
    });

    expect(result.monthly).toHaveLength(360);
    const first = result.monthly[0];
    expect(first.debtService).toBeCloseTo(942.99, 2);
    expect(first.cashFlow).toBeCloseTo(497.01, 2);
    expect(result.annual[0]?.cashFlow).toBeCloseTo(5964.09, 2);
    expect(result.metrics.cashRequired).toBeCloseTo(40_000, 2);
    expect(result.metrics.cashOnCashReturn).toBeCloseTo(0.149, 3);
    expect(result.metrics.dscr).toBeGreaterThan(1.5);
  });
});
