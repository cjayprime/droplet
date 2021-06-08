import { Notify } from '../../shared';

const migration = {
  up: async (queryInterface) => {
    // Remove all repeating user_id and drop_id in likes
    // GCP doesn't give necessary SUPER ADMIN permissions for group by queries to work.
    // const [_likes] = await queryInterface.sequelize.query('SELECT `like_id`, drop_id, user_id, COUNT(drop_id) AS drop_ids, COUNT(user_id) AS user_ids FROM `like` GROUP BY `drop_id`, `user_id` HAVING COUNT(*) > 1');
    const [_likes] = await queryInterface.sequelize.query('SELECT * FROM `like`');
    const likes = JSON.parse(JSON.stringify(_likes));

    const found = [];
    for (let i = 0; i < likes.length; i++) {
      const like = likes[i];
      if (found.some(l => l.drop_id === like.drop_id && l.user_id === like.user_id)) {
        const [success] = await queryInterface.sequelize.query(
          `DELETE FROM \`like\` WHERE like_id = ${like.like_id}`, { logging: console.log, raw: true, }
        );

        if (success.affectedRows <= 0) {
          Notify.info('Unable to delete like: ' + likes[i].like_id);
        }
      }
      
      found.push(like);
    }

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
