CREATE TABLE `Documents` (
	`documentId` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`created_at` integer NOT NULL,
	`document_title` text DEFAULT 'Untitled',
	`document_content` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `user_doc_index` ON `Documents` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `Messages` (
	`message_id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`timestamp` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`mode` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `Documents`(`documentId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_messages_doc_timestamp` ON `Messages` (`document_id`,`timestamp`);--> statement-breakpoint
CREATE TABLE `Users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Users_email_unique` ON `Users` (`email`);