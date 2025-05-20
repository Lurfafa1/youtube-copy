import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true,// you cannot create a comment without content
            trim: true // Automatically removes whitespace from both ends of the string
        },
        contentType: {
            type: String,
            enum: ['video', 'post'],
            required: true
        },
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'contentType',
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
        }, // true means it's a reply to another comment
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        isEdited: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Pre-save hook to set isReply based on parentComment
commentSchema.pre('save', function (next) {
    if (this.parentComment) {
        this.isReply = true; // Set isReply to true if there's a parent comment
    } else {
        this.isReply = false; // Set isReply to false if it's a top-level comment
    }
    next();
});


// Virtual field for replies
commentSchema.virtual('replies', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentComment',
    options: { sort: { createdAt: -1 } } // Sort replies by creation date
});

// Virtual for likes count
commentSchema.virtual('likesCount').get(function () {
    return this.likes?.length || 0;
});



// Index for likes
commentSchema.index({ likes: 1 });

// Index for content-based queries
commentSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });

// Index for nested comments (replies)
commentSchema.index({ parentComment: 1, createdAt: -1 });

// Index for user's comments
commentSchema.index({ owner: 1, createdAt: -1 });


export const Comment = mongoose.model("Comment", commentSchema);