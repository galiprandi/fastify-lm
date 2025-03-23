import type { LMAdapter } from '../types.js'
import axios from 'axios'
import { handleRequestError } from '../utils.js'

export class MistralAdapter implements LMAdapter {
  private apiKey: string
  private model: string
  private baseURL: string = 'https://api.mistral.ai/v1'

  constructor (apiKey: string, model: string) {
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
      const { data } = await axios.post<ChatResponse>(url, body, { headers })
      return data.choices?.[0]?.message?.content ?? null
    } catch (error) {
      return handleRequestError('Error in MistralAdapter.chat:', error)
    }
  }

  models: LMAdapter['models'] = async () => {
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
      return handleRequestError('Error in MistralAdapter.models:', error)
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
