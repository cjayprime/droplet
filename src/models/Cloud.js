import sequelize, { DataTypes } from './base';

const Cloud = sequelize.define('cloud', {
  cloud_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: false,
  },
  altColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'cloud',
  timestamps: false,
});

export default Cloud;
