CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`disabled` integer DEFAULT false NOT NULL,
	`quota_bytes` integer,
	`used_bytes` integer DEFAULT 0 NOT NULL,
	`chatbot_enabled` integer DEFAULT true NOT NULL,
	`api_token` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_api_token_unique` ON `user` (`api_token`);--> statement-breakpoint
CREATE TABLE `user_setting` (
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`user_id`, `key`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `chat_message` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `combo` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `fish_catch` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `fishing_line` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `lure` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `reel` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `rod` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `spot` ADD `user_id` text REFERENCES user(id);