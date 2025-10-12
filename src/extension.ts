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

	// Register the copy command
	const copyCommand = vscode.commands.registerCommand('prompt-improver.copyImprovedPrompt', async (improvedPrompt: string) => {
		await vscode.env.clipboard.writeText(improvedPrompt);
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

	context.subscriptions.push(participant, copyCommand);
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

	// Get the language model
	const models = await vscode.lm.selectChatModels({
		vendor: 'copilot',
		family: 'gpt-4o'
	});

	if (models.length === 0) {
		stream.markdown('⚠️ No language model available. Please ensure GitHub Copilot is installed and authenticated.');
		return;
	}

	const model = models[0];

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
	
	// Add a copy button
	stream.button({
		command: 'prompt-improver.copyImprovedPrompt',
		title: vscode.l10n.t('📋 Copy to Clipboard'),
		arguments: [improvedPrompt]
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

	// Get the language model
	const models = await vscode.lm.selectChatModels({
		vendor: 'copilot',
		family: 'gpt-4o'
	});

	if (models.length === 0) {
		stream.markdown('⚠️ No language model available. Please ensure GitHub Copilot is installed and authenticated.');
		return;
	}

	const model = models[0];

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
 * Build the prompt for improving user prompts
 */
function buildImprovePrompt(userPrompt: string, workspaceContext: WorkspaceContext): string {
	return `You are an expert at crafting effective prompts for AI coding assistants like GitHub Copilot.

Your task is to improve the following prompt to make it more effective for getting better AI responses.

**Original Prompt:**
${userPrompt}

**Workspace Context:**
- Programming Languages: ${workspaceContext.languages.join(', ') || 'Unknown'}
- Frameworks/Technologies: ${workspaceContext.technologies.join(', ') || 'Unknown'}
- Open Files: ${workspaceContext.openFiles.length > 0 ? workspaceContext.openFiles.join(', ') : 'None'}

**Instructions:**
1. Analyze the original prompt for clarity, specificity, and completeness
2. Improve the prompt by:
   - Making it more specific and clear
   - Adding relevant context from the workspace when appropriate
   - Including best practices or constraints that would help
   - Structuring it for better readability
3. Present ONLY the improved prompt in a clear, actionable format
4. After the improved prompt, add a brief "Key Improvements" section explaining what was changed

**Important:** Focus on making the prompt work better with coding assistants. Consider:
- Technical precision
- Clear requirements
- Appropriate scope
- Relevant constraints
- Expected output format

Provide the improved prompt now:`;
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

