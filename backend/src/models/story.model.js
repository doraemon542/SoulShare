import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    type: { type: String, enum: ["happy", "sad"], required: true },
    reactions: {
      level1: { type: Number, default: 0 },
      level2: { type: Number, default: 0 },
      level3: { type: Number, default: 0 },
      level4: { type: Number, default: 0 },
    },
    reactedUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        level: { type: String, enum: ["level1", "level2", "level3", "level4"] },
      },
    ],
  },
  { timestamps: true }
);
const Story = mongoose.model("Story", storySchema);

export default Story;