/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TestAdapter } from './testAdapter.js'

describe('TestAdapter', () => {
  const apiKey = 'test-api-key'
  const model = 'test-model'
  let adapter: TestAdapter

  beforeEach(() => {
    adapter = new TestAdapter(apiKey, model)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with the provided API key and model', () => {
      expect(adapter).toBeInstanceOf(TestAdapter)
    })
  })

  describe('chat method', () => {
    it('should return a formatted string with the input parameters', async () => {
      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }],
      }

      const response = await adapter.chat(params)

      expect(response).toBe('test: ' + JSON.stringify(params))
    })

    it('should handle errors gracefully', async () => {
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn().mockImplementationOnce(() => {
        throw new Error('Test error')
      }) as any

      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }],
      }

      const response = await adapter.chat(params)

      // Verify the result is null
      expect(response).toBeNull()

      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Restore original implementations
      global.setTimeout = originalSetTimeout
      consoleErrorSpy.mockRestore()
    })
  })

  describe('models method', () => {
    it('should return an array with a test model', async () => {
      const models = await adapter.models()
      expect(models).toEqual(['test-model'])
    })

    it('should handle errors gracefully', async () => {
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn().mockImplementationOnce(() => {
        throw new Error('Test error')
      }) as any

      const models = await adapter.models()

      // Verify the result is null
      expect(models).toBeNull()

      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Restore original implementations
      global.setTimeout = originalSetTimeout
      consoleErrorSpy.mockRestore()
    })
  })

  describe('TestAdapter tool-calling support', () => {
    const dummyTools = {
      echo: {
        description: 'Echoes input',
        parameters: {
          type: 'object',
          properties: { input: { type: 'string' } },
          required: ['input'],
          additionalProperties: false,
        },
        execute: vi.fn(async (args: { input: string }) => `echo: ${args.input}`),
      },
      sum: {
        description: 'Sums two numbers',
        parameters: {
          type: 'object',
          properties: { a: { type: 'number' }, b: { type: 'number' } },
          required: ['a', 'b'],
          additionalProperties: false,
        },
        execute: vi.fn(async (args: { a: number; b: number }) => args.a + args.b),
      },
    }

    it('should execute a single tool and return its result', async () => {
      //@ts-expect-error wrong type
      const adapterWithTools = new TestAdapter('key', 'model', dummyTools)
      const params = {
        messages: [{ role: 'user', content: 'test' }],
        tools: { echo: dummyTools.echo },
      }
      const result = await adapterWithTools.chat(params as any)
      expect(result).toContain('test-tools:')
      expect(dummyTools.echo.execute).toHaveBeenCalled()
    })

    it('should execute multiple tools and return their results', async () => {
      //@ts-expect-error wrong type
      const adapterWithTools = new TestAdapter('key', 'model', dummyTools)
      const params = {
        messages: [{ role: 'user', content: 'test' }],
        tools: dummyTools,
      }
      const result = await adapterWithTools.chat(params as any)
      expect(result).toContain('test-tools:')
      expect(dummyTools.echo.execute).toHaveBeenCalled()
      expect(dummyTools.sum.execute).toHaveBeenCalled()
    })

    it('should handle tool execute errors gracefully', async () => {
      const errorTool = {
        description: 'Fails',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
          additionalProperties: false,
        },
        execute: vi.fn(async () => {
          throw new Error('fail')
        }),
      }
      //@ts-expect-error wrong type
      const adapterWithTools = new TestAdapter('key', 'model', { errorTool })
      const params = {
        messages: [{ role: 'user', content: 'fail' }],
        tools: { errorTool },
      }
      const result = await adapterWithTools.chat(params as any)
      expect(result).toBeNull()
    })
  })
})
