import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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

    res.status(201).json(new ApiResponse(201, "Post created successfully", post));

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

    res.status(200).json(new ApiResponse(200, "Post updated successfully", post));

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

    res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));

})








export {
    createPost,
    updatePost,
    deletePost
};