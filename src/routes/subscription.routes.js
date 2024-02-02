import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";
import { get } from "mongoose";

const router = Router();
router
  .route("/c/:channelId")
  // .get(getSubscribedChannels)
  .post(toggleSubscription);

router.route("/n/:channelId").get(getUserChannelSubscribers);
router.route("/s/:subscriberId").get(getSubscribedChannels);

// router.route("/u/:subscriberId").get(getUserChannelSubscribers);

export default router;
