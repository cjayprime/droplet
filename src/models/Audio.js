import sequelize, { DataTypes } from './base';

const Audio = sequelize.define('audio', {
  audio_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'user', key: 'user_id' },
  },
  tag: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    // validate: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  filesize: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  source: {
    type: DataTypes.ENUM('upload', 'recording'),
    allowNull: false,
  },
  trimmed: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'audio',
  timestamps: false,
  indexes: [
    {
      unique: false,
      fields: ['source'],
    },
  ],
});

export default Audio;
