CREATE TABLE `lure` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`type` text,
	`color` text,
	`weight` real,
	`size` text,
	`notes` text,
	`photo_path` text,
	`species` text,
	`qr_coded` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` text PRIMARY KEY NOT NULL,
	`lure_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`lure_id`) REFERENCES `lure`(`id`) ON UPDATE no action ON DELETE cascade
);
