/**
 * Display formatters. Currency symbol is read from the meta store
 * and passed in explicitly so this stays a pure module.
 */

export function formatNumber(value, decimals = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0,00';
  return n.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatMoney(value, currency = '€') {
  return `${formatNumber(value, 2)} ${currency}`;
}

export function formatQuantity(value, unit = '') {
  // Don't force 2 decimals for integer counts
  const n = Number(value);
  const isWhole = Number.isInteger(n);
  const formatted = n.toLocaleString('de-DE', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 3,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatDate(value) {
  if (!value) return '';
  // value can be ISO date "YYYY-MM-DD" or full ISO timestamp
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
