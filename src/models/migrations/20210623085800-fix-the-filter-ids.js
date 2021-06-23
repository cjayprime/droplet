const filters = [
  { name: 'duet', activeIcon: '', inActiveIcon: '' },
  { name: 'helium-voice', activeIcon: '', inActiveIcon: '' },
  { name: 'export-video', activeIcon: '', inActiveIcon: '' },
];

const migration = {
  up: async (queryInterface) => {
    // Fixes the clouds colors
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    await queryInterface.sequelize.query('TRUNCATE `filter`;');
    const fixFilters = async (i) => {
      await queryInterface.sequelize.query(`INSERT INTO filter(\`name\`, \`activeIcon\`, \`inActiveIcon\`, \`status\`, \`date\`) VALUES ('${filters[i].name}', '${filters[i].activeIcon}', '${filters[i].inActiveIcon}', '1', '2021-05-29 10:45:08') `);
      if (filters[i + 1]) {
        await fixFilters(i + 1);
      }
    };
    await fixFilters(0);

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
