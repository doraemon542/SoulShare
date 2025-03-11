import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useStoryStore = create((set, get) => ({
  stories: [], // Stores all stories (happy or sad)
  isPostingStory: false, // Loading state for posting a story
  isFetchingStories: false, // Loading state for fetching stories
  isReacting: false, // Loading state for reacting to a story

  // Fetch stories (happy or sad)
  fetchStories: async (type) => {
    set({ isFetchingStories: true });
    try {
      const res = await axiosInstance.get(`/stories?type=${type}`);
      set({ stories: res.data });
    } catch (error) {
      console.log("Error fetching stories:", error);
      toast.error("Failed to fetch stories");
    } finally {
      set({ isFetchingStories: false });
    }
  },

  // Post a story (happy or sad)
  postStory: async (content, type) => {
    set({ isPostingStory: true });
    try {
      const res = await axiosInstance.post("/stories", { content, type });
      set((state) => ({ stories: [res.data, ...state.stories] })); // Add new story to the top
      toast.success("Story posted successfully");
    } catch (error) {
      console.log("Error posting story:", error);
      toast.error("Failed to post story");
    } finally {
      set({ isPostingStory: false });
    }
  },

 // Toggle reaction
 toggleReaction: async (storyId, level) => {
    set({ isReacting: true });
    try {
      const res = await axiosInstance.post(`/stories/${storyId}/react`, { level });
      set((state) => ({
        stories: state.stories.map((story) =>
          story._id === res.data._id ? res.data : story
        ),
      }));
    } catch (error) {
      console.log("Error toggling reaction:", error);
      toast.error("Failed to toggle reaction");
    } finally {
      set({ isReacting: false });
    }
  },
}));