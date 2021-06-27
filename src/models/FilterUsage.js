import sequelize, { DataTypes } from './base';

const FilterUsage = sequelize.define('filter_usage', {
  filter_usage_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'user', key: 'user_id' },
  },
  owner_user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: { model: 'user', key: 'user_id' },
  },
  owner_audio_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: { model: 'audio', key: 'audio_id' },
  },
  audio_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'audio', key: 'audio_id' },
  },
  filter_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'filter', key: 'filter_id' },
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'filter_usage',
  timestamps: false,
});

export default FilterUsage;
