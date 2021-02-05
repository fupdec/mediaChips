/**
 * @module WrapChimera
 */

const {Channel} = require('./VlcEnums')

/**
 * VLC Audio control
 */
class VlcAudio {
    constructor(audio) {
        this._audio = audio;
    }

    /**
     * List audio track names
     * @returns {string[]}
     */
    get tracks() {
        return this._audio.tracks;
    }

    /**
     * A value between [1-65535] which indicates the audio track to play or that is playing. a value of 0 means the audio is/will be disabled.
     * @returns {int}
     */
    get track() {
        return this._audio.track;
    }

    /**
     * A value between [1-65535] which indicates the audio track to play or that is playing. a value of 0 means the audio is/will be disabled.
     * @param {int} index index of track
     */
    set track(index) {
        this._audio.track = index;
    }

    /**
     * Boolean value to mute and unmute the audio.
     * @returns {boolean}
     */
    get mute() {
        return this._audio.mute;
    }

    /**
     * Boolean value to mute and unmute the audio.
     * @param {boolean} mute
     */
    set mute(mute) {
        this._audio.mute = mute;
    }

    /**
     * A value between [0-200] which indicates a percentage of the volume.
     * @returns {number}
     */
    get volume() {
        return this._audio.volume;
    }

    /**
     * A value between [0-200] which indicates a percentage of the volume.
     * @param {number} volume
     */
    set volume(volume) {
        let newValue = Math.max(0, Math.min(volume, 200));
        if (newValue > this.volume && this.mute)
            this.mute = false;
        this._audio.volume = newValue;
    }

    /**
     * Integer string value that indicates which audio channel mode is used.
     * @returns {("Error"|"Stereo"|"ReverseStereo"|"Left"|"Right"|"Dolby")}
     */
    get channel() {
        return Channel[this._audio.channel];
    }

    /**
     * String value that indicates which audio channel mode is used.
     * @param {("Error"|"Stereo"|"ReverseStereo"|"Left"|"Right"|"Dolby")} channel Channel
     */
    set channel(channel) {
        if (!Channel.includes(channel))
            throw new Error("Channel should be one of " + Channel.toString())
        this._audio.channel = Channel.indexOf(channel);
    }

    /**
     * Integer value in milliseconds, can be positive or negative.
     * @returns {int}
     */
    get delay() {
        return this._audio.delay;
    }

    /**
     * Integer value in milliseconds, can be positive or negative.
     * @param {int} delay
     */
    set delay(delay) {
        this._audio.delay = delay;
    }

    /**
     * Boolean toggle that mutes and unmutes the audio based upon the previous state.
     * @returns {void}
     */
    toggleMute() {
        this.mute = !this.mute;
    }
}

module.exports = VlcAudio;