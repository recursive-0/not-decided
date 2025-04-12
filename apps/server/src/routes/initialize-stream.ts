import type { BunRequest } from "bun"
import { userPrompts } from "../.."


interface InitializeStreamRequestType {
    prompt: string
}

export async function initializeStream(req: Request): Promise<Response> {

    console.log("inside init stream")

    const body = await req.json()
    const { prompt, chatMode, contentNodes } = body
    const streamId = crypto.randomUUID()

    userPrompts.set(streamId, [prompt, chatMode, contentNodes])

    return Response.json({streamId})
}