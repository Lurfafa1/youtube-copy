import mongoose, { Schema } from "mongoose";



const SubscriptionSchema = new Schema({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId, // the one who subscribes
        ref: "User",
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId, // the one whom 'subscriber' subscribes to
        ref: "User",
    },


},
    { timestamps: true })




export const Subscription = mongoose.model("Subscription", SubscriptionSchema,);