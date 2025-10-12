# Quick Start Guide

## Running the Extension

### For Development

1. **Open the project in VS Code**
   ```bash
   cd f:\AppDev\vscode-chat-improve-prompt
   code .
   ```

2. **Press F5** to launch the Extension Development Host
   - This will open a new VS Code window with your extension loaded

3. **In the new window:**
   - Open any project/folder
   - Open the Chat panel (Ctrl+Alt+I or Cmd+Shift+I on Mac)
   - Type `@prompt-improver` and try it out!

### Example Usage

**Improve a basic prompt:**
```
@prompt-improver write a login function
```

**Analyze a prompt:**
```
@prompt-improver /analyze create a REST API with authentication
```

**Get contextual improvements:**
- Open some TypeScript files in your workspace
- Try: `@prompt-improver create a new component`
- The extension will detect TypeScript and suggest improvements with that context!

## How It Works

1. You type a prompt with `@prompt-improver`
2. The extension analyzes your prompt
3. It gathers context from your workspace (languages, frameworks, open files)
4. It uses GitHub Copilot's AI to improve your prompt
5. You get back a better, more specific prompt to use with other participants

## Testing Different Scenarios

### Scenario 1: Vague Prompt
```
@prompt-improver create a function
```
**Result:** You'll get a more specific prompt with:
- Language specification
- Parameter details
- Return type
- Error handling considerations

### Scenario 2: With Workspace Context
Open some React files, then try:
```
@prompt-improver add a form
```
**Result:** The improved prompt will mention React, your existing patterns, etc.

### Scenario 3: Analysis Mode
```
@prompt-improver /analyze Create a user authentication system with JWT tokens
```
**Result:** Detailed analysis of the prompt's strengths and weaknesses

## Troubleshooting

### Extension Not Appearing
- Make sure you're in the Extension Development Host (the new window that opened when you pressed F5)
- Check the Debug Console in the original VS Code window for any errors

### No Language Model Available
- Ensure GitHub Copilot is installed and you're signed in
- Check your Copilot subscription is active

### Changes Not Reflecting
- Stop debugging (Shift+F5)
- Run `npm run compile` in the terminal
- Press F5 again to restart

## Next Steps

- Try it with different prompts
- Open files in different languages to see context gathering
- Use `/analyze` to learn about effective prompting
- Copy the improved prompts and use them with `@workspace` or other participants!

## Building for Distribution

When ready to share:

```bash
npm run package
```

This creates a `.vsix` file you can install or distribute.
