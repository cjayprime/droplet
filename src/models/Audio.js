import sequelize, {DataTypes} from './base';

const Audio = sequelize.define('Audio', {
  audio_id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  tag: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  filesize: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('upload', 'recording'),
    allowNull: false,
  },
  trimmed: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
  },
}, {
  tableName: 'audio',
  timestamps: false,
});

Audio.associations = () => {
  console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
};

export default Audio;
