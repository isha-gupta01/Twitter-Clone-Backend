import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose" 

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    Name: { type: String },
    bio: { type: String },
    profileImage: { type: String, default: "/default-profile.png" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
)
UserSchema.plugin(passportLocalMongoose);
export default mongoose.models.UserInfo || mongoose.model("UserInfo",UserSchema,"userinfos")