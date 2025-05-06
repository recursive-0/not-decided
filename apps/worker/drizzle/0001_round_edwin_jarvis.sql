PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Messages` (
	`message_id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`mode` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `Documents`(`documentId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_Messages`("message_id", "document_id", "timestamp", "mode", "role", "content") SELECT "message_id", "document_id", "timestamp", "mode", "role", "content" FROM `Messages`;--> statement-breakpoint
DROP TABLE `Messages`;--> statement-breakpoint
ALTER TABLE `__new_Messages` RENAME TO `Messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_messages_doc_timestamp` ON `Messages` (`document_id`,`timestamp`);