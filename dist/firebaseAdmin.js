"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAdmin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let firebaseAdmin = null;
exports.firebaseAdmin = firebaseAdmin;
// Get Firebase configuration from individual environment variables
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️ Firebase Admin environment variables not set. Auth middleware will not work.");
    console.warn("Required: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY");
    exports.firebaseAdmin = firebaseAdmin = null;
}
else {
    try {
        if (!firebase_admin_1.default.apps.length) {
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
                }),
            });
            console.log("✅ Firebase Admin initialized");
        }
        exports.firebaseAdmin = firebaseAdmin = firebase_admin_1.default;
    }
    catch (error) {
        console.error("❌ Failed to initialize Firebase:", error.message);
        exports.firebaseAdmin = firebaseAdmin = null;
    }
}
exports.default = firebaseAdmin;
