import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId); // user is Instance of User model

    const accessToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );

    const refreshToken = jwt.sign(
      {
        _id: user._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );

    //saving new refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const userRegister = asyncHandler(async (req, res) => {
  // check all field are given or not
  const { name, email, password } = req.body; // multer separate data as req.body and req.file

  if (!name || !email || !password) {
    throw new ApiError(400, "All fields required");
  }

  // user exist or not
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "User already Exist");
  }

  // if image file given then upload to cloudinary
  // console.log("//////////multer:",req.file)
  let profileImageLacalPath; //cover image is optional
  if (
    req.file?.path // multer store image to 'public/temp' and return path
  ) {
    profileImageLacalPath = req.file?.path;
  }

  const profileImage = await uploadOnCloudinary(profileImageLacalPath);

  //create and save to database
  const user = await User.create({
    name,
    email,
    password, // password will be hashed befoe saving
    pic: profileImage?.url,
  });

  // save refresh token to db and return access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // option for cookie, cookie() method from express set the cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: createdUser,
          accessToken,
        },
        "User registered Successfully"
      )
    );
});

const userLogin = asyncHandler(async (req, res) => {
  // check all field are given or not
  const { email, password } = req.body; // remember to send json or x-urlencoded data from frontend

  if (!email || !password) {
    throw new ApiError(400, "All fields required");
  }

  //check user with the email exist or not
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //check if he password is valid
  const isPasswordValid = await user.matchPassword(password); // 'User' model instance 'user' can access  mongoose method

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // save refresh token to db and return access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // option for cookie, cookie() method from express set the cookie
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: createdUser,
          accessToken,
        },
        "User logged In Successfully"
      )
    );
});

const userLogout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true, // function return the updated value.
    }
  );

  const options = {
    httpOnly: true, // this make cookie only accessble from backend
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options) //express method
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export { userRegister, userLogin, userLogout };
