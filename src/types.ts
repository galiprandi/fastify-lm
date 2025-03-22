 interface LMChatMessages {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LMAdapter {
  chat(params: { system: string; messages: LMChatMessages[] }): Promise<string | null>;
  models(): Promise<string[] | null>;
}

export type AvailableAdapters = Record<LMProviders, new (apiKey: string, model: string) => LMAdapter>;


export interface LMConfig {
  name: string;
  provider: LMProviders;
  model: string;
  apiKey: string;
}

export type LMProviders = "openai" | "google" | "deepseek" | "claude"

declare module "fastify" {
  interface FastifyInstance {
    [key: string]: LMAdapter;
  }
}
