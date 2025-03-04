import Fastify from "fastify";
import { describe, it, expect } from "vitest";
import fastifyLm from "./index";

describe("fastify-lm plugin with 'test' provider", () => {
    // Helper to create a new Fastify instance with the plugin registered
    async function buildFastify() {
        const fastify = Fastify();
        await fastify.register(fastifyLm, { provider: "test" });
        await fastify.ready();
        return fastify;
    }

    it("should decorate Fastify with a 'chat' method that echoes the prompt", async () => {
        const fastify = await buildFastify();
        const testMessage = "Hello, test!";
        const response = await fastify.lm.chat(testMessage);
        expect(response).toBe(testMessage);
        await fastify.close();
    });
});
