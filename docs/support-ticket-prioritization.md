# AI-Powered Support Ticket Prioritization

## Overview

Prioritizing support tickets efficiently ensures that critical issues are addressed first. With `fastify-lm`, you can integrate AI to analyze and rank incoming support tickets based on urgency, sentiment, and keywords, and store them in a database for further processing.

## How It Works

This example demonstrates how to use `fastify-lm` to analyze support tickets, assign a priority level (e.g., High, Medium, Low), and store the ticket with its priority in a PostgreSQL database using Prisma.

## Installation

Ensure you have `fastify`, `fastify-lm`, and Prisma installed in your project:

```bash
npm install fastify fastify-lm @prisma/client
```

Initialize Prisma if you haven't already:

```bash
npx prisma init
```

Define the ticket model in your `prisma/schema.prisma` file:

```prisma
model Ticket {
  id        String  @id @default(cuid())
  userId    String
  content   String
  priority  String
  createdAt DateTime @default(now())
}
```

Run the migration to update the database:

```bash
npx prisma migrate dev --name add_user_id_to_ticket
```

## Implementation

Below is a Fastify route that analyzes ticket priority and stores it in the database:

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

// Define the /prioritize route to analyze and store ticket priority
app.post("/prioritize", async (request, reply) => {
  const { ticket, userId } = request.body;
  if (!ticket || !userId) {
    return reply.status(400).send({ error: "Missing ticket description or userId in request body" });
  }

  try {
    const response = await app.openai.chat({
      messages: [{ role: "user", content: `Analyze the following support ticket and assign a priority level (High, Medium, Low) based on urgency: ${ticket}` }],
    });
    
    const priority = response.trim();
    
    // Save the ticket in the database
    const savedTicket = await prisma.ticket.create({
      data: {
        userId,
        content: ticket,
        priority,
      },
    });

    return reply.send({ message: "Ticket saved successfully", ticket: savedTicket });
  } catch (error) {
    request.log.error("AI prioritization failed:", error);
    return reply.status(500).send({ error: "Prioritization service unavailable" });
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
2. Send a support ticket for prioritization and storage:
   ```bash
   curl -X POST http://localhost:3000/prioritize -H "Content-Type: application/json" -d '{"ticket": "Our payment system is down, and customers cannot make transactions.", "userId": "user-123"}'
   ```
3. Example response:
   ```json
   {
     "message": "Ticket saved successfully",
     "ticket": {
       "id": "clkjd8fjw0001xyzabc",
       "userId": "user-123",
       "content": "Our payment system is down, and customers cannot make transactions.",
       "priority": "High",
       "createdAt": "2024-03-23T12:00:00.000Z"
     }
   }
   ```

## Customization

- **Change the AI Model**: Use different providers like Google’s Gemini or Claude instead of OpenAI.
- **Enhance Priority Criteria**: Include additional factors like customer impact, sentiment analysis, or past ticket history.
- **Multi-Tier Prioritization**: Extend the model to assign numerical scores for more granular prioritization.

## Conclusion

By integrating AI-powered ticket prioritization with `fastify-lm` and storing the data in a database, you can create a structured, automated workflow for handling support requests efficiently.

🚀 **Need more examples? Check out other use cases in the [`/docs/`](../docs/) folder!**

