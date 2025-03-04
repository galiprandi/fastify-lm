# fastify-lm

**fastify-lm** is a Fastify plugin that simplifies the integration of Language Model (LLM) providers into your applications. It allows you to easily switch between providers by either using the official OpenAI client or a test client for development.

## Features

- **OpenAI Provider:** Integrate with the official OpenAI API using the official library.
- **Test Provider:** Use a lightweight test client whose `chat` method simply echoes the prompt for testing purposes.
- Simple configuration through plugin options.

## Installation

Install the package using npm:

```sh
npm install fastify-lm
```

Or with yarn:

```sh
yarn add fastify-lm
```

## Usage

### Basic Example with Test Provider

```javascript
import Fastify from 'fastify';
import fastifyLm from 'fastify-lm';

const app = Fastify();

// Register the plugin with the "test" provider
app.register(fastifyLm, { provider: 'test' });

app.get('/', async (request, reply) => {
  const response = await app.lm.chat('Hello, world!');
  return { message: response };
});

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
```

### Example with OpenAI Provider

To use the OpenAI API, provide your API key and any additional options as required:

```javascript
import Fastify from 'fastify';
import fastifyLm from 'fastify-lm';

const app = Fastify();

// Register the plugin with the "openai" provider and options
app.register(fastifyLm, {
  provider: 'openai',
  apiKey: 'YOUR_OPENAI_API_KEY'
});

app.get('/', async (request, reply) => {
  // Using the official OpenAI client instance
  const response = await app.lm.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello, how are you?' }]
  });
  return response;
});

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
```

## Plugin Options

The plugin accepts an options object following the `ProviderOptions` interface:

- **provider** (`"openai"` or `"test"`): Selects the LLM provider.
- For the **"openai"** provider:
  - **apiKey**: Your OpenAI API key (required).
  - Additional options for the OpenAI client can be provided as needed.

## TypeScript Support

The plugin is fully typed. To extend Fastify's type declarations with the `lm` property, create a declaration file (e.g. `src/types/fastify-lm.d.ts`):

```typescript
import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    lm: {
      chat: {
        completions: {
          create: (params: any, options?: any) => Promise<any>;
        };
        // Additional methods from the OpenAI client can be added here.
      };
    };
  }
}
```

## Contributing

Contributions are welcome! If you find a bug or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).