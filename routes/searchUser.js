import express from "express"
import UserInfo from "../models/usersModel.js";


const SearchRouter = express.Router();

SearchRouter.get("/search", async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) return res.status(400).json({ error: "No search query provided" });

    const users = await UserInfo.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { Name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    }).limit(10);

    res.json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Server error" });
  }
})
// SearchRouter.get("/search/one", async (req, res) => {
//   try {
//     const query = req.query.query;

//     if (!query) return res.status(400).json({ error: "No search query provided" });

//     const users = await UserInfo.findOne({
//       $or: [
//         { username: { $regex: query, $options: "i" } },
//         { Name: { $regex: query, $options: "i" } },
//         { email: { $regex: query, $options: "i" } },
//       ],
//     }).limit(10);

//     res.json(users);
//   } catch (error) {
//     console.error("Search error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// })

// SearchRouter.get("/media/:username", async (req, res) => {
//   try {
//     const username = req.params.username; 
//     const user = await UserInfo.findOne({ username: username })
//     const id = user._id;
//     res.json(id);
//   } catch (error) {
//     console.error("Search error:", error);
//     res.status(500).json({ error: "Server error" });
//   } 
// })


export default SearchRouter; 