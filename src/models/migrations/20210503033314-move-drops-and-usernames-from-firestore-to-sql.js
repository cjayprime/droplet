import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

import { Authenticate, Drop as DropService, AudioEngine } from '../../services';
import { User as UserModel, Audio as AudioModel, Like as LikeModel } from '..';
import { Notify } from '../../shared';

const migrations = {
  up: async (/*queryInterface, Sequelize*/) => {
    try {
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
          console.log('Loading Firebase Doc:', doc.id, doc.data().userInfo.uid);
          if (doc.data().userInfo.uid) {
            drops.push({ id: doc.id, data: doc.data() });
          }
        });
        await Promise.all(
          drops.map(async (aDrop, i) => {
            const drop = aDrop.data;
            const { userInfo, caption, category, audioUrl, audioLength, timeStamp, likes } = drop;
            try {
              // Create a user
              const user = await UserModel.findOrCreate({
                where: {
                  [Op.or]: [{ username: userInfo.username }, { uid: userInfo.uid }],
                },
                defaults: { uid: userInfo.uid, username: userInfo.username, date: new Date() }
              });
              
              if (!user[0].user_id) {
                // console.log('Could not save', userInfo, user);
                Notify.info('Could not save ' + userInfo.uid);
                Notify.error(user);
                return;
              }
              const user_id = user[0].user_id;
                
              // Create an audio
              const tag = uuidv4();
              const timeParts = audioLength.split(':');
              const duration = (+timeParts[0] * 3600) + (+timeParts[1] * 60) + +timeParts[2];
              const date = new Date(timeStamp);
              
              const dropService = new DropService();
              const buffer = await fetch(audioUrl)
                .then(response => response.buffer())
                .catch(e => console.log('Request failed for', tag, e));

              if (!buffer) {
                Notify.info('Could not create buffer. Go to ' + audioUrl);
                Notify.error(userInfo);
                return;
              }

              const newAudio = await AudioModel.create({
                user_id,
                tag,
                duration,
                filesize: buffer ? buffer.byteLength : 0,
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
                likes.map(async () => {
                  const [newLike] = await LikeModel.upsert({
                    user_id,
                    drop_id: newDrop.data.drop.drop_id,
                    status: '1',
                    date: new Date(),
                  });
                  if (newLike.user_id !== user_id) {
                    Notify.info('Failed to add a like from a user (ID: ' + user_id + ') while migrating a drop ' + drop.id + ' from firestore to SQL.');
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
    } catch (e) {
      console.log('Overall error in 20210503033314-move-drops-and-usernames-from-firestore-to-sql migration', e);
    }
  },
  down: async (/*queryInterface, Sequelize*/) => {
  }
};

export default migrations;
