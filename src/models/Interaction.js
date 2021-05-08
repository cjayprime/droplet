import sequelize, { DataTypes } from './base';

const Interaction = sequelize.define('interaction', {
  interaction_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'user', key: 'user_id' },
  },
  type: {
    type: DataTypes.ENUM('app-open', 'app-close'),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'interaction',
  timestamps: false,
  indexes: [
    {
      unique: false,
      fields: ['type'],
    },
  ],
});

export default Interaction;
