import { z } from "zod"
import { Env } from "../../worker-configuration";
import { drizzle } from "drizzle-orm/d1";
import { messages } from "../db/schema";



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

    console.log("ENVs re: ", env)
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
    const streamId = crypto.randomUUID()

    try{
        await env.STREAM_CONTEXT_STORE.put(streamId, JSON.stringify({prompt: prompt, chatMode: chatMode, contentNodes: contentNodes}))
    } catch (error){
        console.error("KV Error: Failed to put init stream data into kv store")
        return Response.json({
            status: "error",
            error: "Error storing message. Please try again later!"
        })
    }
    const db = drizzle(env.DB_DEV)

    const userMessagePersistencePromise = db.insert(messages).values({
        messageId: crypto.randomUUID(),
        documentId: crypto.randomUUID(),
        timestamp: new Date(),
        mode: chatMode,
        role: 'user',
        content: prompt,
    }).execute().catch(error => {
        console.error("BACKGROUND D1 ERROR: Failed to insert initial user message:", error);
        return Response.json({
            status: "error",
            error: "Error storing message. Please try again later!"
        })
    })
    ctx.waitUntil(userMessagePersistencePromise)

    return Response.json({streamId})
}