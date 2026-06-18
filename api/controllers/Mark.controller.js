module.exports = function (db) {
  // Create and Save a new Mark
  const create = function (req, res) {
    db.Mark.create(req.body).then(data => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  // Retrieve all Mark for video from the database.
  const findAllForVideo = function (req, res) {
    db.Mark.findAll({
        where: {
          mediaId: req.params.id
        },
        order: [
          ['time', 'ASC']
        ],
        include: [db.Tag],
        raw: true
      })
      .then(async marks => {
        for (let mark of marks) {
          let meta = await db.Meta.findOne({
            where: {
              id: mark['tag.metaId']
            },
            raw: true
          })
          mark.meta = meta
        }
        res.status(201).send(marks)
      }).catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  // Retrieve all Marks from the database.
  const findAll = function (req, res) {
    db.Mark.findAll({
      include: [{
        model: db.Tag,
        include: [{
          model: db.Meta,
        }],
      }, db.Media],
      })
      .then(marks => {
        res.status(201).send(marks)
      }).catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  // Delete a Mark with the specified id in the request
  const deleteOne = function (req, res) {
    db.Mark
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
    findAllForVideo,
    findAll,
    deleteOne
  }
}