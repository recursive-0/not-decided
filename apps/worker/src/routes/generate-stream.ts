import { Env } from '../../worker-configuration';
import { handleClaudeStream } from '../ai-models/claude';
import { handleDeepseekStream } from '../ai-models/deepseek';
import { handleGeminiStream } from '../ai-models/gemini';
import { simpleStaticStream } from '../lib/simple-static-stream';

export async function generateStream(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(req.url);
	const streamId = url.searchParams.get('streamID');
	if (!streamId) {
		return Response.json('Stream ID not found. Please try again with a new query!', { status: 400 });
	}
	// Get the tuple from the map
	console.log('INside the worker generate stream');
	const promptData = await env.STREAM_CONTEXT_STORE.get(streamId);

	if (!promptData) {
		throw new Error('No prompt found for the given streamId!');
	}

	// Destructure the tuple properly
	const { prompt, chatMode, contentNodes } = JSON.parse(promptData);

	console.log('Content nodes are: ', contentNodes);

	try {
		return await handleGeminiStream({ prompt, chatMode: chatMode as 'CHAT' | 'COMPOSER', contentNodes: contentNodes, env: env });
		// return await simpleStaticStream()
	} catch (error) {
		console.log("Stringify Error: ", JSON.stringify(error))
		return Response.json(
			{ error: error },
			{
				status: 500,
			}
		);
	}
}
