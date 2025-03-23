import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DeepSeekAdapter } from './deepseek.js'
import { mockAxios } from '../__mocks__/axios.js'

vi.mock('axios', async () => {
  return await import('../__mocks__/axios.js')
})

describe('DeepSeekAdapter', () => {
  const apiKey = 'test-api-key'
  const model = 'deepseek-chat'
  let adapter: DeepSeekAdapter

  beforeEach(() => {
    adapter = new DeepSeekAdapter(apiKey, model)
    mockAxios.post.mockClear()
    mockAxios.get.mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with the provided API key and model', () => {
      expect(adapter).toBeInstanceOf(DeepSeekAdapter)
    })
  })

  describe('chat method', () => {
    it('should make a POST request to the DeepSeek chat completions endpoint', async () => {
      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      }

      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello! How can I help you today?',
              role: 'assistant'
            }
          }
        ]
      }

      mockAxios.post.mockResolvedValueOnce({ data: mockResponse })

      const response = await adapter.chat(params)

      expect(mockAxios.post).toHaveBeenCalledTimes(1)
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://api.deepseek.com/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Hello' }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        }
      )
      expect(response).toBe('Hello! How can I help you today?')
    })

    it('should return null when the API response is missing expected data', async () => {
      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      }

      // Mock empty response
      mockAxios.post.mockResolvedValueOnce({ data: {} })

      const response = await adapter.chat(params)
      expect(response).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      }

      // Mock error response
      mockAxios.post.mockRejectedValueOnce(new Error('Network Error'))

      const response = await adapter.chat(params)
      expect(response).toBeNull()
    })
  })

  describe('models method', () => {
    it('should make a GET request to the DeepSeek models endpoint', async () => {
      const mockResponse = {
        data: [
          { id: 'deepseek-chat' },
          { id: 'deepseek-coder' }
        ]
      }

      mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

      const models = await adapter.models()

      expect(mockAxios.get).toHaveBeenCalledTimes(1)
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.deepseek.com/models',
        {
          headers: {
            Authorization: `Bearer ${apiKey}`
          }
        }
      )
      expect(models).toEqual(['deepseek-chat', 'deepseek-coder'].sort())
    })

    it('should return an empty array when the API response is missing expected data', async () => {
      // Mock empty response
      mockAxios.get.mockResolvedValueOnce({ data: {} })

      const models = await adapter.models()
      expect(models).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      // Mock error response
      mockAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const models = await adapter.models()
      expect(models).toBeNull()
    })
  })
})
