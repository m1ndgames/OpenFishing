PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`disabled` integer DEFAULT false NOT NULL,
	`quota_bytes` integer,
	`used_bytes` integer DEFAULT 0 NOT NULL,
	`chatbot_enabled` integer DEFAULT true NOT NULL,
	`api_token` text,
	`reset_token_hash` text,
	`reset_token_expiry` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "email", "username", "password_hash", "is_admin", "disabled", "quota_bytes", "used_bytes", "chatbot_enabled", "api_token", "created_at", "updated_at") SELECT "id", "email", "username", "password_hash", "is_admin", "disabled", "quota_bytes", "used_bytes", "chatbot_enabled", "api_token", "created_at", "updated_at" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_api_token_unique` ON `user` (`api_token`);