/*

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";

// Create a new comment or reply
const createComment = asyncHandler(async (req, res) => {
    const { content, parentId } = req.body;
    const { postId } = req.params;

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const commentData = {
        content,
        post: postId,
        author: req.user._id
    };

    // If parentId exists, it's a reply
    if (parentId) {
        const parentComment = await Comment.findById(parentId);
        if (!parentComment) {
            throw new ApiError(404, "Parent comment not found");
        }
        commentData.parentComment = parentId;
    }

    const comment = await Comment.create(commentData);

    // Populate necessary fields
    const populatedComment = await Comment.findById(comment._id)
        .populate("author", "username avatar")
        .populate("likes", "username");

    return res.status(201).json(
        new ApiResponse(201, populatedComment, "Comment added successfully")
    );
});

// Get comments for a post (with pagination)
const getPostComments = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

    // Get top-level comments only (no replies)
    const query = {
        post: postId,
        parentComment: null
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

// Toggle like on comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const isLiked = comment.likes.includes(req.user._id);

    if (isLiked) {
        comment.likes.pull(req.user._id);
    } else {
        comment.likes.push(req.user._id);
    }

    await comment.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            { liked: !isLiked },
            `Comment ${isLiked ? "unliked" : "liked"} successfully`
        )
    );
});

export {
    createComment,
    getPostComments,
    updateComment,
    deleteComment,
    toggleCommentLike
};

*/