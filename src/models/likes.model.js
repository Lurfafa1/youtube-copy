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
        },
        like: {
            type: Boolean,
            default: true // true for like, false for dislike
        }
    },
    {
        timestamps: true
    }
)

// Prevent duplicate likes and optimize like status checks
likesSchema.index({ userId: 1, liked: 1, likedType: 1 }, { unique: true })

// Optimize like counts per item
likesSchema.index({ liked: 1, likedType: 1 })

// For user's liked items
likesSchema.index({ userId: 1, createdAt: -1 })



export const Like = mongoose.model('Like', likesSchema)