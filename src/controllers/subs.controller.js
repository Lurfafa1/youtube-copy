import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiErrors.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import mongoose from 'mongoose';
import { Subscription } from '../models/subscriptions.models.js';


//   Subscribe to a channel
//   req - Express request object
//   res - Express response object
//   Returns subscription details

const createSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.body;

    // Validate channelId
    if (!channelId || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Find channel
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Prevent self-subscription
    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    // Check for existing subscription
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSubscription) {
        throw new ApiError(400, "You are already subscribed to this channel");
    }

    // Create subscription
    const subscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, subscription, "Subscribed successfully")
        );
});


//   Unsubscribe from a channel
//   req - Express request object
//   res - Express response object
//   Returns unsubscription confirmation

const removeSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const deletedSubscription = await Subscription.findOneAndDelete({
        subscriber: req.user._id,
        channel: channelId
    });

    if (!deletedSubscription) {
        throw new ApiError(404, "Subscription not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedSubscription, "Unsubscribed successfully")
        );
});


//   Update subscription details
//   req - Express request object
//   res - Express response object
//   Returns updated subscription

const updateSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { channelName, avatar } = req.body;

    // Validate channelId
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Validate update fields
    const updateFields = {};

    if (channelName) {
        if (typeof channelName !== 'string' || channelName.length < 3) {
            throw new ApiError(400, "Channel name must be at least 3 characters long");
        }
        updateFields.channelName = channelName;
    }

    if (avatar) {
        if (typeof avatar !== 'string' || !avatar.match(/^https?:\/\/.+/)) {
            throw new ApiError(400, "Invalid avatar URL");
        }
        updateFields.avatar = avatar;
    }

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "No valid fields to update");
    }

    const updatedSubscription = await Subscription.findOneAndUpdate(
        {
            subscriber: req.user._id,
            channel: channelId
        },
        updateFields,
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedSubscription) {
        throw new ApiError(404, "Subscription not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedSubscription, "Subscription updated successfully")
        );
});


//   Get user's subscriptions
//   req - Express request object
//   res - Express response object
//   Returns list of user's subscriptions

const getUserSubscriptions = asyncHandler(async (req, res) => {
    const subscriptions = await Subscription.find({
        subscriber: req.user._id
    }).populate("channel", "username email avatar channelName");

    return res
        .status(200)
        .json(
            new ApiResponse(200, subscriptions, "User subscriptions fetched successfully")
        );
});


//   Exporting the functions for use in routes
export {
    createSubscription,
    removeSubscription,
    getUserSubscriptions,
    updateSubscription
};


