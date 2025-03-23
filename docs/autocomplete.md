# Smart Autocomplete for Forms

## Overview

Autocomplete improves user experience by providing AI-generated text suggestions based on partial inputs. With `fastify-lm`, you can integrate real-time smart autocomplete in your forms using AI models like OpenAI’s GPT or Google’s Gemini.

## How It Works

This example demonstrates how to use `fastify-lm` to automatically generate text suggestions for a form input field. When a user starts typing, the system queries an AI model to generate a relevant suggestion, which is then returned to the client.

## Installation

Ensure you have `fastify` and `fastify-lm` installed in your project:

```bash
npm install fastify fastify-lm
```

## Implementation

Below is a Fastify route that provides AI-generated autocomplete suggestions using a faster and more cost-efficient model:

```typescript
import Fastify from "fastify";
import lmPlugin from "fastify-lm";

const app = Fastify();

// Register the plugin with OpenAI using a faster and cheaper model
app.register(lmPlugin, {
  models: [
    {
      name: "openai",
      provider: "openai",
      model: "gpt-3.5-turbo",
      apiKey: process.env.OPENAI_API_KEY,
    },
  ],
});

// Define the /autocomplete route to generate text suggestions
app.get("/autocomplete", async (request, reply) => {
  const { input } = request.query;
  if (!input) {
    return reply.status(400).send({ error: "Missing input query parameter" });
  }

  try {
    const response = await app.openai.chat({
      messages: [{ role: "user", content: `Suggest a continuation for: ${input}` }],
    });
    return reply.send({ suggestion: response });
  } catch (error) {
    request.log.error("AI autocomplete failed:", error);
    return reply.status(500).send({ error: "Autocomplete service unavailable" });
  }
});

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
2. Request an autocomplete suggestion:
   ```bash
   curl "http://localhost:3000/autocomplete?input=The future of AI is"
   ```
3. Example response:
   ```json
   { "suggestion": "The future of AI is shaping industries like healthcare, finance, and education." }
   ```

## Customization

- **Change the AI Model**: Use different providers like Google’s Gemini or Claude instead of OpenAI.
- **Modify the Prompt**: Adjust the request message to improve the accuracy of suggestions.
- **Enhance Client-Side Integration**: Implement real-time requests from an input field using JavaScript.

## Conclusion

By integrating AI-powered autocomplete with `fastify-lm`, you can enhance user experience by providing real-time, context-aware text suggestions. This can be extended to various use cases like email drafting, search bar enhancements, and content creation tools.

🚀 **Need more examples? Check out other use cases in the [`/docs/`](../docs/) folder!**

