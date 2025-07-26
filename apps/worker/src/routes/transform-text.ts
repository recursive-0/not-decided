import z from "zod";
import { Env } from "../../worker-configuration";
import { callGemini } from "../ai-models/gemini";
import { transformTextSystemPrompt } from "../prompts/wrisor-transform-text-prompt";
import type { CursorContextType, NodeContextType } from './../types';

interface TransformTextRequest {
    userPrompt: string;
    selectedText: string;
    selectedNodes: NodeContextType[];
    cursorContext: CursorContextType;
    focusPoints: {
        from: number;
        to: number;
    };
}

const transformRequestSchema = z.object({
    userPrompt: z.string(),
    selectedText: z.string(),
    selectedNodes: z.array(z.custom<NodeContextType>()),
    cursorContext: z.custom<CursorContextType>(),
    focusPoints: z.object({
        from: z.number(),
        to: z.number(),
    })
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

    const { userPrompt, cursorContext, selectedText, selectedNodes, focusPoints } = parsedBody.data

    console.log("Cursor context is: ", cursorContext)

    const systemPromptProps = {
        userQuery: userPrompt,
        currentNode: cursorContext.currentNode.text,
        precedingNode: cursorContext.precedingNode ? cursorContext.precedingNode.text : "",
        followingNode: cursorContext.followingNode ? cursorContext.followingNode.text : "",
        selectedText: selectedText,
        selectedNodes: selectedNodes,
        documentContentNodes: cursorContext.documentContext,
        cursorPos: cursorContext.cursorPos,
        focusPoints: focusPoints
    }
    const systemPrompt = transformTextSystemPrompt(systemPromptProps)

    console.log("Caling claude in transform text")
    console.log("ENVS are: ", env)
    try{
        const response = await callGemini(userPrompt, systemPrompt, env)
        return new Response(JSON.stringify({ transformedText: response }), { status: 200 })
    } catch (error) {
        console.log("Error calling claude: ", error)
        return new Response(JSON.stringify({ error: "Failed to transform text" }), { status: 500 })
    }
}

