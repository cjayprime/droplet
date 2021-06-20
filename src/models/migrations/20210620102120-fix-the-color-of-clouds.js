const clouds = [
  { name: 'Blue', color: '#3894FF', altColor: '#2D76CC' },
  { name: 'Purple', color: '#FDB446', altColor: '#CB9039' },
  { name: 'Yellow', color: '#3AC67B', altColor: '#2F9F63' },
  { name: 'Green', color: '#B15EE1', altColor: '#8E4CB5' },
];

const migration = {
  up: async (queryInterface) => {
    // Fixes the clouds colors
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    await queryInterface.sequelize.query('TRUNCATE `cloud`;');
    const fixClouds = async (i) => {
      await queryInterface.sequelize.query(`INSERT INTO cloud(\`name\`, \`color\`, \`altColor\`, \`status\`, \`date\`) VALUES ('${clouds[i].name}', '${clouds[i].color}', '${clouds[i].altColor}', '1', NOW()) `);
      if (clouds[i + 1]) {
        await fixClouds(i + 1);
      }
    };
    await fixClouds(0);

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
