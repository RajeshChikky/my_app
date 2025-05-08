import { 
  users, posts, stories, messages, comments, followers, likes,
  type User, type InsertUser, type Post, type InsertPost,
  type Story, type InsertStory, type Message, type InsertMessage,
  type Comment, type InsertComment, type Follower, type InsertFollower,
  type Like, type InsertLike
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, desc, or, gt, sql, inArray } from "drizzle-orm";
import { IStorage } from "./storage";

const PostgresSessionStore = connectPg(session);

// Fix for session type
declare module "express-session" {
  interface SessionStore {
    all: Function;
    destroy: Function;
    clear: Function;
    length: Function;
    get: Function;
    set: Function;
    touch: Function;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log(`Looking for user with ID: ${id}`);
      const allUsers = await db.select().from(users);
      console.log("All users:", allUsers);
      
      const [user] = await db.select().from(users).where(eq(users.id, id));
      console.log("Found user:", user);
      return user;
    } catch (error) {
      console.error("Error finding user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getAllPosts(): Promise<Post[]> {
    return db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined> {
    try {
      const [updatedPost] = await db
        .update(posts)
        .set(postData)
        .where(eq(posts.id, id))
        .returning();
      return updatedPost;
    } catch (error) {
      console.error(`Error updating post ${id}:`, error);
      return undefined;
    }
  }

  // Story operations
  async getStory(id: number): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story;
  }

  async getAllStories(): Promise<Story[]> {
    const now = new Date();
    try {
      // Simplified query to avoid type issues
      const results = await db
        .select()
        .from(stories)
        .orderBy(desc(stories.createdAt));
      
      // Filter expired stories in JavaScript
      return results.filter(story => {
        if (!story.expiresAt) return true;
        return new Date(story.expiresAt) > now;
      });
    } catch (error) {
      console.error("Error fetching stories:", error);
      return [];
    }
  }

  async getStoriesByUserId(userId: number): Promise<Story[]> {
    const now = new Date();
    try {
      // Simplified query
      const results = await db
        .select()
        .from(stories)
        .where(eq(stories.userId, userId))
        .orderBy(desc(stories.createdAt));
      
      // Filter expired stories in JavaScript
      return results.filter(story => {
        if (!story.expiresAt) return true;
        return new Date(story.expiresAt) > now;
      });
    } catch (error) {
      console.error("Error fetching user stories:", error);
      return [];
    }
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const [story] = await db
      .insert(stories)
      .values({
        ...insertStory,
        createdAt: now,
        expiresAt
      })
      .returning();
    return story;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.receiverId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.receiverId, userId1)
          )
        )
      )
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        ...insertMessage,
        isRead: false,
        createdAt: new Date()
      })
      .returning();
    return message;
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment;
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        ...insertComment,
        createdAt: new Date()
      })
      .returning();
    return comment;
  }

  // Follower operations
  async getFollower(followerId: number, followingId: number): Promise<Follower | undefined> {
    const [follower] = await db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, followerId),
          eq(followers.followingId, followingId)
        )
      );
    return follower;
  }

  async getFollowersByUserId(userId: number): Promise<User[]> {
    const followerRecords = await db
      .select()
      .from(followers)
      .where(eq(followers.followingId, userId));

    if (!followerRecords.length) return [];

    const followerIds = followerRecords.map(f => f.followerId);
    
    return db
      .select()
      .from(users)
      .where(
        inArray(users.id, followerIds)
      );
  }

  async getFollowingByUserId(userId: number): Promise<User[]> {
    const followingRecords = await db
      .select()
      .from(followers)
      .where(eq(followers.followerId, userId));

    if (!followingRecords.length) return [];

    const followingIds = followingRecords.map(f => f.followingId);
    
    return db
      .select()
      .from(users)
      .where(
        inArray(users.id, followingIds)
      );
  }

  async createFollower(insertFollower: InsertFollower): Promise<Follower> {
    const [follower] = await db
      .insert(followers)
      .values({
        ...insertFollower,
        createdAt: new Date()
      })
      .returning();
    return follower;
  }

  async deleteFollower(id: number): Promise<void> {
    await db.delete(followers).where(eq(followers.id, id));
  }

  // Like operations
  async getLike(userId: number, postId: number): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.postId, postId)
        )
      );
    return like;
  }

  async getLikesByPostId(postId: number): Promise<Like[]> {
    return db
      .select()
      .from(likes)
      .where(eq(likes.postId, postId));
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const [like] = await db
      .insert(likes)
      .values({
        ...insertLike,
        createdAt: new Date()
      })
      .returning();
    
    // Update post like count
    const post = await this.getPost(insertLike.postId);
    if (post) {
      await db
        .update(posts)
        .set({ likes: (post.likes || 0) + 1 })
        .where(eq(posts.id, post.id));
    }
    
    return like;
  }

  async deleteLike(id: number): Promise<void> {
    const [like] = await db
      .select()
      .from(likes)
      .where(eq(likes.id, id));
      
    if (like) {
      const post = await this.getPost(like.postId);
      if (post && post.likes && post.likes > 0) {
        await db
          .update(posts)
          .set({ likes: post.likes - 1 })
          .where(eq(posts.id, post.id));
      }
    }
    
    await db.delete(likes).where(eq(likes.id, id));
  }
}