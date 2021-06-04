import { DataTypes } from '../base';

const migration = {
  up: async (queryInterface/*, Sequelize*/) => {
    queryInterface.addColumn('drop', 'status', { type: DataTypes.ENUM('0', '1'), allowNull: false, });
  },
  down: async (queryInterface/*, Sequelize*/) => {
    queryInterface.removeColumn('drop', 'status');
  }
};

export default migration;
