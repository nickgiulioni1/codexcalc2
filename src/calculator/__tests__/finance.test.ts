import { describe, it, expect } from "vitest";
import {
  pmt,
  ipmt,
  ppmt,
  monthlyRateFromAnnual,
  buildAmortizationSchedule,
} from "../finance";

describe("finance utilities", () => {
  it("calculates PMT for standard mortgage", () => {
    const rate = monthlyRateFromAnnual(0.06); // ~0.0048675
    const payment = pmt(rate, 360, 200_000);
    expect(payment).toBeCloseTo(1178.74, 2);
  });

  it("handles zero-rate PMT", () => {
    const payment = pmt(0, 12, 12_000);
    expect(payment).toBe(1000);
  });

  it("splits interest and principal correctly", () => {
    const rate = monthlyRateFromAnnual(0.06);
    const schedule = buildAmortizationSchedule({
      principal: 160_000,
      ratePerPeriod: rate,
      totalPayments: 360,
    });
    expect(schedule[0]?.interest).toBeCloseTo(160_000 * rate, 2);
    expect(schedule[0]?.principal).toBeCloseTo(
      schedule[0]!.payment - schedule[0]!.interest,
      6
    );
    expect(schedule.at(-1)?.balance).toBeCloseTo(0, 2);
  });

  it("computes IPMT/PPMT for a given period", () => {
    const rate = monthlyRateFromAnnual(0.06);
    const interest1 = ipmt(rate, 1, 360, 100_000);
    const principal1 = ppmt(rate, 1, 360, 100_000);
    expect(interest1 + principal1).toBeCloseTo(
      pmt(rate, 360, 100_000),
      6
    );
  });

  it("converts annual to effective monthly rate", () => {
    const monthly = monthlyRateFromAnnual(0.07);
    expect(monthly).toBeCloseTo(0.005654, 6);
  });
});
