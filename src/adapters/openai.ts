import axios from 'axios'
import type { LM } from '../lm-namespace.js'
import { handleRequestError } from '../utils.js'
import { BaseLMAdapter } from '../base-adapter.js'
import { toolAdapter } from '../utils/openai/tools.js'
import { runToolChain } from '../utils/tools/tool-chain.js'

export class OpenAIAdapter extends BaseLMAdapter {
  private baseURL: string

  constructor(apiKey: string, model: string, options?: LM.ProviderSpecificOptions['openai']) {
    super(apiKey, model, options)
    this.baseURL = options?.baseURL || 'https://api.openai.com/v1'
  }

  chat: LM.Adapter['chat'] = async (params) => {
    try {
      let { messages } = params
      const { tools } = params
      if (!messages) return null
      const url = `${this.baseURL}/chat/completions`
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }
      if (params.system) messages = [{ role: 'system', content: params.system }, ...messages]
      const toolMap: Record<string, LM.Tool<unknown, unknown>> = tools || {}
      const openAITools = tools ? toolAdapter(tools) : undefined
      // Delegate multi-step tool chaining to runToolChain
      return runToolChain(messages, {
        toolMap,
        maxIterations: 3,
        makeRequest: async (chatMessages) => {
          const body = { model: this.model, messages: chatMessages, tools: openAITools }
          const response = await axios.post<ChatResponse>(url, body, { headers })
          return response.data
        },
        extractToolCalls: (data) => data.choices?.[0]?.message?.tool_calls,
        extractContent: (data) => data.choices?.[0]?.message?.content ?? null,
        buildAssistantMessage: (toolCalls) => ({
          role: 'assistant',
          content: undefined,
          tool_calls: toolCalls,
        }),
        buildToolMessage: (toolCall, toolResult) => ({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: toolResult,
        }),
        getToolName: (toolCall) => toolCall.function.name,
        getToolArgs: (toolCall) => {
          try {
            return JSON.parse(toolCall.function.arguments)
          } catch {
            return {}
          }
        },
      })
    } catch (error) {
      return handleRequestError('Error in OpenAIAdapter.chat:', error)
    }
  }

  models: LM.Adapter['models'] = async () => {
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
  choices?: {
    message?: {
      content?: string
      tool_calls?: Array<{
        id: string
        type: 'function'
        function: {
          name: string
          arguments: string
        }
      }>
    }
  }[]
}

interface ModelsResponse {
  data?: { id: string }[]
}
