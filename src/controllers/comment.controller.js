import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Post } from "../models/post.model.js";


// Create a new comment or reply for a video or post
const createComment = asyncHandler(async (req, res) => {
    const { content, parentId } = req.body;
    const { contentType, contentId } = req.params;


    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    // Validate content Type
    if (!["video", "post"].includes(contentType)) {
        throw new ApiError(400, "Invalid contentType");
    }



    //const postId = contentType === "video" ? (await Video.findById(contentId))._id : (await Post.findById(contentId))._id;


    // Verify if content (video/post) exists
    if (contentType === "video") {
        await Video.findById(contentId);
    } else {
        await Post.findById(contentId);
    }



    const commentData = {
        content,
        contentType,
        contentId,
        author: req.user._id,
        isReply: !!parentId // Set isReply to true if parentId exists
    };

    // If parentId exists, it's a reply
    if (parentId) {
        const parentComment = await Comment.findById(parentId);
        if (!parentComment) {
            throw new ApiError(404, "Parent comment not found");
        }
        commentData.parentComment = parentId;
    }

    // Create the comment
    const comment = await Comment.create(commentData);


    // Populate necessary fields
    const populatedComment = await Comment.findById(comment._id)
        .populate("author", "username avatar")
        .populate("likes", "username")
        .populate({
            path: "parentComment",
            populate: {
                path: "author",
                select: "username avatar"
            }
        });


    return res.status(201).json(
        new ApiResponse(201, populatedComment, "Comment added successfully")
    );
});


// Get comments for a video or post (with pagination)
const getComments = asyncHandler(async (req, res) => {
    const { contentType, contentId } = req.params;
    const {
        page = 1,
        limit = 10,
        sort = "newest"
    } = req.query;

    // Validate content Type
    if (!["video", "post"].includes(contentType)) {
        throw new ApiError(400, "Invalid contentType");
    }



    // query to find comments
    const query = {
        contentType,
        contentId,
        parentComment: null // Get top-level comments only (no replies)
    };


    const sortOptions = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        popular: { likesCount: -1 }
    };


    const comments = await Comment.find(query)
        .populate("author", "username avatar")
        .populate("likes", "username")
        .populate({
            path: "replies",
            populate: {
                path: "author",
                select: "username avatar"
            }
        })
        .sort(sortOptions[sort])
        .skip((page - 1) * limit)
        .limit(limit);

    const totalComments = await Comment.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            currentPage: page,
            totalPages: Math.ceil(totalComments / limit),
            totalComments
        })
    );
});

// Update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can't edit this comment");
    }

    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    const updatedComment = await Comment.findById(commentId)
        .populate("author", "username avatar")
        .populate("likes", "username");

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if user is the author or post owner
    if (comment.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can't delete this comment");
    }

    // Delete all replies if it's a parent comment
    if (!comment.parentComment) {
        await Comment.deleteMany({ parentComment: commentId });
    }

    await comment.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});


export {
    createComment,
    getComments,
    updateComment,
    deleteComment
};

