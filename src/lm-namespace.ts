/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LM {
  // Available LM providers
  export type Providers = 'test' | 'openai' | 'google' | 'deepseek' | 'claude' | 'llama' | 'mistral'

  // Provider-specific configuration options
  export interface ProviderSpecificOptions {
    openai?: {
      organization?: string // OpenAI organization ID
      baseURL?: string // Custom API endpoint
      maxToolIterations?: number // Max tool-call iterations for tools
    }
    google?: {
      projectId?: string // Google Cloud project ID
      location?: string // Region for Google API
    }
    claude?: {
      baseURL?: string // Custom API endpoint
      version?: string // Claude API version
    }
    deepseek?: {
      baseURL?: string // Custom API endpoint
    }
    llama?: {
      baseURL?: string // Custom API endpoint
    }
    mistral?: {
      baseURL?: string // Custom API endpoint
    }
    test?: Record<string, unknown> // For test adapter configuration
  }

  // Message roles for chat interfaces
  export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

  // Interface for chat messages
  export interface ChatMessage {
    role: MessageRole
    content?: string
    name?: string
    tool_call_id?: string
    tool_calls?: unknown // OpenAI tool-calling payloads
  }

  // Parameters for the chat method
  export interface ChatParams {
    system?: string // System prompt to set context
    messages: ChatMessage[] // Chat history
    tools?: Tools // Tools to be used by the LLM
  }

  // Represents a callable Tool for LLMs.
  export interface Tool<TArgs = Record<string, unknown>, TResult = unknown> {
    description?: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required: string[]
      additionalProperties: boolean
      [key: string]: unknown // allow for JSON Schema extensions
    }
    execute: (args: TArgs) => Promise<TResult>
  }

  // A collection of tools, indexed by tool name.
  export interface Tools {
    [toolName: string]: Tool<any, any>
  }

  // Base interface for LM adapters
  export interface Adapter {
    // Required method to generate chat completions
    chat(params: ChatParams): Promise<string | null>

    // Required method to list available models from the provider
    models(): Promise<string[] | null>

    // Optional method for streaming responses
    streamChat?(params: ChatParams): AsyncIterableIterator<string>
  }

  // Enhanced model configuration
  export interface ModelConfig {
    name: string // Name to register with Fastify
    provider: Providers // Which provider to use
    model: string // Model identifier (e.g., "gpt-4")
    apiKey: string // API key for authentication
    options?: ProviderSpecificOptions[Providers] // Provider-specific options
  }

  // Plugin options
  export interface PluginOptions {
    models: ModelConfig[] // Array of model configurations
    debug?: boolean // Enable debug logging
  }

  // Type for available adapter constructors
  export type AvailableAdapters = Record<Providers, new (apiKey: string, model: string, options?: any) => Adapter>
}

// Fastify type extension
declare module 'fastify' {
  interface FastifyInstance {
    [key: string]: LM.Adapter // Dynamic registration by model name
  }
}
