import {
  AnnualSummary,
  FlipInputs,
  FlipMetrics,
  FlipResult,
  MonthlyResult,
} from "./types";
import { monthlyRateFromAnnual } from "./finance";

function propertyValueForMonth(
  startValue: number,
  monthlyAppreciationRate: number,
  monthIndex: number
): number {
  return startValue * Math.pow(1 + monthlyAppreciationRate, monthIndex - 1);
}

export function calculateFlip(inputs: FlipInputs): FlipResult {
  const monthlyAppreciation = monthlyRateFromAnnual(
    inputs.annualAppreciationRate ?? 0
  );
  const bridgeRateMonthly = monthlyRateFromAnnual(
    inputs.bridgeInterestRateAnnual ?? 0
  );
  const holdMonths = inputs.rehabMonths + inputs.monthsOnMarket;
  const salePrice = inputs.salePrice ?? inputs.arv;
  const startingValue = inputs.asIsValue ?? inputs.purchasePrice;

  const bridgePrincipal =
    (inputs.bridgeLtv ?? 1) * (inputs.purchasePrice + inputs.rehabCost);
  const purchaseClosingCosts =
    (inputs.purchaseClosingCostRate ?? 0) * inputs.purchasePrice;
  const downPayment = Math.max(
    0,
    inputs.purchasePrice + inputs.rehabCost - bridgePrincipal
  );
  const cashInvestedAtPurchase = downPayment + purchaseClosingCosts;

  // Hold costs
  const interestTotal = holdMonths * bridgeRateMonthly * bridgePrincipal;
  const taxesTotal = Array.from({ length: holdMonths }).reduce<number>(
    (sum, _, idx) => {
      const propertyValue = propertyValueForMonth(
        startingValue,
        monthlyAppreciation,
        idx + 1
      );
      return sum + ((inputs.propertyTaxRate ?? 0) * propertyValue) / 12;
    },
    0
  );
  const insuranceTotal = holdMonths * (inputs.insurancePerMonth ?? 0);

  // Sale side
  const agentFees = salePrice * (inputs.agentFeeRate ?? 0);
  const sellerClosingCosts = salePrice * (inputs.sellerClosingCostRate ?? 0);
  const saleProceedsAfterCosts = salePrice - agentFees - sellerClosingCosts;
  const netAfterPayoff = saleProceedsAfterCosts - bridgePrincipal;

  const totalCashRequired =
    cashInvestedAtPurchase + interestTotal + taxesTotal + insuranceTotal;
  const profitBeforeTax = netAfterPayoff - totalCashRequired;
  const profitAfterTax =
    profitBeforeTax > 0
      ? profitBeforeTax * (1 - (inputs.marginalTaxRate ?? 0))
      : profitBeforeTax;
  const roi =
    totalCashRequired > 0 ? profitBeforeTax / totalCashRequired : 0;

  const monthlyResults: MonthlyResult[] = [];
  let cumulativeCashFlow = -cashInvestedAtPurchase;
  for (let m = 1; m <= holdMonths; m += 1) {
    const propertyValue = propertyValueForMonth(
      startingValue,
      monthlyAppreciation,
      m
    );
    const taxes = ((inputs.propertyTaxRate ?? 0) * propertyValue) / 12;
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
      phase: m <= inputs.rehabMonths ? "rehab" : "marketing",
    });
  }

  // Final sale event captured as a month after hold period
  const saleEventMonth = holdMonths + 1;
  cumulativeCashFlow += netAfterPayoff;
  monthlyResults.push({
    month: saleEventMonth,
    rent: 0,
    grossIncome: salePrice,
    vacancy: 0,
    operatingExpenses: agentFees + sellerClosingCosts,
    noi: salePrice - agentFees - sellerClosingCosts,
    debtService: bridgePrincipal,
    cashFlow: netAfterPayoff,
    cumulativeCashFlow,
    propertyValue: salePrice,
    equity: salePrice - bridgePrincipal,
    loanBalance: 0,
    taxes: 0,
    insurance: 0,
    rehabSpend: 0,
    phase: "marketing",
  });

  const annualSummaries: AnnualSummary[] = [];
  const totalYears = Math.ceil((holdMonths + 1) / 12);
  for (let year = 1; year <= totalYears; year += 1) {
    const startIdx = (year - 1) * 12;
    const slice = monthlyResults.slice(startIdx, startIdx + 12);
    if (slice.length === 0) continue;
    const lastMonth = slice[slice.length - 1];
    const rentSum = 0;
    const expenseSum = slice.reduce((sum, r) => sum + r.operatingExpenses, 0);
    const cashFlowSum = slice.reduce((sum, r) => sum + r.cashFlow, 0);
    const interestMonthsInSlice = slice.filter(
      (row) => row.month <= holdMonths
    ).length;
    const interestPaid = interestMonthsInSlice * bridgeRateMonthly * bridgePrincipal;
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
      cashInvested: totalCashRequired,
      totalCashInvested: totalCashRequired,
      interestPaid,
      rent: rentSum,
      expenses: expenseSum,
      cashFlow: cashFlowSum,
      equityGrowth,
      totalReturn,
      annualReturnOnInvestedCash:
        totalCashRequired > 0 ? totalReturn / totalCashRequired : 0,
      dscr: debtServiceSum > 0 ? noiSum / debtServiceSum : undefined,
    });
  }

  const metrics: FlipMetrics = {
    totalCashRequired,
    profitBeforeTax,
    profitAfterTax,
    roi,
    holdMonths,
  };

  return {
    monthly: monthlyResults,
    metrics,
  };
}
