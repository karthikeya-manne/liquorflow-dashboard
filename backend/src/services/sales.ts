import { ObjectId } from "mongodb";
import { getDb } from "../config/mongo.js";
import type { SaleDoc, ShopDoc } from "../types/domain.js";
import { findProductInShop } from "./products.js";

export type SaleLineInput = {
  productId: string;
  quantity: number;
};

export type CreateSalesInput = {
  items: SaleLineInput[];
  paymentMethod?: string;
  soldAt?: Date;
  includeProfit?: boolean;
};

function toApiSale(sale: SaleDoc) {
  return {
    id: sale.legacyFirestoreId ?? sale._id.toHexString(),
    productName: sale.productName,
    category: sale.category,
    quantity: sale.quantity,
    price: sale.price,
    profit: sale.profit,
    paymentMethod: sale.paymentMethod,
    soldAt: sale.soldAt.toISOString(),
  };
}

export async function listSales(shop: ShopDoc) {
  const db = getDb();
  const sales = await db
    .collection<SaleDoc>("sales")
    .find({ shopId: shop._id })
    .sort({ soldAt: -1 })
    .toArray();
  return sales.map(toApiSale);
}

export async function createSalesFromItems(shop: ShopDoc, input: CreateSalesInput) {
  const db = getDb();
  const client = db.client;
  const soldAt = input.soldAt ?? new Date();
  const createdSales: SaleDoc[] = [];

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of input.items) {
        const product = await findProductInShop(shop, item.productId);
        if (!product) throw new Error("SHOP_NOT_FOUND");

        if (product.quantity < item.quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const linePrice = Number(product.price) * item.quantity;
        const sale: SaleDoc = {
          _id: new ObjectId(),
          shopId: shop._id,
          productName: product.name,
          category: product.category || "Others",
          quantity: item.quantity,
          price: linePrice,
          profit: input.includeProfit ? linePrice : undefined,
          paymentMethod: input.paymentMethod,
          soldAt,
        };

        await db.collection<SaleDoc>("sales").insertOne(sale, { session });
        createdSales.push(sale);

        await db.collection("products").updateOne(
          { _id: product._id, shopId: shop._id },
          {
            $inc: { quantity: -item.quantity },
            $set: { updatedAt: new Date() },
          },
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }

  return createdSales.map(toApiSale);
}

export async function createMorningStockSales(
  shop: ShopDoc,
  lines: Array<{ productId: string; closingQuantity: number; soldQuantity: number }>,
) {
  const db = getDb();
  const client = db.client;
  const soldAt = new Date();
  soldAt.setDate(soldAt.getDate() - 1);
  soldAt.setHours(23, 59, 59, 999);

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      for (const line of lines) {
        const product = await findProductInShop(shop, line.productId);
        if (!product) continue;

        await db.collection("products").updateOne(
          { _id: product._id, shopId: shop._id },
          { $set: { quantity: line.closingQuantity, updatedAt: new Date() } },
          { session },
        );

        if (line.soldQuantity > 0) {
          const linePrice = line.soldQuantity * Number(product.price);
          const sale: SaleDoc = {
            _id: new ObjectId(),
            shopId: shop._id,
            productName: product.name,
            category: product.category || "Others",
            quantity: line.soldQuantity,
            price: linePrice,
            profit: linePrice,
            paymentMethod: "Morning Stock",
            soldAt,
          };
          await db.collection<SaleDoc>("sales").insertOne(sale, { session });
        }
      }
    });
  } finally {
    await session.endSession();
  }
}

export async function getDashboardSummary(shop: ShopDoc) {
  const db = getDb();
  const sales = await db.collection<SaleDoc>("sales").find({ shopId: shop._id }).toArray();
  const products = await db.collection("products").find({ shopId: shop._id }).toArray();

  const totalStock = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const monthlyRevenue = sales.reduce((sum, s) => sum + Number(s.price || 0), 0);

  const today = new Date();
  const isSameDay = (d: Date) => d.toDateString() === today.toDateString();

  const todaySales = sales.filter((s) => isSameDay(s.soldAt));
  const todayProfit = todaySales.reduce((sum, s) => sum + Number(s.profit ?? s.price ?? 0), 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdaySales = sales.filter((s) => s.soldAt.toDateString() === yesterday.toDateString());
  const yesterdayProfit = yesterdaySales.reduce((sum, s) => sum + Number(s.profit ?? s.price ?? 0), 0);

  const dailyCategorySales: Record<string, number> = {};
  for (const sale of todaySales) {
    const category = sale.category || "Others";
    dailyCategorySales[category] = (dailyCategorySales[category] ?? 0) + Number(sale.price || 0);
  }

  return {
    totalStock,
    monthlyRevenue,
    todayProfit,
    yesterdayProfit,
    dailyCategorySales,
    salesCount: sales.length,
  };
}
