import axios from "axios";
import { LMAdapter, LMChatParams, Adapter } from "../types";
import { handleRequestError } from "../utils";

export class DeepSeekAdapter implements LMAdapter, Adapter {
  public apiKey: string;
  public model: string;
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

  async chat(params: LMChatParams): Promise<string | null> {
    try {
      const { system, messages } = params;
      const url = `${this.baseURL}/chat/completions`;
      const headers = this.getHeaders();
      const body = {
        model: this.model,
        messages,
      };
      const { data } = await axios.post<DeepSeekResponse>(url, body, {
        headers,
      });
      return data.choices?.[0]?.message?.content ?? null;
    } catch (error) {
      return handleRequestError("Error in DeepSeekAdapter.chat:", error);
    }
  }

  async models(): Promise<string[] | null> {
    try {
      const url = `${this.baseURL}/models`;
      const headers = this.getHeaders();
      const { data } = await axios.get<DeepSeekModelsResponse>(
        url,
        { headers },
      );
      const models = data.data?.map(({ id }) => id) ?? [];
      return models;
    } catch (error) {
      return handleRequestError("Error in DeepSeekAdapter.models:", error);
    }
  }
}

// Interfaces
interface DeepSeekResponse  {
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

interface DeepSeekModelsResponse {
  data?: { id: string }[];
}
