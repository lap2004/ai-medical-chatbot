import axios from "axios";
import Cookies from "js-cookie";
import { removeItemLocalStorage } from "../helper";
import { USER_NAME, ROLE_VALUE } from "@/services/config/const";

const timeOut = 600_000;

export const restTransport = () => {
  const client = axios.create({
    baseURL: "https://acdbentity-spell-desired-drum.trycloudflare.com",
    timeout: timeOut,
  });

  const get = async (url: string, config = {}) => {
    return await client.get(url, {
      headers: { ...config },
    });
  };

  const post = async (url: string, data?: any, config = {}) => {
    return await client.post(url, data, config);
  };

  const put = async (url: string, data?: any, config = {}) => {
    return await client.put(url, data, { headers: { ...config } });
  };

  const _delete = async (url: string, data?: any, config = {}) => {
    return await client.delete(url, {
      data,
      headers: { ...config },
    });
  };

  const rootUrl = () => client.defaults.baseURL;

  client.interceptors.request.use(
    (config) => {
      config.headers["Access-Control-Allow-Origin"] = "*";

      const accessToken = Cookies.get("access_token");
      const refreshToken = Cookies.get("refresh_token");

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      if (refreshToken) {
        config.headers.Refresh = refreshToken;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalConfig = error.config;

      if (error.response?.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;

        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        removeItemLocalStorage(USER_NAME);
        removeItemLocalStorage(ROLE_VALUE);
      }

      return Promise.reject(error);
    },
  );

  return { get, post, put, _delete, rootUrl };
};
