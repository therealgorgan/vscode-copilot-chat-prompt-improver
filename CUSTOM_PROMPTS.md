# Custom Prompt Instructions

## How Custom Instructions Work

The extension provides two ways to customize the prompt improvement behavior:

### 1. **Enhance a Preset** (Recommended for most users)

Add your own requirements on top of the built-in presets.

**How it works:**
1. Select a preset (General, Context-aware, or Concise)
2. Add your custom instructions in the **Additional Custom Instructions** field
3. Your custom instructions are **appended** to the preset

**Example:**
- **Preset Selected:** Context-aware
- **Custom Instructions:** "Always include error handling examples and prefer async/await over promises."
- **Result:** The AI will use the Context-aware preset instructions PLUS your custom requirements

**When to use this:**
- You like a preset but want to add specific requirements
- You want consistency across projects with your coding standards
- You want to enhance context-awareness with your team's conventions

---

### 2. **Full Custom Mode** (Advanced users)

Replace all preset instructions with your own.

**How it works:**
1. Set **System Prompt Preset** to "Custom"
2. Write your complete instructions in **Additional Custom Instructions**
3. **Only** your custom instructions are used (presets are ignored)

**Example:**
- **Preset Selected:** Custom
- **Custom Instructions:** "You are a senior Python developer. Improve prompts by adding type hints, docstrings, and pytest examples."
- **Result:** The AI uses ONLY your instructions, no preset is included

**When to use this:**
- You have specific prompt improvement methodology
- You want complete control over the improvement process
- Presets don't match your workflow

---

## Settings Explained

### System Prompt Preset
Choose the base improvement style:
- **General** - Balanced approach for any task
- **Context-aware** - Uses workspace context (languages, frameworks, files)
- **Concise** - Quick, minimal improvements
- **Custom** - Use only your custom instructions

### Current Active System Prompt (Read-only)
Shows what the AI is currently using as the base prompt. Updates automatically when you change presets.

### Additional Custom Instructions
Your own requirements that are:
- **Appended to presets** when using General, Context-aware, or Concise
- **Used exclusively** when using Custom preset

---

## Examples

### Example 1: Enhance Context-Aware Preset

**Settings:**
```json
{
  "promptImprover.systemPromptPreset": "context-aware",
  "promptImprover.customSystemPrompt": "Always mention security best practices and include input validation."
}
```

**Result:**
The AI uses the full Context-aware preset instructions PLUS your security and validation requirements.

---

### Example 2: Team Coding Standards

**Settings:**
```json
{
  "promptImprover.systemPromptPreset": "general",
  "promptImprover.customSystemPrompt": "Follow our team standards:\n- Use TypeScript strict mode\n- Include JSDoc comments\n- Prefer functional programming patterns\n- Add unit test examples"
}
```

**Result:**
General preset instructions + your team's specific standards.

---

### Example 3: Full Custom for Specialized Use

**Settings:**
```json
{
  "promptImprover.systemPromptPreset": "custom",
  "promptImprover.customSystemPrompt": "You are a prompt engineer for data science tasks. Improve prompts by:\n1. Adding specific data format requirements\n2. Including example input/output\n3. Specifying visualization libraries to use\n4. Mentioning performance considerations for large datasets\n\nReturn only the improved prompt."
}
```

**Result:**
Only your data science-specific instructions are used.

---

## Available Placeholders

You can use these placeholders in your custom instructions:

- `{userPrompt}` - The user's original prompt
- `{languages}` - Programming languages detected in workspace
- `{technologies}` - Frameworks/libraries detected
- `{openFiles}` - Currently open files

**Example with placeholders:**
```
When improving prompts for {languages} projects, ensure the improved prompt:
- References the current tech stack: {technologies}
- Considers the context of open files: {openFiles}
- Maintains consistency with existing code patterns
```

---

## Tips

✅ **Start with a preset** - Most users should enhance a preset rather than going full custom

✅ **Keep it focused** - Custom instructions work best when they're specific and actionable

✅ **Test iteratively** - Try your custom instructions and refine based on results

✅ **Share with team** - Export your settings to share custom instructions with teammates

✅ **Update regularly** - Adjust custom instructions as your project evolves

---

## Common Use Cases

### For Individual Developers
- Add personal coding preferences
- Include preferred libraries/patterns
- Enforce documentation standards

### For Teams
- Enforce team coding standards
- Include company-specific requirements
- Add compliance/security guidelines

### For Educators
- Require student-friendly explanations
- Include learning objectives
- Mandate step-by-step breakdowns

### For Open Source
- Include contribution guidelines
- Require issue/PR templates
- Enforce code of conduct considerations
