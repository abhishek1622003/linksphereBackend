

import admin from "firebase-admin";

const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;

let firebaseAdmin: typeof admin | null = null;

if (!serviceAccountStr) {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT not set. Auth middleware will not work.");
  firebaseAdmin = null;
} else {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountStr);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized");
    }
    firebaseAdmin = admin;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", (error as Error).message);
    firebaseAdmin = null;
  }
}

export { firebaseAdmin };
export default firebaseAdmin;






