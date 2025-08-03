

import admin from "firebase-admin";

let firebaseAdmin: typeof admin | null = null;

// Get Firebase configuration from individual environment variables
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.warn("⚠️ Firebase Admin environment variables not set. Auth middleware will not work.");
  console.warn("Required: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY");
  firebaseAdmin = null;
} else {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
        }),
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






