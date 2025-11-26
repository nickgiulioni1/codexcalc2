import { describe, it, expect } from "vitest";
import { calculateFlip } from "../flip";
import { Strategy } from "../types";
import { monthlyRateFromAnnual } from "../finance";

describe("calculateFlip", () => {
  it("models hold costs and sale profit", () => {
    const inputs = {
      strategy: Strategy.FLIP,
      purchasePrice: 120_000,
      rehabCost: 30_000,
      arv: 200_000,
      purchaseClosingCostRate: 0.01,
      annualAppreciationRate: 0,
      propertyTaxRate: 0.01,
      insurancePerMonth: 100,
      rehabMonths: 4,
      monthsOnMarket: 2,
      agentFeeRate: 0.06,
      sellerClosingCostRate: 0.02,
      marginalTaxRate: 0.25,
      bridgeInterestRateAnnual: 0.1,
      bridgeLtv: 0.9,
    };

    const res = calculateFlip(inputs);
    const holdMonths = inputs.rehabMonths + inputs.monthsOnMarket;
    expect(res.monthly.length).toBe(holdMonths + 1); // includes sale event
    expect(res.metrics.holdMonths).toBe(holdMonths);

    const bridgePrincipal =
      (inputs.bridgeLtv ?? 0) * (inputs.purchasePrice + inputs.rehabCost);
    const monthlyBridgeRate = monthlyRateFromAnnual(inputs.bridgeInterestRateAnnual ?? 0);
    const interestTotal = holdMonths * monthlyBridgeRate * bridgePrincipal;
    const purchaseClosingCosts =
      (inputs.purchaseClosingCostRate ?? 0) * inputs.purchasePrice;
    const downPayment =
      inputs.purchasePrice + inputs.rehabCost - bridgePrincipal;
    const cashInvested = downPayment + purchaseClosingCosts;
    const taxesTotal =
      holdMonths * ((inputs.propertyTaxRate ?? 0) * inputs.purchasePrice) / 12; // no appreciation
    const insuranceTotal = holdMonths * (inputs.insurancePerMonth ?? 0);
    const totalCashRequired =
      cashInvested + interestTotal + taxesTotal + insuranceTotal;

    expect(res.metrics.totalCashRequired).toBeCloseTo(totalCashRequired, 0);
    expect(res.metrics.profitBeforeTax).toBeDefined();
    expect(res.metrics.roi).toBeCloseTo(
      res.metrics.profitBeforeTax / res.metrics.totalCashRequired,
      6
    );
  });
});
