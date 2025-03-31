import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClaudeAdapter } from './claude.js'
import { mockAxios } from '../__mocks__/axios.js'

vi.mock('axios', async () => {
  return await import('../__mocks__/axios.js')
})

describe('ClaudeAdapter', () => {
  const apiKey = 'test-api-key'
  const model = 'claude-3-opus-20240229'
  let adapter: ClaudeAdapter

  beforeEach(() => {
    adapter = new ClaudeAdapter(apiKey, model)
    mockAxios.post.mockClear()
    mockAxios.get.mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with the provided API key and model', () => {
      expect(adapter).toBeInstanceOf(ClaudeAdapter)
    })
  })

  describe('chat method', () => {
    it('should make a POST request to the Anthropic messages endpoint', async () => {
      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      }

      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'Hello! How can I help you today?'
          }
        ]
      }

      mockAxios.post.mockResolvedValueOnce({ data: mockResponse })

      const response = await adapter.chat(params)

      expect(mockAxios.post).toHaveBeenCalledTimes(1)
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        {
          model,
          max_tokens: 512,
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Hello' }
          ]
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
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
    it('should make a GET request to the Anthropic models endpoint', async () => {
      const mockResponse = {
        data: [
          { id: 'claude-3-opus-20240229' },
          { id: 'claude-3-sonnet-20240229' },
          { id: 'claude-3-haiku-20240229' }
        ]
      }

      mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

      const models = await adapter.models()

      expect(mockAxios.get).toHaveBeenCalledTimes(1)
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/models',
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        }
      )
      expect(models).toEqual(['claude-3-haiku-20240229', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'])
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
