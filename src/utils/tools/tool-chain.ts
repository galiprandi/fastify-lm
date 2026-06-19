import type { LM } from '../../lm-namespace.js'

/**
 * Generic multi-step tool chaining runner for LLM adapters.
 * Allows adapters (OpenAI, Mistral, etc) to delegate tool-call orchestration here.
 */
import AjvModule, { ValidateFunction } from 'ajv'
const Ajv = AjvModule.default

/**
 * Orchestrates multi-step tool-calling with runtime argument validation using Ajv.
 * Features:
 * - Multi-step tool execution with iteration limits
 * - Schema validation using Ajv
 * - Error handling with graceful degradation
 * - Timeout protection for tool execution
 * - Comprehensive logging for debugging
 */
export async function runToolChain<TResponse, TToolCall>(
  initialMessages: LM.ChatMessage[],
  options: ToolChainOptions<TResponse, TToolCall>,
): Promise<string | null> {
  const {
    maxToolIterations = 10,
    toolMap,
    makeRequest,
    extractToolCalls,
    extractContent,
    buildAssistantMessage,
    buildToolMessage,
    getToolName,
    getToolArgs,
    toolTimeout = 30000, // 30 second default timeout for tool execution
  } = options

  const chatMessages: LM.ChatMessage[] = [...initialMessages]
  let result: string | null = null
  let iterations = maxToolIterations

  // Ajv instance (singleton per module)
  const ajv = new Ajv()
  const validatorCache = new Map<object, ValidateFunction>()

  while (iterations-- > 0) {
    try {
      const response = await makeRequest(chatMessages)

      // Check if response is valid before processing
      if (!response) {
        console.error('[ToolChain] makeRequest returned null/undefined')
        return null
      }

      const toolCalls = extractToolCalls(response)

      if (toolCalls && toolCalls.length > 0) {
        chatMessages.push(buildAssistantMessage(toolCalls))

        for (const toolCall of toolCalls) {
          const toolName = getToolName(toolCall)
          const args = getToolArgs(toolCall)
          const toolFn = toolMap[toolName]

          if (!toolFn) {
            console.warn(`[ToolChain] Tool '${toolName}' not found in toolMap`)
            chatMessages.push(buildToolMessage(toolCall, `Error: Tool '${toolName}' not found`))
            continue
          }

          let toolResult = ''

          try {
            // Validate args using Ajv if schema is present
            const schema = toolFn?.parameters
            if (schema) {
              let validate = validatorCache.get(schema)
              if (!validate) {
                validate = ajv.compile(schema)
                validatorCache.set(schema, validate)
              }
              if (!validate) {
                throw new Error(`Failed to compile schema for tool '${toolName}'`)
              }
              if (!validate(args)) {
                throw new Error(`Invalid arguments for tool '${toolName}': ${ajv.errorsText(validate.errors)}`)
              }
            }

            if (typeof toolFn.execute === 'function') {
              // Execute tool with timeout protection
              toolResult = (await Promise.race([
                toolFn.execute(args),
                new Promise<string>((_, reject) =>
                  setTimeout(
                    () => reject(new Error(`Tool '${toolName}' execution timeout after ${toolTimeout}ms`)),
                    toolTimeout,
                  ),
                ),
              ])) as Promise<string>

              toolResult = String(toolResult)
              console.log(`[ToolChain] Tool '${toolName}' executed successfully`)
            } else {
              toolResult = `Tool '${toolName}' not implemented.`
              console.warn(`[ToolChain] Tool '${toolName}' has no execute function`)
            }
          } catch (toolError) {
            const errorMessage = toolError instanceof Error ? toolError.message : String(toolError)
            toolResult = `Error executing tool '${toolName}': ${errorMessage}`
            console.error(`[ToolChain] Tool execution error:`, errorMessage)
          }

          chatMessages.push(buildToolMessage(toolCall, toolResult))
        }
        continue
      }

      result = extractContent(response)
      break
    } catch (error) {
      console.error('[ToolChain] Error in tool chain iteration:', error)
      // Return null immediately on error to prevent infinite loops
      return null
    }
  }

  if (iterations === 0 && result === null) {
    console.warn('[ToolChain] Max tool iterations reached without result')
  }

  return result
}

// interfaces

/**
 * Generic multi-step tool chaining runner for LLM adapters.
 * Allows adapters (OpenAI, Mistral, etc) to delegate tool-call orchestration here.
 */
export interface ToolChainOptions<TResponse, TToolCall> {
  maxToolIterations?: number
  toolMap: Record<string, LM.Tool<unknown, unknown>>
  makeRequest: (messages: LM.ChatMessage[]) => Promise<TResponse>
  extractToolCalls: (response: TResponse) => TToolCall[] | undefined
  extractContent: (response: TResponse) => string | null
  buildAssistantMessage: (toolCalls: TToolCall[]) => LM.ChatMessage
  buildToolMessage: (toolCall: TToolCall, toolResult: string) => LM.ChatMessage
  getToolName: (toolCall: TToolCall) => string
  getToolArgs: (toolCall: TToolCall) => Record<string, unknown>
  toolTimeout?: number // Timeout in milliseconds for tool execution (default: 30000)
}
