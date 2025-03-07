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
loggedUser.put('/follow/:userId',async (req, res) => {
    try {
        const userIdToFollow = req.params.userId; // The user being followed
        const followerId = req.body.followerId; // The user following (from localStorage on frontend)
        // console.log(followerId);
        if (!followerId) {
            return res.status(400).json({ message: "Follower ID is required" });
        }

        const user = await UserInfo.findById(userIdToFollow);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already followed
        if (user.followers.includes(followerId)) {
            return res.status(400).json({ message: "Already following this user" });
        }

        // Add follower
        user.followers.push(followerId);
        await user.save();

        res.status(200).json({ message: "Followed successfully", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});


loggedUser.put('/unfollow/:userId', async (req, res) => {
    try {
        const userIdToUnfollow = req.params.userId; // The user being unfollowed
        const followerId = req.body.followerId; // The user who wants to unfollow

        if (!followerId) {
            return res.status(400).json({ message: "Follower ID is required" });
        }

        const user = await UserInfo.findById(userIdToUnfollow);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the user is following
        if (!user.followers.includes(followerId)) {
            return res.status(400).json({ message: "You are not following this user" });
        }

        // Remove follower
        user.followers = user.followers.filter(id=>id.toString() !== followerId);
        await user.save();

        res.status(200).json({ message: "Unfollowed successfully", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});



export default loggedUser;
