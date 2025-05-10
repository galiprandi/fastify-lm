import type { LM } from '../lm-namespace.js'
import { OpenAIAdapter } from './openai.js'

export class DeepSeekAdapter extends OpenAIAdapter {
  constructor(apiKey: string, model: string, options?: LM.ProviderSpecificOptions['deepseek']) {
    super(apiKey, model, {
      ...options,
      baseURL: options?.baseURL || 'https://api.deepseek.com',
    })
  }
}
