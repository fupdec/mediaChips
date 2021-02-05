/**
 * @module WrapChimera
 */

const {PlaylistMode} = require('./VlcEnums')
const VlcMedia = require('./VlcMedia')

/**
 * VLC Playlist
 */
class VlcPlaylist {
    constructor(playlist) {
        this._playlist = playlist;
    }

    /**
     * Playlist items collection
     * @returns {VlcMedia[]}
     */
    get items() {
        return this._playlist.items.items.map(m => new VlcMedia(m));
    }

    /**
     * A boolean that returns true if the current playlist item is playing and false when it is not playing.
     * @returns {boolean}
     */
    get isPlaying() {
        return this._playlist.isPlaying;
    }

    /**
     * Returns current item index.
     * @returns {int}
     */
    get currentItem() {
        return this._playlist.currentItem;
    }

    /**
     * Set current item index.
     * @param {int} index
     */
    set currentItem(index) {
        this._playlist.currentItem = index;
    }

    /**
     * Playlist mode
     * <pre>
     * Normal: play till last item.
     * Loop: infinite repeat all items.
     * Single: play current playlist item and stop.
     * </pre>
     * @returns {('Normal'|'Loop'|'Single')}
     */
    get mode() {
        return PlaylistMode[this._playlist.mode];
    }

    /**
     * Playlist mode
     * <pre>
     * Normal: play till last item.
     * Loop: infinite repeat all items.
     * Single: play current playlist item and stop.
     * </pre>
     * @param {('Normal'|'Loop'|'Single')} mode
     */
    set mode(mode) {
        if (!PlaylistMode.includes(mode))
            throw new Error("Playlist mode should be one of " + PlaylistMode.toString())
        this._playlist.mode = PlaylistMode.indexOf(mode);
    }

    /**
     * Add a playlist item
     * @param {string|undefined} mrl Media Resource Locator
     * @param {Object|undefined} options
     */
    add(mrl, options = undefined) {
        if (options === undefined)
            this._playlist.add(mrl)
        else
            this._playlist.addWithOptions(mrl, options)
    }

    /**
     * Start playing the current playlist item.
     */
    play() {
        this._playlist.play()
    }

    /**
     * Start playing the specified item.
     * @param {int} index
     * @returns {boolean}
     */
    playItem(index) {
        return this._playlist.playItem(index)
    }

    pause() {
        this._playlist.pause()
    }

    togglePause() {
        this._playlist.togglePause()
    }

    stop() {
        this._playlist.stop()
    }

    /**
     * Iterate to the next playlist item.
     */
    next() {
        this._playlist.next()
    }

    /**
     * Iterate to the previous playlist item.
     */
    prev() {
        this._playlist.prev()
    }

    /**
     * Empty the current playlist, all items will be deleted from the playlist.
     */
    clear() {
        this._playlist.clear()
    }

    /**
     * Remove the specified item from playlist.
     * @param {int} index
     * @returns {boolean}
     */
    removeItem(index) {
        return this._playlist.removeItem(index)
    }

    /**
     * Change item position within playlist.
     * @param {int} index
     * @param {int} count
     */
    advanceItem(index, count) {
        return this._playlist.advanceItem(index, count)
    }
}

module.exports = VlcPlaylist;