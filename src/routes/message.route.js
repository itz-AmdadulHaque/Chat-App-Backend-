import { Router } from "express";
import { allMessages, sendMessage } from "../controllers/message.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/:chatId").get(verifyJwt, allMessages);
router.route("/").post(verifyJwt, sendMessage);

export default router;

