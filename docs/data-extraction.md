# Semantic Search & Query Expansion

## Overview

Traditional keyword-based search often fails to capture user intent. With `fastify-lm`, you can implement **semantic search** and **query expansion**, allowing users to find more relevant results even if their queries don’t match exact keywords.

## How It Works

This example demonstrates how to use `fastify-lm` to:
- Expand user queries with synonyms and related terms.
- Improve search accuracy by understanding the **intent** behind queries.
- Store and retrieve indexed data from a PostgreSQL database using Prisma.

## Installation

Ensure you have `fastify`, `fastify-lm`, and Prisma installed in your project:

```bash
npm install fastify fastify-lm @prisma/client
```

Initialize Prisma if you haven't already:

```bash
npx prisma init
```

Define the searchable data model in your `prisma/schema.prisma` file:

```prisma
model Document {
  id        String  @id @default(cuid())
  title     String
  content   String
  createdAt DateTime @default(now())
}
```

Run the migration to update the database:

```bash
npx prisma migrate dev --name add_searchable_documents
```

## Implementation

Below is a Fastify route that enhances search queries using AI:

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

// Define the /search route for semantic search
app.get("/search", async (request, reply) => {
  const { query } = request.query;
  if (!query) {
    return reply.status(400).send({ error: "Missing query parameter" });
  }

  try {
    // Expand the query using AI
    const expandedQuery = await app.openai.chat({
      messages: [{ role: "user", content: `Expand this search query with synonyms and related terms: ${query}` }],
    });
    
    // Perform a search using Prisma
    const results = await prisma.document.findMany({
      where: {
        OR: [
          { title: { contains: expandedQuery, mode: "insensitive" } },
          { content: { contains: expandedQuery, mode: "insensitive" } },
        ],
      },
    });

    return reply.send({ query, expandedQuery, results });
  } catch (error) {
    request.log.error("AI-powered search failed:", error);
    return reply.status(500).send({ error: "Search service unavailable" });
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
2. Perform a semantic search query:
   ```bash
   curl "http://localhost:3000/search?query=latest tech trends"
   ```
3. Example response:
   ```json
   {
     "query": "latest tech trends",
     "expandedQuery": "latest technology trends, emerging technologies, innovations in tech",
     "results": [
       {
         "id": "clkjd8fjw0001xyzabc",
         "title": "Top 10 Emerging Technologies of 2024",
         "content": "AI, quantum computing, and 5G are leading tech trends...",
         "createdAt": "2024-03-23T12:00:00.000Z"
       }
     ]
   }
   ```

## Customization

- **Change the AI Model**: Use different providers like Google’s Gemini or Claude instead of OpenAI.
- **Optimize Search Queries**: Fine-tune AI prompts to generate more accurate query expansions.
- **Enhance Indexing**: Integrate with a full-text search engine like **PostgreSQL’s `tsvector`** or **Elasticsearch** for even better performance.

## Conclusion

By integrating AI-powered semantic search and query expansion with `fastify-lm`, you can improve search accuracy and help users find relevant information more efficiently.

🚀 **Need more examples? Check out other use cases in the [`/docs/`](../docs/) folder!**

