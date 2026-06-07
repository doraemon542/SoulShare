import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  getLastMessages, // Add this new controller
  markMessagesAsRead,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/last-messages", protectRoute, getLastMessages); // Add this new route
router.get("/:id", protectRoute, getMessages);
router.patch("/mark-as-read/:id", protectRoute, markMessagesAsRead);

router.post("/send/:id", protectRoute, sendMessage);

export default router;