import express from "express";
import multerPkg from "multer";
import UserInfo from "../models/usersModel.js";
import Tweets from "../models/tweetsModel.js";
import { connectDB } from "../lib/db.js";
import authenticateToken from "./baseauth.js";
import cloudinary from "../lib/cloudinary.js";

const UserCrud = express.Router();
connectDB();

// Setup multer with memoryStorage
const { memoryStorage } = multerPkg;
const storage = memoryStorage();
const upload = multerPkg({ storage });

// Upload two fields: profileImage and coverImage
const multiUpload = upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);

// Upload to Cloudinary from buffer
const uploadToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "uploads" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

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

    // Upload profileImage
    if (files.profileImage && files.profileImage[0]) {
      try {
        profileImageUrl = await uploadToCloudinary(files.profileImage[0].buffer);
      } catch (error) {
        return res.status(500).json({ message: "Error uploading profile image" });
      }
    }

    // Upload coverImage
    if (files.coverImage && files.coverImage[0]) {
      try {
        coverImageUrl = await uploadToCloudinary(files.coverImage[0].buffer);
      } catch (error) {
        return res.status(500).json({ message: "Error uploading cover image" });
      }
    }

    const existingProfile = await UserInfo.findById(userId);
    if (!existingProfile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    const updateFields = {};
    if (username) updateFields.username = username;
    if (Name) updateFields.Name = Name;
    if (bio) {
      try {
        updateFields.bio = JSON.parse(bio);
      } catch (err) {
        return res.status(400).json({ message: "Bio must be a valid array" });
      }
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
