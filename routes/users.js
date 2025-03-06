import express from "express";
import UserInfo from "../models/usersModel.js";
import { connectDB } from "../lib/db.js";
import authenticateToken from "./baseauth.js";
import multer from "multer";
import cloudinary from "../lib/cloudinary.js";

const UserCrud = express.Router();
connectDB();

// Multer setup for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

UserCrud.post("/setupprofile", authenticateToken, upload.single("media"), async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    console.log("Uploaded File:", req.file);
    const { username, Name, bio } = req.body;
    const userId = req.user.userId;

    let mediaUrl = null;
    // if (req.file) {
      try {
        mediaUrl = await uploadToCloudinary(req.file.buffer);
      } catch (error) {
        return res.status(500).json({ message: "Error uploading media" });
      }
    // }

    const existingProfile = await UserInfo.findById(userId);
    if (!existingProfile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    const updateFields = {};
    if (username) updateFields.username = username;
    if (Name) updateFields.Name = Name;
    if (bio) updateFields.bio = bio;
    if (mediaUrl) updateFields.profileImage = mediaUrl;

    const updatedProfile = await UserInfo.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    );

    res.status(200).json({ message: "Profile updated successfully", profile: updatedProfile });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default UserCrud;
