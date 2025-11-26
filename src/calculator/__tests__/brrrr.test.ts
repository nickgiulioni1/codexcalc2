import { describe, it, expect } from "vitest";
import { calculateBRRRR } from "../brrrr";
import { Strategy } from "../types";
import { monthlyRateFromAnnual } from "../finance";

describe("calculateBRRRR", () => {
  it("computes bridge, refi, and cash left in deal", () => {
    const inputs = {
      strategy: Strategy.BRRRR,
      purchasePrice: 150_000,
      rehabCost: 30_000,
      arv: 220_000,
      purchaseClosingCostRate: 0.01,
      annualAppreciationRate: 0,
      annualRentIncreaseRate: 0,
      propertyTaxRate: 0.012,
      insurancePerMonth: 100,
      monthlyRent: 2000,
      vacancyRate: 0.05,
      repairsRate: 0,
      capexRate: 0,
      managementRate: 0,
      leaseUpFee: 0,
      bridgeLtv: 0.9,
      bridgeInterestRateAnnual: 0.08,
      bridgeTermMonths: 6,
      rehabMonths: 6,
      refiLtv: 0.75,
      refiPointsRate: 0.01,
      refiClosingCostRate: 0.02,
      longTermLoan: {
        loanTermMonths: 360,
        interestRateAnnual: 0.06,
      },
    };

    const res = calculateBRRRR(inputs);
    expect(res.monthly.length).toBe(inputs.rehabMonths + inputs.longTermLoan.loanTermMonths);

    const bridgePrincipal = (inputs.bridgeLtv ?? 0) * (inputs.purchasePrice + inputs.rehabCost);
    const cashInvestedBeforeRefi =
      inputs.purchasePrice +
      inputs.rehabCost -
      bridgePrincipal +
      (inputs.purchaseClosingCostRate ?? 0) * inputs.purchasePrice;
    const refiLoan = inputs.refiLtv * inputs.arv;
    const refiCashOut =
      refiLoan -
      (inputs.refiClosingCostRate ?? 0) * refiLoan -
      (inputs.refiPointsRate ?? 0) * refiLoan -
      bridgePrincipal;
    const expectedCashLeft = cashInvestedBeforeRefi - refiCashOut;
    expect(res.metrics.cashLeftInDeal).toBeCloseTo(expectedCashLeft, 2);

    // Bridge interest for rehab months
    const monthlyBridgeRate = monthlyRateFromAnnual(inputs.bridgeInterestRateAnnual ?? 0);
    const expectedBridgeInterest = inputs.rehabMonths * monthlyBridgeRate * bridgePrincipal;
    expect(res.metrics.bridgeInterest).toBeCloseTo(expectedBridgeInterest, 1);

    // Year one should include rehab + first 6 rental months
    expect(res.metrics.yearOneCashFlow).toBeLessThan(0); // rehab drag
    expect(res.metrics.cashRequired).toBeGreaterThan(0);
  });
});
