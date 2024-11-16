import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

const verifyJWT = asyncHandler( async (req,res, next)=>{
    try {
        // Retrieve the token from either cookies or the Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
       

        if(!token){
            throw new ApiError(401, "Unauthorized Request")
        }

        // Verify the token using the secret key
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        // Find the user in the database using the ID from the decoded token
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        // Check if the user exists
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }

        // Assign the user to the request object
        req.user = user;
        
        // Call the next middleware or route handler
        next()
        
        
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})


export { verifyJWT }