import React from "react";
import { Navigate } from "react-router-dom";
import { isLogin } from "../lib/helper";

interface Props {
  children: React.ReactNode;
  requireAuth?: boolean; // true = cần login, false = public
}

export default function AuthRoute({ children, requireAuth = false }: Props) {
  const loggedIn = isLogin();

  // cần login mà chưa login
  if (requireAuth && !loggedIn) {
    return <Navigate to="/login" replace />;
  }

  // đã login mà vào trang public (login)
  if (!requireAuth && loggedIn) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
