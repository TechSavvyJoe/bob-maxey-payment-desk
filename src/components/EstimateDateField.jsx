import { useEffect, useState } from 'react';
import { formatShortDate, parseShortDate } from '../lib/formatters.js';
import { useFieldValidation } from './ValidationContext.jsx';

export default function EstimateDateField({ value, onChange }) {
  const [draft, setDraft] = useState(() => formatShortDate(value));
  const [error, setError] = useState(null);
  const reportError = useFieldValidation();
  useEffect(() => () => reportError?.('estimate-date', null), [reportError]);
  const update = raw => {
    setDraft(raw);
    const parsed = parseShortDate(raw);
    const message = parsed.error ?? null;
    setError(message);
    reportError?.('estimate-date', message);
    if (!message) onChange(parsed.value);
  };
  return <label htmlFor="estimate-date">Estimate date <span id="estimate-date-hint">MM/DD/YY</span>
    <input id="estimate-date" type="text" value={draft} required maxLength={8} placeholder="MM/DD/YY" autoComplete="off"
      aria-label="Estimate date" aria-invalid={error ? true : undefined} aria-describedby={`estimate-date-hint${error ? ' estimate-date-error' : ''}`}
      onChange={event => update(event.target.value)} />
    {error ? <span className="field-error" id="estimate-date-error">{error}</span> : null}
  </label>;
}
