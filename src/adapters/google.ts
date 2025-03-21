import axios from "axios";
import { LMAdapter, LMChatParams } from "../types";
import { handleRequestError } from "./errors";

export class GoogleGeminiAdapter implements LMAdapter {
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseURL = `https://generativelanguage.googleapis.com/v1beta/models`;
  }

  async chat(params: LMChatParams): Promise<string | null> {
    try {
      const { system, messages } = params;
      const url = `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`;
      const body = {
        contents: [
          {
            parts: [
              ...messages.map(({ content: text }) => ({ text })),
              { text: system },
            ],
          },
        ],
      };
      const { data } = await axios.post<GeminiResponse>(url, body);
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch (error) {
      return handleRequestError("Error in GoogleGeminiAdapter.chat:", error);
    }
  }

  async models(): Promise<string[] | null> {
    try {
      const url = `${this.baseURL}?key=${this.apiKey}`;
      const { data } = await axios.get<GeminiModelsResponse>(url);
      const models = data.models?.map((model) => model.name) ?? [];
      return models;
    } catch (error) {
      return handleRequestError("Error in GoogleGeminiAdapter.models:", error);
    }
  }
}

// Interfaces
interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text: string }[];
    };
  }[];
}

interface GeminiModelsResponse {
  models?: { name: string }[];
}
