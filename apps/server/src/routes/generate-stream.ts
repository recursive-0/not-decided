
export async function generateStream(req: Request): Promise<Response> {

    const url = new URL(req.url)
    const streamId = url.pathname.split('/').pop()

    console.log("stream id from the url is", streamId)

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const tokens = "This is a test response from your AI assistant. I'm streaming token by token to demonstrate SSE.".split(' ');
                
                for (const token of tokens) {
                  controller.enqueue(`data: ${token} \n\n`);
                  await new Promise(resolve => setTimeout(resolve, 50));
                }
                
                controller.enqueue(`data: [DONE]\n\n`);
                controller.close();
              } catch (error) {
                console.error("Stream error:", error);
                controller.error(error);
              }
        },
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    })
}