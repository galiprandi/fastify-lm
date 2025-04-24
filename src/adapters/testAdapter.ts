import type { LM } from '../lm-namespace.js'
import { handleRequestError } from '../utils.js'

export class TestAdapter implements LM.Adapter {
  private apiKey: string
  private model: string
  private tools?: LM.Tools

  constructor(apiKey: string, model: string, tools?: LM.Tools) {
    this.apiKey = apiKey
    this.model = model
    this.tools = tools
  }

  chat: LM.Adapter['chat'] = async (params) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100))
      // Simulate tool-calling if tools are present
      if (this.tools && params.tools) {
        const toolResults: Record<string, unknown> = {}
        for (const [toolName, toolDef] of Object.entries(params.tools)) {
          if (toolDef.execute) {
            // Simulate calling with dummy args for test
            const args = toolDef.parameters?.properties
              ? Object.fromEntries(Object.keys(toolDef.parameters.properties).map((k) => [k, null]))
              : {}
            toolResults[toolName] = await toolDef.execute(args)
          }
        }
        return 'test-tools: ' + JSON.stringify(toolResults)
      }
      return 'test: ' + JSON.stringify(params)
    } catch (error) {
      return handleRequestError('Error in TestAdapter.chat:', error)
    }
  }

  models: LM.Adapter['models'] = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return ['test-model']
    } catch (error) {
      return handleRequestError('Error in TestAdapter.models:', error)
    }
  }
}
