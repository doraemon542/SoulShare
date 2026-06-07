import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

const loadUnreadCounts = () => {
  const storedCounts = localStorage.getItem("unreadCounts");
  return storedCounts ? JSON.parse(storedCounts) : {};
};

const saveUnreadCounts = (counts) => {
  localStorage.setItem("unreadCounts", JSON.stringify(counts));
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  lastMessages: {},
  unreadCounts: loadUnreadCounts(),
  typingUsers: {}, // { userId: true/false }

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
      get().fetchLastMessagesForAllUsers();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  fetchLastMessagesForAllUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/last-messages");
      const lastMessages = res.data.reduce((acc, msg) => {
        acc[msg.userId] = msg.lastMessage;
        return acc;
      }, {});
      set({ lastMessages });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      set((state) => {
        const updatedCounts = { ...state.unreadCounts, [userId]: 0 };
        saveUnreadCounts(updatedCounts);
        return { unreadCounts: updatedCounts };
      });
      await axiosInstance.patch(`/messages/mark-as-read/${userId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
      set((state) => ({
        lastMessages: {
          ...state.lastMessages,
          [selectedUser._id]: res.data,
        },
      }));
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const loggedInUserId = useAuthStore.getState().authUser?._id;
    if (!socket || !loggedInUserId) return;

    socket.off("newMessage");
    socket.off("messageSeen");
    socket.off("userTyping");
    socket.off("userStopTyping");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser } = get();

      const otherUserId =
        newMessage.senderId === loggedInUserId
          ? newMessage.receiverId
          : newMessage.senderId;

      const isCurrentChat =
        selectedUser &&
        (newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id);

      if (isCurrentChat) {
        set((state) => ({ messages: [...state.messages, newMessage] }));
        // Auto mark as read if chat is open and message is incoming
        if (newMessage.senderId !== loggedInUserId) {
          axiosInstance.patch(`/messages/mark-as-read/${newMessage.senderId}`);
        }
      }

      set((state) => ({
        lastMessages: {
          ...state.lastMessages,
          [otherUserId]: newMessage,
        },
      }));

      if (
        newMessage.receiverId === loggedInUserId &&
        (!selectedUser || selectedUser._id !== newMessage.senderId)
      ) {
        set((state) => {
          const updatedCounts = {
            ...state.unreadCounts,
            [newMessage.senderId]: (state.unreadCounts[newMessage.senderId] || 0) + 1,
          };
          saveUnreadCounts(updatedCounts);
          return { unreadCounts: updatedCounts };
        });
      }
    });

    // When the other person sees our messages, mark them as read in local state
    socket.on("messageSeen", ({ by, from }) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id === by) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.senderId === from ? { ...m, read: true } : m
          ),
        }));
      }
    });

    // Typing indicators
    socket.on("userTyping", ({ senderId }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [senderId]: true },
      }));
    });

    socket.on("userStopTyping", ({ senderId }) => {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [senderId]: false },
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messageSeen");
      socket.off("userTyping");
      socket.off("userStopTyping");
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    if (selectedUser) {
      set((state) => {
        const updatedCounts = { ...state.unreadCounts, [selectedUser._id]: 0 };
        saveUnreadCounts(updatedCounts);
        return { unreadCounts: updatedCounts };
      });
    }
  },
}));