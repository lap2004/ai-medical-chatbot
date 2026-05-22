import { restTransport } from "@/lib/api";

const { post, get, put, _delete } = restTransport();

export const getAllUser = async (body: any) => {
  return await get("/users/all-users", body);
};

export const createUser = async (body: any) => {
  return await post("/users/create", body);
};

export const updateUserById = async (body: any) => {
  const { id, ...data } = body;
  return await put(`/admin/${id}`, data);
};

export const deleteUserById = async ({ id }: { id: string }) => {
  return await _delete(`/admin/${id}`);
};
