import { describe, it, expect } from 'vitest'
import fastifyLmPlugin from './index.js'
import fastifyLmDirectImport from './fastify-lm.js'

describe('index.ts', () => {
  it('should export the fastify-lm plugin', () => {
    expect(fastifyLmPlugin).toBeDefined()
    expect(fastifyLmPlugin).toBe(fastifyLmDirectImport)
  })
})
