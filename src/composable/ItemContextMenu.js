import {ref, computed} from 'vue'
import axios from 'axios'
import {useAppStore} from '@/stores/app'
import {useItemsStore} from '@/stores/items'
import {useSettingsStore} from '@/stores/settings'
import {useDialogsStore} from '@/stores/dialogs'
import {useOperationsStore} from '@/stores/operations'
import {useNotificationsStore} from '@/stores/notifications'
import {useEventBus} from "@/utils/eventBus";
import path from 'path-browserify'
import {
  getCurrentMediaType,
  getDefaultMediaTypeId,
  getMediaDeleteAssetFolder,
  isAudioMediaType,
  isImageMediaType,
  isTextMediaType,
  isVideoMediaType,
} from '@/utils/mediaType'
import translate from '@/utils/translate'
import {resolveSelectedMediaItems} from '@/utils/resolveSelection'

export default function useItemContextMenu(item, type, meta, is_file_exists, emitFn) {
  const store = useAppStore()
  const dialogsStore = useDialogsStore()
  const notificationsStore = useNotificationsStore()
  const operationsStore = useOperationsStore()
  const playlistsStore = useAppStore().playlists
  const itemsStore = useItemsStore()
  const settingsStore = useSettingsStore()

  const eventBus = useEventBus()

  const apiUrl = computed(() => store.localhost)

  const currentMediaType = computed(() => {
    if (type === 'media') {
      return getCurrentMediaType(store.mediaTypes, item.mediaTypeId || itemsStore.environment?.media_type_id)
    }
    return getCurrentMediaType(store.mediaTypes, itemsStore.environment?.media_type_id)
  })

  const getContextMenu = () => {
    let contextMenu = []

    if (!itemsStore.isSelect) {
      contextMenu.push({
        name: `Edit`,
        type: "item",
        icon: "pencil",
        action: editItem,
      })
    } else {
      contextMenu.push({
        name: `Bulk Edit`,
        type: "item",
        icon: "pencil-plus",
        disabled: itemsStore.selection.length === 0,
        action: () => {
          dialogsStore.bulkEditingItems = true
          itemsStore.isSelect = false
        },
      })
    }

    if (type === 'tag') {
      if (!itemsStore.isSelect) {
        contextMenu.push({type: "divider"})
        contextMenu.push({
          name: "Open in new tab",
          type: "item",
          icon: "tab",
          action: openNewTab,
        })
        contextMenu.push({type: "divider"})
      }
    } else if (type === 'media') {
      contextMenu.push({
        name: `Parse Tags in path`,
        type: "item",
        icon: "text-box-search",
        disabled: itemsStore.isSelect && itemsStore.selection.length === 0,
        action: parseMetadata,
      })

      contextMenu.push({
        name: `Update File Info`,
        type: "item",
        icon: "file-sync-outline",
        disabled: !is_file_exists || (itemsStore.isSelect && itemsStore.selection.length === 0),
        action: updateFileInfo,
      })

      contextMenu.push({type: "divider"})

      if (!itemsStore.isSelect && isVideoMediaType(currentMediaType.value)) {
        contextMenu.push({
          name: `Play video in`,
          type: "menu",
          icon: "play-circle",
          disabled: !is_file_exists || (!store.reg && store.x > 14),
          menu: [
            {
              name: `MediaChips Player`,
              type: "item",
              icon: "open-in-app",
              disabled: !is_file_exists,
              action: play,
            },
            {
              name: `External Player`,
              type: "item",
              icon: "open-in-new",
              disabled: !is_file_exists,
              action: () => {
                play(true)
              },
            },
          ],
        })
      }

      if (!itemsStore.isSelect && isAudioMediaType(currentMediaType.value)) {
        contextMenu.push({
          name: `Play audio in`,
          type: "menu",
          icon: "play-circle",
          disabled: !is_file_exists || (!store.reg && store.x > 14),
          menu: [
            {
              name: `MediaChips Player`,
              type: "item",
              icon: "open-in-app",
              disabled: !is_file_exists,
              action: play,
            },
            {
              name: `External Player`,
              type: "item",
              icon: "open-in-new",
              disabled: !is_file_exists,
              action: () => {
                play(true)
              },
            },
          ],
        })
      }

      if (!itemsStore.isSelect && isImageMediaType(currentMediaType.value)) {
        contextMenu.push({
          name: `View image`,
          type: "item",
          icon: "image-search",
          disabled: !is_file_exists,
          action: () => {
            itemsStore.viewImage({image: item})
          },
        })
        contextMenu.push({
          name: `Open image file`,
          type: "item",
          icon: "file-image",
          disabled: !is_file_exists,
          action: () => {
            if (window.$operable?.openPath) {
              window.$operable.openPath(item.path)
            }
          },
        })
      }

      if (!itemsStore.isSelect && isTextMediaType(currentMediaType.value)) {
        contextMenu.push({
          name: `Open text file`,
          type: "item",
          icon: "file-document-outline",
          disabled: !is_file_exists,
          action: () => {
            if (window.$operable?.openPath) {
              window.$operable.openPath(item.path)
            }
          },
        })
      }

      if (!itemsStore.isSelect) {
        contextMenu.push({
          name: `Open file's folder`,
          type: "item",
          icon: "folder-open",
          disabled: !is_file_exists,
          action: () => {
            if (window.$operable && window.$operable.openPath) {
              window.$operable.openPath(item.path, true)
            }
          },
        })
      }

      contextMenu.push({
        name: `Move file to...`,
        type: "item",
        icon: "file-move",
        disabled: (itemsStore.isSelect && itemsStore.selection.length === 0) || !is_file_exists || operationsStore.moving.active,
        action: moveTo,
      })

      contextMenu.push({
        name: `Organize by tag...`,
        type: "item",
        icon: "folder-plus",
        disabled: (itemsStore.isSelect && itemsStore.selection.length === 0) || !is_file_exists,
        action: organizeFolderByTag,
      })

      const getMediaIdsForPlaylist = () => {
        if (itemsStore.isSelect) return [...itemsStore.selection]
        return [item.id]
      }

      let menuPlaylists = [
        {
          name: translate('playlists.create_playlist', {}, settingsStore.locale),
          type: "item",
          icon: "playlist-plus",
          action: () => {
            dialogsStore.createPlaylistForMedia(getMediaIdsForPlaylist())
          },
        },
      ]

      if ((playlistsStore || []).length > 0) {
        menuPlaylists.push({type: "divider"})
        menuPlaylists.push(...(playlistsStore || []).map(i => ({
          name: i.name,
          type: "item",
          icon: "plus",
          action: async () => {
            await addMediaToPlaylist(item.id, i.id)
          },
        })))
      }

      contextMenu.push({
        name: translate('playlists.add_to_playlist', {}, settingsStore.locale),
        type: "menu",
        icon: "playlist-plus",
        menu: menuPlaylists,
        disabled: itemsStore.isSelect && itemsStore.selection.length === 0,
      })

      contextMenu.push({type: "divider"})
    }

    const is_selected = itemsStore.selection.includes(item.id)
    contextMenu.push({
      name: is_selected ? 'Unselect' : 'Select',
      icon: is_selected ? "checkbox-blank-outline" : "checkbox-marked-outline",
      type: "item",
      action: toggleSelect,
    })

    contextMenu.push({type: "divider"})

    contextMenu.push({
      name: `Delete`,
      type: "item",
      icon: "delete",
      color: "red",
      disabled: itemsStore.isSelect && itemsStore.selection.length === 0,
      action: deleteItem,
    })

    return contextMenu
  }

  const editItem = () => {
    if (type === 'media' || currentMediaType.value) {
      dialogsStore.editMedia(item, currentMediaType.value)
    } else if (type === 'tag') {
      dialogsStore.editTag(item, meta)
    }
  }

  const toggleSelect = (e) => {
    itemsStore.toggleSelect(e, item);
  }

  // методы тега
  const openNewTab = async () => {
    try {
      await axios({
        method: "post",
        url: apiUrl.value + "/api/tab",
        data: {
          name: item.name,
          icon: meta?.icon,
          url: "/tag",
          tagId: item.id,
          metaId: meta?.id,
          mediaTypeId: getDefaultMediaTypeId(store.mediaTypes),
        },
      })
      eventBus.emit('getTabs')
    } catch (e) {
      console.error(e)
    }
  }

  // методы видео
  const parseMetadata = async () => {
    let videos = [];
    if (itemsStore.isSelect) {
      videos = await resolveSelectedMediaItems(itemsStore.selection)
    } else videos.push(item);

    let vals = [];
    let updated = [];
    try {
      const parseResponse = await axios({
        method: "post",
        url: apiUrl.value + "/api/Task/parsePathTags",
        data: {
          paths: videos.map(i => ({path: i.path, mediaId: i.id})),
        },
      });
      vals = parseResponse.data || [];
    } catch (e) {
      console.error(e);
      for (let i of videos) {
        const v = $readable.parseFilePath(i.path, i.id);
        vals = [...vals, ...v];
      }
    }

    updated = [...new Set(vals.map(i => i.mediaId))];

    let added = [];
    for (let i of vals) {
      await axios({
        method: "post",
        url: apiUrl.value + "/api/TagsInMedia/createOne",
        data: i,
      })
        .then((res) => {
          if (res.data[1]) added.push(1);
        })
        .catch((e) => {
          console.log(e);
        });
    }
    $operable.setNotification({
      type: added.length > 0 ? "success" : "info",
      title: `Parsing completed`,
      text: `Tags added: ${added.length}`,
      icon: 'text-box-search',
    });
    if (added.length > 0) {
      eventBus.emit("getItemsFromDb", {
        ids: updated,
        type: 'media',
      });
    }
  }

  const updateFileInfo = async () => {
    let ids = []
    if (itemsStore.isSelect) {
      ids = itemsStore.selection
    } else {
      ids = [item.id]
    }

    let updated = [];
    for (let id of ids) {
      await axios({
        method: "post",
        url: apiUrl.value + "/api/task/updateMediaInfo",
        data: {id: id},
      })
        .then((res) => {
          updated.push(id)
        })
        .catch((e) => {
          console.log(e);
        });
    }

    await $operable.setNotification({
      type: updated.length > 0 ? "success" : "info",
      title: `Update complete`,
      text: `Media updated: ${updated.length}`,
      icon: 'file-sync-outline',
    });
    if (updated.length > 0) {
      eventBus.emit("getItemsFromDb", {
        ids: updated,
        type: 'media',
      });
    }
  }

  const moveTo = () => {
    if (!is_file_exists) return

    let ids = [item.id]
    if (itemsStore.isSelect) ids = itemsStore.selection

    const cb = (id) => {
      eventBus.emit('getItemsFromDb', {
        ids: [id],
        type: 'media',
      })
    }

    operationsStore.moving.dialog = true
    operationsStore.moving.ids = ids
    operationsStore.moving.items = null
    operationsStore.moving.folderPath = path.dirname(item.path)
    operationsStore.moving.callback = cb
  }

  const organizeFolderByTag = () => {
    if (!is_file_exists) return

    let ids = [item.id]
    if (itemsStore.isSelect) {
      ids = itemsStore.selection
    }
    operationsStore.create_folder_move_media.ids = ids
    operationsStore.create_folder_move_media.dialog = true
  }

  const addMediaToPlaylist = async (mediaId, playlistId) => {
    let arr = []
    if (itemsStore.isSelect) {
      arr = itemsStore.selection.map(id => {
        return {
          mediaId: id,
          playlistId: playlistId,
        }
      })
    } else {
      arr.push({
        mediaId: mediaId,
        playlistId: playlistId,
      })
    }

    for (let data of arr) {
      try {
        await axios({
          method: "post",
          url: apiUrl.value + "/api/mediaInPlaylists/",
          data: data,
        })
      } catch (e) {
        console.error(e)
      }
    }

    itemsStore.isSelect = false
    eventBus.emit('getItemsFromDb', {
      ids: itemsStore.selection,
      type: 'media',
    })
  }

  const resolveSelectedMedia = resolveSelectedMediaItems

  const deleteItem = () => {
    const deleteItems = async () => {
      const is_checked = dialogsStore.confirm.checkBox

      let ids = [item.id]
      if (itemsStore.isSelect) {
        ids = itemsStore.selection
      }

      let data = {
        metaId: meta?.id,
        with_file: is_checked,
        type: getMediaDeleteAssetFolder(currentMediaType.value),
      }

      let deleted_items_names = []
      const itemsToDelete = type === 'media' && itemsStore.isSelect
        ? await resolveSelectedMedia(ids)
        : ids
          .map((id) => itemsStore.entities.find((entry) => entry.id === id))
          .filter(Boolean)

      for (const found of itemsToDelete) {
        deleted_items_names.push(found.name)

        data = {...data, ...{id: found.id, path: found.path}}

        try {
          await axios({
            method: "post",
            url: apiUrl.value + `/api/${type}/deleteOne`,
            data,
          })
        } catch (e) {
          console.error(e)
        }
      }

      itemsStore.selection = []
      itemsStore.selected_last = null
      itemsStore.isSelect = false

      notificationsStore.setNotification({
        type: 'info',
        title: 'The items has been deleted',
        text: deleted_items_names.join(', '),
      })

      eventBus.emit('removeEntitiesFromState', {
        ids: ids,
        type: type,
      })

      if (type === 'tag') {
        eventBus.emit('getTags', [])
      }

      if (type === 'media') {
        eventBus.emit('update:watcher')
      }
    }

    dialogsStore.confirm.text = 'Delete selected ' + type + ' from app?'
    dialogsStore.confirm.checkBoxText = type === 'media' ? "Also delete files" : ""
    dialogsStore.confirm.action = deleteItems
    dialogsStore.confirm.show = true
  }

  const play = (in_system) => {
    itemsStore.playVideo({
      video: item,
      in_system,
    })
  }

  return {
    getContextMenu,
    editItem,
    toggleSelect,
    openNewTab,
    parseMetadata,
    updateFileInfo,
    moveTo,
    organizeFolderByTag,
    addMediaToPlaylist,
    deleteItem,
    play
  }
}