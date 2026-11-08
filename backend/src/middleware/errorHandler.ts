import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }

  if (err instanceof Error) {
    if (err.message === "SHOP_NOT_FOUND") {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    if (err.message === "FORBIDDEN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (err.message === "INSUFFICIENT_STOCK") {
      res.status(409).json({ error: "Insufficient stock" });
      return;
    }
    if (err.message === "INVOICE_ALREADY_PROCESSED") {
      res.status(409).json({ error: "Invoice already processed" });
      return;
    }
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
