import React, { useMemo } from "react";
import { calculateRateGrid } from "../lib/calculations.js";
import { formatCurrency, formatNumber, formatWholeCurrency } from "../lib/formatters.js";
import { MoneyInput, PercentInput } from "./Fields.jsx";
import { ArrowIcon, GridIcon } from "./Icons.jsx";

const TERMS = [36, 48, 60, 72, 84];

export default function PaymentGrid({
  dealInput,
  result,
  rates,
  downPayments,
  onRateChange,
  onDownPaymentChange,
  onApplyScenario,
}) {
  const grid = useMemo(
    () =>
      calculateRateGrid(dealInput, {
        rows: TERMS.map((termMonths) => ({ termMonths, apr: Number(rates[termMonths] ?? dealInput.apr) })),
        downPayments,
        includeCustom: false,
      }),
    [dealInput, rates, downPayments],
  );

  const isSelected = (cell) =>
    dealInput.termMonths === cell.termMonths &&
    Math.abs(dealInput.apr - cell.apr) < 0.005 &&
    Math.abs(dealInput.cashDown - cell.cashDown) < 0.005;

  const apply = (cell) => onApplyScenario({
    termMonths: cell.termMonths,
    apr: cell.apr,
    cashDown: cell.cashDown,
  });

  return (
    <section className="payment-grid-section" id="payment-grid">
      <div className="grid-heading">
        <div>
          <h2>Payment grid</h2>
          <p>Compare terms, rates, and down payments without rebuilding the deal.</p>
        </div>
        <button className="back-button" onClick={() => document.getElementById("calculator-top")?.scrollIntoView({ behavior: "smooth" })} type="button">
          <ArrowIcon direction="up" size={20} />
          Back to calculator
        </button>
      </div>

      <div className="grid-context">
        <span>{formatWholeCurrency(dealInput.salePrice)} selling price</span>
        <span>{formatWholeCurrency(result.amountBeforeCashDown)} before cash down</span>
        <span>2026 MI trade tax credit {formatWholeCurrency(result.tradeTaxCredit)}</span>
      </div>

      <div className="desktop-rate-grid">
        <table>
          <caption className="sr-only">
            Monthly payment estimates by loan term, APR, and total cash down
          </caption>
          <thead>
            <tr>
              <th scope="col">Term</th>
              <th scope="col">APR</th>
              {grid.columns.map((column, columnIndex) => (
                <th key={column.key} scope="col">
                  <MoneyInput
                    ariaLabel={`Down payment column ${columnIndex + 1}`}
                    compact
                    onChange={(value) => onDownPaymentChange(columnIndex, value)}
                    value={downPayments[columnIndex]}
                  />
                  <span>down</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <tr className={dealInput.termMonths === row.termMonths ? "is-current-term" : ""} key={row.termMonths}>
                <th scope="row">{row.termMonths} mo</th>
                <td className="rate-cell">
                  <PercentInput
                    ariaLabel={`APR for ${row.termMonths} months`}
                    onChange={(value) => onRateChange(row.termMonths, value)}
                    value={rates[row.termMonths]}
                  />
                </td>
                {row.cells.map((cell) => (
                  <td className={isSelected(cell) ? "is-selected" : ""} key={cell.key}>
                    <button
                      aria-label={`Use ${cell.termMonths} months at ${formatNumber(cell.apr)} percent with ${formatCurrency(cell.cashDown)} down for ${formatCurrency(cell.monthlyPayment)} per month`}
                      aria-pressed={isSelected(cell)}
                      onClick={() => apply(cell)}
                      type="button"
                    >
                      {formatWholeCurrency(cell.monthlyPayment)}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-rate-grid">
        <section className="mobile-down-editor">
          <h3>Down payment amounts</h3>
          <p>Edit the total cash-down amounts to compare payments.</p>
          <div className="mobile-down-editor__grid">
            {downPayments.map((value, index) => (
              <MoneyInput
                ariaLabel={`Down payment option ${index + 1}`}
                key={index}
                onChange={(next) => onDownPaymentChange(index, next)}
                value={value}
              />
            ))}
          </div>
        </section>
        <p className="mobile-grid-helper">Tap any payment to apply its term, APR, and down payment.</p>
        <div className="mobile-term-list">
          {grid.rows.map((row) => (
            <section className="mobile-term-card" key={row.termMonths}>
              <div className="mobile-term-card__header">
                <h3>{row.termMonths} months</h3>
                <label>
                  <span>APR</span>
                  <PercentInput
                    ariaLabel={`APR for ${row.termMonths} months`}
                    onChange={(value) => onRateChange(row.termMonths, value)}
                    value={rates[row.termMonths]}
                  />
                </label>
              </div>
              <div className="mobile-payment-options">
                {row.cells.map((cell) => (
                  <button
                    aria-pressed={isSelected(cell)}
                    className={isSelected(cell) ? "is-selected" : ""}
                    key={cell.key}
                    onClick={() => apply(cell)}
                    type="button"
                  >
                    <span>{formatWholeCurrency(cell.cashDown)} down</span>
                    <strong>{formatWholeCurrency(cell.monthlyPayment)}/mo</strong>
                    <ArrowIcon direction="right" size={19} />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="grid-footer">
        <div>
          <GridIcon size={22} />
          <strong>Payment grid</strong>
          <span>Compare terms, rates, and down payments</span>
        </div>
        <p>Select any payment to apply its term, APR, and down payment to the deal.</p>
      </div>
    </section>
  );
}
