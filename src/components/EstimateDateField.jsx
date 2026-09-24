import { useEffect, useState } from 'react';
import { getMichiganPolicy } from '../lib/policy.js';
import { useFieldValidation } from './ValidationContext.jsx';

export default function EstimateDateField({ value, onChange }) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(null);
  const reportError = useFieldValidation();
  useEffect(() => () => reportError?.('estimate-date', null), [reportError]);
  const update = raw => {
    setDraft(raw);
    let message = null;
    try {
      if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error('Invalid date');
      getMichiganPolicy(raw);
    } catch { message = 'Choose a valid estimate date with a four-digit year.'; }
    setError(message);
    reportError?.('estimate-date', message);
    if (!message) onChange(raw);
  };
  return <label htmlFor="estimate-date">Estimate date
    <input id="estimate-date" type="date" value={draft} required min="1900-01-01" max="9999-12-31"
      aria-invalid={error ? true : undefined} aria-describedby={error ? 'estimate-date-error' : undefined}
      onChange={event => update(event.target.value)} />
    {error ? <span className="field-error" id="estimate-date-error">{error}</span> : null}
  </label>;
}
