import { Router } from "express";
import { createLike, countLikes } from "../controllers/likes.controller.js"; // Fixed path
import { verifyToken } from "../middlewares/auth.middleware.js";
import { validateLike } from "../middlewares/validateLike.middleware.js";

const likesRouter = Router();


// Like/Unlike routes
// Protected routes - need authentication
likesRouter.route('/:likedType')
    .post(
        verifyToken,
        validateLike,
        createLike
    );

// Like count routes
// Public route - no auth needed
likesRouter.route('/:likedType/:likedId/count')
    .get(
        countLikes
    );

export { likesRouter };