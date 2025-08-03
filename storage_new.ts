import {
  users,
  posts,
  likes,
  type User,
  type NewUser,
  type Post,
  type NewPost,
} from "./schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

// Type definitions for API operations
export interface UpsertUser {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
}

export interface UpdateUserProfile {
  name?: string;
  bio?: string;
  profileImageUrl?: string;
}

export interface InsertPost {
  content: string;
}

export interface PostWithUser extends Post {
  author: User | null;
  _count: {
    likes: number;
    comments: number;
  };
}

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, profile: UpdateUserProfile): Promise<User>;
  
  // Post operations
  createPost(userId: string, post: InsertPost): Promise<Post>;
  getPosts(): Promise<PostWithUser[]>;
  getUserPosts(userId: string): Promise<PostWithUser[]>;
  getPostById(id: number): Promise<PostWithUser | undefined>;
  
  // Like operations
  likePost(userId: string, postId: number): Promise<void>;
  unlikePost(userId: string, postId: number): Promise<void>;
  isPostLiked(userId: string, postId: number): Promise<boolean>;
}

// Implementation
class Storage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
      return result[0];
    } else {
      // Insert new user
      const result = await db.insert(users).values({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        profileImageUrl: userData.profileImageUrl
      }).returning();
      return result[0];
    }
  }

  async updateUserProfile(id: string, profile: UpdateUserProfile): Promise<User> {
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

  async createPost(userId: string, post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values({
      content: post.content,
      authorId: userId
    }).returning();
    
    return result[0];
  }

  async getPosts(): Promise<PostWithUser[]> {
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

  async getUserPosts(userId: string): Promise<PostWithUser[]> {
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

  async getPostById(id: number): Promise<PostWithUser | undefined> {
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

    if (!result[0]) return undefined;

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

  async likePost(userId: string, postId: number): Promise<void> {
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

  async unlikePost(userId: string, postId: number): Promise<void> {
    await db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
  }

  async isPostLiked(userId: string, postId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
      .limit(1);

    return result.length > 0;
  }
}

export const storage = new Storage();
