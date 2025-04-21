import { userPrompts } from "../..";
import { handleClaudeStream } from "../ai-models/claude";
import { handleDeepseekStream, streamWithDeepseek } from "../ai-models/deepseek";
import { handleGeminiStream } from "../ai-models/gemini";
import { handleGroqStream } from "../ai-models/groq";
import { simpleStaticStream } from "./simple-static-stream";

export async function generateStream(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const streamId = url.pathname.split('/').pop();
    if(!streamId){
        throw new Error("StreamID is required!")
    }
    
    // Get the tuple from the map
    const promptData = userPrompts.get(streamId);
    if (!promptData) {
        throw new Error("No prompt found for the given streamId!");
    }
    
    // Destructure the tuple properly
    const [prompt, chatMode, contentNodes] = promptData;

    console.log("Content nodes are: ", contentNodes)

    try {
        return await handleDeepseekStream({prompt, chatMode: chatMode as "CHAT" | "COMPOSER", contentNodes: contentNodes});
        // return await simpleStaticStream()
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