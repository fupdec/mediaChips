module.exports = function (db) {
  // Create and Save a new Playlist
  const create = function (req, res) {
    db.Playlist.create(req.body)
      .then(data => {
        res.status(201).send(data)
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  // Retrieve all Playlists from the database.
  const findAll = function (req, res) {
    db.Playlist.findAll({
      include: [{
        model: db.MediaInPlaylists,
      }],
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a Playlist by the id in the request
  const update = function (req, res) {
    db.Playlist.update(req.body, {
      where: {
        id: parseInt(req.params.id),
      },
    }).then((data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Delete a Playlist with the specified id in the request
  const deleteOne = function (req, res) {
    db.Playlist
      .destroy({
        where: {
          id: parseInt(req.params.id),
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