import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  tweetId: { type: mongoose.Schema.Types.ObjectId, ref: "Tweets", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserInfo", required: true },
  username: { type: String, required: true },
  profileImage: { type: String , required: true},
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Comments || mongoose.model("Comments",commentSchema)
