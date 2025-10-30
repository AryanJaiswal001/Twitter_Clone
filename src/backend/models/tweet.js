import mongoose, { Schema } from 'mongoose';

const tweetSchema = new mongoose.Schema(
    {
        //Content of the tweet
        content:{
            type:String,
            required:[true,"Tweet content is required"],
            maxlength:[280,"Tweet not to exceed 280 characters"],
            trim:true
        },

        //Person posting the tweet
        author:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        },

        //Media attachments
        media:[{
            type:{
                type:String,
                enum:['image','video','gif'],
            },
            url:String,
            altText:String,
            publicId:String
        }
    ],

    //Tweet engagement metrics 
    likes:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'User'
        }
    ],

    retweets:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ],

    //Reply/thread functionality

    replyTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Tweet',
        default:null
    },

    //Bookmarks
    bookmarkedBy:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ],

    //Tweet visibility 
    isDeleted:{
        type:Boolean,
        default:false
    },

    //Views
    views:{
        type:Number,
        default:0
    }

},
    {
        timestamps:true,
        toJSON:{virtuals:true},
        toObject:{virtuals:true}
    }
);


//Finding tweets by author name
tweetSchema.index({author:1, createdAt:-1});

//Index for the finding tweets by creation date
tweetSchema.index({createdAt:-1});

//Index for finding replies 
tweetSchema.index({replyTo:1});

//Check if a user has liked this tweet
tweetSchema.methods.isLikedBy=function(userId){
    return this.likes.some(like=>like.toString()===userId.toString());
}

//Retweet
tweetSchema.methods.isRetweetedBy=function(userId){
    return this.retweets.some(retweet=>retweet.toString()===userId.toString());

}

//STATIC METHODS

tweetSchema.statics.getWithAuthor=function (filter={}){
    return this.find({...filter,isDeleted:false})
    .populate('author','fullName username avatar')
    .sort({createdAt:-1});//Newest first
};

//Get feed for a specific user
tweetSchema.statics.getFeed=async function (userId,limit=20,skip=0) {
    const User=mongoose.model("User");
    const user=await User.findById(userId);

    if(!user) throw new Error('User not found');

    //Get Id of users this user follows
    const followedUserIds=[...(user.following||[]),userId];

    return this.find({
        author:{$in:followedUserIds},
        isDeleted:false,
        replyTo:null
    })
    .populate('author','fullname username avatar verified')
    .sort({createdAt:-1})
    .limit(limit)
    .skip(skip);
    
};

const Tweet=mongoose.model('Tweet',tweetSchema)

export default Tweet;