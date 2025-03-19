import { userPrompts } from "../..";
import { handleDeepseekStream, streamWithDeepseek } from "../ai-models/deepseek";

export async function generateStream(req: Request): Promise<Response> {
    const url = new URL(req.url);
    console.log("url is",)
    const streamId = url.pathname.split('/').pop();
    const prompt = userPrompts.get(streamId!)

    try {
        return await handleDeepseekStream({prompt: prompt!});
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