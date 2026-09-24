import React from "react";
import { CALCULATION_DEFAULTS, RATE_GRID_DEFAULTS } from "../lib/calculations.js";
import { formatCurrency, formatWholeCurrency } from "../lib/formatters.js";
import DealSection from "./DealSection.jsx";
import { FieldRow, MoneyInput, PercentInput, SegmentedControl } from "./Fields.jsx";
import {
  AddCircleIcon,
  CarIcon,
  PercentIcon,
  ReceiptIcon,
  TradeIcon,
  TrashIcon,
} from "./Icons.jsx";
import TargetSolver from "./TargetSolver.jsx";

export default function DealerView({
  dealInput,
  result,
  updateField,
  updateItem,
  addItem,
  removeItem,
  accordions,
  toggleAccordion,
  targetProps,
}) {
  const equitySummary =
    result.tradeEquity < 0
      ? `${formatWholeCurrency(Math.abs(result.tradeEquity))} negative equity`
      : result.tradeEquity > 0
        ? `${formatWholeCurrency(result.tradeEquity)} positive equity`
        : "No trade equity";
  const taxesAndFees = result.salesTax + result.fees.totalFees;

  return (
    <main className="dealer-workspace">
      <div className="deal-grid">
        <div className="deal-column">
          <DealSection
            className="deal-section--vehicle"
            icon={CarIcon}
            id="vehicle"
            onToggle={() => toggleAccordion("vehicle")}
            open={accordions.vehicle}
            summary={formatWholeCurrency(dealInput.salePrice)}
            title="Vehicle"
          >
            <FieldRow htmlFor="sale-price" label="Selling price">
              <MoneyInput
                ariaLabel="Selling price"
                id="sale-price"
                onChange={(value) => updateField("salePrice", value)}
                value={dealInput.salePrice}
              />
            </FieldRow>
          </DealSection>

          <DealSection
            className="deal-section--trade"
            icon={TradeIcon}
            id="trade-cash"
            onToggle={() => toggleAccordion("trade")}
            open={accordions.trade}
            summary={result.isFinanced ? `${formatWholeCurrency(dealInput.cashDown)} down · ${equitySummary}` : equitySummary}
            title="Trade & cash"
          >
            {result.isFinanced ? (
              <FieldRow htmlFor="cash-down" label="Cash down">
                <MoneyInput
                  ariaLabel="Cash down"
                  id="cash-down"
                  onChange={(value) => updateField("cashDown", value)}
                  value={dealInput.cashDown}
                />
              </FieldRow>
            ) : null}
            <FieldRow htmlFor="trade-allowance" label="Trade allowance">
              <MoneyInput
                ariaLabel="Trade allowance"
                id="trade-allowance"
                onChange={(value) => updateField("tradeAllowance", value)}
                value={dealInput.tradeAllowance}
              />
            </FieldRow>
            <FieldRow htmlFor="trade-payoff" label="Trade payoff">
              <MoneyInput
                ariaLabel="Trade payoff"
                id="trade-payoff"
                onChange={(value) => updateField("tradePayoff", value)}
                value={dealInput.tradePayoff}
              />
            </FieldRow>
            <div className={`equity-line ${result.tradeEquity < 0 ? "is-negative" : "is-positive"}`}>
              <strong>{result.tradeEquity < 0 ? "Negative equity" : "Trade equity"}</strong>
              <strong>{formatWholeCurrency(Math.abs(result.tradeEquity))}</strong>
            </div>
            {result.negativeEquity > 0 && dealInput.dealType === "finance" ? (
              <label className="equity-roll-control">
                <input
                  checked={dealInput.rollNegativeEquity}
                  onChange={(event) => updateField("rollNegativeEquity", event.target.checked)}
                  type="checkbox"
                />
                <span>Include negative equity in amount financed</span>
              </label>
            ) : null}
          </DealSection>
        </div>

        <div className="deal-column">
          <DealSection
            className="deal-section--taxes"
            icon={ReceiptIcon}
            id="taxes-fees"
            onToggle={() => toggleAccordion("taxes")}
            open={accordions.taxes}
            summary={`${formatWholeCurrency(taxesAndFees)} total`}
            title="Taxes & state fees"
          >
            <FieldRow htmlFor="sales-tax" label="Sales tax">
              <PercentInput
                ariaLabel="Sales tax rate"
                disabled
                id="sales-tax"
                value={CALCULATION_DEFAULTS.salesTaxRate * 100}
              />
            </FieldRow>
            <FieldRow helper="Taxable · every deal" label="Doc fee">
              <MoneyInput ariaLabel="Document fee" disabled value={result.fees.documentFee} />
            </FieldRow>
            <FieldRow helper="Taxable · every deal" label="CRV">
              <MoneyInput ariaLabel="CRV fee" disabled value={result.fees.crvFee} />
            </FieldRow>
            <div className="choice-row">
              <span>Purchase</span>
              <SegmentedControl
                label="Purchase type"
                onChange={(value) => updateField("dealType", value)}
                options={[
                  { label: "Finance", value: "finance" },
                  { label: "Cash", value: "cash" },
                ]}
                value={dealInput.dealType}
              />
            </div>
            <div className="choice-row">
              <span>Plate</span>
              <SegmentedControl
                label="Plate type"
                onChange={(value) => updateField("plateMode", value)}
                options={[
                  { label: "Transfer", value: "transfer" },
                  { label: "New plate", value: "new" },
                ]}
                value={dealInput.plateMode}
              />
            </div>
            {dealInput.plateMode === "new" ? (
              <FieldRow
                helper={`Title ${formatCurrency(result.isFinanced ? CALCULATION_DEFAULTS.financeTitleFee : CALCULATION_DEFAULTS.cashTitleFee)} added automatically`}
                htmlFor="new-plate-amount"
                label="New plate amount"
              >
                <MoneyInput
                  ariaLabel="New plate amount"
                  id="new-plate-amount"
                  onChange={(value) => updateField("newPlateAmount", value)}
                  value={dealInput.newPlateAmount}
                />
              </FieldRow>
            ) : (
              <div className="state-fee-line">
                Transfer {formatCurrency(result.fees.plateTransferFee)}
                <span>+</span>
                State fee {formatCurrency(result.fees.additionalTransferFee)}
                <span>+</span>
                Title {formatCurrency(result.fees.titleFee)}
              </div>
            )}
          </DealSection>

          <DealSection
            className="deal-section--products"
            icon={AddCircleIcon}
            id="products-addons"
            onToggle={() => toggleAccordion("roll")}
            open={accordions.roll}
            summary={dealInput.optionalItems.length ? formatWholeCurrency(result.optionalItemsTotal) : "None added"}
            title="Products & add-ons"
          >
            {dealInput.optionalItems.length ? (
              <>
                <div className="option-list__header" aria-hidden="true">
                  <span>Item</span>
                  <span>Amount</span>
                  <span>Tax</span>
                  <span />
                </div>
                <div className="option-list">
                  {dealInput.optionalItems.map((item, index) => (
                <div className="option-row" key={item.id}>
                  <input
                    aria-label={`Name for product or add-on ${index + 1}`}
                    className="text-input"
                    onChange={(event) => updateItem(index, { name: event.target.value })}
                    placeholder="Product name"
                    type="text"
                    value={item.name}
                  />
                  <MoneyInput
                    ariaLabel={`${item.name || `Product or add-on ${index + 1}`} amount`}
                    compact
                    onChange={(value) => updateItem(index, { amount: value })}
                    value={item.amount}
                  />
                  <label className="tax-check">
                    <input
                      aria-label={`${item.name || `Product or add-on ${index + 1}`} is taxable`}
                      checked={item.taxable}
                      onChange={(event) => updateItem(index, { taxable: event.target.checked })}
                      type="checkbox"
                    />
                    <span>Tax</span>
                  </label>
                  <button
                    aria-label={`Remove ${item.name || `product or add-on ${index + 1}`}`}
                    className="icon-button"
                    onClick={() => removeItem(index)}
                    type="button"
                  >
                    <TrashIcon size={20} />
                  </button>
                </div>
                  ))}
                </div>
              </>
            ) : null}
            <button className="add-item-button" onClick={() => addItem()} type="button">
              <AddCircleIcon size={20} />
              Add product or add-on
            </button>
            {dealInput.optionalItems.length ? (
              <div className="subtotal-line">
                <strong>Add-ons</strong>
                <strong>{formatWholeCurrency(result.optionalItemsTotal)}</strong>
              </div>
            ) : null}
            <p className="section-note">Add products only when they apply to this deal.</p>
          </DealSection>
        </div>
      </div>

      {result.isFinanced ? (
        <section className="financing-panel">
          <div className="financing-panel__heading">
            <PercentIcon size={24} />
            <h2>Financing</h2>
          </div>
          <FieldRow htmlFor="apr" label="APR">
            <PercentInput
              ariaLabel="Annual percentage rate"
              id="apr"
              onChange={(value) => updateField("apr", value)}
              value={dealInput.apr}
            />
          </FieldRow>
          <div className="term-control">
            <span>Term (months)</span>
            <div aria-label="Loan term" className="term-buttons" role="group">
              {RATE_GRID_DEFAULTS.termMonths.map((term) => (
                <button
                  aria-pressed={dealInput.termMonths === term}
                  className={dealInput.termMonths === term ? "is-selected" : ""}
                  key={term}
                  onClick={() => updateField("termMonths", term)}
                  type="button"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <TargetSolver dealInput={dealInput} result={result} {...targetProps} />
    </main>
  );
}
