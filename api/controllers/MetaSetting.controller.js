module.exports = function (db) {
  // Find a single MetaSetting with an id
  const findOne = function (req, res) {
    db.MetaSetting.findOne({
      where: {
        metaId: req.params.id
      }
    }).then(async (data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving media."
      })
    })
  };

  // Update a MetaSetting by the id in the request
  const update = function (req, res) {
    db.MetaSetting
      .update(req.body, {
        where: {
          metaId: req.params.id
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