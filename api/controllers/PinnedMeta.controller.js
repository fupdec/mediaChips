module.exports = function (db) {
  // Create and Save a new PinnedMeta
  const create = function (req, res) {
    db.PinnedMeta.create(req.body)
      .then(data => {
        res.status(201).send(data)
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  // Retrieve all PinnedMetas from the database.
  const findAll = function (req, res) {
    let where = {}
    if (req.query.metaId) where.metaId = req.query.metaId
    if (req.query.pinnedMetaId) where.pinnedMetaId = req.query.pinnedMetaId

    db.PinnedMeta.findAll({
      where: where,
      include: [{
        model: db.Meta,
      }],
      order: [['order', 'ASC']],
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // получить мета по ID прикрепленной меты
  const findAllByPinnedMetaId = function (req, res) {
    db.PinnedMeta.findAll({
      where: {
        pinnedMetaId: req.query.metaId
      },
      include: [{
        model: db.Meta,
      }],
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a PinnedMeta by the id in the request
  const update = function (req, res) {
    db.PinnedMeta.update(req.body.data, {
      where: {
        metaId: req.body.metaId,
        pinnedMetaId: req.body.pinnedMetaId
      }
    }).then((data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Delete a PinnedMeta with the specified id in the request
  const deleteOne = function (req, res) {
    db.PinnedMeta
      .destroy({
        where: {
          pinnedMetaId: parseInt(req.params.id),
          metaId: parseInt(req.query.metaId)
        },
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
    findAll,
    findAllByPinnedMetaId,
    update,
    deleteOne,
  }
}