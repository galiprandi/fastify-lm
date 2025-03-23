# AI-Driven Sentiment Analysis

## Overview

Understanding the sentiment behind user messages, reviews, or feedback can provide valuable insights into customer satisfaction and product perception. With `fastify-lm`, you can integrate AI-powered sentiment analysis to classify text as **positive, neutral, or negative** and store the results in a database for further analysis.

## How It Works

This example demonstrates how to use `fastify-lm` to analyze the sentiment of user-submitted text and save the result in a PostgreSQL database using Prisma.

## Installation

Ensure you have `fastify`, `fastify-lm`, and Prisma installed in your project:

```bash
npm install fastify fastify-lm @prisma/client
```

Initialize Prisma if you haven't already:

```bash
npx prisma init
```

Define the sentiment analysis model in your `prisma/schema.prisma` file:

```prisma
model SentimentAnalysis {
  id        String  @id @default(cuid())
  userId    String
  content   String
  sentiment String
  createdAt DateTime @default(now())
}
```

Run the migration to update the database:

```bash
npx prisma migrate dev --name add_sentiment_analysis
```

## Implementation

Below is a Fastify route that analyzes sentiment and stores the results in the database:

```typescript
import Fastify from "fastify";
import lmPlugin from "fastify-lm";
import { PrismaClient } from "@prisma/client";

const app = Fastify();
const prisma = new PrismaClient();

// Register the plugin with OpenAI using a fast and cost-effective model
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

// Define the /analyze-sentiment route to analyze text sentiment
app.post("/analyze-sentiment", async (request, reply) => {
  const { text, userId } = request.body;
  if (!text || !userId) {
    return reply.status(400).send({ error: "Missing text or userId in request body" });
  }

  try {
    const response = await app.openai.chat({
      messages: [{ role: "user", content: `Analyze the sentiment of the following text. Reply only with Positive, Neutral, or Negative: ${text}` }],
    });
    
    const sentiment = response.trim();
    
    // Save the sentiment result in the database
    const savedAnalysis = await prisma.sentimentAnalysis.create({
      data: {
        userId,
        content: text,
        sentiment,
      },
    });

    return reply.send({ message: "Sentiment analysis saved successfully", analysis: savedAnalysis });
  } catch (error) {
    request.log.error("AI sentiment analysis failed:", error);
    return reply.status(500).send({ error: "Sentiment analysis service unavailable" });
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
2. Send a text for sentiment analysis:
   ```bash
   curl -X POST http://localhost:3000/analyze-sentiment -H "Content-Type: application/json" -d '{"text": "I love the new update! It's fantastic.", "userId": "user-456"}'
   ```
3. Example response:
   ```json
   {
     "message": "Sentiment analysis saved successfully",
     "analysis": {
       "id": "clkjd8fjw0001xyzabc",
       "userId": "user-456",
       "content": "I love the new update! It's fantastic.",
       "sentiment": "Positive",
       "createdAt": "2024-03-23T12:00:00.000Z"
     }
   }
   ```

## Customization

- **Change the AI Model**: Use different providers like Google’s Gemini or Claude instead of OpenAI.
- **Expand Sentiment Categories**: Modify the AI prompt to classify emotions such as joy, anger, or frustration.
- **Integrate with Dashboards**: Store sentiment results in an analytics dashboard to track trends over time.

## Conclusion

By integrating AI-powered sentiment analysis with `fastify-lm` and storing the results in a database, you can gain valuable insights into user emotions and improve customer experience.

🚀 **Need more examples? Check out other use cases in the [`/docs/`](../docs/) folder!**

