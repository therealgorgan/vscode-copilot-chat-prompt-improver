# Preset System Cleanup (v0.0.8)

## What Changed

### Fixed Preset Naming Confusion

**Old System (Confusing):**
- `general` - Basic improvements
- `context-aware` - Used workspace context
- `concise` - Minimal improvements  
- `custom` - User-defined

**Problems:**
1. "Context" was controlled by the preset, but also by separate settings
2. Users thought they had to use "context-aware" to get workspace context
3. The presets mixed two concepts: verbosity AND context inclusion

**New System (Clear):**
- `concise` - Minimal elaboration, focused improvements
- `balanced` - Good detail without over-engineering (default)
- `detailed` - Comprehensive, production-ready specifications

**Key Insight:** 
- **ALL presets receive the same context** (workspace, Git, conversation, files, etc.)
- Context inclusion is controlled by individual toggle settings
- **Presets differ ONLY in how much detail/verbosity they add**

### Removed Redundant Settings

**Removed:**
- `promptImprover.customSystemPrompt` - No longer needed
- `promptImprover.contextRichness` - Replaced with granular toggles

**Why:**
- Users can edit `systemPrompt` directly to create custom prompts
- No need for a separate "custom" field
- Context is now controlled by individual boolean toggles (clearer)

### Added Clear Descriptions

**package.json now shows:**
```
Choose the improvement style. All presets receive the same rich context 
(workspace, Git, conversation, files) - they differ in how much detail they add:

• Concise: Minimal elaboration, focused improvements (fastest)
• Balanced: Good detail without over-engineering (recommended)
• Detailed: Comprehensive, production-ready specifications (most thorough)

Note: Context inclusion is controlled by the settings below, not by the preset.
```

### Granular Context Control

Instead of one "contextRichness" setting, users now have individual toggles:
- ✅ `includeWorkspaceMetadata` - Languages, technologies, open files
- ✅ `includeConversationHistory` - Previous chat messages  
- ✅ `includeMarkdownFiles` - Project documentation
- ✅ `includeOpenFileContents` - Intelligent code synopsis
- ✅ `includeGitContext` - Branch, status, commits
- ⚠️ `useWorkspaceTools` - Experimental VS Code tools (disabled by default)
- ✅ `filterWorkspaceTools` - Filter to avoid VS Code bugs

## Migration Guide

### If you were using "context-aware"
→ Switch to `balanced` (it's the same but clearer)

### If you were using "general"  
→ Switch to `balanced` (they're equivalent now)

### If you were using "custom"
→ Just edit the `systemPrompt` field directly
→ Your changes will be preserved automatically

### If you had custom instructions in `customSystemPrompt`
→ Copy them into `systemPrompt` field
→ The old setting is ignored now

## Benefits

1. **Clearer naming** - Presets describe verbosity, not context
2. **Better control** - Toggle context types individually
3. **Less confusion** - No mixing of "what context" vs "how much detail"
4. **Simpler** - One less setting to manage
5. **More flexible** - Want detailed improvements but no Git context? Easy!

## Summary

The preset system now does ONE thing well: control verbosity/detail level.

Context inclusion is a separate concern, controlled by individual settings.

This separation makes the system much easier to understand and use.
