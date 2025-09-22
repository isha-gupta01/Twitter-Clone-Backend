import express from "express";
import UserInfo from "../models/usersModel.js";
import Tweets from "../models/tweetsModel.js";
import dotenv from "dotenv"
import uploadToCloudinary,{upload} from "../storage/cloudinaryMulter.js";

import authenticateToken from "./baseauth.js";

dotenv.config();
const loggedUser = express.Router();



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


//follow and unfollow and get followings

loggedUser.put('/follow/:userId', authenticateToken, async (req, res) => {
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


loggedUser.get("/profile/:userId/followings", authenticateToken, async (req, res) => {
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

loggedUser.put('/unfollow/:userId', authenticateToken, async (req, res) => {
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

loggedUser.put("/updateProfileImage", upload.single("imageUrl"), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const uploadedUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

    const user = await UserInfo.findByIdAndUpdate(
      userId,
      { profileImage: uploadedUrl },
      { new: true }
    );
    const updatedTweets = await Tweets.updateMany(
      { user_id: userId },                 // filter by user_id
      { $set: { profileImage: uploadedUrl } }, // update profileImage field
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile image updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update image error:", error);
    res.status(500).json({ message: "Failed to update profile image", error });
  }
});

loggedUser.put("/removeProfileImage", async (req, res) => {
  try {
    const { id } = req.body;  // Extract user ID from the body
    const user = await UserInfo.findById(id);  // Find the user by ID
    const updatedTweets = await Tweets.updateMany(
      { user_id: id },                 // filter by user_id
      { $set: { profileImage: "/person2.png" } }, // update profileImage field
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.profileImage = "/person2.png";  // Set to default profile image
    await user.save();  // Save the updated user

    res.json({ user });  // Send the updated user data as a response
  } catch (err) {
    console.error("Error in removeProfileImage:", err);
    res.status(500).json({ error: "Failed to remove image" });
  }
});


//save tweets for the loggedUser.

loggedUser.get("/getSavedTweet", authenticateToken, async (req, res) => {
  try {
    const savedTweets = await UserInfo.findById(
      req.user.userId,
    ).select("savedTweet").populate("savedTweet")
    res.status(200).json({
      message: "Tweet fetched successfully",
      savedTweets
    });

  } catch (error) {
    console.error("Error in fetching tweet:", err);
    res.status(500).json({ error: "Failed to fetching tweet" });

  }
})

loggedUser.post("/saveTweet", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tweetId } = req.body;

    const user = await UserInfo.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hasSaved = user.savedTweet.includes(tweetId);

    if (hasSaved) {
      // Unsave tweet
      user.savedTweet = user.savedTweet.filter(
        (id) => id.toString() !== tweetId
      );
    } else {
      // Save tweet
      user.savedTweet.push(tweetId);
    }

    await user.save();

    res.status(200).json({
      message: hasSaved
        ? "Tweet removed from saved"
        : "Tweet saved successfully",
      savedTweet: user.savedTweet,
      hasSaved: !hasSaved, // current status after action
    });
  } catch (error) {
    console.error("Error in saveTweet toggle:", error);
    res.status(500).json({ error: "Failed to update saved tweets" });
  }
});






export default loggedUser;
