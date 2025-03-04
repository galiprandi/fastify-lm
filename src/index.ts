import fp from "fastify-plugin";
import OpenAI from "openai";
import { type ProviderOptions } from "./interfaces";
import { type FastifyInstance } from "fastify";
import { type LmClient } from "./types/fastify-lm";



async function fastifyLm(
  fastify: FastifyInstance,
  { provider, ...rest }: ProviderOptions
) {
  let client: LmClient;
  if (provider === "test")
    client = { chat: async <T>(msg: T): Promise<T> => msg };
  else if (provider === "openai")
    client = new OpenAI({ ...rest });
  else
    throw new Error("Unsupported provider");

  fastify.decorate<LmClient>("lm", client);
}

export default fp(fastifyLm, {
  fastify: "5.x",
  name: "fastify-lm",
});

