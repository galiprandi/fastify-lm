type LMProviders = 'test' | 'openai' | 'google' | 'deepseek' | 'claude' | 'llama' | 'mistral'

export interface LMAdapter {
  chat(params: {
    system: string;
    messages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[];
  }): Promise<string | null>;
  models(): Promise<string[] | null>;
}

export interface LMPluginOptions {
  models: {
    name: string;
    provider: LMProviders;
    model: string;
    apiKey: string;
  }[];
}

export type AvailableAdapters = Record<
  LMProviders,
  new (apiKey: string, model: string) => LMAdapter
>

declare module 'fastify' {
  interface FastifyInstance {
    [key: string]: LMAdapter;
  }
}
