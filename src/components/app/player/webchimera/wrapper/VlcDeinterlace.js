/**
 * @module WrapChimera
 */

const {DeinterlaceMode} = require('./VlcEnums')

/**
 * Deinterlace control
 */
class VlcDeinterlace {
    constructor(deinterlace) {
        this._deinterlace = deinterlace;
        this._mode = DeinterlaceMode[0]; // 'off'
    }

    /**
     * Deinterlacing mode.
     * Enabling too soon deinterlacing may cause some problems.
     * You have to wait that all variable are available before enabling it.
     * @returns {('off'|'blend'| 'bob'| 'discard'| 'linear'| 'mean'| 'x'| 'yadif'| 'yadif2x')}
     */
    get mode() {
        return this._mode;
    }

    /**
     * Deinterlacing mode.
     * Enabling too soon deinterlacing may cause some problems.
     * You have to wait that all variable are available before enabling it.
     * @param {('off'|'blend'| 'bob'| 'discard'| 'linear'| 'mean'| 'x'| 'yadif'| 'yadif2x')} mode
     * @returns {void}
     */
    set mode(mode) {
        if (!DeinterlaceMode.includes(mode))
            throw new Error("Deinterlace mode should be one of " + DeinterlaceMode.toString())
        this._mode = mode;
        if (mode === 'off')
            this._deinterlace.disable();
        else
            this._deinterlace.enable(mode);
    }
}

module.exports = VlcDeinterlace;