# Settings Guide

## How to Customize Your Prompt Improvement Experience

### Quick Start: Using Presets

1. Open Settings (Ctrl+, or Cmd+,)
2. Search for "Prompt Improver"
3. Select a preset from **System Prompt Preset** dropdown:
   - **Context-Aware** (Default) - Best for project-specific tasks
   - **General** - Balanced approach for any task
   - **Concise** - Quick improvements
   - **Custom** - Create your own

### Viewing & Editing the System Prompt

The **System Prompt** setting shows you the actual instructions used to improve prompts.

**What you see:**
- When a preset is selected, this field displays that preset's content
- When "Custom" is selected, this field shows your custom prompt

**How to edit:**
1. Click on the **System Prompt** text area
2. Make your changes
3. The preset will automatically switch to "Custom"
4. Your changes are saved automatically

### Creating a Custom Prompt

There are two ways to create a custom system prompt:

#### Method 1: Edit a Preset (Recommended)
1. Select any preset (e.g., "Context-Aware")
2. Edit the **System Prompt** field
3. The system automatically switches to "Custom" and saves your changes

#### Method 2: Start from Scratch
1. Set **System Prompt Preset** to "Custom"
2. Edit the **System Prompt** field
3. Your changes are saved automatically

### Available Placeholders

When creating a custom prompt, you can use these placeholders:

- `{userPrompt}` - The user's original prompt
- `{languages}` - Detected programming languages in workspace
- `{technologies}` - Detected frameworks/technologies
- `{openFiles}` - Currently open files

**Example:**
```
Improve this prompt for a {languages} developer working with {technologies}.

Original: {userPrompt}

Make it more specific and actionable.
```

### Model Selection

#### Choosing a Model Vendor

**Model Vendor** setting:
- `copilot` (Default) - Use GitHub Copilot models
- `auto` - Use any available model provider

#### Choosing a Specific Model

**Model Family** setting:
- Leave empty for the default model
- Enter a model name like `gpt-4o`, `gpt-4o-mini`, `claude-3.5-sonnet`, etc.
- Available models depend on your Copilot subscription

**To see what models are available:**
1. Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Run: "Prompt Improver: List Available Copilot Models"
3. This shows all models you can use

### Settings Structure

```json
{
  // Choose your improvement style
  "promptImprover.systemPromptPreset": "context-aware",
  
  // View/edit the active system prompt (auto-updated)
  "promptImprover.systemPrompt": "You are an expert...",
  
  // Model configuration
  "promptImprover.modelVendor": "copilot",
  "promptImprover.modelFamily": "gpt-4o",
  
  // Internal storage (don't edit directly)
  "promptImprover.customSystemPrompt": "Your custom prompt..."
}
```

### Tips

✅ **Start with a preset** - Use Context-Aware or General, then customize if needed

✅ **Edit directly** - Don't worry about switching to "Custom" manually - it happens automatically

✅ **Use placeholders** - They make your prompt dynamic and context-aware

✅ **Check available models** - Run the "List Available Copilot Models" command to see your options

✅ **Test different models** - Some models are faster (gpt-4o-mini), others more capable (gpt-4o)

### Troubleshooting

**Q: My custom prompt isn't being used**
- Check that **System Prompt Preset** is set to "custom"
- Verify the **System Prompt** field contains your custom text

**Q: The System Prompt field keeps changing back**
- This is normal when switching presets
- The field always shows the active preset's content
- When you edit it, the preset switches to "custom" and locks your changes

**Q: I don't see certain models in the list**
- Available models depend on your Copilot subscription
- Run "List Available Copilot Models" to see what you have access to
- Leave **Model Family** empty to use the default

**Q: I want to go back to a preset after customizing**
- Simply select a different preset from the **System Prompt Preset** dropdown
- Your custom prompt is preserved in case you want to return to it later
