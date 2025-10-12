# Prompt Improver - VS Code Extension

A VS Code extension that helps you write better prompts for GitHub Copilot Chat using AI analysis and workspace context.

## Features

ÔøΩÔøΩ **Intelligent Prompt Improvement** - Analyzes and improves your chat prompts to get better AI responses

Ì¥ç **Workspace-Aware** - Automatically incorporates context from your open files, programming languages, and project structure

Ì≥ä **Prompt Analysis** - Explains what makes a prompt effective and provides specific recommendations

Ì≤° **Smart Suggestions** - Provides follow-up questions to help you iterate on your prompts

## Usage

### Improving a Prompt

Use the @prompt-improver participant in the chat to improve your prompts:

```
@prompt-improver write a function
```

Or use the /improve command explicitly:

```
@prompt-improver /improve create a REST API
```

The extension will:
1. Analyze your original prompt
2. Gather relevant context from your workspace (languages, frameworks, open files)
3. Generate an improved, more specific prompt
4. Explain what improvements were made

### Analyzing a Prompt

Want to understand what makes a prompt effective? Use the /analyze command:

```
@prompt-improver /analyze create a REST API with proper error handling and authentication
```

This will provide:
- Strengths of the prompt
- Areas for improvement
- Specificity analysis
- Context evaluation
- Actionable recommendations

## Examples

### Before
```
@workspace create a login page
```

### After using @prompt-improver
```
@workspace Create a React login page component with the following requirements:
- Email and password input fields with validation
- Form submission handling with error states
- Integration with our existing authentication context
- Responsive design using our Tailwind CSS setup
- Accessibility features (ARIA labels, keyboard navigation)
- Display loading state during authentication
```

## Requirements

- VS Code version 1.105.0 or higher
- GitHub Copilot extension installed and authenticated
- Active GitHub Copilot subscription

## Installation

### From VSIX (Development)

1. Clone this repository
2. Run npm install
3. Run npm run package
4. In VS Code, go to Extensions view
5. Click "..." menu ‚Üí "Install from VSIX"
6. Select the generated .vsix file

### From Marketplace (Coming Soon)

Search for "Prompt Improver" in the VS Code Extensions marketplace.

## Development

### Setup

```bash
# Install dependencies
npm install

# Compile the extension
npm run compile

# Watch for changes
npm run watch
```

### Running the Extension

1. Open this folder in VS Code
2. Press F5 to launch Extension Development Host
3. In the new window, open the Chat view
4. Try @prompt-improver commands

### Testing

```bash
npm test
```

## How It Works

1. **Context Gathering**: The extension automatically detects:
   - Programming languages in use
   - Frameworks and technologies (from config files like package.json, tsconfig.json, etc.)
   - Currently open files

2. **AI Analysis**: Uses the GitHub Copilot Language Model API to:
   - Analyze the original prompt for clarity and specificity
   - Incorporate workspace context
   - Generate improved, more effective prompts

3. **Smart Suggestions**: Provides educational feedback about:
   - What makes prompts effective
   - How to structure requests for AI assistants
   - Best practices for technical prompts

## Commands

| Command | Description |
|---------|-------------|
| /improve | Improve a prompt (default command) |
| /analyze | Analyze what makes a prompt effective |

## Tips for Better Prompts

‚úÖ **Be Specific**: Instead of "create a function", say "create a TypeScript function that validates email addresses using regex"

‚úÖ **Provide Context**: Mention your tech stack, frameworks, or coding patterns you want to follow

‚úÖ **Define Constraints**: Specify requirements like error handling, testing, or performance considerations

‚úÖ **State Expected Output**: Clarify if you want code, explanation, tests, or documentation

## Privacy & Security

- This extension only accesses files and context that are already open in your workspace
- All prompt improvement happens through the GitHub Copilot Language Model API
- No data is sent to third-party services
- Follows GitHub Copilot's privacy and security policies

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Feedback

Found a bug or have a feature request? Please open an issue on GitHub.

---

**Enjoy better prompts and better AI responses!** Ì∫Ä
