import type { Sequelize } from 'sequelize'
import type { SequelizeModule } from '../types/sequelize'
module.exports = (sequelize: Sequelize, Sequelize: SequelizeModule) => {
  const MetaSetting = sequelize.define(
    'metaSetting', {
      synonyms: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      hidden: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      nested: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      marks: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      bookmark: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      parser: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      country: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      career: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      scraper: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      rating: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      favorite: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      chipOutlined: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      chipLabel: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      color: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      imageAspectRatio: {
        type: Sequelize.FLOAT,
        defaultValue: 1,
      },
      isLink: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      ratingIcon: {
        type: Sequelize.TEXT,
        defaultValue: 'star',
      },
      ratingIconEmpty: {
        type: Sequelize.TEXT,
        defaultValue: 'star-outline',
      },
      ratingIconHalf: {
        type: Sequelize.TEXT,
        defaultValue: 'star-half-full',
      },
      ratingMax: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
      },
      ratingColor: {
        type: Sequelize.TEXT,
        defaultValue: '#ffab00',
      },
      ratingHalf: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      sortBy: {
        type: Sequelize.STRING,
        defaultValue: 'createdAt',
      },
      sortDir: {
        type: Sequelize.STRING,
        defaultValue: 'asc',
      },
    }, {
      timestamps: false
    }
  )

  return MetaSetting;
};