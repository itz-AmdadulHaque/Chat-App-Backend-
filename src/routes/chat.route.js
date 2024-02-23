import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  addToGroup,
  createChat,
  createGroupChat,
  deleteGroup,
  fetchChat,
  removeFromGroup,
  renameGroup,
} from "../controllers/chat.controller.js";

const router = Router();

router.route("/").post(verifyJwt, createChat); // all chat (group included)
router.route("/").get(verifyJwt, fetchChat); // all chats one to one or group

router.route("/group").post(verifyJwt, createGroupChat);
router.route("/renameGroup").put(verifyJwt, renameGroup);
router.route("/addToGroup").put(verifyJwt, addToGroup);
router.route("/removeFromGroup").put(verifyJwt, removeFromGroup);
router.route('/deleteGroup').delete(verifyJwt, deleteGroup)

export default router;
