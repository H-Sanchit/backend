import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const pipeline = [];
    if (query) {
      pipeline.push({
        $search: {
          index: "search-videos",
          text: {
            query: query,
            path: ["title", "description"],
          },
        },
      });
    }
    if (userId) {
      if (!isValidObjectId(userId)) {
        throw new ApiError(400, "user can not be found");
      }
      pipeline.push({
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      });
    }

    pipeline.push({ $match: { isPublished: true } });

    if (sortBy && sortType) {
      pipeline.push({
        $sort: {
          [sortBy]: sortType === "asc" ? 1 : -1,
        },
      });
    } else {
      pipeline.push({
        $sort: {
          createdAt: -1,
        },
      });
    }

    pipeline.push(
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
                fullname: 1,
                "avatar.url": 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$owner",
      }
    );

    console.log(pipeline);
    const videoAggregation = await Video.aggregate(pipeline);
    console.log(videoAggregation);

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const video = await Video.aggregatePaginate(videoAggregation, options);
    console.log(video);

    return res
      .status(200)
      .json(new ApiResponse(200, video, "video fetched successfully"));
  } catch (error) {
    throw new ApiError(400, error, "something went wrong");
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Title and Description both required.");
  }
  const localVideoFile = req.files?.videoFile[0]?.path;
  const localThumbnail = req.files?.thumbnail[0]?.path;

  if (!localVideoFile) {
    throw new ApiError(400, "videofile is required");
  }
  if (!localThumbnail) {
    throw new ApiError(400, "thumbnail is required");
  }
  const videoFile = await uploadOnCloudinary(localVideoFile);
  const thumbnail = await uploadOnCloudinary(localThumbnail);

  if (!videoFile) {
    throw new ApiError(400, "video file not found");
  }
  if (!thumbnail) {
    throw new ApiError(400, "thumbnail can not be found");
  }

  const video = await Video.create({
    title,
    description,
    duration: videoFile.duration,
    isPublished: true,
    owner: req.user?._conditions?._id,
    thumbnail: thumbnail.url,
    videoFile: videoFile.url,
  });
  const videoUploaded = await Video.findById(video._id);
  if (!videoUploaded) {
    throw new ApiError(500, "Was not able to upload video.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    throw new ApiError(400, "videoID is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "No video found.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId format");
  }
  if ([title, description].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "title and description are required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "No video was found.");
  }

  if (video.owner?.toString() !== req.user?._conditions?._id.toString()) {
    throw new ApiError(400, "Only the owner can update the video options");
  }

  const localThumbnail = req.file?.path;
  const thumbnailDelete = video.thumbnail;

  if (!localThumbnail) {
    throw new ApiError(400, "thumbnail not found");
  }

  await deleteFromCloudinary(thumbnailDelete);

  console.log(localThumbnail);

  const thumbnail = await uploadOnCloudinary(localThumbnail);
  if (!thumbnail) {
    throw new ApiError(400, "error while uploading thumbnail");
  }

  const updateVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    }
  );
  if (!updateVideo) {
    throw new ApiError(500, "Error while updating video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  console.log(video);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  if (video.owner.toString() !== req.user?._conditions._id.toString()) {
    throw new ApiError(400, "Only owner of the video can delete it.");
  }

  const deleteVideo = await Video.findByIdAndDelete(videoId);

  await deleteFromCloudinary(video.videoFile);
  await deleteFromCloudinary(video.thumbnail);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video ID is not valid");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video not found");
  }
  if (video.owner.toString() !== req.user?._conditions?._id.toString()) {
    throw new ApiError(400, "Only owner can change the settings");
  }
  const toggleStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    {
      new: true,
    }
  );
  if (!toggleStatus) {
    throw new ApiError(500, "something went wrong while changing the status");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, toggleStatus, "Status changed successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
