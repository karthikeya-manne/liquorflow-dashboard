import { ObjectId } from "mongodb";
import { getDb } from "../config/mongo.js";
import type { OrderDoc, ShopDoc } from "../types/domain.js";

function toApiOrder(order: OrderDoc) {
  return {
    id: order.legacyFirestoreId ?? order._id.toHexString(),
    customerName: order.customerName,
    productName: order.productName,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  };
}

export async function listOrders(shop: ShopDoc) {
  const db = getDb();
  const orders = await db
    .collection<OrderDoc>("orders")
    .find({ shopId: shop._id })
    .sort({ createdAt: -1 })
    .toArray();
  return orders.map(toApiOrder);
}

export async function createOrder(
  shop: ShopDoc,
  input: { customerName: string; productName: string },
) {
  const db = getDb();
  const order: OrderDoc = {
    _id: new ObjectId(),
    shopId: shop._id,
    customerName: input.customerName,
    productName: input.productName,
    status: "Pending",
    createdAt: new Date(),
  };
  await db.collection<OrderDoc>("orders").insertOne(order);
  return toApiOrder(order);
}

export async function completeOrder(shop: ShopDoc, orderId: string) {
  const db = getDb();
  const collection = db.collection<OrderDoc>("orders");

  const order =
    (await collection.findOne({ shopId: shop._id, legacyFirestoreId: orderId })) ??
    (ObjectId.isValid(orderId)
      ? await collection.findOne({ shopId: shop._id, _id: new ObjectId(orderId) })
      : null);

  if (!order) throw new Error("SHOP_NOT_FOUND");

  await collection.updateOne({ _id: order._id }, { $set: { status: "Completed" } });
  const updated = await collection.findOne({ _id: order._id });
  if (!updated) throw new Error("SHOP_NOT_FOUND");
  return toApiOrder(updated);
}
