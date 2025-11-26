import React from "react";
import { HashRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { AnalyzerPage } from "./pages/AnalyzerPage";
import {
  listAnalyses,
  deleteAnalysis,
  createShareLink,
  duplicateAnalysis,
  listShares,
  getShareByToken,
  listProperties,
  upsertProperty,
  deleteProperty,
  searchProperties,
} from "./data/store";
import { SummaryCard } from "./components/SummaryCard";
import { InvestmentTable } from "./components/InvestmentTable";
import { CurrencyField } from "./components/fields/CurrencyField";
import { NumberField } from "./components/fields/NumberField";
import { PercentField } from "./components/fields/PercentField";
import { useState } from "react";

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <header className="header">
          <div className="brand">Off Leash Deal Analyzer</div>
          <nav className="nav">
            <Link to="/">Home</Link>
            <Link to="/analyze">Analyzer</Link>
            <Link to="/analyses">My Analyses</Link>
            <Link to="/admin/properties">Properties</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzerPage />} />
          <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
          <Route path="/analyses" element={<AnalysesListPage />} />
          <Route path="/s/:token" element={<ShareViewPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/properties" element={<PropertiesPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

function HomePage() {
  return (
    <main className="page">
          <div className="card">
            <h2 className="section-title">Welcome</h2>
            <p>
              Run buy & hold, BRRRR, and flip analyses, save scenarios, and manage properties.
              Use the Analyzer tab to get started, then save and share.
            </p>
            <Link to="/analyze" className="btn btn-primary">
              Start analyzing
            </Link>
          </div>
        </main>
      );
}

function AnalysesListPage() {
  const navigate = useNavigate();
  const analyses = listAnalyses();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  return (
    <main className="page">
      <div className="card">
        <h2 className="section-title">My Analyses</h2>
        {analyses.length === 0 && <p>No saved analyses yet.</p>}
        {analyses.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Strategy</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {analyses.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.strategy}</td>
                  <td>{new Date(a.updated_at).toLocaleString()}</td>
                  <td>
                    <button onClick={() => navigate(`/analysis/${a.id}`)}>Open</button>
                    <button
                      onClick={() => {
                        const link = createShareLink(a.id);
                        if (link) {
                          alert(`Share link created: /s/${link.token}`);
                        }
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      Share
                    </button>
                    {listShares().length > 0 && (
                      <button
                        onClick={() => {
                          const share = listShares().find((s) => s.analysis_id === a.id);
                          if (share) {
                            navigator.clipboard?.writeText(`${window.location.origin}/s/${share.token}`);
                            setCopiedToken(share.token);
                          }
                        }}
                        style={{ marginLeft: 8 }}
                      >
                        {copiedToken ? "Copied" : "Copy last share"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        duplicateAnalysis(a.id);
                        navigate(0);
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        deleteAnalysis(a.id);
                        navigate(0);
                      }}
                      style={{ marginLeft: 8, color: "#b91c1c" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="section-title">Share Links</h3>
        {listShares().length === 0 && <p>No share links yet.</p>}
        {listShares().length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Analysis</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {listShares().map((s) => (
                <tr key={s.token}>
                  <td>
                    <Link to={`/s/${s.token}`}>{s.token.slice(0, 8)}...</Link>
                  </td>
                  <td>{s.analysis_id}</td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

function AnalysisDetailPage() {
  const { id } = useParams();
  const analysis = id ? listAnalyses().find((a) => a.id === id) : undefined;
  if (!analysis) {
    return (
      <main className="page">
        <div className="card">Analysis not found.</div>
      </main>
    );
  }
  return (
    <main className="page">
      <div className="card">
        <h2 className="section-title">{analysis.name}</h2>
        <p>Strategy: {analysis.strategy}</p>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
          {JSON.stringify(analysis.input_payload, null, 2)}
        </pre>
      </div>
    </main>
  );
}

function ShareViewPage() {
  const { token } = useParams();
  const share = token ? getShareByToken(token) : undefined;
  if (!share) {
    return (
      <main className="page">
        <div className="card">Share link not found.</div>
      </main>
    );
  }
  const summary = share.snapshot_payload.summary_payload;
  const annual = summary.annual ?? [];
  return (
    <main className="page">
      <div className="card">
        <h2 className="section-title">Shared Analysis</h2>
        <p>Token: {token}</p>
        <button
          onClick={() => navigator.clipboard?.writeText(window.location.href)}
          style={{ marginBottom: 8 }}
        >
          Copy link
        </button>
        <div className="summary-grid">
          {Object.entries(summary).map(([k, v]) => (
            k === "annual" ? null : (
              <SummaryCard
                key={k}
                label={k}
                value={typeof v === "number" ? (v as number).toLocaleString() : String(v)}
              />
            )
          ))}
        </div>
      </div>
      {annual.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <InvestmentTable rows={annual} />
        </div>
      )}
    </main>
  );
}

function AdminPage() {
  return (
    <main className="page">
      <div className="card">
        <h2 className="section-title">Admin Dashboard</h2>
        <ul>
          <li>
            <Link to="/admin/properties">Property management</Link>
          </li>
          <li>
            <Link to="/analyses">Analyses</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}

function PropertiesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const props = query ? searchProperties(query) : listProperties();
  const [csvText, setCsvText] = React.useState("");
  const [importResult, setImportResult] = React.useState<{ imported: number; errors: number }>({
    imported: 0,
    errors: 0,
  });
  const [form, setForm] = React.useState({
    address_line_1: "",
    city: "",
    state: "",
    postal_code: "",
    bedrooms: 0,
    bathrooms: 0,
    square_feet: 0,
    default_rent: 0,
    default_property_tax_rate: 0,
  });
  return (
    <main className="page">
      <div className="card">
        <h2 className="section-title">Properties</h2>
        <div className="field">
          <label>Search</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search address" />
        </div>
        <div className="grid two">
          <div className="field">
            <label>Address</label>
            <input
              value={form.address_line_1}
              onChange={(e) => setForm({ ...form, address_line_1: e.target.value })}
            />
          </div>
          <div className="field">
            <label>City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="field">
            <label>State</label>
            <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div className="field">
            <label>Postal code</label>
            <input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
          </div>
          <NumberField
            label="Bedrooms"
            value={form.bedrooms}
            onChange={(v) => setForm({ ...form, bedrooms: v })}
            step={1}
          />
          <NumberField
            label="Bathrooms"
            value={form.bathrooms}
            onChange={(v) => setForm({ ...form, bathrooms: v })}
            step={0.5}
          />
          <NumberField
            label="Square feet"
            value={form.square_feet}
            onChange={(v) => setForm({ ...form, square_feet: v })}
            step={100}
          />
          <CurrencyField
            label="Default rent"
            value={form.default_rent}
            onChange={(v) => setForm({ ...form, default_rent: v })}
            step={50}
          />
          <PercentField
            label="Default tax rate"
            value={form.default_property_tax_rate}
            onChange={(v) => setForm({ ...form, default_property_tax_rate: v })}
          />
        </div>
        <button
          style={{ marginTop: 12 }}
          onClick={() => {
            upsertProperty(form);
            navigate(0);
          }}
        >
          Save property
        </button>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="section-title">Property list</h3>
        {props.length === 0 && <p>No properties yet.</p>}
        {props.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Address</th>
                <th>City</th>
                <th>Rent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {props.map((p) => (
                <tr key={p.id}>
                  <td>{p.address_line_1}</td>
                  <td>{p.city}</td>
                  <td>{p.default_rent ?? "—"}</td>
                  <td>
                    <button
                      onClick={() => {
                        deleteProperty(p.id);
                        navigate(0);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="section-title">Bulk import (CSV)</h3>
        <p style={{ color: "#475569" }}>
          Paste CSV with headers: address_line_1,city,state,postal_code,default_rent,default_property_tax_rate
        </p>
        <textarea
          style={{ width: "100%", minHeight: 120 }}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
        />
        <button
          style={{ marginTop: 8 }}
          onClick={() => {
            const rows = csvText.split("\n").filter(Boolean);
            if (rows.length < 2) return;
            const [, ...dataRows] = rows;
            let imported = 0;
            let errors = 0;
            dataRows.forEach((row) => {
              const [address_line_1, city, state, postal_code, default_rent, default_property_tax_rate] =
                row.split(",");
              if (address_line_1 && city) {
                upsertProperty({
                  address_line_1,
                  city,
                  state: state ?? "",
                  postal_code: postal_code ?? "",
                  default_rent: default_rent ? Number(default_rent) : undefined,
                  default_property_tax_rate: default_property_tax_rate
                    ? Number(default_property_tax_rate)
                    : undefined,
                  bedrooms: 0,
                  bathrooms: 0,
                  square_feet: 0,
                });
                imported += 1;
              } else {
                errors += 1;
              }
            });
            setImportResult({ imported, errors });
            navigate(0);
          }}
        >
          Import CSV
        </button>
        {(importResult.imported > 0 || importResult.errors > 0) && (
          <p style={{ marginTop: 6 }}>
            Imported {importResult.imported} rows. Errors: {importResult.errors}.
          </p>
        )}
      </div>
    </main>
  );
}
