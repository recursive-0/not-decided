import Anthropic from '@anthropic-ai/sdk';
import { wrisorChatModePrompt } from '../prompts/wrisor-chatmode-prompt-v1';
import { Env } from '../../worker-configuration';
import { wrisorSystemPromptV1 } from '../prompts/wrisor-composer-prompt-v1';

let claudeClient: Anthropic | null = null;

export function getClient(env: Env): Anthropic {
	if (claudeClient === null) {
		console.log('Initializing Anthropic AI Client for this isolate...');
		if (!env.GEMINI_API_KEY) {
			throw new Error('Missing ANTHROPIC_API_KEY secret in environment configuration!');
		}
		claudeClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
	}
	return claudeClient;
}

interface HandleClaudeStreamProps {
	prompt: string;
	chatMode: 'CHAT' | 'COMPOSER';
	contentNodes: any;
	env: Env;
}

export async function handleClaudeStream(props: HandleClaudeStreamProps) {
	console.log('PROPS are: ', props.env);

	if (!claudeClient) {
    console.log("Claude client does not exist hence creating the instance")
		getClient(props.env);
	}

	const { prompt, chatMode, contentNodes } = props;

	const systemPrompt = chatMode === 'CHAT' ? wrisorChatModePrompt() : wrisorSystemPromptV1(prompt, contentNodes);

	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			try {
				controller.enqueue(encoder.encode(`data: START_STREAM \n\n`));

				const tokens = await claudeClient!.messages.countTokens({
					messages: [{ role: 'user', content: prompt }],
					system: systemPrompt,
					model: 'claude-3-7-sonnet-20250219',
				});

				console.log('INPUT TOKENS ARE: ', tokens);

				const messageStream = await claudeClient!.messages.stream({
					messages: [{ role: 'user', content: prompt }],
					system: systemPrompt,
					model: 'claude-3-7-sonnet-20250219',
					max_tokens: 8000,
				});

				// Create a separate handler function with the correct controller reference
				const handleText = (text: string) => {
					const safeText = text
					.replace(/\n/g, "\\n")
					.replace(/\r/g, "\\r")
					.replace(/\t/g, "\\t");
					console.log("SAFE TEXT IS: ", safeText)
					const sseMessage = `data: ${safeText}\n\n`;
					controller.enqueue(encoder.encode(sseMessage));
				};

				// Use the handler
				messageStream.on('text', handleText);

				// Wait for the stream to complete
				await messageStream.finalMessage();

				console.log('calling close');
				controller.enqueue(encoder.encode(`data: [DONE] \n\n`));
				controller.close();
			} catch (error) {
				console.error('Error while streaming with Claude', error);
				controller.error(error);
			}
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
}
