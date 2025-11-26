import {
  AnnualSummary,
  BuyHoldInputs,
  BuyHoldMetrics,
  BuyHoldResult,
  MonthlyResult,
} from "./types";
import {
  buildAmortizationSchedule,
  monthlyRateFromAnnual,
  AmortizationRow,
} from "./finance";

function deriveLoanAmount(inputs: BuyHoldInputs): {
  loanAmount: number;
  downPayment: number;
} {
  if (inputs.loanAmount !== undefined) {
    return {
      loanAmount: inputs.loanAmount,
      downPayment: Math.max(0, inputs.purchasePrice - inputs.loanAmount),
    };
  }
  if (inputs.ltv !== undefined) {
    const loanAmount = inputs.purchasePrice * inputs.ltv;
    return {
      loanAmount,
      downPayment: Math.max(0, inputs.purchasePrice - loanAmount),
    };
  }
  if (inputs.downPayment !== undefined) {
    return {
      loanAmount: Math.max(0, inputs.purchasePrice - inputs.downPayment),
      downPayment: inputs.downPayment,
    };
  }
  return { loanAmount: inputs.purchasePrice, downPayment: 0 };
}

function rentForMonth(
  baseRent: number,
  annualIncreaseRate: number,
  monthIndex: number
): number {
  const yearIndex = Math.floor((monthIndex - 1) / 12);
  return baseRent * Math.pow(1 + annualIncreaseRate, yearIndex);
}

function propertyValueForMonth(
  startValue: number,
  monthlyAppreciationRate: number,
  monthIndex: number
): number {
  return startValue * Math.pow(1 + monthlyAppreciationRate, monthIndex - 1);
}

export function calculateBuyHold(inputs: BuyHoldInputs): BuyHoldResult {
  const { loanAmount, downPayment } = deriveLoanAmount(inputs);
  const monthlyInterestRate = monthlyRateFromAnnual(
    inputs.interestRateAnnual ?? 0
  );
  const monthlyAppreciationRate = monthlyRateFromAnnual(
    inputs.annualAppreciationRate ?? 0
  );
  const annualRentIncreaseRate = inputs.annualRentIncreaseRate ?? 0;

  const pointsCost = (inputs.pointsRate ?? 0) * loanAmount;
  const loanClosingCosts = (inputs.loanClosingCostRate ?? 0) * loanAmount;
  const purchaseClosingCosts =
    (inputs.purchaseClosingCostRate ?? 0) * inputs.purchasePrice;

  const initialCashInvested =
    downPayment + inputs.rehabCost + pointsCost + loanClosingCosts + purchaseClosingCosts;

  const startingValue = inputs.arv || inputs.purchasePrice;
  const amortizationSchedule: AmortizationRow[] = buildAmortizationSchedule({
    principal: loanAmount,
    ratePerPeriod: monthlyInterestRate,
    totalPayments: inputs.loanTermMonths,
  });

  const monthlyResults: MonthlyResult[] = [];
  let cumulativeCashFlow = 0;

  for (let m = 1; m <= inputs.loanTermMonths; m += 1) {
    const rent = rentForMonth(inputs.monthlyRent, annualRentIncreaseRate, m);
    const propertyValue = propertyValueForMonth(
      startingValue,
      monthlyAppreciationRate,
      m
    );
    const scheduleRow = amortizationSchedule[m - 1];
    const debtService = scheduleRow?.payment ?? 0;
    const vacancy = rent * (inputs.vacancyRate ?? 0);
    const repairs = rent * (inputs.repairsRate ?? 0);
    const capex = rent * (inputs.capexRate ?? 0);
    const management = rent * (inputs.managementRate ?? 0);
    const taxes = (inputs.propertyTaxRate ?? 0) * propertyValue / 12;
    const insurance = inputs.insurancePerMonth ?? 0;
    const leaseUp = inputs.leaseUpFee ?? 0;

    const operatingExpenses =
      vacancy + repairs + capex + management + taxes + insurance + leaseUp;
    const noi = rent - operatingExpenses;
    const cashFlow = noi - debtService;
    cumulativeCashFlow += cashFlow;

    monthlyResults.push({
      month: m,
      rent,
      grossIncome: rent,
      vacancy,
      operatingExpenses,
      noi,
      debtService,
      cashFlow,
      cumulativeCashFlow,
      propertyValue,
      equity: propertyValue - (scheduleRow?.balance ?? 0),
      loanBalance: scheduleRow?.balance ?? 0,
      taxes,
      insurance,
      rehabSpend: m === 1 ? inputs.rehabCost : 0,
      phase: "stabilized",
      // Note: interest and principal are captured via amortization schedule.
    });
  }

  const annualSummaries: AnnualSummary[] = [];
  const baseEquityStart = startingValue - loanAmount;

  const totalYears = Math.ceil(inputs.loanTermMonths / 12);
  for (let year = 1; year <= totalYears; year += 1) {
    const startIdx = (year - 1) * 12;
    const slice = monthlyResults.slice(startIdx, startIdx + 12);
    if (slice.length === 0) continue;

    const lastMonth = slice[slice.length - 1];
    const rentSum = slice.reduce((sum, r) => sum + r.rent, 0);
    const expenseSum = slice.reduce((sum, r) => sum + r.operatingExpenses, 0);
    const cashFlowSum = slice.reduce((sum, r) => sum + r.cashFlow, 0);
    const interestPaid = slice.reduce((sum, r, idx) => {
      const amortRow = amortizationSchedule[startIdx + idx];
      return sum + (amortRow?.interest ?? 0);
    }, 0);
    const noiSum = rentSum - expenseSum;
    const debtServiceSum = slice.reduce(
      (sum, r) => sum + r.debtService,
      0
    );

    const equity = lastMonth.equity;
    const equityGrowth = equity - baseEquityStart;
    const totalReturn = cashFlowSum + equityGrowth;

    annualSummaries.push({
      year,
      value: lastMonth.propertyValue,
      debt: lastMonth.loanBalance,
      equity,
      cashInvested: initialCashInvested,
      totalCashInvested: initialCashInvested,
      interestPaid,
      rent: rentSum,
      expenses: expenseSum,
      cashFlow: cashFlowSum,
      equityGrowth,
      totalReturn,
      annualReturnOnInvestedCash:
        initialCashInvested > 0 ? totalReturn / initialCashInvested : 0,
      dscr: debtServiceSum > 0 ? noiSum / debtServiceSum : undefined,
    });
  }

  const yearOneCashFlow = annualSummaries[0]?.cashFlow ?? 0;
  const metrics: BuyHoldMetrics = {
    cashRequired: initialCashInvested,
    yearOneCashFlow,
    dscr: annualSummaries[0]?.dscr ?? 0,
    cashOnCashReturn:
      initialCashInvested > 0 ? yearOneCashFlow / initialCashInvested : 0,
    totalReturn: annualSummaries[annualSummaries.length - 1]?.totalReturn ?? 0,
  };

  return {
    monthly: monthlyResults,
    annual: annualSummaries,
    metrics,
  };
}
