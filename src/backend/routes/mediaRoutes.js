import express from "express";
import { uploadMedia } from "../config/cloudinary.js"; // ✅ FIXED: Changed 'upload' to 'uploadMedia'
import cloudinary from "../config/cloudinary.js"; // ✅ FIXED: Import default export separately
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ============================================
// UPLOAD MEDIA (Images/Videos)
// ============================================
router.post(
  "/upload",
  protect,
  uploadMedia.array("media", 4),
  async (req, res) => {
    try {
      console.log("📤 Media upload request received");
      console.log("User:", req.user.username);
      console.log("Files count:", req.files?.length || 0);

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      // Process uploaded files
      const mediaUrls = req.files.map((file) => {
        console.log("✅ Uploaded:", file.originalname, "→", file.path);

        return {
          type: file.mimetype.startsWith("image/") ? "image" : "video",
          url: file.path, // Cloudinary URL
          publicId: file.filename, // Cloudinary public ID
          altText: "",
        };
      });

      console.log(`✅ Successfully uploaded ${mediaUrls.length} file(s)`);

      res.json({
        success: true,
        message: `${mediaUrls.length} file(s) uploaded successfully`,
        data: { media: mediaUrls },
      });
    } catch (error) {
      console.error("❌ Media upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload media",
        error: error.message,
      });
    }
  }
);

// ============================================
// DELETE MEDIA (from Cloudinary)
// ============================================
router.delete("/delete/:publicId", protect, async (req, res) => {
  try {
    console.log("🗑️ Deleting media:", req.params.publicId);

    const publicId = req.params.publicId;
    const resourceType = req.query.type === "video" ? "video" : "image";

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "ok" || result.result === "not found") {
      console.log("✅ Media deleted successfully");
      res.json({
        success: true,
        message: "Media deleted successfully",
      });
    } else {
      throw new Error("Failed to delete media from cloud");
    }
  } catch (error) {
    console.error("❌ Media deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete media",
      error: error.message,
    });
  }
});

// ============================================
// TEST ENDPOINT (to verify Cloudinary works)
// ============================================
router.get("/test", protect, (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  res.json({
    success: true,
    message: "Cloudinary configuration test",
    config: {
      cloudName: cloudName ? "✅ Set" : "❌ Missing",
      apiKey: apiKey ? "✅ Set" : "❌ Missing",
      apiSecret: apiSecret ? "✅ Set" : "❌ Missing",
      allConfigured: !!(cloudName && apiKey && apiSecret),
    },
  });
});

export default router;
