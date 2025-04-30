import { z } from "zod"
import { Env } from "../../worker-configuration";


interface InitializeStreamBodyType {
    prompt: string,
    chatMode: "CHAT" | "COMPOSER",
    contentNodes: any
}

const initializeStreamBodySchema = z.object({
    prompt: z.string().min(1, "Prompt is required!"),
    chatMode: z.union([z.literal("CHAT"), z.literal("COMPOSER")]),
    contentNodes: z.array(z.object({
        id: z.string().min(1, "node ID can't be null or empty"),
        content: z.any()
    }))
})


export async function initializeStream(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {

    console.log("inside init stream")
    let rawBody: InitializeStreamBodyType | null;
    try{
        rawBody = await request.json()
    }catch(e){
        return new Response('Invalid JSON body', { status: 400})
    }

    const validation = initializeStreamBodySchema.safeParse(rawBody)
    if(!validation.success){
        console.error("Body validation failed in InitializeStream Route", validation.error.flatten())
        return Response.json({error: "Invalid Request Body", errorDetails: validation.error.flatten()}, {status: 400})
    }

    const { prompt, chatMode, contentNodes } = validation.data
    console.log("CONTENT NODES are: ", contentNodes)
    // now we need to store this prompt, cotnent nodes and the chatmode against this streamID somehow because we will need to access them when we generate the resonse for the actual serevr side event request
    // 
    const streamId = crypto.randomUUID()
    await env.STREAM_CONTEXT_STORE.put(streamId, JSON.stringify({prompt: prompt, chatMode: chatMode, contentNodes: contentNodes}))
    return Response.json({streamId})
}