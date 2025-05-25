import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { createComment, getComments } from "../controllers/comment.controller.js";
import {
    createPost,
    updatePost,
    deletePost,
    likePost,
    checkLikeStatus,
    getPostById,
    getAllPosts,
    getPostsByUser
} from "../controllers/post.controller.js";

const postRouter = Router();

// Root route
postRouter.route('/')
    .get(getAllPosts)
    .post(verifyToken, upload.single("thumbnail"), createPost);

// Post by ID routes
postRouter.route('/:postId')
    .get(getPostById)
    .put(verifyToken, upload.single("thumbnail"), updatePost)
    .delete(verifyToken, deletePost);



// Interaction routes
postRouter.route('/:postId/like')
    .post(verifyToken, likePost) // Like post
    .delete(verifyToken, likePost) // Unlike post
    .get(verifyToken, checkLikeStatus); // Check like status



// Optional: Add these if you need comment functionality
postRouter.route('/:postId/comments')
    .get(getComments)
    .post(verifyToken, createComment);

// Add posts made by user like youtube
postRouter.route('/user/:userId/posts')
    .get((req, res) => {
        const userId = req.params.userId;
        getPostsByUser(req, res, userId);
    });

export { postRouter };