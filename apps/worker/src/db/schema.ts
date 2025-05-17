import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('Users', {
	userId: text('user_id').primaryKey(),
	email: text('email').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const documents = sqliteTable(
	'Documents',
	{
		documentId: text('documentId').primaryKey(),
		userId: text('user_id').references(() => users.userId, { onDelete: 'cascade' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
		lastModifiedAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
		documentTitle: text('document_title').default('Untitled'),
		documentContent: text('document_content').notNull(),
	},
	(table) => ({
		userDocIdx: index('user_doc_index').on(table.userId, table.lastModifiedAt),
	})
);


export const messages = sqliteTable(
	'Messages',
	{
		messageId: text('message_id').primaryKey(),
		documentId: text('document_id')
			.notNull()
			.references(() => documents.documentId, { onDelete: 'cascade' }),
		timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
		mode: text('mode', { enum: ['CHAT', 'COMPOSER'] }).notNull(),
		role: text('role', { enum: ['user', 'assistant'] }).notNull(),
		content: text('content').notNull(),
	},

	(table) => ({
		docTimeIdx: index('idx_messages_doc_timestamp').on(table.documentId, table.timestamp),
	})
);


