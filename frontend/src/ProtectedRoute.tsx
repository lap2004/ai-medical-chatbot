import { Navigate } from "react-router-dom";

import React from "react";
import { isLogin } from "./lib/helper";

interface Props {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: Props) => {
  if (!isLogin()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
