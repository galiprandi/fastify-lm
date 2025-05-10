import type { LM } from '../lm-namespace.js'
import { OpenAIAdapter } from './openai.js'

export class MistralAdapter extends OpenAIAdapter {
  constructor(apiKey: string, model: string, options?: LM.ProviderSpecificOptions['mistral']) {
    const baseURL = options?.baseURL || 'https://api.mistral.ai/v1'
    super(apiKey, model, { ...options, baseURL })
  }
}
