# Automatic Content Moderation

## Overview

Content moderation is essential for ensuring a safe and respectful environment in applications that allow user-generated content. With `fastify-lm`, you can integrate AI-powered moderation to detect and filter offensive or inappropriate messages before they are processed.

## How It Works

This example uses `fastify-lm` to analyze incoming messages and block those flagged as inappropriate by an AI model. The moderation logic is applied only to the `/submit` route, ensuring that other endpoints remain unaffected.

## Installation

Ensure you have `fastify` and `fastify-lm` installed in your project:

```bash
npm install fastify fastify-lm
```

## Implementation

Below is a targeted implementation of AI-powered content moderation for a specific route in Fastify:

```typescript
import Fastify from "fastify";
import lmPlugin from "fastify-lm";

const app = Fastify();

// Register the plugin with OpenAI as the moderation provider
app.register(lmPlugin, {
  models: [
    {
      name: "openai",
      provider: "openai",
      model: "gpt-4o",
      apiKey: process.env.OPENAI_API_KEY,
    },
  ],
});

// Define the /submit route with AI moderation applied
app.post(
  "/submit",
  {
    preHandler: async (request, reply) => {
      if (!request.body?.message) return;

      try {
        const response = await app.openai.chat({
          messages: [{ role: "user", content: `Does this message contain offensive language? ${request.body.message}` }],
        });

        if (response.toLowerCase().includes("yes")) {
          return reply.status(400).send({ error: "Message flagged as inappropriate" });
        }
      } catch (error) {
        request.log.error("AI moderation failed:", error);
      }
    },
  },
  async (request, reply) => {
    return { status: "Message accepted", message: request.body.message };
  }
);

// Start the server
app.listen({ port: 3000 }, () => {
  console.log("Server running on http://localhost:3000");
});
```

## How to Use

1. Start the Fastify server:
   ```bash
   node server.js
   ```
2. Send a message to the `/submit` endpoint:
   ```bash
   curl -X POST http://localhost:3000/submit -H "Content-Type: application/json" -d '{"message": "Hello, how are you?"}'
   ```
3. If the message is flagged as inappropriate, the API will return:
   ```json
   { "error": "Message flagged as inappropriate" }
   ```
4. Otherwise, it will return:
   ```json
   { "status": "Message accepted", "message": "Hello, how are you?" }
   ```

## Customization

- **Change the AI Model**: You can use different providers like Google’s Gemini or Claude instead of OpenAI.
- **Adjust the Moderation Criteria**: Modify the AI prompt to check for specific content like hate speech, spam, or sensitive topics.
- **Store Moderation Logs**: Save flagged messages for review instead of outright rejecting them.

## Conclusion

By integrating AI-powered moderation with `fastify-lm`, you can enhance the safety of your platform while maintaining flexibility in content filtering. Try extending this implementation to include real-time alerts or admin review features!

🚀 **Need more examples? Check out other use cases in the [`/docs/`](../docs/) folder!**

