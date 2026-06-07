import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading, 
    lastMessages, 
    unreadCounts 
  } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = (showOnlineOnly
  ? users.filter((user) => onlineUsers.includes(user._id))
  : users
).sort((a, b) => {
  const aTime = lastMessages[a._id]?.createdAt
    ? new Date(lastMessages[a._id].createdAt).getTime()
    : 0;
  const bTime = lastMessages[b._id]?.createdAt
    ? new Date(lastMessages[b._id].createdAt).getTime()
    : 0;
  return bTime - aTime; // most recent first
});

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const lastMessage = lastMessages[user._id];
          // Use unreadCounts instead of lastMessage.read for more reliable state
          const hasUnread = unreadCounts[user._id] > 0;
          const isSelected = selectedUser?._id === user._id;

          return (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
              }}
              className={
                `w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${isSelected ? "bg-base-300 ring-1 ring-base-300" : ""}
                ${hasUnread ? "bg-blue-100" : ""}`
              }
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
                {lastMessage && (
                  <div className={`text-sm truncate ${hasUnread ? "font-bold" : ""}`}>
                    {lastMessage.text}
                  </div>
                )}
              </div>
              {/* Show badge only if there are unread messages AND user is not selected */}
              {hasUnread && !isSelected && (
                <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCounts[user._id]}
                </span>
              )}
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;