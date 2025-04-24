# fastify-lm

**✨ Version 2.0.0 is here! Now with Tool Usage support for OpenAI and Claude providers! ✨**

## What is fastify-lm?

`fastify-lm` is a **Fastify plugin** that simplifies integration with multiple **language model (LM) providers**, such as:

| Provider   | Description                                 | Chat | Models | Tools |
|------------|---------------------------------------------|:----:|:------:|:-----:|
| **OpenAI**   | GPT models, including GPT-4o, GPT-3.5        |  ✅  |   ✅   |  ✅  |
| **Google**   | Gemini models, such as Gemini 1.5           |  ✅  |   ✅   |  🚧  |
| **Claude**   | Anthropic’s Claude models (Claude 3, etc.)  |  ✅  |   ✅   |  ✅ |
| **Deepseek** | Deepseek AI language models                 |  ✅  |   ✅   |  ✅ |
| **Llama**    | Llama AI language models                    |  ✅  |   ✅   |  🚧  |
| **Mistral**  | Mistral AI language models                  |  ✅  |   ✅   |  🚧  |
| **Test**     | Test provider, always returns "test" and the input parameters. |  ✅  |   ✅   |  ✅  |

It provides a **unified interface**, allowing you to switch providers without modifying your application code.

### 🔥 **Why use fastify-lm?**

Developing applications that interact with language models usually requires direct API integration, which can lead to:

* 🔗 **Dependency on a single provider**
* 🔄 **Difficulty switching models without refactoring code**
* ❌ **Inconsistencies in how different APIs are used**

With `fastify-lm`, you can:\
✅ Define multiple providers in a single configuration\
✅ Switch models just by changing environment variables\
✅ Use a **consistent query system** without worrying about API differences\
✅ Easily run A/B tests with different models to find the best fit for your use case

### 🛠 **Use Cases**

* **Chatbots and virtual assistants**: Seamlessly integrate multiple AI models to enhance user experience.
* **Natural Language Processing (NLP)**: Analyze text using different models without modifying your code.
* **Model comparison**: Evaluate different LMs within the same application with minimal changes.
* **Flexible infrastructure**: Switch providers based on availability, cost, or technological improvements.
* **Analyze requests**: Moderate or analyze requests using language models.

🚀 **Ready to get started?** Continue with the installation guide and start using `fastify-lm` in just a few minutes.

## Installation

To install the plugin, on existing Fastify project, just run:

```bash
npm install fastify-lm
```

### Compatibility

| fastify-lm (plugin) | Fastify            |
| ------------------- | ------------------ |
| `^1.x`              | `^3.x, ^4.x, ^5.x` |

Please note that if a Fastify version is out of support, then so are the corresponding versions of this plugin
in the table above.
See [Fastify's LTS policy](https://github.com/fastify/fastify/blob/main/docs/Reference/LTS.md) for more details.

## Quick start

Start by creating a Fastify instance and registering the plugin.

```bash
npm i fastify fastify-lm
```

Create a file `src/server.js` and add following code:

```javascript
// Import the framework and instantiate it
import Fastify from "fastify";
import LmPlugin from "fastify-lm";

const fastify = Fastify({
  logger: true,
});

// Register the lm-plugin
fastify.register(LmPlugin, {
  models: [
    {
      name: "lm", // the name of the model instance on your app
      provider: "openai", // openai, google, claude, deepseek or any available provider
      model: "gpt-4o-mini",
      apiKey: "your-api-key", // ⚠️ Replace this with your real provider API key
    },
  ],
});

// Route to get available models
fastify.get("/models", async function handler(request, reply) {
  const models = await fastify.lm.models();
  return { models };
});

// Route to query the model (chat)
fastify.post("/chat", async function handler(request, reply) {
  const { messages } = request.body;
  const response = await fastify.lm.chat({ messages });
  return { response };
});

// Run the server!
try {
  await fastify.listen({ port: 3000 });
  await fastify.lm.models();
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
```

> Remember to replace `your-api-key` with your actual API key.

Finally, launch the server with:

```bash
node src/server.js
```

and test it with:

```bash
curl http://localhost:3000/
```

## Usage

### Registering the Plugin

Register the plugin in your Fastify instance by specifying the models and providers to use.

#### Basic Usage

```typescript
import Fastify from "fastify";
import lmPlugin from "fastify-lm";

// Create a Fastify instance and register the plugin
const app = Fastify();
app.register(lmPlugin, {
  models: [
    {
      name: "lm",
      provider: process.env.LM_PROVIDER,
      model: process.env.LM_MODEL,
      apiKey: process.env.LM_API_KEY,
    },
  ],
});

const response = await app.lm.chat({
  messages: [{ role: "user", content: "How are you?" }],
});
```

💡 *Change the environment variables to switch the provider.*

#### Multiple Providers with Query Parameter Selection

```typescript
import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import lmPlugin from "fastify-lm";

// Create a Fastify instance and register the plugin
const app = Fastify();
app.register(lmPlugin, {
  models: [
    {
      name: "openai",
      provider: "openai",
      model: "gpt-3.5-turbo",
      apiKey: process.env.OPENAI_API_KEY,
    },
    {
      name: "google",
      provider: "google",
      model: "gemini-2.0-flash-lite",
      apiKey: process.env.GOOGLE_API_KEY,
    },
    {
      name: "claude",
      provider: "claude",
      model: "claude-3-5-sonnet-20240620",
      apiKey: process.env.CLAUDE_API_KEY,
    },
    {
      name: "deepseek",
      provider: "deepseek",
      model: "deepseek-chat",
      apiKey: process.env.DEEPSEEK_API_KEY,
    },
    {
      name: "mistral",
      provider: "mistral",
      model: "mistral-medium",
      apiKey: process.env.MISTRAL_API_KEY,
    },
  ],
});

// Route that receives the query and optional model parameter
app.get<{ Querystring: QueryParams }>(
  "/chat",
  {
    schema: {
      querystring: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string' },
          model: { 
            type: 'string', 
            enum: ['openai', 'google', 'claude', 'deepseek', 'mistral'],
            default: 'openai'
          }
        }
      }
    }
  },
  async (
    request: FastifyRequest<{ Querystring: QueryParams }>,
    reply: FastifyReply
  ) => {
    const { query, model = "openai" } = request.query;

    try {
      const response = await app[model].chat({
        messages: [{ role: "user", content: query }],
      });
      
      return { response };
    } catch (error: any) {
      reply.status(500).send({ error: error.message });
    }
  }
);

// Start the server
app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});

interface QueryParams {
  query: string;
  model?: "openai" | "google" | "claude" | "deepseek" | "mistral"; // Optional, defaults to "openai"
}
```

## Advanced Use Cases

Beyond simple model queries, you can leverage `fastify-lm` for more advanced functionalities:

### 🤖 Automated Customer Support Responses

Use AI to generate instant answers for common support queries.\
[📖 Read the full guide →](docs/support-bot.md)

### 🎫 AI-Powered Support Ticket Prioritization

Automatically classify and prioritize support tickets based on urgency and sentiment.\
[📖 Read the full guide →](docs/support-ticket-prioritization.md)

### 📢 AI-Driven Sentiment Analysis

Analyze user feedback, reviews, or messages to determine sentiment trends.\
[📖 Read the full guide →](docs/sentiment-analysis.md)

### 📌 Automatic Content Moderation

Detect and block inappropriate messages before processing them.\
[📖 Read the full guide →](docs/content-moderation.md)

### 🔍 Semantic Search & Query Expansion

Improve search relevance by understanding intent and expanding queries intelligently.\
[📖 Read the full guide →](docs/semantic-search.md)

### ✨ Smart Autocomplete for Forms

Enhance user input by automatically generating text suggestions.\
[📖 Read the full guide →](docs/autocomplete.md)

### 📄 Automatic Text Summarization

Summarize long text passages using AI models.\
[📖 Read the full guide →](docs/summarizer.md)

### 🌍 Real-Time Text Translation

Translate user input dynamically with multi-provider support.\
[📖 Read the full guide →](docs/translator.md)

### 📊 AI-Powered Data Extraction

Extract structured information from unstructured text, such as invoices, legal documents, or reports.\
[📖 Read the full guide →](docs/data-extraction.md)

### 📅 Automated Meeting Scheduling with Tool-Calling

Let your AI agent schedule meetings directly in your users' calendars by leveraging tool-calling.\
[📖 Read the full guide →](docs/meeting-scheduler.md)

🚀 **Check out more examples in the [`/docs/`](docs/) folder!**

## Contributing

We need a lot of hands to implement other providers you can help us by submitting a pull request.

[📖 Adding a New Adapter](docs/adding-new-adapter.md)

## License

MIT
