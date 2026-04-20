ALTER TABLE `lure` ADD `lure_number` integer;--> statement-breakpoint
UPDATE `lure` SET `lure_number` = rowid;
