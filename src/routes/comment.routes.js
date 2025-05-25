import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
    createComment,
    getComments,
    updateComment,
    deleteComment,
} from "../controllers/comment.controller.js";

const commentRouter = Router();


commentRouter.route('/')
    .post(verifyToken, createComment)
    .get(getComments);

commentRouter.route('/:commentId')
    .put(verifyToken, updateComment)
    .delete(verifyToken, deleteComment);

commentRouter.route('/:commentId/like')
    .post(verifyToken, toggleCommentLike)
    .delete(verifyToken, toggleCommentLike);

export { commentRouter };