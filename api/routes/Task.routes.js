module.exports = (app, db) => {
  const router = require("express").Router();

  let Task;
  try {
    Task = require("../controllers/Task.controller")(db);
  } catch (err) {
    console.error(
      'Task.controller unavailable, using video core fallback:',
      err.stack || err.message,
    );
    Task = require("../controllers/taskVideoCore.controller")(db);
  }

  let TasksMigrateFromLowDb = null;
  try {
    TasksMigrateFromLowDb = require("../controllers/tasks/TasksMigrateFromLowDb.controller")(db);
  } catch (err) {
    console.error(
      'Migration Task routes unavailable:',
      err.stack || err.message,
    );
  }

  if (TasksMigrateFromLowDb) {
    // проверяем есть ли старая БД
    router.post("/checkDataForMigrateFromLowDb", TasksMigrateFromLowDb.checkDataForMigrateFromLowDb);

    // удалить все данные со старой версией БД
    router.post("/cleanLowDb", TasksMigrateFromLowDb.cleanDataLowDb);

    // создать бэкап со старой БД
    router.post("/createBackupLowDb", TasksMigrateFromLowDb.createBackupLowDb);

    // ...и мигрируем
    router.post("/migrateFromLowDb", TasksMigrateFromLowDb.migrateFromLowDb);
  }

  const register = (method, route, handler) => {
    if (typeof Task?.[handler] === 'function') {
      router[method](route, Task[handler]);
    }
  };

  // check if file exists on local machine
  register('post', "/checkFileExists", 'checkFileExists');

  // rename File
  register('post', "/renameFile", 'renameFile');

  // open folder in file explorer
  register('post', "/openPath", 'openPath');

  // getting file list with specific extension in directory
  register('post', "/getFileList", 'getFileList');

  // adding video with metadata to database
  register('post', "/addMediaVideo", 'addMediaVideo');

  // adding image with metadata to database
  register('post', "/addMediaImage", 'addMediaImage');

  // adding media with type audio to database
  register('post', "/addMediaAudio", 'addMediaAudio');

  // adding media with type text to database
  register('post', "/addMediaText", 'addMediaText');

  // adding other type of media with metadata to database
  register('post', "/addMedia", 'addMedia');

  // обновить информацию о файле
  register('post', "/updateMediaInfo", 'updateMediaInfo');

  // creating default thumbnail for video
  register('post', "/createThumbForVideo", 'createThumbForVideo');

  // creating thumbnail for video
  register('post', "/createThumb", 'createThumb');

  // creating frames grid for video
  register('post', "/createGrid", 'createGrid');

  // creating frames timeline for video
  register('post', "/createTimeline", 'createTimeline');

  // check serial key
  register('get', "/getConfig", 'getConfig');

  // check serial key
  register('get', "/getMachineId", 'getMachineId');

  // creating image that recived from cropper
  register('post', "/createImage", 'createImage');

  // deleting file from database
  register('post', "/deleteFile", 'deleteFile');

  // deleting database
  register('post', "/deleteDb", 'deleteDb');

  // get database sizes
  register('post', "/getDatabaseSizes", 'getDatabaseSizes');

  // get folder Size
  register('post', "/getFolderSize", 'getFolderSize');

  // clear images, tables
  register('post', "/clearData", 'clearData');

  // search media file by path
  register('post', "/searchMediaByPath", 'searchMediaByPath');

  // update multiple media files
  register('post', "/updateMediaMultiple", 'updateMediaMultiple');

  // получить список популярных слов
  register('get', "/getMostPopularWordsFromMedia", 'getMostPopularWordsFromMedia');

  // suggest tags from tokenized media paths
  register('get', "/suggestTagsFromPaths", 'suggestTagsFromPaths');
  register('post', "/suggestTagsFromPaths", 'suggestTagsFromPaths');

  // suggest localized tags by classifying extracted video frames with local CLIP
  register('post', "/suggestTagsFromVideoFrames", 'suggestTagsFromVideoFrames');
  register('post', "/streamVideoObjectRecognition", 'streamVideoObjectRecognition');

  // check local CLIP model state for video object recognition
  register('get', "/clipModelStatus", 'clipModelStatus');

  // download and warm up the local CLIP model
  register('post', "/downloadClipModel", 'downloadClipModel');

  // parse tags from one or more file paths
  register('post', "/parsePathTags", 'parsePathTags');

  // check local parser model state
  register('get', "/parserStatus", 'parserStatus');

  // download and warm up the local parser model
  register('post', "/downloadParserModel", 'downloadParserModel');

  // content hash backfill for existing media
  register('get', "/contentHashBackfillStatus", 'contentHashBackfillStatus');
  register('post', "/streamContentHashBackfill", 'streamContentHashBackfill');

  // batch generation of video preview images
  register('get', "/videoImagesGenerationStatus", 'videoImagesGenerationStatus');
  register('post', "/streamVideoImagesGeneration", 'streamVideoImagesGeneration');

  // find and relink missing media files on disk
  register('get', "/missingMediaStatus", 'missingMediaStatus');
  register('post', "/streamFindMissingMedia", 'streamFindMissingMedia');
  register('post', "/relinkMissingMedia", 'relinkMissingMedia');

  app.use('/api/Task', router);
};
