import sequelize, { DataTypes } from './base';

// class Drop extends Model {}
// Drop.init({}, {});

const Drop = sequelize.define('drop', {
  drop_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'user', key: 'user_id' },
  },
  audio_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'audio', key: 'audio_id' },
  },
  sub_cloud_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'sub_cloud', key: 'sub_cloud_id' },
  },
  caption: {
    type: DataTypes.STRING(70),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE(6),
    allowNull: false,
  },
}, {
  tableName: 'drop',
  timestamps: false,
});

export default Drop;
