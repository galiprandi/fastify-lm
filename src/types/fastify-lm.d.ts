import "fastify";

declare module "fastify" {
    interface FastifyInstance {
        lm: LmClient;
    }
}


export type LmClient = OpenAI | { chat: <T>(msg: T) => Promise<T> };