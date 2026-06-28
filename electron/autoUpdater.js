"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELEASES_URL = void 0;
exports.requiresManualInstall = requiresManualInstall;
exports.isUpdaterSupported = isUpdaterSupported;
exports.initAppUpdater = initAppUpdater;
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const electron_updater_1 = require("electron-updater");
exports.RELEASES_URL = 'https://github.com/fupdec/MediaChips/releases/latest';
const RELEASES_BASE = 'https://github.com/fupdec/MediaChips/releases/download';
let getMainWindow = () => null;
let currentState = { state: 'idle' };
function isPortableBuild() {
    return Boolean(process.env.PORTABLE_EXECUTABLE_DIR);
}
function isAppleDeveloperSigned() {
    if (process.platform !== 'darwin')
        return false;
    try {
        const output = (0, child_process_1.execSync)(`codesign -dv --verbose=2 "${process.execPath}" 2>&1`, {
            encoding: 'utf8',
        });
        return /Authority=Developer ID Application/i.test(output);
    }
    catch {
        return false;
    }
}
function requiresManualInstall() {
    if (process.platform !== 'darwin')
        return false;
    if (process.env.MEDIA_CHIPS_MAC_AUTO_INSTALL === '1')
        return false;
    return !isAppleDeveloperSigned();
}
function getMacDmgUrl(version) {
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    return `${RELEASES_BASE}/v${version}/MediaChips.v${version}.Mac.${arch}.dmg`;
}
function isSignatureValidationError(message) {
    const text = String(message || '');
    return /code signature/i.test(text) || /не удалось удовлетворить требован/i.test(text);
}
function isUpdaterSupported() {
    if (!electron_1.app.isPackaged)
        return false;
    if (process.env.MEDIA_CHIPS_DISABLE_UPDATER === '1')
        return false;
    if (isPortableBuild())
        return false;
    return true;
}
function getDisabledReason() {
    if (isPortableBuild())
        return 'portable';
    if (!electron_1.app.isPackaged)
        return 'dev';
    if (process.env.MEDIA_CHIPS_DISABLE_UPDATER === '1')
        return 'disabled';
    return null;
}
function sendStatus(payload) {
    currentState = {
        ...currentState,
        manualInstall: requiresManualInstall(),
        releasesUrl: exports.RELEASES_URL,
        ...payload,
    };
    const win = getMainWindow();
    if (win && !win.isDestroyed()) {
        win.webContents.send('updater:status', currentState);
    }
}
function formatReleaseNotes(info) {
    const notes = info?.releaseNotes;
    if (!notes)
        return '';
    if (typeof notes === 'string')
        return notes;
    if (Array.isArray(notes)) {
        return notes
            .map((note) => (typeof note === 'string' ? note : note?.note || ''))
            .filter(Boolean)
            .join('\n');
    }
    return '';
}
function sendDownloadedStatus(info) {
    const nextVersion = info.version;
    if (requiresManualInstall()) {
        sendStatus({
            state: 'downloaded-manual',
            nextVersion,
            downloadUrl: getMacDmgUrl(nextVersion),
        });
        return;
    }
    sendStatus({
        state: 'downloaded',
        nextVersion,
    });
}
function initAppUpdater({ getWindow }) {
    getMainWindow = getWindow;
    const disabledReason = getDisabledReason();
    if (disabledReason) {
        currentState = {
            state: 'disabled',
            reason: disabledReason,
            manualInstall: requiresManualInstall(),
            releasesUrl: exports.RELEASES_URL,
        };
    }
    else {
        electron_updater_1.autoUpdater.autoDownload = false;
        electron_updater_1.autoUpdater.autoInstallOnAppQuit = !requiresManualInstall();
        electron_updater_1.autoUpdater.allowDowngrade = false;
        electron_updater_1.autoUpdater.on('checking-for-update', () => {
            sendStatus({ state: 'checking' });
        });
        electron_updater_1.autoUpdater.on('update-available', (info) => {
            const nextVersion = info.version;
            const payload = {
                currentVersion: electron_1.app.getVersion(),
                nextVersion,
                releaseNotes: formatReleaseNotes(info),
            };
            if (requiresManualInstall()) {
                sendStatus({
                    ...payload,
                    state: 'available-manual',
                    downloadUrl: getMacDmgUrl(nextVersion),
                });
                return;
            }
            sendStatus({
                ...payload,
                state: 'available',
            });
        });
        electron_updater_1.autoUpdater.on('update-not-available', (info) => {
            sendStatus({
                state: 'up-to-date',
                currentVersion: info?.version || electron_1.app.getVersion(),
            });
        });
        electron_updater_1.autoUpdater.on('download-progress', (progress) => {
            sendStatus({
                state: 'downloading',
                percent: progress.percent,
                transferred: progress.transferred,
                total: progress.total,
            });
        });
        electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
            sendDownloadedStatus(info);
        });
        electron_updater_1.autoUpdater.on('error', (error) => {
            const message = error?.message || String(error);
            if (isSignatureValidationError(message) && requiresManualInstall()) {
                const nextVersion = currentState.nextVersion || electron_1.app.getVersion();
                sendStatus({
                    state: 'downloaded-manual',
                    nextVersion,
                    downloadUrl: currentState.downloadUrl || getMacDmgUrl(nextVersion),
                    message,
                });
                return;
            }
            sendStatus({
                state: 'error',
                message,
            });
        });
    }
    electron_1.ipcMain.handle('updater:is-supported', () => isUpdaterSupported());
    electron_1.ipcMain.handle('updater:get-state', () => ({ ...currentState }));
    electron_1.ipcMain.handle('updater:check', async () => {
        if (!isUpdaterSupported()) {
            return { ...currentState };
        }
        try {
            await electron_updater_1.autoUpdater.checkForUpdates();
            return { ...currentState };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            sendStatus({ state: 'error', message });
            return { ...currentState };
        }
    });
    electron_1.ipcMain.handle('updater:download', async () => {
        if (!isUpdaterSupported()) {
            return { ...currentState };
        }
        try {
            await electron_updater_1.autoUpdater.downloadUpdate();
            return { ...currentState };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            sendStatus({ state: 'error', message });
            return { ...currentState };
        }
    });
    electron_1.ipcMain.handle('updater:install', () => {
        if (!isUpdaterSupported()) {
            return { ...currentState };
        }
        if (requiresManualInstall() || currentState.state === 'downloaded-manual') {
            const url = currentState.downloadUrl || exports.RELEASES_URL;
            electron_1.shell.openExternal(url);
            return { ...currentState };
        }
        electron_updater_1.autoUpdater.quitAndInstall(false, true);
        return { ...currentState };
    });
}
