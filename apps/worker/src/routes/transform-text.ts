import z from "zod";
import { Env } from "../../worker-configuration";
import { callClaude } from "../ai-models/claude";
import { transformTextSystemPrompt } from "../prompts/wrisor-transform-text-prompt";
import type { CursorContextType } from './../types';

interface TransformTextRequest {
    prompt: string;
    cursorContext: CursorContextType;
}

const transformRequestSchema = z.object({
    prompt: z.string(),
    cursorContext: z.custom<CursorContextType>()
})


export async function transformText(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

    let rawBody: TransformTextRequest | null = null;

    try{
        rawBody = await req.json()
    } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 })
    }

    console.log("Raw body is: ", rawBody)

    const parsedBody = transformRequestSchema.safeParse(rawBody)
    if(!parsedBody.success){
        return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 })
    }

    const { prompt, cursorContext } = parsedBody.data

    console.log("Cursor context is: ", cursorContext)

    const systemPromptProps = {
        userQuery: prompt,
        currentNode: cursorContext.currentNode.text,
        precedingNode: cursorContext.precedingNode.text,
        followingNode: cursorContext.followingNode.text,
        selectedText: cursorContext.selectedText,
        documentContext: cursorContext.documentContext,
        cursorPos: cursorContext.cursorPos,
    }
    const systemPrompt = transformTextSystemPrompt(systemPromptProps)

    console.log("Caling claude in transform text")
    console.log("ENVS are: ", env)
    try{
        const response = await callClaude(prompt, systemPrompt, env)
        return new Response(JSON.stringify({ transformedText: response }), { status: 200 })
    } catch (error) {
        console.log("Error calling claude: ", error)
        return new Response(JSON.stringify({ error: "Failed to transform text" }), { status: 500 })
    }
}

