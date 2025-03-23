import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LlamaAdapter } from './llama.js'
import { mockAxios } from '../__mocks__/axios.js'

vi.mock('axios', async () => {
  return await import('../__mocks__/axios.js')
})

describe('LlamaAdapter', () => {
  const apiKey = 'test-api-key'
  const model = 'llama-model'
  let adapter: LlamaAdapter

  beforeEach(() => {
    adapter = new LlamaAdapter(apiKey, model)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with the provided API key and model', () => {
      expect(adapter).toBeInstanceOf(LlamaAdapter)
    })
  })

  describe('chat method', () => {
    it('should make a POST request to the Llama chat completions endpoint', async () => {
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
        'https://api.llama-api.com/chat/completions',
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
    it('should return an empty array and not make any API calls', async () => {
      // Espiar console.info
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      const models = await adapter.models()

      // Verificar que se devuelve un array vacío
      expect(models).toEqual([])

      // Verificar que se muestra el mensaje informativo
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '⛔ The model list is not available for LlamaAdapter. Please check the documentation at https://docs.llama-api.com/quickstart#available-models.'
      )

      // Verificar que no se hace ninguna llamada a axios.get
      expect(mockAxios.get).not.toHaveBeenCalled()

      // Restaurar console.info
      consoleInfoSpy.mockRestore()
    })
  })
})
