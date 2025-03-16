import type { BunRequest } from "bun"


interface InitializeStreamRequestType {
    prompt: string
}

export async function initializeStream(req: Request): Promise<Response> {

    const body = await req.json()
    const { prompt } = body
    console.log("prommpt is", prompt)
    const streamId = crypto.randomUUID()
    console.log("stream id is", streamId)

    return Response.json({streamId})
}