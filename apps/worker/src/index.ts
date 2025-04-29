/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Env } from "../worker-configuration";
import { generateStream } from "./routes/generate-stream";
import { initializeStream } from "./routes/init-stream";

function cors(handler: (req: Request, env: Env, ctx: ExecutionContext) => Promise<Response>){

    console.log("inside cors")
    return async (req: Request, env: Env, ctx: ExecutionContext) => {
        if(req.method === "OPTIONS"){
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Origin": "http://localhost:3000",
                    "Access-Control-Allow-Methods": "*",
                     "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            })
        }

        const response = await handler(req, env, ctx)

        const headers = new Headers(response.headers)
        headers.set("Access-Control-Allow-Origin", "http://localhost:3000")

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        })
    }
}


const initializeStreamWithCors = cors(initializeStream)
const generateStreamWithCors = cors(generateStream)

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url)
		console.log("URL is: ", url)
		const pathname = url.pathname
		console.log("pathname is: ", pathname)
		console.log("env is: ", env)
		console.log("CTX IS: ", ctx)


		switch(pathname){
			case "/":
			return new Response('Hello World!')
			case "/favicon.ico":
			return new Response('FAVICON ICO!!!')
			case "/api/init/stream":
			return await initializeStreamWithCors(request, env as Env, ctx)
			case "/api/generate/stream":
			return await generateStreamWithCors(request, env as Env, ctx)
		}

		return new Response('Hello World!');
	},
} satisfies ExportedHandler;
