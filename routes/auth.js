import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import UserInfo from "../models/usersModel.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await UserInfo.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1d" });

    res
      .status(200)
      .json({
        message: "Login Successful",
        token,
        user: {
          userId: user._id,
          email: user.email,
          username: user.username,
          Name: user.Name,
          profileImage: user.profileImage,
        },
      });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
