CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`emoji` text,
	`health` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`seed_key` text,
	`archived_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_seed_key_idx` ON `categories` (`seed_key`);--> statement-breakpoint
CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`category_id` integer NOT NULL,
	`meal_type` text,
	`note` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `entries_date_idx` ON `entries` (`date`);--> statement-breakpoint
CREATE INDEX `entries_category_idx` ON `entries` (`category_id`);