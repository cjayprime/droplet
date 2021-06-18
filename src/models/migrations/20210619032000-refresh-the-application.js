const migration = {
  up: async (queryInterface) => {
    // Refresh the application
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    await queryInterface.sequelize.query('TRUNCATE `filter_usage`;');
    await queryInterface.sequelize.query('TRUNCATE `like`;');
    await queryInterface.sequelize.query('TRUNCATE `listen`;');
    await queryInterface.sequelize.query('TRUNCATE `audio`;');
    await queryInterface.sequelize.query('TRUNCATE `drop`;');

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
