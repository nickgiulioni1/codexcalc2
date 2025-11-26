import React from "react";

export function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="summary-card">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
