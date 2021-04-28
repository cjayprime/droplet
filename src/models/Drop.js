import sequelize, {DataTypes} from './base';

// class Drop extends Model {}
// Drop.init({}, {});

const Drop = sequelize.define('drop', {
  drop_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  audio_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'audio', key: 'audio_id' },
  },
  category_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'category', key: 'category_id' },
  },
  caption: {
    type: DataTypes.STRING(70),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE(6),
    allowNull: false,
  },
}, {
  tableName: 'drop',
  timestamps: false,
  indexes: [
    {
      unique: false,
      fields: ['user_id'],
    },
  ],
});

export default Drop;
