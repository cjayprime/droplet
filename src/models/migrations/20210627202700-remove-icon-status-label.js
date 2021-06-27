const migration = {
  up: async (queryInterface) => { 
    await queryInterface.sequelize.query('ALTER TABLE `filter` DROP `activeIcon`, DROP `inActiveIcon`');
  },
  down: async (/*queryInterface*/) => {}
};

export default migration;
