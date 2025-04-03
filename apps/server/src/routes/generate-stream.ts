import { userPrompts } from "../..";
import { handleClaudeStream } from "../ai-models/claude";
import { handleDeepseekStream, streamWithDeepseek } from "../ai-models/deepseek";
import { simpleStaticStream } from "./simple-static-stream";

export async function generateStream(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const streamId = url.pathname.split('/').pop();
    const prompt = userPrompts.get(streamId!)

    try {
        return await handleClaudeStream({prompt: prompt!});
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error }), 
            { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
}