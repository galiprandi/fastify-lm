import axios from 'axios'
import type { LM } from '../lm-namespace.js'
import { handleRequestError } from '../utils.js'
import { BaseLMAdapter } from '../base-adapter.js'

export class GoogleGeminiAdapter extends BaseLMAdapter {
  private baseURL: string

  constructor (apiKey: string, model: string, options?: LM.ProviderSpecificOptions['google']) {
    super(apiKey, model, options)
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models'
  }

  chat:LM.Adapter['chat'] = async (params) => {
    try {
      let { messages } = params
      if (!messages) return null
      const url = `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`
      if (params.system) messages = [{ role: 'system', content: params.system }, ...messages]
      const body = {
        contents: [
          {
            parts: [
              ...messages.map(({ content: text }) => ({ text })),
            ],
          },
        ],
      }
      const { data } = await axios.post<ChatResponse>(url, body)
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    } catch (error) {
      return handleRequestError('Error in GoogleGeminiAdapter.chat:', error)
    }
  }

  models:LM.Adapter['models'] = async () => {
    try {
      const url = `${this.baseURL}?key=${this.apiKey}`
      const { data } = await axios.get<ModelsResponse>(url)
      const models = data.models?.map((model) => model.name).sort() ?? []
      return models
    } catch (error) {
      return handleRequestError('Error in GoogleGeminiAdapter.models:', error)
    }
  }
}

// Interfaces
interface ChatResponse {
  candidates?: {
    content?: {
      parts?: { text: string }[];
    };
  }[];
}

interface ModelsResponse {
  models?: { name: string }[];
}
