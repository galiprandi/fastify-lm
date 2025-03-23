# Automatic Text Summarization

## Overview

Summarizing long text content can help users quickly grasp key information. With `fastify-lm`, you can integrate AI-powered text summarization to generate concise summaries of articles, reports, or user inputs.

## How It Works

This example demonstrates how to use `fastify-lm` to process lengthy text and return a summarized version. The AI model extracts essential details and generates a short, readable summary.

## Installation

Ensure you have `fastify` and `fastify-lm` installed in your project:

```bash
npm install fastify fastify-lm
```

## Implementation

Below is a Fastify route that generates AI-powered summaries using a fast and cost-effective model:

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

// Define the /summarize route to generate text summaries
app.post("/summarize", async (request, reply) => {
  const { text } = request.body;
  if (!text) {
    return reply.status(400).send({ error: "Missing text in request body" });
  }

  try {
    const response = await app.openai.chat({
      messages: [{ role: "user", content: `Summarize the following text in a few sentences: ${text}` }],
    });
    return reply.send({ summary: response });
  } catch (error) {
    request.log.error("AI summarization failed:", error);
    return reply.status(500).send({ error: "Summarization service unavailable" });
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
2. Send a text to summarize:
   ```bash
   curl -X POST http://localhost:3000/summarize -H "Content-Type: application/json" -d '{"text": "Artificial intelligence is transforming industries by automating tasks, enhancing decision-making, and improving efficiency. AI models like GPT are widely used in content generation, customer support, and predictive analytics."}'
   ```
3. Example response:
   ```json
   { "summary": "AI is revolutionizing industries by automating tasks, enhancing decision-making, and improving efficiency." }
   ```

## Customization

- **Change the AI Model**: Use different providers like Google’s Gemini or Claude instead of OpenAI.
- **Adjust Summary Length**: Modify the prompt to generate shorter or more detailed summaries.
- **Multi-Language Support**: Extend the functionality to summarize content in different languages.

## Conclusion

By integrating AI-powered text summarization with `fastify-lm`, you can provide users with quick and meaningful summaries, improving readability and efficiency.

🚀 **Need more examples? Check out other use cases in the [`/docs/`](../docs/) folder!**

