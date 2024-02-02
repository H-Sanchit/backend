import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Name for the playlist required.");
  }
  if (!description?.trim()) {
    throw new ApiError(400, "Description is required to create a playlist.");
  }
  const createPlaylistDB = await Playlist.create({
    name,
    description,
    owner: req.user?._conditions?._id,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, createPlaylistDB, "Playlist created Successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log(userId);

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Something went wrong while fetching ID");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "No user exist");
  }
  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "vidoes",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        updatedAt: 1,
        videos: 1,
        owner: {
          fullName: 1,
          "avatar.url": 1,
          username: 1,
        },
      },
    },
  ]);
  if (!playlists) {
    throw new ApiError(400, "There is no playlist created by");
  }

  return res.status(200).json(new ApiResponse(200, playlists, "yeah"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(
      400,
      "This playlist does not exist or is deleted by user"
    );
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "can not find the required playlist");
  }
  const playlistVideos = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "vidoes",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        updatedAt: 1,
        videos: 1,
        owner: {
          fullName: 1,
          username: 1,
          "avatar.url": 1,
        },
      },
    },
  ]);

  if (!playlistVideos) {
    throw new ApiError(400, "no playlist is available");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlistVideos,
        "PLaylist successfully fetched by playlistID"
      )
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Either Playlist or Video ID is invalid");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(400, "playlist does not exist");
  }
  if (!video) {
    throw new ApiError(400, "video does not exist");
  }
  if (playlist.owner.toString() !== req.user?._conditions?._id.toString()) {
    throw new ApiError(400, "Owner can only add videos to playlist");
  }
  const updatePlaylists = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );

  if (!updatePlaylists) {
    throw new ApiError(500, "unable to add the video to your playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatePlaylists, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Video.findById(videoId);

  if (!playlist) {
    throw new ApiError(400, "Can not find the playlist");
  }
  if (!video) {
    throw new ApiError(400, "Can not find the required video ");
  }
  if (playlist.owner.toString() !== req.user?._conditions?._id.toString()) {
    throw new ApiError(400, "Only owner of playlist can remove videos.");
  }

  const updatePlaylists = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  if (!updatePlaylist) {
    throw new ApiError(500, "Unable to remoce the video from Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatePlaylists, "Video removed Successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist ID is not valid");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "Playlist does not exist");
  }
  if (playlist.owner.toString() !== req.user?._conditions?._id.toString()) {
    throw new ApiError(400, "Playlist can only be delted by it's owner");
  }

  const playlistDelete = await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Playlist ID is not valid");
  }
  if (!name.trim() || !description.trim()) {
    throw new ApiError(400, "Require both name & description");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(400, "No playlist found");
  }
  if (playlist.owner.toString() !== req.user?._conditions?._id.toString()) {
    throw new ApiError(400, "Only owner can update the playlist");
  }
  const updatePlaylists = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );
  if (!updatePlaylists) {
    throw new ApiError(500, "Unable to Update the Playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatePlaylists, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
