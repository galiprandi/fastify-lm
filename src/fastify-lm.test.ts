/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Fastify from 'fastify'
import fastifyLm from './fastify-lm.js'
import type { FastifyInstance } from 'fastify'
import { LM } from './lm-namespace.js'

describe('fastify-lm plugin', () => {
  let fastify: FastifyInstance

  beforeEach(() => {
    fastify = Fastify()
  })

  afterEach(async () => {
    await fastify.close()
  })

  it('should register the plugin with valid options', async () => {
    const options: LM.PluginOptions = {
      models: [
        {
          name: 'testLm',
          provider: 'test',
          model: 'test-model',
          apiKey: 'test-api-key',
        },
      ],
    }

    await fastify.register(fastifyLm, options)
    expect(fastify.testLm).toBeDefined()
  })

  it('should throw an error if models array is missing', async () => {
    const options = {} as LM.PluginOptions

    await expect(fastify.register(fastifyLm, options)).rejects.toThrow('You must provide an array of models.')
  })

  it('should throw an error if models array is empty', async () => {
    const options: LM.PluginOptions = {
      models: [],
    }

    await expect(fastify.register(fastifyLm, options)).rejects.toThrow('You must provide an array of models.')
  })

  it('should throw an error if model config is missing required fields', async () => {
    const options: LM.PluginOptions = {
      models: [
        {
          name: 'testLm',
          provider: 'test',
          // Missing model and apiKey
        } as any,
      ],
    }

    await expect(fastify.register(fastifyLm, options)).rejects.toThrow(
      `Model configuration "${options.models[0].name}" is missing "model" field`,
    )
  })

  it('should throw an error if provider is not supported', async () => {
    const options: LM.PluginOptions = {
      models: [
        {
          name: 'testLm',
          provider: 'unsupported-provider',
          model: 'test-model',
          apiKey: 'test-api-key',
        } as any,
      ],
    }

    await expect(fastify.register(fastifyLm, options)).rejects.toThrow(
      'Provider unsupported-provider is not supported.',
    )
  })

  it('should register multiple models', async () => {
    const options: LM.PluginOptions = {
      models: [
        {
          name: 'testLm1',
          provider: 'test',
          model: 'test-model-1',
          apiKey: 'test-api-key-1',
        },
        {
          name: 'testLm2',
          provider: 'test',
          model: 'test-model-2',
          apiKey: 'test-api-key-2',
        },
      ],
    }

    await fastify.register(fastifyLm, options)
    expect(fastify.testLm1).toBeDefined()
    expect(fastify.testLm2).toBeDefined()
  })
})
