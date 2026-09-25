import { formatCurrency } from '../lib/formatters.js';

const money = value => formatCurrency(value, { cents: true });

export default function TradeTaxBreakdown({ result }) {
  if (!(result.tradeAllowance > 0) || !(result.salePrice > 0)) return null;
  if (!result.policy.supportedDate) return <section className="trade-tax-breakdown" aria-label="Michigan trade tax calculation"><h3>Michigan trade tax savings</h3><p>The selected date is outside the supported tax policy. Verify its trade deduction before using this estimate.</p></section>;
  return <section className="trade-tax-breakdown" aria-label="Michigan trade tax calculation">
    <h3>Michigan trade tax savings</h3>
    <dl>
      <div><dt>Taxable price before trade</dt><dd>{money(result.taxableTotalBeforeCredit)}</dd></div>
      <div><dt>Less trade tax deduction</dt><dd>−{money(result.tradeTaxDeduction)}</dd></div>
      <div><dt>Taxable balance</dt><dd>{money(result.taxBase)}</dd></div>
      <div className="trade-tax-savings"><dt>Sales tax saved</dt><dd>{money(result.tradeTaxSavings)}</dd></div>
    </dl>
    <div className="trade-tax-print">{money(result.taxableTotalBeforeCredit)} taxable − {money(result.tradeTaxDeduction)} trade deduction = {money(result.taxBase)} subject to {result.salesTaxRate * 100}% tax.<br /><strong>Sales tax {money(result.salesTax)} · Trade saves {money(result.tradeTaxSavings)}</strong></div>
    <p>{result.policy.year} allowance limit: {result.tradeTaxCreditCap === null ? 'no cap' : money(result.tradeTaxCreditCap)}. Deduction cannot exceed the taxable price. Trade payoff does not reduce this deduction.</p>
  </section>;
}
