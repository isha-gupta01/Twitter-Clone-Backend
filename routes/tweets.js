import express from "express";
import mongoose from "mongoose";
import Tweets from "../models/tweetsModel.js";
import { connectDB } from "../lib/db.js"; // Ensure the DB connection is correct
import authenticateToken from "./baseauth.js";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TweetCrud = express.Router();

// Connect to DB before any request
connectDB();

// Configure storage to save files in "public/uploads"
const storage = multer.diskStorage({
    destination: path.join(__dirname, "../../public/uploads"),
    // Save inside public/uploads
    filename: (req, file, cb) => {
        const sanitizedFilename = file.originalname.replace(/\s+/g, "_"); // Replace spaces with underscores
        cb(null, sanitizedFilename);
    }
}
);

const upload = multer({ storage });

// ✅ GET all tweets
TweetCrud.get("/tweetall", async (req, res) => {
    try {
        const tweets = await Tweets.find({});
        res.json(tweets);
    } catch (error) {
        res.status(500).json({ error: "Error fetching tweets" });
    }
});

// ✅ POST a new tweet
TweetCrud.post("/tweetinsert", async (req, res) => {
    try {
        const { user_id, content, image, likes, retweets, views, comments, tweetTime } = req.body;

        if (!user_id || content == null || image == null || likes == null || retweets == null || views == null || comments == null || tweetTime == null) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newTweet = await Tweets.create({ user_id, content, image, likes, retweets, views, comments, tweetTime });
        res.status(201).json(newTweet);
    } catch (error) {
        res.status(500).json({ error: "Error adding Tweet" });
    }
});
//inserting the tweet or post from the Twitter page by user
TweetCrud.post("/loggedtweet", authenticateToken, upload.single("media"), async (req, res) => {
    try {
        const { tweetContent, username, Name, profileImage } = req.body;
        // console.log(tweetContent)
        const userId = req.user.userId;
        // console.log(req.user) // Extract user ID from token
        const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;
        if (!tweetContent && !mediaUrl) {
            return res.status(400).json({ message: "Tweet content or media is required" });
        }

        const newTweet = new Tweets({
            user_id: userId,
            username: username,
            Name: Name,
            profileImage: profileImage,
            content: tweetContent,
            image: mediaUrl,
            likes: 0,
            retweets: 0,
            comments: 0,
            tweetTime: "1m",
            views: "0"
        });

        await newTweet.save();
        res.status(201).json({ message: "Tweet created successfully", tweet: newTweet });
    } catch (error) {
        console.error("Error creating tweet:", error);
        res.status(500).json({ message: "Server error" });
    }
});
TweetCrud.post("/likes", authenticateToken, async (req, res) => {
    try {
        const userId =req.user.userId;  // Ensure it's an ObjectId
        const { tweetId } = req.body;
        
        // console.log(userId);
        // console.log(tweetId);
        // if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        //     return res.status(400).json({ message: "Invalid Tweet ID" });
        // }
        
        
        // Find the tweet
        const tweet = await Tweets.findById(tweetId);
        if (!tweet) {
            return res.status(404).json({ message: "Tweet not found" });
        }
        
        // Check if user has already liked the tweet
        const hasLiked = tweet.likedBy.includes(userId);
        // console.log(hasLiked);

        if (hasLiked) {
            // Unlike: Remove user from likedBy and decrease count
            tweet.likedBy = tweet.likedBy.filter(id => id.toString() !== userId);
            tweet.likes -= 1;
        } else {
            // Like: Add user to likedBy only if not already present
            if (!tweet.likedBy.some(id => String(id) === String(req.user.userId))) {
                tweet.likedBy.push(userId);
                tweet.likes += 1;
            }
        }
        // Save updated tweet
        await tweet.save();

        res.status(200).json({
            message: "Like updated",
            likes: tweet.likes,
            likedBy: tweet.likedBy,
            hasLiked:!hasLiked
        });
    } catch (error) {
        console.error("Error updating likes:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ✅ PUT (Update a tweet)
TweetCrud.put("/tweetupdate", async (req, res) => {
    try {
        const { _id, content, image, likes, retweets, views, username, profileImage, comments, tweetTime } = req.body;

        if (!_id) {
            return res.status(400).json({ error: "Id is required for update" });
        }

        const updatedTweet = await Tweets.findByIdAndUpdate(
            { _id: _id },
            { content, image, likes, retweets, views, username, profileImage, comments, tweetTime },
            { new: true }
        );

        if (!updatedTweet) {
            return res.status(404).json({ error: "Tweet not found" });
        }

        res.json(updatedTweet);
    } catch (error) {
        res.status(500).json({ error: "Error updating Tweet" });
    }
});

// ✅ DELETE a tweet
TweetCrud.delete("/tweetdelete", async (req, res) => {
    try {
        const { _id } = req.body;

        if (!_id) {
            return res.status(400).json({ error: "Tweet ID is required" });
        }

        const deletedTweet = await Tweets.findByIdAndDelete({ _id: _id });

        if (!deletedTweet) {
            return res.status(404).json({ error: "Tweet not found" });
        }

        res.json({ message: "Tweet deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting Tweet" });
    }
});

export default TweetCrud;
