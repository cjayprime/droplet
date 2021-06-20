import { DataTypes } from '../base';

const subClouds = [
  { name: 'musicians' },
  { name: 'foodies' },
  { name: '2AM chill' },
  { name: 'podcasters' },
  { name: 'rant zone' },
  { name: 'workout' },
  { name: 'comedy' },
  { name: 'poetics' },
  { name: 'college' },
  { name: 'relax' },
];
const migration = {
  up: async (queryInterface) => {
    // Order the clouds
    await queryInterface.addColumn('sub_cloud', 'order', { type: DataTypes.BIGINT, allowNull: false, });
    const saveClouds = async (i) => {
      await queryInterface.sequelize.query(`UPDATE sub_cloud SET \`order\` = '${i + 1}' WHERE name = '${subClouds[i].name}'`);
      if (subClouds[i + 1]) {
        await saveClouds(i + 1);
      }
    };
    await saveClouds(0);
  },
  down: async (queryInterface) => {
    queryInterface.removeColumn('sub_cloud', 'order');
  }
};

export default migration;
