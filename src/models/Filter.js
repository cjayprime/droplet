import sequelize, { DataTypes } from './base';

const Filter = sequelize.define('filter', {
  filter_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.ENUM('duet', 'helium-voice'),
    allowNull: false,
  },
  activeIcon: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  inActiveIcon: {
    type: DataTypes.STRING,
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
  tableName: 'filter',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['name'],
    },
  ]
});

export default Filter;
