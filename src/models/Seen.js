import sequelize, { DataTypes } from './base';

const Seen = sequelize.define('seen', {
  seen_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'user', key: 'user_id' },
    unique: 'user_marks_a_drop_as_seen_once',
  },
  drop_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'drop', key: 'drop_id' },
    unique: 'user_marks_a_drop_as_seen_once',
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'seen',
  timestamps: false,
});

export default Seen;
