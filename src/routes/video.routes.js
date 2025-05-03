import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
    uploadVideo,
    deleteVideo,
    videos
} from "../controllers/video.controller.js";

const videoRouter = Router();

videoRouter.route('/')
    .get(videos);

videoRouter.route('/upload')
    .post(
        verifyToken,
        upload.fields([
            { name: 'videoFile', maxCount: 1 },
            { name: 'thumbnail', maxCount: 1 }
        ]),
        uploadVideo
    );

videoRouter.route('/delete/:videoId')
    .delete(
        verifyToken,
        deleteVideo
    );

export { videoRouter };