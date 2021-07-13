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
    schedule: process.env.NODE_ENV === 'production' ? '*/10 * * * *' : '*/30 * * * *',
    /**
     * Add drop rankings to all drops
     * f(l, c) = log (likes + 0.5 * comments + 1) + ((currentDropTime - firstDropTime) / 43200)
     */
    action: async () => {
      const drops = [...await DropModel.findAll()];
      const firstDropTime = 1623718861;

      await promiseAll(async drop => {
        const { drop_id, date } = drop;

        // Get total likes
        const likes = await LikeModel.count({ where: { drop_id, status: '1' } });

        // Get total comments
        const commentSnapshot = await firebaseAdmin.firestore()
          .collection('Comments')
          .where('drop_id', '==', drop_id)
          .get();
        let replies = 0;
        const commentIDs = [];
        await commentSnapshot.forEach(async doc => {
          commentIDs.push(doc.id);
        });
        await promiseAll(async id => {
          const repliesSnapshot = await firebaseAdmin.firestore()
            .collection('Replies')
            .where('comment_id', '==', id)
            .get();
          replies += repliesSnapshot.size;
        }, commentIDs);
        const comments = commentSnapshot.size + replies;

        // Get current drop timestamp
        const currentDropTime = Math.round(new Date(date).getTime() / 1000);

        // Get logarithmic ranking
        const ranking = Math.log10(likes + 0.5 * comments + 1) + ((currentDropTime - firstDropTime) / 43200);
        // console.log('ranking', drop_id, ranking, comments - replies, replies, likes, date, currentDropTime);

        await DropModel.update({ ranking }, { where: { drop_id } });
      }, drops);
    },
  };
}

export default Cron;
