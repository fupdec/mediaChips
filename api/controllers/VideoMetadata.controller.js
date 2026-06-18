module.exports = function (db) {
  // Find a single VideoMetadata with an id
  const findOne = function (req, res) {
    db.VideoMetadata.findOne({
      where: {
        mediaId: req.params.id,
      },
      raw: true
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a VideoMetadata by the id in the request
  const update = function (req, res) {
    db.VideoMetadata
      .update(req.body, {
        where: {
          mediaId: parseInt(req.params.id)
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
    findOne,
    update,
  }
}