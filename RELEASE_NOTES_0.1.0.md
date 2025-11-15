# Version 0.1.0 Release Notes

## 🎉 Major Update: Dual Usage Modes!

Prompt Improver now offers **two ways** to improve your prompts, giving you flexibility in how you interact with the extension.

---

## 🆕 What's New

### Language Model Tool Support

The extension now registers as a **Language Model Tool**, allowing Copilot Chat to invoke prompt improvements inline without requiring `@prompt-improver`.

#### Before (Still works):
```
@prompt-improver /improve write a REST API
```

#### Now Also Works:
```
Improve this prompt: write a REST API
```

```
Can you boost this prompt: create a user authentication system
```

```
I want to build a web app. First, improve this prompt, then write the code.
```

### How It Works

When you mention keywords like "improve", "boost", or "enhance" in a regular Copilot Chat conversation, Copilot can automatically invoke the Prompt Improver tool to enhance your prompt **inline** without needing to switch to a different participant.

---

## 📊 Comparison: Participant vs Tool

| Feature | @prompt-improver (Participant) | Inline (Tool) |
|---------|-------------------------------|---------------|
| **Usage** | `@prompt-improver /improve` | "improve this prompt: ..." |
| **Best For** | Complex prompts, analysis | Quick improvements |
| **Preset Control** | ✅ Explicit commands | Uses configured default |
| **Progress Indicators** | ✅ Detailed | Minimal |
| **Analysis Mode** | ✅ Yes | ❌ No |
| **Copy Button** | ✅ Yes | ❌ No |
| **Natural Flow** | Requires @-mention | ✅ Seamless |

---

## 🔍 Important: About Conversation History

### The Reality

After researching the PromptBoost extension and VS Code's API, we discovered that **neither approach provides access to full conversation history**:

- **Chat Participants** can only see their own messages in `context.history`
- **Language Model Tools** only receive the specific parameters passed to them
- This is a **VS Code API limitation** by design for privacy and security

### What This Means

❌ **Cannot do:**
- Reference previous messages in the chat automatically
- Build on conversation context from other participants
- Remember earlier discussions

✅ **Can do:**
- Analyze workspace and open files
- Detect technologies and languages
- Include Git context
- Reference selected code
- Include diagnostics and errors

### Workaround

Both methods provide rich context from:
- Your workspace structure and files
- Open editors and selections
- Git status and recent commits
- Project dependencies
- Active errors and warnings
- MCP servers (like Serena) if configured

To reference previous conversation, explicitly include relevant details in your prompt.

---

## 🎯 When to Use Each Method

### Use @prompt-improver (Participant) When:
- ✅ You need **specific preset control** (concise/balanced/detailed)
- ✅ You want **analysis mode** to understand prompt effectiveness  
- ✅ You need **detailed progress** indicators
- ✅ You want the **copy button** for sharing
- ✅ Working on **complex, multi-part prompts**

### Use Inline (Tool) When:
- ✅ You're **already chatting** with Copilot
- ✅ You want **natural conversation flow**
- ✅ You need **quick enhancements** without syntax
- ✅ You want Copilot to **auto-invoke** when needed
- ✅ Working on **simple, straightforward prompts**

---

## 📝 Examples

### Example 1: Quick Inline Improvement
```
User: Improve this prompt: write a function to validate email addresses

Copilot: [Invokes Prompt Improver Tool]

Improved prompt:
Create a robust email validation function with the following requirements:
- Input: String representing an email address
- Output: Boolean indicating validity
- Validation rules:
  * Must contain exactly one @ symbol
  * Local part before @ should not be empty
  * Domain part after @ should contain at least one dot
  * Domain should not start or end with a dot
- Handle edge cases: null, undefined, empty strings
- Use TypeScript with proper type annotations
- Add JSDoc documentation
- Include example usage
```

### Example 2: Participant with Preset
```
User: @prompt-improver /improve-detailed write a function to validate email addresses

[Extension shows progress: "Gathering workspace context...", "Analyzing open files..."]

[Returns detailed, comprehensive improved prompt with full context]

[Shows copy button for easy sharing]
```

### Example 3: Natural Workflow
```
User: I'm building a todo app with React and TypeScript. 
      First, boost this prompt: create a REST API for todos.
      Then write the code.

Copilot: [Invokes Prompt Improver Tool automatically]

[Returns improved prompt with React/TypeScript context]

[Then proceeds to generate code based on improved prompt]
```

---

## 🚀 New Configuration

The tool uses your existing settings:
- System Prompt Preset (including custom)
- Workspace metadata inclusion
- MCP server integration
- Model family selection

No additional configuration needed!

---

## 📚 Documentation

New comprehensive guides:
- **USAGE_GUIDE.md** - Complete guide to both usage methods
- **CUSTOM_PRESET_MCP_GUIDE.md** - Custom presets and MCP integration
- **CHANGES_SUMMARY.md** - Technical implementation details

---

## 🐛 Bug Fixes & Improvements

- Simplified prepublish script to avoid TypeScript PATH issues
- Better error handling in tool invocation
- Clearer progress messages
- Updated all documentation with accurate information about conversation history

---

## ⬆️ Upgrading

### Installation

1. Download `prompt-improver-0.1.0.vsix`
2. In VS Code: Extensions → "..." → Install from VSIX
3. Select the downloaded file
4. Reload window

### What's Preserved
- All your settings and custom presets
- Configuration preferences
- Workspace-specific settings

### What's New
- Tool is automatically registered on activation
- No setup needed - just start using it!

---

## 🎓 Learning More

- **Try both methods** to see which fits your workflow
- **Mix and match** - use tool for quick improvements, participant for detailed work
- **Configure MCP servers** like Serena for enhanced code analysis
- **Create custom presets** for your specific needs

---

## 🤝 Feedback

- Found a bug? [Open an issue](https://github.com/therealgorgan/vscode-copilot-chat-prompt-improver/issues)
- Have a suggestion? [Start a discussion](https://github.com/therealgorgan/vscode-copilot-chat-prompt-improver/discussions)
- Love the extension? ⭐ Star the repo!

---

## 🙏 Thanks

Thanks to [@chrisdias](https://github.com/chrisdias) for the [vscode-promptboost](https://github.com/chrisdias/vscode-promptboost) extension which inspired the Language Model Tool implementation!

---

## 📦 Package Details

- **File**: prompt-improver-0.1.0.vsix
- **Size**: 63KB
- **Files**: 22
- **Compatibility**: VS Code 1.105.0+
- **Requires**: GitHub Copilot

---

Enjoy the new flexibility in prompt improvement! 🎉
