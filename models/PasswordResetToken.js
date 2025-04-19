// models/PasswordResetToken.js
import mongoose from "mongoose";

const passwordResetTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo", required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const PasswordResetToken = mongoose.model("PasswordResetToken", passwordResetTokenSchema);
export default PasswordResetToken;
 