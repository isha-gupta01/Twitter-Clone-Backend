import express from "express";
import Trending from "../models/trending.js";

const trending = express.Router();

// Fetch Random Trending Topics (Every Refresh)
trending.get("/", async (req, res) => {
    try {
        const trendingTopics = await Trending.aggregate([
            { $sample: { size: 4 } } // Get 10 random trending topics
        ]);
        res.status(200).json(trendingTopics);
    } catch (error) {
        res.status(500).json({ message: "Error fetching trending topics", error });
    }
});

export default trending;
