import axios from "axios";
import { LMAdapter, LMChatParams } from "../types";
import { handleRequestError } from "../utils";

export class OpenAIAdapter implements LMAdapter {
  private apiKey: string;
  private model: string;
  private baseURL: string = "https://api.openai.com/v1";

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async chat(params: LMChatParams): Promise<string | null> {
    try {
      const { system, messages } = params;
      const url = `${this.baseURL}/chat/completions`;
      const headers = this.getHeaders();
      const body = {
        model: this.model,
        messages: [{ role: "system", content: system }, ...messages],
      };
      const { data } = await axios.post<OpenAIResponse>(url, body, { headers });
      return data.choices?.[0]?.message?.content ?? null;
    } catch (error) {
      return handleRequestError("Error in OpenAIAdapter.chat:", error);
    }
  }

  async models(): Promise<string[] | null> {
    try {
      const url = `${this.baseURL}/models`;
      const headers = this.getHeaders();
      const { data } = await axios.get<OpenAIModelsResponse>(url, { headers });
      const models = data.data?.map(({ id }) => id) ?? [];
      return models;
    } catch (error) {
      return handleRequestError("Error in OpenAIAdapter.models:", error);
    }
  }
}

// Interfaces
interface OpenAIResponse {
  choices?: { message?: { content: string } }[];
}

interface OpenAIModelsResponse {
  data?: { id: string }[];
}
