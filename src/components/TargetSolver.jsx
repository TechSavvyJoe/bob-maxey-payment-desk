import { useMemo } from 'react';
import { buildSuggestions } from '../lib/suggestions.js';
import { formatCurrency } from '../lib/formatters.js';
import { MoneyInput, SegmentedControl } from './Fields.jsx';
import { ArrowIcon, ResetIcon } from './Icons.jsx';

const labels = { payment: 'payment', outTheDoor: 'out-the-door total', amountFinanced: 'amount financed' };

export default function TargetSolver({ dealInput, result, targetType, targetValues, onTargetTypeChange,
  onTargetValueChange, gridRates, expanded, onExpandedChange, onApplyPatch, onApplyItemPatch,
  onAddRoomItem, lastRoll, onUndoRoll, targetInputRef, hasInputErrors = false, canCompare = true }) {
  const targetValue = targetValues[targetType];
  const solution = useMemo(() => buildSuggestions({ dealInput, result, targetType, targetValue, gridRates }), [dealInput, result, targetType, targetValue, gridRates]);
  const suggestions = expanded ? solution.suggestions : solution.suggestions.slice(0, 3);
  const disabled = hasInputErrors || !result.isComplete || !canCompare;
  const summary = hasInputErrors ? 'Correct the highlighted figures to compare adjustments.'
    : !canCompare ? 'Complete the estimate and product tax choices before applying adjustments.'
    : solution.error || (solution.empty ? 'Enter a target to see the changes available.'
      : solution.alreadyMet ? `Your current ${labels[targetType]} already matches this target.`
        : solution.direction === 'increase' ? 'The current estimate is below this target. These are optional ways to use the remaining room.'
          : 'Compare each result before applying a change. Rates and trade adjustments require approval.');

  const apply = suggestion => {
    if (disabled) return;
    if (suggestion.patch) onApplyPatch(suggestion.patch, suggestion.title);
    if (suggestion.itemPatch) onApplyItemPatch(suggestion.itemPatch, suggestion.title);
    if (suggestion.addRoomItem) onAddRoomItem(suggestion.addRoomItem, suggestion.title);
  };
  return <section className="target-panel" id="target-solver" aria-labelledby="target-heading">
    <div className="target-panel__heading"><div><h2 id="target-heading" tabIndex={-1}>Set a target</h2><p>See what changes, then choose an option.</p></div>
      {solution.suggestions.length > 3 ? <button className="text-action" aria-controls="suggestion-list" aria-expanded={expanded} onClick={() => onExpandedChange(!expanded)} type="button">{expanded ? 'Show fewer' : 'See all options'}<ArrowIcon direction={expanded ? 'up' : 'right'} size={18} /></button> : null}
    </div>
    {lastRoll ? <div className="target-undo" role="status"><span>Applied <strong>{lastRoll.label}</strong>. Undo is available until your next edit.</span><button className="undo-button" type="button" onClick={onUndoRoll}><ResetIcon size={17} />Undo adjustment</button></div> : null}
    <div className={`target-panel__body ${solution.empty ? 'is-empty' : ''}`}>
      <div className="target-setup">
        <SegmentedControl className="target-tabs" label="Target type" onChange={onTargetTypeChange} options={result.isFinanced ? [{ label: 'Payment', value: 'payment' }, { label: 'Out-the-door', value: 'outTheDoor' }, { label: 'Amount financed', value: 'amountFinanced' }] : [{ label: 'Out-the-door', value: 'outTheDoor' }]} value={targetType} />
        <div className="target-input-row"><label htmlFor="target-value">Target {labels[targetType]}</label><MoneyInput ariaLabel={`Target ${labels[targetType]}`} id="target-value" onChange={value => onTargetValueChange(targetType, value)} ref={targetInputRef} value={targetValue} /><span>{targetType === 'payment' ? 'per month' : ''}</span></div>
        <p className="target-summary" aria-live="polite">{summary}</p>
        {targetValue !== '' ? <p className="target-current">Current {labels[targetType]}: <strong>{formatCurrency(targetType === 'payment' ? result.monthlyPayment : result[targetType])}</strong></p> : null}
      </div>
      <div className="suggestion-list" id="suggestion-list">
        {!suggestions.length ? <p className="suggestion-empty">{solution.alreadyMet ? 'No adjustment is needed.' : solution.empty ? 'Your comparison options will appear here.' : 'No supported adjustment is available for this target.'}</p> : null}
        {suggestions.map(suggestion => <article className="suggestion" key={suggestion.id}>
          <ArrowIcon direction={suggestion.iconDirection} size={21} />
          <div className="suggestion__copy"><strong>{suggestion.title}</strong><span>{suggestion.detail}</span>
            {suggestion.previewDeal ? <dl className="suggestion-metrics"><div><dt>Cash due</dt><dd>{formatCurrency(suggestion.previewDeal.dueAtSigning)}</dd></div><div><dt>Amount financed</dt><dd>{formatCurrency(suggestion.previewDeal.amountFinanced)}</dd></div></dl> : null}
            <span className={`suggestion-status ${suggestion.withinTarget ? 'is-met' : ''}`}>{suggestion.requiresProductSelection ? 'Choose and name the product before presenting' : suggestion.exact ? 'Meets target' : suggestion.withinTarget ? 'Within target' : `${formatCurrency(suggestion.remainingGap)} remaining to target`}</span>
          </div>
          <div className="suggestion__action"><strong className="suggestion__value">{suggestion.value}</strong><button aria-label={`Apply ${suggestion.title}`} className="apply-button" disabled={disabled} onClick={() => apply(suggestion)} type="button">{suggestion.requiresProductSelection ? 'Choose product' : 'Apply'}</button></div>
        </article>)}
      </div>
    </div>
  </section>;
}
