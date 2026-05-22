export type ChatTextRes = {
  answer: string;
  contexts?: any[];
};
export async function postTextChat(params: {
  text: string;
  language?: string;
  tts?: boolean;
}): Promise<ChatTextRes> {
  const res = await fetch("/chat/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
