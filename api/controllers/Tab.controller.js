module.exports = function (db) {
  // Create and Save a new Tab
  const create = function (req, res) {
    db.Tab.create(req.body).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Retrieve all Tabs from the database.
  const findAll = function (req, res) {
    db.Tab.findAll()
      .then(data => {
        res.status(201).send(data)
      }).catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  }

  // Update a Tab by the id in the request
  const update = function (req, res) {
    db.Tab
      .update(req.body, {
        where: {
          id: req.params.id
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

  // Delete a Tab with the specified id in the request
  const deleteOne = function (req, res) {
    db.Tab
      .destroy({
        where: {
          id: req.params.id
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
    update,
    deleteOne
  }
}