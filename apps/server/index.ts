import { generateStream } from "./src/routes/generate-stream";
import { initializeStream } from "./src/routes/initialize-stream";
import { testSimpleStream } from "./src/routes/test-simple-stream";


export const userPrompts = new Map<string, [string, string]>()

function cors(handler: (req: Request) => Response | Promise<Response>){

    console.log("inside cors")
    return async (req: Request) => {
        if(req.method === "OPTIONS"){
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "http://localhost:3000",
                    "Access-Control-Allow-Methods": "*",
                     "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            })
        }

        const response = await handler(req)

        const headers = new Headers(response.headers)
        headers.set("Access-Control-Allow-Origin", "http://localhost:3000")

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        })
    }
}

Bun.serve({
    port: 3007,
    routes: {
        "/api/generate/init": cors(initializeStream),
        "/api/generate/stream/:streamId": cors(generateStream),
    },
    idleTimeout: 200
})