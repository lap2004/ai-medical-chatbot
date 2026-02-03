import { restTransport } from "@/lib/api";


const { get, post } = restTransport();

export const getstats = async (body: any) => {
  return await get("/admin/stats", body);
};

// ... existing code ...
export const getAnalytics = async () => {
  const response = await get("/admin/analytics");
  return response.data; // Expecting AnalyticsStats interface
};

export const useTrack = async (body: any) => {
  return await post("/track", body);
};
