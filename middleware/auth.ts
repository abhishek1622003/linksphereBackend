import admin from "../firebaseAdmin";
import { Request, Response, NextFunction } from "express";

export async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const idToken = req.headers.authorization?.split("Bearer ")[1];
  if (!idToken) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}