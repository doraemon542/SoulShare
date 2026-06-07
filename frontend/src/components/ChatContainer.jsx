import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { ChevronDown, Check, CheckCheck } from "lucide-react";

const formatDateSeparator = (date) => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
};

const shouldShowDateSeparator = (messages, index) => {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].createdAt).toDateString();
  const curr = new Date(messages[index].createdAt).toDateString();
  return prev !== curr;
};

const MessageTick = ({ message, authUser }) => {
  if (message.senderId !== authUser._id) return null;
  if (message.read)
    return <CheckCheck size={13} className="text-blue-300 shrink-0" />;
  return <Check size={13} className="text-white/60 shrink-0" />;
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const isFirstLoad = useRef(true); // track if this is initial load

  // Effect 1 - reset first load flag when user changes
useEffect(() => {
  isFirstLoad.current = true;
  if (selectedUser) {
    getMessages(selectedUser._id);
    subscribeToMessages();
  }
  return () => unsubscribeFromMessages();
}, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

// Effect 2 - scroll to bottom
useEffect(() => {
  if (!messageEndRef.current || messages.length === 0) return;

  if (isFirstLoad.current && !isMessagesLoading) {
    // Messages just finished loading — jump instantly to bottom
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "instant" });
      isFirstLoad.current = false;
    }, 50);
  } else if (!isFirstLoad.current) {
    // New message came in after load — smooth scroll
    messageEndRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages, isMessagesLoading]);
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distanceFromBottom > 200);
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <ChatHeader />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {messages.map((message, index) => {
          const isMine = message.senderId === authUser._id;

          return (
            <div key={message._id}>
              {shouldShowDateSeparator(messages, index) && (
                <div className="flex items-center justify-center my-4">
                  <span className="bg-base-300 text-base-content/60 text-xs px-3 py-1 rounded-full">
                    {formatDateSeparator(message.createdAt)}
                  </span>
                </div>
              )}

              <div className={`flex items-end gap-2 mb-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <img
                  src={
                    isMine
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="avatar"
                  className="size-7 rounded-full object-cover shrink-0 self-end mb-1"
                />

                {/* Bubble */}
                <div
                  className={`
                    max-w-[70%] px-3 py-2 rounded-2xl text-sm shadow-sm
                    ${isMine
                      ? "bg-emerald-500 text-white rounded-br-sm"
                      : "bg-base-200 text-base-content rounded-bl-sm"
                    }
                  `}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="max-w-[200px] rounded-lg mb-2"
                    />
                  )}
                  {message.text && <p className="leading-relaxed">{message.text}</p>}

                  {/* Time + tick */}
                  <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                    <time className={`text-[10px] ${isMine ? "text-white/60" : "opacity-50"}`}>
                      {formatMessageTime(message.createdAt)}
                    </time>
                    <MessageTick message={message} authUser={authUser} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 z-10 btn btn-circle btn-sm shadow-lg bg-base-100 border border-base-300"
        >
          <ChevronDown size={18} />
        </button>
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;