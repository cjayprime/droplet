const subClouds = [
  { name: 'musicians', cloud_id: 3, description: 'rising producers, song covers, composers.' },
  { name: 'foodies', cloud_id: 1, description: 'chat about your favorite restaurants or recipes.' },
  { name: '2AM chill', cloud_id: 3, description: 'for your lofi vibes. Chilled Cow but better :)' },
  { name: 'podcasters', cloud_id: 4, description: 'podcast info, but short n sweet.' },
  { name: 'rant zone', cloud_id: 2, description: 'release the Karen 🤯 in you.' },
  { name: 'workout', cloud_id: 1, description: 'ready to do 30 sec HIIT workouts and share tips 🏋️‍♀️' },
  { name: 'comedy', cloud_id: 2, description: 'stand up comedy. quirky one-liners. pickup lines.' },
  { name: 'poetics', cloud_id: 4, description: 'spoken word, literature, poetry.' },
  { name: 'college', cloud_id: 1, description: 'class of 2025? missed connections? best courses?' },
  { name: 'relax', cloud_id: 4, description: 'mindfulness, relaxation, asmr, meditation.' },
];
const migration = {
  up: async (queryInterface) => {
    // Refresh the application
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    await queryInterface.sequelize.query('TRUNCATE `sub_cloud`;');
    const saveClouds = async (i) => {
      await queryInterface.sequelize.query(`INSERT INTO sub_cloud(\`cloud_id\`, \`name\`, \`description\`, \`status\`) VALUES ('${subClouds[i].cloud_id}', '${subClouds[i].name}', '${subClouds[i].description}', '1')`);
      if (subClouds[i + 1]) {
        await saveClouds(i + 1);
      }
    };
    await saveClouds(0);

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
