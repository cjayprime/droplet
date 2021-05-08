import sequelize, { DataTypes } from './base';

const Listen = sequelize.define('listen', {
  listen_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'user', key: 'user_id' },
  },
  drop_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'drop', key: 'drop_id' },
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'listen',
  timestamps: false,
});

export default Listen;
