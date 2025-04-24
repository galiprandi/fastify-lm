import axios from 'axios'
import type { LM } from '../lm-namespace.js'
import { handleRequestError } from '../utils.js'
import { BaseLMAdapter } from '../base-adapter.js'

export class ClaudeAdapter extends BaseLMAdapter {
  private baseURL: string

  constructor(apiKey: string, model: string, options?: LM.ProviderSpecificOptions['claude']) {
    super(apiKey, model, options)
    this.baseURL = options?.baseURL || 'https://api.anthropic.com/v1'
  }

  private getHeaders(): Record<string, string> {
    return {
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }
  }

  chat: LM.Adapter['chat'] = async (params) => {
    try {
      let { messages } = params
      if (!messages) return null
      const url = `${this.baseURL}/messages`
      const headers = this.getHeaders()
      if (params.system) messages = [{ role: 'system', content: params.system }, ...messages]
      const body = {
        model: this.model,
        max_tokens: 512,
        messages,
      }
      const { data } = await axios.post<ChatResponse>(url, body, { headers })
      return data.content?.[0]?.text ?? null
    } catch (error) {
      return handleRequestError('Error in ClaudeAdapter.chat:', error)
    }
  }

  models: LM.Adapter['models'] = async () => {
    try {
      const url = `${this.baseURL}/models`
      const headers = this.getHeaders()
      const { data } = await axios.get<ModelsResponse>(url, {
        headers,
      })
      const models = data.data?.map(({ id }) => id).sort() ?? []
      return models
    } catch (error) {
      return handleRequestError('Error in ClaudeAdapter.models:', error)
    }
  }
}

// Interfaces
interface ChatResponse {
  content?: {
    type: string
    text: string
  }[]
}

type ModelsResponse = {
  data: Array<{
    type: string
    id: string
    display_name: string
    created_at: string
  }>
  has_more: boolean
  first_id: string
  last_id: string
}
