import axios from 'axios'
import type { LM } from '../lm-namespace.js'
import { handleRequestError } from '../utils.js'
import { BaseLMAdapter } from '../base-adapter.js'
import { runToolChain } from '../utils/tools/tool-chain.js'
import { claudeToolAdapter } from '../utils/claude/tools.js'

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
      const { tools } = params
      if (!messages) return null

      const url = `${this.baseURL}/messages`
      const headers = this.getHeaders()

      let systemPrompt: string | undefined
      if (messages[0]?.role === 'system') {
        systemPrompt = messages[0].content as string
        messages = messages.slice(1)
      }
      if (params.system && !systemPrompt) {
        systemPrompt = params.system
      }

      const toolMap: Record<string, LM.Tool<unknown, unknown>> = tools || {}
      const claudeTools = tools ? claudeToolAdapter(tools) : undefined

      return runToolChain(messages, {
        toolMap,
        maxIterations: 5,
        makeRequest: async (chatMessages) => {
          const body = {
            model: this.model,
            max_tokens: 1024,
            messages: chatMessages,
            system: systemPrompt,
            tools: claudeTools,
          }
          const response = await axios.post<ChatResponse>(url, body, { headers })
          return response.data
        },
        extractToolCalls: (data) => {
          if (data.stop_reason === 'tool_use') {
            return data.content
              .filter((item): item is ToolUseBlock => item.type === 'tool_use')
              .map((toolUse) => ({
                id: toolUse.id,
                name: toolUse.name,
                input: toolUse.input,
              }))
          }
          return undefined
        },
        extractContent: (data) => {
          const textBlock = data.content.find((item): item is TextBlock => item.type === 'text')
          return textBlock?.text ?? null
        },
        buildAssistantMessage: (toolCalls) =>
          ({
            role: 'assistant',
            content: toolCalls.map((tc) => ({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input,
            })),
          }) as unknown as LM.ChatMessage,
        buildToolMessage: (toolCall, toolResult) =>
          ({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
              },
            ],
          }) as unknown as LM.ChatMessage,
        getToolName: (toolCall) => toolCall.name,
        getToolArgs: (toolCall) => toolCall.input, // Claude provides input directly as an object
      })
    } catch (error) {
      return handleRequestError('Error in ClaudeAdapter.chat:', error)
    }
  }

  models: LM.Adapter['models'] = async () => {
    try {
      const url = `${this.baseURL}/models` // Note: Claude models endpoint might not exist or differ
      const headers = this.getHeaders()
      // Assuming a similar response structure for models; adjust if needed based on actual Claude API
      const { data } = await axios.get<ModelsResponse>(url, {
        headers,
      })
      // Adapt based on actual Claude API response for models
      const models = data.data?.map(({ id }) => id).sort() ?? []
      return models
    } catch (error) {
      // Adjust error handling if model fetching differs
      return handleRequestError('Error in ClaudeAdapter.models:', error)
    }
  }
}

// Interfaces
interface TextBlock {
  type: 'text'
  text: string
}

interface ToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown> // Input is already an object
}

interface ToolResultBlock {
  type: 'tool_result'
  tool_use_id: string
  content: string | Record<string, unknown>[] // Content can be complex
  is_error?: boolean
}

type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock

interface ChatResponse {
  content: ContentBlock[]
  model: string
  role: 'assistant'
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop_sequence'
  stop_sequence: string | null
  type: 'message'
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

// Assuming a generic structure, replace with actual Claude API response if different
type ModelsResponse = {
  data: Array<{
    id: string
    // Add other relevant fields from Claude API if needed
  }>
  // Add other potential fields like pagination if needed
}
