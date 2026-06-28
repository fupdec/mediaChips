module.exports = function (db) {
  // Create and Save a new Value
  const create = function (req, res) {
    db.ValuesInTag.bulkCreate(req.body).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Retrieve all Values from the database.
  const findAll = function (req, res) {
    db.ValuesInTag.findAll({
      where: {
        tagId: req.query.tagId
      },
      include: [db.Meta],
    }).then((data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Удалить значение для медиа с конкретным ID и meta ID
  const deleteOne = function (req, res) {
    db.ValuesInTag.destroy({
      where: {
        tagId: req.body.itemId,
        metaId: req.body.metaId,
      }
    }).then(() => {
      res.sendStatus(201)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Delete a Value with the specified id in the request
  const deleteAllValuesByTagId = function (req, res) {
    db.ValuesInTag
      .destroy({
        where: {
          tagId: req.params.id
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
    findAll,
    deleteOne,
    deleteAllValuesByTagId,
  }
}