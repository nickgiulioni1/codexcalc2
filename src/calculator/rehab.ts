export type RehabItem = {
  id: string;
  category?: string;
  label: string;
  unitType: "fixed" | "quantity";
  unitPrice?: number;
  basePrices?: {
    C?: number;
    B?: number;
  };
  defaultQuantity?: number;
};

export type RehabSelection = {
  id: string;
  quantity: number;
  selected: boolean;
  overrideUnitPrice?: number;
};

export function calculateRehabTotal(
  items: RehabItem[],
  selections: RehabSelection[],
  quality: "A" | "B" | "C" = "B",
  qualityMultipliers: Record<"A" | "B" | "C", number> = { A: 1.3, B: 1, C: 0.8 }
): number {
  const selectionMap = new Map(selections.map((s) => [s.id, s]));
  return items.reduce((sum, item) => {
    const sel = selectionMap.get(item.id);
    if (!sel || !sel.selected) return sum;
    const unitPrice = resolveUnitPrice(item, sel.overrideUnitPrice, quality, qualityMultipliers);
    const qty = sel.quantity ?? item.defaultQuantity ?? 1;
    return sum + unitPrice * qty;
  }, 0);
}

function resolveUnitPrice(
  item: RehabItem,
  override: number | undefined,
  quality: "A" | "B" | "C",
  qualityMultipliers: Record<"A" | "B" | "C", number>
): number {
  if (override !== undefined) return override;

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
