const migration = {
  up: async (queryInterface) => {
    // Deactive all drops
    await queryInterface.sequelize.query('DELETE FROM `filter_usage`');
    await queryInterface.sequelize.query('ALTER TABLE `filter_usage` AUTO_INCREMENT = 1');

    await queryInterface.sequelize.query('DELETE FROM `like`');
    await queryInterface.sequelize.query('ALTER TABLE `like` AUTO_INCREMENT = 1');

    await queryInterface.sequelize.query('DELETE FROM `listen`');
    await queryInterface.sequelize.query('ALTER TABLE `listen` AUTO_INCREMENT = 1');

    await queryInterface.sequelize.query('DELETE FROM `audio`');
    await queryInterface.sequelize.query('ALTER TABLE `audio` AUTO_INCREMENT = 1');

    await queryInterface.sequelize.query('DELETE FROM `drop`');
    await queryInterface.sequelize.query('ALTER TABLE `drop` AUTO_INCREMENT = 1');
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
