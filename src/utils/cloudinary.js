import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLODINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("uploading to cloudinary rn");
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
  }
};

const deleteFromCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      throw new ApiError(400, "File path missing");
    }

    const response = await cloudinary.uploader.destroy(localFilePath);
    console.log("File deleted from cloudinary successfully");
    return response;
  } catch (error) {
    throw new ApiError(500, error || "Error while deleting file");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
