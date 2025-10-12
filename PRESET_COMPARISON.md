# Preset Comparison Guide

## Overview

All three presets receive the **same rich context** automatically:

- Programming languages detected in workspace
- Frameworks and technologies in use
- Currently open files with intelligent code synopsis
- Git context (branch, status, recent commits, staged changes)
- Conversation history from the current chat session
- Relevant project documentation (markdown files)
- User-provided references (#file, @workspace, etc.)

The difference is in **how each preset uses this context** to improve your prompt.

---

## Quick Comparison Table

| Aspect | Concise | Balanced | Detailed |
|--------|---------|----------|----------|
| **Speed** | Fastest | Fast | Moderate |
| **Token Usage** | Lowest | Medium | Highest |
| **Elaboration Level** | Minimal | Moderate | Extensive |
| **Best For** | Simple prompts, quick iterations | Most coding tasks | Complex/production tasks |
| **Output Length** | Brief, focused | Well-structured, practical | Comprehensive, exhaustive |
| **Edge Cases** | Critical only | Common scenarios | All scenarios |
| **Documentation** | Minimal | Standard | Comprehensive |
| **Testing Guidance** | Basic | Practical | Extensive |

---

## Detailed Breakdown

### 🚀 Concise Preset

**Philosophy:** Get to the point fast with minimal words.

**What it does:**

- Clarifies the core requirement in the fewest words
- Adds only critical technical details (essential types, parameters)
- Specifies output format briefly
- Removes ambiguity with specific technical language
- Uses context to make specific references without lengthy explanations

**What it doesn't do:**

- Elaborate on edge cases
- Provide extensive examples
- Add comprehensive documentation requirements
- List all possible constraints

**Example transformation:**

```
Original: "add error handling to the login function"

Concise Output:
"Add try-catch error handling to the login() function in auth.ts. 
Catch network errors and invalid credentials. 
Return error messages to the UI."
```

**Use when:**

- The prompt is already mostly clear
- You want fast iterations
- Token usage is a concern
- The task is straightforward

---

### ⚖️ Balanced Preset (Recommended Default)

**Philosophy:** Practical improvements with good detail but no over-engineering.

**What it does:**

- Clarifies requirements with specific, unambiguous language
- Adds practical technical details (types, APIs, patterns, constraints)
- Covers common edge cases and validation needs
- Structures requirements logically with sections/bullets
- Defines output expectations (code structure, documentation level)
- References specific files, classes, functions from workspace context
- Aligns with existing code patterns and conventions
- Considers current development activity (Git context)

**What it doesn't do:**

- Exhaustively list every possible edge case
- Provide multiple alternative approaches
- Add extensive testing requirements
- Over-specify implementation details

**Example transformation:**

```
Original: "add error handling to the login function"

Balanced Output:
"Add comprehensive error handling to the login() function in src/auth/auth.ts.

Requirements:
- Wrap the authentication API call in try-catch
- Handle specific error types:
  * Network errors (timeout, connection failed)
  * Invalid credentials (401 response)
  * Server errors (500+ responses)
- Return user-friendly error messages to the LoginForm component
- Log errors to the console for debugging

Use the existing ErrorMessage component from src/components/ErrorMessage.tsx.
Follow the error handling pattern used in src/auth/register.ts."
```

**Use when:**

- Most coding tasks (recommended default)
- You want clear, actionable prompts
- You need good detail without excessive length
- You want to leverage workspace context effectively

---

### 🔬 Detailed Preset

**Philosophy:** Leave no stone unturned - comprehensive, production-ready guidance.

**What it does:**

- Transforms general concepts into precise technical requirements
- Leverages ALL available context extensively:
  - References specific files, classes, functions from open files
  - Aligns with existing architectural patterns
  - Considers Git context (what's being worked on)
  - Uses conversation history for broader task understanding
  - Incorporates project documentation
- Specifies exact APIs, methods, interfaces, type definitions
- Defines comprehensive constraints:
  - Security (auth, validation, XSS/CSRF protection)
  - Performance (complexity, optimization, caching)
  - Compatibility (browsers, versions, frameworks)
  - Error handling (patterns, types, logging)
  - Testing (unit, integration, edge cases, test data)
  - Accessibility (ARIA, keyboard, screen readers)
- Structures into clear sections (Overview, Requirements, Constraints, Implementation, Testing, Documentation)
- Specifies detailed output expectations (files, classes, functions, documentation, examples)
- Lists potential edge cases and error scenarios
- Considers internationalization, localization, timezone issues

**What it doesn't do:**

- Skip any aspect of implementation
- Leave room for ambiguity
- Assume anything is obvious

**Example transformation:**

```
Original: "add error handling to the login function"

Detailed Output:
"Add comprehensive, production-ready error handling to the login() function in src/auth/auth.ts.

## Requirements

### Core Functionality
1. Wrap the authenticateUser() API call (line 45) in a try-catch block
2. Implement typed error handling using the ErrorType enum from src/types/errors.ts
3. Return structured error objects matching the AuthError interface

### Error Categories to Handle
1. **Network Errors**:
   - Connection timeout (> 30 seconds)
   - Network unavailable
   - DNS resolution failure
   - Use the isNetworkError() utility from src/utils/network.ts

2. **Authentication Errors**:
   - Invalid credentials (401 response)
   - Account locked (403 with 'account_locked' code)
   - Email not verified (403 with 'email_unverified' code)
   - Parse the error.response.data.code field

3. **Server Errors**:
   - 500+ status codes
   - Malformed responses
   - Missing required fields in response

4. **Client Errors**:
   - Invalid email format (validate before API call)
   - Empty password field
   - Use the validateLoginForm() function from src/utils/validation.ts

## Implementation Details

### Error Handling Pattern
Follow the error handling pattern established in src/auth/register.ts (lines 67-95):
- Use try-catch-finally structure
- Set loading state in finally block
- Return typed error objects

### Error Response Structure
```typescript
interface AuthError {
  type: ErrorType;
  message: string;
  code?: string;
  retryable: boolean;
}
```

### User Feedback

- Display errors using the ErrorMessage component from src/components/ErrorMessage.tsx
- Pass the error.message to the component's 'text' prop
- Use error.type to determine the icon (see ErrorMessage documentation)
- For retryable errors, show the retry button (retryable={true})

### Logging

- Log all errors to console.error with context: `console.error('[Login]', error)`
- For production, send errors to the logging service using logError() from src/services/logger.ts
- Include user ID (if available) and timestamp
- Redact sensitive information (passwords, tokens)

## Constraints

### Security

- Never log passwords or tokens
- Sanitize error messages before displaying to users (no stack traces)
- Rate limit login attempts (use the RateLimiter from src/utils/rateLimiter.ts)

### Performance

- Set a 30-second timeout for the API call
- Implement exponential backoff for retryable errors (use the retry() utility)
- Cache the last error to prevent duplicate error displays

### Accessibility

- Ensure error messages are announced to screen readers (use aria-live="polite")
- Focus the error message element when it appears
- Provide keyboard-accessible retry button

## Testing Requirements

### Unit Tests (add to src/auth/**tests**/auth.test.ts)

1. Test each error type is caught and handled correctly
2. Test error message formatting
3. Test logging is called with correct parameters
4. Mock the authenticateUser() API call

### Integration Tests

1. Test the full login flow with network errors
2. Test UI updates when errors occur
3. Test retry functionality

### Edge Cases to Test

- Simultaneous login attempts
- Network disconnection during API call
- Malformed API responses
- Very long error messages (truncation)

## Expected Output

### Code Structure

- Modify the existing login() function (don't create a new one)
- Add a new handleLoginError() helper function
- Update the LoginForm component to display errors

### Documentation

- Add JSDoc comments to the login() function explaining error handling
- Update the README.md section on authentication error handling
- Add inline comments for complex error parsing logic

### Example Usage

Include a usage example in the JSDoc showing how to call login() and handle the returned error.

## Current Context

- Branch: feature/auth-improvements (suggests this is part of auth work)
- Recent commit: "Add rate limiting to registration" (follow similar pattern)
- Open files show ErrorMessage component is already imported in LoginForm.tsx"

```

**Use when:**
- Complex, production-critical tasks
- You need exhaustive coverage of all scenarios
- You want to ensure nothing is overlooked
- You're working on security-sensitive or high-stakes features
- You need comprehensive testing and documentation guidance

---

## Context Inclusion Settings

All presets respect your context inclusion settings. You can enable/disable:
- ✅ Workspace Metadata (languages, technologies, open files)
- ✅ Conversation History (previous chat messages)
- ✅ Markdown Files (project documentation)
- ✅ Open File Contents (intelligent code synopsis)
- ✅ Git Context (branch, status, commits, staged changes)

Configure these in Settings > Prompt Improver > Context Inclusion.

---

## Recommendations

### Start with Balanced
For most tasks, the **Balanced** preset provides the best trade-off between detail and efficiency.

### Use Concise for:
- Quick clarifications
- Simple, straightforward tasks
- Rapid iteration cycles
- When you're already familiar with the codebase

### Use Detailed for:
- New features with complex requirements
- Security-critical implementations
- Production deployments
- When you need comprehensive test coverage
- When working in unfamiliar parts of the codebase
- When you want to ensure best practices are followed

### Switch Between Presets
You can use slash commands to override the preset for a single prompt:
- `@prompt-improver /concise your prompt here`
- `@prompt-improver /balanced your prompt here`
- `@prompt-improver /detailed your prompt here`

---

## Custom Preset

Want complete control? Set the preset to "Custom" and edit the System Prompt field to create your own improvement methodology.

See [CUSTOM_PROMPTS.md](./CUSTOM_PROMPTS.md) for details.

