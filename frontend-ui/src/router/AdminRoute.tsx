import React from "react";
import { Navigate } from "react-router-dom";
import { getUserRole, isLogin } from "../lib/helper";
interface Props {
    children: React.ReactNode;
}
const AdminRoute = ({ children }: Props) => {
    const loggedIn = isLogin();
    const role = getUserRole();
    if (!loggedIn) {
        return <Navigate to="/login" replace />;
    }
    if (role !== "admin") {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};
export default AdminRoute;
