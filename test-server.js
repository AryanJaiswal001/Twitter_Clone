import express from "express";

const app = express();
const PORT = 4000;

app.get("/test", (req, res) => {
  res.json({ message: "Test server works!" });
});

const server = app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});

console.log("Server object:", typeof server);
console.log("Keeping process alive...");

// Keep process alive
setInterval(() => {
  console.log("Still running...");
}, 5000);
