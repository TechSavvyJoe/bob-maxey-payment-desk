import React from "react";
import { calculatePayment } from "../lib/calculations.js";
import { formatCurrency, formatNumber, formatWholeCurrency } from "../lib/formatters.js";
import ResultsPanel from "./ResultsPanel.jsx";

const LedgerRow = ({ label, value, total = false, className = "" }) => (
  <div className={`customer-ledger__row ${total ? "is-total" : ""} ${className}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default function CustomerView({ dealInput, result, gridRates, paymentTargetProps }) {
  const optionTerms = [...new Set([dealInput.termMonths, 60, 72, 84])].sort((a, b) => a - b);
  const taxesAndFees = result.salesTax + result.fees.totalFees;

  return (
    <div className="customer-layout">
      <main className="customer-content">
        <section className="customer-ledger">
          <h2>Selected deal</h2>
          <LedgerRow label="Vehicle price" value={formatCurrency(result.salePrice)} />
          <LedgerRow label="Manufacturer rebate" value={`−${formatCurrency(result.manufacturerRebate)}`} />
          {result.optionalItemsTotal > 0 ? (
            <LedgerRow label="Selected options" value={`+${formatCurrency(result.optionalItemsTotal)}`} />
          ) : null}
          {result.isFinanced ? <LedgerRow label="Cash down" value={formatCurrency(result.cashDown)} /> : null}
          <LedgerRow label="Trade allowance" value={formatCurrency(result.tradeAllowance)} />
          {result.tradeEquity < 0 ? (
            <LedgerRow
              className="is-negative"
              label="Negative trade equity"
              value={`+${formatCurrency(result.negativeEquity)}`}
            />
          ) : (
            <LedgerRow
              label="Positive trade equity"
              value={`−${formatCurrency(result.positiveEquity)}`}
            />
          )}
          <LedgerRow label="Taxes & fees" value={formatCurrency(taxesAndFees)} />
          <LedgerRow label="Out-the-door" total={result.isFinanced} value={formatCurrency(result.outTheDoor)} />
          {result.isFinanced ? (
            <LedgerRow label="Due at signing" value={formatCurrency(result.dueAtSigning)} />
          ) : result.customerCredit > 0 ? (
            <LedgerRow label="Estimated customer credit" total value={formatCurrency(result.customerCredit)} />
          ) : (
            <LedgerRow label="Cash due after trade" total value={formatCurrency(result.dueAtSigning)} />
          )}
        </section>

        {result.isFinanced ? (
          <section className="customer-options">
            <div className="customer-options__heading">
              <h2>Payment options</h2>
              <p>Ask your salesperson to adjust the term, rate, or cash down.</p>
            </div>
            <div className="customer-options__table" role="table" aria-label="Customer payment options">
              <div className="customer-options__row is-header" role="row">
                <span role="columnheader">Term</span>
                <span role="columnheader">APR</span>
                <span role="columnheader">Estimated payment</span>
              </div>
              {optionTerms.map((term) => {
                const apr = Number(gridRates[term] ?? dealInput.apr);
                const payment = calculatePayment({
                  principal: result.amountFinanced,
                  apr,
                  termMonths: term,
                }).monthlyPayment;
                const selected = term === dealInput.termMonths;
                return (
                  <div className={`customer-options__row ${selected ? "is-selected" : ""}`} key={term} role="row">
                    <span role="cell">
                      <i aria-hidden="true" className="selection-dot" />
                      {term} months
                    </span>
                    <span role="cell">{formatNumber(apr)}%</span>
                    <strong role="cell">{formatWholeCurrency(payment)}/mo</strong>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
      <ResultsPanel
        customer
        dealInput={dealInput}
        result={result}
        {...paymentTargetProps}
      />
    </div>
  );
}
