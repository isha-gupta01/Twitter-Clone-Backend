import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose" 

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String},
    Name: { type: String },
    bio: { type: String },
    profileImage: { type: String, default: "/default-profile.png" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" }],
  },
  { timestamps: true }
)
UserSchema.plugin(passportLocalMongoose);
export default mongoose.models.GoggleUsers || mongoose.model("GoggleUsers",UserSchema)