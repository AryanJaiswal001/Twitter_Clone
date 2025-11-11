🐦 AI-Powered Twitter Clone

A full-stack social media platform built from scratch using HTML, CSS, JavaScript, Node.js, Express, and MongoDB, integrated with AI for Fake News Detection and Cloudinary for media storage.

🚀 Features

✨ User Authentication (JWT-based)
💬 Create, edit, and delete posts
📸 Upload images & videos (Cloudinary integration)
📅 Schedule posts using a calendar
📍 Share location with posts
📊 Create and vote in polls
😊 Emoji picker for posts
💡 Comment & like functionality
🧠 Fake News Detection using NLP model (by Aakash Yadav)
🔐 Secure Express backend with environment variables
☁️ MongoDB Atlas for cloud-based data storage

🧰 Tech Stack

Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express.js
Database: MongoDB (Mongoose)
AI Integration: Python (Flask API for Fake News Model)
Cloud Storage: Cloudinary
Authentication: JWT
Version Control: Git & GitHub

🧠 Architecture Overview
Frontend (HTML/JS)
      │
      ▼
Node.js + Express Backend
      │
      ├── REST APIs (Posts, Auth, Media, Polls, Location)
      ├── AI Endpoint → Python Fake News Model
      └── MongoDB (Data Storage)

⚙️ Setup Instructions

1)Clone the Repository

git clone https://github.com/AryanJaiswal001/Twitter_Clone.git
cd Twitter_Clone

2)Install Dependencies

npm install


3)Environment Variables
Create a .env file in the root directory and include:

MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_secret>
CLOUDINARY_CLOUD_NAME=<your_name>
CLOUDINARY_API_KEY=<your_key>
CLOUDINARY_API_SECRET=<your_secret>
FAKE_NEWS_MODEL_URL=<python_api_endpoint>


4)Run the Server

npm start
or for dev mode:
npm run dev


Visit the App

http://localhost:5000

🌱 Future Roadmap

💬 Real-time chat system (Socket.io)
👤 Advanced user profiles (followers/following, bios)
🧩 AI-based toxic comment detection
📈 Analytics dashboard for engagement metrics
🌐 Full deployment with scaling and CDN optimization

🤝 Contributors
Aryan Jaiswal — Full Stack Development & Architecture
Aakash Yadav — AI Model Integration & Fake News Detection

🧾 License
This project is licensed under the MIT License — feel free to fork, modify, and learn from it.
