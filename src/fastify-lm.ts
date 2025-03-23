import fp from 'fastify-plugin'

// Types
import type { FastifyInstance } from 'fastify'
import type { AvailableAdapters, LMPluginOptions } from './types'

// Adapters
import { OpenAIAdapter } from './adapters/openai'
import { GoogleGeminiAdapter } from './adapters/google'
import { ClaudeAdapter } from './adapters/claude'
import { DeepSeekAdapter } from './adapters/deepseek'
import { TestAdapter } from './adapters/testAdapter'
import { LlamaAdapter } from './adapters/llama'

/**
 * Available adapters
 */
const availableAdapters: AvailableAdapters = {
  test: TestAdapter,
  openai: OpenAIAdapter,
  google: GoogleGeminiAdapter,
  claude: ClaudeAdapter,
  deepseek: DeepSeekAdapter,
  llama: LlamaAdapter,
} as const

/**
 * Fastify plugin for language models
 */
async function fastifyLm (fastify: FastifyInstance, options: LMPluginOptions) {
  if (
    !options.models ||
    !Array.isArray(options.models) ||
    options.models.length === 0
  ) { throw new Error('You must provide an array of models.') }

  for (const config of options.models) {
    const { name, provider, model, apiKey } = config
    if (!name || !provider || !model || !apiKey) {
      throw new Error(
        `Model configuration is missing required fields: ${JSON.stringify(
          config
        )}`
      )
    }
    if (!(provider in availableAdapters)) { throw new Error(`Provider ${provider} is not supported.`) }

    const instance = new availableAdapters[provider](apiKey, model)
    fastify.decorate(name, instance)
  }
}

export default fp(fastifyLm, {
  fastify: '5.x',
  name: 'fastify-lm',
})
