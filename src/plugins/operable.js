import axios from "axios";
import path from "path-browserify";
import _ from 'lodash'
import {parseCountries} from '@/utils/country'
import {useSettingsStore} from '@/stores/settings'
import {useItemsStore} from '@/stores/items'
import {useNotificationsStore} from '@/stores/notifications'
import {normalizePastedFilePath} from '@/utils/filePathInput'
import {resolveApiBaseUrl} from '@/utils/apiBaseUrl'

export default {
  install(app, options = {}) {
    const {router, store} = options

    const getApiBase = () => resolveApiBaseUrl(store.config) || store.localhost

    const operable = {

      async initConfig() {
        let config = null;

        try {
          const local = await axios.get("/config.json");
          config = local.data;
        } catch (error) {
          console.error(error);
        }
        console.log(config);

        if (!config) {
          const remote = await axios.get(window.location.origin + "/api/task/getConfig");
          config = remote.data;
        }
        store.localhost = resolveApiBaseUrl(config);
        store.appVersion = config.appVersion;
        store.dbPath = config.path;

        store.mediaPath = path.join(config.path, "media");
        store.databases = config.databases;
        store.config = config;

        return config;
      },

      async checkFileExists(filePath) {
        filePath = normalizePastedFilePath(filePath)
        if (!filePath) return false

        if (typeof window !== 'undefined') {
          if (window.$electronOperable?.checkFileExists) {
            const exists = await window.$electronOperable.checkFileExists(filePath)
            if (exists) return true
          }
          if (window.operableAPI?.checkFileExists) {
            const exists = await window.operableAPI.checkFileExists(filePath)
            if (exists) return true
          }
        }

        const apiBase = getApiBase()
        if (!apiBase) return false

        try {
          const response = await axios.post(apiBase + "/api/Task/checkFileExists", {
            path: filePath,
          })
          if (response.status === 200 || response.status === 201) {
            return true
          }
        } catch {}

        try {
          const response = await axios.post(apiBase + "/api/resolve-path", {filePath})
          return Boolean(response.data?.exists)
        } catch {
          return false
        }
      },

      async getLocalImage(imgPath, outside) {
        try {
          const res = await axios.post(
            getApiBase() + "/api/get-file",
            {url: imgPath, outside},
            {responseType: "blob"}
          );
          return URL.createObjectURL(res.data);
        } catch (e) {
          return path.join("/", "images/unavailable.png");
        }
      },

      async updateConfig(data) {
        return axios.post(getApiBase() + "/api/update-config", data);
      },

      async createImage(image, outputPath, sizes) {
        let url = null;
        const base64regex =
          /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

        const image_string = image?.length > 100 ? image.substring(0, 99) : null;

        if (image_string && !base64regex.test(image_string) && image.includes("http")) {
          url = image;
        }

        return axios.post(getApiBase() + "/api/Task/createImage", {
          image,
          outputPath,
          url,
          sizes,
        });
      },

      async deleteLocalFile(filePath) {
        return axios.post(getApiBase() + "/api/Task/deleteFile", {
          path: filePath,
        });
      },

      async createThumb(timestamp, inputPath, outputPath, width, overwrite) {
        return axios.post(getApiBase() + "/api/Task/createThumb", {
          timestamp,
          inputPath,
          outputPath,
          width,
          overwrite,
        });
      },

      async getOption(option) {
        return axios.get(getApiBase() + `/api/Setting/${option}`);
      },
      /*
      @param {Array} properties - array of options for the Electron dialog window
       */
      async showOpenDialog(properties) {
        let resultPaths = '';

        try {
          // Check API availability
          if (!window.electronAPI) {
            console.error('electronAPI не доступен');
            return;
          }

          if (!window.electronAPI.invoke) {
            console.error('electronAPI.invoke не доступен');
            return;
          }

          console.log('Вызываю showOpenDialog...');

          // Validate and normalize properties
          let dialogProperties = [];

          if (Array.isArray(properties)) {
            dialogProperties = properties;
          } else if (typeof properties === 'string') {
            dialogProperties = [properties];
          } else if (typeof properties === 'object' && properties !== null) {
            // If an object was passed, convert it to an array
            dialogProperties = Object.keys(properties).filter(key => properties[key] === true);
          }

          console.log('Нормализованные свойства:', dialogProperties);

          // Invoke the dialog method
          const result = await window.electronAPI.invoke('showOpenDialog', dialogProperties);

          console.log('Получен результат:', result);
          console.log('Тип результата:', typeof result);

          if (!result) {
            console.error('Результат пустой или undefined');
            return;
          }

          if (result.canceled) {
            console.log('Пользователь отменил выбор');
            return '';
          }

          if (result.error) {
            console.error('Ошибка в результате:', result.message);
            return '';
          }

          if (result.filePaths && result.filePaths.length > 0) {
            console.log('Выбрано путей:', result.filePaths.length);
            resultPaths = result.filePaths.join('\n');
            console.log('Пути сохранены:', resultPaths);
          } else {
            console.log('Пути не выбраны или массив пустой');
          }

        } catch (error) {
          console.error('Ошибка в showOpenDialog:', error);
          console.error('Стек ошибки:', error.stack);
        }

        return resultPaths;
      },

      setOption: _.debounce(async function(value, option) {
        let settings = useSettingsStore()
        settings[option] = value;
        return await axios.put(getApiBase() + `/api/Setting/${option}`, {value});
      }, 10),

      async createDbEntry(value, model) {
        return await axios.post(getApiBase() + `/api/${model}`, value);
      },

      async openPath(entryPath, isDirectory) {
        try {
          return await axios.post(getApiBase() + "/api/Task/openPath", {
            path: entryPath,
            isDir: isDirectory,
          });
        } catch (error) {
          const message = error.response?.data?.message || error.message
          operable.setNotification({
            type: 'error',
            title: 'Failed to open path',
            text: message,
          })
          throw error
        }
      },

      async getWatchedFolders() {
        try {
          const res = await axios.get(`${getApiBase()}/api/MediaTypesInWatchedFolders`)
          const watchedFolders = res.data

          const types = {}

          for (const i of watchedFolders) {
            const id = i.folderId
            if (!types[id]) types[id] = []
            types[id].push(i.mediaType)
          }

          const folders = _.uniqBy(watchedFolders, (i) => i.folderId)

          return folders.map((i) => {
            const folder = {...i.watchedFolder}
            folder.types = types[i.folderId]
            return folder
          })
        } catch (e) {
          console.error('getWatchedFolders error:', e)
          return []
        }
      },

      /**
       * Loads all saved filters (filter sets with rows) for the current context
       * @async
       * @returns {Promise<Array>} Array of saved filters
       */
      async getSavedFilters() {
        let itemsStore = useItemsStore()

        try {
          // Get the environment context
          const ENV = itemsStore?.environment || {};

          // Request saved filters from the server
          const response = await axios({
            method: 'post',
            url: `${getApiBase()}/api/SavedFilter/findAll`,
            data: {
              mediaTypeId: ENV.media_type_id || null,
              metaId: ENV.meta_id || null,
              tagId: ENV.tag_id || null,
              tabId: ENV.tab_id || null,
            },
          });

          // Update state with saved filters
          if (itemsStore) {
            itemsStore.filters_saved = response.data || [];
          }

          // Load filter rows for each saved filter set
          if (itemsStore?.filters_saved) {
            const filterPromises = itemsStore.filters_saved.map(async (filter) => {
              const detailedFilters = await this.getFilters(filter.id);
              // Plain assignment is fine — Vue 3 reactivity handles it
              // Attach filter rows to each set
              filter.filters = detailedFilters;
              return filter;
            });

            // Wait for all requests to complete
            await Promise.all(filterPromises);
          }

          return itemsStore?.filters_saved || [];
        } catch (error) {
          console.error('Ошибка при загрузке сохраненных фильтров:', error);
          // Return an empty array on error
          return [];
        }
      },

      setNotification(data) {
        let notifications = useNotificationsStore()

        notifications.setNotification(data)
      },

      /**
       * Loads detailed filter information by saved filter ID
       * @async
       * @param {number|string} savedFilterId - saved filter ID
       * @returns {Promise<Array>} Array of filter objects
       */
      async getFilters(savedFilterId) {
        // Validate input parameters
        if (!savedFilterId) {
          console.warn('getFilters вызван без savedFilterId');
          return [];
        }

        try {
          // Request filter rows
          const response = await axios.get(
            `${getApiBase()}/api/FilterRowsInSavedFilter?filterId=${savedFilterId}`
          );

          let filters = response.data || [];

          // Process each filter
          const processedFilters = await Promise.all(
            filters.map(async (filterItem) => {
              const filterRow = _.cloneDeep(filterItem.filterRow || {});

              // Skip non-array filters (except special cases)
              if (filterRow.type !== 'array') {
                return filterRow;
              }
              // Handle the country field special case
              if (filterRow.param === 'country' && filterRow.val) {
                filterRow.val = parseCountries(filterRow.val);
                return filterRow;
              }

              // For array filters, load associated tags
              if (filterRow.type === 'array' && filterRow.param !== 'country') {
                try {
                  const tagsResponse = await axios.get(
                    `${getApiBase()}/api/TagsInFilterRow?rowId=${filterRow.id}`
                  );

                  const tags = tagsResponse.data || [];
                  if (tags.length > 0) {
                    // Extract tag IDs
                    filterRow.val = tags.map(tag => tag.tagId);
                  } else {
                    filterRow.val = [];
                  }
                } catch (tagsError) {
                  console.error(`Ошибка при загрузке тегов для фильтра ${filterRow.id}:`, tagsError);
                  filterRow.val = [];
                }
              }

              // Normalize param (convert string meta id to number when needed)
              if (filterRow.param != null && /^\d+$/.test(String(filterRow.param))) {
                filterRow.param = Number(filterRow.param);
              }

              // Strip fields not needed on the frontend
              const {createdAt, updatedAt, ...cleanedFilter} = filterRow;

              return cleanedFilter;
            })
          );

          // Filter out null/undefined values
          return processedFilters.filter(filter => filter != null);
        } catch (error) {
          console.error(`Ошибка при загрузке фильтров для savedFilterId=${savedFilterId}:`, error);
          return [];
        }
      },

      // ============================
      // EXPORT API (named exports)
      // ============================

    }

    // ---- GLOBALLY ACCESSIBLE API ----

    // Access via this.$operable
    app.config.globalProperties.$operable = operable

    // Access via inject() when needed
    app.provide('operable', operable)

    // Auto-available in script setup and any JS
    // Example: {{ $operable.getRandomId() }}
    globalThis.$operable = operable
  },
}
