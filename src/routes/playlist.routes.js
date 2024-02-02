import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
} from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJwt);

router.route("/").post(createPlaylist);

router.route("/:playlistId").get(getPlaylistById);
//   .patch(updatePlaylist)
//   .delete(deletePlaylist);

// router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
// router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/users/:userId").get(getUserPlaylists);

export default router;
