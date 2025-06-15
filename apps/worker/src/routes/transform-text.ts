import z from "zod";
import { Env } from "../../worker-configuration";
import { callClaude } from "../ai-models/claude";
import { transformTextSystemPrompt } from "../prompts/wrisor-transform-text-prompt";

interface TransformTextRequest {
    prompt: string;
    selectedText: string;
    surroundingContext: string
    context: string;
}

const transformRequestSchema = z.object({
    prompt: z.string(),
    selectedText: z.string(),
    surroundingContext: z.string(),
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

    const { prompt, selectedText, surroundingContext, context } = parsedBody.data
    const systemPromptProps = {
        userQuery: prompt,
        selectedText,
        surroundingContext,
        documentContext: context,
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

