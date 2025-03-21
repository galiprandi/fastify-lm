import axios from "axios";
import { LMAdapter, LMChatParams } from "../types";
import { handleRequestError } from "./errors";

export class ClaudeAdapter implements LMAdapter {
  private apiKey: string;
  private model: string;
  private baseURL: string = "https://api.anthropic.com/v1";

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  private getHeaders() {
    return {
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    };
  }

  async chat(params: LMChatParams): Promise<string | null> {
    try {
      const { system, messages } = params;
      const url = `${this.baseURL}/messages`;
      const headers = this.getHeaders();
      const body = {
        model: this.model,
        max_tokens: 512,
        system,
        messages,
      };
      const { data } = await axios.post<ApiResponse>(url, body, { headers });
      return data.content?.[0]?.text ?? null;
    } catch (error) {
      return handleRequestError("Error in ClaudeAdapter.chat:", error);
    }
  }

  async models(): Promise<string[] | null> {
    try {
      const url = `${this.baseURL}/models`;
      const headers = this.getHeaders();
      const { data } = await axios.get<ClaudeModelsResponse>(url, {
        headers,
      });
      const models = data.data?.map(({ id }) => id) ?? [];
      return models;
    } catch (error) {
      return handleRequestError("Error in ClaudeAdapter.models:", error);
    }
  }
}

// Interfaces
interface ApiResponse {
  content?: {
    type: string;
    text: string;
  }[];
}

type ClaudeModelsResponse = {
  data: Array<{
    type: string;
    id: string;
    display_name: string;
    created_at: string;
  }>;
  has_more: boolean;
  first_id: string;
  last_id: string;
};
