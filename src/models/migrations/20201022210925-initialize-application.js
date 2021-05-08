import { DataTypes } from '../base';
import { Category, Audio, Drop, Like, Listen, Interaction, Filter, FilterUsage } from '..';

const models = [Category, Audio, Drop, Like, Listen, Interaction, Filter, FilterUsage];
const categories = [
  { name: 'convo', color: '#52A7F3' },
  { name: 'music', color: '#B15EE1' },
  { name: 'comedy', color: '#FDB446' },
  { name: 'asmr', color: '#3AC67B' },
];
const filters = [
  { name: 'duet', activeIcon: '', inActiveIcon: '' },
  { name: 'helium-voice', activeIcon: '', inActiveIcon: '' },
];
const migration = {
  up: async (queryInterface/*, Sequelize*/) => {
    queryInterface.createTable('user', {
      user_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      username: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('category', {
      category_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('0', '1'),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
    
    await queryInterface.createTable('audio', {
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
    });
    
    await queryInterface.createTable('drop', {
      drop_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'user', key: 'user_id' },
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
    });
    
    await queryInterface.createTable('like', {
      like_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'user', key: 'user_id' },
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
    });
    
    await queryInterface.createTable('listen', {
      listen_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'user', key: 'user_id' },
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
    });
    
    await queryInterface.createTable('interaction', {
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
    });

    await queryInterface.createTable('filter', {
      filter_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.ENUM('duet', 'helium-voice'),
        allowNull: false,
      },
      activeIcon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      inActiveIcon: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('0', '1'),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('filter_usage', {
      filter_usage_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      owner_audio_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: 'audio', key: 'audio_id' },
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'user', key: 'user_id' },
      },
      audio_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'audio', key: 'audio_id' },
      },
      filter_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'filter', key: 'filter_id' },
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await Promise.all(categories.map(async (category) => {
      return await Category.create({
        name: category.name,
        color: category.color,
        status: '1',
        date: new Date(),
      });
    }));

    
    await Promise.all(filters.map(async (filter) => {
      return await Filter.create({
        name: filter.name,
        activeIcon: filter.activeIcon,
        inActiveIcon: filter.inActiveIcon,
        status: '1',
        date: new Date(),
      });
    }));
  },
  down: async (queryInterface/*, Sequelize*/) => {
    await Promise.all(models.map(async (model) => {
      return await queryInterface.deleteTable(model.getTableName());
    }));
  }
};

export default migration;
