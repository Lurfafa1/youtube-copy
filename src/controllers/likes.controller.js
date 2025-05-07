import { Like } from "../models/likes.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// createLike controller
const createLike = asyncHandler(async (req, res) => {

    const userId = req.user._id;
    const { likedType } = req.body;
    const likedItem = req.likedItem; // This should be set in the validateLike middleware


    // check if the user already liked the item
    const existingLike = await Like.findOne({
        userId,
        liked: likedItem._id,
        likedType
    });

    // If the user has already liked the item, remove the like
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(
                new ApiResponse(true, `${likedType} unliked successfully`, existingLike)
            )
    }

    // If the user has not liked the item, create a new like
    const newLike = await Like.create({
        userId,
        liked: likedItem._id,
        likedType
    });


    return res
        .status(200)
        .json(
            new ApiResponse(true, `${likedType} liked successfully`, newLike)
        )


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