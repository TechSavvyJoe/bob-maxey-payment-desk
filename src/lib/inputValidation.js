import { CALCULATION_LIMITS, fromCents, normalizeApr, toCents } from './calculations.js';

/** Parse user text without silently removing letters, signs, or malformed separators. */
export function parseFinancialInput(raw, { kind = 'money', min = 0, required = false } = {}) {
  const text = String(raw ?? '').trim();
  if (!text) return required ? { error: 'Enter an amount or rate.' } : { value: '' };
  const source = kind === 'money' ? text.replace(/^\$\s*/, '') : text.replace(/%$/, '').trim();
  if (!/^(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)$/.test(source)) {
    return { error: 'Enter a number, such as 30,000. Letters and negative amounts are not supported.' };
  }
  const clean = source.replaceAll(',', '');
  if (kind === 'money' && (clean.split('.')[1]?.length ?? 0) > 2) {
    return { error: 'Use no more than two decimal places for an amount.' };
  }
  const max = kind === 'rate' ? CALCULATION_LIMITS.maxApr : CALCULATION_LIMITS.maxAmount;
  const number = Number(clean);
  if (!Number.isFinite(number) || number < min || number > max) {
    return { error: `Enter a value from ${min.toLocaleString('en-US')} to ${max.toLocaleString('en-US')}${kind === 'rate' ? '%' : ''}.` };
  }
  try {
    return { value: kind === 'rate' ? normalizeApr(clean) : fromCents(toCents(clean)) };
  } catch {
    return { error: 'This value is outside the supported range.' };
  }
}
