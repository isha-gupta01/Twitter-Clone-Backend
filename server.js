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
import passwordRouter from "./routes/password.js";
import rateLimit from "express-rate-limit";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app); // Create HTTP server

// 🛠️ WebSocket Setup
const io = new Server(server, {
  cors: {
    origin: ["https://twitter-clone-tweets.vercel.app", "http://localhost:3001"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ Join a room based on tweetId
  socket.on("joinTweetRoom", async (tweetId) => {
    socket.join(tweetId);
    console.log(`User joined room: ${tweetId}`);

    // ✅ Send existing comments when user joins a tweet's chat
    try {
      const comments = await commentModel
        .find({ tweetId })
        .sort({ timestamp: 1 }); // Sort from oldest → newest

      socket.emit("loadPreviousMessages", comments);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  });

  // ✅ Handle new comment sent from client
  socket.on("sendComment", async (commentData, callback) => {
    try {
      const { tweetId, userId, username, profileImage, content } = commentData;

      if (!content || !tweetId || !userId) {
        if (callback) callback({ success: false, error: "Missing required fields" });
        return;
      }

      const newComment = new commentModel({
        tweetId,
        userId,
        username,
        profileImage,
        content: content.trim(),
        timestamp: new Date(),
      });

      const savedComment = await newComment.save();

      // ✅ Emit saved comment to all clients in the same room
      io.to(tweetId).emit("receiveComment", savedComment);

      // ✅ Acknowledge to sender that comment was saved
      if (callback) callback({ success: true });
    } catch (error) {
      console.error("Error saving comment:", error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // ✅ Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// 🛠️ Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// // 🛠️ Rate Limiting Middleware
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 100000, // 15 minutes
//   max: 1000000, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// // Apply rate limiting to all routes
// app.use(limiter);

// CORS Configuration
const allowedOrigins = [
  "https://twitter-clone-tweets.vercel.app", // deployed frontend
  "https://twitter-clone-isha-guptas-projects-95d81fc9.vercel.app",
  "https://twitter-clone-git-main-isha-guptas-projects-95d81fc9.vercel.app",
  "https://twitter-clone-rouge-five.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001" // local dev
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// Optional preflight for all routes
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true
}));

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
app.use("/api/users", SearchRouter);
app.use("/api/password", passwordRouter);

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
