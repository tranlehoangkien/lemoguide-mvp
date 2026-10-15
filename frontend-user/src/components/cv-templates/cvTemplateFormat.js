/** "2019-09-01" -> "2019". Falls back to the raw string, or '' when empty. */
export const formatYear = (dateStr) => {
  if (!dateStr) return '';
  const y = String(dateStr).slice(0, 4);
  return /^\d{4}$/.test(y) ? y : String(dateStr);
};

/** "2024-01-15" -> "01/2024". Falls back to the raw string, or '' when empty. */
export const formatMonthYear = (dateStr) => {
  if (!dateStr) return '';
  const m = String(dateStr).match(/^(\d{4})-(\d{2})/);
  return m ? `${m[2]}/${m[1]}` : String(dateStr);
};

export const formatYearRange = (startDate, endDate) => {
  const start = formatYear(startDate);
  const end = endDate ? formatYear(endDate) : 'Hiện tại';
  if (!start && !end) return '';
  return `${start} - ${end}`;
};

export const formatMonthYearRange = (startDate, endDate, current) => {
  const start = formatMonthYear(startDate);
  const end = current || !endDate ? 'Hiện tại' : formatMonthYear(endDate);
  if (!start && !end) return '';
  return `${start} - ${end}`;
};
