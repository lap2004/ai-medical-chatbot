import { restTransport } from "@/lib/api";

const { post, get } = restTransport();

export const userLogin = async (body: any) => {
  return await post("/auth/login", body);
};

export const userSignup = async (body: any) => {
  return await post("/auth/signup", body);
};

export const userMe = async (body: any) => {
  return await get("/auth/me", body);
};

export const Protected = async (body: any) => {
  return await get("/users/protected", body);
};

export const userGoogleLogin = async (idToken: string) => {
  return await post("/auth/google", {
    id_token: idToken,
  });
};
