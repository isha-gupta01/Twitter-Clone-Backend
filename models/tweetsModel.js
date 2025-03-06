import mongoose from "mongoose";

const userTweets = new mongoose.Schema({
    user_id:{ type: mongoose.Schema.Types.ObjectId, ref: "UserInfo" },
    username:String,
    Name:String,
    profileImage:String,
    content:String,
    image:String,
    likes:Number,
    comments:Number,
    retweets:Number,
    views:String,
    tweetTime:String,
    likedBy: { type: [mongoose.Schema.Types.ObjectId], ref: "UserInfo",default:[] }, 
    created_at: { type: Date, default: Date.now }
})

export default mongoose.models.Tweets || mongoose.model("Tweets",userTweets,"tweets")