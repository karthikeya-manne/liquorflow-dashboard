import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { getAuthorizedShop } from "../services/shopAccess.js";
import {
  createShop,
  getShopForUser,
  listShopsForUser,
  updateShop,
} from "../services/shops.js";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "../services/products.js";
import { createMorningStockSales, createSalesFromItems, getDashboardSummary, listSales } from "../services/sales.js";
import { deleteInvoice, importInvoice, listInvoices } from "../services/invoices.js";
import { completeOrder, createOrder, listOrders } from "../services/orders.js";
import { syncShopCatalog } from "../services/syncCatalog.js";
import { adjustProductQuantity } from "../services/products.js";
import { routeParam } from "../utils/routeParam.js";

export const shopsRouter = Router();

shopsRouter.use(requireAuth);

shopsRouter.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shops = await listShopsForUser(req.uid!);
    res.json({ shops });
  } catch (err) {
    next(err);
  }
});

shopsRouter.get("/me", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shops = await listShopsForUser(req.firebaseUid ?? req.uid!);
    res.json({ shops });
  } catch (err) {
    next(err);
  }
});

shopsRouter.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = z
      .object({
        shopName: z.string().min(1),
        shopCategory: z.string().min(1),
      })
      .parse(req.body);

    const shop = await createShop({
      ownerUid: req.uid!,
      ownerEmail: req.userEmail ?? "",
      shopName: body.shopName,
      shopCategory: body.shopCategory,
    });
    res.status(201).json(shop);
  } catch (err) {
    next(err);
  }
});

shopsRouter.get("/:shopId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    res.json(await getShopForUser(shop));
  } catch (err) {
    next(err);
  }
});

shopsRouter.patch("/:shopId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    const body = z
      .object({
        shopName: z.string().min(1).optional(),
        ownerEmail: z.string().email().optional(),
      })
      .parse(req.body);
    res.json(await updateShop(shop, body));
  } catch (err) {
    next(err);
  }
});

shopsRouter.post("/:shopId/products/sync", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    await syncShopCatalog(shop);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

shopsRouter.get("/:shopId/products", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    res.json({ products: await listProducts(shop) });
  } catch (err) {
    next(err);
  }
});

shopsRouter.post("/:shopId/products", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    const body = z
      .object({
        name: z.string().min(1),
        category: z.string().min(1),
        price: z.coerce.number(),
        quantity: z.coerce.number().optional(),
      })
      .parse(req.body);
    const product = await createProduct(shop, body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

shopsRouter.patch("/:shopId/products/:productId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    const body = z
      .object({
        name: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        price: z.coerce.number().optional(),
        quantity: z.coerce.number().optional(),
      })
      .parse(req.body);
    res.json(await updateProduct(shop, routeParam(req.params.productId), body));
  } catch (err) {
    next(err);
  }
});

shopsRouter.delete("/:shopId/products/:productId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    await deleteProduct(shop, routeParam(req.params.productId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

shopsRouter.get("/:shopId/sales", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    res.json({ sales: await listSales(shop) });
  } catch (err) {
    next(err);
  }
});

shopsRouter.post("/:shopId/sales", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    const body = z
      .object({
        items: z
          .array(
            z.object({
              productId: z.string().min(1),
              quantity: z.coerce.number().int().positive(),
            }),
          )
          .min(1),
        paymentMethod: z.string().optional(),
        soldAt: z.string().datetime().optional(),
        includeProfit: z.boolean().optional(),
      })
      .parse(req.body);

    const sales = await createSalesFromItems(shop, {
      items: body.items,
      paymentMethod: body.paymentMethod,
      soldAt: body.soldAt ? new Date(body.soldAt) : undefined,
      includeProfit: body.includeProfit,
    });
    res.status(201).json({ sales });
  } catch (err) {
    next(err);
  }
});

shopsRouter.post("/:shopId/morning-stocks", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    const body = z
      .object({
        lines: z
          .array(
            z.object({
              productId: z.string().min(1),
              closingQuantity: z.coerce.number().min(0),
              soldQuantity: z.coerce.number().min(0),
            }),
          )
          .min(1),
      })
      .parse(req.body);

    await createMorningStockSales(shop, body.lines);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

shopsRouter.get("/:shopId/dashboard/summary", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    res.json(await getDashboardSummary(shop));
  } catch (err) {
    next(err);
  }
});

shopsRouter.get("/:shopId/invoices", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    res.json({ invoices: await listInvoices(shop) });
  } catch (err) {
    next(err);
  }
});

shopsRouter.post("/:shopId/invoices", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    const body = z
      .object({
        invoiceNumber: z.string().min(1),
        items: z
          .array(
            z.object({
              invoiceName: z.string().optional(),
              inventoryName: z.string().min(1),
              qty: z.coerce.number(),
              bottles: z.coerce.number().optional(),
              packQty: z.coerce.number(),
              sizeMl: z.coerce.number().optional(),
            }),
          )
          .min(1),
      })
      .parse(req.body);

    const result = await importInvoice(shop, body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

shopsRouter.delete("/:shopId/invoices/:invoiceId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    const result = await deleteInvoice(shop, routeParam(req.params.invoiceId));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

shopsRouter.get("/:shopId/orders", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    res.json({ orders: await listOrders(shop) });
  } catch (err) {
    next(err);
  }
});

shopsRouter.post("/:shopId/orders", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    const body = z
      .object({
        customerName: z.string().min(1),
        productName: z.string().min(1),
      })
      .parse(req.body);
    res.status(201).json(await createOrder(shop, body));
  } catch (err) {
    next(err);
  }
});

shopsRouter.patch("/:shopId/orders/:orderId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    const body = z.object({ status: z.literal("Completed") }).parse(req.body);
    if (body.status === "Completed") {
      res.json(await completeOrder(shop, routeParam(req.params.orderId)));
      return;
    }
    res.status(400).json({ error: "Unsupported status" });
  } catch (err) {
    next(err);
  }
});

shopsRouter.post("/:shopId/inventory/refill", async (req: AuthenticatedRequest, res, next) => {
  try {
    const shop = await getAuthorizedShop(routeParam(req.params.shopId), req.uid!);
    const body = z
      .object({
        items: z
          .array(
            z.object({
              productId: z.string().min(1),
              refillQty: z.coerce.number().positive(),
            }),
          )
          .min(1),
      })
      .parse(req.body);

    for (const item of body.items) {
      await adjustProductQuantity(shop, item.productId, item.refillQty);
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
