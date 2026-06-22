module.exports = function (db) {
  // Retrieve all MediaInPlaylists from the database.
  const findAll = function (req, res) {
    db.MediaInPlaylists
      .findAll({
        where: {
          playlistId: req.params.id
        },
        order: [['order', 'ASC']],
        include: [db.Media, db.Playlist]
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

  // add video to playlist
  const create = function (req, res) {
    db.MediaInPlaylists.findOrCreate({
      where: req.body,
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


  // update videos in playlist
  const update = async function (req, res) {
    const data = req.body;
    console.log(data);
    // loop over the inputs and return an array of promises, one for each update
    const promises = data.map(i => {
      return db.MediaInPlaylists.update(i, {
        where: {
          mediaId: i.mediaId,
          playlistId: i.playlistId
        }
      });
    });
    // resolve all the db calls at once
    await Promise.all(promises);
    res.sendStatus(201);
  };

  // Delete a video from playlist by mediaId and playlistId
  const deleteOne = function (req, res) {
    db.MediaInPlaylists
      .destroy({
        where: req.body,
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
    findAll,
    create,
    update,
    deleteOne,
  }
}