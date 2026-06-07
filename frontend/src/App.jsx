import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";

import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import OpenYourHeart from "./pages/OpenYourHeart";
import ShareYourSmile from "./pages/ShareYourSmile";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();

  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();

useEffect(() => {
  if (authUser) {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }
}, [authUser, subscribeToMessages, unsubscribeFromMessages]);

  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div >
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
       
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />

        <Route path="/openyourheart" element={authUser ? <OpenYourHeart /> : <Navigate to="/" />} />
        <Route path="/shareyoursmile" element={authUser ? <ShareYourSmile /> : <Navigate to="/" />} />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
