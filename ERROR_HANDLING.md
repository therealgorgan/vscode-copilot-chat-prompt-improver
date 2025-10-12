# Error Handling Guide

## Overview

The Prompt Improver extension implements comprehensive error handling to ensure a smooth user experience even when things go wrong. This document describes the error handling strategies and how they protect against common failure scenarios.

---

## Error Handling Strategies

### 1. **Stream Closure Protection**

**Problem:** Users can cancel operations mid-stream by navigating away or stopping the chat, causing "Response stream has been closed" errors.

**Solution:**
- All stream writes use `safeStreamWrite()` which checks if the stream is still open before writing
- Returns `false` if stream is closed, allowing graceful exit
- Logs warnings instead of throwing errors

**Example:**
```typescript
if (!safeStreamWrite(stream, 'Processing...')) {
    return; // Stream closed, exit gracefully
}
```

---

### 2. **Cancellation Token Checks**

**Problem:** Long-running operations should respect user cancellation requests.

**Solution:**
- Check `isCancelled(token)` before and after each async operation
- Exit gracefully when cancellation is detected
- Log cancellation events for debugging

**Example:**
```typescript
if (isCancelled(token)) {
    console.log('[Prompt Improver] Operation cancelled by user');
    return;
}
```

**Cancellation points:**
- Before gathering workspace context
- After each context gathering step (workspace, markdown, files, Git)
- Before sending model request
- During response streaming

---

### 3. **Git Command Timeouts**

**Problem:** Git commands can hang indefinitely in certain scenarios (network drives, large repos, corrupted repos).

**Solution:**
- 10-second timeout on all Git commands
- Graceful degradation - continues without Git context if commands fail
- Returns `null` on timeout or error

**Example:**
```typescript
try {
    gitContext = await gatherGitContext();
} catch (gitError) {
    console.warn('[Prompt Improver] Could not gather Git context:', gitError);
    // Continue without Git context
}
```

---

### 4. **File System Error Handling**

**Problem:** File operations can fail due to permissions, missing files, or corrupted data.

**Solution:**
- Try-catch blocks around all file operations
- Skip individual files that fail to process
- Continue with partial results rather than failing completely

**Protected operations:**
- Reading markdown files
- Scanning workspace files
- Accessing open editor contents
- Detecting technologies from config files

---

### 5. **Language Model Errors**

**Problem:** LLM requests can fail for various reasons (rate limits, permissions, network issues).

**Solution:**
- Specific error messages for each error type:
  - `notFound` - Model not available
  - `blocked` - Content policy violation
  - `noPermissions` - Subscription issue
  - `rateLimited` - Too many requests
- User-friendly error messages with actionable guidance
- Fallback to generic error message for unknown errors

**Example error messages:**
```
⚠️ No language model found. Please ensure GitHub Copilot is installed and active.

⚠️ Rate limited. Too many requests. Please wait a moment and try again.

⚠️ Request blocked. The prompt might contain sensitive content. Try rephrasing your request.
```

---

### 6. **Graceful Degradation**

**Philosophy:** Partial functionality is better than complete failure.

**Implementation:**
- Context gathering failures don't stop the main operation
- Git errors → Continue without Git context
- Markdown scanning errors → Continue without documentation context
- File analysis errors → Skip problematic files, process others
- Technology detection errors → Continue with empty technology list

---

## Error Categories

### Critical Errors (Stop Operation)
- No language model available
- Stream closed before operation starts
- User cancellation before model request

### Non-Critical Errors (Continue with Degradation)
- Git command failures
- Individual file read errors
- Technology detection failures
- Markdown file scanning errors
- Open file content extraction errors

---

## Logging Strategy

All errors are logged with the `[Prompt Improver]` prefix for easy filtering:

```typescript
console.log('[Prompt Improver] Operation cancelled by user');
console.warn('[Prompt Improver] Could not gather Git context:', error);
console.error('[Prompt Improver] Error gathering workspace context:', error);
```

**Log Levels:**
- `console.log` - Normal operations, cancellations
- `console.warn` - Non-critical errors, degraded functionality
- `console.error` - Critical errors, unexpected failures

---

## User-Facing Error Messages

All error messages follow this format:

```
⚠️ **Error Type.** Brief explanation. Actionable guidance.
```

**Examples:**

✅ **Good:**
```
⚠️ **No language model found.** Please ensure GitHub Copilot is installed and active.
```

❌ **Bad:**
```
Error: Model not found
```

---

## Testing Error Scenarios

### How to Test Stream Closure
1. Start a prompt improvement operation
2. Immediately navigate away or close the chat panel
3. Check console for: `[Prompt Improver] Stream closed during response streaming`
4. Verify no error is thrown to the user

### How to Test Cancellation
1. Start a prompt improvement operation
2. Click the stop button in VS Code
3. Check console for: `[Prompt Improver] Operation cancelled by user`
4. Verify operation stops gracefully

### How to Test Git Errors
1. Open a non-Git workspace
2. Run prompt improvement
3. Verify it continues without Git context
4. Check console for: `[Prompt Improver] Git command failed`

### How to Test File Errors
1. Open a file with restricted permissions
2. Run prompt improvement
3. Verify it skips the problematic file
4. Check console for: `[Prompt Improver] Error processing open file`

---

## Common Error Scenarios

### Scenario 1: User Cancels Mid-Stream
**What happens:**
- Cancellation token is checked during streaming
- Stream write returns `false`
- Operation exits gracefully
- Message: `*[Operation cancelled]*`

### Scenario 2: Git Repository Issues
**What happens:**
- Git command times out after 10 seconds
- Returns `null` for Git context
- Operation continues without Git information
- No user-facing error (silent degradation)

### Scenario 3: No Copilot Subscription
**What happens:**
- Model selection returns empty array
- User sees: `⚠️ No language model available. Please ensure GitHub Copilot is installed and authenticated`
- Operation stops (can't proceed without model)

### Scenario 4: Rate Limited
**What happens:**
- LLM returns `rateLimited` error
- User sees: `⚠️ Rate limited. Too many requests. Please wait a moment and try again.`
- User can retry after waiting

### Scenario 5: File Permission Denied
**What happens:**
- File read throws EACCES error
- File is skipped
- Other files are processed normally
- Console warning logged

---

## Best Practices for Contributors

When adding new features:

1. **Always use `safeStreamWrite()`** instead of direct `stream.markdown()`
2. **Check cancellation** before and after async operations
3. **Wrap file operations** in try-catch blocks
4. **Provide user-friendly error messages** with actionable guidance
5. **Log errors with context** using `[Prompt Improver]` prefix
6. **Prefer graceful degradation** over complete failure
7. **Test error scenarios** manually before committing

---

## Future Improvements

Potential enhancements to error handling:

- [ ] Retry logic for transient network errors
- [ ] Exponential backoff for rate limiting
- [ ] User notification for silent degradations (optional setting)
- [ ] Error telemetry (opt-in) to identify common issues
- [ ] Recovery suggestions based on error patterns
- [ ] Automatic fallback to smaller models on rate limits

---

## Related Files

- `src/extension.ts` - Main error handling implementation
- `package.json` - Extension configuration
- `CHANGELOG.md` - Error handling improvements history

