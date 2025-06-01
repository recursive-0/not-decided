import { Env } from '../worker-configuration';
import { createDB, DB } from './db';
import { generateStream } from './routes/generate-stream';
import { googleSignIn } from './routes/google-login';
import { initializeStream } from './routes/init-stream';

const ALLOWED_ORIGINS = ['https://wrisor-dev.pages.dev', 'http://localhost:5173'];

function cors(handler: (req: Request, env: Env, ctx: ExecutionContext, db: DB) => Promise<Response>) {
	return async (req: Request, env: Env, ctx: ExecutionContext, db: DB) => {
		const requestOrigin = req.headers.get('Origin');
		let responseOrigin = '';

		if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
			responseOrigin = requestOrigin;
		} else {
			console.log(`Origin ${requestOrigin} not allowed by CORS policy.`);
		}

		const corsHeaders: HeadersInit = {
			'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		if (responseOrigin) {
			corsHeaders['Access-Control-Allow-Origin'] = responseOrigin;
		}

		if (req.method === 'OPTIONS') {
			if (responseOrigin) {
				return new Response(null, {
					status: 204,
					headers: corsHeaders,
				});
			} else {
				return new Response('CORS policy does not allow this origin for OPTIONS', { status: 403 });
			}
		}

		const response = await handler(req, env, ctx, db);

		const finalHeaders = new Headers(response.headers);

		if (responseOrigin) {
			finalHeaders.set('Access-Control-Allow-Origin', responseOrigin);
		} else {
			finalHeaders.delete('Access-Control-Allow-Origin');
		}

		finalHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']!);

		finalHeaders.append('Vary', 'Origin');

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: finalHeaders,
		});
	};
}

const initializeStreamWithCors = cors(initializeStream);
const generateStreamWithCors = cors(generateStream);
const googleSignInWithCors = cors(googleSignIn)

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const db = createDB(env)
		console.log(`Request: ${request.method} ${pathname}`);

		switch (pathname) {
			case '/':
				return cors(async () => new Response('Hello World!'))(request, env, ctx, db);

			case '/favicon.ico':
				return new Response(null, { status: 204 });

			case '/api/init/stream':
				return initializeStreamWithCors(request, env, ctx, db);

			case '/api/generate/stream':
				return generateStreamWithCors(request, env, ctx, db);

			case '/api/auth/google':
				return googleSignInWithCors(request, env, ctx, db)

			default:
				return cors(async () => new Response('Not Found', { status: 404 }))(request, env, ctx, db);
		}
	},
} satisfies ExportedHandler<Env>;
