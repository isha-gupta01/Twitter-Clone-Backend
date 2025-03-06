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

export default loggedUser;
