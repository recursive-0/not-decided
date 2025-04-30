import { Env } from '../worker-configuration';
import { generateStream } from './routes/generate-stream';
import { initializeStream } from './routes/init-stream';

function cors(handler: (req: Request, env: Env, ctx: ExecutionContext) => Promise<Response>) {
    return async (req: Request, env: Env, ctx: ExecutionContext) => {

        const corsHeadersConfig: HeadersInit = {
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Origin': "*", 
        };

        if (req.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeadersConfig,
            });
        }

        const response = await handler(req, env, ctx);

        const finalHeaders = new Headers(response.headers); // This properly copies original headers

        finalHeaders.set('Access-Control-Allow-Origin', corsHeadersConfig['Access-Control-Allow-Origin']);


        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: finalHeaders, 
        });
    };
}

const initializeStreamWithCors = cors(initializeStream);
const generateStreamWithCors = cors(generateStream);

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		console.log(`Request: ${request.method} ${pathname}`);

		switch (pathname) {
			case '/':
				return cors(async () => new Response('Hello World!'))(request, env, ctx);

			case '/favicon.ico':
				return new Response(null, { status: 204 });

			case '/api/init/stream':
				return initializeStreamWithCors(request, env, ctx);

			case '/api/generate/stream':
				return generateStreamWithCors(request, env, ctx);

			default:
				return cors(async () => new Response('Not Found', { status: 404 }))(request, env, ctx);
		}
	},
} satisfies ExportedHandler<Env>;
