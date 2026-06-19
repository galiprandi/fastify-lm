import type { LM } from '../../lm-namespace.js'

/**
 * Adapts a Tools object (our standard) to OpenAI tool-calling format.
 * @param tools Our internal Tools object
 * @returns Array of tools in OpenAI format
 */
export const toolAdapter = (tools: LM.Tools): OpenAITools[] =>
  Object.entries(tools).map(([name, tool]) => ({
    type: 'function',
    function: {
      name,
      description: tool.description ?? '',
      parameters: tool.parameters as OpenAITools['function']['parameters'],
    },
  }))

// Interfaces
interface OpenAITools {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required: string[]
      additionalProperties: boolean
    }
  }
}
