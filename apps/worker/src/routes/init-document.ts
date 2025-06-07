import z from 'zod';
import { Env } from '../../worker-configuration';
import { DB } from '../db';
import { createDocument } from '../db/queries/document-operations';
import { userExists } from '../db/queries/user-operations';

interface InitDocumentType {
	userId: string;
}

const initDocumentSchema = z.object({
	userId: z.string(),
});

export async function initDocument(req: Request, env: Env, ctx: ExecutionContext, db: DB) {
	console.log('hey inside creating new docuemnt');
	let rawBody: InitDocumentType | null = null;

	try {
		rawBody = await req.json();
	} catch (e) {
		return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const requestValidation = initDocumentSchema.safeParse(rawBody);
	if (!requestValidation.success) {
		console.error('Invalid request body', requestValidation.error.flatten());
		return Response.json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { userId } = requestValidation.data;

	console.log('userId is: ', userId);

	try {
		// Check if user exists
		const isValidUser = await userExists(db, userId);
		if (!isValidUser) {
			return Response.json({ error: 'User not found' }, { status: 404 });
		}

		// Create document
		const document = await createDocument(db, userId, 'Welcome to Wrisor');

		return Response.json({
			documentId: document.documentId,
			message: 'Document created successfully',
		});
	} catch (error) {
		console.error('Error creating document:', error);
		return Response.json({ error: 'Failed to create document' }, { status: 500 });
	}
}
