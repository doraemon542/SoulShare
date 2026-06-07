import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import mongoose from "mongoose";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const senderSocketId = getReceiverSocketId(senderId);
    const receiverSocketId = getReceiverSocketId(receiverId);

    if (senderSocketId) io.to(senderSocketId).emit("newMessage", newMessage);
    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLastMessages = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const lastMessages = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", loggedInUserId] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
        },
      },
    ]);

    const formattedLastMessages = lastMessages.map((msg) => ({
      userId: msg._id,
      lastMessage: {
        senderId: msg.lastMessage.senderId,
        receiverId: msg.lastMessage.receiverId,
        text: msg.lastMessage.text,
        image: msg.lastMessage.image,
        createdAt: msg.lastMessage.createdAt,
        read: msg.lastMessage.read,
      },
    }));

    res.status(200).json(formattedLastMessages);
  } catch (error) {
    console.log("Error in getLastMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.user._id;

    await Message.updateMany(
      { senderId, receiverId, read: false },
      { $set: { read: true } }
    );

    // Notify the sender that their messages were seen
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSeen", { by: receiverId, from: senderId });
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.log("Error in markMessagesAsRead controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};