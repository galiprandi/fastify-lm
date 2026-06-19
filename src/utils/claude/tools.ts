import type { LM } from '../../lm-namespace.js'

/**
 * Adapts the generic LM.Tool format to the specific format required by the Claude API.
 * @param tools - A map of tool names to LM.Tool definitions.
 * @returns An array of tools formatted for the Claude API, or undefined if no tools are provided.
 */
export function claudeToolAdapter(tools: Record<string, LM.Tool<unknown, unknown>>): ClaudeToolSpec[] | undefined {
  const toolNames = Object.keys(tools)
  if (toolNames.length === 0) {
    return undefined
  }

  return toolNames.map((name) => {
    const tool = tools[name]
    return {
      name,
      description: tool.description || '', // Claude requires description
      input_schema: tool.parameters || { type: 'object', properties: {} }, // Claude requires input_schema. Use 'parameters' from LM.Tool
    }
  })
}

// Interfaces

/**
 * Represents the tool specification format expected by the Claude API.
 */
interface ClaudeToolSpec {
  name: string
  description: string
  input_schema: Record<string, unknown> // JSON Schema object
}
