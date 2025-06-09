import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
    createSubscription,
    removeSubscription,
    getUserSubscriptions,
    updateSubscription
} from "../controllers/subs.controller.js";

const subscribeRouter = Router();

// Endpoint to subscribe to a channel (and get user subscriptions):
// POST: to create a subscription (i.e. subscribe to a channel)
// GET: to fetch all subscriptions for the logged-in user.
subscribeRouter.route('/')
    .post(verifyToken, createSubscription)
    .get(verifyToken, getUserSubscriptions);

// Endpoint to unsubscribe from (or update) a subscription for a specific channel:
// DELETE: to remove a subscription (i.e. unsubscribe)
// PATCH: to update subscription details if needed.
subscribeRouter.route('/:channelId')
    .delete(verifyToken, removeSubscription)
    .patch(verifyToken, updateSubscription);

export { subscribeRouter };