import sequelize, { DataTypes } from './base';

const Group = sequelize.define('group', {
  group_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  sub_cloud_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'sub_cloud', key: 'sub_cloud_id' },
    unique: 'one_user_and_sub_cloud_combination_per_group',
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'user', key: 'user_id' },
    unique: 'one_user_and_sub_cloud_combination_per_group',
  },
  status: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'group',
  timestamps: false,
});

export default Group;
