import { describe, expect, it } from "vitest";
import { shopPublicId } from "./shopAccess.js";
import { ObjectId } from "mongodb";
import type { ShopDoc } from "../types/domain.js";

describe("shopPublicId", () => {
  it("prefers legacy Firestore id for API compatibility", () => {
    const shop: ShopDoc = {
      _id: new ObjectId(),
      legacyFirestoreId: "abc123firestore",
      ownerUid: "uid",
      ownerEmail: "a@b.com",
      shopName: "Test",
      shopCategory: "Wines",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(shopPublicId(shop)).toBe("abc123firestore");
  });
});
