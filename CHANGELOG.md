# Change Log

All notable changes to the "prompt-improver" extension will be documented in this file.

## [0.0.8] - 2025-10-12

### Added
- **Conversation Summary Feature**: Enhanced conversation context awareness
  - New `/summary` command to analyze and summarize conversation history
  - Automatic conversation summary integration when using `/improve` with conversation history
  - Smart summary generation that identifies:
    - What you've been working on
    - Current state (accomplished vs. pending)
    - Key decisions and constraints
    - Recent focus areas
    - Suggested next steps
  - Improved prompt awareness of recent work and progress
- **Enhanced Follow-up Suggestions**:
  - Added "Summarize conversation" follow-up after `/improve` command
  - Added context-aware follow-ups after `/summary` command
  - Better command flow for maintaining conversation context
- **Smart Model Selection**: Automatic model detection
  - Now uses the currently selected Copilot Chat model by default
  - Falls back to gpt-4o-mini (fastest, free with Copilot) if no model is selected
  - No need to configure a specific model unless you want to override
  - Falls back to user's chat model selection automatically

### Changed
- **Improved Conversation Context**: When `/improve` includes conversation history:
  - Now generates an intelligent summary instead of raw conversation dump
  - Includes most recent exchange for immediate context
  - Better token efficiency (summary + recent exchange vs. full history)
  - More contextually aware improved prompts
- **Model Configuration**: Changed default model behavior
  - Default `modelFamily` setting is now empty (uses current chat model)
  - Users can still specify a model family to always use a specific model
  - Better integration with Copilot Chat's model selector

### Documentation
- Updated README.md with `/summary` command documentation
- Added command to package.json chat participant commands list
- Enhanced documentation about conversation context integration
- Updated model selection documentation to reflect automatic detection

## [0.0.7] - 2025-10-12

### Added
- **Comprehensive Error Handling**: Robust error handling throughout the extension
  - Stream closure protection (prevents crashes when stopping mid-stream)
  - Cancellation support for all async operations
  - Git command timeouts (10 seconds)
  - Graceful degradation for non-critical errors
  - User-friendly error messages for all error types
  - Individual file processing errors (skip and continue)
- **Agent Handoff Feature**: `/handoff` and `/new-chat` commands
  - Creates context-preserving prompts for starting new chat sessions
  - Includes conversation history, workspace context, Git context
  - Perfect for long conversations that need to be split
- **Rich Context Gathering**: Automatic collection of comprehensive context
  - Workspace metadata (languages, technologies, open files)
  - Git context (branch, status, commits, staged changes)
  - Conversation history (last 10 exchanges)
  - Project documentation (markdown files)
  - Intelligent code synopsis from open files
- **Documentation Overhaul**: Complete reorganization of documentation
  - Comprehensive README.md with modern structure
  - Link tree for easy navigation
  - PRESET_COMPARISON.md with detailed preset comparison
  - ERROR_HANDLING.md with comprehensive error handling guide
  - DOCUMENTATION_AUDIT.md tracking all documentation changes

### Changed
- **Preset System Refactor**: Updated all three presets to work with automatic context gathering
  - Renamed presets: "Concise", "Balanced", "Detailed" (removed "General" and "Context-Aware")
  - All presets now receive the same rich context automatically
  - Presets differ in how they use context, not what context they request
  - Removed context-gathering instructions from preset prompts
- **Configuration Updates**: Streamlined settings
  - All context types enabled by default
  - Granular control over each context type
  - Removed redundant settings
- **Settings UI Improvements**: Better preset descriptions
  - Added clear bullet list explaining each preset mode
  - Clarified that all presets receive the same context
  - Removed confusing placeholder information

### Fixed
- **Stream Closure Crashes**: Extension no longer crashes when stopping chat mid-stream
- **Cancellation Handling**: Properly respects user cancellations at all async operations
- **Git Command Hangs**: Added 10-second timeout to prevent hanging on Git operations
- **File System Errors**: Graceful handling of permission errors and missing files

### Removed
- Outdated documentation files (PRESETS.md, SETTINGS_GUIDE.md, CUSTOM_PROMPTS.md, etc.)
- Redundant context gathering code (now uses automatic context system)

## [0.0.6] - 2025-10-12

### Fixed
- **Settings UI Layout**: Shortened description text in settings to prevent label overlap
  - Condensed "Model Family" description for better readability
  - Optimized "System Prompt" and "Additional Custom Instructions" descriptions
  - Improved visual spacing between setting fields

## [0.0.5] - 2025-10-12

### Added
- **Dynamic System Prompt Editing**: The "System Prompt" setting now displays the current preset's content and can be edited directly
- **Auto-Switch to Custom**: When you edit the system prompt, the preset automatically switches to "custom"
- **Model List Command**: New command "List Available Copilot Models" to see all models available in your environment
- **Improved Model Selection**: Removed hardcoded model list - now uses whatever models are available via Copilot
- **Settings Ordering**: System prompt settings now appear at the top for easier access

### Changed
- Reorganized settings for better user experience
- `promptImprover.customSystemPrompt` is now an internal setting (edit `systemPrompt` instead)
- Removed enum constraints on `modelFamily` to support all available models

## [0.0.4] - 2025-10-12

### Added
- **System Prompt Presets**: Choose between different improvement styles
  - General Improvement - Balanced approach without workspace context
  - Context-Aware (Default) - Leverages workspace languages, frameworks, and open files
  - Concise - Quick improvements with minimal overhead
  - Custom - Create your own system prompt with placeholders
- New settings:
  - `promptImprover.systemPromptPreset` - Select preset style
  - `promptImprover.customSystemPrompt` - Define custom improvement instructions
- Detailed preset documentation in PRESETS.md

### Changed
- Deprecated `promptImprover.systemPrompt` in favor of preset system (backward compatible)
- Improved token efficiency with lighter preset options

## [0.0.3] - 2025-10-12

### Added
- Configurable system prompt in extension settings
- Copy to clipboard functionality with metadata stripping
- Model selection settings (vendor and family)

### Changed
- Moved improvement instructions to settings for better customization
- Set `isSticky: false` to auto-clear @prompt-improver mention after use
- Inline output (removed code block wrapping)

## [0.0.2] - 2025-10-12

### Added
- GitHub Actions workflow for CI/CD
- Extension icon (PNG format for marketplace)

### Fixed
- Node.js version compatibility (requires >= 20)

## [0.0.1] - 2025-10-12

### Added
- Initial release
- @prompt-improver chat participant
- /improve command for prompt enhancement
- /analyze command for prompt analysis
- Workspace context gathering (languages, technologies, open files)
- GitHub Copilot Language Model API integration