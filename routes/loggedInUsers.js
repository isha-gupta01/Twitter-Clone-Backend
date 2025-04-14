import express from "express";
import jwt from "jsonwebtoken";
import UserInfo from "../models/usersModel.js";
import dotenv from "dotenv"
dotenv.config();
const loggedUser = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    // console.log(authHeader)
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1]; // Extract the token
    // console.log(token)
    if (!token) return res.status(401).json({ message: "Invalid token format" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // console.log(decoded)
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};
// Protected route: Get logged-in user details
loggedUser.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await UserInfo.findById(req.user.userId).select("-password");
        // console.log(user) // Exclude password
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
loggedUser.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await UserInfo.findById(req.user.userId).select("-password");
        // console.log(user) // Exclude password
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
loggedUser.get("/profile/:userId", async (req, res) => {
    try {
        const user = await UserInfo.findById(req.params.userId).select("-password");
        // console.log("data",user) // Exclude password
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
loggedUser.get("/profile/searched/:username", async (req, res) => {
    try {
        const { username } = req.params;
        console.log("🔍 Username from params:", username);

        const user = await UserInfo.findOne({ username });
        console.log("📦 User found:", user);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ message: "Server error" });
    }
});


loggedUser.put('/follow/:userId',authenticateToken, async (req, res) => {
    try {
      const userIdToFollow = req.params.userId;
      const followerId = req.user.userId;
  
      if (!followerId) {
        return res.status(400).json({ message: "Follower ID is required" });
      }
  
      const userToFollow = await UserInfo.findById(userIdToFollow);
      const followerUser = await UserInfo.findById(followerId);
  
      if (!userToFollow || !followerUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      if (userToFollow.followers.includes(followerId)) {
        return res.status(400).json({ message: "Already following this user" });
      }
  
      // Add follower to user's followers
      userToFollow.followers.push(followerId);
      await userToFollow.save();
  
      // Add user to follower's following list
      followerUser.following.push(userIdToFollow);
      await followerUser.save();
  
      res.status(200).json({ message: "Followed successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  

loggedUser.get("/profile/:userId/followings",authenticateToken, async (req, res) => {
    try {
        const user = await UserInfo.findOne({ _id: req.params.userId })
            .populate("following", "-password") // populate user data except password
        
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ followings: user.following });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

loggedUser.put('/unfollow/:userId',authenticateToken, async (req, res) => {
    try {
      const userIdToUnfollow = req.params.userId;
      const followerId = req.user.userId;
  
      if (!followerId) {
        return res.status(400).json({ message: "Follower ID is required" });
      }
  
      const userToUnfollow = await UserInfo.findById(userIdToUnfollow);
      const followerUser = await UserInfo.findById(followerId);
  
      if (!userToUnfollow || !followerUser) {
        return res.status(404).json({ message: "User not found" });
      }
  
      if (!userToUnfollow.followers.includes(followerId)) {
        return res.status(400).json({ message: "You are not following this user" });
      }
  
      // Remove follower from user's followers
      userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== followerId);
      await userToUnfollow.save();
  
      // Remove user from follower's following list
      followerUser.following = followerUser.following.filter(id => id.toString() !== userIdToUnfollow);
      await followerUser.save();
  
      res.status(200).json({ message: "Unfollowed successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
  




export default loggedUser;
