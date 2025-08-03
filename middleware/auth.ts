import admin from "../firebaseAdmin";
import { Request, Response, NextFunction } from "express";

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  console.log("🔐 Auth middleware - verifying token");
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) {
    console.log("❌ No token provided in authorization header");
    res.status(401).json({ message: "No token provided" });
    return;
  }

  if (!admin) {
    console.log("❌ Firebase Admin not initialized");
    res.status(500).json({ message: "Firebase Admin not initialized" });
    return;
  }

  try {
    console.log("🔍 Verifying Firebase token...");
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("✅ Token verified successfully for user:", decodedToken.uid);
    (req as any).user = decodedToken;
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err);
    res.status(401).json({ message: "Invalid token" });
  }
}