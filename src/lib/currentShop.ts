export function getCurrentShopId(): string {

    const shopId = localStorage.getItem("selectedShopId");
  
    if (!shopId) {
      throw new Error("No shop selected");
    }
  
    return shopId;
  
  }