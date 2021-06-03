import { Notify } from '../../shared';

const migration = {
  up: async (queryInterface) => {
    // Remove all repeating user_id and drop_id in likes
    const [_likes] = await queryInterface.sequelize.query('SELECT `like_id`, drop_id, user_id, COUNT(drop_id) AS drop_ids, COUNT(user_id) AS user_ids FROM `like` GROUP BY `drop_id`, `user_id` HAVING COUNT(*) > 1');
    const likes = JSON.parse(JSON.stringify(_likes));

    for (let i = 0; i < likes.length; i++) {
      const like = likes[i];
      const [success] = await queryInterface.sequelize.query(
        `DELETE FROM \`like\` WHERE drop_id = ${like.drop_id} AND user_id = ${like.user_id} AND like_id != ${like.like_id}`, { logging: console.log, raw: true, }
      );
        
      if (success.affectedRows > 0) {
        Notify.info('Unable to delete like: ' + likes[i].like_id);
      }
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
