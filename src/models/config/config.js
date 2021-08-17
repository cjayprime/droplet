const dotenv = require('dotenv');
dotenv.config();

const {
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE,
  DB_HOSTNAME,
} = process.env;

const options = {
  'username': DB_USERNAME,
  'password': DB_PASSWORD,
  'database': DB_DATABASE,
  'host': DB_HOSTNAME,
  'dialect': 'mysql',
  'timezone': '+00:00', // for writing to database
  'migrationStorage': 'sequelize',
  'migrationStorageTableName': 'migration',
};

module.exports = {
  'test': {
    ...options,
    'username': 'root',
    'password': '',
    'database': 'droplet-test',
    'host': '127.0.0.1',
    'pool': {
      'max': 1,
      'min': 0,
      'idle': 10000
    },
  },
  'development': {
    ...options,
    'pool': {
      'max': 1,
      'min': 0,
      'idle': 10000
    },
  },
  'staging': {
    ...options,
    'pool': {
      'max': 10,
      'min': 0,
      'idle': 10000
    },
  },
  'production': {
    ...options,
    'pool': {
      'max': 150,
      'min': 10,
      'idle': 10000
    },
  }
};
