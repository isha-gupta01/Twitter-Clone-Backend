import { connectDB } from "./lib/db.js";
import express from "express";
import Tweets from "./models/tweetsModel.js";
import UserInfo from "./models/usersModel.js";
import commentModel from "./models/commentModel.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import router from "./routes/auth.js";
import loggedUser from "./routes/loggedInUsers.js";
import tweetcount from "./routes/tweetCount.js";
import UserCrud from "./routes/users.js";
import TweetCrud from "./routes/tweets.js";
import trending from "./routes/trending.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { Server } from "socket.io";
import http from "http";
import CommentChat from "./routes/comments.js";
import SearchRouter from "./routes/searchUser.js";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app); // Create HTTP server

// 🛠️ WebSocket Setup
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ Join a room based on tweetId
  socket.on("joinTweetRoom", async (tweetId) => {
    socket.join(tweetId);
    console.log(`User joined room: ${tweetId}`);

    // ✅ Send existing comments when user joins a tweet's chat
    try {
      const comments = await commentModel.find({ tweetId }).sort({ timestamp: -1 });
      socket.emit("loadPreviousMessages", comments);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  });

  socket.on("sendComment", async (commentData) => {
    try {
      const newComment = new commentModel({
        tweetId: commentData.tweetId,
        userId: commentData.userId,
        username: commentData.username,
        profileImage: commentData.profileImage,
        content: commentData.content,
        timestamp: new Date(),
      });

      await newComment.save(); // ✅ Save to MongoDB

      // ✅ Broadcast the saved comment to all users in the room
      // io.to(commentData.tweetId).emit("receiveComment", newComment);
      // ✅ Emit the new comment to the chatroom
      io.to(tweetId).emit("receiveComment", newComment);
    } catch (error) {
      console.error("Error saving comment:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});


// 🛠️ Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data
app.use(cors());

// 🛠️ CORS Headers (if needed)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// 🛠️ Static File Serving
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.static(path.join(__dirname, "public")));

// 🛠️ Routes
app.use("/trends/trendingtweets", trending);
app.use("/api/auth", router);
app.use("/loggeduser", loggedUser);
app.use("/tweetfetch", tweetcount);
app.use("/tweetcrud", TweetCrud);
app.use("/usercrud", UserCrud);
app.use("/comment", CommentChat);
app.use("/api/users",SearchRouter)

// ==================== Fetch Users Data ====================
app.get("/users", async (req, res) => {
  try {
    const users = await UserInfo.find({});
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== Fetch Tweets Data ====================
app.get("/tweets", async (req, res) => {
  try {
    const tweets = await Tweets.find({});
    res.json(tweets);
  } catch (error) {
    console.error("Error fetching tweets:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== Register User ====================
app.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Check if user already exists
    const existingUser = await UserInfo.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new UserInfo({ email, password: hashedPassword, username });
    await newUser.save();

    // Generate JWT Token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log("User Registered:", newUser._id);
    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: { email: newUser.email, username: newUser.username },
    });
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ Connect Database Before Starting Server
connectDB();

// ✅ Start Server
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
