import { Schema } from "mongoose";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "User-name is required"],
      lowercase: true,
      unique: [true, "This username is already taken"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "This email is already Registered"],
      lowercase: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
    },
    avatar: {
      type: String,
      required: [true, "Avatar Photo is required"],
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return Jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullName: this.fullName,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return Jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    }
  );
};

export const User = mongoose.model("User", userSchema);
