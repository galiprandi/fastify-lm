import { describe, it, expect } from 'vitest'
import fastifyLmPlugin from './index'
import fastifyLmDirectImport from './fastify-lm'

describe('index.ts', () => {
  it('should export the fastify-lm plugin', () => {
    expect(fastifyLmPlugin).toBeDefined()
    expect(fastifyLmPlugin).toBe(fastifyLmDirectImport)
  })
})
