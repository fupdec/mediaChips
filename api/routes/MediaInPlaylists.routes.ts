import type { ApiDb } from '../types/db'
import type { Express } from 'express'
import express from 'express'
import createMediaInPlaylistsController from '../controllers/MediaInPlaylists.controller'

export default function registerRoutes(app: Express, db: ApiDb) {
  const MediaInPlaylists = createMediaInPlaylistsController(db);
  const router = express.Router();

  // add video to playlist
  router.post("/", MediaInPlaylists.create);

  // обновить, например чтобы изменить очередность
  router.post("/update", MediaInPlaylists.update);

  // получить все видосы в плейлисте по ID плейлиста
  router.get("/:id", MediaInPlaylists.findAll);

  // delete media from playlist
  router.delete("/", MediaInPlaylists.deleteOne);

  app.use('/api/MediaInPlaylists', router);
}
