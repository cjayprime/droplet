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
    type: DataTypes.STRING,
    allowNull: false,
  },
  audio_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  category_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
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
});

export default Drop;
