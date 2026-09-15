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
