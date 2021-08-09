const subClouds = [
  { name: 'voiceover', cloud_id: 4, description: 'dramatic recording? new take on a classic? share it here', order: 13 },
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
