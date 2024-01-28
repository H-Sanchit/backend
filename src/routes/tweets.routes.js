import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweet,
  updateTweet,
} from "../controllers/tweets.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJwt); //apply the verify middleware to all the files.

router.route("/").post(createTweet);
router.route("/:userId").get(getUserTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
