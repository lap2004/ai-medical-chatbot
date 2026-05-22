import React from "react";
import { Navigate } from "react-router-dom";
import { isLogin } from "../lib/helper";
interface Props {
  children: React.ReactNode;
  requireAuth?: boolean; 
}
export default function AuthRoute({ children, requireAuth = false }: Props) {
  const loggedIn = isLogin();
  if (requireAuth && !loggedIn) {
    return <Navigate to="/login" replace />;
  }
  if (!requireAuth && loggedIn) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
