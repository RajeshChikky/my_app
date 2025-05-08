import { 
  users, posts, stories, messages, comments, followers, likes,
  type User, type InsertUser, type Post, type InsertPost,
  type Story, type InsertStory, type Message, type InsertMessage,
  type Comment, type InsertComment, type Follower, type InsertFollower,
  type Like, type InsertLike
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;

  // Post operations
  getPost(id: number): Promise<Post | undefined>;
  getAllPosts(): Promise<Post[]>;
  getPostsByUserId(userId: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined>;

  // Story operations
  getStory(id: number): Promise<Story | undefined>;
  getAllStories(): Promise<Story[]>;
  getStoriesByUserId(userId: number): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;

  // Follower operations
  getFollower(followerId: number, followingId: number): Promise<Follower | undefined>;
  getFollowersByUserId(userId: number): Promise<User[]>;
  getFollowingByUserId(userId: number): Promise<User[]>;
  createFollower(follower: InsertFollower): Promise<Follower>;
  deleteFollower(id: number): Promise<void>;

  // Like operations
  getLike(userId: number, postId: number): Promise<Like | undefined>;
  getLikesByPostId(postId: number): Promise<Like[]>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(id: number): Promise<void>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private stories: Map<number, Story>;
  private messages: Map<number, Message>;
  private comments: Map<number, Comment>;
  private followerRelations: Map<number, Follower>;
  private likes: Map<number, Like>;
  
  sessionStore: session.SessionStore;
  currentId: {
    users: number;
    posts: number;
    stories: number;
    messages: number;
    comments: number;
    followers: number;
    likes: number;
  };

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.stories = new Map();
    this.messages = new Map();
    this.comments = new Map();
    this.followerRelations = new Map();
    this.likes = new Map();
    
    this.currentId = {
      users: 1,
      posts: 1,
      stories: 1,
      messages: 1,
      comments: 1,
      followers: 1,
      likes: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Add sample data
    this.addSampleData();
  }

  private addSampleData() {
    // Sample users with default passwords (hashed in real implementation)
    const sampleUsers: InsertUser[] = [
      {
        username: "jessica_smith",
        password: "password",
        fullName: "Jessica Smith",
        bio: "Travel enthusiast | Coffee lover",
        email: "jessica@example.com",
        profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        isVerified: true
      },
      {
        username: "travel_mike",
        password: "password",
        fullName: "Mike Johnson",
        bio: "Exploring the world one photo at a time",
        email: "mike@example.com",
        profilePicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
        isVerified: true
      },
      {
        username: "fitness_rachel",
        password: "password",
        fullName: "Rachel Williams",
        bio: "Fitness coach | Healthy lifestyle advocate",
        email: "rachel@example.com",
        profilePicture: "https://images.unsplash.com/photo-1519699047748-de8e457a634e",
        isVerified: true
      },
      {
        username: "lil_lapislazuli",
        password: "password",
        fullName: "Alex Chen",
        bio: "Artist | Photographer",
        email: "alex@example.com",
        profilePicture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
        isVerified: true
      },
      {
        username: "lofti232",
        password: "password",
        fullName: "Jeongja Seo",
        bio: "Digital Creator\nBIG BOSS 👑\n✉ lofti232@nymail.com",
        email: "jeongja@example.com",
        profilePicture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
        isVerified: true
      }
    ];

    // Create sample users
    sampleUsers.forEach(user => {
      this.createUser(user);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Post operations
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => {
      const dateA = new Date(a.createdAt || Date.now()).getTime();
      const dateB = new Date(b.createdAt || Date.now()).getTime();
      return dateB - dateA; // Sort by latest first
    });
  }

  async getPostsByUserId(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || Date.now()).getTime();
        const dateB = new Date(b.createdAt || Date.now()).getTime();
        return dateB - dateA;
      });
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.currentId.posts++;
    const post: Post = { 
      ...insertPost, 
      id, 
      likes: 0,
      createdAt: new Date()
    };
    this.posts.set(id, post);
    return post;
  }
  
  async updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const updatedPost = { ...post, ...postData };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  // Story operations
  async getStory(id: number): Promise<Story | undefined> {
    return this.stories.get(id);
  }

  async getAllStories(): Promise<Story[]> {
    // Filter out expired stories (24 hours)
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => {
        if (!story.expiresAt) return true;
        return new Date(story.expiresAt) > now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || Date.now()).getTime();
        const dateB = new Date(b.createdAt || Date.now()).getTime();
        return dateB - dateA;
      });
  }

  async getStoriesByUserId(userId: number): Promise<Story[]> {
    const now = new Date();
    return Array.from(this.stories.values())
      .filter(story => {
        if (story.userId !== userId) return false;
        if (!story.expiresAt) return true;
        return new Date(story.expiresAt) > now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || Date.now()).getTime();
        const dateB = new Date(b.createdAt || Date.now()).getTime();
        return dateB - dateA;
      });
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.currentId.stories++;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const story: Story = {
      ...insertStory,
      id,
      createdAt: now,
      expiresAt
    };
    this.stories.set(id, story);
    return story;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesBetweenUsers(userId1: number, userId2: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => {
        return (
          (message.senderId === userId1 && message.receiverId === userId2) ||
          (message.senderId === userId2 && message.receiverId === userId1)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || Date.now()).getTime();
        const dateB = new Date(b.createdAt || Date.now()).getTime();
        return dateA - dateB; // Sort chronologically
      });
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentId.messages++;
    const message: Message = {
      ...insertMessage,
      id,
      isRead: false,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || Date.now()).getTime();
        const dateB = new Date(b.createdAt || Date.now()).getTime();
        return dateA - dateB;
      });
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentId.comments++;
    const comment: Comment = {
      ...insertComment,
      id,
      createdAt: new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }

  // Follower operations
  async getFollower(followerId: number, followingId: number): Promise<Follower | undefined> {
    return Array.from(this.followerRelations.values()).find(
      f => f.followerId === followerId && f.followingId === followingId
    );
  }

  async getFollowersByUserId(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.followerRelations.values())
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);
      
    return Array.from(this.users.values())
      .filter(user => followerIds.includes(user.id));
  }

  async getFollowingByUserId(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.followerRelations.values())
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
      
    return Array.from(this.users.values())
      .filter(user => followingIds.includes(user.id));
  }

  async createFollower(insertFollower: InsertFollower): Promise<Follower> {
    const id = this.currentId.followers++;
    const follower: Follower = {
      ...insertFollower,
      id,
      createdAt: new Date()
    };
    this.followerRelations.set(id, follower);
    return follower;
  }

  async deleteFollower(id: number): Promise<void> {
    this.followerRelations.delete(id);
  }

  // Like operations
  async getLike(userId: number, postId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      like => like.userId === userId && like.postId === postId
    );
  }

  async getLikesByPostId(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.postId === postId);
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    const id = this.currentId.likes++;
    const like: Like = {
      ...insertLike,
      id,
      createdAt: new Date()
    };
    this.likes.set(id, like);
    
    // Update post like count
    const post = await this.getPost(insertLike.postId);
    if (post) {
      post.likes = (post.likes || 0) + 1;
      this.posts.set(post.id, post);
    }
    
    return like;
  }

  async deleteLike(id: number): Promise<void> {
    const like = this.likes.get(id);
    if (like) {
      const post = await this.getPost(like.postId);
      if (post && post.likes && post.likes > 0) {
        post.likes--;
        this.posts.set(post.id, post);
      }
    }
    this.likes.delete(id);
  }
}

import { DatabaseStorage } from "./dbStorage";

// Comment out MemStorage and use DatabaseStorage instead
// export const storage = new MemStorage();
export const storage = new DatabaseStorage();
