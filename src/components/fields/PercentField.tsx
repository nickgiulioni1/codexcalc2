import React from "react";

export function PercentField({
  label,
  value,
  onChange,
  tooltip,
  fallbackValue,
  mode = "percent",
}: {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  tooltip?: string;
  fallbackValue?: number;
  mode?: "percent" | "decimal";
}) {
  const numericValue = Number(value);
  const baseValue = Number.isFinite(numericValue)
    ? numericValue
    : fallbackValue ?? "";
  const displayValue =
    baseValue === ""
      ? ""
      : mode === "percent"
      ? (baseValue as number) * 100
      : baseValue;
  const unitLabel = mode === "percent" ? "(%)" : "(decimal)";

  return (
    <div className="field">
      <label className="field-label">
        <span>
          {label} {unitLabel}
        </span>
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
        min={0}
        step="any"
        onChange={(e) =>
          onChange(
            mode === "percent"
              ? Number(e.target.value) / 100
              : Number(e.target.value)
          )
        }
        aria-label={label}
      />
    </div>
  );
}
