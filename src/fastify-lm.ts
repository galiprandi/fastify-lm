import fp from 'fastify-plugin'

// Types
import type { FastifyInstance } from 'fastify'
import { LM } from './lm-namespace.js'

// Adapters
import { OpenAIAdapter } from './adapters/openai.js'
import { GoogleGeminiAdapter } from './adapters/google.js'
import { ClaudeAdapter } from './adapters/claude.js'
import { DeepSeekAdapter } from './adapters/deepseek.js'
import { TestAdapter } from './adapters/testAdapter.js'
import { LlamaAdapter } from './adapters/llama.js'
import { MistralAdapter } from './adapters/mistral.js'

/**
 * Registry of all available LM adapters
 * Maps provider names to their respective adapter classes
 */
const availableAdapters: LM.AvailableAdapters = {
  test: TestAdapter,
  openai: OpenAIAdapter,
  google: GoogleGeminiAdapter,
  claude: ClaudeAdapter,
  deepseek: DeepSeekAdapter,
  llama: LlamaAdapter,
  mistral: MistralAdapter,
} as const

/**
 * Fastify plugin for language models
 *
 * This plugin allows registering multiple LM providers with Fastify.
 * Each configured model is initialized and made available as a decorated property
 * on the Fastify instance.
 *
 * @param fastify - Fastify instance to decorate
 * @param options - LM plugin configuration options
 * @throws {Error} If configuration is invalid or initialization fails
 */
async function fastifyLm(fastify: FastifyInstance, options: LM.PluginOptions) {
  // Validate that models are provided
  if (!options.models || !Array.isArray(options.models) || options.models.length === 0) {
    throw new Error('You must provide an array of models.')
  }

  // Enable debug mode if specified
  const debug = options.debug === true

  // Process each model configuration
  for (const config of options.models) {
    // Validate the model config has all required fields
    validateModelConfig(config)

    const { name, provider, model, apiKey, options: providerOptions } = config

    // Check if the provider is supported
    if (!(provider in availableAdapters)) {
      throw new Error(`Provider ${provider} is not supported.`)
    }

    // Log initialization if debug mode is enabled
    if (debug) {
      fastify.log.info(`Initializing LM adapter: ${name} (${provider}/${model})`)
    }

    try {
      // Initialize the adapter with the appropriate provider-specific options
      const instance = new availableAdapters[provider](apiKey, model, providerOptions)

      // Register the adapter in fastify
      fastify.decorate(name, instance)

      // Log successful initialization if debug mode is enabled
      if (debug) {
        fastify.log.info(`Successfully initialized LM adapter: ${name}`)
      }
    } catch (error) {
      // Format and log error message
      const errorMessage = error instanceof Error ? error.message : String(error)
      fastify.log.error(`Failed to initialize LM adapter ${name}: ${errorMessage}`)
      throw error
    }
  }
}

/**
 * Validates a model configuration has all required fields
 *
 * @param config - Model configuration to validate
 * @throws {Error} If any required fields are missing
 */
function validateModelConfig(config: LM.ModelConfig): void {
  const { name, provider, model, apiKey } = config

  if (!name) {
    throw new Error('Model configuration is missing "name" field')
  }

  if (!provider) {
    throw new Error(`Model configuration "${name}" is missing "provider" field`)
  }

  if (!model) {
    throw new Error(`Model configuration "${name}" is missing "model" field`)
  }

  if (!apiKey) {
    throw new Error(`Model configuration "${name}" is missing "apiKey" field`)
  }
}

export default fp(fastifyLm, {
  fastify: '5.x',
  name: 'fastify-lm',
})
