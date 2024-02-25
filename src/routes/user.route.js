import {Router} from "express"
import {upload} from "../middleware/multer.middleware.js"
import { allUser, getUser, refreshTokenRotation, userLogin, userLogout, userRegister } from "../controllers/user.controller.js"
import { verifyJwt } from "../middleware/auth.middleware.js"
const router = Router()

router.route("/register").post(upload.single('pic'), userRegister) //// 'profile' this name should match with form send
router.route("/login").post(userLogin)

// refresh token rotation
router.route("/refresh").get(refreshTokenRotation)

// protected route
router.route("/allUser").get(verifyJwt, allUser);
router.route("/").get(verifyJwt, getUser);
router.route("/logout").post(verifyJwt, userLogout)


export default router