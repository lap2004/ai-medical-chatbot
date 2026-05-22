import ChatPage from "@/app/chat/page";
import LoginPage from "@/app/login/page";
import HomePage from "@/app/page";
import SignupPage from "@/app/signup/page";
import SupportPage from "@/app/support/page";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthRoute from "./AuthRoute";
import AdminRoute from "./AdminRoute";
import ForgotPasswordPage from "@/app/login/forgot_pw";
import UserManagementDashboard from "@/app/dashboard/page";

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
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <AdminRoute>
            <UserManagementDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/support"
        element={
          <AuthRoute requireAuth>
            <SupportPage />
          </AuthRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
