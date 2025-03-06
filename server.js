import { connectDB } from "./lib/db.js"
import express from "express"
import Tweets from "./models/tweetsModel.js"
import UserInfo from "./models/usersModel.js"
import cors from "cors"
import  jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import router from "./routes/auth.js"
import loggedUser from "./routes/loggedInUsers.js"
import tweetcount from "./routes/tweetCount.js"
import UserCrud from "./routes/users.js"
import TweetCrud from "./routes/tweets.js"
import trending from "./routes/trending.js"
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use('/trends/trendingtweets',trending);
app.use('/api/auth', router); 
app.use('/loggeduser', loggedUser); 
app.use('/tweetfetch',tweetcount)
app.use('/tweetcrud',TweetCrud);
app.use('/usercrud',UserCrud)

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data
app.use("/uploads", express.static(path.join(__dirname, "../../public/uploads")));
app.use(express.static(path.join(__dirname, "public")));

const PORT = 4000;
connectDB();


//====================To Fetch users data=================
app.get("/users", async (req, res) => {
  const users = await UserInfo.find({})
  res.json(users);
  // console.log(users);
})

//====================To Fetch tweets data=================
app.get("/tweets", async (req, res) => {
  const tweets = await Tweets.find({})
  res.json(tweets);
  // console.log(tweets);
})

//====================To authenticate user data=================
// app.post("/users", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user by email
//     const user = await UserInfo.findOne({ email });

//     if (!user) {
//       return res.status(400).json({ error: "User doesn't exist" });
//     }

//     // console.log("User Found:", user); // Debugging log

//     // Compare hashed password
//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid password" });
//     }

//     // Generate JWT Token
//     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

//     // console.log("Token is:", token); // Debugging log

//     // Send response
//     return res.json({
//       message: "Login successful",
//       token,
//       user: { email: user.email, username: user.username },
//     });

//   } catch (error) {
//     console.error("Server Error:", error);
//     return res.status(500).json({ error: "Server error" });
//   }
// });


//====================To register user=================

app.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Check if user already exists
    const existingUser = await UserInfo.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new UserInfo({
      email,
      password: hashedPassword,
      username,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log("User Registered:", newUser._id); // Debugging log

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: { email: newUser.email, username: newUser.username },
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, (req, res) => {
  console.log("Listening on the port 4000.")
})