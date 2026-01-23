import ChatPage from "@/app/chat/page";
import LoginPage from "@/app/login/page";
import HomePage from "@/app/page";
import SignupPage from "@/app/signup/page";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthRoute from "./AuthRoute";

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AuthRoute requireAuth>
            <HomePage />
          </AuthRoute>
        }
      />

      <Route
        path="/chat"
        element={
          <AuthRoute requireAuth>
            <ChatPage />
          </AuthRoute>
        }
      />

      <Route
        path="/login"
        element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        }
      />

      <Route path="/signup" element={<SignupPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
