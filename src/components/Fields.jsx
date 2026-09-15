import React, { forwardRef, useEffect, useId, useState } from "react";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const cleanNumber = (raw) => {
  const cleaned = String(raw).replace(/[^0-9.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isBlank = (value) => value === "" || value === null || value === undefined;

export const MoneyInput = forwardRef(function MoneyInput(
  {
    value,
    onChange,
    id,
    ariaLabel,
    className = "",
    disabled = false,
    min = 0,
    compact = false,
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(isBlank(value) ? "" : String(value));

  useEffect(() => {
    if (!focused) setDraft(isBlank(value) ? "" : String(value));
  }, [value, focused]);

  const commit = (raw) => {
    if (String(raw).trim() === "") {
      onChange?.("");
      return "";
    }
    const next = Math.max(min, cleanNumber(raw));
    onChange?.(next);
    return next;
  };

  return (
    <span className={`money-input ${compact ? "money-input--compact" : ""} ${className}`}>
      <span aria-hidden="true" className="money-input__prefix">$</span>
      <input
        aria-label={ariaLabel}
        disabled={disabled}
        id={inputId}
        inputMode="decimal"
        min={min}
        onBlur={(event) => {
          const next = commit(event.target.value);
          setDraft(String(next));
          setFocused(false);
        }}
        onChange={(event) => {
          setDraft(event.target.value);
          commit(event.target.value);
        }}
        onFocus={(event) => {
          setFocused(true);
          setDraft(isBlank(value) ? "" : String(value));
          requestAnimationFrame(() => event.target.select());
        }}
        ref={ref}
        type="text"
        value={focused ? draft : isBlank(value) ? "" : numberFormatter.format(value)}
      />
    </span>
  );
});

export const PercentInput = ({ value, onChange, id, ariaLabel, className = "", disabled = false }) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(isBlank(value) ? "" : String(value));

  useEffect(() => {
    if (!focused) setDraft(isBlank(value) ? "" : Number(value).toFixed(2));
  }, [value, focused]);

  return (
    <span className={`percent-input ${className}`}>
      <input
        aria-label={ariaLabel}
        disabled={disabled}
        id={inputId}
        inputMode="decimal"
        min="0"
        onBlur={() => {
          setFocused(false);
          setDraft(isBlank(value) ? "" : Number(value).toFixed(2));
        }}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          onChange?.(raw.trim() === "" ? "" : Math.max(0, cleanNumber(raw)));
        }}
        onFocus={(event) => {
          setFocused(true);
          setDraft(isBlank(value) ? "" : String(value));
          requestAnimationFrame(() => event.target.select());
        }}
        type="text"
        value={focused ? draft : isBlank(value) ? "" : Number(value).toFixed(2)}
      />
      <span aria-hidden="true" className="percent-input__suffix">%</span>
    </span>
  );
};

export const FieldRow = ({ label, htmlFor, children, helper, className = "" }) => (
  <div className={`field-row ${className}`}>
    <div className="field-row__label">
      <label htmlFor={htmlFor}>{label}</label>
      {helper ? <span>{helper}</span> : null}
    </div>
    {children}
  </div>
);

export const SegmentedControl = ({ label, options, value, onChange, className = "" }) => (
  <div aria-label={label} className={`segmented ${className}`} role="group">
    {options.map((option) => (
      <button
        aria-pressed={value === option.value}
        className={value === option.value ? "is-selected" : ""}
        key={option.value}
        onClick={() => onChange(option.value)}
        type="button"
      >
        {option.label}
      </button>
    ))}
  </div>
);
