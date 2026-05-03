export function formatCurrency(amount: number, currency: string = "AUD"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
