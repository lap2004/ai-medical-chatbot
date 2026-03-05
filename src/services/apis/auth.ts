import { restTransport } from "@/lib/api";
import Cookies from "js-cookie";
const { post, get, put } = restTransport();

export const userLogin = async (body: any) => {
  return await post("/login", body);
};

export const userSignup = async (body: any) => {
  return await post("/signup", body);
};

export const userForgotPassword = async (body: any) => {
  return await post("/forgot-password", body);
};

export const userResetPassword = async (body: {
  current_password: string;
  new_password: string;
}) => {
  const token = Cookies.get("access_token");

  if (!token) {
    throw new Error("Missing access token");
  }

  return await post("/change-password", body, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
};
export const userMe = async (body: any) => {
  return await get("/me", body);
};

export const Protected = async (body: any) => {
  return await get("/users/protected", body);
};

export const userGoogleLogin = async (idToken: string) => {
  return await post("/auth/google", {
    id_token: idToken,
  });
};

export const updateProfile = async (fullName: string) => {
  return await put("/update-profile", {
    full_name: fullName,
  });
};

export const uploadAvatar = async (file: File): Promise<{ avatar_url: string }> => {
  const token = Cookies.get("access_token");
  const formData = new FormData();
  formData.append("file", file);
  const base = import.meta.env.VITE_API_BACKEND_DOMAIN || "http://localhost:8000";
  const res = await fetch(`${base}/upload-avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload avatar thất bại");
  }
  return res.json();
};
