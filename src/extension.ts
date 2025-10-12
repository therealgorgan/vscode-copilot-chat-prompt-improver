// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface PromptImproverResult extends vscode.ChatResult {
	metadata: {
		command: string;
	};
}

const PARTICIPANT_ID = 'prompt-improver.prompt-improver';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Prompt Improver extension is now active!');

	// Initialize the systemPrompt setting with the current preset value
	console.log('[Prompt Improver] Initializing systemPrompt display on activation...');
	updateSystemPromptDisplay().catch(err => {
		console.error('[Prompt Improver] Error during initialization:', err);
	});

	// Watch for configuration changes to update the systemPrompt field display
	const configWatcher = vscode.workspace.onDidChangeConfiguration(async e => {
		console.log('[Prompt Improver] Configuration changed, checking if it affects our settings...');

		if (e.affectsConfiguration('promptImprover.systemPromptPreset')) {
			console.log('[Prompt Improver] systemPromptPreset changed! Checking for confirmation...');

			const config = vscode.workspace.getConfiguration('promptImprover');
			const currentSystemPrompt = config.get<string>('systemPrompt', '');

			// Check if user has manually edited the systemPrompt field
			const presetPrompts = Object.values(SYSTEM_PROMPT_PRESETS);
			const isManuallyEdited = currentSystemPrompt && !presetPrompts.includes(currentSystemPrompt);

			if (isManuallyEdited) {
				// Ask for confirmation before overwriting
				const choice = await vscode.window.showWarningMessage(
					`Changing the preset will overwrite your current System Prompt. Any manual edits will be lost.`,
					{ modal: true },
					'Continue',
					'Cancel'
				);

				if (choice === 'Continue') {
					console.log('[Prompt Improver] User confirmed, updating display...');
					await updateSystemPromptDisplay();
				} else {
					console.log('[Prompt Improver] User cancelled preset change');
					// Note: We can't revert the preset change here as it's already been saved
					// The user will need to manually change it back if desired
				}
			} else {
				// No manual edits, just update
				console.log('[Prompt Improver] No manual edits detected, updating display...');
				await updateSystemPromptDisplay();
			}
		} else if (e.affectsConfiguration('promptImprover.customSystemPrompt')) {
			console.log('[Prompt Improver] customSystemPrompt changed!');
			const config = vscode.workspace.getConfiguration('promptImprover');
			const preset = config.get<string>('systemPromptPreset', 'context-aware');
			if (preset === 'custom') {
				console.log('[Prompt Improver] In custom mode, updating display...');
				await updateSystemPromptDisplay();
			}
		} else if (e.affectsConfiguration('promptImprover')) {
			console.log('[Prompt Improver] Some promptImprover config changed, but not preset or custom');
		}
	});

	// Register the copy command
	const stripImprovedPrompt = (text: string) => {
		if (!text) { return ''; }
		// Clean up any wrapper quotes, markdown formatting, or extra whitespace
		let cleaned = text.trim();
		// Remove surrounding quotes if present
		cleaned = cleaned.replace(/^["']|["']$/g, '');
		// Remove any "Improved Prompt:" headers that might slip through
		cleaned = cleaned.replace(/^.*Improved Prompt.*?:\s*/i, '');
		return cleaned.trim();
	};

	const copyCommand = vscode.commands.registerCommand('prompt-improver.copyImprovedPrompt', async (improvedPrompt: string) => {
		const onlyPrompt = stripImprovedPrompt(improvedPrompt);
		await vscode.env.clipboard.writeText(onlyPrompt);
		vscode.window.showInformationMessage('✅ Improved prompt copied to clipboard!');
	});

	// Create the chat participant
	const participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, handleChatRequest);
	
	// Set participant properties
	participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.svg');

	// Register follow-up provider
	participant.followupProvider = {
		provideFollowups(result: PromptImproverResult, context: vscode.ChatContext, token: vscode.CancellationToken) {
			if (result.metadata.command === 'improve') {
				return [
					{
						prompt: 'Analyze what makes this improved prompt effective',
						label: vscode.l10n.t('Analyze the improvements'),
						command: 'analyze'
					}
				];
			}
			return [];
		}
	};

	// Command to select model from available options
	const selectModelCommand = vscode.commands.registerCommand('prompt-improver.selectModel', async () => {
		try {
			// Show a progress notification while fetching models
			const models = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Please wait while we check what models are available...",
				cancellable: false
			}, async (progress) => {
				return await vscode.lm.selectChatModels({});
			});

			if (models.length === 0) {
				vscode.window.showWarningMessage('No language models available. Make sure GitHub Copilot is enabled.');
				return;
			}

			// Group by vendor and create quick pick items
			interface ModelQuickPickItem extends vscode.QuickPickItem {
				family: string;
			}

			const items: ModelQuickPickItem[] = [];
			
			// Add a default option
			items.push({
				label: '$(star) Default',
				description: 'Use the default model',
				family: ''
			});

			// Group models by vendor
			const modelsByVendor = models.reduce((acc, m) => {
				if (!acc[m.vendor]) {
					acc[m.vendor] = [];
				}
				acc[m.vendor].push(m);
				return acc;
			}, {} as Record<string, typeof models>);

			// Add models grouped by vendor
			for (const [vendor, vendorModels] of Object.entries(modelsByVendor)) {
				// Add separator
				items.push({
					label: vendor.toUpperCase(),
					kind: vscode.QuickPickItemKind.Separator,
					family: ''
				});

				// Add models for this vendor
				for (const model of vendorModels) {
					items.push({
						label: `$(symbol-misc) ${model.family}`,
						description: model.name,
						detail: `Vendor: ${vendor} | ID: ${model.id}`,
						family: model.family
					});
				}
			}

			const selected = await vscode.window.showQuickPick(items, {
				placeHolder: 'Select a model for prompt improvement',
				matchOnDescription: true,
				matchOnDetail: true
			});

			if (selected) {
				const config = vscode.workspace.getConfiguration('promptImprover');
				await config.update('modelFamily', selected.family, vscode.ConfigurationTarget.Global);
				
				const modelName = selected.family || 'default';
				vscode.window.showInformationMessage(`✅ Model set to: ${modelName}`);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to select model: ${error}`);
		}
	});

	// Command to list available models (for debugging/info)
	const listModelsCommand = vscode.commands.registerCommand('prompt-improver.listAvailableModels', async () => {
		try {
			// Show a progress notification while fetching models
			const models = await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Please wait while we check what models are available...",
				cancellable: false
			}, async (progress) => {
				return await vscode.lm.selectChatModels({});
			});

			if (models.length === 0) {
				vscode.window.showWarningMessage('No language models available. Make sure GitHub Copilot is enabled.');
				return;
			}

			// Group models by vendor
			const modelsByVendor = models.reduce((acc, m) => {
				if (!acc[m.vendor]) {
					acc[m.vendor] = [];
				}
				acc[m.vendor].push(m);
				return acc;
			}, {} as Record<string, typeof models>);

			// Format the output
			let output = '**Available Copilot Models**\n\n';
			output += 'Copy the **family** name to use in settings:\n\n';
			
			for (const [vendor, vendorModels] of Object.entries(modelsByVendor)) {
				output += `**${vendor}:**\n`;
				for (const model of vendorModels) {
					output += `  • \`${model.family}\` - ${model.name}\n`;
				}
				output += '\n';
			}

			output += '\n**How to use:**\n';
			output += '1. Copy a model family name (e.g., `gpt-4o`)\n';
			output += '2. Open Settings → Prompt Improver → Model Family\n';
			output += '3. Paste the family name';

			// Show in a better format
			const panel = vscode.window.createWebviewPanel(
				'availableModels',
				'Available Copilot Models',
				vscode.ViewColumn.One,
				{}
			);

			panel.webview.html = `
				<!DOCTYPE html>
				<html>
				<head>
					<style>
						body { 
							padding: 20px; 
							font-family: var(--vscode-font-family);
							color: var(--vscode-foreground);
						}
						h2 { color: var(--vscode-textLink-foreground); }
						code { 
							background: var(--vscode-textCodeBlock-background);
							padding: 2px 6px;
							border-radius: 3px;
							font-family: var(--vscode-editor-font-family);
						}
						.model-group { margin: 20px 0; }
						.model-item { margin: 8px 0; }
						.instructions { 
							background: var(--vscode-textBlockQuote-background);
							border-left: 4px solid var(--vscode-textLink-foreground);
							padding: 12px;
							margin-top: 20px;
						}
					</style>
				</head>
				<body>
					${output.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
						.replace(/`([^`]+)`/g, '<code>$1</code>')
						.replace(/\n/g, '<br>')}
				</body>
				</html>
			`;
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to list models: ${error}`);
		}
	});

	context.subscriptions.push(participant, copyCommand, configWatcher, selectModelCommand, listModelsCommand);
}

/**
 * Get the configured language model based on user settings
 */
async function getConfiguredModel(): Promise<vscode.LanguageModelChat | undefined> {
	const config = vscode.workspace.getConfiguration('promptImprover');
	const family = config.get<string>('modelFamily', 'gpt-4o');

	// Build selector options - always use copilot vendor
	const selector: { vendor: string; family?: string } = {
		vendor: 'copilot'
	};
	
	// Add family if specified
	if (family && family.trim() !== '') {
		selector.family = family;
	}

	// Select models
	const models = await vscode.lm.selectChatModels(selector);
	
	if (models.length === 0) {
		return undefined;
	}

	return models[0];
}

/**
 * Main chat request handler for the @prompt-improver participant
 */
async function handleChatRequest(
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken
): Promise<PromptImproverResult> {
	
	stream.progress('Analyzing your prompt...');

	try {
		// Determine which command to execute
		if (request.command === 'analyze') {
			await handleAnalyzeCommand(request, context, stream, token);
		} else if (request.command === 'improve-general') {
			await handleImproveCommand(request, context, stream, token, 'general');
		} else if (request.command === 'improve-context') {
			await handleImproveCommand(request, context, stream, token, 'context-aware');
		} else if (request.command === 'improve-concise') {
			await handleImproveCommand(request, context, stream, token, 'concise');
		} else if (request.command === 'improve-custom') {
			await handleImproveCommand(request, context, stream, token, 'custom');
		} else {
			// Default to improve command (uses configured preset)
			await handleImproveCommand(request, context, stream, token);
		}

		return {
			metadata: {
				command: request.command || 'improve'
			}
		};
	} catch (error) {
		handleError(error, stream);
		return {
			metadata: {
				command: request.command || 'improve'
			}
		};
	}
}

/**
 * Handle the /improve command - improves the user's prompt
 */
async function handleImproveCommand(
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken,
	overridePreset?: string
): Promise<void> {

	const userPrompt = request.prompt;

	if (!userPrompt || userPrompt.trim().length === 0) {
		stream.markdown('Please provide a prompt that you want me to improve.\n\n');
		stream.markdown('**Example usage:**\n');
		stream.markdown('```\n@prompt-improver /improve write a function\n```\n');
		stream.markdown('```\n@prompt-improver #file:app.ts improve this code\n```\n');
		return;
	}

	// Show which preset is being used if overridden
	if (overridePreset) {
		const presetNames: Record<string, string> = {
			'general': 'General',
			'context-aware': 'Context-aware',
			'concise': 'Concise',
			'custom': 'Custom'
		};
		const presetName = presetNames[overridePreset] || overridePreset;
		stream.markdown(`*Using ${presetName} preset for this prompt*\n\n`);
	}

	// Extract any references (like #file, @workspace, etc.)
	const references = request.references || [];

	// Extract conversation history
	const conversationHistory = extractConversationHistory(context);

	// Gather workspace context
	stream.progress('Gathering workspace context...');
	const workspaceContext = await gatherWorkspaceContext();

	// Build the prompt for the LLM
	const systemPrompt = buildImprovePrompt(userPrompt, workspaceContext, overridePreset, references, conversationHistory);

	// Get the configured language model
	const model = await getConfiguredModel();

	if (!model) {
		stream.markdown('⚠️ No language model available. Please ensure GitHub Copilot is installed and authenticated, or check your model settings.');
		return;
	}

	// Determine the active preset
	const config = vscode.workspace.getConfiguration('promptImprover');
	const activePreset = overridePreset || config.get<string>('systemPromptPreset', 'context-aware');
	const useWorkspaceContext = activePreset === 'context-aware';

	// Create messages for the LLM
	const messages = [
		vscode.LanguageModelChatMessage.User(systemPrompt)
	];

	stream.progress('Improving your prompt...');

	// Build request options - for context-aware preset, use workspace context internally
	const requestOptions: vscode.LanguageModelChatRequestOptions = {};

	if (useWorkspaceContext && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		stream.progress('Analyzing workspace for context...');

		// Use workspace context internally during the improvement process
		// This allows the LLM to access the codebase and make informed suggestions
		// but the output will NOT include @workspace - it will have explicit details instead
		requestOptions.justification = 'Analyzing workspace structure, files, and patterns to provide context-aware prompt improvements with specific technical details';
	}

	// Send request to language model
	const chatResponse = await model.sendRequest(messages, requestOptions, token);

	// Collect the improved prompt text
	let improvedPrompt = '';
	
	// Stream the response
	stream.markdown('## Improved Prompt\n\n');
	for await (const fragment of chatResponse.text) {
		improvedPrompt += fragment;
		stream.markdown(fragment);
	}

	stream.markdown('\n\n---\n\n');
	
	// Add a copy button - strip any remaining quotes or wrapper text
	const cleanPrompt = improvedPrompt.trim().replace(/^["']|["']$/g, '');
	stream.button({
		command: 'prompt-improver.copyImprovedPrompt',
		title: vscode.l10n.t('📋 Copy to Clipboard'),
		arguments: [cleanPrompt]
	});
	
	stream.markdown('\n\n💡 **Tip:** Click the button above to copy, or select the text and use Ctrl+C.\n');
}

/**
 * Handle the /analyze command - analyzes what makes a prompt effective
 */
async function handleAnalyzeCommand(
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken
): Promise<void> {
	
	const userPrompt = request.prompt;

	if (!userPrompt || userPrompt.trim().length === 0) {
		stream.markdown('Please provide a prompt that you want me to analyze.\n\n');
		stream.markdown('**Example usage:**\n');
		stream.markdown('```\n@prompt-improver /analyze create a REST API with error handling\n```\n');
		return;
	}

	// Build the analysis prompt
	const analysisPrompt = buildAnalysisPrompt(userPrompt);

	// Get the configured language model
	const model = await getConfiguredModel();

	if (!model) {
		stream.markdown('⚠️ No language model available. Please ensure GitHub Copilot is installed and authenticated, or check your model settings.');
		return;
	}

	const messages = [
		vscode.LanguageModelChatMessage.User(analysisPrompt)
	];

	stream.progress('Analyzing prompt effectiveness...');

	// Send request to language model
	const chatResponse = await model.sendRequest(messages, {}, token);

	// Stream the response
	stream.markdown('## Prompt Analysis\n\n');
	for await (const fragment of chatResponse.text) {
		stream.markdown(fragment);
	}
}

/**
 * System prompt presets
 */
const SYSTEM_PROMPT_PRESETS: { [key: string]: string } = {
	'general': `You are an expert at improving prompts for AI coding assistants.

Your goal is to transform vague or incomplete prompts into highly detailed, actionable requests that will produce superior AI-generated code.

Analyze the user's prompt and enhance it by:
1. **Increasing clarity and specificity**: Transform general concepts into concrete, technical requirements with specific implementation details
2. **Adding comprehensive technical context**: Include language versions, frameworks, libraries, coding patterns, and architectural considerations
3. **Defining explicit constraints and requirements**: Specify what should and should NOT be done, including error handling, validation, security, performance, and edge cases
4. **Structuring for clarity**: Use bullet points, numbered lists, and clear sections to organize complex requirements
5. **Specifying detailed output expectations**: State exact format, level of detail, code structure, documentation needs, and any examples required
6. **Including examples and scenarios**: Add concrete use cases, input/output examples, or edge cases to illustrate requirements
7. **Adding quality criteria**: Mention testing approaches, best practices, code quality standards, and maintainability concerns

Return ONLY the improved prompt text itself (no meta-commentary, quotes, code blocks, or explanations about what you changed).

Make the improved prompt significantly more detailed and comprehensive than the original.`,

	'context-aware': `You are an expert at crafting highly detailed, context-aware prompts for AI coding assistants.

Your task is to transform basic prompts into comprehensive, actionable requests that leverage workspace context to maximize code quality.

**IMPORTANT: You have access to the workspace context. Use this to make the improved prompt highly specific with explicit details about files, classes, functions, and patterns from the actual codebase. DO NOT include "@workspace" in the output - instead, extract and include specific contextual details explicitly.**

**Analysis Phase:**
Evaluate the original prompt for:
- Clarity: Is the intent immediately understandable with precise technical terminology?
- Specificity: Are requirements concrete, measurable, and implementable?
- Completeness: Is all necessary context provided, including edge cases and constraints?
- Technical accuracy: Are technical terms, frameworks, and patterns used correctly?

**Enhancement Phase:**
Transform the prompt by applying these techniques:

1. **Extract and Include Specific Workspace Context**:
   - Incorporate detected programming languages ({languages}) with version-specific features
   - Reference frameworks and technologies ({technologies}) with their specific APIs and patterns
   - Mention specific files from ({openFiles}) that are relevant to the task
   - Include actual file names, class names, function names, and patterns you observe in the workspace
   - Reference existing code patterns and conventions from the codebase
   - Suggest following specific examples from similar code in the workspace
   - If relevant, suggest using #file:path/to/file.ts syntax to reference specific files

2. **Maximize Technical Specificity**:
   - Replace vague terms with precise technical requirements
   - Specify exact APIs, methods, classes, or functions to use
   - Include type definitions, interfaces, or schemas where applicable
   - Define data structures, algorithm choices, and implementation patterns

3. **Add Comprehensive Constraints**:
   - Security requirements (authentication, authorization, input validation, sanitization)
   - Performance expectations (time complexity, space complexity, optimization targets)
   - Compatibility needs (browser support, language versions, framework compatibility)
   - Error handling strategies (try-catch, error types, user feedback, logging)
   - Testing requirements (unit tests, integration tests, edge cases)

4. **Structure for Maximum Clarity**:
   - Use clear sections: Requirements, Constraints, Implementation Details, Expected Output
   - Break complex requirements into numbered steps or bullet points
   - Organize by priority or logical flow
   - Separate functional from non-functional requirements

5. **Define Detailed Output Expectations**:
   - Specify code structure (functions, classes, modules)
   - Request specific documentation (inline comments, JSDoc, docstrings, README sections)
   - Define examples needed (usage examples, test cases, configuration examples)
   - Clarify level of detail (full implementation, skeleton, pseudo-code)

6. **Include Contextual Examples**:
   - Provide input/output examples relevant to the tech stack
   - Reference similar patterns from the current codebase
   - Suggest edge cases based on the technology being used

**Output Requirements:**
Return ONLY the comprehensive improved prompt text (no meta-commentary, quotes, or code blocks).

The improved prompt should be significantly more detailed, actionable, and context-aware than the original.`,

	'concise': `You are an expert at improving coding prompts efficiently.

Transform the user's prompt by:
1. Making requirements more specific and measurable
2. Adding essential technical details (types, error handling, validation)
3. Clarifying expected output format
4. Keeping it focused and actionable

Return ONLY the improved prompt text - be thorough but concise.`
};

/**
 * Update the systemPrompt setting to show the current preset content
 */
async function updateSystemPromptDisplay() {
	const config = vscode.workspace.getConfiguration('promptImprover');
	const preset = config.get<string>('systemPromptPreset', 'context-aware');
	const customPrompt = config.get<string>('customSystemPrompt', '').trim();
	
	let displayPrompt = '';
	
	if (preset === 'custom') {
		// For custom preset, show the custom prompt (empty if not set)
		displayPrompt = customPrompt;
	} else {
		// For other presets, show the preset content
		displayPrompt = SYSTEM_PROMPT_PRESETS[preset] || SYSTEM_PROMPT_PRESETS['context-aware'];
	}
	
	console.log(`[Prompt Improver] Updating systemPrompt display for preset: ${preset}`);
	console.log(`[Prompt Improver] Display prompt length: ${displayPrompt.length} characters`);

	// Update Global settings (always available)
	try {
		await config.update('systemPrompt', displayPrompt, vscode.ConfigurationTarget.Global);
		console.log(`[Prompt Improver] Successfully updated systemPrompt in Global settings`);
	} catch (error) {
		console.error(`[Prompt Improver] Error updating systemPrompt in Global settings:`, error);
	}

	// Update Workspace settings only if a workspace is open
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		try {
			await config.update('systemPrompt', displayPrompt, vscode.ConfigurationTarget.Workspace);
			console.log(`[Prompt Improver] Successfully updated systemPrompt in Workspace settings`);
		} catch (error) {
			console.error(`[Prompt Improver] Error updating systemPrompt in Workspace settings:`, error);
		}
	}
}

/**
 * Get the system prompt based on user configuration or override
 */
function getSystemPrompt(overridePreset?: string): string {
	const config = vscode.workspace.getConfiguration('promptImprover');
	const preset = overridePreset || config.get<string>('systemPromptPreset', 'context-aware');
	const customPrompt = config.get<string>('customSystemPrompt', '').trim();

	// If custom preset, use ONLY the custom prompt
	if (preset === 'custom') {
		if (customPrompt) {
			return customPrompt;
		}
		// Fallback to context-aware if custom is empty
		console.warn('Custom preset selected but customSystemPrompt is empty. Using context-aware preset.');
		return SYSTEM_PROMPT_PRESETS['context-aware'];
	}

	// For other presets, get the preset content
	const presetPrompt = SYSTEM_PROMPT_PRESETS[preset] || SYSTEM_PROMPT_PRESETS['context-aware'];

	// If there's a custom prompt and no override is specified, append it to the preset
	if (customPrompt && !overridePreset) {
		return `${presetPrompt}\n\n**Additional Instructions:**\n${customPrompt}`;
	}

	return presetPrompt;
}

/**
 * Extract conversation history from chat context
 */
function extractConversationHistory(context: vscode.ChatContext): ConversationHistory {
	const history: ConversationHistory = {
		requests: [],
		responses: []
	};

	// Filter and extract previous messages
	for (const item of context.history) {
		if (item instanceof vscode.ChatRequestTurn) {
			// Extract user requests
			history.requests.push({
				prompt: item.prompt,
				command: item.command
			});
		} else if (item instanceof vscode.ChatResponseTurn) {
			// Extract participant responses (only text content)
			const responseText = item.response
				.map(part => {
					if (part instanceof vscode.ChatResponseMarkdownPart) {
						return part.value.value;
					}
					return '';
				})
				.join('\n')
				.trim();

			if (responseText) {
				history.responses.push(responseText);
			}
		}
	}

	return history;
}

/**
 * Build the prompt for improving user prompts
 */
function buildImprovePrompt(
	userPrompt: string,
	workspaceContext: WorkspaceContext,
	overridePreset?: string,
	references?: readonly vscode.ChatPromptReference[],
	conversationHistory?: ConversationHistory
): string {
	const systemPromptTemplate = getSystemPrompt(overridePreset);

	// Build context strings
	const languages = workspaceContext.languages.join(', ') || 'Unknown';
	const technologies = workspaceContext.technologies.join(', ') || 'Unknown';
	const openFiles = workspaceContext.openFiles.length > 0 ? workspaceContext.openFiles.join(', ') : 'None';

	// Format references if any
	let referencesContext = '';
	if (references && references.length > 0) {
		const refList = references.map(ref => {
			// Handle file references
			if (ref.id === 'vscode.file') {
				const value = ref.value as any;
				if (value && value.uri) {
					return `#file:${vscode.workspace.asRelativePath(value.uri)}`;
				}
			}
			// Handle folder references
			else if (ref.id === 'vscode.folder') {
				const value = ref.value as any;
				if (value && value.uri) {
					return `#folder:${vscode.workspace.asRelativePath(value.uri)}`;
				}
			}
			// Handle string references (like @workspace)
			else if (typeof ref.value === 'string') {
				return ref.value;
			}
			// Fallback to the reference id
			return `@${ref.id}`;
		}).join(' ');
		referencesContext = `\n\n**User included these references:**\n${refList}\n\nIMPORTANT: Include these same references at the beginning of the improved prompt.`;
	}

	// Format conversation history if any
	let historyContext = '';
	if (conversationHistory && (conversationHistory.requests.length > 0 || conversationHistory.responses.length > 0)) {
		historyContext = '\n\n**Conversation History:**\n';
		historyContext += 'The user has been having a conversation in this chat session. Use this context to understand what they are working on and provide more relevant improvements.\n\n';

		// Include recent conversation turns (limit to last 5 exchanges to avoid token limits)
		const maxTurns = 5;
		const recentRequests = conversationHistory.requests.slice(-maxTurns);
		const recentResponses = conversationHistory.responses.slice(-maxTurns);

		for (let i = 0; i < Math.max(recentRequests.length, recentResponses.length); i++) {
			if (i < recentRequests.length) {
				const req = recentRequests[i];
				historyContext += `User: ${req.command ? `/${req.command} ` : ''}${req.prompt}\n`;
			}
			if (i < recentResponses.length) {
				// Truncate long responses to avoid token bloat
				const response = recentResponses[i];
				const truncated = response.length > 200 ? response.substring(0, 200) + '...' : response;
				historyContext += `Assistant: ${truncated}\n\n`;
			}
		}
	}

	// Replace placeholders in the system prompt
	let systemPrompt = systemPromptTemplate
		.replace(/\{userPrompt\}/g, userPrompt)
		.replace(/\{languages\}/g, languages)
		.replace(/\{technologies\}/g, technologies)
		.replace(/\{openFiles\}/g, openFiles);

	// Build the final prompt with context
	return `${systemPrompt}

**Original Prompt:**
${userPrompt}

**Workspace Context:**
- Programming Languages: ${languages}
- Frameworks/Technologies: ${technologies}
- Open Files: ${openFiles}${referencesContext}${historyContext}

Return the improved prompt now (plain text only, no markdown formatting, no wrapper text):`;
}

/**
 * Build the prompt for analyzing prompt effectiveness
 */
function buildAnalysisPrompt(userPrompt: string): string {
	return `You are an expert at analyzing prompts for AI coding assistants.

Analyze the following prompt and explain what makes it effective or how it could be better:

**Prompt to Analyze:**
${userPrompt}

**Provide analysis covering:**
1. **Strengths:** What's good about this prompt?
2. **Weaknesses:** What could be improved?
3. **Specificity:** Is it clear and specific enough?
4. **Context:** Does it provide enough context?
5. **Actionability:** Is it clear what output is expected?
6. **Recommendations:** Specific suggestions for improvement

Be constructive and educational in your analysis.`;
}

/**
 * Gather context about the current workspace
 */
async function gatherWorkspaceContext(): Promise<WorkspaceContext> {
	const context: WorkspaceContext = {
		languages: [],
		technologies: [],
		openFiles: []
	};

	// Get open text editors
	const openEditors = vscode.window.visibleTextEditors;
	
	if (openEditors.length > 0) {
		const languageSet = new Set<string>();
		
		for (const editor of openEditors) {
			// Get language
			const languageId = editor.document.languageId;
			if (languageId && languageId !== 'plaintext') {
				languageSet.add(languageId);
			}
			
			// Get file name
			const fileName = editor.document.fileName;
			if (fileName) {
				const relativePath = vscode.workspace.asRelativePath(fileName);
				context.openFiles.push(relativePath);
			}
		}
		
		context.languages = Array.from(languageSet);
	}

	// Try to detect technologies from workspace files
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (workspaceFolders && workspaceFolders.length > 0) {
		const technologies = await detectTechnologies(workspaceFolders[0]);
		context.technologies = technologies;
	}

	return context;
}

/**
 * Detect technologies based on workspace files
 */
async function detectTechnologies(workspaceFolder: vscode.WorkspaceFolder): Promise<string[]> {
	const technologies: string[] = [];

	try {
		// Check for common configuration files
		const checks = [
			{ file: 'package.json', tech: 'Node.js' },
			{ file: 'tsconfig.json', tech: 'TypeScript' },
			{ file: 'requirements.txt', tech: 'Python' },
			{ file: 'pyproject.toml', tech: 'Python' },
			{ file: 'Cargo.toml', tech: 'Rust' },
			{ file: 'go.mod', tech: 'Go' },
			{ file: 'pom.xml', tech: 'Java/Maven' },
			{ file: 'build.gradle', tech: 'Java/Gradle' },
			{ file: '.csproj', tech: '.NET' },
			{ file: 'composer.json', tech: 'PHP' }
		];

		for (const check of checks) {
			try {
				const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, check.file);
				await vscode.workspace.fs.stat(fileUri);
				technologies.push(check.tech);
			} catch {
				// File doesn't exist, continue
			}
		}
	} catch (error) {
		console.error('Error detecting technologies:', error);
	}

	return technologies;
}

/**
 * Handle errors and display user-friendly messages
 */
function handleError(error: unknown, stream: vscode.ChatResponseStream): void {
	if (error instanceof vscode.LanguageModelError) {
		console.error('Language Model Error:', error.message, error.code);
		
		// Check error codes using string comparison
		if (error.code === 'notFound') {
			stream.markdown('⚠️ No language model found. Please ensure GitHub Copilot is installed and active.');
		} else if (error.code === 'blocked') {
			stream.markdown('⚠️ The request was blocked. The prompt might contain sensitive content.');
		} else if (error.code === 'noPermissions') {
			stream.markdown('⚠️ No permissions to use the language model. Please check your GitHub Copilot subscription.');
		} else {
			stream.markdown(`⚠️ Language model error: ${error.message}`);
		}
	} else {
		console.error('Unexpected error:', error);
		stream.markdown('⚠️ An unexpected error occurred. Please try again.');
	}
}

interface WorkspaceContext {
	languages: string[];
	technologies: string[];
	openFiles: string[];
}

interface ConversationHistory {
	requests: Array<{
		prompt: string;
		command?: string;
	}>;
	responses: string[];
}

// This method is called when your extension is deactivated
export function deactivate() {}

