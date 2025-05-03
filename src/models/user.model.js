import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        avatar: {
            type: String, //cloudinary plugin url
            required: true
        },
        coverImage: {
            type: String, //cloudinary plugin url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        refreshToken: {
            type: String,
        },

    },
    {
        timestamps: true,
    }
)


// use pre-save middleware to hash password before saving in db using bcrypt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next(); // Call next() to proceed with saving the user
})


// Checks if the provided password matches the user's stored password. 
//  @param {string} password - The password to be validated.
//  @returns {Promise<boolean>} - Returns a promise that resolves to true if the password is valid, otherwise false.
userSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}


// Generates an access token for the user using JWT.
//  @returns {string} - The generated access token.
//  The token contains the user's ID, username, email, and fullname, and is signed with a secret key.
//  The token expires based on the value set in the environment variable ACCESS_TOKEN_EXPIRY.
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}

// Generates a refresh token for the user using JWT.
//  @returns {string} - The generated refresh token.
//  The token contains the user's ID and is signed with a secret key.
//  The token expires based on the value set in the environment variable REFRESH_TOKEN_EXPIRY.
//  The refresh token is used to obtain a new access token when the current one expires.
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    )
}

export const User = mongoose.model("User", userSchema);