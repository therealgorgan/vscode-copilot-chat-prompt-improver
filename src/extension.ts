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

	// Debug: Check for setting conflicts
	const config = vscode.workspace.getConfiguration('promptImprover');
	const globalPreset = config.inspect<string>('systemPromptPreset')?.globalValue;
	const workspacePreset = config.inspect<string>('systemPromptPreset')?.workspaceValue;
	const workspaceFolderPreset = config.inspect<string>('systemPromptPreset')?.workspaceFolderValue;
	const effectivePreset = config.get<string>('systemPromptPreset');

	console.log('[Prompt Improver] Extension activated!');
	console.log('[Prompt Improver] Preset settings:');
	console.log(`  - Global: ${globalPreset}`);
	console.log(`  - Workspace: ${workspacePreset}`);
	console.log(`  - Workspace Folder: ${workspaceFolderPreset}`);
	console.log(`  - Effective: ${effectivePreset}`);

	// Listen for preset changes and update the systemPrompt field to show the preset content
	const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('promptImprover.systemPromptPreset')) {
			const config = vscode.workspace.getConfiguration('promptImprover');
			const preset = config.get<string>('systemPromptPreset', 'balanced');
			const presetContent = SYSTEM_PROMPT_PRESETS[preset] || SYSTEM_PROMPT_PRESETS['balanced'];

			// Update the systemPrompt field to show the current preset content
			// This allows users to see what the preset contains in the Settings UI
			config.update('systemPrompt', presetContent, vscode.ConfigurationTarget.Global);
			console.log(`[Prompt Improver] Preset changed to: ${preset}`);
		}
	});
	context.subscriptions.push(configChangeListener);

	// Initialize systemPrompt with current preset content if it's empty or contains old preset
	const currentSystemPrompt = config.get<string>('systemPrompt', '');
	const currentPreset = config.get<string>('systemPromptPreset', 'balanced');
	const currentPresetContent = SYSTEM_PROMPT_PRESETS[currentPreset] || SYSTEM_PROMPT_PRESETS['balanced'];

	// If systemPrompt is empty or doesn't match any current preset, set it to the current preset
	const allCurrentPresets = Object.values(SYSTEM_PROMPT_PRESETS);
	if (!currentSystemPrompt || !allCurrentPresets.includes(currentSystemPrompt)) {
		config.update('systemPrompt', currentPresetContent, vscode.ConfigurationTarget.Global);
		console.log(`[Prompt Improver] Initialized systemPrompt with ${currentPreset} preset`);
	}

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
					},
					{
						prompt: 'Summarize the conversation',
						label: vscode.l10n.t('Summarize conversation'),
						command: 'summary'
					},
					{
						prompt: 'Create handoff prompt for new chat',
						label: vscode.l10n.t('Create handoff prompt'),
						command: 'handoff'
					}
				];
			} else if (result.metadata.command === 'summary') {
				return [
					{
						prompt: 'Improve my next prompt based on this summary',
						label: vscode.l10n.t('Improve a prompt'),
						command: 'improve'
					},
					{
						prompt: 'Create handoff prompt with this context',
						label: vscode.l10n.t('Create handoff prompt'),
						command: 'handoff'
					}
				];
			} else if (result.metadata.command === 'handoff' || result.metadata.command === 'new-chat') {
				return [
					{
						prompt: 'Improve the handoff prompt',
						label: vscode.l10n.t('Improve handoff prompt'),
						command: 'improve'
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

	context.subscriptions.push(participant, copyCommand, selectModelCommand, listModelsCommand);
}

/**
 * Get the configured language model based on user settings
 * If no specific model is configured, uses the current chat model or falls back to gpt-4o-mini
 */
async function getConfiguredModel(currentChatModel?: vscode.LanguageModelChat): Promise<vscode.LanguageModelChat | undefined> {
	const config = vscode.workspace.getConfiguration('promptImprover');
	const family = config.get<string>('modelFamily', '');

	// If no specific model family is configured, use the current chat model
	if (!family || family.trim() === '') {
		if (currentChatModel) {
			console.log(`[Prompt Improver] Using current chat model: ${currentChatModel.family} (${currentChatModel.name})`);
			return currentChatModel;
		}
		// Fallback to gpt-4o-mini (fastest, free with Copilot subscription)
		console.log('[Prompt Improver] No model configured and no current chat model, using gpt-4o-mini as default');
		const selector: { vendor: string; family: string } = {
			vendor: 'copilot',
			family: 'gpt-4o-mini'
		};
		const models = await vscode.lm.selectChatModels(selector);
		if (models.length > 0) {
			return models[0];
		}
		// If gpt-4o-mini is not available, try any copilot model
		const anyModels = await vscode.lm.selectChatModels({ vendor: 'copilot' });
		return anyModels.length > 0 ? anyModels[0] : undefined;
	}

	// Build selector options - always use copilot vendor
	const selector: { vendor: string; family?: string } = {
		vendor: 'copilot'
	};
	
	// Add family if specified
	if (family && family.trim() !== '') {
		selector.family = family;
		console.log(`[Prompt Improver] Using configured model family: ${family}`);
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
		} else if (request.command === 'summary') {
			await handleSummaryCommand(request, context, stream, token);
		} else if (request.command === 'handoff' || request.command === 'new-chat') {
			await handleHandoffCommand(request, context, stream, token);
		} else if (request.command === 'improve-concise') {
			await handleImproveCommand(request, context, stream, token, 'concise');
		} else if (request.command === 'improve-balanced') {
			await handleImproveCommand(request, context, stream, token, 'balanced');
		} else if (request.command === 'improve-detailed') {
			await handleImproveCommand(request, context, stream, token, 'detailed');
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
		safeStreamWrite(stream, 'Please provide a prompt that you want me to improve.\n\n');
		safeStreamWrite(stream, '**Example usage:**\n');
		safeStreamWrite(stream, '```\n@prompt-improver /improve write a function\n```\n');
		safeStreamWrite(stream, '```\n@prompt-improver #file:app.ts improve this code\n```\n');
		return;
	}

	// Check for cancellation early
	if (isCancelled(token)) {
		console.log('[Prompt Improver] Operation cancelled by user');
		return;
	}

	// Show which preset is being used if overridden
	if (overridePreset) {
		const presetNames: Record<string, string> = {
			'concise': 'Concise',
			'balanced': 'Balanced',
			'detailed': 'Detailed'
		};
		const presetName = presetNames[overridePreset] || overridePreset;
		if (!safeStreamWrite(stream, `*Using ${presetName} preset for this prompt*\n\n`)) {
			return; // Stream closed
		}
	}

	// Extract any references (like #file, @workspace, etc.)
	const references = request.references || [];

	// Get context inclusion settings
	const config = vscode.workspace.getConfiguration('promptImprover');
	const includeWorkspaceMetadata = config.get<boolean>('includeWorkspaceMetadata', true);
	const includeConversationHistory = config.get<boolean>('includeConversationHistory', true);
	const includeMarkdownFiles = config.get<boolean>('includeMarkdownFiles', true);
	const includeOpenFileContents = config.get<boolean>('includeOpenFileContents', true);
	const includeGitContext = config.get<boolean>('includeGitContext', true);
	const useWorkspaceTools = config.get<boolean>('useWorkspaceTools', false);
	const filterWorkspaceTools = config.get<boolean>('filterWorkspaceTools', true);

	try {
		// Gather workspace context if enabled
		let workspaceContext: WorkspaceContext | undefined;
		if (includeWorkspaceMetadata && !isCancelled(token)) {
			safeStreamWrite(stream, '', 'progress');
			safeStreamWrite(stream, 'Gathering workspace context...', 'progress');
			workspaceContext = await gatherWorkspaceContext();
		}

		// Check for cancellation after each async operation
		if (isCancelled(token)) {
			console.log('[Prompt Improver] Operation cancelled during context gathering');
			return;
		}

		// Gather conversation history if enabled
		let conversationHistory: ConversationHistory | undefined;
		if (includeConversationHistory) {
			conversationHistory = extractConversationHistory(context);
		}

		// Scan for relevant markdown context files if enabled
		let markdownContext: MarkdownContext | undefined;
		if (includeMarkdownFiles && !isCancelled(token)) {
			safeStreamWrite(stream, 'Scanning for relevant context files...', 'progress');
			markdownContext = await scanRelevantMarkdownFiles(userPrompt);
		}

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Operation cancelled during markdown scanning');
			return;
		}

		// Gather open file contents if enabled
		let openFileContents: OpenFileContents | undefined;
		if (includeOpenFileContents && !isCancelled(token)) {
			safeStreamWrite(stream, 'Analyzing open files...', 'progress');
			openFileContents = await gatherOpenFileContents();
		}

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Operation cancelled during file analysis');
			return;
		}

		// Gather Git context if enabled
		let gitContext: GitContext | undefined;
		if (includeGitContext && !isCancelled(token)) {
			safeStreamWrite(stream, 'Gathering Git context...', 'progress');
			try {
				gitContext = await gatherGitContext();
			} catch (gitError) {
				// Git errors shouldn't stop the whole process
				console.warn('[Prompt Improver] Could not gather Git context:', gitError);
				// Continue without Git context
			}
		}

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Operation cancelled during Git context gathering');
			return;
		}

		// Build the prompt for the LLM
		const systemPrompt = buildImprovePrompt(userPrompt, workspaceContext, overridePreset, references, conversationHistory, markdownContext, openFileContents, gitContext);

		// Get the configured language model (or use current chat model)
		const model = await getConfiguredModel(request.model);

		if (!model) {
			safeStreamWrite(stream, '⚠️ No language model available. Please ensure GitHub Copilot is installed and authenticated, or check your model settings.\n\n');
			return;
		}

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Operation cancelled before model request');
			return;
		}

		// Get available tools if workspace tools are enabled
		const requestOptions: vscode.LanguageModelChatRequestOptions = {};
		if (useWorkspaceTools) {
			try {
				safeStreamWrite(stream, 'Loading workspace tools...', 'progress');
				// Get all available tools - this includes built-in workspace context tools
				const allTools = vscode.lm.tools;
				console.log(`[Prompt Improver] Found ${allTools.length} available tools`);

				// Log first few tool details to help debug filtering
				if (allTools.length > 0) {
					const sampleTools = allTools.slice(0, 3).map(t => ({
						name: (t as any).name || 'unknown',
						tags: (t as any).tags || []
					}));
					console.log(`[Prompt Improver] Sample tools:`, JSON.stringify(sampleTools));
				}

				let toolsToUse = allTools;

				// Filter to only the most useful tools if enabled (to avoid VS Code's "No lowest priority node" bug)
				// This bug occurs when too many tools (95+) are passed to the LLM
				if (filterWorkspaceTools) {
					// Strategy 1: Filter by tags (preferred method per VS Code API docs)
					// Look for tools tagged with 'workspace' or 'copilot' which are the core tools
					const priorityTags = ['workspace', 'copilot', 'vscode'];

					const tagFilteredTools = allTools.filter(tool => {
						const toolTags = (tool as any).tags || [];
						return toolTags.some((tag: string) =>
							priorityTags.some(priority => tag.toLowerCase().includes(priority))
						);
					});

					if (tagFilteredTools.length > 0 && tagFilteredTools.length < allTools.length) {
						toolsToUse = tagFilteredTools;
						console.log(`[Prompt Improver] Filtered by tags to ${toolsToUse.length} tools (from ${allTools.length} total)`);
					} else {
						// Strategy 2: Fallback to limiting by count
						// Just take the first 20 tools to avoid the bug
						toolsToUse = allTools.slice(0, 20);
						console.log(`[Prompt Improver] Tag filter didn't help, limiting to first ${toolsToUse.length} tools (from ${allTools.length} total)`);
					}
				} else {
					console.log(`[Prompt Improver] Tool filtering disabled, using all ${allTools.length} tools`);
				}

				// Only pass tools if there are any available
				if (toolsToUse.length > 0) {
					// Cast to mutable array since the API expects it
					requestOptions.tools = [...toolsToUse];
					console.log(`[Prompt Improver] Passing ${toolsToUse.length} tools to LLM`);
				} else {
					console.log(`[Prompt Improver] No tools available, proceeding without tools`);
				}
			} catch (error: any) {
				console.error(`[Prompt Improver] Error loading tools:`, error);

				// Check for specific VS Code tool system errors
				const errorMessage = error?.message || String(error);
				if (errorMessage.includes('No lowest priority node found') || errorMessage.includes('priority node')) {
					safeStreamWrite(stream, `\n\n*Note: VS Code's workspace tools encountered an internal error. This is a known VS Code bug that occurs with too many tools. Try enabling "Filter Workspace Tools" in settings, or update to VS Code Insiders for the fix.*\n\n`);
					console.warn('[Prompt Improver] VS Code tool priority system error - this is a VS Code bug, not an extension issue');
				} else {
					safeStreamWrite(stream, `\n\n*Note: Could not load workspace tools. Proceeding without tool support.*\n\n`);
				}
			}
		}

		// Create messages for the LLM
		const messages = [
			vscode.LanguageModelChatMessage.User(systemPrompt)
		];

		safeStreamWrite(stream, 'Improving your prompt...', 'progress');

		// Send request to language model with tools
		const chatResponse = await model.sendRequest(messages, requestOptions, token);

		// Collect the improved prompt text
		let improvedPrompt = '';

		// Stream the response - the LLM will automatically invoke tools as needed
		if (!safeStreamWrite(stream, '## Improved Prompt\n\n')) {
			return; // Stream closed
		}

		for await (const fragment of chatResponse.text) {
			// Check for cancellation during streaming
			if (isCancelled(token)) {
				console.log('[Prompt Improver] Operation cancelled during streaming');
				safeStreamWrite(stream, '\n\n*[Operation cancelled]*\n\n');
				return;
			}

			improvedPrompt += fragment;
			if (!safeStreamWrite(stream, fragment)) {
				// Stream closed, stop streaming
				console.log('[Prompt Improver] Stream closed during response streaming');
				return;
			}
		}

		if (!safeStreamWrite(stream, '\n\n---\n\n')) {
			return; // Stream closed
		}

		// Add a copy button - strip any remaining quotes or wrapper text
		const cleanPrompt = improvedPrompt.trim().replace(/^["']|["']$/g, '');

		try {
			stream.button({
				command: 'prompt-improver.copyImprovedPrompt',
				title: vscode.l10n.t('📋 Copy to Clipboard'),
				arguments: [cleanPrompt]
			});

			safeStreamWrite(stream, '\n\n💡 **Tip:** Click the button above to copy, or select the text and use Ctrl+C.\n');
		} catch (buttonError) {
			// Button creation failed (stream might be closed)
			console.warn('[Prompt Improver] Could not add copy button:', buttonError);
		}

	} catch (err) {
		// Use the centralized error handler
		handleError(err, stream);
	}
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
		safeStreamWrite(stream, 'Please provide a prompt that you want me to analyze.\n\n');
		safeStreamWrite(stream, '**Example usage:**\n');
		safeStreamWrite(stream, '```\n@prompt-improver /analyze create a REST API with error handling\n```\n');
		return;
	}

	// Check for cancellation
	if (isCancelled(token)) {
		console.log('[Prompt Improver] Analyze operation cancelled by user');
		return;
	}

	try {
		// Build the analysis prompt
		const analysisPrompt = buildAnalysisPrompt(userPrompt);

		// Get the configured language model (or use current chat model)
		const model = await getConfiguredModel(request.model);

		if (!model) {
			safeStreamWrite(stream, '⚠️ No language model available. Please ensure GitHub Copilot is installed and authenticated, or check your model settings.\n\n');
			return;
		}

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Analyze operation cancelled before model request');
			return;
		}

		const messages = [
			vscode.LanguageModelChatMessage.User(analysisPrompt)
		];

		safeStreamWrite(stream, 'Analyzing prompt effectiveness...', 'progress');

		// Send request to language model
		const chatResponse = await model.sendRequest(messages, {}, token);

		// Stream the response
		if (!safeStreamWrite(stream, '## Prompt Analysis\n\n')) {
			return; // Stream closed
		}

		for await (const fragment of chatResponse.text) {
			// Check for cancellation during streaming
			if (isCancelled(token)) {
				console.log('[Prompt Improver] Analyze operation cancelled during streaming');
				safeStreamWrite(stream, '\n\n*[Operation cancelled]*\n\n');
				return;
			}

			if (!safeStreamWrite(stream, fragment)) {
				// Stream closed
				console.log('[Prompt Improver] Stream closed during analyze response streaming');
				return;
			}
		}
	} catch (err) {
		handleError(err, stream);
	}
}

/**
 * Handle the /handoff command - creates a context-preserving prompt for starting a new chat
 */
async function handleHandoffCommand(
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken
): Promise<void> {

	// Check for cancellation
	if (isCancelled(token)) {
		console.log('[Prompt Improver] Handoff operation cancelled by user');
		return;
	}

	try {
		safeStreamWrite(stream, 'Analyzing conversation context...', 'progress');

		// Extract conversation history
		const conversationHistory = extractConversationHistory(context);

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Handoff operation cancelled during history extraction');
			return;
		}

		// Get workspace context
		safeStreamWrite(stream, 'Gathering workspace context...', 'progress');
		const workspaceContext = await gatherWorkspaceContext();

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Handoff operation cancelled during workspace context gathering');
			return;
		}

		// Get Git context to understand current work
		safeStreamWrite(stream, 'Gathering Git context...', 'progress');
		let gitContext: GitContext | undefined;
		try {
			gitContext = await gatherGitContext();
		} catch (gitError) {
			// Git errors shouldn't stop the handoff process
			console.warn('[Prompt Improver] Could not gather Git context for handoff:', gitError);
			// Continue without Git context
		}

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Handoff operation cancelled during Git context gathering');
			return;
		}

		// Build the handoff prompt
		const handoffPrompt = buildHandoffPrompt(conversationHistory, workspaceContext, gitContext, request.prompt);

		// Get the configured language model (or use current chat model)
		const model = await getConfiguredModel(request.model);

		if (!model) {
			safeStreamWrite(stream, '⚠️ No language model available. Please ensure GitHub Copilot is installed and authenticated, or check your model settings.\n\n');
			return;
		}

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Handoff operation cancelled before model request');
			return;
		}

		const messages = [
			vscode.LanguageModelChatMessage.User(handoffPrompt)
		];

		safeStreamWrite(stream, 'Creating handoff prompt...', 'progress');

		// Send request to language model
		const chatResponse = await model.sendRequest(messages, {}, token);

		// Stream the response
		if (!safeStreamWrite(stream, '## 🔄 New Chat Handoff Prompt\n\n')) {
			return; // Stream closed
		}
		if (!safeStreamWrite(stream, 'Copy this prompt to start a new chat with full context:\n\n')) {
			return;
		}
		if (!safeStreamWrite(stream, '---\n\n')) {
			return;
		}

		let fullResponse = '';
		for await (const fragment of chatResponse.text) {
			// Check for cancellation during streaming
			if (isCancelled(token)) {
				console.log('[Prompt Improver] Handoff operation cancelled during streaming');
				safeStreamWrite(stream, '\n\n*[Operation cancelled]*\n\n');
				return;
			}

			fullResponse += fragment;
			if (!safeStreamWrite(stream, fragment)) {
				// Stream closed
				console.log('[Prompt Improver] Stream closed during handoff response streaming');
				return;
			}
		}

		if (!safeStreamWrite(stream, '\n\n---\n\n')) {
			return;
		}

		// Add a button to copy the handoff prompt
		try {
			stream.button({
				command: 'prompt-improver.copyImprovedPrompt',
				title: '📋 Copy Handoff Prompt',
				arguments: [fullResponse]
			});

			safeStreamWrite(stream, '\n\n💡 **Tip:** This prompt includes all the context from your current conversation, so the next agent can seamlessly continue where you left off.\n');
		} catch (buttonError) {
			// Button creation failed (stream might be closed)
			console.warn('[Prompt Improver] Could not add copy button to handoff:', buttonError);
		}
	} catch (err) {
		handleError(err, stream);
	}
}

/**
 * Handle the /summary command - summarizes the conversation history
 */
async function handleSummaryCommand(
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken
): Promise<void> {

	try {
		safeStreamWrite(stream, 'Analyzing conversation...', 'progress');

		// Extract conversation history
		const conversationHistory = extractConversationHistory(context);

		if (!conversationHistory || (conversationHistory.requests.length === 0 && conversationHistory.responses.length === 0)) {
			safeStreamWrite(stream, '⚠️ No conversation history found. Start a conversation first, then use `/summary` to get a summary.\n\n');
			return;
		}

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Summary operation cancelled during history extraction');
			return;
		}

		// Get workspace context
		safeStreamWrite(stream, 'Gathering workspace context...', 'progress');
		const workspaceContext = await gatherWorkspaceContext();

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Summary operation cancelled during workspace context gathering');
			return;
		}

		// Get Git context
		let gitContext: GitContext | undefined;
		const config = vscode.workspace.getConfiguration('promptImprover');
		const includeGitContext = config.get<boolean>('includeGitContext', true);

		if (includeGitContext) {
			safeStreamWrite(stream, 'Gathering Git context...', 'progress');
			gitContext = await gatherGitContext();
		}

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Summary operation cancelled during Git context gathering');
			return;
		}

		// Build the summary prompt
		const summaryPrompt = buildSummaryPrompt(conversationHistory, workspaceContext, gitContext, request.prompt);

		// Get the configured language model (or use current chat model)
		const model = await getConfiguredModel(request.model);

		if (!model) {
			safeStreamWrite(stream, '⚠️ No language model available. Please ensure GitHub Copilot is installed and authenticated, or check your model settings.\n\n');
			return;
		}

		if (isCancelled(token)) {
			console.log('[Prompt Improver] Summary operation cancelled before model request');
			return;
		}

		const messages = [
			vscode.LanguageModelChatMessage.User(summaryPrompt)
		];

		safeStreamWrite(stream, 'Generating conversation summary...', 'progress');

		// Send request to language model
		const chatResponse = await model.sendRequest(messages, {}, token);

		// Stream the response
		if (!safeStreamWrite(stream, '## Conversation Summary\n\n')) {
			return; // Stream closed
		}

		for await (const fragment of chatResponse.text) {
			if (isCancelled(token)) {
				console.log('[Prompt Improver] Summary operation cancelled during streaming');
				return;
			}
			if (!safeStreamWrite(stream, fragment)) {
				return; // Stream closed
			}
		}

	} catch (err) {
		handleError(err, stream);
	}
}

/**
 * Build the summary prompt that analyzes conversation history
 */
function buildSummaryPrompt(
	conversationHistory: ConversationHistory,
	workspaceContext: WorkspaceContext | undefined,
	gitContext: GitContext | undefined,
	userInstructions?: string
): string {
	let prompt = `You are an expert at analyzing and summarizing technical conversations.

Your task is to analyze the conversation history and create a clear, concise summary that captures:
1. **What the user has been working on** - The main task or problem being addressed
2. **Current state** - What's been accomplished and what's still pending
3. **Key decisions and constraints** - Important technical choices, requirements, or limitations discussed
4. **Recent focus** - What the most recent exchanges have been about
5. **Next steps** - What appears to be the logical next action or task

**Format your summary as:**
- Start with a brief overview (2-3 sentences)
- Use bullet points for key details
- Highlight any blockers or issues that came up
- End with suggested next steps

Keep it concise but informative - aim for clarity over completeness.`;

	// Add workspace context
	if (workspaceContext) {
		prompt += `\n\n**Workspace Context:**\n`;
		if (workspaceContext.languages.length > 0) {
			prompt += `Languages: ${workspaceContext.languages.join(', ')}\n`;
		}
		if (workspaceContext.technologies.length > 0) {
			prompt += `Technologies: ${workspaceContext.technologies.join(', ')}\n`;
		}
		if (workspaceContext.openFiles.length > 0) {
			prompt += `Open files: ${workspaceContext.openFiles.slice(0, 5).join(', ')}${workspaceContext.openFiles.length > 5 ? '...' : ''}\n`;
		}
	}

	// Add Git context
	if (gitContext) {
		prompt += `\n**Git Context:**\n`;
		if (gitContext.branch) {
			prompt += `Branch: ${gitContext.branch}\n`;
		}
		if (gitContext.status) {
			prompt += `Status: ${gitContext.status.split('\n').slice(0, 3).join(', ')}\n`;
		}
	}

	// Add conversation history
	prompt += `\n**Conversation History:**\n`;

	const maxTurns = 20; // Include more history for summary
	const recentRequests = conversationHistory.requests.slice(-maxTurns);
	const recentResponses = conversationHistory.responses.slice(-maxTurns);

	for (let i = 0; i < Math.max(recentRequests.length, recentResponses.length); i++) {
		if (i < recentRequests.length) {
			const req = recentRequests[i];
			prompt += `\nUser: ${req.command ? `/${req.command} ` : ''}${req.prompt}`;
		}
		if (i < recentResponses.length) {
			const response = recentResponses[i];
			// Truncate very long responses but keep more context than improve command
			const truncated = response.length > 800 ? response.substring(0, 800) + '... [truncated]' : response;
			prompt += `\nAssistant: ${truncated}`;
		}
	}

	// Add user instructions if provided
	if (userInstructions && userInstructions.trim()) {
		prompt += `\n\n**Additional Instructions:**\n${userInstructions}`;
	}

	prompt += `\n\nNow provide a clear, actionable summary of this conversation.`;

	return prompt;
}

/**
 * Build the handoff prompt that preserves conversation context
 */
function buildHandoffPrompt(
	conversationHistory: ConversationHistory | undefined,
	workspaceContext: WorkspaceContext | undefined,
	gitContext: GitContext | undefined,
	userInstructions?: string
): string {
	let prompt = `You are an expert at creating comprehensive context-preserving prompts for AI agent handoffs.

Your task is to analyze the conversation history and create a single, comprehensive prompt that can be used to start a new chat session while preserving all the important context.

**Goal:** Create a prompt that allows a new AI agent to seamlessly continue the work without losing any important context.

**Requirements:**
1. Summarize what the user has been working on
2. Include the current state of the work (what's been done, what's pending)
3. Preserve any important technical decisions, constraints, or requirements discussed
4. Include the most recent request or task (this is likely what needs to continue)
5. Add relevant workspace context (languages, technologies, files being worked on)
6. Make it clear, actionable, and ready to paste into a new chat

**Format:** Return ONLY the handoff prompt text - no meta-commentary, no explanations, just the prompt itself.

`;

	// Add workspace context
	if (workspaceContext) {
		prompt += `\n**Current Workspace:**\n`;
		prompt += `- Languages: ${workspaceContext.languages.join(', ')}\n`;
		prompt += `- Technologies: ${workspaceContext.technologies.join(', ')}\n`;
		if (workspaceContext.openFiles.length > 0) {
			prompt += `- Open Files: ${workspaceContext.openFiles.slice(0, 10).join(', ')}${workspaceContext.openFiles.length > 10 ? '...' : ''}\n`;
		}
	}

	// Add Git context
	if (gitContext) {
		if (gitContext.branch) {
			prompt += `- Current Branch: ${gitContext.branch}\n`;
		}
		if (gitContext.status) {
			prompt += `- Git Status: ${gitContext.status.split('\n').slice(0, 5).join(', ')}\n`;
		}
	}

	// Add conversation history
	if (conversationHistory && (conversationHistory.requests.length > 0 || conversationHistory.responses.length > 0)) {
		prompt += `\n**Conversation History (last 10 exchanges):**\n`;

		const maxTurns = 10;
		const recentRequests = conversationHistory.requests.slice(-maxTurns);
		const recentResponses = conversationHistory.responses.slice(-maxTurns);

		for (let i = 0; i < Math.max(recentRequests.length, recentResponses.length); i++) {
			if (i < recentRequests.length) {
				const req = recentRequests[i];
				prompt += `\nUser: ${req.command ? `/${req.command} ` : ''}${req.prompt}`;
			}
			if (i < recentResponses.length) {
				const response = recentResponses[i];
				// Truncate very long responses but keep more context than before
				const truncated = response.length > 500 ? response.substring(0, 500) + '... [truncated]' : response;
				prompt += `\nAssistant: ${truncated}\n`;
			}
		}
	}

	// Add user instructions if provided
	if (userInstructions && userInstructions.trim().length > 0) {
		prompt += `\n**Additional Instructions:**\n${userInstructions}\n`;
	}

	prompt += `\n**Now create the handoff prompt:**`;

	return prompt;
}

/**
 * System prompt presets
 */
const SYSTEM_PROMPT_PRESETS: { [key: string]: string } = {
	'concise': `You are an expert at improving coding prompts efficiently with minimal elaboration.

Your goal: Transform the user's prompt into a clear, focused request using the fewest words necessary.

Apply these improvements:
1. **Clarify the core requirement** - State exactly what needs to be built/changed
2. **Add critical technical details** - Include only essential types, parameters, or constraints
3. **Specify the output format** - What should the result look like?
4. **Remove ambiguity** - Replace vague terms with specific technical language

Keep it brief and actionable. Use the provided workspace context (languages, technologies, files, Git status, conversation history) to make specific references without lengthy explanations.

Return ONLY the improved prompt text - no meta-commentary, quotes, or explanations.`,

	'balanced': `You are an expert at improving prompts for AI coding assistants with practical, well-balanced enhancements.

Your goal: Transform the user's prompt into a clear, actionable request with good detail but without excessive elaboration.

Enhance the prompt by:
1. **Clarify requirements** - Make the intent specific and unambiguous
2. **Add practical technical details** - Include relevant types, APIs, patterns, and constraints
3. **Specify important edge cases** - Cover common error scenarios and validation needs
4. **Structure clearly** - Organize requirements logically with sections or bullet points
5. **Define output expectations** - Describe the expected code structure and documentation level

Use the provided workspace context (languages, technologies, open files, Git status, conversation history, project documentation) to:
- Reference specific files, classes, or functions when relevant
- Align with existing code patterns and conventions
- Suggest appropriate frameworks/libraries already in use
- Consider the current development activity (branch, recent commits, staged changes)

Strike a balance between thoroughness and brevity. Focus on practical improvements that will produce quality code without over-engineering.

Return ONLY the improved prompt text - no meta-commentary, quotes, or explanations.`,

	'detailed': `You are an expert at crafting comprehensive, highly detailed prompts for AI coding assistants.

Your goal: Transform the user's prompt into an exhaustive, well-structured request that considers all aspects of implementation, quality, and maintainability.

Perform a thorough enhancement by:

1. **Maximize Clarity and Specificity**:
   - Transform general concepts into precise technical requirements
   - Use exact terminology for the languages/frameworks involved
   - Eliminate all ambiguity through explicit definitions
   - Break down complex requirements into clear, numbered steps

2. **Leverage All Available Context**:
   - Reference specific files, classes, functions, and patterns from the open files synopsis
   - Align with existing code conventions and architectural patterns in the codebase
   - Consider the current Git context (branch, working changes, recent commits) to understand what's being worked on
   - Use conversation history to understand the broader task context
   - Incorporate relevant information from project documentation files
   - Suggest using #file:path/to/file syntax to reference specific files when appropriate

3. **Add Comprehensive Technical Requirements**:
   - Specify exact APIs, methods, classes, interfaces, or functions to use
   - Include complete type definitions, schemas, or data structures
   - Define algorithm choices and implementation patterns
   - Specify language-specific features or idioms to leverage
   - Detail framework-specific best practices

4. **Define Extensive Constraints**:
   - **Security**: Authentication, authorization, input validation, sanitization, XSS/CSRF protection
   - **Performance**: Time/space complexity, optimization targets, caching strategies
   - **Compatibility**: Browser/platform support, language versions, framework compatibility
   - **Error Handling**: Try-catch patterns, error types, user feedback, logging strategies
   - **Testing**: Unit tests, integration tests, edge cases, test data examples
   - **Accessibility**: ARIA labels, keyboard navigation, screen reader support (if UI-related)

5. **Structure for Maximum Clarity**:
   - Organize into clear sections: Overview, Requirements, Constraints, Implementation Details, Testing, Documentation
   - Use hierarchical bullet points or numbered lists
   - Separate functional requirements from non-functional requirements
   - Prioritize requirements (must-have vs. nice-to-have)

6. **Specify Detailed Output Expectations**:
   - Describe the complete code structure (files, classes, functions, modules)
   - Request comprehensive documentation (inline comments, JSDoc/docstrings, README sections)
   - Ask for usage examples, test cases, and configuration examples
   - Clarify the level of implementation detail needed
   - Specify code style preferences (if evident from open files)

7. **Include Contextual Examples and Edge Cases**:
   - Provide input/output examples relevant to the tech stack
   - Reference similar patterns from the current codebase
   - List potential edge cases based on the technology and use case
   - Suggest error scenarios to handle
   - Consider internationalization, localization, or timezone issues if relevant

Be thorough and comprehensive. The improved prompt should leave no room for ambiguity and should guide the AI to produce production-ready, well-tested, maintainable code.

Return ONLY the comprehensive improved prompt text - no meta-commentary, quotes, or explanations.`
};

/**
 * Get the system prompt based on user configuration or override
 */
function getSystemPrompt(overridePreset?: string): string {
	const config = vscode.workspace.getConfiguration('promptImprover');
	const preset = overridePreset || config.get<string>('systemPromptPreset', 'balanced');

	// Get the preset content, or use the manually edited systemPrompt if it differs from presets
	const currentSystemPrompt = config.get<string>('systemPrompt', '');
	const presetPrompt = SYSTEM_PROMPT_PRESETS[preset] || SYSTEM_PROMPT_PRESETS['balanced'];

	// If user has manually edited the systemPrompt field, use that instead
	const presetPrompts = Object.values(SYSTEM_PROMPT_PRESETS);
	if (currentSystemPrompt && !presetPrompts.includes(currentSystemPrompt)) {
		console.log('[Prompt Improver] Using manually edited system prompt');
		return currentSystemPrompt;
	}

	return presetPrompt;
}

/**
 * Extract intelligent synopsis from code file
 */
function extractCodeSynopsis(text: string, language: string): string {
	const lines = text.split('\n');
	const synopsis: string[] = [];

	// Language-specific patterns for important code elements
	const patterns = {
		// Imports/requires
		imports: /^(import|from|require|using|#include|package)\s+/,
		// Exports
		exports: /^(export|module\.exports|exports\.|public\s+class|public\s+interface)/,
		// Class definitions
		classes: /^(class|interface|struct|enum|type\s+\w+\s*=)/,
		// Function/method definitions
		functions: /(function\s+\w+|const\s+\w+\s*=\s*\(|def\s+\w+|fn\s+\w+|func\s+\w+|public\s+\w+\s+\w+\s*\(|private\s+\w+\s+\w+\s*\()/,
		// Type definitions
		types: /^(type|interface|typedef|struct)\s+\w+/,
		// Constants and important variables
		constants: /^(const|let|var|final|static\s+final|#define)\s+[A-Z_][A-Z0-9_]*\s*=/,
		// Comments (for context)
		comments: /^\s*(\/\/|\/\*\*|\*|#|<!--)/
	};

	let inMultilineComment = false;
	let commentBuffer: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		// Skip empty lines
		if (!trimmed) {
			continue;
		}

		// Track multiline comments
		if (trimmed.startsWith('/*') || trimmed.startsWith('/**')) {
			inMultilineComment = true;
			commentBuffer = [line];
			continue;
		}
		if (inMultilineComment) {
			commentBuffer.push(line);
			if (trimmed.includes('*/')) {
				inMultilineComment = false;
				// Only include JSDoc-style comments
				if (commentBuffer[0].includes('/**')) {
					synopsis.push(...commentBuffer);
				}
				commentBuffer = [];
			}
			continue;
		}

		// Check if line matches any important pattern
		let isImportant = false;

		if (patterns.imports.test(trimmed)) {
			synopsis.push(line);
			isImportant = true;
		} else if (patterns.exports.test(trimmed)) {
			synopsis.push(line);
			// Include next few lines for context (function signature, etc.)
			for (let j = 1; j <= 3 && i + j < lines.length; j++) {
				const nextLine = lines[i + j];
				synopsis.push(nextLine);
				if (nextLine.includes('{') || nextLine.includes(';')) {
					break;
				}
			}
			isImportant = true;
		} else if (patterns.classes.test(trimmed)) {
			synopsis.push(line);
			// Include class signature
			for (let j = 1; j <= 2 && i + j < lines.length; j++) {
				const nextLine = lines[i + j];
				synopsis.push(nextLine);
				if (nextLine.includes('{')) {
					break;
				}
			}
			isImportant = true;
		} else if (patterns.functions.test(line)) {
			synopsis.push(line);
			// Include function signature
			for (let j = 1; j <= 2 && i + j < lines.length; j++) {
				const nextLine = lines[i + j];
				synopsis.push(nextLine);
				if (nextLine.includes('{') || nextLine.includes(';')) {
					break;
				}
			}
			isImportant = true;
		} else if (patterns.types.test(trimmed)) {
			synopsis.push(line);
			isImportant = true;
		} else if (patterns.constants.test(trimmed)) {
			synopsis.push(line);
			isImportant = true;
		} else if (patterns.comments.test(trimmed) && trimmed.startsWith('//')) {
			// Include single-line comments for context
			synopsis.push(line);
		}

		// Limit synopsis to avoid token bloat
		if (synopsis.length > 150) {
			synopsis.push('... [synopsis truncated for brevity]');
			break;
		}
	}

	return synopsis.join('\n');
}

/**
 * Gather intelligent synopsis from currently open files
 */
async function gatherOpenFileContents(): Promise<OpenFileContents> {
	const contents: OpenFileContents = {
		files: []
	};

	try {
		const visibleEditors = vscode.window.visibleTextEditors;

		for (const editor of visibleEditors) {
			try {
				const document = editor.document;

				// Skip untitled documents and non-file schemes
				if (document.uri.scheme !== 'file') {
					continue;
				}

				const relativePath = vscode.workspace.asRelativePath(document.uri);
				const fullText = document.getText();
				const lines = fullText.split('\n');

				// Extract intelligent synopsis instead of raw content
				const synopsis = extractCodeSynopsis(fullText, document.languageId);

				contents.files.push({
					path: relativePath,
					content: synopsis,
					language: document.languageId,
					lineCount: lines.length,
					truncated: synopsis.includes('[synopsis truncated')
				});
			} catch (fileError) {
				// Error processing individual file, skip it
				console.warn('[Prompt Improver] Error processing open file:', fileError);
				continue;
			}
		}
	} catch (error) {
		// Error accessing editors
		console.error('[Prompt Improver] Error gathering open file contents:', error);
	}

	return contents;
}

/**
 * Gather Git context from the workspace
 */
async function gatherGitContext(): Promise<GitContext> {
	const context: GitContext = {};

	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return context;
	}

	const workspaceRoot = workspaceFolders[0].uri.fsPath;

	try {
		// Get current branch
		const branchResult = await execGitCommand(workspaceRoot, 'git rev-parse --abbrev-ref HEAD');
		if (branchResult) {
			context.branch = branchResult.trim();
		}

		// Get status
		const statusResult = await execGitCommand(workspaceRoot, 'git status --short');
		if (statusResult) {
			context.status = statusResult.trim();
		}

		// Get staged changes (diff)
		const stagedResult = await execGitCommand(workspaceRoot, 'git diff --cached --stat');
		if (stagedResult) {
			context.stagedChanges = stagedResult.trim();
		}

		// Get last 10 commits
		const logResult = await execGitCommand(
			workspaceRoot,
			'git log -10 --pretty=format:"%h|%s|%an|%ar"'
		);
		if (logResult) {
			const commits = logResult.trim().split('\n').map(line => {
				const [hash, message, author, date] = line.split('|');
				return { hash, message, author, date };
			});
			context.recentCommits = commits;
		}
	} catch (error) {
		console.error('Error gathering Git context:', error);
		// Return partial context if available
	}

	return context;
}

/**
 * Execute a Git command with timeout
 */
async function execGitCommand(cwd: string, command: string): Promise<string | null> {
	try {
		const { exec } = require('child_process');
		const { promisify } = require('util');
		const execAsync = promisify(exec);

		// Add timeout to prevent hanging
		const timeoutMs = 10000; // 10 seconds
		const result = await Promise.race([
			execAsync(command, {
				cwd,
				maxBuffer: 1024 * 1024,
				timeout: timeoutMs
			}),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Git command timeout')), timeoutMs)
			)
		]);

		return (result as any).stdout;
	} catch (error) {
		// Git command failed (not a git repo, command error, or timeout)
		if (error instanceof Error) {
			console.warn(`[Prompt Improver] Git command failed: ${error.message}`);
		}
		return null;
	}
}

/**
 * Scan workspace for relevant markdown files that might provide context
 */
async function scanRelevantMarkdownFiles(userPrompt: string): Promise<MarkdownContext> {
	const context: MarkdownContext = {
		files: []
	};

	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return context;
	}

	// Priority markdown files to check (in order of importance)
	const priorityFiles = [
		'.github/copilot-instructions.md',
		'.github/instructions/*.instructions.md',
		'AGENTS.md',
		'README.md',
		'CONTRIBUTING.md',
		'docs/README.md',
		'documentation/README.md'
	];

	// Search for markdown files
	const markdownFiles: vscode.Uri[] = [];

	// First, check priority files
	for (const pattern of priorityFiles) {
		try {
			const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 10);
			markdownFiles.push(...files);
		} catch (error) {
			// File pattern not found, continue
		}
	}

	// Read and analyze files for relevance
	const promptLower = userPrompt.toLowerCase();
	const keywords = extractKeywords(promptLower);

	for (const fileUri of markdownFiles) {
		try {
			const content = await vscode.workspace.fs.readFile(fileUri);
			const text = Buffer.from(content).toString('utf8');

			// Check if file content is relevant to the prompt
			const relevanceScore = calculateRelevance(text.toLowerCase(), keywords);

			if (relevanceScore > 0 || fileUri.path.includes('copilot-instructions') || fileUri.path.includes('AGENTS')) {
				// Always include copilot-instructions and AGENTS files
				// For other files, only include if relevant
				const relativePath = vscode.workspace.asRelativePath(fileUri);

				// Truncate long files to avoid token bloat
				const truncatedContent = text.length > 2000 ? text.substring(0, 2000) + '\n\n[Content truncated...]' : text;

				context.files.push({
					path: relativePath,
					content: truncatedContent,
					relevanceScore
				});
			}
		} catch (error) {
			// Error reading file, skip it
			console.error(`Error reading markdown file ${fileUri.path}:`, error);
		}
	}

	// Sort by relevance score (highest first) and limit to top 3 files
	context.files.sort((a, b) => b.relevanceScore - a.relevanceScore);
	context.files = context.files.slice(0, 3);

	return context;
}

/**
 * Extract keywords from prompt for relevance matching
 */
function extractKeywords(text: string): string[] {
	// Remove common words and extract meaningful keywords
	const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);

	const words = text.split(/\s+/).filter(word =>
		word.length > 2 && !commonWords.has(word)
	);

	return words;
}

/**
 * Calculate relevance score based on keyword matches
 */
function calculateRelevance(content: string, keywords: string[]): number {
	let score = 0;
	for (const keyword of keywords) {
		// Count occurrences of each keyword
		const regex = new RegExp(keyword, 'gi');
		const matches = content.match(regex);
		if (matches) {
			score += matches.length;
		}
	}
	return score;
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
 * Generate a concise summary of the conversation history
 * This helps the LLM understand what the user has been working on
 */
function generateConversationSummary(conversationHistory: ConversationHistory): string {
	if (conversationHistory.requests.length === 0 && conversationHistory.responses.length === 0) {
		return 'No prior conversation.';
	}

	let summary = '';

	// Analyze the conversation to extract key themes
	const allRequests = conversationHistory.requests.map(r => r.prompt).join(' ');
	const allResponses = conversationHistory.responses.join(' ');

	// Count conversation turns
	const turnCount = Math.max(conversationHistory.requests.length, conversationHistory.responses.length);

	summary += `**Conversation Overview:** ${turnCount} exchange${turnCount > 1 ? 's' : ''} in this session.\n\n`;

	// Identify what they're working on based on recent requests
	const recentRequests = conversationHistory.requests.slice(-5);
	if (recentRequests.length > 0) {
		summary += `**Recent Topics:**\n`;
		recentRequests.forEach((req, idx) => {
			const commandPrefix = req.command ? `/${req.command} ` : '';
			// Truncate long prompts but keep them readable
			const truncatedPrompt = req.prompt.length > 80 
				? req.prompt.substring(0, 80) + '...' 
				: req.prompt;
			summary += `${idx + 1}. ${commandPrefix}${truncatedPrompt}\n`;
		});
		summary += '\n';
	}

	// Try to identify the main task
	const taskKeywords = ['create', 'add', 'implement', 'fix', 'update', 'refactor', 'build', 'write', 'generate'];
	const mainTasks: string[] = [];

	for (const req of conversationHistory.requests) {
		const lowerPrompt = req.prompt.toLowerCase();
		for (const keyword of taskKeywords) {
			if (lowerPrompt.includes(keyword)) {
				// Extract a snippet around the keyword
				const index = lowerPrompt.indexOf(keyword);
				const snippet = req.prompt.substring(Math.max(0, index - 10), Math.min(req.prompt.length, index + 60));
				mainTasks.push(snippet.trim());
				break;
			}
		}
	}

	if (mainTasks.length > 0) {
		summary += `**Key Tasks Identified:**\n`;
		// Show up to 3 most recent main tasks
		const recentTasks = mainTasks.slice(-3);
		recentTasks.forEach((task, idx) => {
			summary += `- ${task}\n`;
		});
		summary += '\n';
	}

	return summary;
}

/**
 * Build the prompt for improving user prompts
 */
function buildImprovePrompt(
	userPrompt: string,
	workspaceContext: WorkspaceContext | undefined,
	overridePreset?: string,
	references?: readonly vscode.ChatPromptReference[],
	conversationHistory?: ConversationHistory,
	markdownContext?: MarkdownContext,
	openFileContents?: OpenFileContents,
	gitContext?: GitContext
): string {
	const systemPromptTemplate = getSystemPrompt(overridePreset);

	// Build context strings
	const languages = workspaceContext?.languages.join(', ') || 'Unknown';
	const technologies = workspaceContext?.technologies.join(', ') || 'Unknown';
	const openFiles = workspaceContext?.openFiles.length ? workspaceContext.openFiles.join(', ') : 'None';

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
		historyContext = '\n\n**Conversation Context:**\n';
		historyContext += 'The user has been having a conversation in this chat session. Below is a summary of what they\'re working on:\n\n';

		// Generate a concise summary of the conversation
		const summary = generateConversationSummary(conversationHistory);
		historyContext += summary;

		// Also include the most recent exchange for immediate context
		historyContext += '\n\n**Most Recent Exchange:**\n';
		if (conversationHistory.requests.length > 0) {
			const lastRequest = conversationHistory.requests[conversationHistory.requests.length - 1];
			historyContext += `User: ${lastRequest.command ? `/${lastRequest.command} ` : ''}${lastRequest.prompt}\n`;
		}
		if (conversationHistory.responses.length > 0) {
			const lastResponse = conversationHistory.responses[conversationHistory.responses.length - 1];
			const truncated = lastResponse.length > 300 ? lastResponse.substring(0, 300) + '...' : lastResponse;
			historyContext += `Assistant: ${truncated}\n`;
		}

		historyContext += '\n**Important:** Use this conversation context to ensure the improved prompt is aware of what the user is currently working on and their recent progress.\n';
	}

	// Format markdown context files if any
	let markdownContextSection = '';
	if (markdownContext && markdownContext.files.length > 0) {
		markdownContextSection = '\n\n**Project Documentation & Instructions:**\n';
		markdownContextSection += 'The following documentation files provide context about the project:\n\n';

		for (const file of markdownContext.files) {
			markdownContextSection += `--- ${file.path} ---\n${file.content}\n\n`;
		}

		markdownContextSection += 'Use the information from these files to make the improved prompt more specific and aligned with project conventions.\n';
	}

	// Format open file contents if any
	let openFileContentsSection = '';
	if (openFileContents && openFileContents.files.length > 0) {
		openFileContentsSection = '\n\n**Open File Synopsis:**\n';
		openFileContentsSection += 'The following is an intelligent synopsis of currently open files, showing key code elements (imports, exports, classes, functions, types):\n\n';

		for (const file of openFileContents.files) {
			openFileContentsSection += `--- ${file.path} (${file.language}, ${file.lineCount} lines total) ---\n`;
			openFileContentsSection += `${file.content}\n`;
			if (file.truncated) {
				openFileContentsSection += `\n[Synopsis truncated for brevity]\n`;
			}
			openFileContentsSection += '\n';
		}

		openFileContentsSection += 'Use the structure and patterns from these open files to provide more specific and contextual improvements that align with the existing codebase.\n';
	}

	// Format Git context if any
	let gitContextSection = '';
	if (gitContext && (gitContext.branch || gitContext.status || gitContext.recentCommits)) {
		gitContextSection = '\n\n**Git Context:**\n';

		if (gitContext.branch) {
			gitContextSection += `- Current Branch: ${gitContext.branch}\n`;
		}

		if (gitContext.status) {
			gitContextSection += `- Working Directory Status:\n${gitContext.status}\n`;
		}

		if (gitContext.stagedChanges) {
			gitContextSection += `- Staged Changes:\n${gitContext.stagedChanges}\n`;
		}

		if (gitContext.recentCommits && gitContext.recentCommits.length > 0) {
			gitContextSection += `- Recent Commits (last 10):\n`;
			for (const commit of gitContext.recentCommits) {
				gitContextSection += `  ${commit.hash} - ${commit.message} (${commit.author}, ${commit.date})\n`;
			}
		}

		gitContextSection += '\nUse this Git context to understand what the user is currently working on and recent development activity.\n';
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
- Open Files: ${openFiles}${referencesContext}${historyContext}${markdownContextSection}${openFileContentsSection}${gitContextSection}

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

	try {
		// Get open text editors
		const openEditors = vscode.window.visibleTextEditors;

		if (openEditors.length > 0) {
			const languageSet = new Set<string>();

			for (const editor of openEditors) {
				try {
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
				} catch (editorError) {
					// Error processing individual editor, skip it
					console.warn('[Prompt Improver] Error processing editor:', editorError);
					continue;
				}
			}

			context.languages = Array.from(languageSet);
		}

		// Try to detect technologies from workspace files
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			try {
				const technologies = await detectTechnologies(workspaceFolders[0]);
				context.technologies = technologies;
			} catch (techError) {
				// Error detecting technologies, continue with empty array
				console.warn('[Prompt Improver] Error detecting technologies:', techError);
			}
		}
	} catch (error) {
		// Error gathering workspace context
		console.error('[Prompt Improver] Error gathering workspace context:', error);
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
 * Check if the response stream is still open and safe to write to
 */
function isStreamOpen(stream: vscode.ChatResponseStream): boolean {
	try {
		// Try to access a property to see if stream is still valid
		// This is a defensive check - if the stream is closed, accessing it may throw
		return stream !== null && stream !== undefined;
	} catch {
		return false;
	}
}

/**
 * Safely write to stream with error handling
 */
function safeStreamWrite(stream: vscode.ChatResponseStream, content: string, type: 'markdown' | 'progress' = 'markdown'): boolean {
	try {
		if (!isStreamOpen(stream)) {
			console.warn('[Prompt Improver] Attempted to write to closed stream');
			return false;
		}

		if (type === 'markdown') {
			stream.markdown(content);
		} else {
			stream.progress(content);
		}
		return true;
	} catch (error) {
		// Stream is closed or invalid
		if (error instanceof Error && error.message.includes('closed')) {
			console.warn('[Prompt Improver] Stream was closed during write operation');
		} else {
			console.error('[Prompt Improver] Error writing to stream:', error);
		}
		return false;
	}
}

/**
 * Check if operation was cancelled
 */
function isCancelled(token: vscode.CancellationToken): boolean {
	return token.isCancellationRequested;
}

/**
 * Handle errors and display user-friendly messages
 */
function handleError(error: unknown, stream: vscode.ChatResponseStream): void {
	// Check if stream is still open before trying to write
	if (!isStreamOpen(stream)) {
		console.error('[Prompt Improver] Cannot display error - stream is closed:', error);
		return;
	}

	if (error instanceof vscode.LanguageModelError) {
		console.error('[Prompt Improver] Language Model Error:', error.message, error.code);

		// Check error codes using string comparison
		if (error.code === 'notFound') {
			safeStreamWrite(stream, '⚠️ **No language model found.** Please ensure GitHub Copilot is installed and active.\n\n');
		} else if (error.code === 'blocked') {
			safeStreamWrite(stream, '⚠️ **Request blocked.** The prompt might contain sensitive content. Try rephrasing your request.\n\n');
		} else if (error.code === 'noPermissions') {
			safeStreamWrite(stream, '⚠️ **No permissions.** Please check your GitHub Copilot subscription is active.\n\n');
		} else if (error.code === 'rateLimited') {
			safeStreamWrite(stream, '⚠️ **Rate limited.** Too many requests. Please wait a moment and try again.\n\n');
		} else {
			safeStreamWrite(stream, `⚠️ **Language model error:** ${error.message}\n\n`);
		}
	} else if (error instanceof Error) {
		console.error('[Prompt Improver] Error:', error.message, error.stack);

		// Handle specific error types
		if (error.message.includes('closed') || error.message.includes('stream')) {
			// Stream was closed (user cancelled or navigated away)
			console.warn('[Prompt Improver] Operation cancelled - stream closed');
			// Don't try to write to stream if it's a stream error
			return;
		} else if (error.message.includes('No lowest priority node found') || error.message.includes('priority node')) {
			// VS Code's workspace tools system has a bug
			safeStreamWrite(stream, '⚠️ **VS Code Workspace Tools Error**\n\n');
			safeStreamWrite(stream, 'VS Code\'s experimental workspace tools system encountered an internal error. This is a known issue with VS Code, not the Prompt Improver extension.\n\n');
			safeStreamWrite(stream, '**Workaround:** Disable the "Use Workspace Tools" setting:\n');
			safeStreamWrite(stream, '1. Open Settings (Ctrl+,)\n');
			safeStreamWrite(stream, '2. Search for "Prompt Improver: Use Workspace Tools"\n');
			safeStreamWrite(stream, '3. Uncheck the box\n\n');
			safeStreamWrite(stream, 'The extension will still gather rich context using its built-in context gathering features.\n\n');
		} else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
			safeStreamWrite(stream, '⚠️ **Request timeout.** The operation took too long. Please try again.\n\n');
		} else if (error.message.includes('ENOENT') || error.message.includes('not found')) {
			safeStreamWrite(stream, '⚠️ **File not found.** The requested file or resource could not be found.\n\n');
		} else if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
			safeStreamWrite(stream, '⚠️ **Permission denied.** Cannot access the requested resource.\n\n');
		} else if (error.message.includes('git')) {
			safeStreamWrite(stream, '⚠️ **Git error.** Could not retrieve Git context. Continuing without Git information.\n\n');
		} else {
			safeStreamWrite(stream, `⚠️ **Error:** ${error.message}\n\nPlease try again or check the console for more details.\n\n`);
		}
	} else {
		console.error('[Prompt Improver] Unexpected error:', error);
		safeStreamWrite(stream, '⚠️ **An unexpected error occurred.** Please try again.\n\n');
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

interface MarkdownContext {
	files: Array<{
		path: string;
		content: string;
		relevanceScore: number;
	}>;
}

interface OpenFileContents {
	files: Array<{
		path: string;
		content: string;
		language: string;
		lineCount: number;
		truncated: boolean;
	}>;
}

interface GitContext {
	branch?: string;
	status?: string;
	stagedChanges?: string;
	recentCommits?: Array<{
		hash: string;
		message: string;
		author: string;
		date: string;
	}>;
}

// This method is called when your extension is deactivated
export function deactivate() {}

