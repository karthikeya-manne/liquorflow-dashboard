export function getShopIdOrNull(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("selectedShopId");
}

export function getCurrentShopId(): string {
  const shopId = getShopIdOrNull();

  if (!shopId) {
    throw new Error("No shop selected");
  }

  return shopId;
}