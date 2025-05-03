import { ApiError } from "../utils/apiErrors.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";


// first validateLikedItem function
const validateLikedItem = async (liked, likedType) => {

    let likedItem;

    switch (likedType.toLowerCase()) {

        case 'video':
            likedItem = await Video.findById(liked);
            break;

        case 'post':
            likedItem = await Post.findById(liked);
            break;

        case 'comment':
            likedItem = await Comment.findById(liked);
            break;

        default:
            throw new ApiError(400, 'Invalid liked type');
    }

    if (!likedItem) {
        throw new ApiError(404, `${likedType} not found`);
    }

    return likedItem;
}




// validateLike middleware
const validateLike = asyncHandler(async (req, _, next) => {

    const likedType = req.body.likedType || req.query.likedType;
    const liked = req.body.liked || req.query.liked;


    if (!liked || !likedType) {
        throw new ApiError(400, "Both liked ID and type are required");
    }


    // Validate the liked type
    if (!['video', 'post', 'comment'].includes(likedType.toLowerCase())) {
        throw new ApiError(400, 'Invalid liked type');
    }


    // Validate if the item exists
    const likedItem = await validateLikedItem(liked, likedType);



    // Attach the liked item to the request object for further use in the controller
    req.likedItem = likedItem;
    next();

})



export { validateLike };