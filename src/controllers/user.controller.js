import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken";

// Method to generate access and refresh tokens
const generateAccessAndRefreshToken = async (userId) => {
    try {
        // S-1 find a user from given id
        const user = await User.findById(userId);
        // S-2 Generate tokens from the methods defined in user model
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        // S-3 Save refresh token in Database of user
        user.refreshtoken = refreshToken;
        // S-4 Save the user
        await user.save({ validateBeforeSave: false }); // means do not apply validation and just save
        // S-5 Return tokens
        return {
            accessToken,
            refreshToken
        }

    } catch (error) {
        throw new ApiError(500, `Something went wrong while generating refresh and access token :: ${error?.message}`);

    }
}

const registerUser = asyncHandler(async (req, res) => {
    // S-1 Get user data from frontend
    // S-2 Validations like not null, email correct
    // S-3 Check if already registered : username, email
    // S-4 Create User object - create entry in db
    // S-5 Remove password and refresh token field from response
    // S-6 Check for user-creation
    // S-7 Return response

    // S-1
    const { enrollmentNumber, email, fullName, password } = req.body;

    //S-2
    if (!enrollmentNumber || !fullName || !email || !password) {
        throw new ApiError(400, "All fields are required")
    }

    //S-3
    const existedUser = await User.findOne({ email })

    if (existedUser) {
        throw new ApiError(409, "User with this email already exists")
    }

    const user = await User.create({
        enrollmentNumber,
        fullName,
        email,
        password
    })

    // S-7
    // const createdUser = await User.findById(user._id).select(
    //     "-password -refreshtoken"  // use - to deselect
    // )

    // S-8
    if (!user) {
        throw new ApiError(500, "Something went wrong while registering user in database")
    }

    // S-9
    return res.status(201).json(
        new ApiResponse(201, user, "User Registered successfully")
    )
}
)

const login = asyncHandler(async (req, res) => {
    // S-1 take data
    // S-2 validate data
    // S-3 find a user
    // S-4 Match the password
    // S-5 Generate refresh and access token
    // S-6 Set it in cookies

    // S-1
    const { password, email } = req.body;

    // S-2 
    if (!password || !email)
        throw new ApiError(400, "All fields are required")

    // S-3
    const user = await User.findOne({
        // $or: [{ username } || { email }]
        email
    })

    if (!user)
        throw new ApiError(404, "User not found, kindly register");

    // S-4
    // Note: when you have to interact with any mongodb queries of functions
    // then you can interact with the model (e.g. User model)
    // But when you have to use predefined methods created in models then you
    // use user which we get by findOne
    const passwordCheck = await user.isPasswordCorrect(password);

    if (!passwordCheck)
        throw new ApiError(401, "Incorrect Password")

    // S-5
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // S-6
    const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken");

    // Generate cookies
    const options = {
        httpOnly: true,
        secure: true // Modified only by server not by frontend
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
})

const logout = asyncHandler(async (req, res) => {
    // S-1 get id which you want to logout
    // S-2 remove cookies 
    // S-3 clear refresh token from user model

    // Main problem is that we do not have id for logout
    // We can't give a form at time of logout to fill email
    // So create your own middleware and add user to request

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshtoken: 1// this removes the field from the document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true // Modified only by server not by frontend
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, "User-logged out successfully")
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // S-1 get refresh token
    // S-2 verify refresh token
    // S-3 find a user from id we get from refresh token
    // S-4 Compare user stored refresh token with the token we get from cookies (both encrypted)

    // S-1
    try {
        const incomingRefreshToken = req.cookies?.refreshToken || req.body;

        if (!incomingRefreshToken || Object.keys(incomingRefreshToken).length === 0)
            throw new ApiError(401, "Unauthorised Request")


        // S-2 
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        // S-3 
        const userId = decodedToken?._id;
        const user = await User.findById({ _id: userId })

        if (!user)
            throw new ApiError(401, "Invalid refresh token");

        // S-4
        if (user?.refreshtoken !== incomingRefreshToken)
            throw new ApiError(401, "Refresh token is expired or used")

        // S-5
        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userId);

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // S-1 take update information
    // S-2 find user using req
    // S-3 Compare password
    // S-4 if correct then set new password for this first encrypt the password
    // S-5 return response

    try {
        // S-1
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword)
            throw new ApiError(400, "All fields are required")

        //  S-2
        const userId = req.user?._id; // as middleware adds user to req.

        if (!userId)
            throw new ApiError(401, "Unauthorised access")

        const user = await User.findById({
            _id: userId
        })

        if (!user)
            throw new ApiError(401, "User not found")

        // S-3
        const passwordCheck = await user.isPasswordCorrect(oldPassword);

        if (!passwordCheck)
            throw new ApiError(400, "Incorrect old password")

        // S-4
        user.password = newPassword; // automatically encrypted
        // login in model
        await user.save({ validateBeforeSave: false });

        // S-5
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password updated successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message)
    }
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById({ _id: req.user?._id })
        .select("-password");

    if (!user)
        throw new ApiError(400, "User not found");

    return res
        .status(200)
        .json(
            new ApiResponse(200,
                user,
                "Current user accessed successfully")
        )
})

// Always keep files update controller seperate
const updateAccountDetails = asyncHandler(async (req, res) => {
    // S-1 Take update information
    // S-2 get user details from req
    //S-3 update fields
    // return response

    // S-1
    const { fullName, email } = req.body

    if (!fullName || !email)
        throw new ApiError(400, "All fields are required")

    // S-2 & S-3
    const user = await User.findByIdAndUpdate(
        { _id: req.user?._id },
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password")

    // S-4
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    // S-1 get username information from url
    // S-2 Find the user

    // S-1
    const { username } = req.params

    if (!username?.trim())
        throw new ApiError(400, "Username is missing")

    // S-2
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            // Here you get list of people who subscribe your channel
            $lookup: {
                from: "subscriptions", // Remember the name here is the name which gets stored in DB
                localField: "_id", // User model ki _id ko
                foreignField: "channel", // Subscriber model ke channel entity se compare karo (like join)
                as: "subscribers"
            }
        },
        {
            // Here you get list of people to whom you have subscribed their channel
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo" // maine kisko subscribe kara h
            }
        },
        {
            $addFields: {
                subscribers: {
                    $size: "$subscribers"
                },
                subscribedTo: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    // We have to simply check whether subscriber document contains searched user id or not
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // Here decide what to give
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribedTo: 1,
                subscribers: 1,
                isSubscribed: 1
            }
        }
    ])

    console.log("Channel info returned by pipeline::", channel);

    if (!channel?.length)
        throw new ApiError(404, "Channel does not exists")

    return res
        .status(200)
        .json(
            new ApiResponse(200,
                channel[0],
                "User channel information fetched successfully")
        )
})

export {
    registerUser,
    login,
    logout,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    getUserChannelProfile
}
