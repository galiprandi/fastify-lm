import axios from 'axios'
import type { LM } from '../lm-namespace.js'
import { handleRequestError } from '../utils.js'
import { BaseLMAdapter } from '../base-adapter.js'

export class OpenAIAdapter extends BaseLMAdapter {
  private baseURL: string

  constructor (apiKey: string, model: string, options?: LM.ProviderSpecificOptions['openai']) {
    super(apiKey, model, options)
    this.baseURL = options?.baseURL || 'https://api.openai.com/v1'
  }

  chat: LM.Adapter['chat'] = async (params) => {
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
      const { data } = await axios.post<ChatResponse>(url, body, { headers })
      return data.choices?.[0]?.message?.content ?? null
    } catch (error) {
      return handleRequestError('Error in OpenAIAdapter.chat:', error)
    }
  }

  models:LM.Adapter['models'] = async () => {
    try {
      const url = `${this.baseURL}/models`
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
      const { data } = await axios.get<ModelsResponse>(url, { headers })
      const models = data.data?.map(({ id }) => id).sort() ?? []
      return models
    } catch (error) {
      return handleRequestError('Error in OpenAIAdapter.models:', error)
    }
  }
}

// Interfaces
interface ChatResponse {
  choices?: { message?: { content: string } }[];
}

interface ModelsResponse {
  data?: { id: string }[];
}
