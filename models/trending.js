import mongoose from "mongoose";

const TrendingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    posts: { type: Number, default: 0 },
    image: { type: String, default: null }
});

export default mongoose.models.Trending || mongoose.model("Trending", TrendingSchema,"trendings");
