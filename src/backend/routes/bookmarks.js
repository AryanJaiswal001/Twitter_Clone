import express from "express";
import Bookmark from "../models/Bookmark";

const router=express.Router();


//Toggle bookmark a tweet
router.post('/:tweetId',auth,async(req,res)=>{
    try{
        const {tweetId}=req.params;
        const userId=req.user.userId;

        console.log(`Bookmark toggle requested - User: ${userId}, Tweet: ${tweetId}`);

        //Check if tweet exists
        const tweet=await Tweet.findById(tweetId);
        if(!tweet){
            return res.status(404).json({
                success:false,
                message:'Tweet not found'
            });
        }

        //Check if already bookmarked
        const existingBookmark=await Bookmark.findOne({
            user:userId,
            tweet:tweetId
        });

        if(existingBookmark){
            //Unbookmark
            await Bookmark.findByIdAndDelete(existingBookmark._id);
            console.log(`Tweet unbookmarked - Bookmark ID: ${existingBookmark._id}`)

            return res.json({
                success:true,
                message:'Tweet unbookmarked',
                data:{
                    isBookmarked:false
                }
            });
        }
        else{
            const newBookmark=new Bookmark({
                user: userId,
                tweet:tweetId
            });

            await newBookmark.save();
            console.log(`Tweet bookmarked - Bookmark ID: ${newBookmark._id}`);

            return res.json({
                success:true,
                message:'Tweet bookmarked',
                data:{
                    isBookmarked:true
                }
            });
        }
    }
    catch(error){
        console.error('Bookmark toggle error:',error);
        res.status(500).json({
            success:false,
            message:'Server error',
            error:error.message
        });
    }
});

//Get /api/bookmarks

router.get('/',auth, async (req,res)=>{
    try{
        const userId=req.user.userId;
        console.log(`Fetching bookmarks for user: ${userId}`);

        const bookmarks=await Bookmark.find({user:userId})
        .populate({
            path:'tweet',
            populate:{
                path:'author',
                select:'username fullName fullname avatar'
            }
        })
        .sort({createdAt:-1});

        //Filter out bookmarks where tweet was deleted
        const validBookmarks=bookmarks.filter(bookmark=>bookmark.tweet !==null);

        console.log(`Found ${validBookmarks.length} bookmarks`);

        res.json({
            success:true,
            data:{
               bookmarks:validBookmarks.map(b=>b.tweet) 
            }
        });
    }
    catch(error){
        console.error('Get bookmarks error',error);
        res.status(500).json({
            success:false,
            message:'Server error',
            error:error.message
        });
    }
});

router.get('/check/:tweetId',auth,async(req,res)=>{
    
})
