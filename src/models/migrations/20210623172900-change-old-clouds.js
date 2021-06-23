const subClouds = [
  { name: 'sound memes', description: 'gifs but just audio', oldName: 'workout' },
  { name: 'mindfulness', description: 'words of wisdom, wayfinding, meditation.', oldName: 'relax' },
];

const migration = {
  up: async (queryInterface) => {
    // Change old clouds
    const addClouds = async (i) => {
      await queryInterface.sequelize.query(`UPDATE sub_cloud SET name = '${subClouds[i].name}', description = '${subClouds[i].description}', date = NOW() WHERE name = '${subClouds[i].oldName}'`);
      if (subClouds[i + 1]) {
        await addClouds(i + 1);
      }
    };
    await addClouds(0);
      
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
