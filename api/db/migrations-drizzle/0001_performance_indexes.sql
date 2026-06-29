CREATE INDEX IF NOT EXISTS `media_content_hash_idx` ON `media` (`contentHash`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_media_type_id_idx` ON `media` (`mediaTypeId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tags_in_media_media_id_idx` ON `tagsInMedia` (`mediaId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tags_in_media_tag_meta_idx` ON `tagsInMedia` (`tagId`,`metaId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `values_in_media_media_id_idx` ON `valuesInMedia` (`mediaId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `values_in_media_meta_media_idx` ON `valuesInMedia` (`metaId`,`mediaId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_in_playlists_playlist_id_idx` ON `mediaInPlaylists` (`playlistId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `filter_rows_in_saved_filter_filter_id_idx` ON `filterRowsInSavedFilters` (`filterId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `tags_in_filter_row_row_id_idx` ON `tagsInFilterRows` (`rowId`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_media_type_id_id_idx` ON `media` (`mediaTypeId`,`id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_media_type_id_created_at_idx` ON `media` (`mediaTypeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_media_type_id_updated_at_idx` ON `media` (`mediaTypeId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_media_type_id_rating_idx` ON `media` (`mediaTypeId`,`rating`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_media_type_id_viewed_at_idx` ON `media` (`mediaTypeId`,`viewedAt`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_media_type_id_views_idx` ON `media` (`mediaTypeId`,`views`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `media_media_type_id_favorite_idx` ON `media` (`mediaTypeId`,`favorite`);
