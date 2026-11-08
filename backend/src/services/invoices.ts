import { ObjectId } from "mongodb";
import { getDb } from "../config/mongo.js";
import type { InvoiceHistoryDoc, InvoiceItem, ShopDoc } from "../types/domain.js";

function toApiInvoice(doc: InvoiceHistoryDoc) {
  return {
    id: doc.legacyFirestoreId ?? doc._id.toHexString(),
    invoiceNumber: doc.invoiceNumber,
    uploadedAt: doc.uploadedAt.toISOString(),
    totalProducts: doc.totalProducts,
    totalCases: doc.totalCases,
    items: doc.items,
  };
}

export async function listInvoices(shop: ShopDoc) {
  const db = getDb();
  const invoices = await db
    .collection<InvoiceHistoryDoc>("invoiceHistory")
    .find({ shopId: shop._id })
    .sort({ uploadedAt: -1 })
    .toArray();
  return invoices.map(toApiInvoice);
}

export async function importInvoice(
  shop: ShopDoc,
  input: {
    invoiceNumber: string;
    items: InvoiceItem[];
  },
) {
  const db = getDb();
  const client = db.client;

  const existing = await db.collection<InvoiceHistoryDoc>("invoiceHistory").findOne({
    shopId: shop._id,
    invoiceNumber: input.invoiceNumber,
  });
  if (existing) throw new Error("INVOICE_ALREADY_PROCESSED");

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of input.items) {
        const products = await db.collection("products").find({ shopId: shop._id }).toArray();
        const product = products.find((p) => p.name === item.inventoryName);
        if (!product) continue;

        const bottlesToAdd =
          Number(item.qty) * Number(item.packQty) + Number(item.bottles ?? 0);

        await db.collection("products").updateOne(
          { _id: product._id, shopId: shop._id },
          {
            $inc: { quantity: bottlesToAdd },
            $set: { updatedAt: new Date() },
          },
          { session },
        );
      }

      const invoice: InvoiceHistoryDoc = {
        _id: new ObjectId(),
        shopId: shop._id,
        invoiceNumber: input.invoiceNumber,
        uploadedAt: new Date(),
        totalProducts: input.items.length,
        totalCases: input.items.reduce((sum, item) => sum + Number(item.qty), 0),
        items: input.items,
      };

      await db.collection<InvoiceHistoryDoc>("invoiceHistory").insertOne(invoice, { session });
    });
  } finally {
    await session.endSession();
  }

  const products = await db.collection("products").find({ shopId: shop._id }).toArray();
  const totalStock = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  return { totalStock };
}

export async function deleteInvoice(shop: ShopDoc, invoiceId: string) {
  const db = getDb();
  const collection = db.collection<InvoiceHistoryDoc>("invoiceHistory");

  let invoice =
    (await collection.findOne({ shopId: shop._id, legacyFirestoreId: invoiceId })) ??
    (ObjectId.isValid(invoiceId)
      ? await collection.findOne({ shopId: shop._id, _id: new ObjectId(invoiceId) })
      : null);

  if (!invoice) throw new Error("SHOP_NOT_FOUND");

  const client = db.client;
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of invoice!.items) {
        const products = await db.collection("products").find({ shopId: shop._id }).toArray();
        const match = products.find((p) => p.name === item.inventoryName);
        if (!match) continue;

        const bottlesToRemove =
          Number(item.qty) * Number(item.packQty) + Number(item.bottles ?? 0);

        await db.collection("products").updateOne(
          { _id: match._id, shopId: shop._id },
          {
            $set: {
              quantity: Math.max(Number(match.quantity) - bottlesToRemove, 0),
              updatedAt: new Date(),
            },
          },
          { session },
        );
      }

      await collection.deleteOne({ _id: invoice!._id }, { session });
    });
  } finally {
    await session.endSession();
  }

  const products = await db.collection("products").find({ shopId: shop._id }).toArray();
  const totalStock = products.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  return { totalStock };
}
