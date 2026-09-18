/** First-of-month date string ("YYYY-MM-01") for `date`, in UTC. */
export function currentMonthStart(date: Date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

/** First-of-next-month date string for a "YYYY-MM-01" month key — the exclusive end of that month's date range. */
export function nextMonthStart(month: string) {
  const date = new Date(`${month}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return currentMonthStart(date);
}
