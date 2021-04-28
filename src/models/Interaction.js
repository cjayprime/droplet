import sequelize, {DataTypes} from './base';

const Interaction = sequelize.define('Interaction', {
  interaction_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.STRING(128),
    allowNull: false,
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
      fields: ['user_id'],
    },
    {
      unique: false,
      fields: ['type'],
    },
  ],
});

export default Interaction;
