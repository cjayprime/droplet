import {Sequelize, DataTypes as SequelizeDataTypes} from 'sequelize';

import allConfigs from './config/config';

const env = process.env.NODE_ENV || 'development';
const config = allConfigs[env];
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: 'mysql',
    timestamp: false,
    define: {
      freezeTableName: true,
    },
  }
);

export const DataTypes = SequelizeDataTypes;
export default sequelize;
