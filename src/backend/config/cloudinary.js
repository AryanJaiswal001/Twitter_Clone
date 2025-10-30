import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

// Load environment variables FIRST
dotenv.config();

console.log("🔧 Configuring Cloudinary...");

//Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration
console.log("☁️ Cloudinary Config:");
console.log(
  "  Cloud Name:",
  process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ NOT SET"
);
console.log(
  "  API Key:",
  process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ NOT SET"
);
console.log(
  "  API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ NOT SET"
);

//Configure storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "twitter_clone/images",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 1200, height: 1200, crop: "limit" }],
    resource_type: "image",
  },
});

//Configure storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "twitter_clone/videos",
    allowed_formats: ["mp4", "mov", "avi", "webm"],
    resource_type: "video",
  },
});

//Create multer upload middleware
export const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, //5 MB limit for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

export const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, //50mb for video
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed!"), false);
    }
  },
});

//Combined upload of both (FIXED TYPOS)
export const uploadMedia = multer({
  storage: imageStorage, //Will be dynamically changed
  limits: {
    fileSize: 50 * 1024 * 1024, //50MB max
  },
  fileFilter: (req, file, cb) => {
    // ✅ FIXED: Changed "starts" to "startsWith"
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      // ✅ FIXED: Typo in error message
      cb(new Error("Only image and video files are allowed!"), false);
    }
  },
});

console.log("✅ Cloudinary configuration complete\n");

export default cloudinary;
