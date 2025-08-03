import { z } from "zod";
export declare const sessions: any;
export declare const users: any;
export declare const posts: any;
export declare const likes: any;
export declare const comments: any;
export declare const follows: any;
export declare const usersRelations: any;
export declare const postsRelations: any;
export declare const likesRelations: any;
export declare const commentsRelations: any;
export declare const followsRelations: any;
export declare const insertUserSchema: import("drizzle-zod").BuildSchema<"insert", any, undefined>;
export declare const insertPostSchema: import("drizzle-zod").BuildSchema<"insert", any, undefined>;
export declare const insertCommentSchema: import("drizzle-zod").BuildSchema<"insert", any, undefined>;
export declare const insertLikeSchema: import("drizzle-zod").BuildSchema<"insert", any, undefined>;
export declare const insertFollowSchema: import("drizzle-zod").BuildSchema<"insert", any, undefined>;
export declare const updateUserProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    profileImageUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    bio?: string | undefined;
    profileImageUrl?: string | undefined;
}, {
    name?: string | undefined;
    bio?: string | undefined;
    profileImageUrl?: string | undefined;
}>;
export declare const createPostSchema: z.ZodObject<{
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
}, {
    content: string;
}>;
export declare const createCommentSchema: z.ZodObject<{
    content: z.ZodString;
    postId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    content: string;
    postId: number;
}, {
    content: string;
    postId: number;
}>;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;
export type Follow = typeof follows.$inferSelect;
export type NewFollow = typeof follows.$inferInsert;
