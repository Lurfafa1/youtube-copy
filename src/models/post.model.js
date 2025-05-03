import mongoose, { Schema } from "mongoose";

const postSchema = new Schema({
    title: {
        type: String,
        required: true, // you cannot create a post without title
        trim: true // Automatically removes whitespace from both ends of the string
    },
    content: {
        type: String,
        required: true, // you cannot create a post without content
        trim: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mediaUrl: {
        type: String,
        required: false
    },
    mediaType: {
        type: String,
        enum: ["image", "video", "none"],
        default: "none"
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: "Like"
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }],
    tags: [{
        type: String,
        trim: true
    }],
    visibility: {
        type: String,
        enum: ["public", "private", "followers"],
        default: "public"
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// Virtual field for post statistics
postSchema.virtual('stats').get(function() {
    return {
        likesCount: this.likes?.length || 0,
        commentsCount: this.comments?.length || 0,
        isNew: (Date.now() - this.createdAt) < (24 * 60 * 60 * 1000) // Is post less than 24h old
    }
})

// Add indexes for better query performance
postSchema.index({ author: 1, createdAt: -1 })
postSchema.index({ tags: 1 })

export const Post = mongoose.model("Post", postSchema)
