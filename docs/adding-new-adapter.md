# Guide for Adding a New Adapter to fastify-lm

When adding a new language model adapter, follow these steps:

## 1. Create the adapter file

- Create a new file in `src/adapters/` named after the provider (e.g., `provider-name.ts`)
- Implement the `LMAdapter` interface with `chat` and `models` methods
- Use axios for HTTP requests and handle errors consistently

## 2. Update type definitions

- Add the new provider to the `LMProviders` type in `src/types.ts`

## 3. Register the adapter

- Import the adapter in `src/fastify-lm.ts`
- Add it to the `availableAdapters` object

## 4. Create tests

- Create a test file with the same name plus `.test.ts` extension
- Test the constructor, chat method, and models method
- Mock API responses using the axios mock

## 5. Version update

- Increment the version in `package.json` following semantic versioning

## Example adapter structure

```typescript
import type { LMAdapter } from '../types'
import axios from 'axios'
import { handleRequestError } from '../utils'

export class NewProviderAdapter implements LMAdapter {
  private apiKey: string
  private model: string
  private baseURL: string = 'https://api.provider.com'

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  chat: LMAdapter['chat'] = async (params) => {
    try {
      const { system, messages } = params
      const url = `${this.baseURL}/chat/completions`
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
      const body = {
        model: this.model,
        messages: [{ role: 'system', content: system }, ...messages],
      }
      const { data } = await axios.post(url, body, { headers })
      return data.choices?.[0]?.message?.content ?? null
    } catch (error) {
      return handleRequestError('Error in NewProviderAdapter.chat:', error)
    }
  }

  models: LMAdapter['models'] = async () => {
    try {
      const url = `${this.baseURL}/models`
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
      const { data } = await axios.get(url, { headers })
      const models = data.data?.map(({ id }) => id).sort() ?? []
      return models
    } catch (error) {
      return handleRequestError('Error in NewProviderAdapter.models:', error)
    }
  }
}

// Interfaces
interface ChatResponse {
  choices?: { message?: { content: string } }[];
}
```
