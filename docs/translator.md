# Real-Time Text Translation

## Overview

Translating text in real time can enhance communication and accessibility across different languages. With `fastify-lm`, you can integrate AI-powered text translation, allowing users to instantly translate content using models like OpenAI’s GPT or Google’s Gemini.

## How It Works

This example demonstrates how to use `fastify-lm` to process input text and return a translated version in the desired language. The AI model handles language detection and translation seamlessly.

## Installation

Ensure you have `fastify` and `fastify-lm` installed in your project:

```bash
npm install fastify fastify-lm
```

## Implementation

Below is a Fastify route that translates text using a fast and cost-effective model:

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

// Define the /translate route to translate text
app.post("/translate", async (request, reply) => {
  const { text, targetLanguage } = request.body;
  if (!text || !targetLanguage) {
    return reply.status(400).send({ error: "Missing text or targetLanguage in request body" });
  }

  try {
    const response = await app.openai.chat({
      messages: [{ role: "user", content: `Translate the following text to ${targetLanguage}: ${text}` }],
    });
    return reply.send({ translation: response });
  } catch (error) {
    request.log.error("AI translation failed:", error);
    return reply.status(500).send({ error: "Translation service unavailable" });
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
2. Send a text to translate:
   ```bash
   curl -X POST http://localhost:3000/translate -H "Content-Type: application/json" -d '{"text": "Hello, how are you?", "targetLanguage": "Spanish"}'
   ```
3. Example response:
   ```json
   { "translation": "Hola, ¿cómo estás?" }
   ```

## Customization

- **Change the AI Model**: Use different providers like Google’s Gemini or Claude instead of OpenAI.
- **Enhance Language Detection**: Implement automatic detection of the source language.
- **Support Multiple Outputs**: Allow users to request multiple translations in different languages.

## Conclusion

By integrating AI-powered real-time translation with `fastify-lm`, you can enable seamless multilingual communication, improving accessibility and user engagement.

🚀 **Need more examples? Check out other use cases in the [`/docs/`](../docs/) folder!**

