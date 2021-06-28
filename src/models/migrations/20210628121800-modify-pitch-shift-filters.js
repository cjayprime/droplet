import { DataTypes } from '../base';

const migration = {
  up: async (queryInterface) => {
    // Add slug column and update all rows to use names as slugs
    await queryInterface.addColumn('filter', 'slug', { type: DataTypes.STRING(30), allowNull: false, after: 'name' });
    await queryInterface.sequelize.query('UPDATE `filter` t1, (SELECT * FROM `filter`) t2 SET `t1`.`slug` = `t2`.`name` WHERE `t1`.`filter_id` = `t2`.`filter_id`');
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('filter', 'slug');
  }
};

export default migration;
