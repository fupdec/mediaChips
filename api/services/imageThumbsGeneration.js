"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageThumbsGenerationStatus = getImageThumbsGenerationStatus;
exports.iterateImageThumbsGeneration = iterateImageThumbsGeneration;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const promises_1 = require("fs/promises");
const contentHash_1 = require("./contentHash");
const media_1 = require("../db/repositories/media");
const mediaTypes_1 = require("../db/repositories/mediaTypes");
const imageMetadata_1 = require("../db/repositories/imageMetadata");
async function getImageMediaTypeId(db) {
    const mediaTypesRepo = (0, mediaTypes_1.createMediaTypesRepository)(db.drizzle);
    const imageType = mediaTypesRepo.findByType('image');
    return imageType?.id || null;
}
const getThumbPath = (dbPath, id) => path_1.default.join(dbPath, 'media/images/thumbs', `${id}.jpg`);
function hasImageThumb(dbPath, id) {
    return fs_1.default.existsSync(getThumbPath(dbPath, id));
}
function buildStatus(total, generated) {
    return {
        total,
        generated,
        pending: Math.max(total - generated, 0),
    };
}
async function loadGeneratedThumbIds(dbPath) {
    const dirPath = path_1.default.join(dbPath, 'media/images/thumbs');
    if (!fs_1.default.existsSync(dirPath))
        return new Set();
    const files = await (0, promises_1.readdir)(dirPath);
    const ids = new Set();
    for (const file of files) {
        if (file.endsWith('.jpg')) {
            ids.add(file.slice(0, -4));
        }
    }
    return ids;
}
async function getImageThumbsGenerationStatus(db, dbPath) {
    const mediaRepo = (0, media_1.createMediaRepository)(db.drizzle);
    const imageTypeId = await getImageMediaTypeId(db);
    const [thumbIds, imageRows] = await Promise.all([
        loadGeneratedThumbIds(dbPath),
        Promise.resolve(imageTypeId ? mediaRepo.findIdsByMediaType(imageTypeId) : []),
    ]);
    let generated = 0;
    for (const row of imageRows) {
        if (thumbIds.has(String(row.id)))
            generated += 1;
    }
    return buildStatus(imageRows.length, generated);
}
async function generateImageThumb(db, dbPath, item, imageMedia, { force = false } = {}) {
    const imageMetadataRepo = (0, imageMetadata_1.createImageMetadataRepository)(db.drizzle);
    const imagePath = await (0, contentHash_1.resolveExistingPath)(String(item.path || ''));
    if (!imagePath) {
        return { status: 'missing', id: item.id, path: item.path };
    }
    if (!force && hasImageThumb(dbPath, item.id)) {
        return { status: 'skipped', id: item.id, path: imagePath };
    }
    try {
        const metadata = await imageMedia.getImageMetadata(imagePath);
        if (metadata) {
            imageMetadataRepo.upsert({
                mediaId: Number(item.id),
                width: metadata.width,
                height: metadata.height,
                orientation: metadata.orientation,
            });
        }
        await imageMedia.createImageThumb(imagePath, item.id, dbPath);
        return { status: 'created', id: item.id, path: imagePath };
    }
    catch (error) {
        return {
            status: 'failed',
            id: item.id,
            path: imagePath,
            message: error instanceof Error ? error.message : String(error),
        };
    }
}
async function* iterateImageThumbsGeneration(db, dbPath, imageMedia, { shouldStop = () => false, force = false, } = {}) {
    const mediaRepo = (0, media_1.createMediaRepository)(db.drizzle);
    const imageTypeId = await getImageMediaTypeId(db);
    if (!imageTypeId) {
        yield { type: 'complete', processed: 0, total: 0, created: 0, skipped: 0, missing: 0, failed: 0 };
        return;
    }
    const total = mediaRepo.countByMediaType(imageTypeId);
    let processed = 0;
    let created = 0;
    let skipped = 0;
    let missing = 0;
    let failed = 0;
    let lastId = 0;
    yield {
        type: 'progress',
        processed,
        total,
        remaining: total,
        created,
        skipped,
        missing,
        failed,
    };
    while (!shouldStop()) {
        const item = mediaRepo.findNextByMediaTypeAfterId(imageTypeId, lastId);
        if (!item)
            break;
        lastId = Number(item.id);
        const result = await generateImageThumb(db, dbPath, item, imageMedia, { force });
        processed += 1;
        if (result.status === 'created')
            created += 1;
        else if (result.status === 'skipped')
            skipped += 1;
        else if (result.status === 'missing')
            missing += 1;
        else
            failed += 1;
        yield {
            type: 'progress',
            processed,
            total,
            remaining: Math.max(total - processed, 0),
            created,
            skipped,
            missing,
            failed,
            current: result.path,
            lastStatus: result.status,
        };
    }
    yield {
        type: 'complete',
        processed,
        total,
        created,
        skipped,
        missing,
        failed,
        stopped: shouldStop(),
    };
}
module.exports = {
    getImageThumbsGenerationStatus,
    iterateImageThumbsGeneration,
};
