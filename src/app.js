import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("Public"));
app.use(cookieParser());

//import Routes
import userRouter from "./routes/user.routes.js";
import tweetsRouter from "./routes/tweets.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import videoRouter from "./routes/videos.routes.js";

app.use("/users", userRouter);
app.use("/tweets", tweetsRouter);
app.use("/subscription", subscriptionRouter);
app.use("/playlist", playlistRouter);
app.use("/video", videoRouter);

export default app;
