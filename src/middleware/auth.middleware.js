import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyJwt = asyncHandler( async (req, res, next) => {
  // get access token from request header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Invalid Token Bearer");
  }

  const accessToken = authHeader.split(" ")[1];
  // console.log(accessToken);

  //verify the token
  const userDecoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  if (!userDecoded) {
    throw new ApiError(401, "Invalid access token");
  }
  // console.log("///middleware: \n", userDecoded);

  // add 'user' property to req object
  req.user = {
    _id: userDecoded?._id,
    name: userDecoded?.name,
    email: userDecoded?.email,
  };
  next();
});
export { verifyJwt };
