"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseToken = verifyFirebaseToken;
const firebaseAdmin_1 = __importDefault(require("../firebaseAdmin"));
async function verifyFirebaseToken(req, res, next) {
    console.log("🔐 Auth middleware - verifying token");
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
        console.log("❌ No token provided in authorization header");
        res.status(401).json({ message: "No token provided" });
        return;
    }
    if (!firebaseAdmin_1.default) {
        console.log("❌ Firebase Admin not initialized");
        res.status(500).json({ message: "Firebase Admin not initialized" });
        return;
    }
    try {
        console.log("🔍 Verifying Firebase token...");
        const decodedToken = await firebaseAdmin_1.default.auth().verifyIdToken(idToken);
        console.log("✅ Token verified successfully for user:", decodedToken.uid);
        req.user = decodedToken;
        next();
    }
    catch (err) {
        console.error("❌ Token verification failed:", err);
        res.status(401).json({ message: "Invalid token" });
    }
}
