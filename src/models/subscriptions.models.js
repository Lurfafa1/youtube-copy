import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId, // the one who subscribes
        ref: "User",
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId, // the one whom 'subscriber' subscribes to
        ref: "User",
    }
},
    { timestamps: true })

// Compound index for subscriber's subscriptions
SubscriptionSchema.index({ subscriber: 1, createdAt: -1 })

// Compound index for channel's subscribers
SubscriptionSchema.index({ channel: 1, createdAt: -1 })

// Unique compound index to prevent duplicate subscriptions
SubscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true })

export const Subscription = mongoose.model("Subscription", SubscriptionSchema);