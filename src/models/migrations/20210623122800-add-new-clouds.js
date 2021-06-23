const subClouds = [
  { name: 'classical', cloud_id: 3, description: 'play your favorite classical 🎻 melodies.', order: 11 },
  { name: 'random', cloud_id: 1, description: 'for whatever.', order: 12 },
];

const migration = {
  up: async (queryInterface) => {
    // Add new clouds
    const addClouds = async (i) => {
      await queryInterface.sequelize.query(`INSERT INTO sub_cloud(\`name\`, \`cloud_id\`, \`description\`, \`status\`, \`order\`, \`date\`) VALUES ('${subClouds[i].name}', '${subClouds[i].cloud_id}', '${subClouds[i].description}', '1', '${subClouds[i].order}', NOW()) `);
      if (subClouds[i + 1]) {
        await addClouds(i + 1);
      }
    };
    await addClouds(0);
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
