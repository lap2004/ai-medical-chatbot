import { restTransport } from "@/lib/api";

const { post } = restTransport();

export const chat = async (body: { question: string; user_id: string }) => {
  return await post("/chat", body);
};
