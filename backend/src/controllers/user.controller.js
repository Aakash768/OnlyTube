import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponses } from '../utils/ApiResponses.js';
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const options = {
    httpOnly: true,
    secure: true
}

// generated Refresh and Access Token saved refresh token to db
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        // both user token and refresh token has been generated
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshTokens()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Tokens")
    }
}


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
        throw new ApiError(400, "Avatar is required")
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
        throw new ApiError(400, "Cover Image is required")
    }


    // Now, uploading file to cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    // creating user 
    const user = await User.create(({
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
        new ApiResponses(200, createdUser, "User Created Successfully")
    )
})
// const handleUserRegister = asyncHandler(registerUser)  you can wrap in 2 different ways

//login
const loginUser = asyncHandler(async (req, res) => {
    // requesting coming from frontend
    const { email, password, username } = req.body;

    //email or username which i have to use for login
    if (!(username || email)) {
        throw new ApiError(400, "Username & Email is Required");
    }

    //Now if the username or email is present so we have to find in the database
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User doesn't exists")
    }

    // Now checking the password
    const isPasswordValid = user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Password is Incorrect")
    }

    
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponses(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in Sucessfully"
            )
        )

});

//logout user
const logoutUser = asyncHandler(async (req, res) => {
    if(!(req.user || req.user._id)){
        throw new ApiError(401, "User is not authenticated")
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponses(200, {}, "User Logged Out"))
});


// refreshTokens 
const refreshAccessToken = asyncHandler(async (req, res)=> {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Access")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken._id);

        if(!user){
            throw new ApiError(401, "Unauthorized Access")
        }

        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is Expired or Uses")
        }

        const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id);
        
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponses(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
        )
        
    }
    catch(error){
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})



export { registerUser, loginUser, logoutUser }


