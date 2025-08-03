import { type User, type Post, updateUserProfileSchema, createPostSchema } from "./schema";
import type { z } from "zod";
export interface UpsertUser {
    id: string;
    email: string;
    name: string;
    profileImageUrl?: string;
}
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type CreatePost = z.infer<typeof createPostSchema>;
export interface PostWithUser extends Post {
    author: User | null;
    _count: {
        likes: number;
        comments: number;
    };
}
export interface IStorage {
    getUser(id: string): Promise<User | undefined>;
    upsertUser(user: UpsertUser): Promise<User>;
    updateUserProfile(id: string, profile: UpdateUserProfile): Promise<User>;
    createPost(userId: string, post: CreatePost): Promise<Post>;
    getPosts(): Promise<PostWithUser[]>;
    getUserPosts(userId: string): Promise<PostWithUser[]>;
    getPostById(id: number): Promise<PostWithUser | undefined>;
    likePost(userId: string, postId: number): Promise<void>;
    unlikePost(userId: string, postId: number): Promise<void>;
    isPostLiked(userId: string, postId: number): Promise<boolean>;
}
declare class Storage implements IStorage {
    getUser(id: string): Promise<User | undefined>;
    upsertUser(userData: UpsertUser): Promise<User>;
    updateUserProfile(id: string, profile: UpdateUserProfile): Promise<User>;
    createPost(userId: string, post: CreatePost): Promise<Post>;
    getPosts(): Promise<PostWithUser[]>;
    getUserPosts(userId: string): Promise<PostWithUser[]>;
    getPostById(id: number): Promise<PostWithUser | undefined>;
    likePost(userId: string, postId: number): Promise<void>;
    unlikePost(userId: string, postId: number): Promise<void>;
    isPostLiked(userId: string, postId: number): Promise<boolean>;
}
export declare const storage: Storage;
export {};
