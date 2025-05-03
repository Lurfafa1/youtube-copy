import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";

// Middleware to verify access token
const verifyToken = asyncHandler(async (req, _, next) => {
    try {
        // check for access token from cookies or headers
        const token = req.cookies.accessToken || req.headers.authorization;
        console.log(req.cookies)

        if (!token) {
            throw new ApiError(401, 'no cookies found so gtfo!!');
        }

        // remove "Bearer " from token if present
        const accessToken = token.replace("Bearer ", "");

        // verify access token from jwt
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

        // get user id from db using decoded token and remove password and refresh token
        const user = await User.findById(decodedToken._id).select('-password -refreshToken');

        // check if user exists
        if (!user) {
            throw new ApiError(401, 'invalid access token');
        }

        // attach user to request
        req.user = user;

        next();
    } catch (error) {
        throw new ApiError(401, error.message || 'invalid access token');
    }
});

export { verifyToken };