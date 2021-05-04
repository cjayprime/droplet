import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

import { Authenticate, Drop as DropService, AudioEngine } from '../../services';
import { Audio as AudioModel, Like as LikeModel } from '../../models';
import { Notify } from '../../shared';

const migrations = {
  up: async (/*queryInterface, Sequelize*/) => {
    const authenticate = new Authenticate();
    const size = await authenticate.admin.firestore()
      .collection('Drops').get().then(snap => snap.size);
    const limit = process.env.NODE_ENV === 'development' ? 100 : 1000;
    const move = async (startAt) => {
      console.log('Migration From Firebase To SQL. Total Of', size, 'From', startAt, 'to', startAt + limit - 1);
      const dropsSnapshot = await authenticate.admin.firestore()
        .collection('Drops')
        .orderBy('timeStamp')
        .startAt(startAt)
        .limit(limit)
        .get();
      const drops = [];
      dropsSnapshot.forEach((doc) => {
        console.log('Loading Firebase Doc:', doc.id);
        drops.push({ id: doc.id, data: doc.data() });
      });
      await Promise.all(
        drops.map(async (aDrop, i) => {
          const drop = aDrop.data;
          const { userInfo, caption, category, audioUrl, audioLength, timeStamp, likes } = drop;
          try {
            const user_id = userInfo.uid;
            const tag = uuidv4();
            const timeParts = audioLength.split(':');
            const duration = (+timeParts[0] * 3600) + (+timeParts[1] * 60) + +timeParts[2];
            const date = new Date(timeStamp);
            
            const dropService = new DropService();
            const buffer = await fetch(audioUrl)
              .then(response => response.buffer())
              .catch(e => console.log('Request failed for', tag, e));
              
            // Create an audio
            const newAudio = await AudioModel.create({
              user_id,
              tag,
              duration,
              filesize: buffer.byteLength,
              date,
              source: 'recording',
              trimmed: '0',
            });
            if (!newAudio) {
              Notify.info('Unable to migrate a drop ' + drop.id + ' from firestore to SQL. Failed to create audio.');
              Notify.error(newAudio);
              return;
            }

            const audioEngine = new AudioEngine(buffer, 'binary');
            // Store the file and create a drop from it
            await audioEngine.storeFile(tag);
            const newDrop = await dropService.create(user_id, tag, caption, category || 'convo', false, date);
            if (newDrop.code !== 200){
              Notify.info('Unable to migrate a drop ' + drop.id + ' from firestore to SQL. Failed to create drop.');
              Notify.error(newDrop);
              return;
            }

            // Create the likes
            await Promise.all(
              likes.map(async like => {
                const newLike = await LikeModel.create({
                  user_id: like,
                  drop_id: newDrop.data.drop.drop_id,
                  status: '1',
                  date: new Date(),
                });
                if (newLike.user_id !== like){
                  Notify.info('Failed to add a like from a user (ID: ' + like + ') while migrating a drop ' + drop.id + ' from firestore to SQL.');
                  Notify.error(newLike);
                }
              })
            );

            // Add a {moved: 1} key to the data
            drop.moved = 1;
            await authenticate.admin.firestore().collection('Drops').doc(aDrop.id).set({ ...drop });
            console.log('Successfully migrated document', aDrop.id, 'for belonging to', drop.owner, 'from firebase to SQL.', 
              'Count:', i
            );
          } catch (e) {
            Notify.info('An error occcured while migrating from firestore to SQL. See: firestore drop: ', aDrop.id);
            Notify.error(e);
            console.log('An error occured in the migration for', drop.owner, e);
          }
        })
      );

      if (startAt + 10 <= size) {
        await move(startAt + 10);
      }
    };
    await move(1);
    console.log('Successfully migrated drops from firestore to SQL. See Sentry for any errors.');
  },
  down: async (/*queryInterface, Sequelize*/) => {
    // await queryInterface.dropTable('EditThisModels');
  }
};

export default migrations;
