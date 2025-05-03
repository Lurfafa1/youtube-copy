import { Router } from "express";
import { createLike, countLikes } from "../controllers/likes.controller.js"; // Fixed path
import { verifyToken } from "../middlewares/auth.middleware.js";
import { validateLike } from "../middlewares/validateLike.middleware.js";

const likesRouter = Router();

// Middleware to parse URL parameters
const parseParams = (req, _, next) => {
    const { likedType, likedId } = req.params;

    // Set parameters based on request method
    if (req.method === 'POST') {
        req.body.likedType = likedType;
        req.body.liked = likedId;
    } else {
        req.query.likedType = likedType;
        req.query.liked = likedId;
    }

    next();
};

// Like/Unlike routes
// Protected routes - need authentication
likesRouter.route('/:likedType/:likedId')
    .post(
        verifyToken,
        parseParams,
        validateLike,
        createLike
    );

// Like count routes
// Public route - no auth needed
likesRouter.route('/:likedType/:likedId/count')
    .get(
        parseParams,
        validateLike,
        countLikes
    );

export { likesRouter };