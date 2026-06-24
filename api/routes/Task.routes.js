module.exports = (app, db) => {
  const Task = require("../controllers/Task.controller")(db);
  const TasksMigrateFromLowDb = require("../controllers/tasks/TasksMigrateFromLowDb.controller")(db);
  const router = require("express").Router();

  // проверяем есть ли старая БД
  router.post("/checkDataForMigrateFromLowDb", TasksMigrateFromLowDb.checkDataForMigrateFromLowDb);

  // удалить все данные со старой версией БД
  router.post("/cleanLowDb", TasksMigrateFromLowDb.cleanDataLowDb);

  // создать бэкап со старой БД
  router.post("/createBackupLowDb", TasksMigrateFromLowDb.createBackupLowDb);

  // ...и мигрируем
  router.post("/migrateFromLowDb", TasksMigrateFromLowDb.migrateFromLowDb);

  // check if file exists on local machine
  router.post("/checkFileExists", Task.checkFileExists);

  // rename File
  router.post("/renameFile", Task.renameFile);

  // open folder in file explorer
  router.post("/openPath", Task.openPath);

  // getting file list with specific extension in directory
  router.post("/getFileList", Task.getFileList);

  // adding video with metadata to database
  router.post("/addMediaVideo", Task.addMediaVideo);

  // adding image with metadata to database
  router.post("/addMediaImage", Task.addMediaImage);

  // adding media with type audio to database
  router.post("/addMediaAudio", Task.addMediaAudio);

  // adding media with type text to database
  router.post("/addMediaText", Task.addMediaText);

  // adding other type of media with metadata to database
  router.post("/addMedia", Task.addMedia);

  // обновить информацию о файле
  router.post("/updateMediaInfo", Task.updateMediaInfo);

  // creating default thumbnail for video
  router.post("/createThumbForVideo", Task.createThumbForVideo);

  // creating thumbnail for video
  router.post("/createThumb", Task.createThumb);

  // creating frames grid for video
  router.post("/createGrid", Task.createGrid);

  // creating frames timeline for video
  router.post("/createTimeline", Task.createTimeline);

  // check serial key
  router.get("/getConfig", Task.getConfig);

  // check serial key
  router.get("/getMachineId", Task.getMachineId);

  // creating image that recived from cropper
  router.post("/createImage", Task.createImage);

  // deleting file from database
  router.post("/deleteFile", Task.deleteFile);

  // deleting database
  router.post("/deleteDb", Task.deleteDb);

  // get folder Size
  router.post("/getFolderSize", Task.getFolderSize);

  // clear images, tables
  router.post("/clearData", Task.clearData);

  // search media file by path
  router.post("/searchMediaByPath", Task.searchMediaByPath);

  // update multiple media files
  router.post("/updateMediaMultiple", Task.updateMediaMultiple);

  // получить список популярных слов
  router.get("/getMostPopularWordsFromMedia", Task.getMostPopularWordsFromMedia);

  // suggest tags from tokenized media paths
  router.get("/suggestTagsFromPaths", Task.suggestTagsFromPaths);
  router.post("/suggestTagsFromPaths", Task.suggestTagsFromPaths);

  // suggest localized tags by classifying extracted video frames with local CLIP
  router.post("/suggestTagsFromVideoFrames", Task.suggestTagsFromVideoFrames);
  router.post("/streamVideoObjectRecognition", Task.streamVideoObjectRecognition);

  // check local CLIP model state for video object recognition
  router.get("/clipModelStatus", Task.clipModelStatus);

  // download and warm up the local CLIP model
  router.post("/downloadClipModel", Task.downloadClipModel);

  // parse tags from one or more file paths
  router.post("/parsePathTags", Task.parsePathTags);

  // check local parser model state
  router.get("/parserStatus", Task.parserStatus);

  // download and warm up the local parser model
  router.post("/downloadParserModel", Task.downloadParserModel);

  // content hash backfill for existing media
  router.get("/contentHashBackfillStatus", Task.contentHashBackfillStatus);
  router.post("/streamContentHashBackfill", Task.streamContentHashBackfill);

  // batch generation of video preview images
  router.get("/videoImagesGenerationStatus", Task.videoImagesGenerationStatus);
  router.post("/streamVideoImagesGeneration", Task.streamVideoImagesGeneration);

  // find and relink missing media files on disk
  router.get("/missingMediaStatus", Task.missingMediaStatus);
  router.post("/streamFindMissingMedia", Task.streamFindMissingMedia);
  router.post("/relinkMissingMedia", Task.relinkMissingMedia);

  app.use('/api/Task', router);
};