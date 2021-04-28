import sequelize, {DataTypes} from './base';

const Listen = sequelize.define('Listen', {
  listen_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.STRING(128),
    allowNull: false,
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
  indexes: [
    {
      unique: false,
      fields: ['user_id'],
    },
  ],
});

export default Listen;
