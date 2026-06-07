import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, typingUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const isTyping = typingUsers[selectedUser._id];
  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {isTyping ? (
                <span className="text-emerald-500 font-medium">typing...</span>
              ) : isOnline ? (
                "Online"
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </div>
        <button onClick={() => useChatStore.getState().setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;