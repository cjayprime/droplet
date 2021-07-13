import { DataTypes } from '../base';

const migration = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('drop', 'ranking', { type: DataTypes.DECIMAL(50, 25), allowNull: false, after: 'caption' });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('drop', 'ranking');
  }
};

export default migration;
