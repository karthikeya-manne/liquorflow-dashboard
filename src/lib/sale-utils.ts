export function getSaleDate(sale: {
  soldAt?: string | { toDate?: () => Date; seconds?: number };
}): Date | null {
  const soldAt = sale.soldAt;
  if (!soldAt) return null;

  if (typeof soldAt === "string") {
    const parsed = new Date(soldAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof soldAt.toDate === "function") {
    return soldAt.toDate();
  }

  if (typeof soldAt.seconds === "number") {
    return new Date(soldAt.seconds * 1000);
  }

  return null;
}
