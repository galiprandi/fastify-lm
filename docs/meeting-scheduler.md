# 📅 Automated Meeting Scheduling with Tool-Calling

Let your AI agent schedule meetings directly in your users' calendars by leveraging tool-calling. This pattern lets the model decide when to invoke a real backend action, such as creating a calendar event.

## How it works

- The user requests a meeting via chat.
- The model decides when to call the `schedule_meeting` tool.
- The tool receives the parsed parameters and creates a real meeting in your backend or calendar API.
- The system handles multi-step interactions (e.g., checking availability before scheduling).

## Complete Example

```typescript
import Fastify from 'fastify'
import lmPlugin from 'fastify-lm'

const app = Fastify()

// Register the plugin with tool-calling support
app.register(lmPlugin, {
  models: [
    {
      name: 'lm',
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
      options: {
        maxToolIterations: 10,
        toolTimeout: 30000
      }
    }
  ]
})

// Define tools for meeting scheduling
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
    execute: async ({ startTime, duration, participants }) => {
      // Integrate with your calendar API
      const availability = await calendarAPI.checkAvailability({
        startTime,
        duration,
        participants
      })
      
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
    execute: async ({ title, startTime, duration, participants, description }) => {
      // Create meeting in your calendar system
      const meeting = await calendarAPI.createMeeting({
        title,
        startTime,
        duration,
        participants,
        description
      })
      
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
    execute: async ({ date, duration, participants }) => {
      // Find available slots
      const slots = await calendarAPI.findAvailableSlots({
        date,
        duration,
        participants
      })
      
      return `Available slots on ${date}: ${slots.map(s => s.time).join(', ')}`
    }
  }
}

// Route to handle meeting scheduling requests
app.post('/schedule', async (request, reply) => {
  const { message } = request.body
  
  try {
    const response = await app.lm.chat({
      messages: [{ role: 'user', content: message }],
      tools: meetingTools
    })
    
    return { 
      success: true,
      response 
    }
  } catch (error) {
    reply.status(500).send({ 
      success: false,
      error: error.message 
    })
  }
})

// Start the server
app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Meeting scheduler running at ${address}`)
})
```

## Example Chat Prompts

### Simple Scheduling
```
User: Schedule a 30-minute meeting with alice@example.com and bob@example.com tomorrow at 2pm to discuss the quarterly report
```

The model will:
1. Parse the date/time
2. Call `checkAvailability` to verify participants are free
3. Call `scheduleMeeting` to create the event
4. Return confirmation

### Finding Available Times
```
User: When are alice@example.com and bob@example.com available for a 1-hour meeting next week?
```

The model will:
1. Call `findAvailableSlots` for multiple days
2. Present the options to the user
3. Wait for user confirmation before scheduling

### Complex Scheduling
```
User: I need to schedule a project kickoff meeting with the team next week. It should be 1 hour and include alice@example.com, bob@example.com, and charlie@example.com. Please find a time when everyone is available.
```

The model will:
1. Call `findAvailableSlots` for the week
2. Present options
3. If user confirms a slot, call `checkAvailability` 
4. Finally call `scheduleMeeting`

## Integration with Calendar APIs

### Google Calendar Integration

```typescript
import { google } from 'googleapis'

const calendar = google.calendar({ version: 'v3', auth })

const meetingTools = {
  scheduleMeeting: {
    // ... schema definition ...
    execute: async ({ title, startTime, duration, participants, description }) => {
      const event = {
        summary: title,
        description,
        start: {
          dateTime: startTime,
          timeZone: 'America/Los_Angeles'
        },
        end: {
          dateTime: new Date(new Date(startTime).getTime() + duration * 60000).toISOString(),
          timeZone: 'America/Los_Angeles'
        },
        attendees: participants.map(email => ({ email }))
      }
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all'
      })
      
      return `Meeting created: ${response.data.htmlLink}`
    }
  }
}
```

### Microsoft Outlook Integration

```typescript
import { Client } from '@microsoft/microsoft-graph-client'

const meetingTools = {
  scheduleMeeting: {
    // ... schema definition ...
    execute: async ({ title, startTime, duration, participants, description }) => {
      const event = {
        subject: title,
        body: { content: description },
        start: { dateTime: startTime, timeZone: 'Pacific Standard Time' },
        end: { 
          dateTime: new Date(new Date(startTime).getTime() + duration * 60000).toISOString(),
          timeZone: 'Pacific Standard Time'
        },
        attendees: {
          required: participants.map(email => ({ emailAddress: { address: email } }))
        }
      }
      
      const response = await client.api('/me/events').post(event)
      return `Meeting created: ${response.webLink}`
    }
  }
}
```

## Error Handling

The tool-calling system includes comprehensive error handling:

```typescript
const meetingTools = {
  scheduleMeeting: {
    // ... schema ...
    execute: async (args) => {
      try {
        const meeting = await calendarAPI.createMeeting(args)
        return `Meeting scheduled: ${meeting.id}`
      } catch (error) {
        if (error.code === 'CONFLICT') {
          return 'Error: Time slot is already booked. Please choose another time.'
        }
        if (error.code === 'AUTH_FAILED') {
          return 'Error: Calendar authentication failed. Please check your credentials.'
        }
        return `Error scheduling meeting: ${error.message}`
      }
    }
  }
}
```

## Best Practices

1. **Validate Parameters**: Use JSON Schema to ensure valid input
2. **Check Availability First**: Always verify before scheduling
3. **Handle Conflicts Gracefully**: Provide helpful error messages
4. **Set Timeouts**: Prevent hanging on slow calendar APIs
5. **Log Actions**: Track all scheduling operations
6. **Send Confirmations**: Notify participants after scheduling

## Security Considerations

- **Authentication**: Secure your calendar API credentials
- **Authorization**: Verify users can schedule for specified participants
- **Rate Limiting**: Prevent abuse of calendar APIs
- **Input Validation**: Sanitize all user inputs
- **Audit Logging**: Track all scheduling activities

---

**Read more about tool-calling in the [Tool-Calling Guide](./tool-calling-guide.md).**
