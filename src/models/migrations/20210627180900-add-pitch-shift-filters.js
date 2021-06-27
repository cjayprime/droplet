const filters = [
  { name: 'pitch-shift-baritone' },
  { name: 'pitch-shift-helium' },
  { name: 'pitch-shift-chipmunk' },
  { name: 'pitch-shift-giant' },
];

const migration = {
  up: async (queryInterface) => {
    // Add pitch shift
    const addClouds = async (i) => {
      // 'baritone', 'helium', 'chipmunk', 'giant'
      await queryInterface.sequelize.query(`INSERT INTO filter(\`name\`, \`activeIcon\`, \`inActiveIcon\`, \`status\`) VALUES('${filters[i].name}', '', '', '1')`);
      if (filters[i + 1]) {
        await addClouds(i + 1);
      }
    };
    await addClouds(0);
      
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
