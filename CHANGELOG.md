# Change Log

All notable changes to the "prompt-improver" extension will be documented in this file.

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