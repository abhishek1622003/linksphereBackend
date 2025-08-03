"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyFirebaseToken = verifyFirebaseToken;
const firebaseAdmin_1 = __importDefault(require("../firebaseAdmin"));
async function verifyFirebaseToken(req, res, next) {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
        res.status(401).json({ message: "No token provided" });
        return;
    }
    if (!firebaseAdmin_1.default) {
        res.status(500).json({ message: "Firebase Admin not initialized" });
        return;
    }
    try {
        const decodedToken = await firebaseAdmin_1.default.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    }
    catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
}
