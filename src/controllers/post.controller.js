import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Post } from "../models/post.model.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";


const createPost = asyncHandler(async (req, res) => {
    const { title, content, tags, visibility } = req.body;

    // Check if title and content exist
    if (!title || !content) {
        throw new ApiError(400, "Title and content are required");
    }

    // Check if media is provided
    let mediaUrl;
    let mediaType = "none";

    // Handle media upload if exists
    if (req.file) {
        mediaUrl = await uploadOnCloudinary(req.file.path);
        if (!mediaUrl) {
            throw new ApiError(500, "Media file upload failed");
        }
        mediaType = req.file.mimetype.startsWith("image") ? "image" : "video";
    }


    // Create the post
    const post = await Post.create({
        title,
        content,
        author: req.user._id,
        mediaUrl,
        mediaType,
        tags: tags?.split(",").map(tag => tag.trim().toLowerCase()),
        visibility
    })

    return res.status(201).json(new ApiResponse(201, "Post created successfully", post));

})


const updatePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { title, content, tags, visibility } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }


    // Check if the user is the author of the post
    if (post.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }


    // Handle media update if exists
    if (req.file) {
        // Delete the old media from Cloudinary if it exists
        if (post.mediaUrl) {
            await deleteFromCloudinary(post.mediaUrl);
        }

        // Upload the new media to Cloudinary
        const mediaUrl = await uploadOnCloudinary(req.file.path);
        if (!mediaUrl) {
            throw new ApiError(500, "Media file upload failed");
        }
        post.mediaUrl = mediaUrl;
        post.mediaType = req.file.mimetype.startsWith("image") ? "image" : "video";
    }



    // Update the post fields
    post.title = title || post.title;
    post.content = content || post.content;
    post.tags = tags ? tags.split(",").map(tag => tag.trim().toLowerCase()) : post.tags;
    post.visibility = visibility || post.visibility;

    // Save the updated post
    await post.save();

    return res.status(200).json(new ApiResponse(200, "Post updated successfully", post));

})



const deletePost = asyncHandler(async (req, res) => {
    // where is the postId coming from?
    const post = await Post.findById(req.params.postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }


    // Check if the user is the author of the post
    if (post.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this post");
    }


    // Delete the media from Cloudinary if it exists
    if (post.mediaUrl) {
        await deleteFromCloudinary(post.mediaUrl);
    }

    // Delete the post
    await post.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));

})



const likePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }


    // Check if post exists
    const isLiked = await Post.includesLike(req.user._id);

    if (isLiked) {
        // User has already liked the post, so remove the like
        post.likes.pull(req.user._id); // // Remove like
    } else {
        // User has not liked the post, so add the like
        post.likes.push(req.user._id); // Add like
    }

    await post.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { liked: !isLiked }, // Returns new like status
            `Post ${isLiked ? "unliked" : "liked"} successfully`,
        ));
})



// check like post status
const checkLikeStatus = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Check if the user has liked the post
    const isLiked = post.likes.includes(req.user._id);

    return res
        .status(200)
        .json(new ApiResponse(200, { liked: isLiked }, "Like status fetched successfully"));
})





// Get all posts (with pagination and filters)
const getAllPosts = asyncHandler(async (req, res) => {
    const {
        page = 1, // Current page number (default: 1)
        limit = 10, // Posts per page (default: 10)
        tags, // Filter by tag (optional)
        author, // Filter by author (optional)
        visibility = "public" // Post visibility (default: public)
    } = req.query;


    const query = { visibility }; // Starts with visibility filter
    if (tags) query.tags = tags; // Adds tag filter if provided
    if (author) query.author = author; // Adds author filter if provided



    const posts = await Post.find(query)
        .populate("author", "username avatar") // Get author details
        .sort({ createdAt: -1 }) // Newest first
        .skip((page - 1) * limit) // Skip posts for previous pages
        .limit(limit); // Limit posts to the specified page size


    const totalPosts = await Post.countDocuments(query);

    const totalPages = Math.ceil(totalPosts / limit);


    return res.status(200).json(
        new ApiResponse(200, {
            posts,
            totalPages,
            currentPage: page
        }, "Posts fetched successfully")
    );

})




// Get post by ID
const getPostById = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId)
        .populate("author", "username avatar") // Get author details
        .populate("likes", "username") // Get likes details
        .populate({ // Nested population for comments
            path: "comments",
            populate: {
                path: "author",
                select: "username avatar"
            }
        });

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    // Check visibility permissions
    if (post.visibility !== "public" &&
        post.author._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You don't have permission to view this post");
    }

    return res.status(200).json(new ApiResponse(200, post));
});





// posts made by user like youtube
const getPostsByUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const posts = await Post.find({ author: userId })
        .populate("author", "username avatar") // Get author details
        .sort({ createdAt: -1 }); // Newest first

    if (!posts) {
        throw new ApiError(404, "No posts found for this user");
    }

    return res.status(200).json(new ApiResponse(200, posts));
});




export {
    createPost,
    updatePost,
    deletePost,
    likePost,
    checkLikeStatus,
    getPostById,
    getAllPosts,
    getPostsByUser
};