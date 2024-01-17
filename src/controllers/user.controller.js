import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnClodinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get data from user/frontend
  const { username, email, fullName } = req.body;

  //if the given fields are empty throw an error
  if ([username, email, fullName].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All Fields Required");
  }

  //check if username or email already exist with DB
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new ApiError(409, "Username or Email already exist.");
  }

  //check for images if they are uploaded
  const avatarLocalPath = req.field?.avatar[0]?.path;
  const coverImageLocalPath = req.field?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is Required.");
  }

  //uploading Avatar & Coverimage to cloudinary.
  const avatar = await uploadOnClodinary(avatarLocalPath);
  const coverImage = await uploadOnClodinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is Required");
  }

  //creating a user
  const user = User.create({
    fullName,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    password,
  });

  //checking if user was created in database or we got empty
  const createdUser = await User.findById(_id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  //returning response to User
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user was registered successfuly"));
});

export { registerUser };
