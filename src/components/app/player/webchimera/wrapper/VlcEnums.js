/**
 * @module WrapChimera
 */

const StateValues = [
    "Idle",
    "Opening",
    "Buffering",
    "Playing",
    "Paused",
    "Stopped",
    "Ended",
    "Error",
];

const PlayerPixelFormat = ['RV32', 'I420'];

const Channel = [
    "Error",
    "Stereo",
    "ReverseStereo",
    "Left",
    "Right",
    "Dolby",
]

const DeinterlaceMode = [
    'off', 'blend', 'bob', 'discard', 'linear', 'mean', 'x', 'yadif', 'yadif2x'
]

const PlaylistMode = ['Normal', 'Loop', 'Single'];

/**
 * Enums used in this module
 * @type {{StateValues: string[], PlayerPixelFormat: string[], Channel: string[], PlaylistMode: string[], DeinterlaceMode: string[]}}
 */
const enums = {StateValues, PlayerPixelFormat, Channel, DeinterlaceMode, PlaylistMode}

module.exports = enums;