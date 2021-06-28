const filters = [
  { name: 'pitch-shift-baritone' },
  { name: 'pitch-shift-helium' },
  { name: 'pitch-shift-chipmunk' },
  { name: 'pitch-shift-giant' },
];

const migration = {
  up: async (queryInterface) => {
    // Add pitch shift filter
    // 'baritone', 'helium', 'chipmunk', 'giant'
    const addFilter = async (i) => {
      await queryInterface.sequelize.query(`INSERT INTO filter(\`name\`, \`activeIcon\`, \`inActiveIcon\`, \`status\`, \`date\`) VALUES('${filters[i].name}', '', '', '1', NOW())`);
      if (filters[i + 1]) {
        await addFilter(i + 1);
      }
    };
    await addFilter(0);
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
