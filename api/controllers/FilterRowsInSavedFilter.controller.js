module.exports = function (db) {
  // Retrieve all FilterRowsInSavedFilter from the database.
  const findAll = async function (req, res) {
    db.FilterRowsInSavedFilter.findAll({
      where: {
        filterId: req.query.filterId
      },
      include: [db.FilterRow],
    }).then((data) => {
      res.status(201).send(data)
    }).catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })
  };

  return {
    findAll,
  }
}