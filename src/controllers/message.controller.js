import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";

const allMessages = asyncHandler(async (req, res) => {
  console.log(req.params)
  if (!req?.params?.chatId) {
    throw new ApiError(400, "Chat id not given");
  }

  const messages = await Message.find({ chat: req.params.chatId })
    .populate("sender", "name pic email")
    .populate("chat");

  if (!messages) {
    throw new ApiError(500, "Chat not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, messages, "got messages successfully"));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    throw new ApiError(400, "Content and chatid missing");
  }

  // Create and save the message in db
  const newMessage = await Message.create({
    sender: req.user._id,
    content: content,
    chat: chatId,
  });

  if (!newMessage) {
    throw new ApiError(500, "failed to send message");
  }

  // Find the created message and populate
  let populatedMessage = await Message.findById(newMessage._id).populate([
    { path: "sender", select: "name pic email" }, // Populate sender with selected fields
    {
      path: "chat",
      populate: {
        path: "users", // Populate users within the chat document
        select: "name pic email", // Select specific fields for those users
      },
    },
  ]);

  if (!populatedMessage) {
    throw new ApiError(500, "failed to populate the created message");
  }
  // add latest message to the chat
  const updatedChat = await Chat.findByIdAndUpdate(req.body.chatId, {
    latestMessage: populatedMessage,
  })

  // add letest message to chat

  if (!updatedChat) {
    throw new ApiError(400, "failed to update latest message");
  }

  res
    .status(200)
    .json(new ApiResponse(200, populatedMessage, "message send successfully"));
});

export { allMessages, sendMessage };
