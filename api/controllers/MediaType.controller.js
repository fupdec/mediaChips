module.exports = function (db) {
  const create = function (req, res) {
    db.MediaType.create(req.body).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  }

  // Retrieve all MediaType from the database.
  const findAll = function (req, res) {
    db.MediaType.findAll({
        raw: true
      })
      .then(data => {
        res.status(201).send(data)
      }).catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  // Find a single MediaType with an id
  const findOne = function (req, res) {
    db.MediaType.findOne({
        where: {
          id: req.params.id
        },
        raw: true
      })
      .then(data => {
        res.status(201).send(data)
      }).catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  // Update a Media by the id in the request
  const update = function (req, res) {
    db.MediaType
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

  // Delete a Media with the specified id in the request
  const deleteOne = function (req, res) {
    db.MediaType
      .destroy({
        where: {
          id: req.params.id
        }
      })
      .then(() => {
        // TODO remove folders with thumbs of media 
        // const dir = path.join(metaFolder, req.params.id)
        // fs.rmSync(dir, {
        //   recursive: true,
        //   force: true
        // })
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
    update,
    deleteOne
  }
}