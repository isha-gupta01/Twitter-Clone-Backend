import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/usersModel.js"; // Import User model
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user details from database
    const user = await User.findById(decoded.userId).select("username profileImage");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = {
      userId: decoded.userId, // Ensure userId is included
      username: user.username, // Attach username
      profileImage: user.profileImage, // Attach profile image
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export default authenticateToken;
