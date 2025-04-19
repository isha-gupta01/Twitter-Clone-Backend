import mongoose from "mongoose";

const GroupMessageSchema = new mongoose.Schema({
  groupId: { type: String, required: true },        // tweet._id
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: String,
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("GroupMessage", GroupMessageSchema);
