import type { LMAdapter } from '../types'
import axios from 'axios'
import { handleRequestError } from '../utils'

export class GoogleGeminiAdapter implements LMAdapter {
  private apiKey: string
  private model: string
  private baseURL: string

  constructor (apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models'
  }

  chat:LMAdapter['chat'] = async (params) => {
    try {
      const { system, messages } = params
      const url = `${this.baseURL}/${this.model}:generateContent?key=${this.apiKey}`
      const body = {
        contents: [
          {
            parts: [
              ...messages.map(({ content: text }) => ({ text })),
              { text: system },
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

  models:LMAdapter['models'] = async () => {
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
