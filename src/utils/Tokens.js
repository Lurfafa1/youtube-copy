import { ApiError } from './apiErrors.js'
import { User } from '../models/user.model.js'

//  Generates access and refresh tokens using User Schema for a user and saves the refresh token in the db.
//  @param {ObjectId} userId - The id of the user to generate the tokens for.
//  @returns {Promise<{accessToken: string, refreshToken: string}>} - A promise that resolves to an object containing the access and refresh tokens.
const generateAccessAndRefreshToken = async (userId) => {
    try {
        // generate access and refresh token
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()


        // save refresh token in db
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        // return access and refresh token
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, 'something went worng while generating tokens')
    }
}

export { generateAccessAndRefreshToken }