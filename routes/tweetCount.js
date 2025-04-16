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
// Get tweet count for searched user
tweetcount.get("/count/searched/:username", async (req, res) => {
  try {
    const {username} = req.params; // Extracted from JWT token
    // console.log(userId)
    // Count tweets for the logged-in user
    const tweetCount = await Tweets.countDocuments({ username });
    // console.log(tweetCount)
    res.json({username, totalTweets: tweetCount });
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

tweetcount.get("/tweets/searched/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("🔍 Username from params:", userId);

    const tweets = await Tweets.find({user_id: userId }).sort({ createdAt: -1 }); // Optional: sort newest first
    console.log("📦 Tweets found:", tweets.length);

    if (!tweets || tweets.length === 0) {
      return res.status(404).json({ message: "No tweets found for this user." });
    }

    res.json(tweets); // ✅ Send back the array of tweets
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


tweetcount.get("/posts/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const post = await Tweets.findById(id).populate("user_id", "username profileImage Name");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json({
      _id: post._id,
      content: post.content,
      username: post.user_id.username,
      profileImage: post.user_id.profileImage,
      image:post.image,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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
tweetcount.get("/tweetData/:tweetId", authenticateToken, async (req, res) => {
  try {
    const {tweetId} = req.params;
    const tweet = await Tweets.findOne({ _id:  tweetId  });
    // console.log(user)
    if (!tweet) return res.status(404).json({ message: "tweet not found" });
    res.json(tweet);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});



export default tweetcount;
