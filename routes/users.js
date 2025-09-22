import express from "express";
import UserInfo from "../models/usersModel.js";
import Tweets from "../models/tweetsModel.js";
import { connectDB } from "../lib/db.js";
import authenticateToken from "./baseauth.js";
import uploadToCloudinary,{multiUpload} from "../storage/cloudinaryMulter.js";


const UserCrud = express.Router();
connectDB();



UserCrud.post("/setupprofile", authenticateToken, multiUpload, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const { username, Name, bio } = req.body;
    const userId = req.user.userId;

    const files = req.files || {};
    let profileImageUrl = null;
    let coverImageUrl = null;

    // Upload profileImage with deduplication
    if (files.profileImage && files.profileImage[0]) {
      try {
        profileImageUrl = await uploadToCloudinary(
          files.profileImage[0].buffer,
          "profile"
        );
      } catch (error) {
        return res.status(500).json({
          message: "Error uploading profile image",
          error: error.message || error.toString(),
        });
      }
    }

    // Upload coverImage with deduplication
    if (files.coverImage && files.coverImage[0]) {
      try {
        coverImageUrl = await uploadToCloudinary(
          files.coverImage[0].buffer,
          "cover"
        );
      } catch (error) {
        return res.status(500).json({ message: "Error uploading cover image" });
      }
    }

    const existingProfile = await UserInfo.findById(userId);
    if (!existingProfile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    const updateFields = {};

    // Check for unique username
    if (username && username !== existingProfile.username) {
      const existingUser = await UserInfo.findOne({ username });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: "Username already taken" });
      }
      updateFields.username = username;
    }

    if (Name) updateFields.Name = Name;

    if (bio) {
      const bioArray = bio
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      updateFields.bio = bioArray;
    }

    if (profileImageUrl) updateFields.profileImage = profileImageUrl;
    if (coverImageUrl) updateFields.coverImage = coverImageUrl;

    const updatedProfile = await UserInfo.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    // Update tweets with new profile info
    await Tweets.updateMany(
      { user_id: userId },
      {
        $set: {
          username: updatedProfile.username,
          Name: updatedProfile.Name,
          profileImage: updatedProfile.profileImage,
        },
      }
    );

    res.status(200).json({
      message: "Profile and related tweets updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default UserCrud;
