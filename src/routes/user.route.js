import {Router} from "express"
import {upload} from "../middleware/multer.middleware.js"
import { userLogin, userLogout, userRegister } from "../controllers/user.controller.js"
import { verifyJwt } from "../middleware/auth.middleware.js"
const router = Router()

router.route("/register").post(upload.single('pic'), userRegister) //// 'profile' this name should match with form send
router.route("/login").post(userLogin)

// protected route
router.route("/logout").post(verifyJwt, userLogout)

export default router