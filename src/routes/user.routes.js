import { Router } from "express";
import {
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

} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]),
    registerUser
)

router.route('/login').post(loginUser)

// secured routes meaning that user needs to be logged in to access these routes
// we can use the verifyToken middleware to protect these routes
router.route('/logout').post(verifyToken, logOutUser)
router.route('/refresh-token').post(refreshAccessTokenController)
router.route('/change-password').post(verifyToken, CurrentUserPassWordChange)
router.route('/current-user').get(verifyToken, CurrentUserDetails)
router.route('/update-account').patch(verifyToken, updateAccountDetails)
router.route('/update-avatar').patch(verifyToken, upload.single('avatar'), updateUserAvatar)
router.route('/update-cover-image').patch(verifyToken, upload.single('coverImage'), updateUserCoverImage)
router.route('/c/:username').get(verifyToken, getUserChannelProfileAndSubs)
router.route('/history').get(verifyToken, getWatchHistory)

export { router }