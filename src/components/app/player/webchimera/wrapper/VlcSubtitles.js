/**
 * @module WrapChimera
 */

/**
 * VLC Subtitle control
 */
class VlcSubtitles {
    constructor(subtitles) {
        this._subtitles = subtitles;
    }

    /**
     * Get subtitle track names
     * @returns {string[]}
     */
    get tracks() {
        return this._subtitles.tracks;
    }

    /**
     * Get and set the subtitle track to show on the video screen. The property takes an integer as input value [1..65535]. If subtitle track is set to 0, the subtitles will be disabled. If set to a value outside the current subtitle tracks range, then it will return -1.
     * @returns {int}
     */
    get track() {
        return this._subtitles.track;
    }

    /**
     * Get and set the subtitle track to show on the video screen. The property takes an integer as input value [1..65535]. If subtitle track is set to 0, the subtitles will be disabled. If set to a value outside the current subtitle tracks range, then it will return -1.
     * @param index
     */
    set track(index) {
        this._subtitles.track = index;
    }

    /**
     * Integer value in milliseconds, can be positive or negative.
     * @returns {int}
     */
    get delay() {
        return this._subtitles.delay;
    }

    /**
     * Integer value in milliseconds, can be positive or negative.
     * @param milliseconds
     */
    set delay(milliseconds) {
        this._subtitles.delay = milliseconds;
    }

    /**
     * Load subtitles file
     * @param {string} path
     */
    load(path) {
        this._subtitles.load(path);
    }
}

module.exports = VlcSubtitles;