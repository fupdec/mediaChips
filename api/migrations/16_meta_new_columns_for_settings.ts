import type { MigrationContext } from '../types/sequelize'
import type { AnyRecord } from '../types/db'
const path = require('path')
const {
  Sequelize
} = require('sequelize');
const _ = require('lodash')

module.exports = {
  async up({ context: queryInterface }: MigrationContext) {
    return queryInterface.describeTable('meta')
      .then(async (tableDefinition: AnyRecord) => {
        if (tableDefinition.synonyms) {
          return Promise.resolve();
        } else {
          await Promise.all([
            queryInterface.addColumn(
              'meta',
              'synonyms',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'hidden',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'nested',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'marks',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'bookmark',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'parser',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'country',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'career',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'scraper',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'rating',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'favorite',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'chipOutlined',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'chipLabel',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'color',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'imageAspectRatio',
              {
                type: Sequelize.FLOAT,
                defaultValue: 1,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'isLink',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'ratingIcon',
              {
                type: Sequelize.TEXT,
                defaultValue: 'star',
              },
            ),
            queryInterface.addColumn(
              'meta',
              'ratingIconEmpty',
              {
                type: Sequelize.TEXT,
                defaultValue: 'star-outline',
              },
            ),
            queryInterface.addColumn(
              'meta',
              'ratingIconHalf',
              {
                type: Sequelize.TEXT,
                defaultValue: 'star-half-full',
              },
            ),
            queryInterface.addColumn(
              'meta',
              'ratingMax',
              {
                type: Sequelize.INTEGER,
                defaultValue: 5,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'ratingColor',
              {
                type: Sequelize.TEXT,
                defaultValue: '#ffab00',
              },
            ),
            queryInterface.addColumn(
              'meta',
              'ratingHalf',
              {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
              },
            ),
            queryInterface.addColumn(
              'meta',
              'sortBy',
              {
                type: Sequelize.STRING,
                defaultValue: 'createdAt',
              },
            ),
            queryInterface.addColumn(
              'meta',
              'sortDir',
              {
                type: Sequelize.STRING,
                defaultValue: 'asc',
              },
            ),
          ]);

          let meta_settings = await (queryInterface.sequelize.models as any).metaSetting.findAll({raw: true});

          let values = ''
          for (let i = 0; i < meta_settings.length; i++) {
            const j = meta_settings[i];
            values += `(${j.metaId},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,${j.synonyms}, ${j.hidden}, ${j.nested}, ${j.marks}, ${j.bookmark}, ${j.parser},${j.country},${j.career},${j.scraper},${j.rating},${j.favorite},${j.chipOutlined},${j.chipLabel},${j.color},${j.imageAspectRatio},${j.isLink},'${j.ratingIcon}','${j.ratingIconEmpty}','${j.ratingIconHalf}',${j.ratingMax},'${j.ratingColor}',${j.ratingHalf},'${j.sortBy}','${j.sortDir}')`
            if (i !== meta_settings.length - 1) {
              values += ","
            }
          }

          let query = "INSERT INTO meta(id, createdAt, updatedAt, synonyms, hidden, nested, marks, bookmark, parser, country, career, useScraperStore, rating, favorite, chipOutlined, chipLabel, color, imageAspectRatio, isLink, ratingIcon, ratingIconEmpty, ratingIconHalf, ratingMax, ratingColor, ratingHalf, sortBy, sortDir)\n" +
            "VALUES " + values +
            " ON CONFLICT(id) DO UPDATE SET synonyms=excluded.synonyms,\n" +
            "                              hidden=excluded.hidden,\n" +
            "                              nested=excluded.nested,\n" +
            "                              marks=excluded.marks,\n" +
            "                              bookmark=excluded.bookmark,\n" +
            "                              parser=excluded.parser,\n" +
            "                              country=excluded.country,\n" +
            "                              career=excluded.career,\n" +
            "                              useScraperStore=excluded.useScraperStore,\n" +
            "                              rating=excluded.rating,\n" +
            "                              favorite=excluded.favorite,\n" +
            "                              chipOutlined=excluded.chipOutlined,\n" +
            "                              chipLabel=excluded.chipLabel,\n" +
            "                              color=excluded.color,\n" +
            "                              imageAspectRatio=excluded.imageAspectRatio,\n" +
            "                              isLink=excluded.isLink,\n" +
            "                              ratingIcon=excluded.ratingIcon,\n" +
            "                              ratingIconEmpty=excluded.ratingIconEmpty,\n" +
            "                              ratingIconHalf=excluded.ratingIconHalf,\n" +
            "                              ratingMax=excluded.ratingMax,\n" +
            "                              ratingColor=excluded.ratingColor,\n" +
            "                              ratingHalf=excluded.ratingHalf,\n" +
            "                              sortDir=excluded.sortDir\n" +
            "WHERE excluded.id = meta.id;"
          await queryInterface.sequelize.query(query);
        }
      }).catch((err) => console.log(err));
  },

  async down({ context: queryInterface }: MigrationContext) {
    // return Promise.all([
    //   queryInterface.removeColumn('media', 'name'),
    //   queryInterface.removeColumn('media', 'basename'),
    //   queryInterface.removeColumn('media', 'ext'),
    // ]);
  },
}