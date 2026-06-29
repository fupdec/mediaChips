import type { MigrationContext } from '../types/sequelize'
import type { AnyRecord } from '../types/db'
const path = require('path');
const { Sequelize } = require('sequelize');

module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    try {
      const now = new Date();

      console.log('Начинаем миграцию: добавление записи в meta и связанных тегов...');

      // Проверяем, есть ли вообще записи в таблице meta
      const existingMetaCount = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM meta`,
        {
          type: Sequelize.QueryTypes.SELECT
        }
      );

      const count = Number((existingMetaCount as AnyRecord[])[0]?.count ?? 0)

      if (count > 0) {
        console.log(`Миграция пропущена: в таблице meta уже есть ${count} записей`);
        return;
      }

      console.log('Таблица meta пуста, выполняем миграцию...');

      // Сначала получаем реальную структуру таблицы meta
      const metaColumns = await queryInterface.describeTable('meta');
      console.log('Структура таблицы meta:', Object.keys(metaColumns));

      // 1. Определяем данные для meta в виде объекта с учетом реальной структуры
      const metaRecord = {
        type: 'array',
        name: 'Color tags',
        nameSingular: 'Color tag', // Добавляем это поле
        icon: 'tag',
        hint: 'For organize media',
        order: 1, // Добавляем поле order
        oldId: null, // Добавляем поле oldId
        synonyms: true,
        hidden: false,
        nested: false,
        marks: true,
        bookmark: true,
        parser: true,
        country: false,
        career: false,
        scraper: false,
        rating: true,
        favorite: true,
        chipVariant: 'flat', // Заменяем chipOutlined на chipVariant
        chipLabel: false,
        color: true,
        imageAspectRatio: 1,
        isLink: false,
        ratingIcon: 'star',
        ratingIconEmpty: 'star-outline',
        ratingIconHalf: 'star-half-full',
        ratingMax: 5,
        ratingColor: '#ffab00',
        ratingHalf: false,
        sortBy: 'createdAt',
        sortDir: 'asc',
        createdAt: now,
        updatedAt: now
      };

      // 2. Фильтруем только те поля, которые существуют в таблице
      const filteredMetaData: AnyRecord = {};
      Object.keys(metaRecord).forEach((key: string) => {
        if (metaColumns[key] !== undefined) {
          filteredMetaData[key] = (metaRecord as AnyRecord)[key];
        }
      });

      console.log('Будут добавлены поля в meta:', Object.keys(filteredMetaData));

      // 3. Используем ручной SQL запрос для SQLite с экранированием поля "order"
      console.log(`Выполняем вставку в таблицу meta...`);

      // Экранируем поле "order", так как это зарезервированное слово в SQL
      const metaFields = Object.keys(filteredMetaData);
      const metaValues = Object.values(filteredMetaData);

      // Экранируем имена полей
      const escapedFields = metaFields.map((field: string) => {
        // Экранируем поле "order" и другие потенциально зарезервированные слова
        const reservedWords = ['order', 'group', 'select', 'insert', 'update', 'delete', 'where'];
        if (reservedWords.includes(field.toLowerCase())) {
          return `"${field}"`;
        }
        return field;
      });

      const placeholders = metaFields.map(() => '?').join(', ');

      const insertMetaQuery = `
        INSERT INTO meta (${escapedFields.join(', ')})
        VALUES (${placeholders})
      `;

      await queryInterface.sequelize.query(insertMetaQuery, {
        replacements: metaValues,
        type: Sequelize.QueryTypes.INSERT
      });

      // Получаем ID последней вставленной записи (для SQLite)
      const [result] = await queryInterface.sequelize.query(
        'SELECT last_insert_rowid() as id'
      );

      const metaId = result[0].id;
      console.log(`Создана запись meta с ID: ${metaId}`);

      // 4. Создаем запись в таблице metaInMediaTypes
      // Предполагаем, что mediaTypeId = 1 (первый тип медиа - Videos)
      const mediaTypeId = 1;

      const metaInMediaTypesRecord = {
        metaId: metaId,
        mediaTypeId: mediaTypeId,
        order: 1,
        scraper: null,
        show: true,
        createdAt: now,
        updatedAt: now
      };

      console.log('Добавляем запись в metaInMediaTypes...');

      // Проверяем существование таблицы metaInMediaTypes
      const tables = await queryInterface.showAllTables();
      if (tables.includes('metaInMediaTypes')) {
        const metaInMediaTypesColumns = await queryInterface.describeTable('metaInMediaTypes');
        const filteredMetaInMediaTypesData: AnyRecord = {};

        Object.keys(metaInMediaTypesRecord).forEach((key: string) => {
          if (metaInMediaTypesColumns[key] !== undefined) {
            filteredMetaInMediaTypesData[key] = (metaInMediaTypesRecord as AnyRecord)[key];
          }
        });

        // Экранируем поле "order" и для этой таблицы
        const metaInMediaTypesFields = Object.keys(filteredMetaInMediaTypesData);
        const metaInMediaTypesValues = Object.values(filteredMetaInMediaTypesData);
        const escapedMetaInMediaTypesFields = metaInMediaTypesFields.map((field: string) => {
          if (field.toLowerCase() === 'order') {
            return `"${field}"`;
          }
          return field;
        });

        const metaInMediaTypesPlaceholders = metaInMediaTypesFields.map(() => '?').join(', ');

        const insertMetaInMediaTypesQuery = `
          INSERT INTO metaInMediaTypes (${escapedMetaInMediaTypesFields.join(', ')})
          VALUES (${metaInMediaTypesPlaceholders})
        `;

        await queryInterface.sequelize.query(insertMetaInMediaTypesQuery, {
          replacements: metaInMediaTypesValues,
          type: Sequelize.QueryTypes.INSERT
        });

        console.log(`Создана запись в metaInMediaTypes для metaId: ${metaId} и mediaTypeId: ${mediaTypeId}`);
      } else {
        console.log('Таблица metaInMediaTypes не существует, пропускаем...');
      }

      // 5. Создаем три записи в таблице tags
      const tagsData = [
        {
          name: 'Red',
          oldId: null,
          synonyms: 'Crimson, Scarlet, Ruby',
          rating: 4,
          favorite: true,
          bookmark: 'important',
          country: null,
          color: '#ff0000',
          views: 100,
          viewedAt: null,
          metaId: metaId,
          createdAt: now,
          updatedAt: now
        },
        {
          name: 'Green',
          oldId: null,
          synonyms: 'Emerald, Lime, Forest',
          rating: 3,
          favorite: false,
          bookmark: null,
          country: null,
          color: '#00ff00',
          views: 75,
          viewedAt: null,
          metaId: metaId,
          createdAt: now,
          updatedAt: now
        },
        {
          name: 'Blue',
          oldId: null,
          synonyms: 'Azure, Navy, Sky',
          rating: 5,
          favorite: true,
          bookmark: 'favorite',
          country: null,
          color: '#0000ff',
          views: 120,
          viewedAt: null,
          metaId: metaId,
          createdAt: now,
          updatedAt: now
        }
      ];

      console.log('Добавляем 3 записи в tags...');

      // Получаем структуру таблицы tags
      const tagColumns = await queryInterface.describeTable('tags');
      console.log('Структура таблицы tags:', Object.keys(tagColumns));

      // Используем bulkInsert для тегов (здесь не должно быть проблем с зарезервированными словами)
      const filteredTagsData = tagsData.map((tagRecord: AnyRecord) => {
        const filteredTagData: AnyRecord = {};

        Object.keys(tagRecord).forEach((key: string) => {
          if (tagColumns[key] !== undefined) {
            filteredTagData[key] = tagRecord[key];
          } else {
            console.log(`Поле ${key} отсутствует в таблице tags, пропускаем`);
          }
        });

        return filteredTagData;
      });

      await queryInterface.bulkInsert('tags', filteredTagsData);
      console.log(`Добавлено ${filteredTagsData.length} тегов для metaId: ${metaId}`);

      console.log('Миграция успешно выполнена!');
      console.log(`Созданы: 
        - meta запись "Color tags" с ID ${metaId}
        - запись в metaInMediaTypes для metaId ${metaId} и mediaTypeId ${mediaTypeId}
        - 3 тега с metaId ${metaId}: Red, Green, Blue`);

      return {
        metaId: metaId,
        mediaTypeId: mediaTypeId,
        tags: tagsData.map((tag: AnyRecord) => tag.name)
      };

    } catch (error) {
      console.error('Ошибка при выполнении миграции:', error);
      throw error;
    }
  },

  async down({ context: queryInterface }: MigrationContext) {
    try {
      console.log('Начинаем откат миграции...');

      // Находим meta запись по имени
      const [metaRecords] = await queryInterface.sequelize.query(
        `SELECT * FROM meta WHERE name = 'Color tags' LIMIT 1`,
        {
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (metaRecords.length === 0) {
        console.log('Meta запись "Color tags" не найдена, откат не требуется');
        return;
      }

      const metaId = metaRecords[0].id;
      console.log(`Найдена meta запись "Color tags" с ID: ${metaId}`);

      const mediaTypeId = 1; // Используем тот же ID, что и в up

      // Удаляем теги, связанные с этой meta
      const [tags] = await queryInterface.sequelize.query(
        `SELECT * FROM tags WHERE metaId = ?`,
        {
          replacements: [metaId],
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (tags.length > 0) {
        await queryInterface.bulkDelete('tags', {
          metaId: metaId
        }, {});
        console.log(`Удалено ${tags.length} тегов для metaId: ${metaId}`);
      } else {
        console.log(`Теги для metaId: ${metaId} не найдены`);
      }

      // Удаляем запись из metaInMediaTypes если она существует
      const tables = await queryInterface.showAllTables();
      if (tables.includes('metaInMediaTypes')) {
        await queryInterface.bulkDelete('metaInMediaTypes', {
          metaId: metaId,
          mediaTypeId: mediaTypeId
        }, {});
        console.log(`Удалена запись из metaInMediaTypes для metaId: ${metaId} и mediaTypeId: ${mediaTypeId}`);
      }

      // Удаляем meta запись
      await queryInterface.bulkDelete('meta', {
        id: metaId
      }, {});
      console.log(`Удалена meta запись "Color tags" с ID: ${metaId}`);

      console.log('Откат миграции завершен');
    } catch (error) {
      console.error('Ошибка при откате миграции:', error);
      throw error;
    }
  },
};