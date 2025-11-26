import React from "react";
import { AnnualSummary } from "../calculator/types";

export function InvestmentTable({ rows }: { rows: AnnualSummary[] }) {
  if (!rows.length) return null;
  return (
    <div>
      <h3 className="section-title">Investment Analysis (Annual)</h3>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Value</th>
              <th>Debt</th>
              <th>Equity</th>
              <th>Cash Invested</th>
              <th>Cash Flow</th>
              <th>Total Return</th>
              <th>CoC</th>
              <th>DSCR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td>{formatCurrency(row.value)}</td>
                <td>{formatCurrency(row.debt)}</td>
                <td>{formatCurrency(row.equity)}</td>
                <td>{formatCurrency(row.totalCashInvested)}</td>
                <td>{formatCurrency(row.cashFlow)}</td>
                <td>{formatCurrency(row.totalReturn)}</td>
                <td>
                  {row.annualReturnOnInvestedCash !== undefined
                    ? formatPercent(row.annualReturnOnInvestedCash)
                    : "—"}
                </td>
                <td>{row.dscr !== undefined ? row.dscr.toFixed(2) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
