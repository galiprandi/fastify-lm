import axios from 'axios'
import type { LM } from '../lm-namespace.js'
import { handleRequestError } from '../utils.js'
import { BaseLMAdapter } from '../base-adapter.js'
import { toolAdapter } from '../utils/openai/tools.js'

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
      const chatMessages: LM.ChatMessage[] = messages
      let result: string | null = null
      let maxIterations = 3 // Prevent infinite loops
      while (maxIterations-- > 0) {
        const body = {
          model: this.model,
          messages: chatMessages,
          tools: openAITools,
        }
        const response = await axios.post<ChatResponse>(url, body, { headers })
        const choice = response.data.choices?.[0]?.message

        // Multi-step tool-calling: keep looping while there are tool_calls
        if (choice?.tool_calls) {
          console.log(
            'Tool calls detected:',
            choice.tool_calls.map((tc) => ({ name: tc.function.name, args: tc.function.arguments })),
          )
          // Push the assistant message with tool_calls first
          chatMessages.push({
            role: 'assistant',
            content: undefined,
            tool_calls: choice.tool_calls,
          })
          // Then push each tool message in order
          for (const toolCall of choice.tool_calls) {
            const toolName = toolCall.function.name
            const args = JSON.parse(toolCall.function.arguments)
            const toolFn = toolMap[toolName]
            let toolResult: string = ''
            if (toolFn && typeof toolFn.execute === 'function') {
              console.log(`[DEBUG] Executing tool: ${toolName} with args:`, args)
              toolResult = String(await toolFn.execute(args))
            } else {
              console.log(`[DEBUG] Tool function not implemented or not found: ${toolName}`)
              toolResult = `Tool '${toolName}' not implemented.`
            }
            chatMessages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolName,
              content: toolResult,
            })
          }
          // Continue to next iteration to allow model to process tool results
          continue
        }

        // If no tool_calls, break and return result
        result = choice?.content ?? null
        break
      }
      return result
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
