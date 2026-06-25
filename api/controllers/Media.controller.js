const fs = require("fs")
const path = require('path')
const {getMediaDeleteAssetFolder} = require('../utils/mediaType')
const {
  loadMediaItems,
  loadFilteredMediaIds,
  loadMediaBasicsByIds,
} = require('../services/mediaItemsLoader')

module.exports = function (db) {
  const dbPath = db.path

  // Retrieve all Media from the database.
  const getAll = async function (req, res) {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Boolean) : []
      const limit = Number(req.body.limit)
      const page = Number(req.body.page) || 1

      const result = await loadMediaItems(db, {
        mediaTypeId: req.body.mediaTypeId,
        ids,
        filters: req.body.filters,
        sortBy: req.body.sortBy,
        direction: req.body.direction,
        find_duplicates: req.body.find_duplicates,
        duplicates_by: req.body.duplicates_by || 'filesize',
        page,
        limit: limit > 0 ? limit : null,
        includeNavigation: req.body.includeNavigation === true && !ids.length,
        skipTotals: req.body.skipTotals === true,
      })

      res.status(201).send(result)
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    }
  };

  const getFilteredIds = async function (req, res) {
    try {
      const result = await loadFilteredMediaIds(db, {
        mediaTypeId: req.body.mediaTypeId,
        filters: req.body.filters,
        sortBy: req.body.sortBy,
        direction: req.body.direction,
        find_duplicates: req.body.find_duplicates,
        duplicates_by: req.body.duplicates_by || 'filesize',
      })

      res.status(201).send(result)
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving media ids.',
      })
    }
  }

  const getBasicsByIds = async function (req, res) {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Boolean) : []
      const items = await loadMediaBasicsByIds(db, ids)
      res.status(201).send({items})
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving media.',
      })
    }
  }

  const getThumbs = async function (req, res) {
    try {
      const ids = Array.isArray(req.body.ids) ? req.body.ids.filter(Boolean) : []
      const mediaType = String(req.body.mediaType || 'videos')
      const thumbs = {}
      const basePath = path.join(dbPath, 'media', mediaType)

      for (const id of ids) {
        for (const folder of ['grids', 'thumbs']) {
          const filePath = path.join(basePath, folder, `${id}.jpg`)
          if (!fs.existsSync(filePath)) continue

          const buffer = fs.readFileSync(filePath)
          thumbs[id] = `data:image/jpeg;base64,${buffer.toString('base64')}`
          break
        }
      }

      res.status(201).send({thumbs})
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving thumbnails.',
      })
    }
  }

  const getStats = async function (req, res) {
    try {
      const [[row]] = await db.sequelize.query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(filesize), 0) AS filesize
        FROM media
      `)

      res.status(200).send({
        total: Number(row?.total || 0),
        filesize: Number(row?.filesize || 0),
      })
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while performing query.',
      })
    }
  }

  // Retrieve all Media from the database.
  const findAll = function (req, res) {
    db.sequelize.query(req.body.query, {
      raw: true
    }).then(async data => {
      const total = await db.Media.findAndCountAll({
        where: {
          mediaTypeId: req.body.mediaTypeId,
        },
        raw: true
      })
      res.status(201).send({
        items: data[0],
        total: total.count,
      })
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // get one Media by ID.
  const getOneById = function (req, res) {
    db.Media.findOne({
      where: {
        id: req.params.id,
      },
    }).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Find a single Media with an id
  const numberOfMediaWithTag = function (req, res) {
    db.Media.count({
      where: {
        mediaTypeId: req.query.mediaTypeId,
      },
      include: [{
        model: db.TagsInMedia,
        where: {
          tagId: req.query.tagId
        },
        required: true
      }]
    }).then(number => {
      res.status(201).send({
        count: number
      })
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Получаем все медиа подходящие под sql-запрос
  const rawQuery = function (req, res) {
    db.sequelize.query(req.body.query)
      .then(data => {
        res.status(201).send(data)
      }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // update file path, name, basename and ext by path
  const updatePath = function (req, res) {
    const data = {
      path: req.body.path,
      basename: path.basename(req.body.path),
      name: path.parse(req.body.path).name,
      ext: path.extname(req.body.path),
    }

    db.Media.update(data, {
      where: {
        id: req.body.id,
      },
      silent: true,
    }).then((data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a Media by the id in the request
  const update = function (req, res) {
    let silent = req.body.silent;
    db.Media.update(req.body, {
      where: {
        id: req.params.id,
      },
      silent: silent,
    }).then((data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Delete a media with the specified id in the request
  const deleteOne = async function (req, res) {
    const type = req.body.type
    const id = req.body.id
    const mediaPath = path.join(dbPath, 'media/' + type)

    if (type === 'videos') {
      // удаляем все картинки сделанные для видео
      const thumbPath = path.join(mediaPath, 'thumbs', id + '.jpg')
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath)
      const gridPath = path.join(mediaPath, 'grids', id + '.jpg')
      if (fs.existsSync(gridPath)) fs.unlinkSync(gridPath)
      const parts = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]
      const arrPath = parts.map(i => path.join(mediaPath, 'timelines', id + '_' + i + '.jpg'))
      if (fs.existsSync(arrPath[0])) {
        for (const i of arrPath) {
          if (fs.existsSync(i)) fs.unlinkSync(i)
        }
      }
      await db.Mark.findAll({
        where: {
          mediaId: id
        }
      }).then(marks => {
        for (const mark of marks) {
          const markPath = path.join(mediaPath, 'marks', mark.id + '.jpg')
          if (fs.existsSync(markPath)) fs.unlinkSync(markPath)
        }
      })
    } else if (type === getMediaDeleteAssetFolder({type: 'image'})) {
      const thumbPath = path.join(mediaPath, 'thumbs', `${id}.jpg`)
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath)
    }

    // удалить вместе с файлом?
    if (req.body.with_file) {
      const file_path = req.body.path
      if (fs.existsSync(file_path)) {
        fs.unlink(file_path, (err) => {
          console.log(err)
        })
      } else {
        console.log(file_path + 'is unavailable.')
      }
    }

    await db.Media
      .destroy({
        where: {
          id: id
        }
      })
      .then(() => {
        res.sendStatus(201)
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  return {
    findAll,
    numberOfMediaWithTag,
    rawQuery,
    updatePath,
    update,
    deleteOne,
    getOneById,
    getAll,
    getFilteredIds,
    getBasicsByIds,
    getThumbs,
    getStats,
  }
}