import { restTransport } from "@/lib/api";

const { get, post, patch, _delete } = restTransport();

// ── Analytics ────────────────────────────────────────────────

export const getstats = async (body: any) => {
  return await get("/admin/stats", body);
};

export const getAnalytics = async () => {
  const response = await get("/admin/analytics");
  return response.data;
};

export const useTrack = async (body: any) => {
  return await post("/track", body);
};

// ── User Management ──────────────────────────────────────────

export interface ListUsersParams {
  q?: string;
  role?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "Active" | "Inactive";
  created_at: string;
  avatar_url?: string | null;
}

export interface ListUsersResponse {
  total: number;
  page: number;
  page_size: number;
  items: UserItem[];
}

export const listUsers = async (params: ListUsersParams = {}): Promise<ListUsersResponse> => {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.role) query.set("role", params.role);
  if (params.status) query.set("status", params.status);
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  const qs = query.toString();
  const response = await get(`/admin/users${qs ? `?${qs}` : ""}`);
  return response.data;
};

export const createUser = async (body: {
  full_name: string;
  email: string;
  password: string;
  is_admin: boolean;
  is_active: boolean;
}): Promise<UserItem> => {
  const response = await post("/admin/users", body);
  return response.data;
};

export const updateUser = async (
  userId: number,
  body: {
    full_name?: string;
    email?: string;
    password?: string;
    is_admin?: boolean;
    is_active?: boolean;
  }
): Promise<UserItem> => {
  const response = await patch(`/admin/users/${userId}`, body);
  return response.data;
};

export const deleteUser = async (userId: number): Promise<void> => {
  await _delete(`/admin/users/${userId}`);
};

// ── Settings ─────────────────────────────────────────────────

export interface SystemSettings {
  allow_signup: boolean;
  qa_topk: number;
  gemini_model: string;
}

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "Active" | "Inactive";
  created_at: string;
  avatar_url?: string | null;
}

export const getSystemSettings = async (): Promise<SystemSettings> => {
  const res = await get("/admin/settings");
  return res.data;
};

export const updateSystemSettings = async (
  body: Partial<SystemSettings>
): Promise<SystemSettings> => {
  const res = await patch("/admin/settings", body);
  return res.data;
};

export const getAdminProfile = async (): Promise<AdminProfile> => {
  const res = await get("/admin/me");
  return res.data;
};

export const updateAdminProfile = async (body: {
  full_name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}): Promise<AdminProfile> => {
  const res = await patch("/admin/me", body);
  return res.data;
};
