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
        const tweets = await Tweets.find({})
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
        console.log("File info:", req.file);
        console.log("Mimetype:", req.file?.mimetype);
        console.log("Buffer length:", req.file?.buffer?.length);


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
            views: Math.floor(Math.random() * 5000),
            retweets: Math.floor(Math.random() * 5000), // 0–20% of views
            comments: 0,
            tweetTime: "1m",
        });

        await newTweet.save();
        console.log("Submitting tweet with:", tweetContent, mediaUrl);
        res.status(201).json({ message: "Tweet created successfully", tweet: newTweet });
    } catch (error) {
        console.error("Error creating tweet:", error);
        res.status(500).json({ message: "Server error" });
    }
});


TweetCrud.get("/tweet/:tweetId", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { tweetId } = req.params;

        const tweet = await Tweets.findById(tweetId);
        if (!tweet) {
            return res.status(404).json({ message: "Tweet not found" });
        }

        const hasLiked = tweet.likedBy.includes(userId);

        res.status(200).json({
            _id: tweet._id,
            likes: tweet.likes,
            likedBy: tweet.likedBy,
            hasLiked,
        });
    } catch (error) {
        console.error("Error fetching tweet:", error);
        res.status(500).json({ message: "Server error" });
    }
});

TweetCrud.post("/likes", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { tweetId } = req.body;

        const tweet = await Tweets.findById(tweetId);
        if (!tweet) {
            return res.status(404).json({ message: "Tweet not found" });
        }

        const hasLiked = tweet.likedBy.includes(userId);

        if (hasLiked) {
            // Unlike
            tweet.likedBy = tweet.likedBy.filter(id => id.toString() !== userId);
            tweet.likes = Math.max(0, tweet.likes - 1); // Prevent negative likes
        } else {
            // Like
            tweet.likedBy.push(userId);
            tweet.likes += 1;
        }

        await tweet.save();

        res.status(200).json({
            message: "Like status updated",
            likes: tweet.likes,
            likedBy: tweet.likedBy,
            hasLiked: !hasLiked,
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
        const tweet = await Tweets.findByIdAndDelete({ _id: req.params.id });
        if (!tweet) return res.status(404).json({ message: "Tweet not found" });

        res.status(200).json({ message: "Tweet deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString(); // keeps it as "360" for small numbers
}

TweetCrud.put('/fix-formatted-tweets', async (req, res) => {
    try {
        const tweets = await Tweets.find({
            $or: [
                { retweets: { $type: 'number' } },
                { views: { $type: 'number' } }
            ]
        });

        console.log('Tweets found:', tweets); // Debugging line

        let updatedCount = 0;

        for (let tweet of tweets) {
            let updated = false;

            if (typeof tweet.views === 'number') {
                console.log(`Formatting views: ${tweet.views}`); // Debugging line
                tweet.views = formatNumber(tweet.views);
                updated = true;
            }

            if (typeof tweet.retweets === 'number') {
                console.log(`Formatting retweets: ${tweet.retweets}`); // Debugging line
                tweet.retweets = formatNumber(tweet.retweets);
                updated = true;
            }

            if (updated) {
                await tweet.save();
                updatedCount++;
            }
        }

        res.status(200).json({ message: `✅ Formatted and updated ${updatedCount} tweets.` });
    } catch (error) {
        console.error('Error formatting tweets:', error);
        res.status(500).json({ error: 'Server error while formatting tweets' });
    }
});



export default TweetCrud;
