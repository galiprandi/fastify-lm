import axios from 'axios'
import type { LM } from '../lm-namespace.js'
import { handleRequestError } from '../utils.js'
import { BaseLMAdapter } from '../base-adapter.js'

export class DeepSeekAdapter extends BaseLMAdapter {
  private baseURL: string

  constructor (apiKey: string, model: string, options?: LM.ProviderSpecificOptions['deepseek']) {
    super(apiKey, model, options)
    this.baseURL = options?.baseURL || 'https://api.deepseek.com'
  }

  private getHeaders () {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    }
  }

  chat: LM.Adapter['chat'] = async (params) => {
    try {
      let { system, messages } = params
      if (!messages) return null

      const url = `${this.baseURL}/chat/completions`
      const headers = this.getHeaders()
      if (system) messages = [{ role: 'system', content: system }, ...messages]
      const body = {
        model: this.model,
        messages,
      }
      const { data } = await axios.post<ChatResponse>(url, body, {
        headers,
      })
      return data.choices?.[0]?.message?.content ?? null
    } catch (error) {
      return handleRequestError('Error in DeepSeekAdapter.chat:', error)
    }
  }

  models:LM.Adapter['models'] = async () => {
    try {
      const url = `${this.baseURL}/models`
      const headers = this.getHeaders()
      const { data } = await axios.get<ModelsResponse>(
        url,
        { headers }
      )
      const models = data.data?.map(({ id }) => id).sort() ?? []
      return models
    } catch (error) {
      return handleRequestError('Error in DeepSeekAdapter.models:', error)
    }
  }
}

// Interfaces
interface ChatResponse {
  id: string
  choices: {
    finish_reason: string
    index: number
    message: {
      content: string
      role: string
    }
  }[]
  created: number
  model: string
  object: string
  usage: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
}

interface ModelsResponse {
  data?: { id: string }[];
}
