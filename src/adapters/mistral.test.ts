import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MistralAdapter } from './mistral.js'
import { mockAxios } from '../__mocks__/axios.js'

vi.mock('axios', async () => {
  return await import('../__mocks__/axios.js')
})

describe('MistralAdapter', () => {
  const apiKey = 'test-api-key'
  const model = 'mistral-medium'
  let adapter: MistralAdapter

  beforeEach(() => {
    adapter = new MistralAdapter(apiKey, model)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with the provided API key and model', () => {
      expect(adapter).toBeInstanceOf(MistralAdapter)
    })
  })

  describe('chat method', () => {
    it('should make a POST request to the Mistral chat completions endpoint', async () => {
      // Mock successful response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          choices: [
            {
              message: {
                content: 'Test response'
              }
            }
          ]
        }
      })

      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      }

      const response = await adapter.chat(params)

      // Verify the response
      expect(response).toBe('Test response')

      // Verify axios was called correctly
      expect(mockAxios.post).toHaveBeenCalledTimes(1)
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Hello' }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
    })

    it('should return null when the API response is missing expected data', async () => {
      // Mock response with missing data
      mockAxios.post.mockResolvedValueOnce({
        data: { choices: [] }
      })

      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      }

      const response = await adapter.chat(params)
      expect(response).toBeNull()
    })

    it('should handle errors gracefully', async () => {
      // Mock error response
      const errorMessage = 'Network Error'
      mockAxios.post.mockRejectedValueOnce(new Error(errorMessage))

      const params = {
        system: 'You are a helpful assistant',
        messages: [{ role: 'user' as const, content: 'Hello' }]
      }

      const response = await adapter.chat(params)
      expect(response).toBeNull()
    })
  })

  describe('models method', () => {
    it('should make a GET request to the Mistral models endpoint', async () => {
      // Mock successful response
      mockAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            { id: 'mistral-tiny' },
            { id: 'mistral-small' },
            { id: 'mistral-medium' }
          ]
        }
      })

      const models = await adapter.models()

      // Verify the response
      expect(models).toEqual(['mistral-medium', 'mistral-small', 'mistral-tiny'])

      // Verify axios was called correctly
      expect(mockAxios.get).toHaveBeenCalledTimes(1)
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/models',
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )
    })

    it('should return an empty array when the API response is missing expected data', async () => {
      // Mock response with missing data
      mockAxios.get.mockResolvedValueOnce({
        data: {}
      })

      const models = await adapter.models()
      expect(models).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      // Mock error response
      const errorMessage = 'Network Error'
      mockAxios.get.mockRejectedValueOnce(new Error(errorMessage))

      const models = await adapter.models()
      expect(models).toBeNull()
    })
  })
})
