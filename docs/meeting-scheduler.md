# 📅 Automated Meeting Scheduling with Tool-Calling

Let your AI agent schedule meetings directly in your users' calendars by leveraging tool-calling. This pattern lets the model decide when to invoke a real backend action, such as creating a calendar event.

## How it works

- The user requests a meeting via chat.
- The model decides when to call the `schedule_meeting` tool.
- The tool receives the parsed parameters and creates a real meeting in your backend or calendar API.

## Example: Tool Definition and Usage

```js
fastify.register(lmPlugin, {
  models: [
    {
      name: "lm",
      provider: "openai",
      model: "gpt-4o",
      apiKey: "your-api-key",
      tools: {
        schedule_meeting: {
          description: "Schedule a meeting in the user's calendar.",
          parameters: {
            type: "object",
            properties: {
              date: { type: "string", format: "date", description: "Date of the meeting (YYYY-MM-DD)" },
              time: { type: "string", pattern: "^\\d{2}:\\d{2}$", description: "Time (HH:MM, 24h)" },
              participants: { type: "array", items: { type: "string" }, description: "Emails of participants" },
              topic: { type: "string", description: "Meeting topic" }
            },
            required: ["date", "time", "participants", "topic"],
            additionalProperties: false
          },
          execute: async ({ date, time, participants, topic }) => {
            // Integrate with your calendar API here
            return `Meeting scheduled for ${date} at ${time} about \"${topic}\" with ${participants.join(", ")}.`
          }
        }
      }
    }
  ]
})
```

## Example Chat Prompt

```
User: Can you set up a meeting with Alice and Bob next Friday at 14:00 to discuss the quarterly report?
```

The model will extract the relevant details and automatically invoke the `schedule_meeting` tool, which will handle the actual scheduling logic.

---

**Read more about tool-calling and custom tools in the [advanced documentation](adding-new-adapter.md).**
