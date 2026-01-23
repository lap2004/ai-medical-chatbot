import Cookies from "js-cookie";

export const setAuthCookies = (accessToken: string, refreshToken?: string) => {
  const options = { path: "/", sameSite: "Lax" as const };

  if (accessToken) {
    Cookies.set("access_token", accessToken, options);
  }

  if (refreshToken) {
    Cookies.set("refresh_token", refreshToken, options);
  }
};

export const removeAuthCookies = () => {
  const options = { path: "/" };
  Cookies.remove("access_token", options);
  Cookies.remove("refresh_token", options);
};
