import { Tweets } from "../models/tweets.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (content.trim() === "") {
    throw new ApiError(400, "Can not post an Empty tweet");
  }

  const tweet = await Tweets.create({
    content,
    owner: req.user?._conditions?._id,
  });
  if (!tweet) {
    throw new ApiError(400, "failed to create tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Successfully Tweeted"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content) {
    throw new ApiError(400, "Can not post empty Tweet");
  }
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Tweet ID does not exist");
  }

  const tweet = await Tweets.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }
  if (tweet?.owner.toString() !== req?.user?._conditions._id) {
    throw new ApiError(400, "Can only be edited by the Owner");
  }

  const newTweet = await Tweets.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!newTweet) {
    throw new ApiError(500, "can not update the tweet");
  }

  return res.status(200).json(new ApiResponse(200, newTweet, "tweet updated"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const tweet = await Tweets.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "Tweet Id not valid");
  }
  if (tweet.owner.toString() !== req.user?._conditions?._id) {
    throw new ApiError(400, "Can only be delted by the owner");
  }
  const tweetDel = await Tweets.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, tweetDel, "Tweet deleted Successfully"));
});

const getUserTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "User Id not valid");
  }

  const tweet = await Tweets.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },

    {
      $addFields: {
        ownerDetail: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        content: 1,
        username: 1,
        createdAt: 1,
      },
    },
  ]);
  if (!tweet) {
    throw new ApiError(400, "tweets was not fetched");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet fetched Success"));
});
export { createTweet, updateTweet, deleteTweet, getUserTweet };
