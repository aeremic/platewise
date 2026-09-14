CREATE TABLE `daily_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`effective_from` text NOT NULL,
	`kcal_max` real,
	`fiber_min` real,
	`sugar_max` real,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_goals_effective_from_idx` ON `daily_goals` (`effective_from`);--> statement-breakpoint
ALTER TABLE `categories` ADD `portion_label` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `kcal` real;--> statement-breakpoint
ALTER TABLE `categories` ADD `fiber_g` real;--> statement-breakpoint
ALTER TABLE `categories` ADD `sugar_g` real;--> statement-breakpoint
ALTER TABLE `entries` ADD `portions` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `kcal` real;--> statement-breakpoint
ALTER TABLE `entries` ADD `fiber_g` real;--> statement-breakpoint
ALTER TABLE `entries` ADD `sugar_g` real;