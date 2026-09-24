import { formatCurrency, formatNumber } from "../lib/formatters.js";
import { buildProposalGroups, getDealSummary } from "../lib/proposal.js";
import { EditIcon } from "./Icons.jsx";

const money = (value) => formatCurrency(value, { cents: true });
const BreakdownRow = ({ label, value, strong = false }) => (
  <div className={"breakdown-row" + (strong ? " is-strong" : "")}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

export default function ResultsPanel({ dealInput, result, customer = false, onActivatePaymentTarget, hasInputErrors = false }) {
  const summary = getDealSummary({ dealInput, result, hasInputErrors });
  const groups = customer ? [] : buildProposalGroups(result);

  return (
    <aside className={"results-panel" + (customer ? " results-panel--customer" : "")} aria-label={customer ? "Selected estimate summary" : "Current estimate summary"}>
      <section className="results-payment">
        <div className="results-payment__label-row"><h2>{summary.headline}</h2></div>
        <div className={"payment-number" + (summary.isFinanced ? "" : " payment-number--cash")}>
          <strong>{money(summary.headlineAmount)}</strong>
          {summary.isFinanced ? <span className="payment-number__suffix">/mo</span> : null}
        </div>
        {summary.isFinanced ? (
          <p>{summary.termMonths} months at {formatNumber(summary.apr)}% APR</p>
        ) : <p>{summary.hasCashCredit ? "Amount in the customer's favor after trade settlement" : "Includes trade payoff or equity"}</p>}
        {!customer && summary.isFinanced && onActivatePaymentTarget ? (
          <button className="payment-edit-button" onClick={() => onActivatePaymentTarget(result.monthlyPayment)} type="button">
            <EditIcon size={18} />Set payment target
          </button>
        ) : null}
      </section>
      <section className="result-totals" aria-label="Key deal totals">
        {summary.isFinanced ? <BreakdownRow label="Amount financed" value={money(summary.amountFinanced)} /> : null}
        <BreakdownRow label="Out-the-door total" value={money(summary.outTheDoor)} />
        <BreakdownRow label={summary.isFinanced ? "Due at signing" : "Cash due after trade"} value={money(summary.dueAtSigning)} />
        {summary.hasCashCredit ? <BreakdownRow label="Customer credit" value={money(summary.customerCredit)} /> : null}
      </section>
      {summary.reasons.length ? (
        <div className="result-warning" role="alert">
          <strong>Estimate needs attention</strong>
          {summary.reasons.map((reason) => <p key={reason}>{reason}</p>)}
        </div>
      ) : null}
      {!customer ? (
        <details className="deal-breakdown">
          <summary>View itemized deal breakdown</summary>
          {groups.map((section) => (
            <section className="breakdown-group" key={section.id}>
              <h3>{section.title}</h3>
              {section.rows.map((item) => <BreakdownRow key={item.id} label={item.label} value={money(item.amount)} />)}
              <BreakdownRow label={section.total.label} value={money(section.total.amount)} strong />
            </section>
          ))}
        </details>
      ) : null}
    </aside>
  );
}
