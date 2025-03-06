import express from "express";
import UserInfo from "../models/usersModel.js";
import { connectDB } from "../lib/db.js";
import authenticateToken from "./baseauth.js";
import multer from "multer";
import { fileURLToPath } from "url";
import path from "path";

const UserCrud = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));


// Connect to DB before any request
connectDB();

// Configure storage to save files in "public/uploads"
const storage = multer.diskStorage({
    destination: path.join(__dirname, "../../public/uploads"),
    // Save inside public/uploads
    filename: (req, file, cb) => {
        const sanitizedFilename = file.originalname.replace(/\s+/g, "_"); // Replace spaces with underscores
        cb(null,sanitizedFilename);
    }
}
);

const upload = multer({ storage });


UserCrud.post("/setupprofile",authenticateToken, upload.single("media"), async (req, res) => {
    try {
        // console.log("🛠️ Headers:", req.headers);
        // console.log("Received Data:", req.body); // ✅ Log form fields
        // console.log("Uploaded File:", req.file); // ✅ Log file
        // console.log(username)
        // console.log(req.user.userId)
        const { username, Name, bio} = req.body;
        const userId = req.user.userId; // Extract user ID from token
        const mediaUrl = req.file ? `/uploads/${req.file.filename}` : null;
       
        if (!username && !Name && !bio && !mediaUrl) {
            return res.status(400).json({ message: "At least one field is required to update profile." });
        }

        // Check if the user profile exists
        let existingProfile = await UserInfo.findOne({ _id: userId });

        if (!existingProfile) {
            return res.status(404).json({ message: "Profile not found. Update failed." });
        }

        // Prepare update object (update existing fields & add missing ones)
        const updateFields = {};

        if (username) updateFields.username = username;
        if (Name) updateFields.Name = Name;
        if (bio) updateFields.bio = bio;
        if (mediaUrl) updateFields.profileImage = mediaUrl;


        // Update the document with both new and existing fields
        const UpdatedProfile=await UserInfo.findOneAndUpdate({ _id: userId }, { $set: updateFields },{ new: true });
        // If no document was found, return an error
        if (!UpdatedProfile) {
            return res.status(404).json({ message: "Profile not found. Update failed." });
        }

        res.status(201).json({ message: "profile update successfully", profile: UpdatedProfile });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default UserCrud;
