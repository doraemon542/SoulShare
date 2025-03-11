import Story from "../models/story.model.js";

// Post a story
export const postStory = async (req, res) => {
  const { content, type } = req.body;

  if (!content || !type) {
    return res.status(400).json({ message: "Content and type are required" });
  }

  try {
    const story = new Story({ content, type });
    await story.save();
    res.status(201).json(story);
  } catch (error) {
    console.log("Error in postStory controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Fetch stories (sorted by reactions and timestamp)
export const getStories = async (req, res) => {
  const { type } = req.query; // Query parameter to filter by type (happy/sad)

  try {
    const stories = await Story.find({ type }).sort({
      "reactions.level1": -1,
      "reactions.level2": -1,
      "reactions.level3": -1,
      "reactions.level4": -1,
      createdAt: -1,
    });
    res.status(200).json(stories);
  } catch (error) {
    console.log("Error in getStories controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update reactions
export const reactToStory = async (req, res) => {
  const { id } = req.params;
  const { level } = req.body;
  const userId = req.user._id; // Assuming you have user authentication

  try {
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    // Check if the user has already reacted with this level
    const userReactionIndex = story.reactedUsers.findIndex(
      (reaction) => reaction.userId.toString() === userId.toString() && reaction.level === level
    );

    if (userReactionIndex === -1) {
     
      // User hasn't reacted with this level yet → Add reaction
      story.reactions[level] += 1;
      story.reactedUsers.push({ userId, level }); // Track the user's reaction
    } else {
      // User has already reacted with this level → Remove reaction
      story.reactions[level] -= 1;
      story.reactedUsers.splice(userReactionIndex, 1); // Remove the user's reaction
    }

    await story.save();
    res.status(200).json(story);
  } catch (error) {
    console.log("Error in reactToStory controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};