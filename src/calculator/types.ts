// Shared calculator types for Off Leash Deal Analyzer.
// Rates are expressed as decimals (e.g. 0.07 for 7%).

export enum Strategy {
  BUY_HOLD = "BUY_HOLD",
  BRRRR = "BRRRR",
  FLIP = "FLIP",
}

export interface BaseInputs {
  strategy: Strategy;
  purchasePrice: number;
  rehabCost: number;
  arv: number;
  purchaseClosingCostRate?: number;
  annualAppreciationRate?: number;
  annualRentIncreaseRate?: number;
  propertyTaxRate?: number;
  insurancePerMonth?: number;
}

export interface RentExpenseInputs {
  monthlyRent: number;
  vacancyRate?: number;
  repairsRate?: number;
  capexRate?: number;
  managementRate?: number;
  leaseUpFee?: number;
}

export interface LoanInputs {
  loanTermMonths: number;
  interestRateAnnual: number;
  ltv?: number;
  downPayment?: number;
  loanAmount?: number;
  pointsRate?: number;
  loanClosingCostRate?: number;
}

export interface BuyHoldInputs extends BaseInputs, RentExpenseInputs, LoanInputs {
  rehabMonths?: number;
  asIsValue?: number;
}

export interface BRRRRInputs extends BaseInputs, RentExpenseInputs {
  bridgeLtv?: number;
  bridgeInterestRateAnnual?: number;
  bridgeTermMonths?: number;
  rehabMonths: number;
  refiLtv: number;
  refiPointsRate?: number;
  refiClosingCostRate?: number;
  longTermLoan: LoanInputs;
  asIsValue?: number;
}

export interface FlipInputs extends BaseInputs {
  rehabMonths: number;
  monthsOnMarket: number;
  salePrice?: number;
  agentFeeRate?: number;
  sellerClosingCostRate?: number;
  marginalTaxRate?: number;
  bridgeInterestRateAnnual?: number;
  bridgeLtv?: number;
  asIsValue?: number;
}

export type StrategyInputs = BuyHoldInputs | BRRRRInputs | FlipInputs;

export type PhaseTag = "current" | "rehab" | "stabilized" | "marketing";

export interface MonthlyResult {
  month: number;
  rent: number;
  grossIncome: number;
  vacancy: number;
  operatingExpenses: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  cumulativeCashFlow: number;
  propertyValue: number;
  equity: number;
  loanBalance: number;
  taxes?: number;
  insurance?: number;
  rehabSpend?: number;
  phase?: PhaseTag;
}

export interface AnnualSummary {
  year: number;
  value: number;
  debt: number;
  equity: number;
  cashInvested: number;
  totalCashInvested: number;
  interestPaid: number;
  rent: number;
  expenses: number;
  cashFlow: number;
  equityGrowth: number;
  totalReturn: number;
  annualReturnOnInvestedCash?: number;
  dscr?: number;
}

export interface BuyHoldMetrics {
  cashRequired: number;
  yearOneCashFlow: number;
  dscr: number;
  cashOnCashReturn: number;
  totalReturn: number;
}

export interface BRRRRMetrics extends BuyHoldMetrics {
  cashLeftInDeal: number;
  refiProceeds: number;
  bridgeInterest: number;
}

export interface FlipMetrics {
  totalCashRequired: number;
  profitBeforeTax: number;
  profitAfterTax: number;
  roi: number;
  holdMonths: number;
}

export type BuyHoldResult = {
  monthly: MonthlyResult[];
  annual: AnnualSummary[];
  metrics: BuyHoldMetrics;
};

export type BRRRRResult = {
  monthly: MonthlyResult[];
  annual: AnnualSummary[];
  metrics: BRRRRMetrics;
};

export type FlipResult = {
  monthly: MonthlyResult[];
  metrics: FlipMetrics;
};

export type CalculateBuyHold = (inputs: BuyHoldInputs) => BuyHoldResult;
export type CalculateBRRRR = (inputs: BRRRRInputs) => BRRRRResult;
export type CalculateFlip = (inputs: FlipInputs) => FlipResult;
