import { z } from 'zod';
import { Env } from '../../worker-configuration';
import { DB } from '../db';
import { upsertUser } from '../db/queries/user-operations';





interface GoogleSignInType {
	accessToken: string;
}

export interface GoogleUserType {
	email: string;
	name: string;
	picture: string;
	googleId: string;
}

const googleSignInSchema = z.object({
	accessToken: z.string(),
});

export async function googleSignIn(request: Request, env: Env, ctx: ExecutionContext, db: DB): Promise<Response> {
	let rawBody: GoogleSignInType | null = null;

	try {
		rawBody = await request.json();
	} catch (e) {
		return new Response('Invalid JSON body', { status: 400 });
	}

	const requestValidation = googleSignInSchema.safeParse(rawBody);
	if (!requestValidation.success) {
		console.error('Body validation failed in googleSignIn Route', requestValidation.error.flatten());
		return Response.json({ error: 'Invalid GoogleSignIn request body', errorDetails: requestValidation.error.flatten() }, { status: 400 });
	}

	const { accessToken } = requestValidation.data;
	console.log('Access token is: ', accessToken);

	try {
		const googleResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);

		if (!googleResponse.ok) {
			console.error(`Google API failed: STATUS: ${googleResponse.status} STATUS-TEXT: ${googleResponse.statusText}`);
			return new Response('Authentication Failed', { status: 401 });
		}

		const googleUser: GoogleUserType = await googleResponse.json();

		console.log('Google user is: ', googleUser);

        const userData = {
            email: googleUser.email,
			name: googleUser.name, 
			picture: googleUser.picture, 
            googleId: googleUser.googleId
        }

        try{
            await upsertUser(db, googleUser)
        } catch(e){
            console.log("Error while upserting user: ", e)
            return Response.json({error: "Failed to upsert user in DB"})
        }

		return Response.json({ userDetails: userData }, { status: 200 });
	} catch (e) {
		return new Response('Server Error', { status: 500 });
	}
}
