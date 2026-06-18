module.exports = function (db) {
  // Create and Save a new SavedFilter
  const Op = db.Sequelize.Op

  const create = function (req, res) {
    db.SavedFilter.findOrCreate({
        where: req.body
      })
      .then(data => {
        res.status(201).send(data)
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  // Find a single SavedFilter with an id
  const findOne = function (req, res) {
    db.SavedFilter
      .findOne({
        where: {
          id: req.params.id
        }
      })
      .then(data => {
        res.status(201).send(data)
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  // get all SavedFilters with params
  const findAll = function (req, res) {
    let conds = {
      name: {
        [Op.not]: null
      }
    }
    conds = {
      ...conds,
      ...req.body
    }
    // console.log(conds)
    db.SavedFilter
      .findAll({
        where: conds
      })
      .then(data => {
        res.status(201).send(data)
      })
      .catch(err => {
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
  };

  // Update a SavedFilter by the id in the request
  const update = function (req, res) {
    db.SavedFilter
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

  // Delete a SavedFilter with the specified id in the request
  const deleteOne = function (req, res) {
    db.SavedFilter
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
    findOne,
    findAll,
    update,
    deleteOne
  }
}