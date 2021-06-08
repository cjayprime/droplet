import { DataTypes } from '../base';

const migration = {
  up: async (queryInterface/*, Sequelize*/) => {
    queryInterface.createTable('marketing', {
      marketing_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      phone_number: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface/*, Sequelize*/) => {
    await queryInterface.deleteTable('marketing');
  }
};

export default migration;
