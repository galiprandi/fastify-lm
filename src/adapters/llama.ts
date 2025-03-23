import type { LMAdapter } from '../types'
import axios from 'axios'
import { handleRequestError } from '../utils'

export class LlamaAdapter implements LMAdapter {
  private apiKey: string
  private model: string
  private baseURL: string = 'https://api.llama-api.com'

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
      return handleRequestError('Error in LlamaAdapter.chat:', error)
    }
  }

  models: LMAdapter['models'] = async () => {
    console.info('⛔ The model list is not available for LlamaAdapter. Please check the documentation at https://docs.llama-api.com/quickstart#available-models.')
    return []
  }
}

// Interfaces
interface ChatResponse {
  choices?: { message?: { content: string } }[];
}
