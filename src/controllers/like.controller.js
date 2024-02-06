import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweets } from "../models/tweets.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video ID not valid");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  const likedAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?._conditions?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready._id);
    return res.status(200).json(new ApiResponse(200, {}, "video unliked"));
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?._conditions?._id,
  });

  return res.status(200).json(new ApiResponse(200, {}, "video liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment Id not valid");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Can not find the comment");
  }

  const alreadyLikedComment = await Comment.findOne({
    comment: commentId,
    likedBy: req.user?._conditions?._id,
  });

  if (alreadyLikedComment) {
    await Comment.findByIdAndDelete(commentId);
    return res.status(new ApiResponse(200, "comment unliked"));
  }

  await Comment.create({
    comment: commentId,
    likedBy: req.user?._conditions?._id,
  });

  return res.status(200).json(new ApiResponse(200, "Comment liked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    new ApiResponse(400, "tweet ID not valid");
  }

  const tweet = await Tweets.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "No Tweet found");
  }

  const alreadyLikedTweet = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._conditions?._id,
  });

  if (alreadyLikedTweet) {
    await Like.findByIdAndDelete(alreadyLikedTweet._id);
    return res.status(200).json(new ApiResponse(200, "Tweet disliked"));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._conditions?._id,
  });

  return res.status(200).json(new ApiResponse(200, "Tweet liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._conditions?._id),
        video: { exist: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $unwind: "$userDetails",
          },
        ],
      },
    },
    {
      $unwind: "$likedVideos",
    },
    {
      $project: {
        likedVideos: {
          title: 1,
          description: 1,
          views: 1,
          videoFile: 1,
          thumbnail: 1,
          userDetails: {
            username: 1,
            email: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    },
  ]);

  if (likedVideos.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, "You have zero liked videos"));
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
