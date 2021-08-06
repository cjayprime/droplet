import { DataTypes } from '../base';

const migration = {
  up: async (queryInterface/*, Sequelize*/) => {
    await queryInterface.addColumn('audio', 'type', { type: DataTypes.STRING(225), allowNull: false, after: 'tag' });
    await queryInterface.sequelize.query('UPDATE audio SET type = \'audio/mpeg\'');
  },
  down: async (queryInterface/*, Sequelize*/) => {
    return await queryInterface.removeColumn('audio', 'type');
  }
};

export default migration;
