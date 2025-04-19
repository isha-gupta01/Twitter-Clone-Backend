import crypto from "crypto";
import nodemailer from "nodemailer"
import PasswordResetToken from "../models/PasswordResetToken.js";
import express from "express"
import UserInfo from "../models/usersModel.js";
import dotenv from 'dotenv';
import bcrypt from "bcryptjs";
dotenv.config();

const passwordRouter = express.Router();


passwordRouter.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await UserInfo.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete any existing token
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Create new token
    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    await new PasswordResetToken({
        userId: user._id,
        token: hash,
        expiresAt: Date.now() + 3600000, // 1 hour
    }).save();

    // Send email with link
    const resetLink = `https://twitter-clone-tweets.vercel.app/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        to: user.email,
        subject: "Reset Your Password",
        html: `
    <p>
      <a href="${resetLink}" style="text-decoration: underline; cursor: pointer;">
        Click here
      </a> 
      to reset your password. This link is valid for 1 hour.
    </p>
  `
    });

    res.json({ message: "Reset link sent to your email." });
});


passwordRouter.post("/reset-password/:token", async (req, res) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const resetTokenDoc = await PasswordResetToken.findOne({
        token: hashedToken,
        expiresAt: { $gt: Date.now() },
    });

    if (!resetTokenDoc) return res.status(400).json({ message: "Token is invalid or expired" });

    const user = await UserInfo.findById(resetTokenDoc.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(req.body.password, 10);
    await user.save();

    await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });

    res.json({ message: "Password reset successful" });
});


export default passwordRouter;