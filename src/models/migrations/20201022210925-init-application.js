import sequelize from '../base';
import { Audio, Category, Drop, Like, Listen, Interaction } from '..';

const models = [Category, Audio, Drop, Like, Listen, Interaction];
const categories = [
  { name: 'convo', color: '#52A7F3' },
  { name: 'music', color: '#B15EE1' },
  { name: 'comedy', color: '#FDB446' },
  { name: 'asmr', color: '#3AC67B' },
];
const migration = {
  up: async (queryInterface/*, Sequelize*/) => {
    await Promise.all(models.map(async (model) => {
      return await queryInterface.createTable(model.getTableName(), model.rawAttributes);
    }));

    await Promise.all(categories.map(async (category) => {
      return await Category.create({
        name: category.name,
        color: category.color,
        status: '1',
        date: new Date(),
      });
    }));

    await sequelize.sync();
  },
  down: async (queryInterface/*, Sequelize*/) => {
    await Promise.all(models.map(async (model) => {
      await queryInterface.deleteTable(model.getTableName());
    }));
  }
};

export default migration;
