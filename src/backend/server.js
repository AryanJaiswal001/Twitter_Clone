import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

//Load environment config FIRST
dotenv.config();

// Debug logs
console.log("\n🔍 Environment Check:");
console.log("PORT:", process.env.PORT || 5000);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Set" : "❌ NOT SET");
console.log("---\n");

//Load database
import connectDB from "./config/db.js";

//Import routes
import authRoutes from "./routes/authRoutes.js";

//Import tweet routes
import tweetRoutes from "./routes/tweetRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Create Express App
const app = express();
const PORT = process.env.PORT || 5000;

//Middleware (MUST BE FIRST)
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/src", express.static(path.join(__dirname, "../")));
app.use("/public", express.static(path.join(__dirname, "../../public")));

// ============================================
// ROUTES (AFTER MIDDLEWARE)
// ============================================

// Health Check endpoint
app.get("/api/health", (req, res) => {
  console.log("✅ Health check hit");
  res.status(200).json({
    status: "OK",
    message: "Twitter Clone API is running",
    timestamp: new Date().toISOString(),
    env: {
      port: PORT,
      nodeEnv: process.env.NODE_ENV || "development",
      jwtConfigured: !!process.env.JWT_SECRET,
      dbConfigured: !!process.env.MONGODB_URI,
    },
  });
});

//API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tweets", tweetRoutes);

//HTML Files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/register.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/dashboard.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/login.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/login.html"));
});

app.get("/register.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/register.html"));
});

app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/dashboard.html"));
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/index.html"));
});

// ============================================
// ERROR HANDLERS (MUST BE LAST)
// ============================================

//Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

//404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log("\n" + "=".repeat(60));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend: http://localhost:${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
      console.log(`📝 Register: http://localhost:${PORT}/api/auth/register`);
      console.log(`🔐 Login: http://localhost:${PORT}/api/auth/login`);
      console.log("=".repeat(60) + "\n");
    });

    // Handle server errors
    server.on("error", (error) => {
      console.error("❌ Server error:", error.message);
      process.exit(1);
    });

    // Keep the process alive
    process.on("SIGTERM", () => {
      console.log("👋 SIGTERM signal received: closing HTTP server");
      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

// export default app; // Not needed when running directly
