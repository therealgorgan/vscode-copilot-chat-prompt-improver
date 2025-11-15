# Conversation Summary Feature - Flow Diagram

## Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Types Command                            │
│  @prompt-improver /improve [prompt]  OR  /summary               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              handleChatRequest() - Main Router                   │
│  • Determines which command was called                           │
│  • Routes to appropriate handler                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│ handleImprove    │      │ handleSummary    │
│ Command()        │      │ Command()        │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
         │                         │
         ▼                         ▼
┌──────────────────────────────────────────────────────┐
│      extractConversationHistory(context)              │
│  • Extracts requests and responses from chat context  │
│  • Returns ConversationHistory object                 │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│      generateConversationSummary(history) [NEW!]      │
│  • Analyzes conversation for patterns                 │
│  • Identifies key tasks and topics                    │
│  • Returns formatted summary string                   │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│      buildImprovePrompt() [ENHANCED!]                 │
│  • Includes conversation summary in context           │
│  • Adds most recent exchange                          │
│  • Formats for LLM consumption                        │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│      Send to Language Model                           │
│  • Processes enhanced context                         │
│  • Returns contextually aware response                │
└────────┬─────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│      Stream Response to User                          │
│  • Shows improved prompt or summary                   │
│  • Provides follow-up suggestions                     │
└──────────────────────────────────────────────────────┘
```

## Detailed: generateConversationSummary() Logic

```
Input: ConversationHistory { requests[], responses[] }
  │
  ▼
┌────────────────────────────────────────────────┐
│ 1. Count Turns                                 │
│    turnCount = max(requests.length,            │
│                    responses.length)           │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│ 2. Extract Recent Topics (Last 5)             │
│    For each request in requests.slice(-5):    │
│    • Get command prefix if any                │
│    • Truncate long prompts (max 80 chars)     │
│    • Format as numbered list                  │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│ 3. Identify Main Tasks                        │
│    Keywords: create, add, implement,          │
│              fix, update, refactor,           │
│              build, write, generate           │
│                                               │
│    For each request:                          │
│    • Search for keywords                      │
│    • Extract context snippet (±50 chars)      │
│    • Add to mainTasks[]                       │
└────────────┬───────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────┐
│ 4. Format Output                              │
│    • Conversation Overview                    │
│    • Recent Topics (numbered list)            │
│    • Key Tasks Identified (bullet list)       │
│    Return formatted markdown string           │
└────────────────────────────────────────────────┘
```

## Detailed: buildImprovePrompt() Enhancement

```
OLD BEHAVIOR (v0.0.7):
  if (conversationHistory exists) {
    Add raw conversation dump:
    User: [request 1]
    Assistant: [response 1]
    User: [request 2]
    Assistant: [response 2]
    ... (up to 5 turns, lots of tokens)
  }

NEW BEHAVIOR (v0.0.8):
  if (conversationHistory exists) {
    1. Generate smart summary
       ↓
       generateConversationSummary(history)
       
    2. Add summary to context
       "**Conversation Context:**"
       + summary
       
    3. Add most recent exchange
       "**Most Recent Exchange:**"
       + lastRequest
       + lastResponse (truncated to 300 chars)
       
    4. Add usage instruction
       "**Important:** Use this conversation 
        context to ensure the improved prompt
        is aware of what the user is currently
        working on..."
  }
```

## Data Flow Example

```
User has conversation:
┌─────────────────────────────────┐
│ 1. create login function        │
│ 2. add password hashing         │
│ 3. implement JWT tokens         │
│ 4. add refresh token logic      │
└─────────────────────────────────┘
        │
        ▼
extractConversationHistory()
┌─────────────────────────────────┐
│ ConversationHistory {           │
│   requests: [                   │
│     { prompt: "create login...",│
│       command: undefined },     │
│     { prompt: "add password..", │
│       command: undefined },     │
│     ... 4 items total           │
│   ],                            │
│   responses: [...]              │
│ }                               │
└─────────────────────────────────┘
        │
        ▼
generateConversationSummary()
┌─────────────────────────────────┐
│ **Conversation Overview:**      │
│ 4 exchanges in this session.    │
│                                 │
│ **Recent Topics:**              │
│ 1. create login function        │
│ 2. add password hashing         │
│ 3. implement JWT tokens         │
│ 4. add refresh token logic      │
│                                 │
│ **Key Tasks Identified:**       │
│ - create login function         │
│ - add password hashing          │
│ - implement JWT tokens          │
└─────────────────────────────────┘
        │
        ▼
buildImprovePrompt()
┌─────────────────────────────────┐
│ System Prompt                   │
│ + Workspace Context             │
│ + Conversation Summary ← NEW!   │
│ + Most Recent Exchange ← NEW!   │
│ + Original User Prompt          │
│ → Sent to LLM                   │
└─────────────────────────────────┘
        │
        ▼
LLM Response
┌─────────────────────────────────┐
│ Improved prompt that is aware:  │
│ ✓ You're building auth          │
│ ✓ You have JWT already          │
│ ✓ Next step is refresh tokens   │
│ ✓ Tech stack from workspace     │
└─────────────────────────────────┘
```

## Follow-up Provider Flow

```
User completes command → provideFollowups() called

If command === 'improve':
  ┌─────────────────────────────────┐
  │ Suggestions:                    │
  │ • Analyze the improvements      │
  │ • Summarize conversation [NEW!] │
  └─────────────────────────────────┘

If command === 'summary':
  ┌─────────────────────────────────┐
  │ Suggestions:                    │
  │ • Improve a prompt [NEW!]       │
  └─────────────────────────────────┘
```

## Settings Integration

```
User Settings
  │
  ├─ promptImprover.contextRichness
  │   ├─ minimal: No conversation history
  │   ├─ auto: Smart defaults based on preset
  │   └─ rich: Full conversation summary (default)
  │
  └─ (Legacy - still supported)
      promptImprover.includeConversationHistory
      ├─ true: Use generateConversationSummary()
      └─ false: Skip conversation context
```

## Token Efficiency Comparison

```
RAW CONVERSATION DUMP (v0.0.7):
┌────────────────────────────────────────┐
│ User: create a login function that     │
│ accepts email and password...          │
│ Assistant: Here's a comprehensive      │
│ login function with email validation,  │
│ password hashing using bcrypt, error   │
│ handling... [200+ tokens]              │
│                                        │
│ User: add password validation rules... │
│ Assistant: I've updated the function...│
│ [150+ tokens]                          │
│                                        │
│ [Continues for 5 turns]                │
│ TOTAL: ~800-1000 tokens                │
└────────────────────────────────────────┘

SMART SUMMARY (v0.0.8):
┌────────────────────────────────────────┐
│ **Conversation Overview:**             │
│ 4 exchanges in this session.           │
│                                        │
│ **Recent Topics:**                     │
│ 1. create a login function             │
│ 2. add password validation rules       │
│ 3. implement JWT tokens                │
│ 4. add refresh token logic             │
│                                        │
│ **Key Tasks Identified:**              │
│ - create a login function with email   │
│ - add password validation with bcrypt  │
│ - implement JWT tokens                 │
│                                        │
│ **Most Recent Exchange:**              │
│ User: add refresh token logic          │
│ Assistant: Here's the refresh token... │
│ [truncated to 300 chars]               │
│                                        │
│ TOTAL: ~250-350 tokens                 │
│ SAVINGS: 60-70% reduction! ✅           │
└────────────────────────────────────────┘
```

## Key Advantages

1. **Token Efficiency**: 60-70% reduction in tokens while preserving context
2. **Better Context**: Summary + recent exchange = best of both worlds
3. **Actionable**: Focuses on tasks and topics, not verbose responses
4. **Scalable**: Works well for both short and long conversations
5. **Backward Compatible**: No breaking changes to existing functionality
