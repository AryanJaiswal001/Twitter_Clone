import jwt from "jsonwebtoken";
import User from "../models/User.js";

//Protect routes
export const protect=async(req,res,next)=>{
    try{
        let token;

        //Check token exists
        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer"))
        {
        //Extract token 
        token=req.headers.authorization.split(' ')[1];
        }
    
    if (!token){
        return res.status(401).json({
            success:false,
            message:'Not authorised, no token provided'
        });

    }
    //Verify
    const decoded=jwt.verify(token,process.env.JWT_SECRET);

    //Get user from database
    req.user=await User.findById(decoded.id).select('-password');

    if(!req.user){
        return res.status(401).json({
            success:false,
            message:'Not authorised, user not found'
        });
    }
    next();
}

    catch(error){
        console.error(error);
        return res.status(401).json({
            success:false,
            message:'Not authorised, token failed'
        });
    }
}