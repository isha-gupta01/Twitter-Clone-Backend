import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose" 

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    Name: { type: String ,
      default:function(){
        return this.username;
      }
    },
    bio: [{ type: String }],
    profileImage: { type: String, default: "/person2.png" },
    coverImage: { type: String, default: "/coverImage.png" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" }],
    savedTweet:[{type:mongoose.Schema.Types.ObjectId,ref:"Tweets"}],
  },
  { timestamps: true }
)
UserSchema.plugin(passportLocalMongoose);
export default mongoose.models.UserInfo || mongoose.model("UserInfo",UserSchema,"userinfos")  