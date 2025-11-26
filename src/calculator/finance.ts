// Financial utility functions for calculator engines.
// Rates are decimals (e.g., 0.07 for 7%). Payments are returned as positive numbers.

export type PaymentTiming = "end" | "begin";

/**
 * Equivalent to Excel PMT. Returns periodic payment amount.
 * @param ratePerPeriod interest rate per period (decimal)
 * @param numberOfPayments total number of periods
 * @param presentValue current principal (positive)
 * @param futureValue optional future value (default 0)
 * @param timing payment at period "end" (default) or "begin"
 */
export function pmt(
  ratePerPeriod: number,
  numberOfPayments: number,
  presentValue: number,
  futureValue = 0,
  timing: PaymentTiming = "end"
): number {
  if (numberOfPayments <= 0) return 0;
  if (ratePerPeriod === 0) {
    return (presentValue + futureValue) / numberOfPayments;
  }

  const typeFlag = timing === "begin" ? 1 : 0;
  const pow = Math.pow(1 + ratePerPeriod, numberOfPayments);
  const numerator = ratePerPeriod * (presentValue * pow + futureValue);
  const denominator = (1 + ratePerPeriod * typeFlag) * (pow - 1);
  return numerator / denominator;
}

/**
 * Interest portion of a single period payment (1-based period index).
 * Uses an end-of-period amortization model.
 */
export function ipmt(
  ratePerPeriod: number,
  periodIndex: number,
  numberOfPayments: number,
  presentValue: number,
  futureValue = 0,
  timing: PaymentTiming = "end"
): number {
  if (periodIndex < 1 || periodIndex > numberOfPayments) return 0;
  const schedule = buildAmortizationSchedule({
    principal: presentValue,
    ratePerPeriod,
    totalPayments: numberOfPayments,
    futureValue,
    timing,
  });
  return schedule[periodIndex - 1]?.interest ?? 0;
}

/**
 * Principal portion of a single period payment (1-based period index).
 */
export function ppmt(
  ratePerPeriod: number,
  periodIndex: number,
  numberOfPayments: number,
  presentValue: number,
  futureValue = 0,
  timing: PaymentTiming = "end"
): number {
  const schedule = buildAmortizationSchedule({
    principal: presentValue,
    ratePerPeriod,
    totalPayments: numberOfPayments,
    futureValue,
    timing,
  });
  return schedule[periodIndex - 1]?.principal ?? 0;
}

/**
 * Convert an annual nominal rate to effective monthly rate.
 * Example: 0.07 annual -> ~0.005654 monthly.
 */
export function monthlyRateFromAnnual(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

export interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface AmortizationParams {
  principal: number;
  ratePerPeriod: number;
  totalPayments: number;
  payment?: number;
  futureValue?: number;
  timing?: PaymentTiming;
}

/**
 * Build a simple amortization schedule using constant payments.
 * Payments default to PMT with futureValue defaulted to 0.
 */
export function buildAmortizationSchedule(
  params: AmortizationParams
): AmortizationRow[] {
  const {
    principal,
    ratePerPeriod,
    totalPayments,
    payment: paymentOverride,
    futureValue = 0,
    timing = "end",
  } = params;

  if (totalPayments <= 0) return [];

  const paymentAmount =
    paymentOverride ??
    pmt(ratePerPeriod, totalPayments, principal, futureValue, timing);

  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let period = 1; period <= totalPayments; period += 1) {
    let interest = ratePerPeriod * balance;
    let principalPortion = paymentAmount - interest;

    // For begin timing, apply payment before interest accrues.
    if (timing === "begin") {
      principalPortion = paymentAmount;
      balance = Math.max(0, balance - principalPortion);
      interest = ratePerPeriod * balance;
    } else {
      balance = Math.max(0, balance - principalPortion);
    }

    rows.push({
      period,
      payment: paymentAmount,
      interest,
      principal: principalPortion,
      balance,
    });
  }

  return rows;
}
