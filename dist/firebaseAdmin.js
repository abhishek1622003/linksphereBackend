import admin from "firebase-admin";
const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountStr) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT env variable");
}
let serviceAccount;
try {
    serviceAccount = JSON.parse(serviceAccountStr);
}
catch (error) {
    throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT: " + error.message);
}
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://linkedinclone-90fc1-default-rtdb.firebaseio.com",
    });
}
export default admin;
