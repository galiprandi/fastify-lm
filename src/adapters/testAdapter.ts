import type { LMAdapter } from '../types'
import { handleRequestError } from '../utils'

export class TestAdapter implements LMAdapter {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey
    this.model = model
  }

  chat: LMAdapter['chat'] = async (params) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return 'test: ' + JSON.stringify(params)
    } catch (error) {
      return handleRequestError('Error in TestAdapter.chat:', error)
    }
  }

  models: LMAdapter['models'] = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return ['test-model']
    } catch (error) {
      return handleRequestError('Error in TestAdapter.models:', error)
    }
  }
}
