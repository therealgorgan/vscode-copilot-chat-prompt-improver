# Prompt Improver for VS Code

> Transform vague prompts into clear, actionable requests that produce better AI-generated code.

A VS Code extension that analyzes and improves your GitHub Copilot Chat prompts using AI and rich workspace context.

[![Version](https://img.shields.io/badge/version-0.0.14-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **Intelligent Improvement** | AI-powered prompt analysis and enhancement |
| 🎯 **Three Presets** | Concise, Balanced, or Detailed improvement styles |
| 🔍 **Rich Context** | Workspace metadata, Git status, open files, conversation history |
| 📊 **Prompt Analysis** | Understand what makes prompts effective |
| 🔄 **Agent Handoff** | Seamlessly transition to new chats without losing context |
| 📋 **One-Click Copy** | Copy improved prompts instantly |
| 🛡️ **Robust Error Handling** | Graceful degradation and user-friendly error messages |
| ⚙️ **Granular Control** | Enable/disable specific context types |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[Quick Start](#-quick-start)** | Get started in 2 minutes |
| **[Preset Comparison](PRESET_COMPARISON.md)** | Detailed comparison of Concise, Balanced, and Detailed presets |
| **[Error Handling](ERROR_HANDLING.md)** | Comprehensive error handling guide |
| **[Changelog](CHANGELOG.md)** | Version history and updates |

---

## 🚀 Quick Start

### Installation

**From VSIX (Development):**
1. Clone this repository
2. Run `npm install`
3. Run `npm run package`
4. In VS Code: Extensions → "..." → Install from VSIX
5. Select the generated `.vsix` file

**From Marketplace (Coming Soon):**
Search for "Prompt Improver" in VS Code Extensions.

### Basic Usage

**Improve a prompt:**
```
@prompt-improver write a login function
```

**Analyze a prompt:**
```
@prompt-improver /analyze create a REST API with authentication
```

**Create a handoff prompt:**
```
@prompt-improver /handoff
```

---

## 🎯 Preset Styles

Choose the improvement style that fits your needs:

| Preset | Speed | Detail Level | Best For |
|--------|-------|--------------|----------|
| **Concise** | ⚡ Fastest | Minimal | Quick iterations, simple prompts |
| **Balanced** | ⚡ Fast | Moderate | Most coding tasks (recommended) |
| **Detailed** | 🔄 Moderate | Extensive | Complex/production-critical tasks |

**All presets receive the same rich context:**
- Programming languages & frameworks
- Open files with intelligent code synopsis
- Git context (branch, status, commits, staged changes)
- Conversation history
- Project documentation (markdown files)
- User-provided references (#file, @workspace)

**The difference is in how each preset uses this context.**

📖 **[Read the full preset comparison →](PRESET_COMPARISON.md)**

## 📖 Commands

### `/improve` - Improve a Prompt (Default)

Transforms your prompt into a clear, actionable request.

**Usage:**
```
@prompt-improver write a function
@prompt-improver /improve create a REST API
```

**With preset override:**
```
@prompt-improver /concise add error handling
@prompt-improver /balanced create a component
@prompt-improver /detailed implement authentication
```

**What it does:**
1. Analyzes your original prompt
2. Gathers rich context (workspace, Git, files, conversation)
3. Generates an improved, more specific prompt
4. Provides a copy button for easy use

---

### `/analyze` - Analyze Prompt Effectiveness

Explains what makes a prompt effective and provides recommendations.

**Usage:**
```
@prompt-improver /analyze create a REST API with proper error handling
```

**Provides:**
- ✅ Strengths of the prompt
- ⚠️ Areas for improvement
- 🎯 Specificity analysis
- 📋 Context evaluation
- 💡 Actionable recommendations

---

### `/summary` - Summarize Conversation

Analyzes your conversation history to provide a clear, actionable summary of what you've been working on.

**Usage:**
```
@prompt-improver /summary
@prompt-improver /summary Focus on the authentication work
```

**What it provides:**
- 📋 **Overview** - Brief summary of the conversation (2-3 sentences)
- 🎯 **Current State** - What's been accomplished and what's pending
- 🔑 **Key Decisions** - Important technical choices and constraints discussed
- 🔍 **Recent Focus** - What the most recent exchanges have been about
- ➡️ **Next Steps** - Suggested logical next actions

**Perfect for:**
- Getting back on track after a long conversation
- Understanding the current state of your work
- Planning next steps
- Identifying blockers or issues

**Integration with `/improve`:**
When you use `/improve` with "Include Conversation History" enabled, the improved prompt automatically includes a summary of what you've been working on. This ensures the improved prompt is contextually aware of your recent progress.

---

### `/handoff` or `/new-chat` - Create Agent Handoff Prompt

Creates a context-preserving prompt for starting a new chat session.

**Usage:**
```
@prompt-improver /handoff
@prompt-improver /new-chat
@prompt-improver /handoff Focus on the authentication implementation
```

**What it includes:**
- 📜 Conversation history (last 10 exchanges)
- 💻 Workspace context (languages, technologies, open files)
- 🔀 Git context (branch, status, commits, staged changes)
- 🎯 Current state and next steps
- 📝 Technical decisions and requirements

**Perfect for:**
- Long conversations that need to be split
- Handing off work to a fresh agent
- Starting a new chat without losing context
- Avoiding token limits in long sessions

---

## 💡 Examples

### Example 1: Basic Improvement

**Before:**
```
@workspace create a login page
```

**After using @prompt-improver:**
```
@workspace Create a React login page component with the following requirements:

**Core Functionality:**
- Email and password input fields with validation
- Form submission handling with error states
- Integration with our existing authentication context (AuthContext.tsx)
- Display loading state during authentication

**UI/UX:**
- Responsive design using our Tailwind CSS setup
- Accessibility features (ARIA labels, keyboard navigation, screen reader support)
- Error message display for failed login attempts
- "Remember me" checkbox with localStorage persistence

**Technical Requirements:**
- TypeScript with proper type definitions
- React hooks (useState, useContext, useEffect)
- Form validation using react-hook-form
- Password visibility toggle
- Rate limiting on client side (prevent spam submissions)

**Testing:**
- Unit tests for validation logic
- Integration tests for authentication flow
```

---

### Example 2: Concise vs Balanced vs Detailed

**Original prompt:** `add error handling`

**Concise output:**
```
Add try-catch error handling to the login() function in auth.ts.
Catch network errors and invalid credentials.
Return error messages to the UI.
```

**Balanced output:**
```
Add comprehensive error handling to the login() function in src/auth/auth.ts.

Requirements:
- Wrap the authentication API call in try-catch
- Handle specific error types:
  * Network errors (timeout, connection failed)
  * Invalid credentials (401 response)
  * Server errors (500+ responses)
- Return user-friendly error messages to the LoginForm component
- Log errors to the console for debugging

Use the existing ErrorMessage component from src/components/ErrorMessage.tsx.
Follow the error handling pattern used in src/auth/register.ts.
```

**Detailed output:** *(See [PRESET_COMPARISON.md](PRESET_COMPARISON.md) for full example)*

---

## ⚙️ Requirements

- **VS Code:** Version 1.105.0 or higher
- **GitHub Copilot:** Extension installed and authenticated
- **Subscription:** Active GitHub Copilot subscription

## ⚙️ Configuration

### Preset Selection

Choose your default improvement style:

**Via Settings UI:**
1. Open Settings (Ctrl+, or Cmd+,)
2. Search for "Prompt Improver"
3. Select from **System Prompt Preset** dropdown

**Via settings.json:**
```json
{
  "promptImprover.systemPromptPreset": "balanced"
}
```

**Options:** `"concise"`, `"balanced"` (default), `"detailed"`

---

### Model Selection

**Default Behavior (Recommended):**
The extension automatically uses whatever model you have selected in Copilot Chat. If no model is selected, it falls back to **gpt-4o-mini** (the fastest model, free with your Copilot subscription). No configuration needed! 🎉

**To override with a specific model:**
1. Command Palette (Ctrl+Shift+P)
2. Run: `Prompt Improver: Select Model from Available Options`
3. Choose from available models

**Manual Entry:**
```json
{
  // Leave empty to use current chat model (recommended)
  // Falls back to gpt-4o-mini if no model selected
  "promptImprover.modelFamily": ""
  
  // Or specify a model to always use it
  "promptImprover.modelFamily": "claude-sonnet-4"
}
```

**Common options:** `gpt-4o`, `gpt-4o-mini`, `claude-sonnet-4`, `gemini-2.5-pro`, `o3-mini`

**Benefits:**
- ✅ No configuration needed for most users
- ✅ Uses gpt-4o-mini by default (fast and free)
- ✅ Easy to experiment with different models (just switch in chat UI)
- ✅ Advanced users can still specify a model to always use

---

### Context Control

Enable/disable specific context types:

```json
{
  "promptImprover.includeWorkspaceMetadata": true,
  "promptImprover.includeConversationHistory": true,
  "promptImprover.includeMarkdownFiles": true,
  "promptImprover.includeOpenFileContents": true,
  "promptImprover.includeGitContext": true,
  "promptImprover.useWorkspaceTools": false
}
```

| Setting | Description | Default |
|---------|-------------|---------|
| `includeWorkspaceMetadata` | Languages, technologies, open files | `true` |
| `includeConversationHistory` | Previous chat messages | `true` |
| `includeMarkdownFiles` | Project documentation | `true` |
| `includeOpenFileContents` | Intelligent code synopsis | `true` |
| `includeGitContext` | Branch, status, commits | `true` |
| `useWorkspaceTools` | VS Code's built-in tools (experimental) | `false` |
| `filterWorkspaceTools` | Filter tools to avoid VS Code bugs | `true` |

**Note:** If you enable `useWorkspaceTools`, keep `filterWorkspaceTools` enabled to avoid a known VS Code bug. See [WORKSPACE_TOOLS_FIX.md](WORKSPACE_TOOLS_FIX.md) for details.

---

### Custom System Prompt

Override the preset with your own instructions:

```json
{
  "promptImprover.systemPrompt": "Your custom prompt template here..."
}
```

**Available placeholders:**
- `{userPrompt}` - The original prompt
- `{languages}` - Detected programming languages
- `{technologies}` - Detected frameworks/technologies
- `{openFiles}` - Currently open files

---

## 🛠️ Development

### Setup

```bash
# Install dependencies
npm install

# Compile the extension
npm run compile

# Watch for changes
npm run watch

# Package for distribution
npm run package
```

### Running the Extension

1. Open this folder in VS Code
2. Press **F5** to launch Extension Development Host
3. In the new window, open the Chat view (Ctrl+Alt+I)
4. Try `@prompt-improver` commands

### Testing

```bash
npm test
```

---

## 🔍 How It Works

1. **Context Gathering**
   - Detects programming languages and frameworks
   - Analyzes open files with intelligent code synopsis
   - Extracts Git context (branch, status, commits)
   - Scans relevant project documentation
   - Captures conversation history

2. **AI Analysis**
   - Uses GitHub Copilot Language Model API
   - Analyzes prompt for clarity and specificity
   - Incorporates gathered context
   - Generates improved, actionable prompts

3. **Error Handling**
   - Graceful degradation on failures
   - User-friendly error messages
   - Cancellation support
   - Stream closure protection

📖 **[Read the error handling guide →](ERROR_HANDLING.md)**

---

## 💡 Tips for Better Prompts

| Tip | Example |
|-----|---------|
| ✅ **Be Specific** | Instead of "create a function", say "create a TypeScript function that validates email addresses using regex" |
| ✅ **Provide Context** | Mention your tech stack, frameworks, or coding patterns you want to follow |
| ✅ **Define Constraints** | Specify requirements like error handling, testing, or performance considerations |
| ✅ **State Expected Output** | Clarify if you want code, explanation, tests, or documentation |
| ✅ **Use References** | Include `#file:path/to/file.ts` or `@workspace` for specific context |

---

## 🔒 Privacy & Security

- ✅ Only accesses files and context already open in your workspace
- ✅ All processing happens through GitHub Copilot Language Model API
- ✅ No data sent to third-party services
- ✅ Follows GitHub Copilot's privacy and security policies
- ✅ Context gathering respects your settings and permissions

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report Bugs** - Open an issue with details and reproduction steps
2. **Suggest Features** - Share your ideas for improvements
3. **Submit PRs** - Fix bugs or add features (please discuss first for major changes)
4. **Improve Docs** - Help make documentation clearer and more comprehensive

**Development Setup:**
```bash
git clone https://github.com/yourusername/vscode-chat-improve-prompt.git
cd vscode-chat-improve-prompt
npm install
code .
# Press F5 to start debugging
```

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🐛 Feedback & Support

- **Bug Reports:** [Open an issue](https://github.com/yourusername/vscode-chat-improve-prompt/issues)
- **Feature Requests:** [Start a discussion](https://github.com/yourusername/vscode-chat-improve-prompt/discussions)
- **Questions:** Check the [documentation](#-documentation) or open a discussion

---

## 🎉 Acknowledgments

Built with:

- [VS Code Extension API](https://code.visualstudio.com/api)
- [GitHub Copilot Language Model API](https://code.visualstudio.com/api/extension-guides/ai/language-model)
- [TypeScript](https://www.typescriptlang.org/)

---

**Enjoy better prompts and better AI responses!**

*Made with love for the VS Code community*
