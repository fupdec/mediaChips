import { apiClient } from '../apiClient'
import {
  API_ROUTES,
  apiTab,
  apiWatchedFolder,
} from '@shared/api/routes'
import type {
  WatchedFolderCreatePayload,
  WatchedFolderUpdatePayload,
  VideoTimelineTaskPayload,
} from '@shared/api/responses'
import type {
  AddMediaPayload,
  BackupNamePayload,
  BulkMetaApplyPayload,
  ConfigUpdatePayload,
  CreateImagePayload,
  CreateMarkThumbPayload,
  CreateThumbPayload,
  CreateFilterRowPayload,
  CreatePlaylistPayload,
  CreateSavedFilterPayload,
  DatabaseSizesPayload,
  DeleteMediaInPlaylistsPayload,
  FolderSizePayload,
  GetFileBlobPayload,
  GetFileListPayload,
  MediaInPlaylistOrderPayload,
  SearchMediaByPathPayload,
  TabCreatePayload,
  TabUpdatePayload,
  UpdateMediaMultiplePayload,
  UpdatePlaylistPayload,
  UpdateSavedFilterPayload,
  VideoPreviewTaskPayload,
} from '@shared/api/payloads'
import {
  parseAddMediaResponse,
  parseBackupList,
  parseClipModelStatus,
  parseDatabaseSizesResponse,
  parseFileExistsResponse,
  parseFileListResponse,
  parseFolderSizeResponse,
  parseMediaPathSearchResults,
  parseResolvePathResponse,
  parseTab,
  parseWatchedFolderLinks,
} from '@shared/schemas'
import { validated } from './validate'

export const tasksApi = {
  checkFileExists(path: string) {
    return apiClient.post(API_ROUTES.taskCheckFileExists, { path }).then((res) => ({
      ...res,
      data: validated(parseFileExistsResponse, res.data),
    }))
  },

  resolvePath(filePath: string) {
    return apiClient.post(API_ROUTES.resolvePath, { filePath }).then((res) => ({
      ...res,
      data: validated(parseResolvePathResponse, res.data),
    }))
  },

  getFileBlob(body: GetFileBlobPayload) {
    return apiClient.post<Blob>(API_ROUTES.getFile, body, { responseType: 'blob' })
  },

  createThumb(body: CreateThumbPayload) {
    return apiClient.post(API_ROUTES.taskCreateThumb, body)
  },

  deleteLocalFile(path: string) {
    return apiClient.post(API_ROUTES.taskDeleteFile, { path })
  },

  createImage(body: CreateImagePayload) {
    return apiClient.post(API_ROUTES.taskCreateImage, body)
  },

  createMarkThumb(body: CreateMarkThumbPayload) {
    return apiClient.post(API_ROUTES.taskCreateMarkThumb, body)
  },

  updateMediaInfo(id: number) {
    return apiClient.post(API_ROUTES.taskUpdateMediaInfo, { id })
  },

  openPath(body: { path: string; isDir?: boolean }) {
    return apiClient.post(API_ROUTES.taskOpenPath, body)
  },

  updateConfig(data: ConfigUpdatePayload) {
    return apiClient.post(API_ROUTES.updateConfig, data)
  },

  switchDatabase(body: { databaseId: string }) {
    return apiClient.post(API_ROUTES.switchDatabase, body)
  },

  getFileList(body: GetFileListPayload) {
    return apiClient.post(API_ROUTES.taskGetFileList, body).then((res) => ({
      ...res,
      data: validated(parseFileListResponse, res.data),
    }))
  },

  postTaskEndpoint<T = unknown>(endpoint: string, body: Record<string, unknown>) {
    return apiClient.post<T>(`/api/Task/${endpoint}`, body)
  },

  addMedia(body: AddMediaPayload) {
    return apiClient.post('/api/Task/addMedia', body).then((res) => ({
      ...res,
      data: validated(parseAddMediaResponse, res.data),
    }))
  },

  taskCreateGrid(body: VideoPreviewTaskPayload) {
    return apiClient.post(API_ROUTES.taskCreateGrid, body)
  },

  taskCreateTimeline(body: VideoTimelineTaskPayload) {
    return apiClient.post(API_ROUTES.taskCreateTimeline, body)
  },

  taskCreateThumbForVideo(body: VideoPreviewTaskPayload) {
    return apiClient.post(API_ROUTES.taskCreateThumbForVideo, body)
  },

  cleanLowDb() {
    return apiClient.post(API_ROUTES.taskCleanLowDb)
  },

  createBackupLowDb(body: BackupNamePayload) {
    return apiClient.post<{ data?: string } | string>(API_ROUTES.taskCreateBackupLowDb, body)
  },

  restoreBackup(body: BackupNamePayload) {
    return apiClient.post(API_ROUTES.tasksBackupsRestoreBackup, body)
  },

  getBackups() {
    return apiClient.get(API_ROUTES.tasksBackupsGetBackups).then((res) => ({
      ...res,
      data: validated(parseBackupList, res.data),
    }))
  },

  createBackup() {
    return apiClient.get(API_ROUTES.tasksBackupsCreateBackup)
  },

  deleteBackup(body: BackupNamePayload) {
    return apiClient.post(API_ROUTES.tasksBackupsDeleteBackup, body)
  },

  importBackup(body: BackupNamePayload) {
    return apiClient.post(API_ROUTES.tasksBackupsImportBackup, body)
  },

  exportBackup(body: BackupNamePayload) {
    return apiClient.post(API_ROUTES.tasksBackupsExportBackup, body)
  },

  updateWatchedFolder(id: number, data: WatchedFolderUpdatePayload) {
    return apiClient.put(apiWatchedFolder(id), data)
  },

  createWatchedFolder(body: WatchedFolderCreatePayload) {
    return apiClient.post(API_ROUTES.watchedFolder, body)
  },

  deleteWatchedFolder(id: number) {
    return apiClient.delete(apiWatchedFolder(id))
  },

  getMediaTypesInWatchedFolders() {
    return apiClient.get(API_ROUTES.mediaTypesInWatchedFolders).then((res) => ({
      ...res,
      data: validated(parseWatchedFolderLinks, res.data),
    }))
  },

  applyBulkMeta(body: BulkMetaApplyPayload) {
    return apiClient.post(API_ROUTES.bulkMetaApply, body)
  },

  searchMediaByPath(body: SearchMediaByPathPayload) {
    return apiClient.post(API_ROUTES.taskSearchMediaByPath, body).then((res) => ({
      ...res,
      data: validated(parseMediaPathSearchResults, res.data),
    }))
  },

  updateMediaMultiple(body: UpdateMediaMultiplePayload) {
    return apiClient.post(API_ROUTES.taskUpdateMediaMultiple, body)
  },

  getDatabaseSizes(body: DatabaseSizesPayload = {}) {
    return apiClient.post(API_ROUTES.taskGetDatabaseSizes, body).then((res) => ({
      ...res,
      data: validated(parseDatabaseSizesResponse, res.data),
    }))
  },

  deleteDb(body: BackupNamePayload) {
    return apiClient.post(API_ROUTES.taskDeleteDb, body)
  },

  clearGeneratedData(body: BackupNamePayload) {
    return apiClient.post(API_ROUTES.taskClearData, body)
  },

  getFolderSize(body: FolderSizePayload) {
    return apiClient.post(API_ROUTES.taskGetFolderSize, body).then((res) => ({
      ...res,
      data: validated(parseFolderSizeResponse, res.data),
    }))
  },

  getClipModelStatus() {
    return apiClient.get(API_ROUTES.taskClipModelStatus).then((res) => ({
      ...res,
      data: validated(parseClipModelStatus, res.data),
    }))
  },

  downloadClipModel(body: BackupNamePayload = {}) {
    return apiClient.post(API_ROUTES.taskDownloadClipModel, body).then((res) => ({
      ...res,
      data: validated(parseClipModelStatus, res.data),
    }))
  },

  clearTranscodeCache<T = Record<string, unknown>>() {
    return apiClient.delete<T>(API_ROUTES.transcodeCache)
  },

  createTab(body: TabCreatePayload) {
    return apiClient.post(API_ROUTES.tab, body).then((res) => ({
      ...res,
      data: validated(parseTab, res.data),
    }))
  },

  updateTab(id: number, data: TabUpdatePayload) {
    return apiClient.put(apiTab(id), data)
  },

  deleteTab(id: number) {
    return apiClient.delete(apiTab(id))
  },

  putApiPath(path: string, data: Record<string, unknown>) {
    return apiClient.put(path, data)
  },
}
