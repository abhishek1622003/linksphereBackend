import { users, posts, likes, } from "./schema";
import { db } from "./db";
import { eq, desc, and, count } from "drizzle-orm";
// Implementation
class Storage {
    async getUser(id) {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0];
    }
    async upsertUser(userData) {
        const existingUser = await this.getUser(userData.id);
        if (existingUser) {
            // Update existing user
            const result = await db
                .update(users)
                .set({
                email: userData.email,
                name: userData.name,
                profileImageUrl: userData.profileImageUrl,
                updatedAt: new Date()
            })
                .where(eq(users.id, userData.id))
                .returning();
            if (!result[0]) {
                throw new Error("Failed to update user");
            }
            return result[0];
        }
        else {
            // Insert new user
            const result = await db.insert(users).values({
                id: userData.id,
                email: userData.email,
                name: userData.name,
                profileImageUrl: userData.profileImageUrl
            }).returning();
            if (!result[0]) {
                throw new Error("Failed to create user");
            }
            return result[0];
        }
    }
    async updateUserProfile(id, profile) {
        const result = await db
            .update(users)
            .set({
            ...profile,
            updatedAt: new Date()
        })
            .where(eq(users.id, id))
            .returning();
        if (!result[0]) {
            throw new Error("User not found");
        }
        return result[0];
    }
    async createPost(userId, post) {
        const result = await db.insert(posts).values({
            content: post.content,
            authorId: userId
        }).returning();
        if (!result[0]) {
            throw new Error("Failed to create post");
        }
        return result[0];
    }
    async getPosts() {
        const result = await db
            .select({
            post: posts,
            author: users,
            likeCount: count(likes.id)
        })
            .from(posts)
            .leftJoin(users, eq(posts.authorId, users.id))
            .leftJoin(likes, eq(posts.id, likes.postId))
            .groupBy(posts.id, users.id)
            .orderBy(desc(posts.createdAt));
        return result.map(row => ({
            ...row.post,
            author: row.author,
            _count: {
                likes: Number(row.likeCount),
                comments: 0 // TODO: Implement comments count
            }
        }));
    }
    async getUserPosts(userId) {
        const result = await db
            .select({
            post: posts,
            author: users,
            likeCount: count(likes.id)
        })
            .from(posts)
            .leftJoin(users, eq(posts.authorId, users.id))
            .leftJoin(likes, eq(posts.id, likes.postId))
            .where(eq(posts.authorId, userId))
            .groupBy(posts.id, users.id)
            .orderBy(desc(posts.createdAt));
        return result.map(row => ({
            ...row.post,
            author: row.author,
            _count: {
                likes: Number(row.likeCount),
                comments: 0 // TODO: Implement comments count
            }
        }));
    }
    async getPostById(id) {
        const result = await db
            .select({
            post: posts,
            author: users,
            likeCount: count(likes.id)
        })
            .from(posts)
            .leftJoin(users, eq(posts.authorId, users.id))
            .leftJoin(likes, eq(posts.id, likes.postId))
            .where(eq(posts.id, id))
            .groupBy(posts.id, users.id)
            .limit(1);
        if (!result[0])
            return undefined;
        const row = result[0];
        return {
            ...row.post,
            author: row.author,
            _count: {
                likes: Number(row.likeCount),
                comments: 0 // TODO: Implement comments count
            }
        };
    }
    async likePost(userId, postId) {
        // Check if already liked
        const existingLike = await db
            .select()
            .from(likes)
            .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
            .limit(1);
        if (existingLike.length === 0) {
            await db.insert(likes).values({
                userId,
                postId
            });
        }
    }
    async unlikePost(userId, postId) {
        await db
            .delete(likes)
            .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    }
    async isPostLiked(userId, postId) {
        const result = await db
            .select()
            .from(likes)
            .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
            .limit(1);
        return result.length > 0;
    }
}
export const storage = new Storage();
