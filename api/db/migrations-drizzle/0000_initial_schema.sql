CREATE TABLE `filterRows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`param` text,
	`type` text,
	`cond` text,
	`val` text,
	`active` integer,
	`note` text,
	`lock` integer,
	`union` text,
	`metaId` integer,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `filterRowsInSavedFilters` (
	`filterId` integer NOT NULL,
	`rowId` integer NOT NULL,
	PRIMARY KEY(`filterId`, `rowId`)
);
--> statement-breakpoint
CREATE TABLE `imageMetadata` (
	`mediaId` integer PRIMARY KEY NOT NULL,
	`width` integer DEFAULT 0,
	`height` integer DEFAULT 0,
	`orientation` integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE `marks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text,
	`text` text,
	`time` integer,
	`end` integer,
	`tagId` integer,
	`mediaId` integer
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text NOT NULL,
	`basename` text,
	`name` text,
	`ext` text,
	`filesize` integer DEFAULT 0,
	`contentHash` text,
	`rating` integer DEFAULT 0,
	`favorite` integer DEFAULT false,
	`bookmark` text,
	`views` integer DEFAULT 0,
	`oldId` text,
	`viewedAt` text,
	`mediaTypeId` integer,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_path_unique` ON `media` (`path`);--> statement-breakpoint
CREATE UNIQUE INDEX `media_oldId_unique` ON `media` (`oldId`);--> statement-breakpoint
CREATE TABLE `mediaInPlaylists` (
	`mediaId` integer NOT NULL,
	`playlistId` integer NOT NULL,
	`order` integer,
	PRIMARY KEY(`mediaId`, `playlistId`)
);
--> statement-breakpoint
CREATE TABLE `mediaTypes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`nameSingular` text,
	`icon` text,
	`extensions` text,
	`order` integer,
	`hidden` integer DEFAULT false,
	`custom` integer DEFAULT true,
	`type` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mediaTypesInWatchedFolders` (
	`folderId` integer NOT NULL,
	`mediaTypeId` integer NOT NULL,
	PRIMARY KEY(`folderId`, `mediaTypeId`)
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text,
	`name` text,
	`nameSingular` text,
	`icon` text,
	`hint` text,
	`order` integer,
	`views` integer DEFAULT 0,
	`oldId` text,
	`synonyms` integer DEFAULT false,
	`hidden` integer DEFAULT false,
	`nested` integer DEFAULT false,
	`marks` integer DEFAULT false,
	`bookmark` integer DEFAULT false,
	`parser` integer DEFAULT false,
	`country` integer DEFAULT false,
	`career` integer DEFAULT false,
	`scraper` integer DEFAULT false,
	`rating` integer DEFAULT false,
	`favorite` integer DEFAULT true,
	`chipVariant` text DEFAULT 'flat',
	`chipLabel` integer DEFAULT false,
	`color` integer DEFAULT false,
	`imageAspectRatio` real DEFAULT 1,
	`isLink` integer DEFAULT false,
	`ratingIcon` text DEFAULT 'star',
	`ratingIconEmpty` text DEFAULT 'star-outline',
	`ratingIconHalf` text DEFAULT 'star-half-full',
	`ratingMax` integer DEFAULT 5,
	`ratingColor` text DEFAULT '#ffab00',
	`ratingHalf` integer DEFAULT false,
	`sortBy` text DEFAULT 'createdAt',
	`sortDir` text DEFAULT 'asc',
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `metaInMediaTypes` (
	`metaId` integer NOT NULL,
	`mediaTypeId` integer NOT NULL,
	`scraper` text,
	`show` integer DEFAULT true,
	`order` integer,
	PRIMARY KEY(`metaId`, `mediaTypeId`)
);
--> statement-breakpoint
CREATE TABLE `metaSettings` (
	`metaId` integer PRIMARY KEY NOT NULL,
	`synonyms` integer DEFAULT false,
	`hidden` integer DEFAULT false,
	`nested` integer DEFAULT false,
	`marks` integer DEFAULT false,
	`bookmark` integer DEFAULT false,
	`parser` integer DEFAULT false,
	`country` integer DEFAULT false,
	`career` integer DEFAULT false,
	`scraper` integer DEFAULT false,
	`rating` integer DEFAULT false,
	`favorite` integer DEFAULT true,
	`chipOutlined` integer DEFAULT false,
	`chipLabel` integer DEFAULT false,
	`color` integer DEFAULT false,
	`imageAspectRatio` real DEFAULT 1,
	`isLink` integer DEFAULT false,
	`ratingIcon` text DEFAULT 'star',
	`ratingIconEmpty` text DEFAULT 'star-outline',
	`ratingIconHalf` text DEFAULT 'star-half-full',
	`ratingMax` integer DEFAULT 5,
	`ratingColor` text DEFAULT '#ffab00',
	`ratingHalf` integer DEFAULT false,
	`sortBy` text DEFAULT 'createdAt',
	`sortDir` text DEFAULT 'asc'
);
--> statement-breakpoint
CREATE TABLE `pageSettings` (
	`page` integer DEFAULT 1,
	`size` integer DEFAULT 3,
	`view` integer DEFAULT 1,
	`limit` integer DEFAULT 101,
	`sortBy` text DEFAULT 'createdAt',
	`sortDir` text DEFAULT 'asc',
	`firstChar` text,
	`colors` text,
	`metaId` integer,
	`mediaTypeId` integer,
	`tagId` integer,
	`filterId` integer,
	`tabId` integer
);
--> statement-breakpoint
CREATE TABLE `pinnedMetas` (
	`metaId` integer NOT NULL,
	`pinnedMetaId` integer NOT NULL,
	`scraper` text,
	`show` integer DEFAULT true,
	`order` integer,
	PRIMARY KEY(`metaId`, `pinnedMetaId`)
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`favorite` integer DEFAULT false,
	`oldId` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `savedFilters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`metaId` integer,
	`mediaTypeId` integer,
	`tagId` integer,
	`tabId` integer,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`option` text,
	`value` text,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_option_unique` ON `settings` (`option`);--> statement-breakpoint
CREATE TABLE `tabs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text,
	`icon` text,
	`url` text,
	`order` integer DEFAULT 0,
	`metaId` integer,
	`mediaTypeId` integer,
	`tagId` integer,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`oldId` text,
	`name` text NOT NULL,
	`synonyms` text,
	`rating` integer DEFAULT 0 NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`bookmark` text,
	`country` text,
	`color` text,
	`views` integer DEFAULT 0,
	`viewedAt` text,
	`metaId` integer,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_oldId_unique` ON `tags` (`oldId`);--> statement-breakpoint
CREATE TABLE `tagsInFilterRows` (
	`tagId` integer NOT NULL,
	`rowId` integer NOT NULL,
	`metaId` integer NOT NULL,
	PRIMARY KEY(`tagId`, `rowId`, `metaId`)
);
--> statement-breakpoint
CREATE TABLE `tagsInMedia` (
	`mediaId` integer NOT NULL,
	`tagId` integer NOT NULL,
	`metaId` integer NOT NULL,
	PRIMARY KEY(`mediaId`, `tagId`, `metaId`)
);
--> statement-breakpoint
CREATE TABLE `tagsInTags` (
	`parentTagId` integer NOT NULL,
	`tagId` integer NOT NULL,
	`metaId` integer NOT NULL,
	PRIMARY KEY(`parentTagId`, `tagId`, `metaId`)
);
--> statement-breakpoint
CREATE TABLE `valuesInMedia` (
	`mediaId` integer NOT NULL,
	`metaId` integer NOT NULL,
	`value` text,
	PRIMARY KEY(`mediaId`, `metaId`)
);
--> statement-breakpoint
CREATE TABLE `valuesInTags` (
	`tagId` integer NOT NULL,
	`metaId` integer NOT NULL,
	`value` text,
	PRIMARY KEY(`tagId`, `metaId`)
);
--> statement-breakpoint
CREATE TABLE `videoMetadata` (
	`mediaId` integer PRIMARY KEY NOT NULL,
	`duration` integer DEFAULT 0,
	`width` integer DEFAULT 0,
	`height` integer DEFAULT 0,
	`bitrate` integer DEFAULT 0,
	`fps` integer DEFAULT 0,
	`time` integer,
	`codec` text
);
--> statement-breakpoint
CREATE TABLE `watchedFolders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path` text,
	`name` text,
	`watch` integer DEFAULT true,
	`createdAt` text NOT NULL,
	`updatedAt` text NOT NULL
);
