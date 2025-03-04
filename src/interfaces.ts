import { ClientOptions } from "openai";

export type Provider = "openai" | "test";

export interface OpenAIProviderOptions extends ClientOptions {
  provider: "openai";
}

export interface TestProviderOptions {
  provider: "test";
}

export type ProviderOptions = OpenAIProviderOptions | TestProviderOptions;
