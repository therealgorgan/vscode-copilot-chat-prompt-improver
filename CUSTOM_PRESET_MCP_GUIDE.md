# Custom Preset & MCP Server Guide

## Custom Preset Feature

### What's New?
You can now create and use your own custom system prompts instead of being limited to the three built-in presets (Concise, Balanced, Detailed).

### How to Use Custom Presets

#### Method 1: Edit an Existing Preset
1. Open Settings: `Ctrl+,` (Windows/Linux) or `Cmd+,` (Mac)
2. Search for "Prompt Improver"
3. Select a preset you like (e.g., "Balanced")
4. Scroll down to "System Prompt" setting
5. Edit the prompt text to your liking
6. **The extension will automatically switch to "Custom" preset** and show a notification
7. Your changes are saved automatically

#### Method 2: Create from Scratch
1. Open Settings → Prompt Improver
2. In "System Prompt Preset" dropdown, select **"Custom"**
3. Edit the "System Prompt" setting below
4. Your custom prompt will be used for all improvements

### Custom Prompt Tips

Your custom prompt can include these placeholders:
- `{userPrompt}` - The user's original prompt
- `{languages}` - Detected programming languages
- `{technologies}` - Detected frameworks/technologies
- `{openFiles}` - List of open files

**Example Custom Prompt:**
```
You are an expert code reviewer and technical writer.

Transform the user's prompt to be more specific and actionable.
Focus on: {technologies} and {languages}.

User's prompt: {userPrompt}

Make it concise but complete. Include specific file references when relevant.
```

### Switching Between Presets
- Select any built-in preset → System Prompt shows that preset's content
- Edit System Prompt → Auto-switches to Custom
- Select Custom → Uses your saved custom prompt
- Your custom prompt is preserved even when switching to other presets

---

## MCP Server Integration

### What is MCP?
Model Context Protocol (MCP) is a standard for providing AI assistants with enhanced capabilities like code indexing, symbol analysis, and semantic search.

### Supported MCP Servers
- **Serena** (https://github.com/oraios/serena) - Advanced code indexing and symbol analysis
- Any MCP-compatible server integrated with VS Code

### How It Works
1. Install and configure an MCP server (like Serena)
2. The extension automatically detects available MCP servers
3. When improving prompts, MCP context is included
4. The AI receives enhanced information about your codebase

### Configuration

**Enable/Disable MCP:**
1. Open Settings → Prompt Improver
2. Find "Use MCP Servers" setting
3. Toggle on (default) or off

**When to Disable:**
- If you don't have MCP servers installed
- If you want faster responses (skips MCP detection)
- If you prefer standard context only

### Benefits of MCP Integration
- ✅ Deeper understanding of your codebase structure
- ✅ Better symbol and class references in improved prompts
- ✅ More accurate technology detection
- ✅ Enhanced context for complex projects

---

## Quick Access: Settings Command

### New Command
**Prompt Improver: Settings** - Opens extension settings directly

### How to Access
1. **Command Palette**: 
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Prompt Improver: Settings"
   - Press Enter

2. **Alternative**: 
   - Settings → Extensions → Prompt Improver

---

## FAQ

### Q: Will my custom prompt be lost if I change presets?
**A:** No! Your custom prompt is saved separately. When you switch back to "Custom" preset, your prompt will still be there.

### Q: Can I share my custom prompt with my team?
**A:** Yes! The custom prompt is stored in your settings. You can:
1. Copy it from Settings
2. Share the text with your team
3. They can paste it into their Settings → System Prompt
4. Select "Custom" preset

### Q: What if I don't have Serena or other MCP servers?
**A:** That's fine! The extension works perfectly without MCP servers. It will just use the standard context gathering methods. You can keep the setting enabled; it won't cause any issues.

### Q: How do I know if MCP servers are detected?
**A:** When you use `@prompt-improver`, watch the progress messages. If MCP servers are detected, you'll see "MCP servers detected" in the progress indicator.

### Q: Can I use custom prompts with the slash commands?
**A:** The slash commands (`/improve-concise`, `/improve-balanced`, `/improve-detailed`) always use their respective built-in presets. Use `/improve` (without a suffix) to use your custom preset.

---

## Troubleshooting

### Custom Preset Not Saving
1. Check if you're in workspace or user settings
2. Try updating in User settings (global)
3. Restart VS Code

### MCP Servers Not Detected
1. Verify your MCP server is properly installed and configured
2. Check if it's integrated with VS Code's Language Model API
3. Look for errors in Output panel → Prompt Improver
4. Try toggling the "Use MCP Servers" setting

### Settings Command Not Found
1. Reload window: `Ctrl+Shift+P` → "Reload Window"
2. Verify extension is activated
3. Check Extensions view to ensure it's enabled

---

## Need Help?

- 📖 [Full Documentation](README.md)
- 🐛 [Report Issues](https://github.com/therealgorgan/vscode-copilot-chat-prompt-improver/issues)
- 💬 [Discussions](https://github.com/therealgorgan/vscode-copilot-chat-prompt-improver/discussions)
