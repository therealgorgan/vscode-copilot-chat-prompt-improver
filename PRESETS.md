# System Prompt Presets

The extension now includes three built-in system prompt presets, plus the ability to create your own custom prompt.

## Available Presets

### 1. **General Improvement** (Balanced)
Best for: Any coding task where you want clear, well-structured prompts without workspace-specific context.

**Key Features:**
- Focuses on clarity and specificity
- Structures information logically
- Removes ambiguity
- Defines output expectations
- Lightweight and fast

**When to use:**
- Quick prompt improvements
- When workspace context isn't relevant
- Cross-project prompts
- General coding questions

---

### 2. **Context-Aware** (Default)
Best for: Project-specific tasks where workspace context (languages, frameworks, open files) adds value.

**Key Features:**
- Incorporates programming languages detected in workspace
- References frameworks and technologies in use
- Mentions relevant open files
- Adds project-specific constraints
- Suggests patterns consistent with your codebase

**When to use:**
- Working within a specific project
- Need consistency with existing code
- Complex multi-file changes
- Framework-specific implementations

**Placeholders used:**
- `{languages}` - Programming languages in workspace
- `{technologies}` - Detected frameworks/libraries
- `{openFiles}` - Currently open files

---

### 3. **Concise** (Minimal)
Best for: Quick improvements with minimal overhead and token usage.

**Key Features:**
- Ultra-lightweight prompt
- Fast processing
- Gets straight to the point
- Minimal instructions

**When to use:**
- Simple, straightforward prompts
- Want to minimize token usage
- Need quick iterations
- Prompts that are already mostly clear

---

### 4. **Custom**
Create your own system prompt with complete control over the improvement process.

**Available Placeholders:**
- `{userPrompt}` - The original prompt from the user
- `{languages}` - Detected programming languages
- `{technologies}` - Detected frameworks/technologies
- `{openFiles}` - Currently open files

**To use custom prompts:**
1. Set `promptImprover.systemPromptPreset` to `"custom"`
2. Edit `promptImprover.customSystemPrompt` with your prompt template
3. Use placeholders where you want dynamic content inserted

---

## How to Change Presets

### Via Settings UI:
1. Open Settings (Ctrl+, or Cmd+,)
2. Search for "Prompt Improver"
3. Select your preferred preset from `System Prompt Preset` dropdown

### Via settings.json:
```json
{
  "promptImprover.systemPromptPreset": "context-aware"
}
```

Options: `"general"`, `"context-aware"`, `"concise"`, `"custom"`

---

## Comparison

| Feature | General | Context-Aware | Concise | Custom |
|---------|---------|---------------|---------|--------|
| Token Usage | Medium | Higher | Lowest | Varies |
| Speed | Fast | Medium | Fastest | Varies |
| Workspace Context | ❌ | ✅ | ❌ | Optional |
| Customizable | ❌ | ❌ | ❌ | ✅ |
| Best for | Balanced | Project-specific | Quick tasks | Power users |

---

## Examples

### General Preset Output
**Original:** "add error handling"

**Improved:** "Implement comprehensive error handling for the user authentication flow. Add try-catch blocks around API calls, validate input parameters, and display user-friendly error messages. Include specific error types for network failures, validation errors, and server errors."

---

### Context-Aware Preset Output
**Original:** "add error handling"

**Workspace Context:** TypeScript, React, Express
**Open Files:** LoginForm.tsx, authService.ts

**Improved:** "Implement comprehensive error handling in the authentication flow (LoginForm.tsx and authService.ts). Add TypeScript typed try-catch blocks around the Express API calls, validate input parameters with proper type guards, and display user-friendly error messages using React error boundaries. Include specific error types for network failures, validation errors, and server errors consistent with the existing Express error handling middleware."

---

### Concise Preset Output
**Original:** "add error handling"

**Improved:** "Implement try-catch blocks around API calls with specific error types (network, validation, server) and user-friendly error messages. Validate input parameters."

---

## Migration from v0.0.3

The old `promptImprover.systemPrompt` setting is deprecated but still supported for backward compatibility. 

**To migrate:**
1. If you were using the default system prompt → Set preset to `"context-aware"` (or keep default)
2. If you customized the system prompt → Set preset to `"custom"` and copy your prompt to `promptImprover.customSystemPrompt`

The old setting will continue to work but won't receive updates.
