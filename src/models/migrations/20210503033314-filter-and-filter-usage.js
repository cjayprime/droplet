import sequelize from '../base';
import { Filter, FilterUsage } from '..';

const models = [Filter, FilterUsage];
const filters = [
  { name: 'duet', activeIcon: '', inActiveIcon: '' },
  { name: 'helium-voice', activeIcon: '', inActiveIcon: '' },
];
const migrations = {
  up: async (queryInterface/*, Sequelize*/) => {
    await Promise.all(models.map(async (model) => {
      return await queryInterface.createTable(model.getTableName(), model.rawAttributes);
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

    await sequelize.sync();
  },
  down: async (/*queryInterface, Sequelize*/) => {
  }
};

export default migrations;
