import mongoose, { Schema } from "mongoose";


const commentSchema = new Schema({})




export const Comment = mongoose.model("Comment", commentSchema);