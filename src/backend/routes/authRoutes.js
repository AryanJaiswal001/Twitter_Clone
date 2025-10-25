import express from "express";
import User from "../models/User.js"
import {generateToken} from "../utils/jwt.js"
import { protect } from "../middleware/auth.js";

const router = express.Router();

//Register

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;
    //Validation
    if (!fullName || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    //Check user exists or not
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }
    //Create new user (password will be hashed)
    const user = await User.create({
      fullName,
      email,
      username,
      password,
    });

    //Generate JWT Token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Register error", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

//Login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    //Validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide the necessary fields",
      });
    }
    //Find user
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentails",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //Generate token
    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: "Login Successful",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error',error);
    res.status(500).json({
      success:false,
      message:error.message
    });
  }
});

//Logout
router.post("/logout", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});


//Get current user
router.get("/me", protect, async (req, res) => {
  try {
    // req.user is set by the protect middleware
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
