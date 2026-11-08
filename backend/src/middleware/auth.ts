import type { Request, Response, NextFunction } from "express";
import { getFirebaseAuth } from "../config/firebase.js";

export type AuthenticatedRequest = Request & {
  /** Verified Firebase Auth UID from ID token */
  uid?: string;
  firebaseUid?: string;
  userEmail?: string;
};

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  try {
    const decoded = await getFirebaseAuth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.firebaseUid = decoded.uid;
    req.userEmail = decoded.email ?? undefined;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
