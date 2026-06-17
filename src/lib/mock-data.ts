export type Product = {
  id: string;
  name: string;
  category: "Whiskey" | "Vodka" | "Wine" | "Beer" | "Tequila" | "Rum" | "Gin";
  sku: string;
  stock: number;
  threshold: number;
  price: number;
  cost: number;
  supplier: string;
};

export const products: Product[] = [
  { id: "p1", name: "Macallan 18 Sherry Oak", category: "Whiskey", sku: "WHS-018", stock: 4, threshold: 6, price: 449.99, cost: 280, supplier: "Highland Imports" },
  { id: "p2", name: "Grey Goose Original", category: "Vodka", sku: "VDK-001", stock: 28, threshold: 10, price: 42.5, cost: 24, supplier: "French Spirits Co" },
  { id: "p3", name: "Don Julio 1942", category: "Tequila", sku: "TEQ-942", stock: 3, threshold: 5, price: 189.0, cost: 110, supplier: "Agave Trade" },
  { id: "p4", name: "Hendrick's Gin", category: "Gin", sku: "GIN-007", stock: 18, threshold: 8, price: 38.0, cost: 22, supplier: "Botanical Co" },
  { id: "p5", name: "Bacardi Superior", category: "Rum", sku: "RUM-101", stock: 45, threshold: 12, price: 18.99, cost: 9, supplier: "Caribbean Imports" },
  { id: "p6", name: "Caymus Cabernet 2021", category: "Wine", sku: "WIN-221", stock: 12, threshold: 15, price: 89.0, cost: 52, supplier: "Napa Direct" },
  { id: "p7", name: "Heineken Lager 24pk", category: "Beer", sku: "BER-024", stock: 62, threshold: 20, price: 28.99, cost: 17, supplier: "Global Brews" },
  { id: "p8", name: "Johnnie Walker Blue", category: "Whiskey", sku: "WHS-205", stock: 2, threshold: 4, price: 219.0, cost: 135, supplier: "Highland Imports" },
  { id: "p9", name: "Belvedere Vodka", category: "Vodka", sku: "VDK-022", stock: 22, threshold: 10, price: 39.99, cost: 23, supplier: "Polish Premium" },
  { id: "p10", name: "Patron Silver", category: "Tequila", sku: "TEQ-100", stock: 16, threshold: 8, price: 54.99, cost: 32, supplier: "Agave Trade" },
  { id: "p11", name: "Veuve Clicquot Brut", category: "Wine", sku: "WIN-301", stock: 7, threshold: 10, price: 64.0, cost: 38, supplier: "Champagne Direct" },
  { id: "p12", name: "Corona Extra 12pk", category: "Beer", sku: "BER-012", stock: 38, threshold: 20, price: 16.99, cost: 9, supplier: "Global Brews" },
];

export const salesData = [
  { day: "Mon", sales: 4200, orders: 38 },
  { day: "Tue", sales: 5100, orders: 44 },
  { day: "Wed", sales: 4800, orders: 41 },
  { day: "Thu", sales: 6300, orders: 52 },
  { day: "Fri", sales: 9200, orders: 78 },
  { day: "Sat", sales: 11400, orders: 96 },
  { day: "Sun", sales: 7800, orders: 65 },
];

export const categoryRevenue = [
  { name: "Whiskey", value: 32400 },
  { name: "Wine", value: 21800 },
  { name: "Vodka", value: 14200 },
  { name: "Tequila", value: 12600 },
  { name: "Beer", value: 9400 },
  { name: "Rum", value: 5200 },
];

export const recentOrders = [
  { id: "ORD-2841", customer: "The Velvet Lounge", items: 12, total: 1284.5, status: "Paid", time: "2m ago" },
  { id: "ORD-2840", customer: "Skyline Rooftop Bar", items: 8, total: 642.0, status: "Paid", time: "14m ago" },
  { id: "ORD-2839", customer: "Marriott Downtown", items: 24, total: 3120.75, status: "Pending", time: "1h ago" },
  { id: "ORD-2838", customer: "Joe's Tavern", items: 6, total: 318.4, status: "Paid", time: "2h ago" },
  { id: "ORD-2837", customer: "Bistro 47", items: 14, total: 982.6, status: "Paid", time: "3h ago" },
];
