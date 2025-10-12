# Context Settings Guide

## Overview

The Prompt Improver extension provides granular control over what context is included when improving prompts. Each setting is designed to give you flexibility while maintaining performance and relevance.

---

## 🎯 Context Settings Reference

### ✅ Include Workspace Metadata (Default: ON)

**What it does:**
- Detects programming languages in your workspace
- Identifies frameworks and technologies from config files
- Lists currently open file names

**When to use:**
- ✅ Almost always - provides high value with minimal cost
- ✅ Working on any project with a specific tech stack
- ✅ Want improved prompts to mention your actual frameworks

**When to disable:**
- ❌ Rarely needed - this is very lightweight

**Performance impact:** ⚡ Minimal (fast scan)

**Example output:**
- Detects: TypeScript, React, Tailwind CSS
- Improved prompt mentions: "Create a React component using TypeScript with Tailwind CSS classes"

---

### 💬 Include Conversation History (Default: ON)

**What it does:**
- Analyzes previous messages in current chat session
- Creates intelligent summary of what you've been working on
- Identifies key tasks, decisions, and progress

**When to use:**
- ✅ Multi-turn conversations where context builds up
- ✅ Continuing work on a feature over several exchanges
- ✅ Need improved prompt aware of previous decisions

**When to disable:**
- ❌ Starting completely new topic unrelated to previous chat
- ❌ Testing prompt improvements in isolation
- ❌ First message in a new chat session (nothing to summarize)

**Performance impact:** ⚡ Fast (intelligent summarization, 60-70% token savings)

**Example output:**
- Summary: "You've been implementing user authentication with JWT tokens, currently working on refresh token logic"
- Improved prompt: "Continue the authentication implementation by adding refresh token rotation..."

---

### 📄 Include Project Documentation (Default: ON)

**What it does:**
- Scans workspace for markdown files (README, CONTRIBUTING, docs/)
- Reads relevant project documentation
- Extracts coding guidelines, conventions, and standards

**When to use:**
- ✅ Working on established projects with documentation
- ✅ Need to follow specific project conventions
- ✅ Contributing to open source with contribution guidelines
- ✅ Want consistency with documented patterns

**When to disable:**
- ❌ No documentation exists yet
- ❌ Quick prototypes or experiments
- ❌ Personal projects without formal docs
- ❌ Performance is critical (reduces file I/O)

**Performance impact:** 🔄 Moderate (scans and reads markdown files)

**Example output:**
- Reads: README.md coding standards, CONTRIBUTING.md guidelines
- Improved prompt: "Follow the error handling pattern documented in CONTRIBUTING.md..."

---

### 📝 Include Open File Contents (Default: ON)

**What it does:**
- Creates intelligent synopsis of files in open editor tabs
- Extracts: imports, exports, classes, functions, types, interfaces
- Analyzes code structure and patterns

**When to use:**
- ✅ Working within existing codebase
- ✅ Have relevant files already open
- ✅ Want to reference specific classes/functions in improved prompts
- ✅ Need consistency with existing code patterns
- ✅ Modifying or extending current code

**When to disable:**
- ❌ Opening many large files (performance impact)
- ❌ Working on isolated new features
- ❌ Open files aren't relevant to current task
- ❌ Only config files are open

**Performance impact:** 🔄 Moderate (analyzes multiple files)

**Value:** 🌟 Very high for code consistency

**Example output:**
- Detects: `UserService` class with methods `createUser`, `validateEmail`
- Improved prompt: "Add a `updateUser` method to the UserService class following the same pattern as `createUser`..."

---

### 🔀 Include Git Context (Default: ON)

**What it does:**
- Runs Git commands (10-second timeout)
- Gathers: current branch, working changes, recent commits, staged changes
- Understands current development activity

**When to use:**
- ✅ Working in Git repositories
- ✅ Active development on feature branches
- ✅ Need context about what's currently being worked on
- ✅ Want improved prompts aware of recent changes

**When to disable:**
- ❌ Not using Git version control
- ❌ Working on non-version-controlled experiments
- ❌ Git repository is very large (performance)
- ❌ On slow network drives

**Performance impact:** ⚡ Small (Git commands with timeout protection)

**Safety:** ✅ Fails gracefully if not a Git repo

**Example output:**
- Branch: `feature/user-auth`
- Recent commits: "Add JWT token generation", "Implement login endpoint"
- Improved prompt: "Continue the user authentication feature by adding password reset..."

---

## 🧪 Experimental Settings

### ⚠️ Use Workspace Tools (Default: OFF)

**What it does:**
- Passes VS Code's built-in workspace tools to the Language Model
- Allows LLM to use file search, symbol lookup, etc.

**When to use:**
- ❌ Generally not recommended
- ✅ Only if on VS Code Insiders with the bug fix
- ✅ Advanced users who need LLM tool access

**When to disable:**
- ✅ Recommended for most users
- ✅ On stable VS Code (has known bug)
- ✅ Want reliable experience

**Performance impact:** ⚠️ May cause errors

**Known issue:** 
- Triggers "No lowest priority node found" error in VS Code (this is a VS Code bug, not an extension issue)
- Fixed in VS Code Insiders

**Recommendation:** Leave disabled and use extension's built-in context gathering instead

---

### 🔧 Filter Workspace Tools (Default: ON)

**What it does:**
- Reduces number of tools passed to Language Model
- Workaround for VS Code's tool system bug

**When to use:**
- ✅ If you enable "Use Workspace Tools" above
- ✅ Experiencing "No lowest priority node found" errors

**When to disable:**
- ❌ Never - keep enabled if using workspace tools

**Performance impact:** ⚡ Minimal (just filters a list)

**Note:** This is a workaround for a VS Code bug (too many tools crash the priority system)

---

## 💡 Recommended Configurations

### 🚀 Default (Recommended for Most Users)

```json
{
  "promptImprover.includeWorkspaceMetadata": true,
  "promptImprover.includeConversationHistory": true,
  "promptImprover.includeMarkdownFiles": true,
  "promptImprover.includeOpenFileContents": true,
  "promptImprover.includeGitContext": true,
  "promptImprover.useWorkspaceTools": false,
  "promptImprover.filterWorkspaceTools": true
}
```

**Best for:** Most coding tasks, provides rich context with good performance

---

### ⚡ Performance Mode (Fast Iterations)

```json
{
  "promptImprover.includeWorkspaceMetadata": true,
  "promptImprover.includeConversationHistory": false,
  "promptImprover.includeMarkdownFiles": false,
  "promptImprover.includeOpenFileContents": false,
  "promptImprover.includeGitContext": false,
  "promptImprover.useWorkspaceTools": false
}
```

**Best for:** Quick prompt improvements, minimal context needed, fastest response

---

### 🎯 Minimal (New/Isolated Tasks)

```json
{
  "promptImprover.includeWorkspaceMetadata": true,
  "promptImprover.includeConversationHistory": false,
  "promptImprover.includeMarkdownFiles": false,
  "promptImprover.includeOpenFileContents": false,
  "promptImprover.includeGitContext": false,
  "promptImprover.useWorkspaceTools": false
}
```

**Best for:** Starting fresh topics, prototypes, when context isn't relevant

---

### 🔬 Maximum Context (Complex Projects)

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

**Best for:** Complex projects, need maximum context awareness, established codebases

*Note: This is the same as default - we already gather all useful context by default!*

---

## 🔍 How to Change Settings

### Via Settings UI
1. Open Settings (Ctrl+, or Cmd+,)
2. Search for "Prompt Improver"
3. Toggle each context option as needed

### Via settings.json
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Preferences: Open User Settings (JSON)"
3. Add/modify settings:
```json
{
  "promptImprover.includeWorkspaceMetadata": true,
  "promptImprover.includeConversationHistory": true,
  // ... etc
}
```

---

## 📊 Performance Impact Summary

| Setting | Impact | Speed | Value |
|---------|--------|-------|-------|
| Workspace Metadata | Minimal | ⚡ Very Fast | 🌟 High |
| Conversation History | Small | ⚡ Fast | 🌟 Very High |
| Markdown Files | Moderate | 🔄 Medium | ⭐ Medium |
| Open File Contents | Moderate | 🔄 Medium | 🌟 Very High |
| Git Context | Small | ⚡ Fast | ⭐ Medium-High |
| Workspace Tools | Variable | ⚠️ May Error | ❌ Not Recommended |

---

## ❓ FAQ

**Q: Why are most settings enabled by default?**  
A: The extension is designed to gather rich context efficiently. Most settings have minimal performance impact while providing significant value.

**Q: Can I disable all context for simple prompts?**  
A: Yes! Use Performance Mode or disable all except Workspace Metadata. The extension will still improve prompts, just without project-specific context.

**Q: What happens if I disable everything?**  
A: The extension will still work, but improved prompts will be more generic without project-specific references.

**Q: Why is Workspace Tools disabled by default?**  
A: There's a known bug in VS Code (not the extension) that causes crashes when too many tools are passed to the Language Model. The extension's built-in context gathering is more reliable.

**Q: Will disabling settings make it faster?**  
A: Yes, but the impact is usually small. The biggest gains come from disabling Markdown Files and Open File Contents on large projects.

**Q: Can I toggle settings per-project?**  
A: Yes! Settings can be configured at User (global) or Workspace (per-project) level.

---

## 🎯 Quick Decision Guide

**Choose ENABLED if:**
- ✅ Working on established projects
- ✅ Need context-aware improvements
- ✅ Want consistency with existing code
- ✅ Building on previous conversation

**Choose DISABLED if:**
- ❌ Starting brand new topics
- ❌ Performance is critical
- ❌ Context isn't relevant to task
- ❌ Working on isolated prototypes

**Remember:** You can always change settings later! Start with defaults and adjust based on your workflow.
