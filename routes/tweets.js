import express from "express";
import mongoose from "mongoose";
import Tweets from "../models/tweetsModel.js";
import { connectDB } from "../lib/db.js"; // Ensure the DB connection is correct
import authenticateToken from "./baseauth.js";
import multer from "multer";
import cloudinary from "../lib/cloudinary.js";
// import { fileURLToPath } from "url";
// import path from "path";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TweetCrud = express.Router();

// Connect to DB before any request
connectDB();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new Error("Only images and videos are allowed"), false);
        }
    }
});

const uploadToCloudinary = async (buffer, mimetype) => {
    return new Promise((resolve, reject) => {
        const resourceType = mimetype.startsWith("video/") ? "video" : "image";
        console.log(`Uploading to Cloudinary as ${resourceType}`);

        const stream = cloudinary.uploader.upload_stream(
            { folder: "uploads", resource_type: resourceType },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    return reject(error);
                }
                console.log("Cloudinary Upload Success:", result);
                resolve(result.secure_url);
            }
        );
        stream.end(buffer);
    });
};



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
      const userId = req.user.userId; // Extract user ID from token
      console.log("Received file:", req.file); // Debugging step
  
      let mediaUrl = null;
  
      // Upload either an image or a video
      if (req.file) {
        console.log("File type:", req.file.mimetype);
        mediaUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      }
  
      // Ensure there's either text content or media
      if (!tweetContent && !mediaUrl) {
        return res.status(400).json({ message: "Tweet content or media is required" });
      }
  
      // Create and save the new tweet
      const newTweet = new Tweets({
        user_id: userId,
        username,
        Name,
        profileImage,
        content: tweetContent,
        image: mediaUrl, // Store single media URL
        likes: 0,
        retweets: 0,
        comments: 0,
        tweetTime: "1m",
        views: "0",
      });
  
      await newTweet.save();
      console.log("Submitting tweet with:", tweetContent, mediaUrl);
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
TweetCrud.delete("/tweetdelete/:id", authenticateToken, async (req, res) => {
    try {
        const tweet = await Tweets.findByIdAndDelete({_id:req.params.id});
        if (!tweet) return res.status(404).json({ message: "Tweet not found" });

        res.status(200).json({ message: "Tweet deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
 
export default TweetCrud;
