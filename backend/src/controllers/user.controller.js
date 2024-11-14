import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from "mongoose"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const registerUser = asyncHandler(async (req, res, next) => {
    //getting data from frontend
    const { fullName, username, password, email } = req.body;

    //checking if field is not empty
    if (
        [fullName, username, password, email].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Fields should not be Empty")
    }

    //checking username & email if present in database
    const userByUsername = await User.findOne({ username });
    const userByEmail = await User.findOne({ email });

    if (userByUsername) {
        throw new ApiError(409, "Username already exist's");
    }
    else if (userByEmail) {
        throw new ApiError(409, "Email already exist's")
    }

    // Variable to store the path of the uploaded avatar image
    let avatarLocalPath;
    try {
        // Attempt to access the path of the avatar file from req.files
        // req.files.avatar[0].path gets the path of the first avatar file in the upload
        avatarLocalPath = req.files.avatar[0].path;
    } catch (error) {
        // If an error occurs (e.g., avatar file is not uploaded or req.files is undefined),
        avatarLocalPath = undefined;
        throw new ApiError(400,"Avatar is required")
    }


    // Variable to store the path of the uploaded cover image
    let coverImageLocalPath;
    try {
        // Check if req.files exists, if req.files.coverImage is an array, and if the array has files
        if (
            req.files && // Ensure req.files is defined
            Array.isArray(req.files.coverImage) && // Ensure req.files.coverImage is an array
            req.files.coverImage.length > 0 // Ensure the array has at least one file
        ) {
            // If all conditions are met, get the path of the first cover image file
            coverImageLocalPath = req.files.coverImage[0].path;
        }
    } catch (error) {
        // If an error occurs (e.g., req.files or req.files.coverImage is undefined),
        // set coverImageLocalPath to undefined
        coverImageLocalPath = undefined;
        throw new ApiError(400,"Cover Image is required")
    }


    // Now, uploading file to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    // creating user 
    User.create(({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    }));

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken");
    
    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while registering the user')
    }
    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Created Successfully")
    )
})
// const handleUserRegister = asyncHandler(registerUser)  you can wrap in 2 different ways




export { registerUser }


