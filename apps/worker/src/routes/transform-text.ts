import z from "zod";
import { Env } from "../../worker-configuration";
import { callClaude } from "../ai-models/claude";
import { transformTextUserPrompt, wrisorTransformTextPrompt } from "../prompts/wrisor-transform-text-prompt";

interface TransformTextRequest {
    prompt: string;
    selectedText: string;
    context: string;
}

const transformRequestSchema = z.object({
    prompt: z.string(),
    selectedText: z.string(),
    context: z.string(),
})


export async function transformText(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

    let rawBody: TransformTextRequest | null = null;

    try{
        rawBody = await req.json()
    } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 })
    }

    const parsedBody = transformRequestSchema.safeParse(rawBody)
    if(!parsedBody.success){
        return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 })
    }

    const { prompt, selectedText, context } = parsedBody.data
    const userPrompt = transformTextUserPrompt(prompt, selectedText, context)
    const systemPrompt = wrisorTransformTextPrompt()

    console.log("Caling claude in transform text")
    try{
        const response = await callClaude(userPrompt, systemPrompt, env)
        return new Response(JSON.stringify({ transformedText: response }), { status: 200 })
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to transform text" }), { status: 500 })
    }

}

