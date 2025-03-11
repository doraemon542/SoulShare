import express from "express";
import {
  postStory,
  getStories,
  reactToStory,
} from "../controllers/story.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Post a story
router.post("/", protectRoute, postStory);

// Fetch stories (filter by type: happy/sad)
router.get("/", protectRoute, getStories);

// React to a story
router.post("/:id/react", protectRoute, reactToStory);

export default router;