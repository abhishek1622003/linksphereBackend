"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommentSchema = exports.createPostSchema = exports.updateUserProfileSchema = exports.insertFollowSchema = exports.insertLikeSchema = exports.insertCommentSchema = exports.insertPostSchema = exports.insertUserSchema = exports.followsRelations = exports.commentsRelations = exports.likesRelations = exports.postsRelations = exports.usersRelations = exports.follows = exports.comments = exports.likes = exports.posts = exports.users = exports.sessions = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_2 = require("drizzle-orm");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    sid: (0, pg_core_1.varchar)("sid").primaryKey(),
    sess: (0, pg_core_1.jsonb)("sess").notNull(),
    expire: (0, pg_core_1.timestamp)("expire").notNull(),
}, (table) => [(0, pg_core_1.index)("IDX_session_expire").on(table.expire)]);
// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.varchar)("id").primaryKey().default((0, drizzle_orm_1.sql) `gen_random_uuid()`),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull().unique(),
    firstName: (0, pg_core_1.varchar)("first_name", { length: 255 }).notNull(),
    lastName: (0, pg_core_1.varchar)("last_name", { length: 255 }).notNull(),
    profileImageUrl: (0, pg_core_1.varchar)("profile_image_url"),
    bio: (0, pg_core_1.text)("bio"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.posts = (0, pg_core_1.pgTable)("posts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    content: (0, pg_core_1.text)("content").notNull(),
    userId: (0, pg_core_1.varchar)("user_id").notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.likes = (0, pg_core_1.pgTable)("likes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    postId: (0, pg_core_1.serial)("post_id").notNull().references(() => exports.posts.id, { onDelete: "cascade" }),
    userId: (0, pg_core_1.varchar)("user_id").notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.comments = (0, pg_core_1.pgTable)("comments", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    content: (0, pg_core_1.text)("content").notNull(),
    postId: (0, pg_core_1.serial)("post_id").notNull().references(() => exports.posts.id, { onDelete: "cascade" }),
    authorId: (0, pg_core_1.varchar)("author_id").notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.follows = (0, pg_core_1.pgTable)("follows", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    followerId: (0, pg_core_1.varchar)("follower_id").notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    followingId: (0, pg_core_1.varchar)("following_id").notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Relations
exports.usersRelations = (0, drizzle_orm_2.relations)(exports.users, ({ many }) => ({
    posts: many(exports.posts),
    likes: many(exports.likes),
    comments: many(exports.comments),
    followers: many(exports.follows, { relationName: "following" }),
    following: many(exports.follows, { relationName: "follower" }),
}));
exports.postsRelations = (0, drizzle_orm_2.relations)(exports.posts, ({ one, many }) => ({
    author: one(exports.users, {
        fields: [exports.posts.userId],
        references: [exports.users.id],
    }),
    likes: many(exports.likes),
    comments: many(exports.comments),
}));
exports.likesRelations = (0, drizzle_orm_2.relations)(exports.likes, ({ one }) => ({
    post: one(exports.posts, {
        fields: [exports.likes.postId],
        references: [exports.posts.id],
    }),
    user: one(exports.users, {
        fields: [exports.likes.userId],
        references: [exports.users.id],
    }),
}));
exports.commentsRelations = (0, drizzle_orm_2.relations)(exports.comments, ({ one }) => ({
    post: one(exports.posts, {
        fields: [exports.comments.postId],
        references: [exports.posts.id],
    }),
    author: one(exports.users, {
        fields: [exports.comments.authorId],
        references: [exports.users.id],
    }),
}));
exports.followsRelations = (0, drizzle_orm_2.relations)(exports.follows, ({ one }) => ({
    follower: one(exports.users, {
        fields: [exports.follows.followerId],
        references: [exports.users.id],
        relationName: "follower",
    }),
    following: one(exports.users, {
        fields: [exports.follows.followingId],
        references: [exports.users.id],
        relationName: "following",
    }),
}));
// Zod schemas for validation
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users);
exports.insertPostSchema = (0, drizzle_zod_1.createInsertSchema)(exports.posts);
exports.insertCommentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.comments);
exports.insertLikeSchema = (0, drizzle_zod_1.createInsertSchema)(exports.likes);
exports.insertFollowSchema = (0, drizzle_zod_1.createInsertSchema)(exports.follows);
exports.updateUserProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(255).optional(),
    lastName: zod_1.z.string().min(1).max(255).optional(),
    bio: zod_1.z.string().max(1000).optional(),
    profileImageUrl: zod_1.z.string().url().optional(),
});
exports.createPostSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(2000),
});
exports.createCommentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(1000),
    postId: zod_1.z.number().int().positive(),
});
