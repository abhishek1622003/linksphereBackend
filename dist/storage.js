"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = void 0;
const schema_1 = require("./schema");
const db_1 = require("./db");
const drizzle_orm_1 = require("drizzle-orm");
// Implementation
class Storage {
    async getUser(id) {
        const result = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).limit(1);
        return result[0];
    }
    async upsertUser(userData) {
        const existingUser = await this.getUser(userData.id);
        if (existingUser) {
            // Update existing user
            const result = await db_1.db
                .update(schema_1.users)
                .set({
                email: userData.email,
                name: userData.name,
                profileImageUrl: userData.profileImageUrl,
                updatedAt: new Date()
            })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userData.id))
                .returning();
            if (!result[0]) {
                throw new Error("Failed to update user");
            }
            return result[0];
        }
        else {
            // Insert new user
            const result = await db_1.db.insert(schema_1.users).values({
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
        const result = await db_1.db
            .update(schema_1.users)
            .set({
            ...profile,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        if (!result[0]) {
            throw new Error("User not found");
        }
        return result[0];
    }
    async createPost(userId, post) {
        const result = await db_1.db.insert(schema_1.posts).values({
            content: post.content,
            authorId: userId
        }).returning();
        if (!result[0]) {
            throw new Error("Failed to create post");
        }
        return result[0];
    }
    async getPosts() {
        const result = await db_1.db
            .select({
            post: schema_1.posts,
            author: schema_1.users,
            likeCount: (0, drizzle_orm_1.count)(schema_1.likes.id)
        })
            .from(schema_1.posts)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.posts.authorId, schema_1.users.id))
            .leftJoin(schema_1.likes, (0, drizzle_orm_1.eq)(schema_1.posts.id, schema_1.likes.postId))
            .groupBy(schema_1.posts.id, schema_1.users.id)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.posts.createdAt));
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
        const result = await db_1.db
            .select({
            post: schema_1.posts,
            author: schema_1.users,
            likeCount: (0, drizzle_orm_1.count)(schema_1.likes.id)
        })
            .from(schema_1.posts)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.posts.authorId, schema_1.users.id))
            .leftJoin(schema_1.likes, (0, drizzle_orm_1.eq)(schema_1.posts.id, schema_1.likes.postId))
            .where((0, drizzle_orm_1.eq)(schema_1.posts.authorId, userId))
            .groupBy(schema_1.posts.id, schema_1.users.id)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.posts.createdAt));
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
        const result = await db_1.db
            .select({
            post: schema_1.posts,
            author: schema_1.users,
            likeCount: (0, drizzle_orm_1.count)(schema_1.likes.id)
        })
            .from(schema_1.posts)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.posts.authorId, schema_1.users.id))
            .leftJoin(schema_1.likes, (0, drizzle_orm_1.eq)(schema_1.posts.id, schema_1.likes.postId))
            .where((0, drizzle_orm_1.eq)(schema_1.posts.id, id))
            .groupBy(schema_1.posts.id, schema_1.users.id)
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
        const existingLike = await db_1.db
            .select()
            .from(schema_1.likes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.likes.userId, userId), (0, drizzle_orm_1.eq)(schema_1.likes.postId, postId)))
            .limit(1);
        if (existingLike.length === 0) {
            await db_1.db.insert(schema_1.likes).values({
                userId,
                postId
            });
        }
    }
    async unlikePost(userId, postId) {
        await db_1.db
            .delete(schema_1.likes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.likes.userId, userId), (0, drizzle_orm_1.eq)(schema_1.likes.postId, postId)));
    }
    async isPostLiked(userId, postId) {
        const result = await db_1.db
            .select()
            .from(schema_1.likes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.likes.userId, userId), (0, drizzle_orm_1.eq)(schema_1.likes.postId, postId)))
            .limit(1);
        return result.length > 0;
    }
}
exports.storage = new Storage();
