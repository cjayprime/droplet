import sequelize, { DataTypes } from './base';

const Like = sequelize.define('like', {
  like_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'user', key: 'user_id' },
    unique: 'one_user_like_per_drop',
  },
  drop_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'drop', key: 'drop_id' },
    unique: 'one_user_like_per_drop',
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
  tableName: 'like',
  timestamps: false,
});

export default Like;
