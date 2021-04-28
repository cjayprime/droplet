import sequelize, {DataTypes} from './base';

const Like = sequelize.define('Like', {
  like_id: {
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
  indexes: [
    {
      unique: false,
      fields: ['user_id'],
    },
  ],
});

export default Like;
