const clouds = [
  { name: 'Blue', color: '#3894FF', altColor: '#2D76CC' },
  { name: 'Purple', color: '#FDB446', altColor: '#CB9039' },
  { name: 'Yellow', color: '#3AC67B', altColor: '#2F9F63' },
  { name: 'Green', color: '#B15EE1', altColor: '#8E4CB5' },
];
const subClouds = [
  { name: 'musicians', old_sub_cloud_id: 2, cloud_id: 3, description: 'rising producers, song covers, composers.' },
  { name: 'foodies', old_sub_cloud_id: 5, cloud_id: 1, description: 'chat about your favorite restaurants or recipes.' },
  { name: '2AM chill', old_sub_cloud_id: 1, cloud_id: 3, description: 'for your lofi vibes. Chilled Cow but better :)' },
  { name: 'podcasters', old_sub_cloud_id: 4, cloud_id: 4, description: 'podcast info, but short n sweet.' },
  { name: 'rant zone', old_sub_cloud_id: 15, cloud_id: 2, description: 'release the Karen 🤯 in you.' },
  { name: 'workout', old_sub_cloud_id: 11, cloud_id: 1, description: 'ready to do 30 sec HIIT workouts and share tips 🏋️‍♀️' },
  { name: 'comedy', old_sub_cloud_id: 6, cloud_id: 2, description: 'stand up comedy. quirky one-liners. pickup lines.' },
  { name: 'poetics', old_sub_cloud_id: 3, cloud_id: 4, description: 'spoken word, literature, poetry.' },
  { name: 'college', old_sub_cloud_id: 8, cloud_id: 1, description: 'class of 2025? missed connections? best courses?' },
  { name: 'relax', old_sub_cloud_id: 12, cloud_id: 4, description: 'mindfulness, relaxation, asmr, meditation.' },
];
const migration = {
  up: async (queryInterface) => {
    // Deactive all subclouds and make latest ones active
    await queryInterface.sequelize.query('UPDATE sub_cloud SET status = \'0\'');
    subClouds.map(async (subCloud) => {
      return await queryInterface.sequelize.query(`UPDATE sub_cloud SET status = '1', name = '${subCloud.name}', cloud_id = '${subCloud.cloud_id}', description = '${subCloud.description}' WHERE sub_cloud_id = '${subCloud.old_sub_cloud_id}'`);
    });
    clouds.map(async (cloud) => {
      return await queryInterface.sequelize.query(`UPDATE cloud SET color = '${cloud.color}', altColor = '${cloud.altColor}' WHERE name = '${cloud.name}'`);
    });
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
