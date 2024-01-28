import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
  {
    owner: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    content: {
      type: String,
      required: true,
      maxLength: 280,
    },
  },
  { timestamps: true }
);

export const Tweets = mongoose.model("Tweet", tweetSchema);
