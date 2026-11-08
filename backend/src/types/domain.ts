import type { ObjectId } from "mongodb";

export type ShopDoc = {
  _id: ObjectId;
  legacyFirestoreId?: string;
  ownerUid: string;
  ownerEmail: string;
  shopName: string;
  shopCategory: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductDoc = {
  _id: ObjectId;
  shopId: ObjectId;
  legacyFirestoreId?: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SaleDoc = {
  _id: ObjectId;
  shopId: ObjectId;
  legacyFirestoreId?: string;
  productName: string;
  category: string;
  quantity: number;
  price: number;
  profit?: number;
  paymentMethod?: string;
  soldAt: Date;
};

export type InvoiceItem = {
  invoiceName?: string;
  inventoryName: string;
  qty: number;
  bottles?: number;
  packQty: number;
  sizeMl?: number;
};

export type InvoiceHistoryDoc = {
  _id: ObjectId;
  shopId: ObjectId;
  legacyFirestoreId?: string;
  invoiceNumber: string;
  uploadedAt: Date;
  totalProducts: number;
  totalCases: number;
  items: InvoiceItem[];
};

export type OrderDoc = {
  _id: ObjectId;
  shopId: ObjectId;
  legacyFirestoreId?: string;
  customerName: string;
  productName: string;
  status: string;
  createdAt: Date;
};

export type ApiProduct = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
};

export type ApiSale = {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  price: number;
  profit?: number;
  paymentMethod?: string;
  soldAt: string;
};
