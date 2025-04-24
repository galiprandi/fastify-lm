import type { LM } from '../../lm-namespace.js'

/**
 * Generic multi-step tool chaining runner for LLM adapters.
 * Allows adapters (OpenAI, Mistral, etc) to delegate tool-call orchestration here.
 */
import AjvModule, { ValidateFunction } from 'ajv'
const Ajv = AjvModule.default

/**
 * Orchestrates multi-step tool-calling with runtime argument validation using Ajv.
 */
export async function runToolChain<TResponse, TToolCall>(
  initialMessages: LM.ChatMessage[],
  options: ToolChainOptions<TResponse, TToolCall>,
): Promise<string | null> {
  const {
    maxIterations = 3,
    toolMap,
    makeRequest,
    extractToolCalls,
    extractContent,
    buildAssistantMessage,
    buildToolMessage,
    getToolName,
    getToolArgs,
  } = options

  const chatMessages: LM.ChatMessage[] = [...initialMessages]
  let result: string | null = null
  let iterations = maxIterations

  // Ajv instance (singleton per module)
  const ajv = new Ajv()
  const validatorCache = new Map<object, ValidateFunction>()

  while (iterations-- > 0) {
    const response = await makeRequest(chatMessages)
    const toolCalls = extractToolCalls(response)

    if (toolCalls && toolCalls.length > 0) {
      chatMessages.push(buildAssistantMessage(toolCalls))
      for (const toolCall of toolCalls) {
        const toolName = getToolName(toolCall)
        const args = getToolArgs(toolCall)
        const toolFn = toolMap[toolName]
        let toolResult = ''
        // Validate args using Ajv if schema is present
        const schema = toolFn?.parameters
        if (schema) {
          let validate = validatorCache.get(schema)
          if (!validate) {
            validate = ajv.compile(schema)
            validatorCache.set(schema, validate)
          }
          if (!validate) throw new Error(`Failed to compile schema for tool '${toolName}'`)
          if (!validate(args))
            throw new Error(`Invalid arguments for tool '${toolName}': ${ajv.errorsText(validate.errors)}`)
        }
        if (toolFn && typeof toolFn.execute === 'function') {
          toolResult = String(await toolFn.execute(args))
        } else {
          toolResult = `Tool '${toolName}' not implemented.`
        }
        chatMessages.push(buildToolMessage(toolCall, toolResult))
      }
      continue
    }

    result = extractContent(response)
    break
  }

  return result
}

// interfaces

/**
 * Generic multi-step tool chaining runner for LLM adapters.
 * Allows adapters (OpenAI, Mistral, etc) to delegate tool-call orchestration here.
 */
export interface ToolChainOptions<TResponse, TToolCall> {
  maxIterations?: number
  toolMap: Record<string, LM.Tool<unknown, unknown>>
  makeRequest: (messages: LM.ChatMessage[]) => Promise<TResponse>
  extractToolCalls: (response: TResponse) => TToolCall[] | undefined
  extractContent: (response: TResponse) => string | null
  buildAssistantMessage: (toolCalls: TToolCall[]) => LM.ChatMessage
  buildToolMessage: (toolCall: TToolCall, toolResult: string) => LM.ChatMessage
  getToolName: (toolCall: TToolCall) => string
  getToolArgs: (toolCall: TToolCall) => Record<string, unknown>
}
