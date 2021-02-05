/**
 * @module WrapChimera
 */

/**
 * VLC Media info
 */
class VlcMedia {
    constructor(media) {
        this._media = media;
    }

    /**
     * @returns {string}
     */
    get artist() {
        return this._media.artist;
    }

    /**
     * @returns {string}
     */
    get genre() {
        return this._media.genre;
    }

    /**
     * @returns {string}
     */
    get copyright() {
        return this._media.copyright;
    }

    /**
     * @returns {string}
     */
    get album() {
        return this._media.album;
    }

    /**
     * @returns {string}
     */
    get trackNumber() {
        return this._media.trackNumber;
    }

    /**
     * @returns {string}
     */
    get description() {
        return this._media.description;
    }

    /**
     * @returns {string}
     */
    get rating() {
        return this._media.rating;
    }

    /**
     * @returns {string}
     */
    get date() {
        return this._media.date;
    }

    /**
     * @returns {string}
     */
    get URL() {
        return this._media.URL;
    }

    /**
     * @returns {string}
     */
    get language() {
        return this._media.language;
    }

    /**
     * @returns {string}
     */
    get nowPlaying() {
        return this._media.nowPlaying;
    }

    /**
     * @returns {string}
     */
    get publisher() {
        return this._media.publisher;
    }

    /**
     * @returns {string}
     */
    get encodedBy() {
        return this._media.encodedBy;
    }

    /**
     * @returns {string}
     */
    get artworkURL() {
        return this._media.artworkURL;
    }

    /**
     * @returns {string}
     */
    get trackID() {
        return this._media.trackID;
    }

    /**
     * @returns {string}
     */
    get mrl() {
        return this._media.mrl;
    }

    /**
     * @returns {boolean}
     */
    get parsed() {
        return this._media.parsed;
    }

    /**
     * Returns media duration. Media should be parsed.
     * @returns {int}
     */
    get duration() {
        return this._media.duration;
    }

    /**
     * @returns {string}
     */
    get title() {
        return this._media.title;
    }

    /**
     * @param {string} title
     */
    set title(title) {
        this._media.title = title;
    }

    /**
     * @returns {string}
     */
    get setting() {
        return this._media.setting;
    }

    /**
     * @param {string} setting
     */
    set setting(setting) {
        this._media.setting = setting;
    }

    /**
     * Allow skip playlist item on next()/prev().
     * @returns {boolean}
     */
    get disabled() {
        return this._media.disabled;
    }

    /**
     * Allow skip playlist item on next()/prev().
     * @param {boolean} disabled
     */
    set disabled(disabled) {
        this._media.disabled = disabled;
    }

    parse() {
        this._media.parse();
    }

    parseAsync() {
        this._media.parseAsync();
    }
}

module.exports = VlcMedia;