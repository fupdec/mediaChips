module.exports = function (db) {
  // Create and Save a new TagsInTag
  const bulkCreate = function (req, res) {
    db.TagsInTag.bulkCreate(req.body).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Create and Save a new TagsInMedia
  const create = function (req, res) {
    db.TagsInTag.findOrCreate({
      where: req.body
    }).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Retrieve all TagsInTags from the database.
  const findAll = function (req, res) {
    db.TagsInTag.findAll({
      where: {
        parentTagId: req.query.tagId
      },
      include: [{
        model: db.Tag,
        attributes: ['name', 'color', 'metaId'],
        include: [{
          model: db.Meta,
          attributes: ['name', 'icon'],
        }],
      }],
    }).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Delete a TagsInTag with the specified id in the request
  const deleteOne = function (req, res) {
    db.TagsInTag
      .destroy({
        where: {
          parentTagId: req.params.id
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

  // delete tag from tag
  const deleteFromTag = function (req, res) {
    db.TagsInTag.destroy({
      where: {
        parentTagId: req.body.parentTagId,
        tagId: req.body.tagId,
      },
    }).then(() => {
      res.sendStatus(201)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // delete tag from tag
  const deleteAllTagsByMetaId = function (req, res) {
    db.TagsInTag.destroy({
      where: {
        parentTagId: req.body.itemId,
        metaId: req.body.metaId,
      },
    }).then(() => {
      res.sendStatus(201)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  return {
    bulkCreate,
    create,
    findAll,
    deleteFromTag,
    deleteOne,
    deleteAllTagsByMetaId,
  }
}