import { Like } from "../models/likes.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { validateLike } from "../middlewares/validateLike.middleware.js";


// createLike controller
const createLike = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const { likedType, likedId, like } = req.body; // Get likedId and like from req.body
    const likedItem = req.likedItem; // This should be set in the validateLike middleware


    // Validate the liked type 
    const validLikedTypes = ['video', 'post', 'comment'];
    if (!validLikedTypes.includes(likedType.toLowerCase())) {
        return res
            .status(400)
            .json(new ApiResponse(false, 'Invalid liked type'));
    }


    // check if the user already liked the item
    const existingLike = await Like.findOne({
        userId,
        liked: likedItem._id,
        likedType
    });

    // If the user has already liked the item, remove the like
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

    }

    // If the user is liking the item, create a new like
    if (like) {
        const newLike = await Like.create({
            userId,
            liked: likedItem._id,
            likedType,
            like: true, // true for like
        });
        return res.status(200).json(
            new ApiResponse(true, `You liked this ${likedType}`, newLike)
        );
    } else {
        // If the user is unliking the item, create a new like with like set to false
        const newDislike = await Like.create({
            userId,
            liked: likedItem._id,
            likedType,
            like: false, // false for dislike
        });
        return res.status(200).json(
            new ApiResponse(true, `You disliked this ${likedType}`, newDislike)
        );
    }

})




// count Likes controller
const countLikes = asyncHandler(async (req, res) => {

    // Get the liked type and ID from the request query
    const { liked, likedType } = req.query;

    const count = await Like.countDocuments({ liked, likedType });

    return res
        .status(200)
        .json(
            new ApiResponse(true, `${likedType} has ${count} likes`, { count })
        )

})



export {
    createLike,
    countLikes,
}