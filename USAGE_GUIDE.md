# Usage Guide: Participant vs Tool

## Two Ways to Use Prompt Improver

Prompt Improver now offers **two different methods** for improving your prompts, each with different use cases.

---

## Method 1: Chat Participant (Using @prompt-improver)

### How It Works
Use the `@prompt-improver` participant directly in Copilot Chat with slash commands.

### Usage Examples

```
@prompt-improver /improve write a REST API
```

```
@prompt-improver /improve-detailed create a user authentication system
```

```
@prompt-improver /analyze my prompt about building a React component
```

### Features
- ✅ **Full control** with specific slash commands
- ✅ **Preset selection** via commands (`/improve-concise`, `/improve-balanced`, `/improve-detailed`)
- ✅ **Analysis mode** with `/analyze` command
- ✅ **Progress indicators** showing context gathering steps
- ✅ **Copy button** for improved prompts
- ✅ **All context options** available (workspace, git, files, etc.)

### Best For
- When you want **explicit control** over the improvement style
- When you want to **analyze** prompt effectiveness
- When you need to see **detailed progress** of context gathering
- When working with **complex prompts** that need specific presets

---

## Method 2: Language Model Tool (Inline with Copilot)

### How It Works
Simply mention "improve" or "boost" in your conversation with Copilot Chat (without @prompt-improver), and Copilot will automatically invoke the tool when appropriate.

### Usage Examples

**In regular Copilot Chat:**
```
Improve this prompt: write a REST API for a todo app
```

```
Can you boost this prompt: create a user authentication system
```

```
I want to create a web app. First, improve this prompt with better context, then write the code.
```

### Features
- ✅ **Seamless integration** with regular Copilot Chat
- ✅ **No @-mention** required
- ✅ **Natural language** interaction
- ✅ **Basic workspace context** included automatically
- ✅ **Works with any Copilot interaction**

### Best For
- When you want a **quick improvement** without switching to a different participant
- When you're **already chatting with Copilot** and want inline enhancement
- When you want **natural conversation flow** without explicit commands
- When you want Copilot to **decide when to improve** prompts

---

## Key Differences

| Feature | Chat Participant (@prompt-improver) | Language Model Tool (inline) |
|---------|-------------------------------------|------------------------------|
| **Invocation** | `@prompt-improver /improve` | "improve this prompt: ..." |
| **Preset Control** | ✅ Explicit commands | ⚠️ Uses configured default |
| **Progress Indicators** | ✅ Detailed | ❌ Minimal |
| **Analysis Mode** | ✅ Yes (`/analyze`) | ❌ No |
| **Copy Button** | ✅ Yes | ❌ No (manual copy) |
| **Full Context** | ✅ All options | ⚠️ Basic context only |
| **Natural Flow** | ⚠️ Requires @-mention | ✅ Seamless |
| **Copilot Integration** | ⚠️ Separate participant | ✅ Works inline |

---

## Important: Conversation History Limitation

### ⚠️ Neither Method Has Access to Full Chat History

Both the chat participant and the language model tool have the **same limitation** regarding conversation history:

- **Chat Participants** can only see their own messages in `context.history`, not the full conversation
- **Language Model Tools** only receive the specific parameters passed to them, not the conversation

This is a **VS Code API limitation** by design for privacy and security.

### What This Means

❌ **Cannot do:**
- Reference previous messages in the chat
- Build on conversation context automatically
- Remember what was discussed earlier

✅ **Can do:**
- Analyze the workspace and open files
- Detect technologies and languages
- Include Git context
- Reference selected code
- Include diagnostics and errors

### Workaround

If you need to reference previous conversation:
1. Explicitly include relevant context in your prompt
2. Use file references (`#file:path/to/file`)
3. Select code before improving prompts (included automatically)
4. Mention specific files, classes, or functions by name

---

## When to Use Each Method

### Use Chat Participant (@prompt-improver) when:
- ✅ You want **specific preset control** (concise/balanced/detailed)
- ✅ You need **analysis mode** to understand prompt effectiveness
- ✅ You want **detailed progress** during context gathering
- ✅ You need the **copy button** for easy sharing
- ✅ Working on **complex prompts** requiring specific approaches

### Use Language Model Tool (inline) when:
- ✅ You're **already in Copilot Chat** and want quick improvements
- ✅ You want **natural conversation flow** without @-mentions
- ✅ You need **quick enhancements** without command syntax
- ✅ You want Copilot to **automatically invoke** improvements when needed
- ✅ Working on **simple prompts** that just need basic enhancement

---

## Configuration

### For Chat Participant
All settings in `Settings → Prompt Improver` apply:
- System Prompt Preset
- Context inclusion options
- Model selection
- MCP server usage

### For Language Model Tool
Uses your configured settings but with simplified context:
- Workspace metadata (if enabled)
- Basic file and technology detection
- Configured model family
- Custom/preset selection follows your settings

---

## Examples

### Scenario 1: Improving a Simple Prompt

**Option A - Tool (Quick):**
```
improve this prompt: write a function to validate email addresses
```

**Option B - Participant (Controlled):**
```
@prompt-improver /improve-concise write a function to validate email addresses
```

### Scenario 2: Complex Project Prompt

**Best: Use Participant for full context**
```
@prompt-improver /improve-detailed create a user authentication system with JWT tokens
```

### Scenario 3: Iterative Development

**Best: Use Tool for natural flow**
```
I'm building a todo app. First, improve this prompt: create a REST API for todos. 
Then write the code using Express and TypeScript.
```

### Scenario 4: Learning About Prompts

**Best: Use Participant for analysis**
```
@prompt-improver /analyze create a web app
```

---

## Pro Tips

1. **Mix Both Methods**: Use the tool for quick improvements, then switch to participant for detailed work

2. **Custom Presets**: Set up a custom preset in settings that works well for your workflow, then use the tool for quick access

3. **Explicit Context**: When using either method, include file names, function names, or technology stack explicitly if relevant

4. **Selection First**: Select code in your editor before invoking either method - it's automatically included as context

5. **MCP Servers**: If you have Serena or other MCP servers configured, both methods benefit from enhanced code analysis

---

## Troubleshooting

### Tool Not Working
- Verify Copilot Chat is active and authenticated
- Try rephrasing with clear keywords: "improve", "boost", "enhance"
- Check Output panel → Prompt Improver for errors

### Participant Not Working  
- Ensure you use `@prompt-improver` (with hyphen, not underscore)
- Verify extension is activated in Extensions view
- Check for command suggestions when typing `/`

### Neither Method Uses Conversation History
- This is expected behavior due to VS Code API limitations
- Include relevant context explicitly in your prompt
- Use file references and code selections for context

---

## Future Enhancements

Potential improvements being considered:
- Conversation history access (waiting for VS Code API updates)
- Tool preset selection through natural language
- More sophisticated context detection
- Integration with additional MCP servers
