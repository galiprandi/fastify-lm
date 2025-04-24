/* eslint-disable @typescript-eslint/no-explicit-any */
import { LM } from './lm-namespace.js'

/**
 * Base class for language model adapters
 * Provider-specific adapters should extend this class
 */
export abstract class BaseLMAdapter implements LM.Adapter {
  protected readonly apiKey: string
  protected readonly model: string
  protected readonly options?: Record<string, any>

  /**
   * Constructor for the base adapter
   * @param apiKey - API key for the provider
   * @param model - Model name to use
   * @param options - Provider-specific options
   */
  constructor(apiKey: string, model: string, options?: Record<string, any>) {
    this.apiKey = apiKey
    this.model = model
    this.options = options || {}

    // Validate configuration on instantiation
    this.validateConfig()
  }

  /**
   * Abstract method for chat interaction with the model
   * Must be implemented by each provider-specific adapter
   *
   * @param params - Parameters for the chat request
   * @returns Generated response text or null if unsuccessful
   */
  abstract chat(params: LM.ChatParams): Promise<string | null>

  /**
   * Abstract method to retrieve available models from the provider
   * Must be implemented by each provider-specific adapter
   *
   * @returns Array of available model names or null if unavailable
   */
  abstract models(): Promise<string[] | null>

  /**
   * Optional method for streaming support
   * Can be implemented by adapters that support streaming
   *
   * @param params - Parameters for the chat request
   * @yields Generated response chunks as they become available
   */
  async *streamChat?(params: LM.ChatParams): AsyncIterableIterator<string> {
    // Default implementation for adapters that don't support streaming
    // Simply wraps the regular chat method in an async generator
    const response = await this.chat(params)
    if (response) {
      yield response
    }
  }

  /**
   * Validates the adapter configuration
   * Called by the constructor to ensure valid initialization
   *
   * @returns true if the configuration is valid
   * @throws {Error} If any required configuration is missing
   */
  protected validateConfig(): boolean {
    if (!this.apiKey) {
      throw new Error('API key is required')
    }
    if (!this.model) {
      throw new Error('Model name is required')
    }
    return true
  }

  /**
   * Formats error messages consistently
   * Useful for standardizing error handling across adapters
   *
   * @param message - Error message
   * @param code - Optional error code
   * @returns Formatted error message
   */
  protected formatError(message: string, code?: string): string {
    return code ? `[${code}] ${message}` : message
  }
}
