module.exports = function (db) {
  // Create and Save a new FilterRow
  const create = async function (req, res) {
    let filterObj = req.body.filter
    let val = filterObj.val
    // getting values from filter row
    if (filterObj.type == 'array' && filterObj.param !== 'country')
      filterObj.val = null
    if (filterObj.param == 'country' && filterObj.val) {
      filterObj.val = filterObj.val.join(',')
    }

    const [filterRow, isCreated] = await db.FilterRow.findOrCreate({
      where: {
        id: req.body.rowId,
      },
      defaults: filterObj,
    }).catch(err => {
      console.log(err)
      res.status(500).send({
        message: err.message || "Some error occurred while performing query."
      })
    })

    if (isCreated) {
      await db.FilterRowsInSavedFilter.create({
        filterId: req.body.filterId,
        rowId: filterRow.id
      }).catch(err => {
        console.log(err)
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
    } else {
      await db.FilterRow.update(filterObj, {
        where: {
          id: req.body.rowId,
        },
      }).catch(err => {
        console.log(err)
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
    }

    if (filterObj.type == 'array' && filterObj.param !== 'country') {
      // deleting previously stored values
      await db.TagsInFilterRow.destroy({
        where: {
          rowId: filterRow.id
        }
      }).catch(err => {
        console.log(err)
        res.status(500).send({
          message: err.message || "Some error occurred while performing query."
        })
      })
      // TODO fix multiple filter rows with tags as param 'by'
      if (!filterObj.cond.includes('null') && val !== undefined && val !== null && val !== '')
        for (let i of val) {
          console.log(i)
          await db.TagsInFilterRow.findOrCreate({
            where: {
              tagId: i,
              rowId: filterRow.id,
              metaId: filterRow.param
            }
          }).catch(err => {
            console.log(err)
            res.status(500).send({
              message: err.message || "Some error occurred while performing query."
            })
          })
        }
    }
    res.sendStatus(201)
  };

  // Find a single FilterRow with an id
  const findOne = function (req, res) {
    db.FilterRow
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

  // Update a FilterRow by the id in the request
  const update = function (req, res) {
    db.FilterRow
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

  // Delete a FilterRow with the specified id in the request
  const deleteOne = function (req, res) {
    db.FilterRow
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
    update,
    deleteOne
  }
}