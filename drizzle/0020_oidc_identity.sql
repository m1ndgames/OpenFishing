ALTER TABLE `user` ADD `oidc_issuer` text;--> statement-breakpoint
ALTER TABLE `user` ADD `oidc_subject` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_oidc_identity_idx` ON `user` (`oidc_issuer`,`oidc_subject`);