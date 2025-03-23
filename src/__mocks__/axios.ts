import { vi } from 'vitest'

const mockAxios = {
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
  delete: vi.fn().mockResolvedValue({ data: {} }),
  isAxiosError: vi.fn().mockImplementation(() => true),
}

export { mockAxios }

// Default export is required for module mocking
export default mockAxios
