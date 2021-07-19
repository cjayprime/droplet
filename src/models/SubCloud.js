import sequelize, { DataTypes } from './base';

const SubCloud = sequelize.define('sub_cloud', {
  sub_cloud_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  cloud_id: {
    type: DataTypes.BIGINT,
    references: { model: 'cloud', key: 'cloud_id' },
  },
  user_id: {
    type: DataTypes.BIGINT,
    references: { model: 'user', key: 'user_id' },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
  },
  order: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'sub_cloud',
  timestamps: false,
});

export default SubCloud;
