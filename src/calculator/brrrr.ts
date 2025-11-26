import {
  AnnualSummary,
  BRRRRInputs,
  BRRRRMetrics,
  BRRRRResult,
  MonthlyResult,
} from "./types";
import {
  buildAmortizationSchedule,
  monthlyRateFromAnnual,
  AmortizationRow,
} from "./finance";

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

export function calculateBRRRR(inputs: BRRRRInputs): BRRRRResult {
  const monthlyRentIncrease = inputs.annualRentIncreaseRate ?? 0;
  const monthlyAppreciation = monthlyRateFromAnnual(
    inputs.annualAppreciationRate ?? 0
  );
  const bridgeRateMonthly = monthlyRateFromAnnual(
    inputs.bridgeInterestRateAnnual ?? 0
  );
  const longTermRateMonthly = monthlyRateFromAnnual(
    inputs.longTermLoan.interestRateAnnual ?? 0
  );

  const startingValue = inputs.asIsValue ?? inputs.purchasePrice;
  const bridgePrincipal =
    (inputs.bridgeLtv ?? 1) * inputs.purchasePrice +
    (inputs.bridgeLtv ?? 0) * inputs.rehabCost;

  const purchaseClosingCosts =
    (inputs.purchaseClosingCostRate ?? 0) * inputs.purchasePrice;
  const cashInvestedBeforeRefi =
    Math.max(0, inputs.purchasePrice + inputs.rehabCost - bridgePrincipal) +
    purchaseClosingCosts;

  const refiLoanAmount = inputs.refiLtv * inputs.arv;
  const refiClosingCosts = (inputs.refiClosingCostRate ?? 0) * refiLoanAmount;
  const refiPoints = (inputs.refiPointsRate ?? 0) * refiLoanAmount;
  const bridgePayoff = bridgePrincipal; // interest-only bridge assumed
  const refiCashOut = refiLoanAmount - refiClosingCosts - refiPoints - bridgePayoff;
  const cashLeftInDeal = cashInvestedBeforeRefi - refiCashOut;
  const cashRequired = Math.max(0, cashLeftInDeal);

  const longTermSchedule: AmortizationRow[] = buildAmortizationSchedule({
    principal: refiLoanAmount,
    ratePerPeriod: longTermRateMonthly,
    totalPayments: inputs.longTermLoan.loanTermMonths,
  });

  const monthlyResults: MonthlyResult[] = [];
  let cumulativeCashFlow = -cashInvestedBeforeRefi; // track initial cash out

  // Rehab / bridge phase
  for (let m = 1; m <= inputs.rehabMonths; m += 1) {
    const propertyValue = propertyValueForMonth(
      startingValue,
      monthlyAppreciation,
      m
    );
    const taxes = (inputs.propertyTaxRate ?? 0) * propertyValue / 12;
    const insurance = inputs.insurancePerMonth ?? 0;
    const interest = bridgePrincipal * bridgeRateMonthly;
    const operatingExpenses = taxes + insurance;
    const cashFlow = -operatingExpenses - interest;
    cumulativeCashFlow += cashFlow;

    monthlyResults.push({
      month: m,
      rent: 0,
      grossIncome: 0,
      vacancy: 0,
      operatingExpenses,
      noi: -operatingExpenses,
      debtService: interest,
      cashFlow,
      cumulativeCashFlow,
      propertyValue,
      equity: propertyValue - bridgePrincipal,
      loanBalance: bridgePrincipal,
      taxes,
      insurance,
      rehabSpend: m === 1 ? inputs.rehabCost : 0,
      phase: "rehab",
    });
  }

  // Post-refi rental phase
  const postRefiStartMonth = inputs.rehabMonths + 1;
  for (let j = 1; j <= inputs.longTermLoan.loanTermMonths; j += 1) {
    const globalMonth = postRefiStartMonth + (j - 1);
    const propertyValue = propertyValueForMonth(
      inputs.arv,
      monthlyAppreciation,
      j
    );
    const rent = rentForMonth(
      inputs.monthlyRent,
      monthlyRentIncrease,
      globalMonth
    );
    const taxes = (inputs.propertyTaxRate ?? 0) * propertyValue / 12;
    const insurance = inputs.insurancePerMonth ?? 0;
    const vacancy = rent * (inputs.vacancyRate ?? 0);
    const repairs = rent * (inputs.repairsRate ?? 0);
    const capex = rent * (inputs.capexRate ?? 0);
    const management = rent * (inputs.managementRate ?? 0);
    const leaseUp = inputs.leaseUpFee ?? 0;
    const operatingExpenses =
      taxes + insurance + vacancy + repairs + capex + management + leaseUp;

    const amortRow = longTermSchedule[j - 1];
    const debtService = amortRow?.payment ?? 0;
    const cashFlow = rent - operatingExpenses - debtService;
    cumulativeCashFlow += cashFlow;

    monthlyResults.push({
      month: globalMonth,
      rent,
      grossIncome: rent,
      vacancy,
      operatingExpenses,
      noi: rent - operatingExpenses,
      debtService,
      cashFlow,
      cumulativeCashFlow,
      propertyValue,
      equity: propertyValue - (amortRow?.balance ?? 0),
      loanBalance: amortRow?.balance ?? 0,
      taxes,
      insurance,
      phase: "stabilized",
    });
  }

  // Annual summaries across full timeline
  const annualSummaries: AnnualSummary[] = [];
  const totalMonths =
    inputs.rehabMonths + inputs.longTermLoan.loanTermMonths;
  const totalYears = Math.ceil(totalMonths / 12);
  for (let year = 1; year <= totalYears; year += 1) {
    const startIdx = (year - 1) * 12;
    const slice = monthlyResults.slice(startIdx, startIdx + 12);
    if (slice.length === 0) continue;
    const lastMonth = slice[slice.length - 1];

    const rentSum = slice.reduce((sum, r) => sum + r.rent, 0);
    const expenseSum = slice.reduce((sum, r) => sum + r.operatingExpenses, 0);
    const cashFlowSum = slice.reduce((sum, r) => sum + r.cashFlow, 0);
    const interestPaid = slice.reduce((sum, r, idx) => {
      // Bridge interest in rehab phase, long-term thereafter.
      if (startIdx + idx < inputs.rehabMonths) {
        return sum + bridgeRateMonthly * bridgePrincipal;
      }
      const amortRow =
        longTermSchedule[startIdx + idx - inputs.rehabMonths];
      return sum + (amortRow?.interest ?? 0);
    }, 0);
    const debtServiceSum = slice.reduce(
      (sum, r) => sum + r.debtService,
      0
    );
    const noiSum = rentSum - expenseSum;
    const equity = lastMonth.equity;
    const equityGrowth = equity - (startingValue - bridgePrincipal);
    const totalReturn = cashFlowSum + equityGrowth;

    annualSummaries.push({
      year,
      value: lastMonth.propertyValue,
      debt: lastMonth.loanBalance,
      equity,
      cashInvested: cashRequired,
      totalCashInvested: cashRequired,
      interestPaid,
      rent: rentSum,
      expenses: expenseSum,
      cashFlow: cashFlowSum,
      equityGrowth,
      totalReturn,
      annualReturnOnInvestedCash:
        cashRequired > 0 ? totalReturn / cashRequired : 0,
      dscr: debtServiceSum > 0 ? noiSum / debtServiceSum : undefined,
    });
  }

  const yearOneCashFlow = annualSummaries[0]?.cashFlow ?? 0;
  const metrics: BRRRRMetrics = {
    cashRequired,
    yearOneCashFlow,
    dscr: annualSummaries[0]?.dscr ?? 0,
    cashOnCashReturn:
      cashRequired > 0 ? yearOneCashFlow / cashRequired : 0,
    totalReturn: annualSummaries[annualSummaries.length - 1]?.totalReturn ?? 0,
    cashLeftInDeal,
    refiProceeds: refiLoanAmount,
    bridgeInterest:
      inputs.rehabMonths * bridgeRateMonthly * bridgePrincipal,
  };

  return {
    monthly: monthlyResults,
    annual: annualSummaries,
    metrics,
  };
}
