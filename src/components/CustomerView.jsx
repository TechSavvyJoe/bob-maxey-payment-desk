import React, { useEffect, useRef, useState } from "react";
import { calculatePayment } from "../lib/calculations.js";
import { formatCurrency, formatNumber, formatWholeCurrency } from "../lib/formatters.js";
import { PrintIcon, ShareIcon } from "./Icons.jsx";
import ResultsPanel from "./ResultsPanel.jsx";

const buildShareText = (dealInput, result) => {
  const lines = ["Bob Maxey Ford — Purchase Proposal"];
  if (result.isFinanced) {
    lines.push(
      `Estimated payment: ${formatWholeCurrency(result.monthlyPayment)}/mo`,
      `${dealInput.termMonths} months at ${formatNumber(dealInput.apr)}% APR`,
      `Amount financed: ${formatCurrency(result.amountFinanced)}`,
    );
  } else if (result.customerCredit > 0) {
    lines.push(`Estimated customer credit: ${formatCurrency(result.customerCredit)}`);
  } else {
    lines.push(`Cash due after trade: ${formatCurrency(result.dueAtSigning)}`);
  }
  lines.push(`Out-the-door: ${formatCurrency(result.outTheDoor)}`);
  return lines.join("\n");
};

const LedgerRow = ({ label, value, total = false, className = "" }) => (
  <div className={`customer-ledger__row ${total ? "is-total" : ""} ${className}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default function CustomerView({ dealInput, result, gridRates, paymentTargetProps }) {
  const optionTerms = [...new Set([dealInput.termMonths, 60, 72, 84])].sort((a, b) => a - b);
  const taxesAndFees = result.salesTax + result.fees.totalFees;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const [shareStatus, setShareStatus] = useState(null);
  const statusTimeout = useRef(null);

  useEffect(() => () => window.clearTimeout(statusTimeout.current), []);

  const flashStatus = (message) => {
    setShareStatus(message);
    window.clearTimeout(statusTimeout.current);
    statusTimeout.current = window.setTimeout(() => setShareStatus(null), 3200);
  };

  const handleShare = async () => {
    const text = buildShareText(dealInput, result);
    if (canNativeShare) {
      try {
        await navigator.share({ title: "Bob Maxey Ford — Purchase Proposal", text, url: window.location.href });
      } catch (error) {
        if (error?.name !== "AbortError") flashStatus("Couldn't open the share sheet.");
      }
      return;
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        flashStatus("Copied deal summary to clipboard.");
        return;
      } catch {
        // Fall through to print.
      }
    }
    window.print();
  };

  return (
    <div className="customer-layout">
      <main className="customer-content">
        <div className="customer-actions">
          <button className="share-button" onClick={handleShare} type="button">
            <ShareIcon size={20} />
            {canNativeShare ? "Share with customer" : "Share or copy summary"}
          </button>
          <button className="print-button" onClick={() => window.print()} type="button">
            <PrintIcon size={19} />
            Print
          </button>
          {shareStatus ? (
            <span aria-live="polite" className="share-status">
              {shareStatus}
            </span>
          ) : null}
        </div>
        <section className="customer-ledger">
          <h2>Selected deal</h2>
          <LedgerRow label="Vehicle price" value={formatCurrency(result.salePrice)} />
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
