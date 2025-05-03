import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiErrors.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { generateAccessAndRefreshToken } from '../utils/Tokens.js'
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


// registering a user
const registerUser = asyncHandler(async (req, res) => {
    // Logic for registering a user----------
    // get user details from req.body
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatr
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token from response
    // check for user creation
    // send response to frontend with user details


    // get user details from req.body
    const { fullname, username, email, password } = req.body;

    // validation - not empty
    if (
        [fullname, username, email, password].some((field) =>
            field?.trim() == '')
    ) {
        throw new ApiError(400, 'All fields are required');
    }

    // check if user already exists: username, email
    const userExisted = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (userExisted) {
        throw new ApiError(409, 'User already exists');
    }

    // check for images, check for avatar
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    // if (!avatarLocalPath) {
    //     throw new ApiError(400, 'Avatar file is required')
    // }
    // check if avatar is provided, if not set it to empty string
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;
    } else if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is required')
    }




    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // check if cover image is provided, if not set it to empty string
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }



    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, 'Avatar file is required')
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    // create user object - create entry in db
    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ''
    })

    //remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    )

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, 'User not created')

    }


    // send response to frontend with user details
    return res.status(201).json(
        new ApiResponse(201, 'User created successfully', {
            createdUser
        })
    )




})



// Login a user
const loginUser = asyncHandler(async (req, res) => {
    // get user details from req.body
    // check for username or email
    // find the user
    // check for password
    // generate access token and refresh token
    // send cookies to browser
    // send response to frontend with user details

    // get user details from req.body
    const { email, username, password } = req.body;

    // check for username or email
    if (!(email || username)) {
        throw new ApiError(400, 'Email or username is required')
    }


    // find the user
    const findingUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!findingUser) {
        throw new ApiError(404, 'User not found')
    }

    // check for password
    const isPasswordCorrect = await findingUser.isValidPassword(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, 'Invalid Password')
    }


    // generate access token and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(findingUser._id)

    // logged in user and remove password and refresh token
    const loggedInUser = await User.findById(findingUser._id).select(
        '-password -refreshToken'
    )


    // make sure the cookies are secure
    const options = {
        httpOnly: true,
        secure: true,
    }

    // send cookies to browser and send response to frontend with user details
    return res.status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                'User logged in successfully',
                // this is data that is in apiResponse
                {
                    loggedInUser, accessToken, refreshToken
                }
            )
        )




})



// Logout a user
const logOutUser = asyncHandler(async (req, res) => {
    // find user and delete refresh token from db
    // make sure the cookies are secure
    // send response to frontend with message



    // find user and delete refresh token from db
    // where is the user coming from ???
    // req.user is coming from auth middleware
    await User.findOneAndUpdate(
        req.user._id,
        { refreshToken: undefined },
        { new: true }
    )

    // make sure the cookies are secure
    const options = {
        httpOnly: true,
        secure: true,
    }

    // send response to frontend with message
    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged out successfully'))

})


// Refresh access token
// this is a middleware that will be used to refresh the access token when it expires
const refreshAccessTokenController = asyncHandler(async (req, res) => {

    // get refresh token from cookies or body
    // verify refresh token
    // get user id from db using decoded token and remove password and refresh token
    // send response to frontend with user details


    // get refresh token from cookies or body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Refresh token is required')
    }


    try {
        // verify refresh token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        // get user id from db using decoded token and remove password and refresh token
        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')

        if (!user) {
            throw new ApiError(401, 'invalid refresh token')
        }


        // check if the token is valid
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'refreshToken is not matching!!')
        }


        const options = {
            httpOnly: true,
            secure: true,
        }

        // generate new access token and refresh token 
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)


        // send response to frontend
        return res.status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    'Access token refreshed successfully',
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    }
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || 'Invalid refresh token')

    }

})


// Change the password
const CurrentUserPassWordChange = asyncHandler(async (req, res) => {
    // Logic for changing the password----------
    // get password from req.body
    // get user id from req.user
    // check if password is correct
    // change the password in db
    // send response to frontend with message



    // get password from req.body this is coming from the frontend request body
    // we are using express validator to validate the password
    const { oldPassword, newPassword } = req.body

    // get user id from req.user
    const user = await User.findById(req.user?._id)


    // check if password is Correct
    const isPasswordCorrect = await User.isValidPassword(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, 'invalid old password')
    }

    // change the password in db
    // set User model password with newPassword
    user.password = newPassword
    await user.save({ validationBeforeSave: false })



    // send response to frontend with message
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Password changed successfully')
        )

})



// get current user account details
const CurrentUserDetails = asyncHandler(async (req, res) => {
    // get user from req.user
    // req.user is coming from auth middleware
    return res
        .status(200)
        .json(
            new ApiResponse(200, 'Current user account details fetched successfully', {
                user: req.user
            })
        )
})


// update user details
const updateAccountDetails = asyncHandler(async (req, res) => {
    // get user from req.body
    // get user id from req.user and update the user in db
    // send response to frontend with message


    // get user from req.body
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new ApiError(400, 'fullname and email is required')
    }


    // get user id from req.user and update the user in db dirctly
    // $set is mongodb operator that will update the user details in db
    // new: true will return the updated user
    const user = await User.findById(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        { new: true }
    ).select('-password')


    // send response to frontend with message
    return res
        .status(200)
        .json(
            new ApiResponse(200, 'Account details updated successfully', {
                user: user
            })
        )


})


// update user avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    // get avatar from req.file coming from multer middleware
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar file is Missing!!')
    }

    // Get current user to find their existing avatar
    const currentUser = await User.findById(req.user?._id);
    const oldAvatar = currentUser.avatar;

    // upload avatar to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, 'Avatar file is not uploaded')
    }

    // find and update avatar using mongoose operator $set
    const updateUserAvatar = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true, runValidators: true }
    ).select('-password')


    // Delete the old avatar from Cloudinary if it exists
    if (oldAvatar) {
        await deleteFromCloudinary(oldAvatar)
    }


    // send response to frontend with message
    return res
        .status(200)
        .json(
            new ApiResponse(200, 'Avatar updated successfully', {
                user: updateUserAvatar
            })
        )
})



// update user cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
    // get cover image from req.file coming from multer middleware
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, 'Cover image file is Missing!!')
    }

    // Get the current user to find their existing cover image
    const currentUser = await User.findById(req.user?._id);
    const oldCoverImage = currentUser.coverImage;

    // upload cover image to cloudinary
    // after uploading the image, we will get the url of the image
    // and we will save it to the user model
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, 'Cover image file is not uploaded')
    }


    // find and update cover Image using mongoose operator $set
    // $set is used to update the cover image in the user model
    const updatedUserCoverImage = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select('-password')

    // Delete the old cover image from Cloudinary if it exists
    if (oldCoverImage) {
        await deleteFromCloudinary(oldCoverImage)
    }


    // send response to frontend with message
    return res
        .status(200)
        .json(
            new ApiResponse(200, 'Cover image updated successfully', {
                updatedUserCoverImage
            })
        )
})



// this is just for showing the subscriber and subscription numbers 
// get user channel profile and subscribers
const getUserChannelProfileAndSubs = asyncHandler(async (req, res) => {

    // get username from req.params its coimng from the url
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, 'Username is missing')
    }


    // aggregations pipline is used to perform complex queries on the mongodb collections
    // we can dirctly use User.aggregate not need to use User.find because the $match already doest in mongodb
    const channel = await User.aggregate([
        // $match is used to filter the documents in the collection $match is also a mongodb operator
        // username is a field in the user collection and we are matching it with the username in the url
        // username is a document and we well build a $lookup based on the username
        // we are matching the username with the username in the collection
        // $lookup is used to join two collections in mongodb
        // we are joining the user collection with the channel collection
        // we are using the username to join the two collections
        {
            $match: {
                username: username?.toLowerCase(),
            }
        },
        // we picked the channel wich is my subscribers and we are going to join the user collection with the subscription collection
        {
            $lookup: {
                from: 'subscription',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers', // this is the name of the field in the user collection
                // my subscribers
            }
        },
        // we picked the subscriber wich is my subscriptions and we are going to join the user collection with the subscription collection
        {
            $lookup: {
                from: 'subscription',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscriptions', // this is the name of the field in the user collection
                // my subscriptions
            }
        },
        // $addFields is used to add new fields to the documents in the collection
        // we are adding the count of the subscribers and subscriptions to the user collection
        {
            $addFields: {
                myChannelSubscribersCount: { $size: '$subscribers' },
                mySubscriptionsCount: { $size: '$subscriptions' },
                // isSubscribed is a field that will tell us if the user is subscribed to the channel or not
                // we are checking if the user id is in the subscribers array
                // if the user id is in the subscribers array then we are setting isSubscribed to true
                // $cond is a mongodb operator that is used to check if a condition is true or false
                // if the condition is true then it will return the value of then
                // $in is a mongodb operator that is used to check if a value is in an array or object
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, '$subscriptions.subscriber'] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        // $project is used to select the fields that we want to return in the response
        {
            $project: {
                _id: 1,
                fullname: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                myChannelSubscribersCount: 1,
                mySubscriptionsCount: 1,
                isSubscribed: 1,
                createdAt: 1,
            }
        }
    ])

    console.log(channel)

    if (!channel?.length) {
        throw new ApiError(404, 'Channel not found')
    }


    // send response to frontend with message
    return res
        .status(200)
        .json(
            new ApiResponse(200, 'Channel profile fetched successfully', {
                channel: channel[0]
            })
        )

})



// get user watch history
const getWatchHistory = asyncHandler(async (req, res) => {

    // ${req.user._id} is a string in mongoose and we need to convert it to object id
    // $lookup pipline is in user model and we are going to join the video collection with the user collection
    // we are going to use the watchHistory field in the user collection to join the video collection
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        // video id is in the watchHistory field in the user collection
        {
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as: 'watchHistory',
                // now we are inside the video collection and we are going to join the user collection with the video collection
                // we are going to use the Owner field in the video collection to join the user collection
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'Owner',
                            foreignField: '_id',
                            as: 'Owner',
                            // now we are inside the user collection and we are going to join the video collection with the user collection
                            // this sub piplines job is to get the user details of the video owner
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    // this new filed is just to make it easy to get the video details for the frondtend
                    {
                        $addFields: {
                            Owner: {
                                $first: '$Owner' // this will get the first element of the array and set it to the Owner field
                            }
                            //Owner: { $arrayElemAt: ['$Owner', 0] },
                            // this will get the first element of the array and set it to the Owner field
                        }
                    }
                ]
            }
        }
    ])

    console.log(user)


    return res
        .status(200)
        .json(
            new ApiResponse(200, 'Watch history fetched successfully', {
                watchHistory: user[0]?.watchHistory || []
                // watchHistory is data in ApiResponse
            })
        )
})







export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessTokenController,
    CurrentUserPassWordChange,
    CurrentUserDetails,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfileAndSubs,
    getWatchHistory

}
