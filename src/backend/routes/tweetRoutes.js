import express from "express";
import Tweet from "../models/tweet.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

//Create Tweet
//POST /api/tweets

router.post("/", protect, async (req, res) => {
  try {
    console.log("📝 Creating new tweet...");
    console.log("User ID:", req.user._id);
    console.log("Content:", req.body.content);
    console.log("Media:", req.body.media);
    console.log("Poll", req.body.poll);

    const { content, media, poll } = req.body;

    //Validation
    if (
      (!content || content.trim().length === 0) &&
      (!media || media.length === 0) &&
      (!poll || !poll.options || poll.options.length < 2)
    ) {
      return res.status(400).json({
        success: false,
        message: "Tweet content is required either post, media or poll",
      });
    }
    if (content && content.length > 280) {
      return res.status(400).json({
        success: false,
        message: "Tweet exceeds 280 character limit",
      });
    }

    //Validate media array
    if (media && media.length > 4) {
      return res.status(400).json({
        success: false,
        message: "Tweet exceeds 280 character limit",
      });
    }

    //Poll Logic
    let pollData = null;
    if (poll) {
      if (!poll.options || poll.options.length < 2 || poll.options.length > 4) {
        return res.status(400).json({
          success: false,
          message: "Poll must have 2-4 options",
        });
      }

      const duration = poll.duration || 1440;
      if (duration < 5 || duration > 10080) {
        return res.status(400).json({
          success: false,
          message: "Poll duration must be between 5 min and 7 days",
        });
      }

      //Initialize poll data
      pollData = {
        options: poll.options.map((option) => ({
          text: option.text || option,
          votes: [],
        })),
        duration: duration,
        endsAt: new Date(Date.now() + duration * 60 * 1000),
      };
    }

    //Create tweet
    const tweet = await Tweet.create({
      content: content.trim(),
      author: req.user._id,
      media: media || [],
      poll: pollData,
    });

    //Populate author info before sending

    await tweet.populate("author", "fullName username avatar");

    console.log("Tweet created", tweet._id);
    console.log("Media files", media?.length || 0);
    console.log("Has poll", !!poll);

    res.status(201).json({
      success: true,
      message: "Tweet posted successfully",
      data: { tweet },
    });
  } catch (error) {
    console.error("Error creating tweet", error);
    res.status(500).json({
      success: false,
      message: "Error posting tweet",
      error: error.message,
    });
  }
});

//GET /api/tweets
router.get("/", protect, async (req, res) => {
  try {
    console.log("Fetching tweet feed");

    const { limit = 20, skip = 0 } = req.query;

    //Get tweets from followed user
    const tweets = await Tweet.getFeed(
      req.user._id,
      parseInt(limit),
      parseInt(skip)
    );
    //Add reply count
    const tweetsWithReplyCount = await Promise.all(
      tweets.map(async (tweet) => {
        const replyCount = await Tweet.countDocuments({
          replyTo: tweet._id,
          isDeleted: false,
        });
        return {
          ...tweet.toObject(),
          repliesCount: replyCount,
        };
      })
    );
    console.log(`Found ${tweetsWithReplyCount.length} tweets`);

    res.json({
      success: true,
      count: tweetsWithReplyCount.length,
      data: { tweets: tweetsWithReplyCount },
    });
  } catch (error) {
    console.error("Error fetching tweets", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tweets",
      error: error.message,
    });
  }
});

//Get Single tweet
//GET /api/tweets/:id
router.get("/:id", protect, async (req, res) => {
  try {
    console.log("Fetching tweet", req.params.id);

    const tweet = await Tweet.findById(req.params.id).populate(
      "author",
      "fullName username avatar verified"
    );

    if (!tweet || tweet.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Error fetching tweets",
      });
    }

    //Increment view count
    tweet.views += 1;
    await tweet.save();

    console.log("Tweet found");

    res.json({
      success: true,
      data: { tweet },
    });
  } catch (error) {
    console.log("Error fetching tweet", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tweet",
      error: error.message,
    });
  }
});

//Get user tweets
//GET /api/tweets/user/:userId
router.get("/user/:userId", protect, async (req, res) => {
  try {
    console.log("Fetching tweets for user", req.params.userId);

    const tweets = await Tweet.find({
      author: req.params.userId,
      isDeleted: false,
      replyTo: null,
    })
      .populate("author", "fullName username avatar verified")
      .sort({ createdAt: -1 });

    console.log(`Found ${tweets.length} Tweets`);

    res.json({
      success: true,
      count: tweets.length,
      data: { tweets },
    });
  } catch (error) {
    console.error("Error fetching user tweets", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tweets",
      error: error.message,
    });
  }
});

//Like Tweet
//POST /api/tweets/:id/like

router.post("/:id/like", protect, async (req, res) => {
  try {
    console.log("Tweet Liked!!", req.params.id);
    const tweet = await Tweet.findById(req.params.id);

    if (!tweet || tweet.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Tweet not found",
      });
    }
    //Check if already liked
    const alreadyLiked = tweet.isLikedBy(req.user._id);

    if (alreadyLiked) {
      //Unlike
      tweet.likes = tweet.likes.filter(
        (like) => like.toString() !== req.user._id.toString()
      );
      console.log("Tweet unliked");
    } else {
      //Like
      tweet.likes.push(req.user._id);
      console.log("Tweet liked");
    }

    await tweet.save();

    res.json({
      success: true,
      message: alreadyLiked ? "Tweet liked" : "Tweet liked",
      data: {
        likesCount: tweet.likesCount,
        isLiked: !alreadyLiked,
      },
    });
  } catch (error) {
    console.error("Error liking tweet", error);
    res.status(500).json({
      success: false,
      message: "Error liking tweet",
      error: error.message,
    });
  }
});

//Retweet
//POST /api/tweets/:id/retweet

router.post("/:id/retweet", protect, async (req, res) => {
  try {
    console.log("Retweeting Tweet", req.params.id);

    const tweet = await Tweet.findById(req.params.id);

    if (!tweet || tweet.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Tweet not found",
      });
    }
    //Check user already retweeted
    const alreadyRetweeted = tweet.isRetweetedBy(req.user._id);

    if (alreadyRetweeted) {
      //Untweet
      tweet.retweets = tweet.retweets.filter(
        (retweet) => retweet.toString() !== req.user._id.toString()
      );
      console.log("Retweet removed");
    } else {
      //Retweet
      tweet.retweets.push(req.user._id);
      console.log("Tweet retweeted");
    }
    await tweet.save();

    res.json({
      success: true,
      message: alreadyRetweeted ? "Retweet Removed" : "Tweet retweeted",
      data: {
        retweetsCount: tweet.retweetsCount,
        isRetweeted: !alreadyRetweeted,
      },
    });
  } catch (error) {
    console.log("Error retweeting", error);
    res.status(500).json({
      success: false,
      message: "Error retweeting",
      error: error.message,
    });
  }
});

//Delete tweet
//DELETE /api/tweets/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    console.log("Deleting tweet", req.params.id);

    const tweet = await Tweet.findById(req.params.id);

    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: "Tweet not found",
      });
    }
    //Check if user owns the tweet
    if (tweet.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own tweets",
      });
    }
    //Soft delete (mark as deleted)
    (tweet.isDeleted = true), await tweet.save();

    console.log("Tweet deleted");

    res.json({
      success: true,
      message: "Tweet deleted sucessfully",
    });
  } catch (error) {
    console.error("Error deleting tweet", error);
    res.status(500).json({
      success: false,
      message: "Error deleting tweet",
      error: error.message,
    });
  }
});

//REPLY TO TWEET//
// ============================================
// POST /api/tweets/:id/reply
router.post("/:id/reply", protect, async (req, res) => {
  try {
    console.log("💬 Replying to tweet:", req.params.id);

    const { content } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reply content is required",
      });
    }

    // Check if parent tweet exists
    const parentTweet = await Tweet.findById(req.params.id);
    if (!parentTweet || parentTweet.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Tweet not found",
      });
    }

    // Create reply
    const reply = await Tweet.create({
      content: content.trim(),
      author: req.user._id,
      replyTo: req.params.id,
    });

    await reply.populate("author", "fullName username avatar");

    console.log("✅ Reply created");

    res.status(201).json({
      success: true,
      message: "Reply posted successfully",
      data: { tweet: reply },
    });
  } catch (error) {
    console.error("❌ Error posting reply:", error);
    res.status(500).json({
      success: false,
      message: "Error posting reply",
      error: error.message,
    });
  }
});

//Get Replies to a tweet
//GET /api/tweets/:id/replies
router.get("/:id/replies", protect, async (req, res) => {
  try {
    console.log("Fetching replies for tweet", req.params.id);

    const replies = await Tweet.find({
      replyTo: req.params.id,
      isDeleted: false,
    })
      .populate("author", "fullName username avatar verified")
      .sort({ createdAt: 1 }); //Oldest first

    console.log(`Found ${replies.length} replies`);

    res.json({
      success: true,
      count: replies.length,
      data: { replies },
    });
  } catch (error) {
    console.error("Error fetching replies", error);
    res.status(500).json({
      success: false,
      message: "Error fetching replies",
      error: error.message,
    });
  }
});

//POST /api/tweets/:id/vote
router.post("/:id/vote", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user._id;

    console.log(
      `User ${req.user.username} voting on poll ${id}, option ${optionIndex}`
    );

    const tweet = await Tweet.findById(id);

    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: "Tweet not found",
      });
    }

    if (!tweet.poll || !tweet.poll.options) {
      return res.status(400).json({
        success: false,
        message: "This tweet does not contain a poll",
      });
    }

    //Check if poll has ended
    if (tweet.poll.endsAt && new Date() > new Date(tweet.poll.endsAt)) {
      return res.status(400).json({
        success: false,
        message: "This poll has ended",
      });
    }

    //Check if option index is valid
    if (optionIndex < 0 || optionIndex >= tweet.poll.options.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid option",
      });
    }

    //Remove user's previous vote (if any)
    tweet.poll.options.forEach((option) => {
      const voteIndex = option.votes.indexOf(userId);
      if (voteIndex > -1) {
        option.votes.splice(voteIndex, 1);
      }
    });

    //Add new vote
    tweet.poll.options[optionIndex].votes.push(userId);

    await tweet.save();
    await tweet.populate("author", "fullName username avatar");

    console.log("Vote recorded");

    res.json({
      success: true,
      message: "Vote recorded successfully",
      data: { tweet },
    });
  } catch (error) {
    console.error("Error voting on poll", error);
    res.status(500).json({
      success: false,
      message: "Error recording vote",
      error: error.message,
    });
  }
});

export default router;
