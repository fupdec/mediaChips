module.exports = function (db) {
  // Create and Save a new Folder
  const create = async function (req, res) {
    const {
      folder,
      types
    } = req.body

    const [folderRow, isCreated] = await db.WatchedFolder.findOrCreate({
      where: {
        path: folder.path,
      },
      defaults: {
        name: folder.name
      },
    })

    if (!isCreated) {
      db.WatchedFolder
        .update({
          name: folder.name
        }, {
          where: {
            id: folderRow.id
          }
        })
    }

    await db.MediaTypesInWatchedFolders.destroy({
      where: {
        folderId: folderRow.id
      }
    })

    for (let i of types) {
      await db.MediaTypesInWatchedFolders.findOrCreate({
        where: {
          folderId: folderRow.id,
          mediaTypeId: i,
        }
      })
    }
    res.sendStatus(201)
  };

  // Update a Folder by the id in the request
  const update = function (req, res) {
    db.WatchedFolder
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

  // Delete a Folder with the specified id in the request
  const deleteOne = function (req, res) {
    db.WatchedFolder
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
    update,
    deleteOne
  }
}