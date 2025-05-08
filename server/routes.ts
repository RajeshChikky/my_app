import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertPostSchema, insertCommentSchema, insertLikeSchema, insertFollowerSchema, insertMessageSchema, type User } from "@shared/schema";
import { samplePosts, sampleReels } from "./sample-data";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";

// Setup multer for file uploads
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage_config });

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API Routes
  // Posts endpoints
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Add public access to uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  app.post("/api/posts", upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Determine which type of media was uploaded
      let mediaType = req.body.mediaType || 'image';
      let mediaUrl = '';
      
      if (files.image && files.image.length > 0) {
        mediaUrl = `/uploads/${files.image[0].filename}`;
      } else if (files.video && files.video.length > 0) {
        mediaUrl = `/uploads/${files.video[0].filename}`;
      } else if (files.audio && files.audio.length > 0) {
        mediaUrl = `/uploads/${files.audio[0].filename}`;
      } else {
        return res.status(400).json({ message: "No media file uploaded" });
      }
      
      // Get the caption from the form data
      const caption = req.body.caption || null;
      
      // Create a timestamp for the post
      const createdAt = new Date();
      
      const postData = {
        userId: req.user!.id,
        imageUrl: mediaUrl, // We still use imageUrl field for all media types
        caption: caption,
        location: null,
        createdAt: createdAt
      };
      
      const post = await storage.createPost(postData);
      
      // Add the media type to the response
      const responseData = {
        ...post,
        mediaType,
        timestamp: createdAt
      };
      
      res.status(201).json(responseData);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Get all users endpoint
  app.get("/api/users/all", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send password hashes to the client
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // User profile endpoints
  app.get("/api/users/:usernameOrId", async (req, res) => {
    try {
      // Special case for "all" which is handled by the route above
      if (req.params.usernameOrId === "all") {
        return;
      }
      
      // Check if the parameter is a number (ID) or string (username)
      const userId = parseInt(req.params.usernameOrId);
      
      if (!isNaN(userId)) {
        // It's a number, treat as user ID
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        return res.json(user);
      } else {
        // It's a string, treat as username
        const user = await storage.getUserByUsername(req.params.usernameOrId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        return res.json(user);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User posts endpoint
  app.get("/api/users/:username/posts", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const posts = await storage.getPostsByUserId(user.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  // Like a post
  app.post("/api/posts/:postId/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const postId = parseInt(req.params.postId);
      const userId = req.user!.id;
      
      const existingLike = await storage.getLike(userId, postId);
      if (existingLike) {
        await storage.deleteLike(existingLike.id);
        res.json({ liked: false });
      } else {
        await storage.createLike({ userId, postId });
        res.json({ liked: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to process like" });
    }
  });

  // Comments endpoints
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getCommentsByPostId(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const postId = parseInt(req.params.postId);
      const commentData = insertCommentSchema.parse({
        postId,
        userId: req.user!.id,
        content: req.body.content
      });
      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Stories endpoints
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getAllStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });
  
  // Reels endpoints
  app.get("/api/reels", async (req, res) => {
    try {
      // Use our sample reels data with Indian-themed content for the infinite scrolling experience
      res.json(sampleReels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reels" });
    }
  });
  
  // Upload a new reel
  app.post("/api/reels", upload.single('video'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Check if video was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }
      
      // Create a URL for the uploaded video
      const videoUrl = `/uploads/${req.file.filename}`;
      
      // Extract data from request
      const { caption, filter = 'normal', audioId } = req.body;
      
      // Generate a thumbnail (in a real app we would extract this from the video)
      const thumbnail = 'https://i.ytimg.com/vi/rKLQtBzFJQQ/maxresdefault.jpg';
      
      // Map audio IDs to track names (in a real app, this would come from a database)
      const audioTracks: Record<string, string> = {
        "1": "Bollywood Beat",
        "2": "Kerala Rhythm",
        "3": "Punjabi Dance",
        "4": "Tamil Classic",
        "5": "Folk Fusion"
      };
      
      // Determine audio track name
      const audioTrack = audioId && typeof audioId === 'string' && audioId in audioTracks 
        ? audioTracks[audioId] 
        : "Original Audio";
      
      // Get all users to randomly assign the reel
      const allUsers = await storage.getAllUsers();
      
      // Make sure we have at least one user
      if (allUsers.length === 0) {
        return res.status(500).json({ message: "No users found to assign reel" });
      }
      
      // Choose a random user - if the random selection picks the current user, that's fine too
      const randomIndex = Math.floor(Math.random() * allUsers.length);
      const randomUser = allUsers[randomIndex];
      
      console.log(`Assigning reel to random user: ${randomUser.username} (ID: ${randomUser.id})`);
      
      // Create the reel data (in a real app this would be inserted into a reels table)
      const reel = {
        id: Date.now(), // Simple placeholder ID 
        userId: randomUser.id, // Assign to random user instead of current user
        videoUrl,
        thumbnail,
        caption: caption || null,
        filter,
        audioTrack,
        likes: 0,
        views: 0,
        createdAt: new Date(),
        // Include user info for frontend display
        user: {
          id: randomUser.id,
          username: randomUser.username,
          profilePicture: randomUser.profilePicture,
          fullName: randomUser.fullName
        }
      };
      
      // In a real app we would save this to the database
      // await storage.createReel(reel);
      
      res.status(201).json(reel);
    } catch (error) {
      console.error("Error creating reel:", error);
      res.status(500).json({ message: "Failed to create reel" });
    }
  });

  // Follow/Unfollow a user
  app.post("/api/users/:username/follow", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const follower = req.user!;
      const following = await storage.getUserByUsername(req.params.username);
      
      if (!following) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (follower.id === following.id) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const existingFollow = await storage.getFollower(follower.id, following.id);
      
      if (existingFollow) {
        await storage.deleteFollower(existingFollow.id);
        res.json({ following: false });
      } else {
        await storage.createFollower({
          followerId: follower.id,
          followingId: following.id
        });
        res.json({ following: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to process follow request" });
    }
  });

  // Update user profile
  app.put("/api/users/:id", upload.single('profilePicture'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = parseInt(req.params.id);
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow users to update their own profile
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      // Prepare update data
      const updateData: Partial<User> = {};
      
      // Handle text fields
      if (req.body.username) updateData.username = req.body.username;
      if (req.body.fullName !== undefined) updateData.fullName = req.body.fullName || null;
      if (req.body.email !== undefined) updateData.email = req.body.email || null;
      if (req.body.bio !== undefined) updateData.bio = req.body.bio || null;
      
      // Handle profile picture upload
      if (req.file) {
        // If there's an existing profile picture, remove it
        if (user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
          const oldFilePath = path.join(__dirname, '..', user.profilePicture);
          try {
            fs.unlinkSync(oldFilePath);
          } catch (error) {
            console.error('Failed to delete old profile picture:', error);
          }
        }
        
        updateData.profilePicture = `/uploads/${req.file.filename}`;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update profile" });
      }
      
      // Don't send the password back to the client
      const { password, ...safeUser } = updatedUser;
      
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Messages endpoints
  app.get("/api/messages/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const currentUserId = req.user!.id;
      const otherUserId = parseInt(req.params.userId);
      
      const messages = await storage.getMessagesBetweenUsers(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user!.id
      });
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Route to seed sample posts
  app.post("/api/seed/posts", async (req, res) => {
    try {
      const existingPosts = await storage.getAllPosts();
      
      // Only seed if there are fewer than 10 existing posts
      if (existingPosts.length < 10) {
        const createdPosts = [];
        
        for (const post of samplePosts) {
          // Need to separate likes since it's not part of InsertPost schema
          const { likes, ...postData } = post;
          
          // Create the post first
          const createdPost = await storage.createPost(postData);
          
          // Then manually update likes if needed
          if (likes && createdPost) {
            // This depends on your storage implementation having a way to update posts
            // You might need to add this method to your storage interface
            try {
              await storage.updatePost(createdPost.id, { likes });
            } catch (error) {
              console.warn(`Could not update likes for post ${createdPost.id}:`, error);
            }
          }
          
          createdPosts.push(createdPost);
        }
        
        res.status(201).json({ 
          message: `Successfully seeded ${createdPosts.length} posts`, 
          posts: createdPosts 
        });
      } else {
        res.json({ 
          message: "Sufficient posts already exist in the database", 
          existingCount: existingPosts.length 
        });
      }
    } catch (error) {
      console.error("Error seeding posts:", error);
      res.status(500).json({ message: "Error seeding posts" });
    }
  });

  // Search users endpoint
  app.get("/api/users/search/:query", async (req, res) => {
    try {
      const query = req.params.query.toLowerCase();
      const allUsers = await storage.getAllUsers();
      
      // Filter users whose username or fullName match the query
      const filteredUsers = allUsers.filter((user: User) => 
        (user.username && user.username.toLowerCase().includes(query)) || 
        (user.fullName && user.fullName.toLowerCase().includes(query))
      );
      
      res.json(filteredUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time user search
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if ((data.type === 'search_users' || data.type === 'search') && data.query) {
          const query = data.query.toLowerCase();
          const allUsers = await storage.getAllUsers();
          
          // Filter users whose username or fullName match the query
          const filteredUsers = allUsers.filter((user: User) => 
            (user.username && user.username.toLowerCase().includes(query)) || 
            (user.fullName && user.fullName.toLowerCase().includes(query))
          );
          
          // Send search results back to client
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'search_results',
              users: filteredUsers
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: 'An error occurred' }));
        }
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
