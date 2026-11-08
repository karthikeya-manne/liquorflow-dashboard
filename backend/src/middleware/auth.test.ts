import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "./auth.js";

const verifyIdToken = vi.fn();

vi.mock("../config/firebase.js", () => ({
  getFirebaseAuth: () => ({
    verifyIdToken,
  }),
}));

function mockRes(): Response {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response;
}

describe("requireAuth", () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
  });

  it("rejects missing Authorization header", async () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches verified uid from Firebase token", async () => {
    verifyIdToken.mockResolvedValue({
      uid: "firebase-uid-123",
      email: "owner@example.com",
    });

    const req = {
      headers: { authorization: "Bearer valid-token" },
    } as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.uid).toBe("firebase-uid-123");
    expect(req.firebaseUid).toBe("firebase-uid-123");
    expect(req.userEmail).toBe("owner@example.com");
  });
});
