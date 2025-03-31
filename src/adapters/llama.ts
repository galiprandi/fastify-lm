import axios from 'axios'
import type { LM } from '../lm-namespace.js'
import { handleRequestError } from '../utils.js'
import { BaseLMAdapter } from '../base-adapter.js'

export class LlamaAdapter extends BaseLMAdapter {
  private baseURL: string

  constructor (apiKey: string, model: string, options?: LM.ProviderSpecificOptions['llama']) {
    super(apiKey, model)
    this.baseURL = options?.baseURL || 'https://api.llama-api.com'
  }

  chat: LM.Adapter['chat'] = async (params) => {
    try {
      let { messages } = params
      if (!messages) return null
      const url = `${this.baseURL}/chat/completions`
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
      if (params.system) messages = [{ role: 'system', content: params.system }, ...messages]
      const body = {
        model: this.model,
        messages,
      }
      const { data } = await axios.post<ChatResponse>(url, body, { headers })
      return data.choices?.[0]?.message?.content ?? null
    } catch (error) {
      return handleRequestError('Error in LlamaAdapter.chat:', error)
    }
  }

  models: LM.Adapter['models'] = async () => {
    console.info('⛔ The model list is not available for LlamaAdapter. Please check the documentation at https://docs.llama-api.com/quickstart#available-models.')
    return []
  }
}

// Interfaces
interface ChatResponse {
  choices?: { message?: { content: string } }[];
}
