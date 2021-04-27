import sequelize, {DataTypes} from './base';

const Listen = sequelize.define('Listen', {
  listen_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  drop_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'listen',
  timestamps: false,
});

export default Listen;
