module.exports = function (db) {
  // Add meta to media type
  const create = function (req, res) {
    db.MetaInMediaType.create(req.body)
      .then(data => {
        res.status(201).send(data)
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  // Retrieve all MetaInMediaType from the database.
  const findAll = function (req, res) {
    let where = {}
    let include = {}
    if (req.query.mediaTypeId) {
      where.mediaTypeId = req.query.mediaTypeId
      include = [{
        model: db.Meta,
      }]
    }
    if (req.query.metaId) {
      where.metaId = req.query.metaId
      include = db.MediaType
    }
    db.MetaInMediaType.findAll({
      where: where,
      include: include,
    }).then((data) => {
      res.status(201).send(data)
    }).catch(err => {
      console.log(err)
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Update a MetaInMediaType by the id in the request
  const update = function (req, res) {
    db.MetaInMediaType.update(req.body.data, {
      where: {
        metaId: req.body.metaId,
        mediaTypeId: req.body.mediaTypeId
      }
    }).then((data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Delete a meta from media type with the specified id in the request
  const deleteOne = function (req, res) {
    db.MetaInMediaType
      .destroy({
        where: {
          metaId: parseInt(req.query.metaId),
          mediaTypeId: parseInt(req.query.mediaTypeId),
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
    update,
    deleteOne,
  }
}