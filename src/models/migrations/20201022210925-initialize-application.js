import { DataTypes } from '../base';
import { Cloud, SubCloud, Audio, Drop, Like, Listen, Interaction, Filter, FilterUsage } from '..';

const models = [Cloud, SubCloud, Audio, Drop, Like, Listen, Interaction, Filter, FilterUsage];
const clouds = [
  { name: 'Blue', color: '#52A7F3', altColor: '#103D66' },
  { name: 'Purple', color: '#B15EE1', altColor: '#2A0F3A' },
  { name: 'Yellow', color: '#FDB446', altColor: '#5F4723' },
  { name: 'Green', color: '#3AC67B', altColor: '#104B2B' },
];
const subClouds = [
  { name: 'LoFi', cloud_id: 2, description: 'For your 2AM late night vibes.' },
  { name: 'Podcasters', cloud_id: 4, description: 'You do podcasts, but you want to try these new short form sound bites.' },
  { name: 'Songwriters / Music Producers', cloud_id: 2, description: 'Rising producers, song covers, composers, jammin\' out. Collaborate in the most spontaneous way.' },
  { name: 'Poetry and Spoken Word', cloud_id: 4, description: 'Voice your creatively crafted words.' },
  { name: 'Foodies', cloud_id: 1, description: 'Chat about your favorite restaurants or recipes.' },
  { name: 'Open Mic and Comedy', cloud_id: 3, description: 'Shoot your shot at a joke. even if people do laugh, you won\'t be able to hear it.' },
  { name: 'Words of Wisdom', cloud_id: 4, description: 'Your potential quote of the day stems here – hear globally reknowned educators and experts.' },
  { name: 'Stanford Students', cloud_id: 1, description: 'Class of 2025? Missed Connections? Share secrets about campus life, tips on best courses to take.' },
  { name: 'College Acapella', cloud_id: 2, description: 'Duet across colleges, sing riffs, beat box! Is this a sing off challenge?' },
  { name: 'Sport Highlights', cloud_id: 1, description: 'Trending highlights, news, and commentary. Audio bleacher report here.' },
  { name: 'Workout', cloud_id: 1, description: 'Ready to do 30 sec HIIT workouts and share tips 🏋️‍♀️' },
  { name: 'Relax', cloud_id: 4, description: 'Unwind and take a breath.' },
  { name: 'Classical', cloud_id: 2, description: 'Play your favorite classical 🎻 melodies.' },
  { name: 'Daily Update', cloud_id: 1, description: 'Something fun or interesting happen today? Share it!' },
  { name: 'Crypto', cloud_id: 1, description: 'Your cryptocurrency community here 💎🙌' },
  { name: 'Rant Zone', cloud_id: 3, description: 'Release the Karen 🤯 in you.' },
];
const filters = [
  { name: 'duet', activeIcon: '', inActiveIcon: '' },
  { name: 'helium-voice', activeIcon: '', inActiveIcon: '' },
  { name: 'export-video', activeIcon: '', inActiveIcon: '' },
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

    await queryInterface.createTable('cloud', {
      cloud_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: false,
      },
      altColor: {
        type: DataTypes.STRING(7),
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

    await queryInterface.createTable('sub_cloud', {
      sub_cloud_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      cloud_id: {
        type: DataTypes.BIGINT,
        references: { model: 'cloud', key: 'cloud_id' },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
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
      sub_cloud_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'sub_cloud', key: 'sub_cloud_id' },
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
        unique: 'one_user_like_per_drop',
      },
      drop_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'drop', key: 'drop_id' },
        unique: 'one_user_like_per_drop',
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
        type: DataTypes.STRING(30),
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
      owner_user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: 'user', key: 'user_id' },
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

    await Promise.all(clouds.map(async (cloud) => {
      return await Cloud.create({
        name: cloud.name,
        color: cloud.color,
        altColor: cloud.altColor,
        status: '1',
        date: new Date(),
      });
    }));

    await Promise.all(subClouds.map(async (subCloud) => {
      return await SubCloud.create({
        cloud_id: subCloud.cloud_id,
        name: subCloud.name,
        description: subCloud.description,
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
