import express from "express";
import Tweets from "../models/tweetsModel.js";
import authenticateToken from "./baseauth.js";
import mongoose from "mongoose";

const tweetcount = express.Router();

// Get tweet count for logged-in user
tweetcount.get("/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Extracted from JWT token
    // console.log(userId)
    // Count tweets for the logged-in user
    const tweetCount = await Tweets.countDocuments({ user_id:userId });
    // console.log(tweetCount)
    res.json({ userId, totalTweets: tweetCount });
  } catch (error) {
    console.error("Error fetching tweet count:", error);
    res.status(500).json({ error: "Server error" });
  }
});
tweetcount.get("/profiletweetcount/:userId", async (req, res) => {
  try {
    const userId = req.params.userId; // Extracted from JWT token
    // console.log(userId)
    // Count tweets for the logged-in user
    const tweetCount = await Tweets.countDocuments({ user_id:new mongoose.Types.ObjectId(userId) });
    // console.log(tweetCount)
    res.json({ userId, totalTweets: tweetCount });
  } catch (error) {
    console.error("Error fetching tweet count:", error);
    res.status(500).json({ error: "Server error" });
  }
});
tweetcount.get("/profile/:userId", async (req, res) => {
  try {
    const userId = req.params.userId; // Extracted from JWT token
    // console.log(userId)
    // Count tweets for the logged-in user
    const tweets = await Tweets.find({ user_id:new mongoose.Types.ObjectId(userId) });
    // console.log(tweetCount)
    res.json(tweets );
  } catch (error) {
    console.error("Error fetching tweet count:", error);
    res.status(500).json({ error: "Server error" });
  }
});

tweetcount.get("/tweets", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await Tweets.find({ user_id: { $ne: userId } });
    // console.log(user)
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
tweetcount.get("/usertweets", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await Tweets.find({ user_id:  userId  });
    // console.log(user)
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default tweetcount;
