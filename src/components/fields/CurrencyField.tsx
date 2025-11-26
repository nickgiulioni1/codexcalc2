import React from "react";

export function CurrencyField({
  label,
  value,
  onChange,
  step = 1000,
  min = 0,
  tooltip,
  fallbackValue,
}: {
  label: string;
  value: number | string | undefined;
  onChange: (value: number) => void;
  step?: number | "any";
  min?: number;
  tooltip?: string;
  fallbackValue?: number;
}) {
  const numericValue = Number(value);
  const displayValue = Number.isFinite(numericValue)
    ? numericValue
    : fallbackValue ?? "";

  return (
    <div className="field">
      <label className="field-label">
        <span>{label}</span>
        {tooltip && (
          <button
            type="button"
            className="help-icon"
            title={tooltip}
            data-tip={tooltip}
            aria-label={`${label} info`}
          >
            ?
          </button>
        )}
      </label>
      <input
        type="number"
        inputMode="decimal"
        value={displayValue}
        step={step}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}
