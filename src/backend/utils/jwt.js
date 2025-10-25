import jwt from "jsonwebtoken";

//Generate jwt token
export const generateToken = (userId) => {
  // Check if JWT_SECRET exists
  if (!process.env.JWT_SECRET) {
    console.error(
      "❌ CRITICAL ERROR: JWT_SECRET is not defined in environment variables!"
    );
    console.error("Please check your .env file in the root directory");
    throw new Error("JWT_SECRET must be defined in .env file");
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

//Verify jwt token
export const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export default { generateToken, verifyToken };
