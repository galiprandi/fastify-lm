# fastify-lm

## What is fastify-lm?
fastify-lm is a [Fastify](https://www.fastify.io/) plugin that integrates multiple language model (LM) providers into your application. It offers a unified interface to interact with providers such as OpenAI, Google, Claude, and Deepseek, allowing easy switching and testing of different models without changing the plugin.

## Features
- **Unified Interface:** Easily connect with multiple providers.
- **Flexibility:** Supports single or multiple providers simultaneously.
- **Simplicity:** Change providers using environment variables.
- **TypeScript:** Fully built in TypeScript and includes built-in type definitions.

## Available Providers

| Provider | Description                        |
|----------|------------------------------------|
| OpenAI   | OpenAI's GPT models                |
| Google   | Google's language models           |
| Claude   | Anthropic's language model         |
| Deepseek | Deepseek AI models                 |

## Quick start

Start by creating a Fastify instance and registering the plugin.

```bash
npm i fastify fastify-lm
```

Create a file `src/server.js` and add following code:

```javascript
// Import the framework and instantiate it
import Fastify from 'fastify'
import LmPlugin from 'fastify-lm'

const fastify = Fastify({
    logger: true
})

// Register the lm-plugin
fastify.register(LmPlugin, {
    models:[{
        name: 'lm', // the name of the model instance on your app
        provider: 'openai', // openai, google, claude, deepseek or any available provider
        model: 'gpt-4o-mini',
        apiKey: 'your-api-key'
    }]
})

// Declare a route / that returns the models
fastify.get('/', async function handler(request, reply) {
    const models = await fastify.lm.models()
    return { models }
})

// Run the server!
try {
    await fastify.listen({ port: 3000 })
    await fastify.lm.models()
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
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

## Installation

To install the plugin, on existing Fastify project, just run:

```bash
npm install fastify-lm
```

## Usage

### Registering the Plugin
Register the plugin in your Fastify instance by specifying the models and providers to use.

#### Single Provider
```typescript
import Fastify from 'fastify';
import lmPlugin from 'fastify-lm';

// Create a Fastify instance and register the plugin
const app = Fastify();
app.register(lmPlugin, {
  models: [
    {
      name: 'lm',
      provider: process.env.LM_PROVIDER,
      model: process.env.LM_MODEL,
      apiKey: process.env.LM_API_KEY
    },
  ]
});

const response = await app.lm.ask('How are you?');
```
💡 *Change the environment variables to switch the provider.*

#### Multiple Providers
```typescript
import Fastify from 'fastify';
import lmPlugin from 'fastify-lm';

// Create a Fastify instance and register the plugin
const app = Fastify();
app.register(lmPlugin, {
  models: [
    {
      name: 'openai',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY,
    },
    {
      name: 'google',
      provider: 'google',
      model: 'gemini-2.0-flash-lite',
      apiKey: process.env.GOOGLE_API_KEY,
    },
    {
      name: 'claude',
      provider: 'claude',
      model: 'claude-3-5-sonnet-20240620',
      apiKey: process.env.CLAUDE_API_KEY,
    },
    {
      name: 'deepseek',
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY,
    },
  ],
});

const response = await app.openai.chat({
  messages: [{ role: 'user', content: 'How are you?' }],
});
```

#### Dynamic Query to Multiple Providers
```typescript
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import lmPlugin from 'fastify-lm';

// Create a Fastify instance and register the plugin
const app = Fastify();
app.register(lmPlugin, {
  models: [
    {
      name: 'openai',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAI_API_KEY,
    },
    {
      name: 'google',
      provider: 'google',
      model: 'gemini-2.0-flash-lite',
      apiKey: process.env.GOOGLE_API_KEY,
    },
    // Additional providers can be added as needed
  ],
});


// Route that receives the query and model via parameters and returns the model's response
app.get<{ Querystring: AskQuery }>('/ask', async (request: FastifyRequest<{ Querystring: AskQuery }>, reply: FastifyReply) => {
  const { query, model } = request.query;

  // Check if the provider exists in the Fastify instance
  if (!app.hasDecorator(model)) {
    reply.status(400).send({ error: 'Unsupported provider' });
    return;
  }

  try {
    let response;
    // If the chat method exists, use it; otherwise, use ask
    if (typeof app[model].chat === 'function') {
      response = await app[model].chat({
        messages: [{ role: 'user', content: query }],
      });
    } else if (typeof app[model].ask === 'function') {
      response = await app[model].ask(query);
    } else {
      throw new Error('The provider does not implement a suitable method');
    }
    return { response };
  } catch (error: any) {
    reply.status(500).send({ error: error.message });
  }
});

// Start the server
app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});

interface AskQuery {
  query: string;
  model: 'openai' | 'google'; // Extendable based on the registered providers
}
```

## Contributing

We need a lot of hands to implement other providers you can help us by submitting a pull request.

## License
MIT