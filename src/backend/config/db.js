import mongoose from "mongoose";

const connectDB = async () => {
  try {
    //MongoDB connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    //Connect to mongoDB
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/twitter_clone",
      options
    );
    console.log(`MongoDB Connected Yayyy`);
    console.log(`Database host ${conn.connection.host}`);
    console.log(`Database Name ${conn.connection.name}`);

    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to MongoDB");
    });
    mongoose.connection.on("error", (err) => {
      console.log("MongoDB connection error", err);
    });
    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected from MOngoDB");
    });
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection failed:", error.message);
    throw error; // Re-throw the error so server knows connection failed
  }
};
export default connectDB;
