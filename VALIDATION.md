# Tool-Calling Validation Guide

## How to Validate Tool-Calling Works in Production

### 1. Run Integration Tests

```bash
npm run test:integration
```

This validates:
- ✅ Tool execution flow
- ✅ Schema validation
- ✅ Error handling
- ✅ Timeout protection
- ✅ Backward compatibility

### 2. Run Demo with Test Adapter

```bash
npm run demo
```

This uses the built-in test adapter to simulate tool-calling without API costs.

### 3. Validate with Real LLM Providers

To validate with actual LLM providers, set your API key:

#### With OpenAI
```bash
OPENAI_API_KEY=your-key npm run demo
```

#### With Claude
```bash
ANTHROPIC_API_KEY=your-key npm run demo
```

### 4. Manual Validation Script

Create a test file `test-tool-calling.ts`:

```typescript
import Fastify from 'fastify'
import lmPlugin from './dist/index.js'

const tools = {
  weatherTool: {
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      },
      required: ['location'],
      additionalProperties: false
    },
    execute: async ({ location }) => {
      // Simulate weather API call
      return `Weather in ${location}: 25°C, Sunny`
    }
  }
}

async function test() {
  const app = Fastify()
  
  await app.register(lmPlugin, {
    models: [{
      name: 'lm',
      provider: 'openai', // or 'claude'
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY
    }]
  })
  
  const response = await app.lm.chat({
    messages: [{ role: 'user', content: 'What is the weather in Tokyo?' }],
    tools
  })
  
  console.log('Response:', response)
  await app.close()
}

test()
```

Run with:
```bash
OPENAI_API_KEY=your-key tsx test-tool-calling.ts
```

### 5. Validation Checklist

- [ ] Integration tests pass (9/9)
- [ ] Unit tests pass (55/55)
- [ ] Build succeeds
- [ ] Demo runs without errors
- [ ] Tested with real API key (optional but recommended)
- [ ] Tool timeout works (test with slow tool)
- [ ] Error handling works (test with failing tool)
- [ ] Schema validation works (test with invalid args)
- [ ] Backward compatibility (test without tools)

### 6. Expected Behavior

**With Real LLM Provider:**
1. LLM analyzes the user message
2. LLM decides which tool to call
3. Tool is executed with parsed arguments
4. Tool result is returned to LLM
5. LLM generates final response based on tool result

**Example Flow:**
```
User: "What is the weather in Tokyo?"
↓
LLM: Decides to call weatherTool with location="Tokyo"
↓
Tool: Executes weatherTool({ location: "Tokyo" })
↓
Tool: Returns "Weather in Tokyo: 25°C, Sunny"
↓
LLM: Generates "The weather in Tokyo is 25°C and sunny."
```

### 7. Common Issues

**Tool not being called:**
- Check tool description is clear
- Verify LLM model supports tool-calling
- Ensure schema is valid JSON Schema

**Invalid arguments:**
- Check schema matches expected types
- Verify required fields are marked
- Test with JSON Schema validator

**Timeout errors:**
- Increase toolTimeout in options
- Check tool execution time
- Verify network connectivity

### 8. Production Deployment

Before deploying to production:

1. **Test with real API keys** - Validate with actual provider
2. **Monitor tool execution** - Add logging for production
3. **Set appropriate timeouts** - Based on your tool performance
4. **Implement rate limiting** - Prevent API abuse
5. **Add error monitoring** - Track tool failures
6. **Test edge cases** - Network failures, invalid inputs, etc.

### 9. Monitoring in Production

Add logging to track tool usage:

```typescript
const tools = {
  myTool: {
    // ... schema ...
    execute: async (args) => {
      const startTime = Date.now()
      try {
        const result = await executeTool(args)
        const duration = Date.now() - startTime
        console.log(`[Tool] myTool executed in ${duration}ms`)
        return result
      } catch (error) {
        console.error(`[Tool] myTool failed:`, error)
        throw error
      }
    }
  }
}
```

### 10. Success Criteria

Tool-calling is production-ready when:

- ✅ All tests pass (unit + integration)
- ✅ Validated with at least one real provider
- ✅ Error handling tested and working
- ✅ Timeout protection configured
- ✅ Schema validation working
- ✅ Backward compatibility verified
- ✅ Documentation complete
- ✅ Monitoring/logging in place
