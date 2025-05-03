import mongoose, { model, Schema } from "mongoose";


const likesSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        liked: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'likedType',
        },
        likedType: {
            type: String,
            enum: ['Video', 'Post', 'Comment'],
            required: true
        }
    },
    {
        timestamps: true
    }
)

// Compound index: Prevents a user from liking the same item multiple times
likesSchema.index({ userId: 1, liked: 1, likedType: 1, }, { unique: true })




export const Like = mongoose.model('Like', likesSchema)