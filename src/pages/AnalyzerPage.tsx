import React, { useEffect, useId, useState } from "react";
import {
  Strategy,
  BuyHoldInputs,
  BRRRRInputs,
  FlipInputs,
  BuyHoldResult,
  BRRRRResult,
  FlipResult,
} from "../calculator/types";
import {
  calculateBuyHold,
  calculateBRRRR,
  calculateFlip,
} from "../calculator";
import { calculateRehabTotal, RehabItem, RehabSelection } from "../calculator/rehab";
import { upsertAnalysis, searchProperties } from "../data/store";
import { useMemo } from "react";
import { SummaryCard } from "../components/SummaryCard";
import { InvestmentTable } from "../components/InvestmentTable";
import { CurrencyField } from "../components/fields/CurrencyField";
import { PercentField } from "../components/fields/PercentField";
import { NumberField } from "../components/fields/NumberField";

type CalcResult = BuyHoldResult | BRRRRResult | FlipResult;

// Industry-average financing/operating defaults; users can tweak these in the UI.
const defaultAssumptions = {
  purchaseClosingCostRate: 0.025,
  refiClosingCostRate: 0.025,
  refiPointsRate: 0.01,
  annualAppreciationRate: 0.03,
  annualRentIncreaseRate: 0.025,
  propertyTaxRate: 0.0125,
  insurancePerMonth: 135,
  vacancyRate: 0.06,
  repairsRate: 0.08,
  capexRate: 0.05,
  managementRate: 0.08,
  leaseUpFee: 500,
  buyHoldLtv: 0.75,
  longTermInterestRateAnnual: 0.0675,
  longTermLoanTermMonths: 360,
  bridgeLtv: 0.85,
  bridgeInterestRateAnnual: 0.1,
  bridgeTermMonths: 6,
  refiLtv: 0.75,
  agentFeeRate: 0.06,
  sellerClosingCostRate: 0.02,
  marginalTaxRate: 0.25,
};

const defaultBuyHold: BuyHoldInputs = {
  strategy: Strategy.BUY_HOLD,
  purchasePrice: 250_000,
  rehabCost: 0,
  arv: 250_000,
  purchaseClosingCostRate: defaultAssumptions.purchaseClosingCostRate,
  annualAppreciationRate: defaultAssumptions.annualAppreciationRate,
  annualRentIncreaseRate: defaultAssumptions.annualRentIncreaseRate,
  propertyTaxRate: defaultAssumptions.propertyTaxRate,
  insurancePerMonth: defaultAssumptions.insurancePerMonth,
  monthlyRent: 2000,
  vacancyRate: defaultAssumptions.vacancyRate,
  repairsRate: defaultAssumptions.repairsRate,
  capexRate: defaultAssumptions.capexRate,
  managementRate: defaultAssumptions.managementRate,
  leaseUpFee: defaultAssumptions.leaseUpFee,
  loanTermMonths: defaultAssumptions.longTermLoanTermMonths,
  interestRateAnnual: defaultAssumptions.longTermInterestRateAnnual,
  ltv: defaultAssumptions.buyHoldLtv,
};

const defaultBRRRR: BRRRRInputs = {
  strategy: Strategy.BRRRR,
  purchasePrice: 200_000,
  rehabCost: 40_000,
  arv: 280_000,
  purchaseClosingCostRate: defaultAssumptions.purchaseClosingCostRate,
  annualAppreciationRate: defaultAssumptions.annualAppreciationRate,
  annualRentIncreaseRate: defaultAssumptions.annualRentIncreaseRate,
  propertyTaxRate: defaultAssumptions.propertyTaxRate,
  insurancePerMonth: defaultAssumptions.insurancePerMonth,
  monthlyRent: 2300,
  vacancyRate: defaultAssumptions.vacancyRate,
  repairsRate: defaultAssumptions.repairsRate,
  capexRate: defaultAssumptions.capexRate,
  managementRate: defaultAssumptions.managementRate,
  leaseUpFee: defaultAssumptions.leaseUpFee,
  bridgeLtv: defaultAssumptions.bridgeLtv,
  bridgeInterestRateAnnual: defaultAssumptions.bridgeInterestRateAnnual,
  bridgeTermMonths: defaultAssumptions.bridgeTermMonths,
  rehabMonths: 6,
  refiLtv: defaultAssumptions.refiLtv,
  refiPointsRate: defaultAssumptions.refiPointsRate,
  refiClosingCostRate: defaultAssumptions.refiClosingCostRate,
  longTermLoan: {
    loanTermMonths: defaultAssumptions.longTermLoanTermMonths,
    interestRateAnnual: defaultAssumptions.longTermInterestRateAnnual,
    ltv: defaultAssumptions.refiLtv,
  },
};

const defaultFlip: FlipInputs = {
  strategy: Strategy.FLIP,
  purchasePrice: 150_000,
  rehabCost: 35_000,
  arv: 235_000,
  purchaseClosingCostRate: defaultAssumptions.purchaseClosingCostRate,
  annualAppreciationRate: defaultAssumptions.annualAppreciationRate,
  propertyTaxRate: defaultAssumptions.propertyTaxRate,
  insurancePerMonth: defaultAssumptions.insurancePerMonth,
  rehabMonths: 5,
  monthsOnMarket: 2,
  salePrice: 235_000,
  agentFeeRate: defaultAssumptions.agentFeeRate,
  sellerClosingCostRate: defaultAssumptions.sellerClosingCostRate,
  marginalTaxRate: defaultAssumptions.marginalTaxRate,
  bridgeInterestRateAnnual: defaultAssumptions.bridgeInterestRateAnnual,
  bridgeLtv: defaultAssumptions.bridgeLtv,
};

const defaultRehabItems: RehabItem[] = [
  // Flooring
  {
    id: "floor-lvp",
    category: "Flooring",
    label: "LVP Flooring (per sq ft)",
    unitType: "quantity",
    basePrices: { C: 4.5, B: 6.5 },
    defaultQuantity: 1000,
  },
  {
    id: "floor-carpet",
    category: "Flooring",
    label: "Carpeting (per sq ft)",
    unitType: "quantity",
    basePrices: { C: 3.0, B: 4.5 },
    defaultQuantity: 800,
  },
  {
    id: "floor-bath-tile",
    category: "Flooring",
    label: "Tile for Bathroom Floor",
    unitType: "fixed",
    basePrices: { C: 800, B: 1200 },
    defaultQuantity: 1,
  },
  // Kitchen
  {
    id: "kitchen-cabinets",
    category: "Kitchen",
    label: "Kitchen Cabinets",
    unitType: "fixed",
    basePrices: { C: 5000, B: 8000 },
    defaultQuantity: 1,
  },
  {
    id: "kitchen-countertops",
    category: "Kitchen",
    label: "Kitchen Countertops",
    unitType: "fixed",
    basePrices: { C: 3000, B: 5000 },
    defaultQuantity: 1,
  },
  {
    id: "kitchen-appliances",
    category: "Kitchen",
    label: "Kitchen Appliance Package",
    unitType: "fixed",
    basePrices: { C: 2500, B: 4000 },
    defaultQuantity: 1,
  },
  {
    id: "kitchen-sink",
    category: "Kitchen",
    label: "Kitchen Sink & Faucet",
    unitType: "fixed",
    basePrices: { C: 400, B: 700 },
    defaultQuantity: 1,
  },
  // Bathrooms
  {
    id: "bath-full-reno",
    category: "Bathrooms",
    label: "Full Bathroom Renovation",
    unitType: "fixed",
    basePrices: { C: 4500, B: 7500 },
    defaultQuantity: 1,
  },
  {
    id: "bath-vanity",
    category: "Bathrooms",
    label: "New Vanity with Sink",
    unitType: "fixed",
    basePrices: { C: 600, B: 1200 },
    defaultQuantity: 1,
  },
  {
    id: "bath-toilet",
    category: "Bathrooms",
    label: "New Toilet",
    unitType: "fixed",
    basePrices: { C: 300, B: 500 },
    defaultQuantity: 2,
  },
  {
    id: "bath-mirror-light",
    category: "Bathrooms",
    label: "Bathroom Mirror & Light",
    unitType: "fixed",
    basePrices: { C: 200, B: 400 },
    defaultQuantity: 2,
  },
  // General
  {
    id: "general-int-paint",
    category: "General",
    label: "Interior Paint (per sq ft)",
    unitType: "quantity",
    basePrices: { C: 1.5, B: 2.5 },
    defaultQuantity: 1000,
  },
  {
    id: "general-drywall",
    category: "General",
    label: "Drywall Repair (per sq ft)",
    unitType: "quantity",
    basePrices: { C: 0.5, B: 0.8 },
    defaultQuantity: 200,
  },
  {
    id: "general-wall-prep",
    category: "General",
    label: "Wall Prep & Patching (per sq ft)",
    unitType: "quantity",
    basePrices: { C: 0.3, B: 0.5 },
    defaultQuantity: 200,
  },
  {
    id: "general-interior-doors",
    category: "General",
    label: "New Interior Doors",
    unitType: "quantity",
    basePrices: { C: 250, B: 350 },
    defaultQuantity: 8,
  },
  {
    id: "general-door-hardware",
    category: "General",
    label: "Door Knobs and Hardware",
    unitType: "quantity",
    basePrices: { C: 35, B: 65 },
    defaultQuantity: 8,
  },
  {
    id: "general-exterior-doors",
    category: "General",
    label: "New Exterior Doors",
    unitType: "quantity",
    basePrices: { C: 500, B: 800 },
    defaultQuantity: 2,
  },
  {
    id: "general-windows",
    category: "General",
    label: "New Windows (per window)",
    unitType: "quantity",
    basePrices: { C: 450, B: 650 },
    defaultQuantity: 10,
  },
  {
    id: "general-blinds",
    category: "General",
    label: "Window Blinds",
    unitType: "quantity",
    basePrices: { C: 50, B: 80 },
    defaultQuantity: 10,
  },
  {
    id: "general-detectors",
    category: "General",
    label: "Smoke/CO Detectors",
    unitType: "quantity",
    basePrices: { C: 35, B: 35 },
    defaultQuantity: 6,
  },
  // Infrastructure
  {
    id: "infra-exterior-paint",
    category: "Infrastructure",
    label: "Exterior Paint",
    unitType: "fixed",
    basePrices: { C: 4000, B: 6000 },
    defaultQuantity: 1,
  },
  {
    id: "infra-roof",
    category: "Infrastructure",
    label: "New Roof",
    unitType: "fixed",
    basePrices: { C: 8000, B: 10000 },
    defaultQuantity: 1,
  },
  {
    id: "infra-siding",
    category: "Infrastructure",
    label: "New Siding/Fascia",
    unitType: "fixed",
    basePrices: { C: 3500, B: 5000 },
    defaultQuantity: 1,
  },
  {
    id: "infra-electrical",
    category: "Infrastructure",
    label: "Electrical Update",
    unitType: "fixed",
    basePrices: { C: 4000, B: 6000 },
    defaultQuantity: 1,
  },
  {
    id: "infra-plumbing",
    category: "Infrastructure",
    label: "Plumbing Update",
    unitType: "fixed",
    basePrices: { C: 3500, B: 5000 },
    defaultQuantity: 1,
  },
  {
    id: "infra-water-heater",
    category: "Infrastructure",
    label: "Water Heater",
    unitType: "fixed",
    basePrices: { C: 1200, B: 1800 },
    defaultQuantity: 1,
  },
  {
    id: "infra-ac",
    category: "Infrastructure",
    label: "New AC Unit",
    unitType: "fixed",
    basePrices: { C: 5000, B: 6500 },
    defaultQuantity: 1,
  },
  {
    id: "infra-furnace",
    category: "Infrastructure",
    label: "New Furnace",
    unitType: "fixed",
    basePrices: { C: 4500, B: 5500 },
    defaultQuantity: 1,
  },
  {
    id: "infra-landscaping",
    category: "Infrastructure",
    label: "Landscaping",
    unitType: "fixed",
    basePrices: { C: 2000, B: 3500 },
    defaultQuantity: 1,
  },
  {
    id: "infra-concrete",
    category: "Infrastructure",
    label: "Concrete/Porch Work",
    unitType: "fixed",
    basePrices: { C: 2500, B: 4000 },
    defaultQuantity: 1,
  },
  {
    id: "infra-waterproofing",
    category: "Infrastructure",
    label: "Basement Waterproofing",
    unitType: "fixed",
    basePrices: { C: 3000, B: 4000 },
    defaultQuantity: 1,
  },
  // Contingency
  {
    id: "contingency",
    category: "Contingency",
    label: "Contingency (per sq ft)",
    unitType: "quantity",
    basePrices: { C: 2.0, B: 3.0 },
    defaultQuantity: 1000,
  },
  {
    id: "custom-1",
    category: "Contingency",
    label: "Custom Item 1 (placeholder)",
    unitType: "fixed",
    basePrices: { C: 0, B: 0 },
    defaultQuantity: 1,
  },
];

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function AnalyzerPage() {
  const [strategy, setStrategy] = useState<Strategy>(Strategy.BUY_HOLD);
  const [buyHoldInputs, setBuyHoldInputs] =
    useState<BuyHoldInputs>(defaultBuyHold);
  const [brrrrInputs, setBrrrrInputs] =
    useState<BRRRRInputs>(defaultBRRRR);
  const [flipInputs, setFlipInputs] = useState<FlipInputs>(defaultFlip);
  const [propertyQuery, setPropertyQuery] = useState("");
  const propertySuggestions = useMemo(
    () => (propertyQuery.length > 1 ? searchProperties(propertyQuery) : []),
    [propertyQuery]
  );
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [rehabItems] = useState<RehabItem[]>(defaultRehabItems);
  const [rehabSelections, setRehabSelections] = useState<RehabSelection[]>(
    defaultRehabItems.map((item) => ({
      id: item.id,
      quantity: item.defaultQuantity ?? 1,
      selected: false,
    }))
  );
  const rehabQualityOptions = [
    { id: "C", label: "C – value-driven" },
    { id: "B", label: "B – rental ready" },
    { id: "A", label: "A – premium (+30%)" },
  ] as const;
  const rehabQualityMultipliers: Record<"A" | "B" | "C", number> = { A: 1.3, B: 1, C: 0.8 };
  const [rehabQuality, setRehabQuality] = useState<(typeof rehabQualityOptions)[number]>(rehabQualityOptions[1]);
  useEffect(() => {
    const match = propertySuggestions.find(
      (p) => `${p.address_line_1}, ${p.city}`.toLowerCase() === propertyQuery.toLowerCase()
    );
    if (match) {
      setBuyHoldInputs((prev) => ({
        ...prev,
        monthlyRent: match.default_rent ?? prev.monthlyRent,
        propertyTaxRate: match.default_property_tax_rate ?? prev.propertyTaxRate,
      }));
    }
  }, [propertyQuery, propertySuggestions]);

  const [autoUpdate, setAutoUpdate] = useState(true);
  const [calcResult, setCalcResult] = useState<CalcResult>(() =>
    computeResult(strategy, buyHoldInputs, brrrrInputs, flipInputs)
  );
  const [defaultsAppliedAt, setDefaultsAppliedAt] = useState<Partial<Record<Strategy, number>>>({});

  useEffect(() => {
    if (!autoUpdate) return;
    const handle = setTimeout(() => {
      setCalcResult(computeResult(strategy, buyHoldInputs, brrrrInputs, flipInputs));
    }, 200);
    return () => clearTimeout(handle);
  }, [strategy, buyHoldInputs, brrrrInputs, flipInputs, autoUpdate]);

  const warnings = getValidationWarnings(strategy, {
    buyHoldInputs,
    brrrrInputs,
    flipInputs,
  });

  const rehabTotal = calculateRehabTotal(rehabItems, rehabSelections, rehabQuality.id as "A" | "B" | "C", rehabQualityMultipliers);

  const applyRehabToCurrentStrategy = () => {
    if (strategy === Strategy.BRRRR) {
      setBrrrrInputs((prev) => ({ ...prev, rehabCost: rehabTotal }));
      return;
    }
    if (strategy === Strategy.FLIP) {
      setFlipInputs((prev) => ({ ...prev, rehabCost: rehabTotal }));
      return;
    }
    setBuyHoldInputs((prev) => ({ ...prev, rehabCost: rehabTotal }));
  };

  const summaryCards = buildSummaryCards(strategy, calcResult);
  const handleSave = () => {
    const name = window.prompt("Name this analysis", "Untitled Analysis");
    if (!name) return;
    const inputs =
      strategy === Strategy.BRRRR
        ? brrrrInputs
        : strategy === Strategy.FLIP
        ? flipInputs
        : buyHoldInputs;
    upsertAnalysis(name, strategy, inputs);
    alert("Saved.");
  };

  const ensureNumber = (value: number | undefined, fallback: number) => {
    if (value === undefined) return fallback;
    return Number.isFinite(value) ? value : fallback;
  };

  const markDefaultsApplied = (strategyKey: Strategy) => {
    setDefaultsAppliedAt((prev) => ({ ...prev, [strategyKey]: Date.now() }));
  };

  const applyDefaultBuyHoldAssumptions = () => {
    setBuyHoldInputs((prev) => {
      const next = {
        ...prev,
        purchasePrice: ensureNumber(prev.purchasePrice, defaultBuyHold.purchasePrice),
        rehabCost: ensureNumber(prev.rehabCost, defaultBuyHold.rehabCost),
        arv: ensureNumber(prev.arv, defaultBuyHold.arv),
        monthlyRent: ensureNumber(prev.monthlyRent, defaultBuyHold.monthlyRent),
        purchaseClosingCostRate: defaultAssumptions.purchaseClosingCostRate,
        interestRateAnnual: defaultAssumptions.longTermInterestRateAnnual,
        loanTermMonths: defaultAssumptions.longTermLoanTermMonths,
        ltv: defaultAssumptions.buyHoldLtv,
        annualAppreciationRate: defaultAssumptions.annualAppreciationRate,
        annualRentIncreaseRate: defaultAssumptions.annualRentIncreaseRate,
        insurancePerMonth: defaultAssumptions.insurancePerMonth,
        vacancyRate: defaultAssumptions.vacancyRate,
        repairsRate: defaultAssumptions.repairsRate,
        capexRate: defaultAssumptions.capexRate,
        managementRate: defaultAssumptions.managementRate,
        leaseUpFee: defaultAssumptions.leaseUpFee,
        propertyTaxRate: defaultAssumptions.propertyTaxRate,
      };
      if (!autoUpdate) {
        setCalcResult(computeResult(Strategy.BUY_HOLD, next, brrrrInputs, flipInputs));
      }
      return next;
    });
    markDefaultsApplied(Strategy.BUY_HOLD);
  };

  const applyDefaultBrrrrAssumptions = () => {
    setBrrrrInputs((prev) => {
      const next = {
        ...prev,
        purchasePrice: ensureNumber(prev.purchasePrice, defaultBRRRR.purchasePrice),
        rehabCost: ensureNumber(prev.rehabCost, defaultBRRRR.rehabCost),
        arv: ensureNumber(prev.arv, defaultBRRRR.arv),
        monthlyRent: ensureNumber(prev.monthlyRent, defaultBRRRR.monthlyRent),
        purchaseClosingCostRate: defaultAssumptions.purchaseClosingCostRate,
        refiClosingCostRate: defaultAssumptions.refiClosingCostRate,
        refiPointsRate: defaultAssumptions.refiPointsRate,
        annualAppreciationRate: defaultAssumptions.annualAppreciationRate,
        annualRentIncreaseRate: defaultAssumptions.annualRentIncreaseRate,
        propertyTaxRate: defaultAssumptions.propertyTaxRate,
        insurancePerMonth: defaultAssumptions.insurancePerMonth,
        vacancyRate: defaultAssumptions.vacancyRate,
        repairsRate: defaultAssumptions.repairsRate,
        capexRate: defaultAssumptions.capexRate,
        managementRate: defaultAssumptions.managementRate,
        leaseUpFee: defaultAssumptions.leaseUpFee,
        bridgeLtv: defaultAssumptions.bridgeLtv,
        bridgeInterestRateAnnual: defaultAssumptions.bridgeInterestRateAnnual,
        bridgeTermMonths: defaultAssumptions.bridgeTermMonths,
        refiLtv: defaultAssumptions.refiLtv,
        longTermLoan: {
          ...prev.longTermLoan,
          loanTermMonths: defaultAssumptions.longTermLoanTermMonths,
          interestRateAnnual: defaultAssumptions.longTermInterestRateAnnual,
          ltv: defaultAssumptions.refiLtv,
        },
      };
      if (!autoUpdate) {
        setCalcResult(computeResult(Strategy.BRRRR, buyHoldInputs, next, flipInputs));
      }
      return next;
    });
    markDefaultsApplied(Strategy.BRRRR);
  };

  const applyDefaultFlipAssumptions = () => {
    setFlipInputs((prev) => {
      const next = {
        ...prev,
        purchasePrice: ensureNumber(prev.purchasePrice, defaultFlip.purchasePrice),
        rehabCost: ensureNumber(prev.rehabCost, defaultFlip.rehabCost),
        arv: ensureNumber(prev.arv, defaultFlip.arv),
        salePrice: ensureNumber(prev.salePrice, defaultFlip.salePrice ?? defaultFlip.arv),
        purchaseClosingCostRate: defaultAssumptions.purchaseClosingCostRate,
        annualAppreciationRate: defaultAssumptions.annualAppreciationRate,
        propertyTaxRate: defaultAssumptions.propertyTaxRate,
        insurancePerMonth: defaultAssumptions.insurancePerMonth,
        agentFeeRate: defaultAssumptions.agentFeeRate,
        sellerClosingCostRate: defaultAssumptions.sellerClosingCostRate,
        marginalTaxRate: defaultAssumptions.marginalTaxRate,
        bridgeInterestRateAnnual: defaultAssumptions.bridgeInterestRateAnnual,
        bridgeLtv: defaultAssumptions.bridgeLtv,
      };
      if (!autoUpdate) {
        setCalcResult(computeResult(Strategy.FLIP, buyHoldInputs, brrrrInputs, next));
      }
      return next;
    });
    markDefaultsApplied(Strategy.FLIP);
  };

  return (
    <main className="page">
      <div className="card">
        <div className="strategy-header">
          <div>
            <div className="pill">MVP</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>
              Strategy & Inputs
            </h2>
            <p className="section-subtitle">
              Start with the essentials, then open the advanced settings only if you need to fine-tune.
            </p>
          </div>
          <div className="strategy-toggle">
            {Object.values(Strategy).map((s) => (
              <button
                key={s}
                className={`strategy-option ${
                  strategy === s ? "active" : ""
                }`}
                onClick={() => setStrategy(s)}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="strategy-actions">
            <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 14 }}>
              <input
                type="checkbox"
                checked={autoUpdate}
                onChange={(e) => setAutoUpdate(e.target.checked)}
               />
               Auto-update (debounced)
             </label>
             {!autoUpdate && (
               <button
                 style={{
                   padding: "10px 14px",
                   borderRadius: 8,
                   border: "1px solid #2563eb",
                   background: "#2563eb",
                   color: "#fff",
                   fontWeight: 600,
                   cursor: "pointer",
                 }}
                 onClick={() =>
                   setCalcResult(
                     computeResult(strategy, buyHoldInputs, brrrrInputs, flipInputs)
                   )
                 }
               >
                 Recalculate
               </button>
             )}
             <button
               style={{
                 padding: "10px 14px",
                 borderRadius: 8,
                 border: "1px solid #0f172a",
                 background: "#0f172a",
                 color: "#fff",
                 fontWeight: 600,
                 cursor: "pointer",
               }}
               onClick={handleSave}
             >
               Save analysis
             </button>
          </div>
        </div>

        {strategy === Strategy.BUY_HOLD && (
          <StrategySection title="Buy & Hold">
            <Collapsible title="Quick setup" defaultOpen>
              <div className="grid two">
                <div className="field">
                  <label className="field-label">
                    <span>Property search</span>
                    <button
                      type="button"
                      className="help-icon"
                      title="Search saved properties to prefill rent/taxes and other defaults."
                      data-tip="Search saved properties to prefill rent/taxes and other defaults."
                      aria-label="Property search info"
                    >
                      ?
                    </button>
                  </label>
                  <input
                    value={propertyQuery}
                    onChange={(e) => setPropertyQuery(e.target.value)}
                    placeholder="123 Main St"
                  />
                  {propertySuggestions.length > 0 && (
                    <div className="card" style={{ padding: 8, marginTop: 6 }}>
                      {propertySuggestions.slice(0, 5).map((p) => (
                        <div
                          key={p.id}
                          style={{ padding: "4px 0", cursor: "pointer" }}
                          onClick={() => setPropertyQuery(`${p.address_line_1}, ${p.city}`)}
                        >
                          {p.address_line_1}, {p.city}
                        </div>
                      ))}
                    </div>
                  )}
                  <small>Type to search saved properties; selecting will prefill rent/taxes.</small>
                </div>
                <CurrencyField
                  label="Purchase price"
                  value={buyHoldInputs.purchasePrice}
                  tooltip="Acquisition price before closing costs."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, purchasePrice: v })
                  }
                />
                <CurrencyField
                  label="Rehab cost"
                  value={buyHoldInputs.rehabCost}
                  tooltip="Total improvements if you are not using the detailed rehab estimator."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, rehabCost: v })
                  }
                />
                <CurrencyField
                  label="After repair value (ARV)"
                  value={buyHoldInputs.arv}
                  tooltip="Expected property value after rehab/stabilization."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, arv: v })
                  }
                />
                <CurrencyField
                  label="Monthly rent"
                  value={buyHoldInputs.monthlyRent}
                  tooltip="Target stabilized monthly rent."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, monthlyRent: v })
                  }
                />
                <PercentField
                  label="Property tax rate"
                  value={buyHoldInputs.propertyTaxRate ?? 0}
                  fallbackValue={defaultAssumptions.propertyTaxRate}
                  mode="percent"
                  tooltip="Annual property tax rate."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, propertyTaxRate: v })
                  }
                />
              </div>
            </Collapsible>

            <Collapsible title="Financing & assumptions" defaultOpen={false}>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {defaultsAppliedAt[Strategy.BUY_HOLD] && (
                  <span
                    className="chip"
                    style={{
                      background: "#ecfeff",
                      color: "#0b7099",
                      border: "1px solid #bae6fd",
                      boxShadow: "0 4px 8px rgba(11, 112, 153, 0.08)",
                    }}
                    aria-live="polite"
                  >
                    Defaults applied
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: "10px 12px", borderRadius: 10 }}
                  onClick={applyDefaultBuyHoldAssumptions}
                >
                  Apply industry defaults
                </button>
              </div>
              <div className="grid two">
                <PercentField
                  label="Purchase closing cost rate"
                  value={buyHoldInputs.purchaseClosingCostRate}
                  fallbackValue={defaultAssumptions.purchaseClosingCostRate}
                  mode="percent"
                  tooltip="Percent of purchase price for lender/title/escrow costs."
                  onChange={(v) =>
                    setBuyHoldInputs({
                      ...buyHoldInputs,
                      purchaseClosingCostRate: v,
                    })
                  }
                />
                <PercentField
                  label="Interest rate (annual)"
                  value={buyHoldInputs.interestRateAnnual}
                  fallbackValue={defaultAssumptions.longTermInterestRateAnnual}
                  mode="percent"
                  tooltip="Annual interest rate on the primary loan."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, interestRateAnnual: v })
                  }
                />
                <NumberField
                  label="Loan term (months)"
                  value={buyHoldInputs.loanTermMonths}
                  fallbackValue={defaultAssumptions.longTermLoanTermMonths}
                  tooltip="Length of the loan amortization in months."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, loanTermMonths: v })
                  }
                  step={12}
                  min={12}
                />
                <PercentField
                  label="LTV"
                  value={buyHoldInputs.ltv}
                  fallbackValue={defaultAssumptions.buyHoldLtv}
                  mode="percent"
                  tooltip="Loan-to-value ratio; used to derive loan amount."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, ltv: v })
                  }
                />
                <PercentField
                  label="Annual appreciation"
                  value={buyHoldInputs.annualAppreciationRate}
                  fallbackValue={defaultAssumptions.annualAppreciationRate}
                  mode="percent"
                  tooltip="Expected yearly home price growth."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, annualAppreciationRate: v })
                  }
                />
                <PercentField
                  label="Annual rent increase"
                  value={buyHoldInputs.annualRentIncreaseRate}
                  fallbackValue={defaultAssumptions.annualRentIncreaseRate}
                  mode="percent"
                  tooltip="Expected yearly rent growth."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, annualRentIncreaseRate: v })
                  }
                />
                <CurrencyField
                  label="Insurance per month"
                  value={buyHoldInputs.insurancePerMonth}
                  fallbackValue={defaultAssumptions.insurancePerMonth}
                  tooltip="Monthly insurance premium."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, insurancePerMonth: v })
                  }
                />
                <PercentField
                  label="Vacancy rate"
                  value={buyHoldInputs.vacancyRate}
                  fallbackValue={defaultAssumptions.vacancyRate}
                  mode="percent"
                  tooltip="Reserve for vacancy as a percent of rent."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, vacancyRate: v })
                  }
                />
                <PercentField
                  label="Repairs rate"
                  value={buyHoldInputs.repairsRate}
                  fallbackValue={defaultAssumptions.repairsRate}
                  mode="percent"
                  tooltip="Monthly repairs reserve as a percent of rent."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, repairsRate: v })
                  }
                />
                <PercentField
                  label="CapEx rate"
                  value={buyHoldInputs.capexRate}
                  fallbackValue={defaultAssumptions.capexRate}
                  mode="percent"
                  tooltip="Capital expenditures reserve as a percent of rent."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, capexRate: v })
                  }
                />
                <PercentField
                  label="Management rate"
                  value={buyHoldInputs.managementRate}
                  fallbackValue={defaultAssumptions.managementRate}
                  mode="percent"
                  tooltip="Percent of rent paid to property management."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, managementRate: v })
                  }
                />
                <CurrencyField
                  label="Lease-up fee"
                  value={buyHoldInputs.leaseUpFee}
                  fallbackValue={defaultAssumptions.leaseUpFee}
                  tooltip="One-time leasing fee charged when placing a tenant."
                  onChange={(v) =>
                    setBuyHoldInputs({ ...buyHoldInputs, leaseUpFee: v })
                  }
                  step={100}
                  min={0}
                />
              </div>
            </Collapsible>
          </StrategySection>
        )}

        {strategy === Strategy.BRRRR && (
          <StrategySection title="BRRRR">
            <Collapsible title="Quick setup" defaultOpen>
              <div className="grid two">
                <CurrencyField
                  label="Purchase price"
                  value={brrrrInputs.purchasePrice}
                  tooltip="Acquisition price before closing costs."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, purchasePrice: v })
                  }
                />
                <CurrencyField
                  label="Rehab cost"
                  value={brrrrInputs.rehabCost}
                  tooltip="Total rehab budget (or push from estimator)."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, rehabCost: v })
                  }
                />
                <CurrencyField
                  label="ARV"
                  value={brrrrInputs.arv}
                  tooltip="After-repair value used for the refinance."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, arv: v })
                  }
                />
                <NumberField
                  label="Rehab months"
                  value={brrrrInputs.rehabMonths}
                  tooltip="Time to complete rehab before refinance."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, rehabMonths: v })
                  }
                  step={1}
                />
                <NumberField
                  label="Monthly rent (post-refi)"
                  value={brrrrInputs.monthlyRent}
                  tooltip="Stabilized rent after refinance."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, monthlyRent: v })
                  }
                />
                <PercentField
                  label="Bridge LTV"
                  value={brrrrInputs.bridgeLtv ?? 0}
                  mode="percent"
                  tooltip="Loan-to-value for the bridge loan."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, bridgeLtv: v })
                  }
                />
                <PercentField
                  label="Bridge interest (annual)"
                  value={brrrrInputs.bridgeInterestRateAnnual ?? 0}
                  mode="percent"
                  tooltip="Interest rate on the bridge/rehab loan."
                  onChange={(v) =>
                    setBrrrrInputs({
                      ...brrrrInputs,
                      bridgeInterestRateAnnual: v,
                    })
                  }
                />
                <PercentField
                  label="Refi LTV"
                  value={brrrrInputs.refiLtv}
                  mode="percent"
                  tooltip="Loan-to-value for the refinance."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, refiLtv: v })
                  }
                />
              </div>
            </Collapsible>

            <Collapsible title="Financing & assumptions" defaultOpen={false}>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {defaultsAppliedAt[Strategy.BRRRR] && (
                  <span
                    className="chip"
                    style={{
                      background: "#ecfeff",
                      color: "#0b7099",
                      border: "1px solid #bae6fd",
                      boxShadow: "0 4px 8px rgba(11, 112, 153, 0.08)",
                    }}
                    aria-live="polite"
                  >
                    Defaults applied
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: "10px 12px", borderRadius: 10 }}
                  onClick={applyDefaultBrrrrAssumptions}
                >
                  Apply industry defaults
                </button>
              </div>
              <div className="grid two">
                <PercentField
                  label="Purchase closing cost rate"
                  value={brrrrInputs.purchaseClosingCostRate}
                  fallbackValue={defaultAssumptions.purchaseClosingCostRate}
                  mode="percent"
                  tooltip="Percent of purchase price for closing costs on the bridge loan."
                  onChange={(v) =>
                    setBrrrrInputs({
                      ...brrrrInputs,
                      purchaseClosingCostRate: v,
                    })
                  }
                />
                <PercentField
                  label="Refi closing cost rate"
                  value={brrrrInputs.refiClosingCostRate}
                  fallbackValue={defaultAssumptions.refiClosingCostRate}
                  mode="percent"
                  tooltip="Closing costs charged during the refinance."
                  onChange={(v) =>
                    setBrrrrInputs({
                      ...brrrrInputs,
                      refiClosingCostRate: v,
                    })
                  }
                />
                <PercentField
                  label="Refi points rate"
                  value={brrrrInputs.refiPointsRate}
                  fallbackValue={defaultAssumptions.refiPointsRate}
                  mode="percent"
                  tooltip="Lender points charged at refinance (% of new loan)."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, refiPointsRate: v })
                  }
                />
                <NumberField
                  label="Bridge term (months)"
                  value={brrrrInputs.bridgeTermMonths}
                  fallbackValue={defaultAssumptions.bridgeTermMonths}
                  tooltip="Bridge loan length; drives accrued interest."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, bridgeTermMonths: v })
                  }
                  step={1}
                  min={0}
                />
                <PercentField
                  label="Annual appreciation"
                  value={brrrrInputs.annualAppreciationRate}
                  fallbackValue={defaultAssumptions.annualAppreciationRate}
                  mode="percent"
                  tooltip="Expected yearly home price growth."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, annualAppreciationRate: v })
                  }
                />
                <PercentField
                  label="Annual rent increase"
                  value={brrrrInputs.annualRentIncreaseRate}
                  fallbackValue={defaultAssumptions.annualRentIncreaseRate}
                  mode="percent"
                  tooltip="Expected yearly rent growth."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, annualRentIncreaseRate: v })
                  }
                />
                <PercentField
                  label="Vacancy rate"
                  value={brrrrInputs.vacancyRate}
                  fallbackValue={defaultAssumptions.vacancyRate}
                  mode="percent"
                  tooltip="Reserve for vacancy as a percent of rent."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, vacancyRate: v })
                  }
                />
                <PercentField
                  label="Repairs rate"
                  value={brrrrInputs.repairsRate}
                  fallbackValue={defaultAssumptions.repairsRate}
                  mode="percent"
                  tooltip="Monthly repairs reserve as a percent of rent."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, repairsRate: v })
                  }
                />
                <PercentField
                  label="CapEx rate"
                  value={brrrrInputs.capexRate}
                  fallbackValue={defaultAssumptions.capexRate}
                  mode="percent"
                  tooltip="Capital expenditures reserve as a percent of rent."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, capexRate: v })
                  }
                />
                <PercentField
                  label="Management rate"
                  value={brrrrInputs.managementRate}
                  fallbackValue={defaultAssumptions.managementRate}
                  mode="percent"
                  tooltip="Percent of rent paid to property management."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, managementRate: v })
                  }
                />
                <PercentField
                  label="Property tax rate"
                  value={brrrrInputs.propertyTaxRate}
                  fallbackValue={defaultAssumptions.propertyTaxRate}
                  mode="percent"
                  tooltip="Annual property tax rate."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, propertyTaxRate: v })
                  }
                />
                <CurrencyField
                  label="Insurance per month"
                  value={brrrrInputs.insurancePerMonth}
                  fallbackValue={defaultAssumptions.insurancePerMonth}
                  tooltip="Monthly insurance premium."
                  onChange={(v) =>
                    setBrrrrInputs({ ...brrrrInputs, insurancePerMonth: v })
                  }
                />
                <PercentField
                  label="Long-term interest"
                  value={brrrrInputs.longTermLoan.interestRateAnnual}
                  fallbackValue={defaultAssumptions.longTermInterestRateAnnual}
                  mode="percent"
                  tooltip="Interest rate for the post-refi long-term loan."
                  onChange={(v) =>
                    setBrrrrInputs({
                      ...brrrrInputs,
                      longTermLoan: {
                        ...brrrrInputs.longTermLoan,
                        interestRateAnnual: v,
                      },
                    })
                  }
                />
                <NumberField
                  label="Long-term loan term (months)"
                  value={brrrrInputs.longTermLoan.loanTermMonths}
                  fallbackValue={defaultAssumptions.longTermLoanTermMonths}
                  tooltip="Amortization length for the post-refi loan."
                  onChange={(v) =>
                    setBrrrrInputs({
                      ...brrrrInputs,
                      longTermLoan: {
                        ...brrrrInputs.longTermLoan,
                        loanTermMonths: v,
                      },
                    })
                  }
                  step={1}
                />
              </div>
            </Collapsible>
          </StrategySection>
        )}

        {strategy === Strategy.FLIP && (
          <StrategySection title="Flip">
            <Collapsible title="Quick setup" defaultOpen>
              <div className="grid two">
                <CurrencyField
                  label="Purchase price"
                  value={flipInputs.purchasePrice}
                  tooltip="Acquisition price before closing costs."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, purchasePrice: v })
                  }
                />
                <CurrencyField
                  label="Rehab cost"
                  value={flipInputs.rehabCost}
                  tooltip="Total rehab budget (or push from estimator)."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, rehabCost: v })
                  }
                />
                <CurrencyField
                  label="ARV / Sale price"
                  value={flipInputs.salePrice ?? flipInputs.arv}
                  tooltip="Expected sale price (often equals ARV)."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, salePrice: v, arv: v })
                  }
                />
                <NumberField
                  label="Rehab months"
                  value={flipInputs.rehabMonths}
                  tooltip="Time to complete rehab."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, rehabMonths: v })
                  }
                  step={1}
                />
                <NumberField
                  label="Months on market"
                  value={flipInputs.monthsOnMarket}
                  tooltip="Expected time listed before sale closes."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, monthsOnMarket: v })
                  }
                  step={1}
                />
              </div>
            </Collapsible>

            <Collapsible title="Carrying costs & taxes" defaultOpen={false}>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {defaultsAppliedAt[Strategy.FLIP] && (
                  <span
                    className="chip"
                    style={{
                      background: "#ecfeff",
                      color: "#0b7099",
                      border: "1px solid #bae6fd",
                      boxShadow: "0 4px 8px rgba(11, 112, 153, 0.08)",
                    }}
                    aria-live="polite"
                  >
                    Defaults applied
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: "10px 12px", borderRadius: 10 }}
                  onClick={applyDefaultFlipAssumptions}
                >
                  Apply industry defaults
                </button>
              </div>
              <div className="grid two">
                <PercentField
                  label="Purchase closing cost rate"
                  value={flipInputs.purchaseClosingCostRate}
                  fallbackValue={defaultAssumptions.purchaseClosingCostRate}
                  mode="percent"
                  tooltip="Percent of purchase price for closing costs on the bridge loan."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, purchaseClosingCostRate: v })
                  }
                />
                <PercentField
                  label="Agent fee rate"
                  value={flipInputs.agentFeeRate}
                  fallbackValue={defaultAssumptions.agentFeeRate}
                  mode="percent"
                  tooltip="Total listing + buyer agent commissions."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, agentFeeRate: v })
                  }
                />
                <PercentField
                  label="Seller closing cost rate"
                  value={flipInputs.sellerClosingCostRate}
                  fallbackValue={defaultAssumptions.sellerClosingCostRate}
                  mode="percent"
                  tooltip="Other seller-side costs at disposition."
                  onChange={(v) =>
                    setFlipInputs({
                      ...flipInputs,
                      sellerClosingCostRate: v,
                    })
                  }
                />
                <PercentField
                  label="Bridge LTV"
                  value={flipInputs.bridgeLtv}
                  fallbackValue={defaultAssumptions.bridgeLtv}
                  mode="percent"
                  tooltip="Loan-to-value for the flip bridge loan."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, bridgeLtv: v })
                  }
                />
                <PercentField
                  label="Bridge interest (annual)"
                  value={flipInputs.bridgeInterestRateAnnual}
                  fallbackValue={defaultAssumptions.bridgeInterestRateAnnual}
                  mode="percent"
                  tooltip="Interest rate on the flip bridge/carry loan."
                  onChange={(v) =>
                    setFlipInputs({
                      ...flipInputs,
                      bridgeInterestRateAnnual: v,
                    })
                  }
                />
                <PercentField
                  label="Property tax rate"
                  value={flipInputs.propertyTaxRate}
                  fallbackValue={defaultAssumptions.propertyTaxRate}
                  mode="percent"
                  tooltip="Annual property tax rate."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, propertyTaxRate: v })
                  }
                />
                <CurrencyField
                  label="Insurance per month"
                  value={flipInputs.insurancePerMonth}
                  fallbackValue={defaultAssumptions.insurancePerMonth}
                  tooltip="Monthly insurance premium during the flip."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, insurancePerMonth: v })
                  }
                />
                <PercentField
                  label="Marginal tax rate"
                  value={flipInputs.marginalTaxRate}
                  fallbackValue={defaultAssumptions.marginalTaxRate}
                  mode="percent"
                  tooltip="Tax rate applied to flip profit."
                  onChange={(v) =>
                    setFlipInputs({ ...flipInputs, marginalTaxRate: v })
                  }
                />
              </div>
            </Collapsible>
          </StrategySection>
        )}

        <StrategySection title="Rehab Estimator">
          <Collapsible
            title="Estimate rehab and push to inputs"
            subtitle="Pick only the line items you need; we will roll up the total."
            defaultOpen={false}
          >
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
              <label className="field-label">
                <span>Scope quality</span>
                <button
                  type="button"
                  className="help-icon"
                  title="Use grade to scale unit costs across all line items."
                  data-tip="Use grade to scale unit costs across all line items."
                  aria-label="Scope quality info"
                >
                  ?
                </button>
              </label>
              <select
                value={rehabQuality.id}
                onChange={(e) => {
                  const next = rehabQualityOptions.find((o) => o.id === e.target.value);
                  if (next) setRehabQuality(next);
                }}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #dfe3e8" }}
              >
                {rehabQualityOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <small style={{ color: "#64748b" }}>
                A = B +30%. Items include pre-set C and B pricing; overrides stick to the active quality.
              </small>
            </div>
            <div className="grid two">
              {rehabSelections.map((sel) => {
                const item = rehabItems.find((r) => r.id === sel.id)!;
                const effectiveUnitPrice = resolveItemUnitPrice(item, sel, rehabQuality.id as "A" | "B" | "C", rehabQualityMultipliers);
                const priceBands = getPriceBands(item, sel, rehabQuality.id as "A" | "B" | "C", rehabQualityMultipliers);
                return (
                  <div key={item.id} className="card" style={{ boxShadow: "none", borderColor: "#e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={sel.selected}
                          onChange={(e) =>
                            setRehabSelections((prev) =>
                              prev.map((it) =>
                                it.id === item.id ? { ...it, selected: e.target.checked } : it
                              )
                            )
                          }
                        />
                        <div>
                          <div className="chip" style={{ marginBottom: 4, background: "#f8fafc", color: "#475569" }}>
                            {item.category ?? "General"}
                          </div>
                          <strong>{item.label}</strong>
                        </div>
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <NumberField
                        label="Quantity"
                        value={sel.quantity}
                        onChange={(v) =>
                          setRehabSelections((prev) =>
                            prev.map((it) =>
                              it.id === item.id ? { ...it, quantity: v } : it
                            )
                          )
                        }
                        step={1}
                        min={0}
                      />
                      <CurrencyField
                        label="Unit cost"
                        tooltip="Override the base unit cost if needed."
                        value={sel.overrideUnitPrice ?? priceBands.active}
                        onChange={(v) =>
                          setRehabSelections((prev) =>
                            prev.map((it) =>
                              it.id === item.id ? { ...it, overrideUnitPrice: v } : it
                            )
                          )
                        }
                        step={500}
                        min={0}
                      />
                    </div>
                    <div style={{ marginTop: 8, color: "#0f172a", fontWeight: 600 }}>
                      <div style={{ color: "#475569", fontWeight: 500, fontSize: 13, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span>Active: {formatCurrency(effectiveUnitPrice)}</span>
                        <span style={{ color: "#94a3b8" }}>B: {formatCurrency(priceBands.B)}</span>
                        <span style={{ color: "#94a3b8" }}>C: {formatCurrency(priceBands.C)}</span>
                        <span style={{ color: "#94a3b8" }}>A: {formatCurrency(priceBands.A)}</span>
                      </div>
                      Item total: {formatCurrency((sel.quantity || 0) * effectiveUnitPrice)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rehab-footer">
              <div style={{ fontWeight: 700 }}>
                Rehab total: {formatCurrency(rehabTotal)}
              </div>
              <button
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #2563eb",
                  background: "#2563eb",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={applyRehabToCurrentStrategy}
              >
                Apply to current strategy
              </button>
            </div>
          </Collapsible>
        </StrategySection>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">Key outputs</div>
        <div className="summary-grid">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} label={card.label} value={card.value} />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">First 12 months (snapshot)</div>
        <button
          type="button"
          className="toggle-btn"
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "#fff",
            cursor: "pointer",
            marginBottom: 8,
          }}
          onClick={() => setShowFullSchedule((prev) => !prev)}
        >
          {showFullSchedule ? "Hide full schedule" : "Show full schedule"}
        </button>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Rent</th>
                <th>Expenses</th>
                <th>Debt</th>
                <th>Cash Flow</th>
                <th>Equity</th>
              </tr>
            </thead>
            <tbody>
              {"monthly" in calcResult &&
                (showFullSchedule ? calcResult.monthly : calcResult.monthly.slice(0, 12)).map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{formatCurrency(row.rent)}</td>
                    <td>{formatCurrency(row.operatingExpenses)}</td>
                    <td>{formatCurrency(row.debtService)}</td>
                    <td>{formatCurrency(row.cashFlow)}</td>
                    <td>{formatCurrency(row.equity)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {"annual" in calcResult && (
        <div className="card" style={{ marginTop: 16 }}>
          <InvestmentTable rows={(calcResult as BuyHoldResult | BRRRRResult).annual} />
        </div>
      )}

      {warnings.length > 0 && (
        <div className="card" style={{ marginTop: 16, borderColor: "#f97316", background: "#fff7ed" }}>
          <div className="section-title" style={{ color: "#c2410c" }}>Validation warnings</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#c2410c" }}>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function Collapsible({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const contentId = `${slug}-${useId()}`;
  return (
    <div className="collapsible">
      <button
        className="collapsible-header"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={contentId}
      >
        <div>
          <div className="collapsible-title">{title}</div>
          {subtitle && <div className="collapsible-subtitle">{subtitle}</div>}
        </div>
        <span className="collapsible-icon">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div className="collapsible-body" id={contentId}>
          {children}
        </div>
      )}
    </div>
  );
}

function StrategySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="section-title">{title}</h3>
      {children}
    </div>
  );
}

function buildSummaryCards(
  strategy: Strategy,
  result: CalcResult
): { label: string; value: string }[] {
  if (strategy === Strategy.BUY_HOLD) {
    const r = result as BuyHoldResult;
    return [
      { label: "Cash required", value: formatCurrency(r.metrics.cashRequired) },
      { label: "Y1 cash flow", value: formatCurrency(r.metrics.yearOneCashFlow) },
      { label: "Cash-on-cash", value: formatPercent(r.metrics.cashOnCashReturn) },
      { label: "DSCR (Y1)", value: r.metrics.dscr.toFixed(2) },
      { label: "Total return (end)", value: formatCurrency(r.metrics.totalReturn) },
    ];
  }

  if (strategy === Strategy.BRRRR) {
    const r = result as BRRRRResult;
    return [
      { label: "Cash left in deal", value: formatCurrency(r.metrics.cashLeftInDeal) },
      { label: "Cash required", value: formatCurrency(r.metrics.cashRequired) },
      { label: "Refi proceeds", value: formatCurrency(r.metrics.refiProceeds) },
      { label: "Bridge interest", value: formatCurrency(r.metrics.bridgeInterest) },
      { label: "CoC (post-refi)", value: formatPercent(r.metrics.cashOnCashReturn) },
    ];
  }

  const r = result as FlipResult;
  return [
    { label: "Total cash required", value: formatCurrency(r.metrics.totalCashRequired) },
    { label: "Profit before tax", value: formatCurrency(r.metrics.profitBeforeTax) },
    { label: "Profit after tax", value: formatCurrency(r.metrics.profitAfterTax) },
    { label: "ROI", value: formatPercent(r.metrics.roi) },
    { label: "Hold months", value: `${r.metrics.holdMonths}` },
  ];
}

function computeResult(
  strategy: Strategy,
  buyHoldInputs: BuyHoldInputs,
  brrrrInputs: BRRRRInputs,
  flipInputs: FlipInputs
): CalcResult {
  if (strategy === Strategy.BRRRR) {
    return calculateBRRRR(brrrrInputs);
  }
  if (strategy === Strategy.FLIP) {
    return calculateFlip(flipInputs);
  }
  return calculateBuyHold(buyHoldInputs);
}

type RehabQuality = "A" | "B" | "C";

function deriveUnitPriceForQuality(
  item: RehabItem,
  quality: RehabQuality,
  qualityMultipliers: Record<RehabQuality, number>
): number {
  if (item.basePrices) {
    const { basePrices } = item;
    if (quality === "A") {
      if (basePrices.B !== undefined) return basePrices.B * 1.3;
      if (basePrices.C !== undefined) return basePrices.C * (qualityMultipliers.A ?? 1);
    }
    if (quality === "B") {
      if (basePrices.B !== undefined) return basePrices.B;
      if (basePrices.C !== undefined) return basePrices.C / (qualityMultipliers.C || 1);
    }
    if (quality === "C") {
      if (basePrices.C !== undefined) return basePrices.C;
      if (basePrices.B !== undefined) return basePrices.B * (qualityMultipliers.C ?? 1);
    }
  }
  const base = item.unitPrice ?? 0;
  return base * (qualityMultipliers[quality] ?? 1);
}

function resolveItemUnitPrice(
  item: RehabItem,
  selection: RehabSelection,
  quality: RehabQuality,
  qualityMultipliers: Record<RehabQuality, number>
): number {
  if (selection.overrideUnitPrice !== undefined) return selection.overrideUnitPrice;
  return deriveUnitPriceForQuality(item, quality, qualityMultipliers);
}

function getPriceBands(
  item: RehabItem,
  selection: RehabSelection,
  quality: RehabQuality,
  qualityMultipliers: Record<RehabQuality, number>
): { A: number; B: number; C: number; active: number } {
  const A = deriveUnitPriceForQuality(item, "A", qualityMultipliers);
  const B = deriveUnitPriceForQuality(item, "B", qualityMultipliers);
  const C = deriveUnitPriceForQuality(item, "C", qualityMultipliers);
  const activeBase = quality === "A" ? A : quality === "B" ? B : C;
  const active = selection.overrideUnitPrice ?? activeBase;
  return { A, B, C, active };
}

function getValidationWarnings(
  strategy: Strategy,
  params: {
    buyHoldInputs: BuyHoldInputs;
    brrrrInputs: BRRRRInputs;
    flipInputs: FlipInputs;
  }
): string[] {
  const warnings: string[] = [];
  const base =
    strategy === Strategy.BRRRR
      ? params.brrrrInputs
      : strategy === Strategy.FLIP
      ? params.flipInputs
      : params.buyHoldInputs;
  if (base.purchasePrice <= 0) warnings.push("Purchase price should be greater than zero.");
  if (base.arv <= 0) warnings.push("ARV should be greater than zero.");
  if ("loanTermMonths" in base && base.loanTermMonths <= 0)
    warnings.push("Loan term should be greater than zero months.");
  if ("interestRateAnnual" in base && !Number.isFinite((base as BuyHoldInputs).interestRateAnnual))
    warnings.push("Interest rate looks missing.");
  if (strategy !== Strategy.FLIP && "monthlyRent" in base && base.monthlyRent <= 0)
    warnings.push("Monthly rent should be greater than zero for rental strategies.");
  return warnings;
}
