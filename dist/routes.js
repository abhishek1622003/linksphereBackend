"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const storage_1 = require("./storage");
const auth_1 = require("./middleware/auth");
const schema_1 = require("./schema");
const zod_validation_error_1 = require("zod-validation-error");
function registerRoutes(app) {
    // Firebase Auth middleware (no setup needed)
    // Auth routes
    app.get('/api/auth/user', auth_1.verifyFirebaseToken, async (req, res) => {
        try {
            const userId = req.user.uid;
            let user = await storage_1.storage.getUser(userId);
            if (!user) {
                // Upsert user in database if not found
                user = await storage_1.storage.upsertUser({
                    id: userId,
                    email: req.user.email,
                    name: req.user.name || req.user.displayName || "",
                    profileImageUrl: req.user.picture || ""
                });
            }
            res.json(user);
        }
        catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ message: "Failed to fetch user" });
        }
    });
    // User profile routes
    app.put('/api/profile', auth_1.verifyFirebaseToken, async (req, res) => {
        try {
            const userId = req.user.uid;
            const validation = schema_1.updateUserProfileSchema.safeParse(req.body);
            if (!validation.success) {
                const validationError = (0, zod_validation_error_1.fromError)(validation.error);
                res.status(400).json({
                    message: "Validation failed",
                    details: validationError.toString()
                });
                return;
            }
            const updatedUser = await storage_1.storage.updateUserProfile(userId, validation.data);
            res.json(updatedUser);
        }
        catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ message: "Failed to update profile" });
        }
    });
    app.get('/api/users/:id', async (req, res) => {
        try {
            const user = await storage_1.storage.getUser(req.params.id);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            res.json(user);
        }
        catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ message: "Failed to fetch user" });
        }
    });
    // Post routes
    app.post('/api/posts', auth_1.verifyFirebaseToken, async (req, res) => {
        try {
            const userId = req.user.uid;
            const validation = schema_1.createPostSchema.safeParse(req.body);
            if (!validation.success) {
                const validationError = (0, zod_validation_error_1.fromError)(validation.error);
                return res.status(400).json({
                    message: "Validation failed",
                    details: validationError.toString()
                });
            }
            const post = await storage_1.storage.createPost(userId, validation.data);
            return res.status(201).json(post);
        }
        catch (error) {
            console.error("Error creating post:", error);
            return res.status(500).json({ message: "Failed to create post" });
        }
    });
    app.get('/api/posts', async (req, res) => {
        try {
            const posts = await storage_1.storage.getPosts();
            res.json(posts);
        }
        catch (error) {
            console.error("Error fetching posts:", error);
            res.status(500).json({ message: "Failed to fetch posts" });
        }
    });
    app.get('/api/posts/user/:userId', async (req, res) => {
        try {
            const posts = await storage_1.storage.getUserPosts(req.params.userId);
            res.json(posts);
        }
        catch (error) {
            console.error("Error fetching user posts:", error);
            res.status(500).json({ message: "Failed to fetch user posts" });
        }
    });
    // Like routes
    app.post('/api/posts/:id/like', auth_1.verifyFirebaseToken, async (req, res) => {
        try {
            const userId = req.user.uid;
            const postId = parseInt(req.params.id);
            if (isNaN(postId)) {
                return res.status(400).json({ message: "Invalid post ID" });
            }
            const isLiked = await storage_1.storage.isPostLiked(userId, postId);
            if (isLiked) {
                await storage_1.storage.unlikePost(userId, postId);
                return res.json({ liked: false });
            }
            else {
                await storage_1.storage.likePost(userId, postId);
                return res.json({ liked: true });
            }
        }
        catch (error) {
            console.error("Error toggling like:", error);
            return res.status(500).json({ message: "Failed to toggle like" });
        }
    });
}
