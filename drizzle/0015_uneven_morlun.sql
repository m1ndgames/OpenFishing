CREATE TABLE `combo` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rod_id` text,
	`reel_id` text,
	`terminal_tackle` text,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`rod_id`) REFERENCES `rod`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reel_id`) REFERENCES `reel`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `fishing_line` (
	`id` text PRIMARY KEY NOT NULL,
	`brand` text,
	`model` text NOT NULL,
	`type` text,
	`diameter_mm` real,
	`strength_kg` real,
	`notes` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `reel` (
	`id` text PRIMARY KEY NOT NULL,
	`brand` text,
	`model` text NOT NULL,
	`size` text,
	`notes` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `reel_line_log` (
	`id` text PRIMARY KEY NOT NULL,
	`reel_id` text NOT NULL,
	`line_id` text,
	`spooled_at` integer NOT NULL,
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`reel_id`) REFERENCES `reel`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_id`) REFERENCES `fishing_line`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `rod` (
	`id` text PRIMARY KEY NOT NULL,
	`brand` text,
	`model` text NOT NULL,
	`length_m` real,
	`casting_weight` text,
	`type` text,
	`notes` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
ALTER TABLE `fish_catch` ADD `combo_id` text REFERENCES combo(id);