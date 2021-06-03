const migration = {
  up: async (queryInterface) => {
    // Remove all repeating user_id and drop_id in likes
    await queryInterface.sequelize.query('DELETE FROM `like` WHERE `like_id` IN (SELECT * FROM (SELECT `like_id` FROM `like` GROUP BY `drop_id`, `user_id` HAVING COUNT(*) > 1) AS p)');

    // Add Constraint
    await queryInterface.addConstraint('like', {
      fields: ['drop_id', 'user_id'],
      type: 'unique',
      name: 'one_user_like_per_drop',
    });
  },
  down: async (queryInterface) => {
    queryInterface.removeConstraint('like', 'one_user_like_per_drop');
  }
};

export default migration;
