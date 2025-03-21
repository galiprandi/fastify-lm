import fp from "fastify-plugin";
import { type FastifyInstance } from "fastify";
import { OpenAIAdapter } from "./adapters/openai";
import { GoogleGeminiAdapter } from "./adapters/google";
import { ClaudeAdapter } from "./adapters/claude";
import { DeepSeekAdapter } from "./adapters/deepseek";

const adapters: Record<string, any> = {
  openai: OpenAIAdapter,
  google: GoogleGeminiAdapter,
  claude: ClaudeAdapter,
  deepseek: DeepSeekAdapter,
};

async function fastifyLm(fastify: FastifyInstance, options: ProviderOptions) {
  if (
    !options.models ||
    !Array.isArray(options.models) ||
    options.models.length === 0
  )
    throw new Error("You must provide an array of models.");

  for (const config of options.models) {
    const { name, provider, model, apiKey } = config;
    if (!name || !provider || !model || !apiKey)
      throw new Error(
        `Model configuration is missing required fields: ${JSON.stringify(config)}`,
      );
    if (!adapters[provider])
      throw new Error(`Provider ${provider} is not supported.`);

    const instance = new adapters[provider](apiKey, model);
    fastify.decorate(name, instance);
  }
}

export default fp(fastifyLm, {
  fastify: "5.x",
  name: "fastify-lm",
});

// Interfaces
interface ProviderOptions {
  models: Array<{
    name: string;
    provider: string;
    model: string;
    apiKey: string;
  }>;
}
