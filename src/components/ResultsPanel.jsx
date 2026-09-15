import React, { useEffect, useRef, useState } from "react";
import { formatCurrency, formatNumber, formatWholeCurrency } from "../lib/formatters.js";
import { EditIcon } from "./Icons.jsx";

const parseMoney = (raw) => {
  const number = Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

const BreakdownRow = ({ label, value, strong = false, className = "" }) => (
  <div className={`breakdown-row ${strong ? "is-strong" : ""} ${className}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default function ResultsPanel({
  dealInput,
  result,
  customer = false,
  onPaymentTargetChange,
  onActivatePaymentTarget,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(Math.round(result.monthlyPayment)));
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(String(Math.round(result.monthlyPayment)));
  }, [result.monthlyPayment, editing]);

  const startEditing = () => {
    if (!result.isFinanced) return;
    const startingValue = Math.round(result.monthlyPayment);
    onActivatePaymentTarget(startingValue);
    setDraft(String(startingValue));
    setEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const taxesAndFees = result.salesTax + result.fees.totalFees;
  const paymentDisplay = editing ? draft : String(Math.round(result.monthlyPayment));
  const cashHasCredit = !result.isFinanced && result.customerCredit > 0;

  return (
    <aside className={`results-panel ${customer ? "results-panel--customer" : ""}`}>
      <section aria-live="polite" className="results-payment">
        <div className="results-payment__label-row">
          <h2>{result.isFinanced ? (editing ? "Target payment" : "Estimated payment") : cashHasCredit ? "Estimated customer credit" : "Cash due after trade"}</h2>
          {!customer && result.isFinanced ? (
            <button
              aria-label="Edit target monthly payment"
              className="payment-edit-button"
              onClick={startEditing}
              type="button"
            >
              <EditIcon size={24} />
            </button>
          ) : null}
        </div>
        {result.isFinanced ? (
          <div className={`payment-number ${editing ? "is-editing" : ""}`}>
            <span aria-hidden="true">$</span>
            {customer ? (
              <strong>{Math.round(result.monthlyPayment).toLocaleString("en-US")}</strong>
            ) : (
              <input
                aria-label="Estimated monthly payment; edit to set a target"
                inputMode="decimal"
                onBlur={() => setEditing(false)}
                onChange={(event) => {
                  setDraft(event.target.value);
                  onPaymentTargetChange(parseMoney(event.target.value));
                }}
                onFocus={() => {
                  if (!editing) startEditing();
                }}
                ref={inputRef}
                type="text"
                value={paymentDisplay}
              />
            )}
            <span className="payment-number__suffix">/mo</span>
          </div>
        ) : (
          <div className="payment-number payment-number--cash">
            <strong>{formatCurrency(cashHasCredit ? result.customerCredit : result.dueAtSigning)}</strong>
          </div>
        )}
        {result.isFinanced ? (
          <p>{dealInput.termMonths} months at {formatNumber(dealInput.apr)}% APR</p>
        ) : (
          <p>{cashHasCredit ? "Trade value exceeds the cash balance" : "Includes trade payoff or equity"}</p>
        )}
        {editing ? (
          <p className="payment-target-note">
            Current estimate {formatWholeCurrency(result.monthlyPayment)}/mo. Adjustment options are shown below.
          </p>
        ) : null}
      </section>

      {result.isFinanced ? (
        <section className="result-totals">
          <BreakdownRow label="Amount financed" value={formatCurrency(result.amountFinanced)} />
          <BreakdownRow label="Total interest" value={formatCurrency(result.totalInterest)} />
          <BreakdownRow label="Total of payments" value={formatCurrency(result.totalOfPayments)} />
        </section>
      ) : (
        <section className="result-totals">
          <BreakdownRow label="Out-the-door" value={formatCurrency(result.outTheDoor)} />
          <BreakdownRow
            label={result.tradeEquity < 0 ? "Negative equity" : "Trade equity"}
            value={formatCurrency(Math.abs(result.tradeEquity))}
          />
          <BreakdownRow label="Taxes & fees" value={formatCurrency(taxesAndFees)} />
        </section>
      )}

      {!customer ? (
        <section className="deal-breakdown">
          <h2>Deal breakdown</h2>
          <BreakdownRow label="Selling price" value={formatCurrency(result.salePrice)} />
          <BreakdownRow label="Add-ons" value={`+${formatCurrency(result.optionalItemsTotal)}`} />
          <BreakdownRow label="Taxable fees" value={`+${formatCurrency(result.fees.taxableFixedFees)}`} />
          <BreakdownRow label="Sales tax" value={`+${formatCurrency(result.salesTax)}`} />
          <BreakdownRow label="State fees" value={`+${formatCurrency(result.fees.plateFees)}`} />
          <BreakdownRow label="Manufacturer rebate" value={`−${formatCurrency(result.manufacturerRebate)}`} />
          <BreakdownRow label="Out-the-door" strong value={formatCurrency(result.outTheDoor)} />
          {result.isFinanced ? (
            <>
              <BreakdownRow label="Cash down" value={`−${formatCurrency(result.cashDown)}`} />
              {result.tradeEquity < 0 ? (
                <BreakdownRow label="Negative equity" value={`+${formatCurrency(result.negativeEquity)}`} />
              ) : (
                <BreakdownRow label="Positive trade equity" value={`−${formatCurrency(result.positiveEquity)}`} />
              )}
              <BreakdownRow label="Amount financed" strong value={formatCurrency(result.amountFinanced)} />
              <BreakdownRow label="Due at signing" value={formatCurrency(result.dueAtSigning)} />
            </>
          ) : null}
          {!result.isFinanced ? (
            <>
              <BreakdownRow
                label={result.tradeEquity < 0 ? "Negative trade equity" : "Positive trade equity"}
                value={`${result.tradeEquity < 0 ? "+" : "−"}${formatCurrency(Math.abs(result.tradeEquity))}`}
              />
              <BreakdownRow
                label={cashHasCredit ? "Customer credit" : "Cash due after trade"}
                strong
                value={formatCurrency(cashHasCredit ? result.customerCredit : result.dueAtSigning)}
              />
            </>
          ) : null}
        </section>
      ) : null}

      {result.warnings.length ? (
        <div className="result-warning" role="alert">
          {result.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      ) : null}
    </aside>
  );
}
