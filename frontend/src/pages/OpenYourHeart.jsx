import { useEffect, useState } from "react";
import { useStoryStore } from "../store/storyStore.js";
import { useAuthStore } from "../store/useAuthStore.js";

export default function OpenYourHeart() {
  const { stories, fetchStories, postStory, toggleReaction, isPostingStory } = useStoryStore();
  const { authUser } = useAuthStore();
  const [newStory, setNewStory] = useState("");

  // Fetch sad stories on component mount
  useEffect(() => {
    fetchStories("sad");
  }, [fetchStories]);

  // Handle posting a story
  const handlePostStory = async () => {
    if (newStory.trim()) {
      await postStory(newStory, "sad");
      setNewStory("");
    }
  };

  // Check if the current user has reacted with a specific level
  const hasReacted = (story, level) => {
    return story.reactedUsers.some(
      (reaction) => reaction.userId === authUser._id && reaction.level === level
    );
  };

  return (
    <div className="pt-40 max-w-2xl mx-auto">
      {/* Post Box */}
      <div className="mb-8">
        <textarea
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Share your pain... Remember, every storm eventually passes. 🌧️✨"
          value={newStory}
          onChange={(e) => setNewStory(e.target.value)}
          rows="4"
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
          onClick={handlePostStory}
          disabled={isPostingStory}
        >
          {isPostingStory ? "Posting..." : "Post Your Story"}
        </button>
      </div>

      {/* Others' Stories */}
      <div className="space-y-6">
  {stories.map((story) => (
    <div key={story._id} className="p-4 border border-gray-200 rounded-lg shadow-sm">
      <p className="text-gray-700">{story.content}</p>
      <div className="mt-4 flex gap-4">
        <button
          className={`flex items-center gap-1 reaction-emoji ${
            hasReacted(story, "level1") ? "active crying" : ""
          }`}
          onClick={() => toggleReaction(story._id, "level1")}
        >
           <span className="inline-block scale-x-[-1]">😢</span> {story.reactions.level1}
        </button>
        <button
          className={`flex items-center gap-1 reaction-emoji ${
            hasReacted(story, "level2") ? "active sad" : ""
          }`}
          onClick={() => toggleReaction(story._id, "level2")}
        >
          😞 {story.reactions.level2}
        </button>
        <button
          className={`flex items-center gap-1 reaction-emoji ${
            hasReacted(story, "level3") ? "active cry-loudly" : ""
          }`}
          onClick={() => toggleReaction(story._id, "level3")}
        >
          😭 {story.reactions.level3}
        </button>
        <button
          className={`flex items-center gap-1 reaction-emoji ${
            hasReacted(story, "level4") ? "active broken-heart" : ""
          }`}
          onClick={() => toggleReaction(story._id, "level4")}
        >
          💔 {story.reactions.level4}
        </button>
      </div>
    </div>
  ))}
</div>
    </div>
  );
}