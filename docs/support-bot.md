# Automated Customer Support Responses

## Overview

Automating customer support responses can significantly reduce response times and improve user satisfaction. With `fastify-lm`, you can integrate AI-powered responses to handle common support inquiries before escalating to a human agent.

## How It Works

This example demonstrates how to use `fastify-lm` to generate instant AI-driven responses to customer inquiries. If the AI cannot provide a satisfactory response, the request can be forwarded to a human support agent.

## Installation

Ensure you have `fastify` and `fastify-lm` installed in your project:

```bash
npm install fastify fastify-lm
```

## Implementation

Below is a Fastify route that provides AI-generated support responses using a fast and cost-effective model:

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

// Define the /support route to generate AI responses
app.post("/support", async (request, reply) => {
  const { question } = request.body;
  if (!question) {
    return reply.status(400).send({ error: "Missing question in request body" });
  }

  try {
    const response = await app.openai.chat({
      messages: [{ role: "user", content: `Answer this customer support question: ${question}` }],
    });
    return reply.send({ response });
  } catch (error) {
    request.log.error("AI support response failed:", error);
    return reply.status(500).send({ error: "Support service unavailable" });
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
2. Send a customer support query:
   ```bash
   curl -X POST http://localhost:3000/support -H "Content-Type: application/json" -d '{"question": "What are your support hours?"}'
   ```
3. Example response:
   ```json
   { "response": "Our support team is available 24/7 to assist you." }
   ```

## Customization

- **Change the AI Model**: Use different providers like Google’s Gemini or Claude instead of OpenAI.
- **Escalate to a Human Agent**: Implement a fallback mechanism where complex queries are forwarded to human support.
- **Improve Response Accuracy**: Fine-tune the prompt to align responses with your business policies.

## Conclusion

By integrating AI-powered customer support responses with `fastify-lm`, you can enhance user satisfaction by providing instant, accurate answers while reducing the workload on human agents.

🚀 **Need more examples? Check out other use cases in the [`/docs/`](../docs/) folder!**

