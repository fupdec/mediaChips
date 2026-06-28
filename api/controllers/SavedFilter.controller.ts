module.exports = function (db) {
  // Create and Save a new SavedFilter
  const Op = db.Sequelize.Op
  const {
    getDynamicPlaylistsBasic,
    getDynamicPlaylistsSummary,
    getSavedFilterPlaylistSummary,
    getFilteredMediaForPlayback,
    getFilteredMediaForSavedFilter,
  } = require('../services/savedFilterMedia')

  const create = function (req, res) {
    const payload = {
      name: req.body.name ?? null,
      mediaTypeId: req.body.mediaTypeId ?? null,
      metaId: req.body.metaId ?? null,
      tagId: req.body.tagId ?? null,
      tabId: req.body.tabId ?? null,
    }

    const savePromise = payload.name
      ? db.SavedFilter.create(payload).then(instance => [instance, true])
      : db.SavedFilter.findOrCreate({where: payload})

    savePromise
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

  const dynamicPlaylistsBasic = async function (req, res) {
    try {
      const data = await getDynamicPlaylistsBasic(db)
      res.status(201).send(data)
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving dynamic playlists."
      })
    }
  };

  const dynamicPlaylistsSummary = async function (req, res) {
    try {
      const data = await getDynamicPlaylistsSummary(db)
      res.status(201).send(data)
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving dynamic playlists."
      })
    }
  };

  const getPlaylistSummary = async function (req, res) {
    try {
      const data = await getSavedFilterPlaylistSummary(db, parseInt(req.params.id, 10))
      res.status(201).send({
        count: Number(data.count) || 0,
        previewIds: data.previewIds || [],
      })
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving playlist summary."
      })
    }
  };

  const getPlaylistMedia = async function (req, res) {
    try {
      const forPlayback = req.query.mode === 'play' || req.query.playback === '1'
      const result = forPlayback
        ? await getFilteredMediaForPlayback(db, parseInt(req.params.id))
        : await getFilteredMediaForSavedFilter(db, parseInt(req.params.id))
      res.status(201).send({
        items: result.items,
        count: result.count,
      })
    } catch (err) {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving playlist media."
      })
    }
  };

  return {
    create,
    findOne,
    findAll,
    update,
    deleteOne,
    dynamicPlaylistsBasic,
    dynamicPlaylistsSummary,
    getPlaylistSummary,
    getPlaylistMedia,
  }
}