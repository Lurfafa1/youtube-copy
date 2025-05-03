import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiErrors.js';
import { ApiResponse } from '../utils/apiResponse.js';
import mongoose from 'mongoose';
import { Video } from '../models/video.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import Joi from 'joi';




// Validate request body using Joi
// Joi is a validation library for JavaScript that allows you to define a schema for your data and validate it against that schema

const videoMetaDataSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
});

const videoFilePathSchema = Joi.object({
  path: Joi.string().required(),
});

const thumbnailFilePathSchema = Joi.object({
  path: Joi.string(),
});




//  upload a video controller
//  This controller is responsible for uploading a video to the server and saving the metadata to the database

const uploadVideo = asyncHandler(async (req, res) => {

  // Validate request body
  // ValidateAsync Completes the validation and returns the value if valid or throws an error if invalid and stops the execution of the code
  // ValidateAsync is a joi method that validates the request body against the schema and returns a promise
  const { error } = await videoMetaDataSchema.validateAsync(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  // Check for video file
  // Check if the video file is present in the request body
  if (!req.files || !req.files.videoFile || req.files.videoFile.length === 0) {
    throw new ApiError(400, "Video file is empty");
  }



  try {
    // Get file paths (Multer adds these)
    const videoPath = req.files.videoFile[0].path;
    const thumbnailPath = req.files.thumbnail?.[0]?.path;


    // Validate video file path
    const { error: videoFileError } = await videoFilePathSchema.validateAsync({ path: videoPath });
    if (videoFileError) {
      throw new ApiError(400, videoFileError.details[0].message);
    }


    // Validate thumbnail file path
    if (thumbnailPath) {
      const { error: thumbnailError } = await thumbnailFilePathSchema.validateAsync({ path: thumbnailPath });
      if (thumbnailError) {
        throw new ApiError(400, thumbnailError.details[0].message);
      }
    }


    // Upload video file to Cloudinary
    const videoFile = await uploadOnCloudinary(videoPath);
    const thumbnail = thumbnailPath ? await uploadOnCloudinary(thumbnailPath) : null;

    if (!videoFile) {
      throw new ApiError(500, "Video upload failed");
    }

    // Create video object
    const video = await Video.create({
      title: req.body.title,
      description: req.body.description,
      videoFile: videoFile.url,
      thumbnail: thumbnail?.url || "",
      duration: videoFile.duration,
      owner: req.user._id,
      views: 0,
      isPublished: true
    });

    // Return success response
    return res.status(201).json(
      new ApiResponse(201, video, "Video uploaded successfully")
    );

  } catch (error) {
    if (error.isJoi) {
      throw new ApiError(400, error.details[0].message);

    }
    throw new ApiError(500, "An unexpected error occurred during video file validation");
  }




})



//  delete a video controller
//  This controller is responsible for deleting a video from the server and removing the metadata from the database

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate video ID
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find video and check if it exists
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Check if the user is the owner of the video
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized: You can only delete your own videos");
  }

  // Delete video from cloudinary
  if (video.videoFile) {
    await deleteFromCloudinary(video.videoFile);
  }
  if (video.thumbnail) {
    await deleteFromCloudinary(video.thumbnail);
  }

  // Delete video from database
  await Video.findByIdAndDelete(videoId);

  return res.status(200).json(
    new ApiResponse(200, {}, "Video deleted successfully")
  );
})



//  get all videos for search and views
//  This controller is responsible for getting all videos for search and views

const videos = asyncHandler(async (req, res) => {


  // Validate query parameter to prevent potential security vulnerabilities
  const query = req.query.query;
  if (!query || typeof query !== 'string') {
    throw new ApiError(400, "Invalid query parameter");
  }


  // sanitize the query string to prevent security vulnerabilities such as SQL injection or XSS attacks

  const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special characters


  const video = await Video.aggregate([
    {
      $match: {
        isPublished: true,
        title: { $regex: sanitizedQuery, $options: "i" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        owner: { $first: "$owner" }
      }
    },
    {
      $project: {
        _id: 1,
        title: 1,
        views: 1,
        owner: 1,
        createdAt: 1
      }
    }
  ])


  // Pagination and options
  const options = {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 10,
    sort: { createdAt: -1 }, // Sort by createdAt in descending order
    timeout: 30000, // 30 seconds
    customLabels: {
      docs: "videos",
      totalDocs: "totalVideos",
      page: "currentPage",
    },
  }


  // Paginate the results using aggregatePaginate
  try {
    // cursor is a cursor object that allows you to iterate over the results of the aggregation pipeline
    // cursor is used for less load on the server and better performance
    // toArray() is a method that returns an array of the documents in the cursor
    const cursor = Video.aggregatePaginate(video, options);
    const videos = await cursor.toArray();


    const totalPages = Math.ceil(videos.length / options.limit)
    const currentPage = options.page
    const totalVideos = videos.length


    // Return success response
    return res
      .status(200)
      .json(
        new ApiResponse
          (200, {
            videos: videos,
            totalPages: totalPages,
            currentPage: currentPage,
            totalVideos: totalVideos
          },
            "Videos and views fetched successfully"
          )
      );



  } catch (error) {
    if (error.name === 'MongoError') {
      return res
        .status(500)
        .json(
          new ApiResponse(500, null, "Error fetching videos")
        );
    } else {
      return res
        .status(500)
        .json(
          new ApiResponse(500, null, "Internal server error")
        );
    }
  }







})







export {
  uploadVideo,
  deleteVideo,
  videos
}









/*

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiErrors.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import mongoose from 'mongoose';
import { Video } from '../models/video.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import Joi from 'joi';

const videoSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
});

const videoFileSchema = Joi.object({
  path: Joi.string().required(),
});

const thumbnailSchema = Joi.object({
  path: Joi.string(),
});

const uploadVideo = asyncHandler(async (req, res) => {
  // Validate request
  const { error } = videoSchema.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  // Check for video file
  if (!req.files || !req.files.videoFile) {
    throw new ApiError(400, "Video file is required");
  }

  // Validate video file
  const { error: videoFileError } = videoFileSchema.validate(req.files.videoFile[0]);
  if (videoFileError) {
    throw new ApiError(400, videoFileError.details[0].message);
  }

  // Get file paths (Multer adds these)
  const videoPath = req.files.videoFile[0].path;
  const thumbnailPath = req.files.thumbnail?.[0]?.path;


  this what req.files looks like : 

  req.files = {
    videoFile: [{
        fieldname: 'videoFile',
        originalname: 'video.mp4',
        path: 'public/temp/1682645873456-video.mp4',
        // ...other properties
    }],
    thumbnail: [{
        fieldname: 'thumbnail',
        originalname: 'thumb.jpg',
        path: 'public/temp/1682645873456-thumb.jpg',
        // ...other properties
    }]
}





  // Validate thumbnail
  if (thumbnailPath) {
    const { error: thumbnailError } = thumbnailSchema.validate({ path: thumbnailPath });
    if (thumbnailError) {
      throw new ApiError(400, thumbnailError.details[0].message);
    }
  }

  // Upload to cloudinary
  const videoFile = await uploadOnCloudinary(videoPath);
  const thumbnail = thumbnailPath ? await uploadOnCloudinary(thumbnailPath) : null;

  if (!videoFile) {
    throw new ApiError(500, "Video upload failed");
  }

  // Create video document
  const video = await Video.create({
    title: req.body.title,
    description: req.body.description,
    videoFile: videoFile.url,
    thumbnail: thumbnail?.url || "",
    duration: videoFile.duration,
    owner: req.user._id,
    views: 0,
    isPublished: true
  });

  return res.status(201).json(
    new ApiResponse(201, video, "Video uploaded successfully")
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Find video and check if it exists
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Check if the user is the owner of the video
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized: You can only delete your own videos");
  }

  // Delete video from cloudinary
  if (video.videoFile) {
    await deleteFromCloudinary(video.videoFile);
  }
  if (video.thumbnail) {
    await deleteFromCloudinary(video.thumbnail);
  }

  // Delete video from database
  await Video.findByIdAndDelete(videoId);

  return res.status(200).json(
    new ApiResponse(200, {}, "Video deleted successfully")
  );
});



//  Implements pagination and search
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query = "" } = req.query;

  const videos = await Video.find({
    isPublished: true,
    title: { $regex: query, $options: "i" }
  })
    .populate("owner", "username avatar")
    .limit(limit * 1) // Number of items per page
    .skip((page - 1) * limit) // Skip previous pages
    .sort({ createdAt: -1 });

  const totalVideos = await Video.countDocuments();

  return res.status(200).json(
    new ApiResponse(200, {
      videos,  // Current page items
      totalPages: Math.ceil(totalVideos / limit), // Total number of pages
      currentPage: page  // Current page number
    }, "Videos fetched successfully")
  );
});


//  Includes view counting
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId)
    .populate("owner", "username avatar");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Increment views
  video.views += 1;
  await video.save();

  return res.status(200).json(
    new ApiResponse(200, video, "Video fetched successfully")
  );
});

export {
  uploadVideo,
  getAllVideos,
  getVideoById,
  deleteVideo
};




const video = Video.aggregate([
  {
    $match: {
      isPublished: true,
      title: { $regex: query, $options: "i" }
    }
  },
  {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [
        {
          $project: {
            username: 1,
            avatar: 1
          }
        }
      ]
    }
  },
  {
    $addFields: {
      owner: { $first: "$owner" }
    }
  },
  {
    $project: {
      _id: 1,
      title: 1,
      views: 1,
      owner: 1,
      createdAt: 1
    }
  }
]);

const options = {
  page: parseInt(page, 10),
  limit: parseInt(limit, 10),
  sort: { createdAt: -1 }
};

const videos = await Video.aggregatePaginate(video, options);

return res.status(200).json(
  new ApiResponse(200, {
    videos: videos.docs,
    totalPages: videos.totalPages,
    currentPage: videos.page,
    totalVideos: videos.totalDocs
  }, "Videos fetched successfully")
);


*/