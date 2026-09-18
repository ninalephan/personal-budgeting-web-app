/** First-of-month date string ("YYYY-MM-01") for `date`, in UTC. */
export function currentMonthStart(date: Date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}
