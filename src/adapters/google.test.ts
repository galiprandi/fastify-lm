import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GoogleGeminiAdapter } from './google'
import { mockAxios } from '../__mocks__/axios'

vi.mock('axios', async () => {
  return await import('../__mocks__/axios')
})

describe('GoogleGeminiAdapter', () => {
  const apiKey = 'test-api-key'
  const model = 'gemini-pro'
  let adapter: GoogleGeminiAdapter

  beforeEach(() => {
    adapter = new GoogleGeminiAdapter(apiKey, model)
    mockAxios.post.mockClear()
    mockAxios.get.mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with the provided API key and model', () => {
      expect(adapter).toBeInstanceOf(GoogleGeminiAdapter)
    })
  })

  describe('chat method', () => {
    it('should make a POST request to the Google Gemini API endpoint', async () => {
      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      }

      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                { text: 'Hello! How can I help you today?' }
              ]
            }
          }
        ]
      }

      mockAxios.post.mockResolvedValueOnce({ data: mockResponse })

      const response = await adapter.chat(params)

      expect(mockAxios.post).toHaveBeenCalledTimes(1)
      expect(mockAxios.post).toHaveBeenCalledWith(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: 'Hello' },
                { text: 'You are a helpful assistant' }
              ]
            }
          ]
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
    it('should make a GET request to the Google Gemini models endpoint', async () => {
      const mockResponse = {
        models: [
          { name: 'gemini-pro' },
          { name: 'gemini-ultra' }
        ]
      }

      mockAxios.get.mockResolvedValueOnce({ data: mockResponse })

      const models = await adapter.models()

      expect(mockAxios.get).toHaveBeenCalledTimes(1)
      expect(mockAxios.get).toHaveBeenCalledWith(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      )
      expect(models).toEqual(['gemini-pro', 'gemini-ultra'].sort())
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
