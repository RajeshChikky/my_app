import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  bio: text("bio"),
  profilePicture: text("profile_picture"),
  email: text("email"),
  isVerified: boolean("is_verified").default(false),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  caption: text("caption"),
  imageUrl: text("image_url").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
  likes: integer("likes").default(0),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isRead: boolean("is_read").default(false),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followingId: integer("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reels = pgTable("reels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  videoUrl: text("video_url").notNull(),
  thumbnail: text("thumbnail"),
  caption: text("caption"),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  filter: text("filter"),
  audioTrack: text("audio_track"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  profilePicture: true,
  bio: true,
  isVerified: true,
}).extend({
  username: z.string().min(3).max(30),
  password: z.string().min(6)
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  caption: true,
  imageUrl: true,
  location: true,
});

export const insertStorySchema = createInsertSchema(stories).pick({
  userId: true,
  imageUrl: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  userId: true,
  content: true,
});

export const insertFollowerSchema = createInsertSchema(followers).pick({
  followerId: true,
  followingId: true,
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  userId: true,
  postId: true,
});

export const insertReelSchema = createInsertSchema(reels).pick({
  userId: true,
  videoUrl: true,
  thumbnail: true,
  caption: true,
  filter: true,
  audioTrack: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertFollower = z.infer<typeof insertFollowerSchema>;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type InsertReel = z.infer<typeof insertReelSchema>;

export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Follower = typeof followers.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Reel = typeof reels.$inferSelect;
