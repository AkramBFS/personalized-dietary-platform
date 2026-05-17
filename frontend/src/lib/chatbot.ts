import api, { unwrapResponse } from "./api";

export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    const response = await api.post("chatbot/", { message });
    // The axios response.data will have { status: "success", data: { reply: "...", role: "assistant" } }
    // unwrapResponse extracts the inner data object
    const data = unwrapResponse(response.data) as any;
    
    if (data && data.reply) {
      return data.reply;
    }
    
    return "Received an unexpected response from NutriBot.";
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || "Failed to communicate with NutriBot.");
  }
};
