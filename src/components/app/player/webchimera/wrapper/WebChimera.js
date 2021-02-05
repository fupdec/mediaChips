/**
 * @module WrapChimera
 */

let wc = require('electron').remote.require('wcjs-prebuilt');

// const wc = require('./WebChimera.js.x64')
// const wc2 = require('node-loader!./WebChimera.js.x64.node')
// import wc2 from 'node-loader!./WebChimera.js.x64.node'
// import wc2 from 'node-loader!./WebChimera.js.x64'

// console.log('wc2', wc2);

// const wc = require('electron').remote.require('wcjs-prebuilt');
// const wc = require('wcjs-prebuilt')
const VlcPlayer = require('./VlcPlayer')

/**
 * Main WebChimera control
 */
class WebChimera {
    /**
     * VLC Version
     * @returns {string}
     */
    get vlcVersion() {
        return wc.vlcVersion;
    }

    /**
     * VLC Change set
     * @returns {string}
     */
    get vlcChangeSet() {
        return wc.vlcChangeSet;
    }

    /**
     * Create a VLC player object
     * @param {...string} options Initialization options
     * @returns {VlcPlayer}
     */
    createPlayer(...options) {
        let player = wc.createPlayer(options);
        return new VlcPlayer(player)
    }
}

module.exports = WebChimera
