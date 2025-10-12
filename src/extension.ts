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
	updateSystemPromptDisplay();

	// Watch for configuration changes
	const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('promptImprover.systemPromptPreset')) {
			// When preset changes, update the systemPrompt display
			updateSystemPromptDisplay();
		} else if (e.affectsConfiguration('promptImprover.systemPrompt')) {
			// When systemPrompt is edited manually, check if it differs from current preset
			handleSystemPromptEdit();
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

	// Command to list available models (for debugging/info)
	const listModelsCommand = vscode.commands.registerCommand('prompt-improver.listAvailableModels', async () => {
		const models = await vscode.lm.selectChatModels({});
		const modelInfo = models.map(m => `${m.vendor}/${m.family} (${m.id})`).join('\n');
		vscode.window.showInformationMessage(`Available Models:\n${modelInfo}`, { modal: true });
	});

	context.subscriptions.push(participant, copyCommand, configWatcher, listModelsCommand);
}

/**
 * Get the configured language model based on user settings
 */
async function getConfiguredModel(): Promise<vscode.LanguageModelChat | undefined> {
	const config = vscode.workspace.getConfiguration('promptImprover');
	const vendor = config.get<string>('modelVendor', 'copilot');
	const family = config.get<string>('modelFamily', 'gpt-4o');

	// Build selector options
	const selector: { vendor?: string; family?: string } = {};
	
	if (vendor !== 'auto') {
		selector.vendor = vendor;
	}
	
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
		} else {
			// Default to improve command
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
	token: vscode.CancellationToken
): Promise<void> {
	
	const userPrompt = request.prompt;

	if (!userPrompt || userPrompt.trim().length === 0) {
		stream.markdown('Please provide a prompt that you want me to improve.\n\n');
		stream.markdown('**Example usage:**\n');
		stream.markdown('```\n@prompt-improver /improve write a function\n```\n');
		return;
	}

	// Gather workspace context
	stream.progress('Gathering workspace context...');
	const workspaceContext = await gatherWorkspaceContext();

	// Build the prompt for the LLM
	const systemPrompt = buildImprovePrompt(userPrompt, workspaceContext);

	// Get the configured language model
	const model = await getConfiguredModel();

	if (!model) {
		stream.markdown('⚠️ No language model available. Please ensure GitHub Copilot is installed and authenticated, or check your model settings.');
		return;
	}

	// Create messages for the LLM
	const messages = [
		vscode.LanguageModelChatMessage.User(systemPrompt)
	];

	stream.progress('Improving your prompt...');

	// Send request to language model
	const chatResponse = await model.sendRequest(messages, {}, token);

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

Analyze the user's prompt and enhance it by:
1. **Increasing clarity**: Make the intent immediately obvious
2. **Adding specificity**: Replace vague terms with concrete requirements
3. **Structuring information**: Use formatting to organize complex requests
4. **Defining output expectations**: Specify what format or level of detail is needed
5. **Removing ambiguity**: Ensure there's only one clear interpretation

Return ONLY the improved prompt text itself (no meta-commentary, quotes, code blocks, or explanations).`,

	'context-aware': `You are an expert at crafting context-aware prompts for AI coding assistants.

Your task is to enhance prompts using workspace context to maximize effectiveness.

**Analysis:**
- Evaluate clarity, specificity, completeness, and technical accuracy
- Identify missing context that could improve the response

**Enhancement:**
- **Leverage context**: Incorporate programming languages ({languages}), frameworks ({technologies}), and relevant open files ({openFiles}) when applicable
- **Increase specificity**: Replace vague terms with concrete requirements
- **Add constraints**: Include compatibility, performance, or style requirements based on the tech stack
- **Structure clearly**: Use formatting for complex requirements
- **Specify expectations**: State desired output format and level of detail
- **Reference patterns**: Mention existing code patterns or conventions when relevant

**Output:**
Return ONLY the improved prompt text (no meta-commentary, quotes, or code blocks).`,

	'concise': `Improve this coding prompt by making it more specific, clear, and actionable. Keep it concise.

Return ONLY the improved prompt text.`
};

/**
 * Update the systemPrompt setting to show the current preset content
 */
function updateSystemPromptDisplay() {
	const config = vscode.workspace.getConfiguration('promptImprover');
	const preset = config.get<string>('systemPromptPreset', 'context-aware');
	
	let displayPrompt = '';
	
	if (preset === 'custom') {
		// For custom, show the stored custom prompt
		displayPrompt = config.get<string>('customSystemPrompt', '');
	} else {
		// For presets, show the preset content
		displayPrompt = SYSTEM_PROMPT_PRESETS[preset] || SYSTEM_PROMPT_PRESETS['context-aware'];
	}
	
	// Update the systemPrompt setting (silently, without triggering change event recursion)
	const currentSystemPrompt = config.get<string>('systemPrompt', '');
	if (currentSystemPrompt !== displayPrompt) {
		config.update('systemPrompt', displayPrompt, vscode.ConfigurationTarget.Global);
	}
}

/**
 * Handle manual edits to the systemPrompt setting
 */
function handleSystemPromptEdit() {
	const config = vscode.workspace.getConfiguration('promptImprover');
	const currentPreset = config.get<string>('systemPromptPreset', 'context-aware');
	const editedPrompt = config.get<string>('systemPrompt', '');
	
	// Check if the edited prompt differs from the current preset
	let presetPrompt = '';
	if (currentPreset === 'custom') {
		presetPrompt = config.get<string>('customSystemPrompt', '');
	} else {
		presetPrompt = SYSTEM_PROMPT_PRESETS[currentPreset] || '';
	}
	
	// If user edited the prompt and it's different from the preset, switch to custom
	if (editedPrompt !== presetPrompt && currentPreset !== 'custom') {
		// Save the edited prompt as the custom prompt
		config.update('customSystemPrompt', editedPrompt, vscode.ConfigurationTarget.Global);
		// Switch to custom preset
		config.update('systemPromptPreset', 'custom', vscode.ConfigurationTarget.Global);
		vscode.window.showInformationMessage('Switched to custom system prompt preset');
	} else if (currentPreset === 'custom' && editedPrompt !== presetPrompt) {
		// Update the custom prompt storage
		config.update('customSystemPrompt', editedPrompt, vscode.ConfigurationTarget.Global);
	}
}

/**
 * Get the system prompt based on user configuration
 */
function getSystemPrompt(): string {
	const config = vscode.workspace.getConfiguration('promptImprover');
	const preset = config.get<string>('systemPromptPreset', 'context-aware');

	// If custom preset, use the custom prompt
	if (preset === 'custom') {
		const customPrompt = config.get<string>('customSystemPrompt', '');
		if (customPrompt.trim()) {
			return customPrompt;
		}
		// Fallback to context-aware if custom is empty
		console.warn('Custom prompt selected but customSystemPrompt is empty. Using context-aware preset.');
	}

	// Return the appropriate preset
	return SYSTEM_PROMPT_PRESETS[preset] || SYSTEM_PROMPT_PRESETS['context-aware'];
}

/**
 * Build the prompt for improving user prompts
 */
function buildImprovePrompt(userPrompt: string, workspaceContext: WorkspaceContext): string {
	const systemPromptTemplate = getSystemPrompt();
	
	// Build context strings
	const languages = workspaceContext.languages.join(', ') || 'Unknown';
	const technologies = workspaceContext.technologies.join(', ') || 'Unknown';
	const openFiles = workspaceContext.openFiles.length > 0 ? workspaceContext.openFiles.join(', ') : 'None';
	
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
- Open Files: ${openFiles}

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

// This method is called when your extension is deactivated
export function deactivate() {}

