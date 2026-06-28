module.exports = function (db) {
  // Retrieve all MediaTypesInWatchedFolders from the database.
  const findAll = function (req, res) {
    db.MediaTypesInWatchedFolders
      .findAll({
        include: [db.MediaType, db.WatchedFolder]
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

  return {
    findAll,
  }
}