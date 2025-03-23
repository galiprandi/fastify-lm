import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TestAdapter } from './testAdapter'

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
        messages: [{ role: 'user' as const, content: 'Hello' }]
      }

      const response = await adapter.chat(params)

      expect(response).toBe('test: ' + JSON.stringify(params))
    })

    it('should handle errors gracefully', async () => {
      // Mock console.error to prevent test output pollution
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout
      global.setTimeout = vi.fn().mockImplementationOnce((callback) => {
        throw new Error('Test error')
      }) as any

      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }]
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
      global.setTimeout = vi.fn().mockImplementationOnce((callback) => {
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
})
