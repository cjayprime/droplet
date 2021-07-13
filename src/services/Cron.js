import firebaseAdmin from 'firebase-admin';

import { Drop as DropModel, Like as LikeModel } from '../models';
import { promiseAll } from '../shared';

class Cron {
  deleteOldAudioFiles = {
    schedule: '* */6 * * *',
    /**
     * Delete all old audio files to free up space
     * - Once every 2 hours
     */
    action: async () => {
      console.log('DOING NOTHING...');
    },
  };

  rankDrops = {
    schedule: process.env.NODE_ENV === 'production' ? '*/10 * * * *' : '*/1 * * * *',
    /**
     * Add drop rankings to all drops
     * f(l, c) = log (likes + 0.5 * comments + 1) + ((currentDropTime - firstDropTime) / 43200)
     */
    action: async () => {
      const drops = [...await DropModel.findAll()];
      const firstDropTime = new Date(drops[0].date).getTime();

      await promiseAll(async drop => {
        const { drop_id, date } = drop;

        // Get total likes
        const likes = await LikeModel.count({ where: { drop_id } });

        // Get total comments
        const commentSnapshot = await firebaseAdmin.firestore()
          .collection('Comments')
          .where('drop_id', '==', drop_id)
          .get();
        let replies = 0;
        commentSnapshot.forEach(async doc => {
          const repliesSnapshot = await firebaseAdmin.firestore()
            .collection('Replies')
            .where('comment_id', '==', doc.id)
            .get();
          replies += repliesSnapshot.size;
        });
        const comments = commentSnapshot.size + replies;

        // Get current drop timestamp
        const currentDropTime = new Date(date).getTime();

        // Get logarithmic ranking
        const ranking = Math.log10(likes + 0.5 * comments + 1) + ((currentDropTime - firstDropTime) / 43200);

        await DropModel.update({ ranking }, { where: { drop_id } });
      }, drops);
    },
  };
}

export default Cron;
