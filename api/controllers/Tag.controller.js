const fs = require("fs")
const path = require('path')
const {parseItemsFromDb, filterItems} = require('../../app/tasks/items.js')

module.exports = function (db) {
  const dbPath = db.path

  // Retrieve all Tags from the database.
  const getAllForItems = function (req, res) {
    let query = `SELECT tags.*, tags_in_tags.tag_tags, values_in_tags.tag_values
                 FROM tags
                          LEFT JOIN (SELECT tagsInTags.parentTagId                                     id,
                                            GROUP_CONCAT(tagsInTags.tagId || '^' || tagsInTags.metaId) tag_tags
                                     FROM tagsInTags
                                     GROUP BY id) AS tags_in_tags ON tags.id = tags_in_tags.id
                          LEFT JOIN (SELECT valuesInTags.tagId                                             id,
                                            GROUP_CONCAT(valuesInTags.value || '^' || valuesInTags.metaId) tag_values
                                     FROM valuesInTags
                                     GROUP BY id) AS values_in_tags ON tags.id = values_in_tags.id
                 WHERE tags.metaId = ${req.body.metaId}`
    let ids = req.body.ids
    if (ids && ids.length) {
      query += ` AND tags.id in (${ids.join()})`
    }
    db.sequelize.query(query).then(data => {
      let items_all = parseItemsFromDb(data[0])
      let items_filtered = filterItems(req.body.filters, 'tags', items_all, req.body.sortBy, req.body.direction, req.body.find_duplicates)
      res.status(201).send({items: items_filtered, total: items_all.length})
    }).catch(err => {
      console.log(err)

      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Create and Save a new Tag
  const create = function (req, res) {
    db.Tag.bulkCreate(req.body).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Retrieve all Tag from the database.
  const findAll = function (req, res) {
    db.sequelize.query(req.body.query, {
      raw: true
    }).then(async data => {
      const total = await db.Tag.findAndCountAll({
        where: {
          metaId: req.body.metaId,
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

  // Find a single Tag with an id
  const findOne = function (req, res) {
    db.Tag.findOne({
      where: {
        id: req.params.id
      }
    }).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  const getCount = async function (req, res) {
    try {
      const count = await db.Tag.count()
      res.status(200).send({count})
    } catch (err) {
      res.status(500).send({
        message: err.message || 'Some error occurred while performing query.',
      })
    }
  }

  // Retrieve all Tag from the database.
  const getAll = function (req, res) {
    db.Tag.findAll({
      raw: true
    }).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Retrieve all Tag from the database.
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

  // Update a Tag by the id in the request
  const update = function (req, res) {
    let silent = req.body.silent;
    db.Tag.update(req.body, {
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

  // delete an Tag by the id
  const deleteOne = async function (req, res) {
    const metaId = req.body.metaId
    const id = req.body.id
    const metaPath = path.join(dbPath, 'meta/' + metaId)
    // TODO переименовать изображения в 1.jpg, 2.jpg ... n.jpg, за исключением header, avatar
    const parts = ['main', 'avatar', 'alt', 'header', 'custom1', 'custom2']
    const arrPath = parts.map(i => path.join(metaPath, id + '_' + i + '.jpg'))
    for (const i of arrPath) {
      if (fs.existsSync(i)) fs.unlinkSync(i)
    }

    await db.Tag
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
    create,
    getCount,
    getAllForItems,
    getAll,
    findAll,
    findOne,
    rawQuery,
    update,
    deleteOne,
  }
}