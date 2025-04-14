import express from "express";
import commentModel from "../models/commentModel.js";
import authenticateToken from "./baseauth.js"; // Middleware to verify JWT

const CommentChat = express.Router();

// ✅ **POST - Add a Comment to a Tweet**
CommentChat.post("/add", authenticateToken, async (req, res) => {
  try {
    const { tweetId, content } = req.body;
    const user = req.user; // Get from token

    if (!tweetId || !content) {
      return res.status(400).json({ error: "Tweet ID and content are required." });
    }

    const newComment = await commentModel.create({
      tweetId,
      userId:user.userId,
      username:user.username, // Extracted from JWT
      profileImage:user.profileImage,
      content,
    });

    res.status(201).json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ **GET - Fetch Comments for a Specific Tweet**
CommentChat.get("/:tweetId", async (req, res) => {
  try {
    const { tweetId } = req.params;

    const comments = await commentModel.find({ tweetId }).sort({ timestamp: -1 });
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ **DELETE - Remove a Comment (Only Author Can Delete)**
CommentChat.delete("/delete/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await commentModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ error: "You can only delete your own comments." });
    }

    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default CommentChat;
