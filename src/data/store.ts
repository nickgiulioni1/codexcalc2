import { v4 as uuidv4 } from "uuid";
import {
  Strategy,
  BuyHoldInputs,
  BRRRRInputs,
  FlipInputs,
  AnnualSummary,
  BuyHoldMetrics,
  BRRRRMetrics,
  FlipMetrics,
} from "../calculator/types";
import { calculateBuyHold, calculateBRRRR, calculateFlip } from "../calculator";

export type Analysis = {
  id: string;
  name: string;
  strategy: Strategy;
  input_payload: BuyHoldInputs | BRRRRInputs | FlipInputs;
  summary_payload: {
    metrics: BuyHoldMetrics | BRRRRMetrics | FlipMetrics;
    annual?: AnnualSummary[];
  };
  created_at: string;
  updated_at: string;
};

export type ShareLink = {
  token: string;
  analysis_id: string;
  snapshot_payload: SnapshotPayload;
  created_at: string;
};

export type SnapshotPayload = {
  input_payload: BuyHoldInputs | BRRRRInputs | FlipInputs;
  summary_payload: Analysis["summary_payload"];
};

export type PropertyRecord = {
  id: string;
  address_line_1: string;
  city: string;
  state: string;
  postal_code: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  default_rent?: number;
  default_property_tax_rate?: number;
  created_at: string;
  updated_at: string;
};

const ANALYSES_KEY = "offleash_analyses";
const SHARES_KEY = "offleash_shares";
const PROPERTIES_KEY = "offleash_properties";

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function listAnalyses(): Analysis[] {
  return load<Analysis>(ANALYSES_KEY);
}

export function getAnalysis(id: string): Analysis | undefined {
  return listAnalyses().find((a) => a.id === id);
}

export function upsertAnalysis(
  name: string,
  strategy: Strategy,
  input_payload: BuyHoldInputs | BRRRRInputs | FlipInputs
): Analysis {
  const now = new Date().toISOString();
  const analyses = listAnalyses();
  const existing = analyses.find((a) => a.name === name && a.strategy === strategy);
  const summary_payload = computeSummary(strategy, input_payload);

  if (existing) {
    const updated: Analysis = {
      ...existing,
      input_payload,
      summary_payload,
      updated_at: now,
    };
    const merged = analyses.map((a) => (a.id === existing.id ? updated : a));
    save(ANALYSES_KEY, merged);
    return updated;
  }

  const created: Analysis = {
    id: uuidv4(),
    name,
    strategy,
    input_payload,
    summary_payload,
    created_at: now,
    updated_at: now,
  };
  save(ANALYSES_KEY, [...analyses, created]);
  return created;
}

export function deleteAnalysis(id: string) {
  const filtered = listAnalyses().filter((a) => a.id !== id);
  save(ANALYSES_KEY, filtered);
}

export function duplicateAnalysis(id: string, newName?: string): Analysis | undefined {
  const analysis = getAnalysis(id);
  if (!analysis) return undefined;
  const now = new Date().toISOString();
  const name = newName || `${analysis.name} (copy)`;
  const copy: Analysis = {
    ...analysis,
    id: uuidv4(),
    name,
    created_at: now,
    updated_at: now,
  };
  const analyses = listAnalyses();
  save(ANALYSES_KEY, [...analyses, copy]);
  return copy;
}

export function createShareLink(analysisId: string): ShareLink | undefined {
  const analysis = getAnalysis(analysisId);
  if (!analysis) return undefined;
  const shares = listShares();
  const token = uuidv4();
  const link: ShareLink = {
    token,
    analysis_id: analysisId,
    snapshot_payload: {
      input_payload: analysis.input_payload,
      summary_payload: analysis.summary_payload,
    },
    created_at: new Date().toISOString(),
  };
  save(SHARES_KEY, [...shares, link]);
  return link;
}

export function listShares(): ShareLink[] {
  return load<ShareLink>(SHARES_KEY);
}

export function getShareByToken(token: string): ShareLink | undefined {
  return listShares().find((s) => s.token === token);
}

export function listProperties(): PropertyRecord[] {
  return load<PropertyRecord>(PROPERTIES_KEY);
}

export function upsertProperty(record: Omit<PropertyRecord, "id" | "created_at" | "updated_at"> & { id?: string }): PropertyRecord {
  const now = new Date().toISOString();
  const properties = listProperties();
  if (record.id) {
    const updated: PropertyRecord = { ...record, created_at: now, updated_at: now } as PropertyRecord;
    const merged = properties.map((p) => (p.id === record.id ? updated : p));
    save(PROPERTIES_KEY, merged);
    return updated;
  }
  const created: PropertyRecord = {
    ...record,
    id: uuidv4(),
    created_at: now,
    updated_at: now,
  };
  save(PROPERTIES_KEY, [...properties, created]);
  return created;
}

export function deleteProperty(id: string) {
  const filtered = listProperties().filter((p) => p.id !== id);
  save(PROPERTIES_KEY, filtered);
}

export function searchProperties(query: string): PropertyRecord[] {
  const q = query.toLowerCase();
  return listProperties().filter((p) =>
    `${p.address_line_1} ${p.city} ${p.state} ${p.postal_code}`.toLowerCase().includes(q)
  );
}

function computeSummary(
  strategy: Strategy,
  inputs: BuyHoldInputs | BRRRRInputs | FlipInputs
) {
  if (strategy === Strategy.BRRRR) {
    const res = calculateBRRRR(inputs as BRRRRInputs);
    return { metrics: res.metrics, annual: res.annual };
  }
  if (strategy === Strategy.FLIP) {
    const res = calculateFlip(inputs as FlipInputs);
    return { metrics: res.metrics };
  }
  const res = calculateBuyHold(inputs as BuyHoldInputs);
  return { metrics: res.metrics, annual: res.annual };
}
