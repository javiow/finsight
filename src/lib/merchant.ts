export function normalizeMerchantName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}
