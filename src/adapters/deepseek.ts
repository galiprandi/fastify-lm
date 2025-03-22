import type { LMAdapter } from "../types";
import axios from "axios";
import { handleRequestError } from "../utils";

export class DeepSeekAdapter implements LMAdapter {
  private apiKey: string;
  private model: string;
  private baseURL: string = "https://api.deepseek.com";

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  chat: LMAdapter["chat"] = async (params) => {
    try {
      const { system, messages } = params;
      const url = `${this.baseURL}/chat/completions`;
      const headers = this.getHeaders();
      const body = {
        model: this.model,
        messages: [{ role: "system", content: system }, ...messages],
      };
      const { data } = await axios.post<ChatResponse>(url, body, {
        headers,
      });
      return data.choices?.[0]?.message?.content ?? null;
    } catch (error) {
      return handleRequestError("Error in DeepSeekAdapter.chat:", error);
    }
  }

  models:LMAdapter["models"] = async () => {
    try {
      const url = `${this.baseURL}/models`;
      const headers = this.getHeaders();
      const { data } = await axios.get<ModelsResponse>(
        url,
        { headers },
      );
      const models = data.data?.map(({ id }) => id).sort() ?? [];
      return models;
    } catch (error) {
      return handleRequestError("Error in DeepSeekAdapter.models:", error);
    }
  }
}

// Interfaces
interface ChatResponse  {
  id: string
  choices: {
    finish_reason: string
    index: number
    message: {
      content: string
      role: string
    }
  }[]
  created: number
  model: string
  object: string
  usage: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
}

interface ModelsResponse {
  data?: { id: string }[];
}
