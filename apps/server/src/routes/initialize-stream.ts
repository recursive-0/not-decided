import type { BunRequest } from "bun"
import { userPrompts } from "../.."


interface InitializeStreamRequestType {
    prompt: string
}

export async function initializeStream(req: Request): Promise<Response> {

    const body = await req.json()
    const { prompt } = body
    const streamId = crypto.randomUUID()

    userPrompts.set(streamId, prompt)

    return Response.json({streamId})
}