#!/usr/bin/env node
/**
 * Tool-Calling Demo Script
 * 
 * This script demonstrates tool-calling functionality with real LLM providers.
 * Set your API key as an environment variable to test with a real provider.
 * 
 * Usage:
 *   OPENAI_API_KEY=your-key node examples/tool-calling-demo.ts
 *   ANTHROPIC_API_KEY=your-key node examples/tool-calling-demo.ts
 */

import Fastify from 'fastify'
import lmPlugin from '../dist/index.js'

// Simple in-memory calendar API simulation
const calendarAPI = {
  meetings: new Map<string, any>(),
  
  async checkAvailability({ startTime, duration, participants }: any) {
    // Simulate availability check
    const busyParticipants = participants.filter((p: string) => 
      Math.random() > 0.7 // 30% chance someone is busy
    )
    
    return {
      allAvailable: busyParticipants.length === 0,
      busyParticipants
    }
  },
  
  async createMeeting({ title, startTime, duration, participants, description }: any) {
    const id = `meeting-${Date.now()}`
    const meeting = {
      id,
      title,
      startTime,
      duration,
      participants,
      description,
      createdAt: new Date().toISOString()
    }
    
    calendarAPI.meetings.set(id, meeting)
    return meeting
  },
  
  async findAvailableSlots({ date, duration, participants }: any) {
    // Simulate finding available slots
    const slots = []
    for (let hour = 9; hour <= 17; hour++) {
      if (Math.random() > 0.3) { // 70% chance slot is available
        slots.push({
          time: `${hour}:00`,
          date
        })
      }
    }
    return slots
  }
}

// Define tools
const meetingTools = {
  checkAvailability: {
    description: 'Check if participants are available at a given time',
    parameters: {
      type: 'object',
      properties: {
        startTime: { 
          type: 'string', 
          description: 'ISO 8601 datetime (e.g., 2024-12-20T14:00:00Z)' 
        },
        duration: { 
          type: 'number', 
          description: 'Duration in minutes' 
        },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Participant email addresses'
        }
      },
      required: ['startTime', 'duration', 'participants'],
      additionalProperties: false
    },
    execute: async (args: any) => {
      console.log('  → checkAvailability called with:', args)
      const availability = await calendarAPI.checkAvailability(args)
      
      if (availability.allAvailable) {
        return 'All participants are available at this time'
      } else {
        return `Some participants are busy: ${availability.busyParticipants.join(', ')}`
      }
    }
  },
  
  scheduleMeeting: {
    description: 'Schedule a meeting in the user\'s calendar',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Meeting title' },
        startTime: { 
          type: 'string', 
          description: 'ISO 8601 datetime (e.g., 2024-12-20T14:00:00Z)' 
        },
        duration: { type: 'number', description: 'Duration in minutes' },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Participant email addresses'
        },
        description: { 
          type: 'string', 
          description: 'Meeting description/agenda' 
        }
      },
      required: ['title', 'startTime', 'duration', 'participants'],
      additionalProperties: false
    },
    execute: async (args: any) => {
      console.log('  → scheduleMeeting called with:', args)
      const meeting = await calendarAPI.createMeeting(args)
      return `Meeting scheduled successfully! Meeting ID: ${meeting.id}. Invite sent to ${participants.join(', ')}`
    }
  },
  
  findAvailableSlots: {
    description: 'Find available time slots for a meeting',
    parameters: {
      type: 'object',
      properties: {
        date: { 
          type: 'string', 
          description: 'Date in YYYY-MM-DD format' 
        },
        duration: { type: 'number', description: 'Duration in minutes' },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Participant email addresses'
        }
      },
      required: ['date', 'duration', 'participants'],
      additionalProperties: false
    },
    execute: async (args: any) => {
      console.log('  → findAvailableSlots called with:', args)
      const slots = await calendarAPI.findAvailableSlots(args)
      return `Available slots on ${args.date}: ${slots.map((s: any) => s.time).join(', ')}`
    }
  }
}

async function runDemo() {
  console.log('🚀 Tool-Calling Demo\n')
  
  // Detect provider from environment variables
  const provider = process.env.OPENAI_API_KEY ? 'openai' : 
                   process.env.ANTHROPIC_API_KEY ? 'claude' : 
                   'test'
  
  const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY :
                  provider === 'claude' ? process.env.ANTHROPIC_API_KEY :
                  'test-key'
  
  const model = provider === 'openai' ? 'gpt-4o-mini' :
                provider === 'claude' ? 'claude-3-5-sonnet-20240620' :
                'test-model'
  
  console.log(`📡 Using provider: ${provider}`)
  console.log(`🤖 Model: ${model}`)
  console.log(`🔑 API Key: ${apiKey ? '✓ Set' : '✗ Not set (using test adapter)'}\n`)
  
  const app = Fastify({ logger: false })
  
  await app.register(lmPlugin, {
    models: [
      {
        name: 'lm',
        provider: provider as any,
        model,
        apiKey,
        options: {
          maxToolIterations: 10,
          toolTimeout: 30000
        }
      }
    ]
  })
  
  // Test scenarios
  const scenarios = [
    {
      name: 'Simple Tool Call',
      message: 'Schedule a 30-minute meeting with alice@example.com tomorrow at 2pm to discuss the project'
    },
    {
      name: 'Find Available Slots',
      message: 'When are alice@example.com and bob@example.com available for a 1-hour meeting tomorrow?'
    },
    {
      name: 'Complex Scheduling',
      message: 'I need to schedule a meeting with the team next week. It should be 1 hour and include alice@example.com and bob@example.com. Please find a time when everyone is available.'
    }
  ]
  
  for (const scenario of scenarios) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📋 Scenario: ${scenario.name}`)
    console.log(`💬 User: ${scenario.message}`)
    console.log(''.repeat(60))
    
    try {
      const startTime = Date.now()
      const response = await app.lm.chat({
        messages: [{ role: 'user', content: scenario.message }],
        tools: meetingTools
      })
      const duration = Date.now() - startTime
      
      console.log(`\n🤖 Assistant: ${response}`)
      console.log(`⏱️  Duration: ${duration}ms`)
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}`)
    }
    
    console.log()
  }
  
  console.log(`\n${'='.repeat(60)}`)
  console.log('✅ Demo completed!')
  console.log(`📊 Total meetings created: ${calendarAPI.meetings.size}`)
  console.log(''.repeat(60))
  
  await app.close()
}

// Run the demo
runDemo().catch(console.error)
