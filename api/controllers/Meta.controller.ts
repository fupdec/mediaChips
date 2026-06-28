const fs = require("fs")
const path = require('path')

module.exports = function (db) {
  const metaFolder = path.join(db.path, 'meta')
  // Create and Save a new Meta
  const create = function (req, res) {
    db.Meta.create(req.body, {
        include: [db.PageSetting],
        raw: true
      })
      .then(async data => {
        const m = data.dataValues
        if (m.type == 'array') {
          const dir = path.join(metaFolder, m.id.toString())
          if (!fs.existsSync(dir)) fs.mkdirSync(dir);

          const [cf, isC] = await db.SavedFilter.findOrCreate({
            where: {
              name: null,
              metaId: m.id
            }
          })

          if (isC) {
            await db.PageSetting.update({
              filterId: cf.id
            }, {
              where: {
                metaId: m.id
              }
            })
          }
        }

        res.status(201).send(data)
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  }

  // Retrieve all Metas from the database.
  const findAll = function (req, res) {
    db.Meta.findAll()
      .then(data => {
        res.status(201).send(data)
      }).catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  }

  // Find a single Meta with an id
  const findOne = function (req, res) {
    db.Meta.findOne({
        where: {
          id: req.params.id
        },
      })
      .then(data => {
        res.status(201).send(data)
      }).catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  }

  // Find the lats added Meta
  const findLatest = function (req, res) {
    db.Meta.findAll({
        limit: 1,
        order: [
          ['createdAt', 'DESC']
        ]
      })
      .then(data => {
        res.status(201).send(data)
      }).catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  }

  // Update a Meta by the id in the request
  const update = function (req, res) {
    db.Meta
      .update(req.body, {
        where: {
          id: parseInt(req.params.id)
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
  }

  // Delete a Meta with the specified id in the request
  const deleteOne = function (req, res) {
    db.Meta
      .destroy({
        where: {
          id: req.params.id
        }
      })
      .then(() => {
        const dir = path.join(metaFolder, req.params.id)
        fs.rmSync(dir, {
          recursive: true,
          force: true
        })
        res.sendStatus(201)
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  }

  return {
    create,
    findAll,
    findOne,
    findLatest,
    update,
    deleteOne
  }
}