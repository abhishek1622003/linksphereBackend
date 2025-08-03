import type { Express } from "express";
import { storage } from "./storage";
import { verifyFirebaseToken } from "./middleware/auth";
import { createPostSchema, updateUserProfileSchema } from "./schema";
import { fromError } from "zod-validation-error";

export function registerRoutes(app: Express): void {
  // Firebase Auth middleware (no setup needed)

  // Auth routes
  app.get('/api/auth/user', verifyFirebaseToken, async (req: any, res) => {
    try {
      console.log("🔍 /api/auth/user - Firebase user:", req.user);
      const userId = req.user.uid;
      console.log("🔍 Looking up user in database:", userId);
      
      let user = await storage.getUser(userId);
      console.log("🔍 Database query result:", user ? "User found" : "User not found");
      
      if (!user) {
        console.log("🔍 Creating new user with data:", {
          id: userId,
          email: req.user.email,
          name: req.user.name || req.user.displayName || "",
          profileImageUrl: req.user.picture || ""
        });
        // Upsert user in database if not found
        const fullName = req.user.name || req.user.displayName || "";
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "User";
        const lastName = nameParts.slice(1).join(" ") || "";
        
        user = await storage.upsertUser({
          id: userId,
          email: req.user.email,
          firstName: firstName,
          lastName: lastName,
          profileImageUrl: req.user.picture || ""
        });
        console.log("✅ User created successfully:", user);
      }
      res.json(user);
    } catch (error) {
      console.error("❌ Error in /api/auth/user:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ message: "Failed to fetch user", error: error.message });
    }
  });

  // User profile routes
  app.put('/api/profile', verifyFirebaseToken, async (req: any, res): Promise<void> => {
    try {
      const userId = req.user.uid;
      const validation = updateUserProfileSchema.safeParse(req.body);
      
      if (!validation.success) {
        const validationError = fromError(validation.error);
        res.status(400).json({ 
          message: "Validation failed", 
          details: validationError.toString() 
        });
        return;
      }

      const updatedUser = await storage.updateUserProfile(userId, validation.data);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/users/:id', async (req, res): Promise<void> => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Post routes
  app.post('/api/posts', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const validation = createPostSchema.safeParse(req.body);
      
      if (!validation.success) {
        const validationError = fromError(validation.error);
        return res.status(400).json({ 
          message: "Validation failed", 
          details: validationError.toString() 
        });
      }

      const post = await storage.createPost(userId, validation.data);
      return res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      return res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get('/api/posts', async (req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get('/api/posts/user/:userId', async (req, res) => {
    try {
      const posts = await storage.getUserPosts(req.params.userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  // Like routes
  app.post('/api/posts/:id/like', verifyFirebaseToken, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const isLiked = await storage.isPostLiked(userId, postId);
      
      if (isLiked) {
        await storage.unlikePost(userId, postId);
        return res.json({ liked: false });
      } else {
        await storage.likePost(userId, postId);
        return res.json({ liked: true });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      return res.status(500).json({ message: "Failed to toggle like" });
    }
  });
}
