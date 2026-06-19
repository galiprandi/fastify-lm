# Tool-Calling Guide

## Overview

Tool-calling allows LLMs to interact with external systems and perform actions by calling predefined functions. This enables AI agents to:

- Schedule meetings
- Query databases
- Make API calls
- Process files
- Execute business logic

## Supported Providers

| Provider | Tool Support | Version |
|----------|--------------|---------|
| OpenAI   | ✅ Full support | 2.0.0+ |
| Claude   | ✅ Full support | 2.0.0+ |
| Deepseek | ✅ Full support | 2.0.0+ |
| Mistral  | ✅ Full support | 2.0.0+ |
| Google   | ❌ Not yet | - |
| Llama    | ❌ Not yet | - |

## Basic Usage

### Defining Tools

Tools are defined using the JSON Schema format:

```typescript
import type { LM } from 'fastify-lm'

const tools: LM.Tools = {
  getCurrentWeather: {
    description: 'Get the current weather for a specific location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'The temperature unit'
        }
      },
      required: ['location'],
      additionalProperties: false
    },
    execute: async (args) => {
      // Your tool implementation
      const { location, unit = 'celsius' } = args
      // Call weather API or database
      return `Weather in ${location}: 25°${unit === 'celsius' ? 'C' : 'F'}`
    }
  }
}
```

### Using Tools in Chat

```typescript
import Fastify from 'fastify'
import lmPlugin from 'fastify-lm'

const app = Fastify()
app.register(lmPlugin, {
  models: [
    {
      name: 'lm',
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
      options: {
        maxToolIterations: 10,  // Maximum tool calls per request
        toolTimeout: 30000      // 30 second timeout per tool
      }
    }
  ]
})

// Use tools in chat
const response = await app.lm.chat({
  messages: [
    { role: 'user', content: 'What is the weather in San Francisco?' }
  ],
  tools
})

console.log(response) // "Weather in San Francisco: 25°C"
```

## Advanced Configuration

### Tool Timeout

Configure timeout for tool execution to prevent hanging:

```typescript
{
  name: 'lm',
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  options: {
    toolTimeout: 60000 // 60 seconds
  }
}
```

### Max Tool Iterations

Limit the number of tool calls in a single request:

```typescript
{
  name: 'lm',
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
  options: {
    maxToolIterations: 5 // Maximum 5 tool calls
  }
}
```

## Error Handling

The tool-calling system includes comprehensive error handling:

### Tool Not Found

If a tool is called but not defined, the system returns an error message:

```
Error: Tool 'unknownTool' not found
```

### Invalid Arguments

Schema validation errors are caught and reported:

```
Error executing tool 'getCurrentWeather': Invalid arguments for tool 'getCurrentWeather': data/location must be string
```

### Tool Execution Timeout

If a tool exceeds the timeout, it fails gracefully:

```
Error executing tool 'slowTool': Tool 'slowTool' execution timeout after 30000ms
```

### Network Errors

Network errors are logged and return null:

```
[ToolChain] Error in tool chain iteration: Network Error
```

## Backward Compatibility

Tool-calling is **fully backward compatible**. If you don't provide tools, the system works exactly as before:

```typescript
// Without tools - works as before
const response = await app.lm.chat({
  messages: [{ role: 'user', content: 'Hello!' }]
})

// With tools - new functionality
const response = await app.lm.chat({
  messages: [{ role: 'user', content: 'What is the weather?' }],
  tools
})
```

## Complete Example: Meeting Scheduler

```typescript
import Fastify from 'fastify'
import lmPlugin from 'fastify-lm'

const app = Fastify()
app.register(lmPlugin, {
  models: [
    {
      name: 'lm',
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY
    }
  ]
})

const tools = {
  scheduleMeeting: {
    description: 'Schedule a meeting with participants',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Meeting title' },
        startTime: { type: 'string', description: 'ISO 8601 datetime' },
        duration: { type: 'number', description: 'Duration in minutes' },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Participant email addresses'
        }
      },
      required: ['title', 'startTime', 'duration', 'participants'],
      additionalProperties: false
    },
    execute: async (args) => {
      // Integrate with your calendar API
      const meetingId = await calendarAPI.createMeeting(args)
      return `Meeting scheduled successfully. ID: ${meetingId}`
    }
  },
  checkAvailability: {
    description: 'Check if participants are available at a given time',
    parameters: {
      type: 'object',
      properties: {
        startTime: { type: 'string', description: 'ISO 8601 datetime' },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Participant email addresses'
        }
      },
      required: ['startTime', 'participants'],
      additionalProperties: false
    },
    execute: async (args) => {
      // Check calendar availability
      const available = await calendarAPI.checkAvailability(args)
      return available ? 'All participants are available' : 'Some participants are busy'
    }
  }
}

app.post('/schedule', async (request, reply) => {
  const { message } = request.body
  
  const response = await app.lm.chat({
    messages: [{ role: 'user', content: message }],
    tools
  })
  
  return { response }
})

// Example request:
// POST /schedule
// { "message": "Schedule a 30-minute meeting with alice@example.com and bob@example.com tomorrow at 2pm" }
```

## Best Practices

1. **Validate Tool Arguments**: Always use JSON Schema for validation
2. **Handle Errors Gracefully**: Implement try-catch in tool execution
3. **Set Timeouts**: Prevent hanging with appropriate timeouts
4. **Limit Iterations**: Avoid infinite loops with maxToolIterations
5. **Log Execution**: Enable logging for debugging
6. **Test Tools**: Unit test your tool implementations separately

## Migration Guide

### From v1.x to v2.0

No breaking changes! Tool-calling is opt-in:

```typescript
// v1.x code - still works
const response = await app.lm.chat({
  messages: [{ role: 'user', content: 'Hello' }]
})

// v2.0 with tools - new feature
const response = await app.lm.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  tools // Optional parameter
})
```

## Troubleshooting

### Tools Not Being Called

- Ensure your tool descriptions are clear and specific
- Check that the model supports tool-calling
- Verify the tool schema is valid JSON Schema
- Enable debug logging to see tool execution

### Schema Validation Errors

- Use a JSON Schema validator to test your schemas
- Ensure required fields are marked correctly
- Check that types match the expected values

### Performance Issues

- Reduce maxToolIterations if too many calls
- Increase toolTimeout for slow tools
- Implement caching for expensive operations
- Consider async tool execution for parallel calls

## Additional Resources

- [Meeting Scheduler Example](./meeting-scheduler.md)
- [Adding New Adapters](./adding-new-adapter.md)
- [JSON Schema Specification](https://json-schema.org/)
