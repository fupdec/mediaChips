import type { ApiDb } from '../types/db'
import type { Express } from 'express'
module.exports = (app: Express, db: ApiDb) => {
  const MediaInPlaylists = require("../controllers/MediaInPlaylists.controller")(db);
  const router = require("express").Router();

  // add video to playlist
  router.post("/", MediaInPlaylists.create);

  // обновить, например чтобы изменить очередность
  router.post("/update", MediaInPlaylists.update);

  // получить все видосы в плейлисте по ID плейлиста
  router.get("/:id", MediaInPlaylists.findAll);

  // delete media from playlist
  router.delete("/", MediaInPlaylists.deleteOne);

  app.use('/api/MediaInPlaylists', router);
};