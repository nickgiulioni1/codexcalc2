import { describe, it, expect } from "vitest";
import { calculateRehabTotal, RehabItem, RehabSelection } from "../rehab";

const items: RehabItem[] = [
  { id: "paint", label: "Paint", unitType: "fixed", unitPrice: 3000, defaultQuantity: 1 },
  { id: "floor", label: "Flooring", unitType: "quantity", unitPrice: 5000, defaultQuantity: 1 },
];

describe("calculateRehabTotal", () => {
  it("sums selected items with quantities and defaults", () => {
    const selections: RehabSelection[] = [
      { id: "paint", selected: true, quantity: 1 },
      { id: "floor", selected: true, quantity: 2 },
    ];
    const total = calculateRehabTotal(items, selections);
    expect(total).toBe(3000 + 2 * 5000);
  });

  it("honors override unit price and ignores unselected", () => {
    const selections: RehabSelection[] = [
      { id: "paint", selected: false, quantity: 1 },
      { id: "floor", selected: true, quantity: 1, overrideUnitPrice: 6000 },
    ];
    const total = calculateRehabTotal(items, selections);
    expect(total).toBe(6000);
  });

  it("uses base prices and applies 30% uplift for A quality", () => {
    const pricedItems: RehabItem[] = [
      { id: "cab", label: "Cabinets", unitType: "fixed", basePrices: { B: 8000, C: 5000 } },
    ];
    const selections: RehabSelection[] = [{ id: "cab", selected: true, quantity: 1 }];
    const total = calculateRehabTotal(pricedItems, selections, "A");
    expect(total).toBeCloseTo(8000 * 1.3);
  });
});
