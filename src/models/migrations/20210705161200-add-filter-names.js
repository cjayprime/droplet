const filters = [
  { slug: 'duet', name: 'Duet' },
  { slug: 'export-video', name: 'Export Video' },
  { slug: 'pitch-shift-baritone', name: 'Baritone' },
  { slug: 'pitch-shift-baritone', name: 'Baritone' },
  { slug: 'pitch-shift-helium', name: 'Helium' },
  { slug: 'pitch-shift-chipmunk', name: 'Chipmunk' },
  { slug: 'pitch-shift-giant', name: 'Vader' },
];

const migration = {
  up: async (queryInterface) => {
    // Add filter names
    // 'baritone', 'helium', 'chipmunk', 'giant'
    const addFilterName = async (i) => {
      await queryInterface.sequelize.query(`UPDATE filter SET \`name\` = '${filters[i].name}' WHERE \`slug\` = '${filters[i].slug}'`);
      if (filters[i + 1]) {
        await addFilterName(i + 1);
      }
    };
    await addFilterName(0);
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
