export const formatCurrency = (value, { cents = false, sign = false } = {}) => {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  const hasCents = Math.abs(numeric - Math.round(numeric)) > 0.0001;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents || hasCents ? 2 : 0,
    maximumFractionDigits: cents || hasCents ? 2 : 0,
    signDisplay: sign ? "always" : "auto",
  }).format(numeric);

  return formatted.replace("+$", "+$").replace("-$", "−$");
};

export const formatWholeCurrency = (value, { sign = false } = {}) =>
  formatCurrency(Math.round(Number(value) || 0), { sign });

export const formatNumber = (value, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0);

const isCalendarDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

/** Format an ISO calendar date without moving it across time zones. */
export function formatShortDate(isoDate) {
  if (!isCalendarDate(isoDate)) throw new RangeError('A valid ISO calendar date is required.');
  return `${isoDate.slice(5, 7)}/${isoDate.slice(8, 10)}/${isoDate.slice(2, 4)}`;
}

/** Two-digit entry years explicitly represent 2000–2099. */
export function parseShortDate(raw) {
  const text = String(raw ?? '').trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(text);
  const value = match ? `20${match[3]}-${match[1]}-${match[2]}` : null;
  return value && isCalendarDate(value)
    ? { value }
    : { error: 'Enter a valid date as MM/DD/YY (years 2000–2099).' };
}
