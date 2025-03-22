export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LMAdapter {
  chat(params: { system: string; messages: Message[] }): Promise<string | null>;
  models(): Promise<string[] | null>;
  getHeaders?(): Record<string, string>;
}

export type LMChatParams = Parameters<LMAdapter["chat"]>[0];

export interface LMConfig {
  name: string;
  provider: "openai" | "google" | "deepseek" | "meta";
  model: string;
  apiKey: string;
}

declare module "fastify" {
  interface FastifyInstance {
    [key: string]: {
      chat: (params: {
        system: string;
        messages: Message[];
      }) => Promise<string | null>;
      models: () => Promise<string[] | null>;
      getHeaders?: () => Record<string, string>;
    };
  }
}
