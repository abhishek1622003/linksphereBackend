import admin from "../firebaseAdmin";
export async function verifyFirebaseToken(req, res, next) {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
        res.status(401).json({ message: "No token provided" });
        return;
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    }
    catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
}
