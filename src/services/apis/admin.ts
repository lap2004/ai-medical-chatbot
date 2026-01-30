import { restTransport } from "@/lib/api";


const { get, post} = restTransport();

export const getstats = async (body: any) => {
  return await get("/admin/stats", body);
};

export const useTrack = async (body: any) => {
  return await post("/track", body);
};
