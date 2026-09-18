/** Formats integer cents as a USD currency string (e.g. 120000 -> "$1,200.00"). */
export function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
