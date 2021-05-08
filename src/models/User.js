import sequelize, { DataTypes } from './base';

const User = sequelize.define('user', {
  user_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  uid: {
    type: DataTypes.STRING(128),
    allowNull: false,
    unique: true,
  },
  username: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'user',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['uid'],
    },
    {
      unique: true,
      fields: ['username'],
    },
  ],
});

export default User;
