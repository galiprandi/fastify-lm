import type { LMAdapter } from '../types'
import axios from 'axios'
import { handleRequestError } from '../utils'

export class ClaudeAdapter implements LMAdapter {
  public apiKey: string
  public model: string
  private baseURL: string = 'https://api.anthropic.com/v1'

  constructor (apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  chat:LMAdapter['chat'] = async (params) => {
    try {
      const { system, messages } = params
      const url = `${this.baseURL}/messages`
      const headers = {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      }
      const body = {
        model: this.model,
        max_tokens: 512,
        system,
        messages,
      }
      const { data } = await axios.post<ChatResponse>(url, body, { headers })
      return data.content?.[0]?.text ?? null
    } catch (error) {
      return handleRequestError('Error in ClaudeAdapter.chat:', error)
    }
  }

  models:LMAdapter['models'] = async () => {
    try {
      const url = `${this.baseURL}/models`
      const headers = {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      }
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
    type: string;
    text: string;
  }[];
}

type ModelsResponse = {
  data: Array<{
    type: string;
    id: string;
    display_name: string;
    created_at: string;
  }>;
  has_more: boolean;
  first_id: string;
  last_id: string;
}
