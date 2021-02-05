/**
 * @module WrapChimera
 */
const EventEmitter = require('events');
const {StateValues} = require('./VlcEnums')

/**
 * VLC Input file
 * @fires VlcInput#rateChange
 */
class VlcInput extends EventEmitter {
    constructor(input) {
        super();
        this._input = input;
        /**
         * Pixel width of video buffer
         * @type {int}
         */
        this.width = 0;
        /**
         * Pixel height of video buffer
         * @type {int}
         */
        this.height = 0;
        /**
         * @type {int}
         */
        this.uOffset = 0;
        /**
         * @type {int}
         */
        this.vOffset = 0;
    }

    /**
     * Duration of the input file in number of milliseconds. 0 is returned for 'live' streams or clips whose length cannot be determined by VLC. It returns -1 if no input is playing.
     * @returns {int}
     */
    get duration() {
        return this._input.length;
    }

    /**
     * Frames per second returned as a float (typically 60.0, 50.0, 23.976, etc...).
     * @returns {number}
     */
    get fps() {
        return this._input.fps;
    }

    /**
     * Returns current state
     * @returns {("Idle"|"Opening"|"Buffering"|"Playing"|"Paused"|"Stopped"|"Ended"|"Error")}
     */
    get state() {
        return StateValues[this._input.state];
    }

    /**
     * Returns true if video present, false otherwise
     * @returns {boolean}
     */
    get hasVout() {
        return this._input.hasVout;
    }

    /**
     * Normalized position in multimedia stream item given as a float value between [0.0..1.0].
     * @returns {number}
     */
    get position() {
        return this._input.position;
    }

    /**
     * Normalized position in multimedia stream item given as a float value between [0.0..1.0].
     * @param {number} position
     */
    set position(position) {
        this._input.position = Math.max(0, Math.min(position, 1));
    }

    /**
     * The absolute position in time given in milliseconds, this property can be used to seek through the stream.
     * @returns {number}
     */
    get time() {
        return this._input.position;
    }

    /**
     * The absolute position in time given in milliseconds, this property can be used to seek through the stream.
     * Will not fire seek event
     * @param {number} milliseconds
     */
    set time(milliseconds) {
        this._input.time = Math.max(0, Math.min(milliseconds, this.duration));
    }

    /**
     * Input speed given as float (1.0 for normal speed, 0.5 for half speed, 2.0 for twice as fast, etc.).
     * @returns {number}
     */
    get rate() {
        return this._input.rate;
    }

    /**
     * Input speed given as float (1.0 for normal speed, 0.5 for half speed, 2.0 for twice as fast, etc.).
     * @param {number} rate
     */
    set rate(rate) {
        this._input.rate = rate;
        /**
         * Rate change
         * @event VlcInput#rateChange
         */
        this.emit('rateChange', rate);
    }
}

module.exports = VlcInput;