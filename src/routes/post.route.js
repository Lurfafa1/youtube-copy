import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    createPost,
    updatePost,
    deletePost,
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


// Add posts made by user like youtube
postRouter.route('/user/:userId/posts')
    .get((req, res) => {
        const userId = req.params.userId;
        getPostsByUser(req, res, userId);
    });

export { postRouter };