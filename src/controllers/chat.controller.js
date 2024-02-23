import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createChat = asyncHandler(async (req, res) => {
  const { userId } = req.body; // with whom you want to chat
  if (!userId) {
    throw new ApiError(400, "UserId not Send");
  }

  // if chat with that user exist send the chats
  let existChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password -refreshToken") // insert the ref user info, (User schema)
    .populate("latestMessage"); // insert the ref message

  existChat = await User.populate(existChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (existChat.length > 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, existChat[0], "Already existed chat")); // as array contain one user in private chat
  }

  // if chat doesnot exist, create new chat
  const createdChat = await Chat.create({
    chatName: "sender",
    isGroupChat: false,
    users: [req.user._id, userId],
  });

  const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
    "users",
    "-password -refreshToken"
  );
  res.status(200).json(new ApiResponse(200, FullChat, "creaed new Chat"));
});

const fetchChat = asyncHandler(async (req, res) => {
  let allChat = await Chat.find({
    users: { $elemMatch: { $eq: req.user._id } },
  })
    .populate("users", "-password -refreshToken")
    .populate("groupAdmin", "-password -refreshToken")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  allChat = await User.populate(allChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  res.status(200).json(new ApiResponse(200, allChat, "All chats"));
});

const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).json(new ApiError(400, "Please fill all field"));
  }

  //   console.log("Body: ", req.body)

  let users = req.body.users; //remember to JSON.perse if show error

  if (users.length < 2) {
    return res
      .status(400)
      .json(
        new ApiError(400, "More then two users are required to form a group")
      );
  }

  // adding the login user who created the group
  users.push(req.user);

  const groupChat = await Chat.create({
    chatName: req.body.name,
    users: users,
    isGroupChat: true,
    groupAdmin: req.user,
  });

  if (!groupChat) {
    throw new ApiError(500, "Failed to create group");
  }

  const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
    .populate("users", "-password -refreshToken")
    .populate("groupAdmin", "-password -refreshToken");

  if (!fullGroupChat) {
    throw new ApiError(500, "Try again");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, fullGroupChat, "Chat Group created Successfully")
    );
});

const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;
  if (!chatId || !chatName) {
    throw new ApiError(404, "Chat id and name missing");
  }

  const updatedGroup = await Chat.findByIdAndUpdate(
    chatId,
    { chatName: chatName },
    { new: true }
  )
    .populate("users", "-password -refreshToken")
    .populate("groupAdmin", "-password -refreshToken");

  console.log(updatedGroup);

  if (!updatedGroup) {
    throw new ApiError(404, "Group not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedGroup, "Renamed group successfully"));
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  // console.log(req.body)
  if (!chatId || !userId) {
    throw new ApiError(400, "ChatId and UserId missing");
  }

  const updatedGroup = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password -refreshToken")
    .populate("groupAdmin", "-password -refreshToken");

  if (!updatedGroup) {
    throw ApiError(404, " Failed to add user, Chat not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedGroup, "User added to the group"));
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    throw new ApiError(400, "ChatId and UserId missing");
  }

  // check if the requester is admin
  const chatGroup = await Chat.findById(chatId);
  // console.log(chatGroup);

  if (!chatGroup) {
    throw new ApiError(400, "Chat not found");
  }

  // console.log((chatGroup?.groupAdmin).toString(), req?.user?._id);

  if ((chatGroup?.groupAdmin).toString() !== req?.user?._id) {
    throw new ApiError(409, "you are not admin");
  }

  const updatedGroup = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password -refreshToken")
    .populate("groupAdmin", "-password -refreshToken");

  if (!updatedGroup) {
    throw new ApiError(404, "Unable to remove, Chat Not Found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedGroup, "Successfully removed from group")
    );
});

const deleteGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  if (!chatId) {
    throw new ApiError(400, "ChatId missing");
  }

  // check if the requester is admin
  const chat = await Chat.findById(chatId);
  // console.log(chat);

  if (!chat) {
    throw new ApiError(400, "Chat not found");
  }

  // console.log((chat?.groupAdmin).toString(), req?.user?._id);

  if (chat?.isGroupChat && (chat?.groupAdmin).toString() !== req?.user?._id) {
    throw new ApiError(409, "you are not admin");
  }

  const del = await Chat.deleteOne({ _id: chatId });

  if (!del) {
    throw new ApiError(404, "Group deletion failed");
  }

  res.status(200).json(new ApiResponse(200, {}, "Group Deleted successfully"));
});

export {
  createChat,
  fetchChat,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  deleteGroup,
};
