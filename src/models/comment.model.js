import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true,// you cannot create a comment without content
            trim: true // Automatically removes whitespace from both ends of the string
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video',
            required: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: null
        },
        isReply: { // This field indicates whether a comment is a direct comment or a reply to another comment
            type: Boolean,
            default: false // false means it's a top-level comment (directly on a video)
        } // true means it's a reply to another comment
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual field for replies
commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment'
});

// Compound index for querying comments by video
// Used to optimize queries that fetch comments for a specific video
// and sort them by creation date in descending order
commentSchema.index({ video: 1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);