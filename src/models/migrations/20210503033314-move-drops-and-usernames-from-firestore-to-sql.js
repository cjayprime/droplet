import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

import { Authenticate, Drop as DropService, AudioEngine } from '../../services';
import { User as UserModel, Audio as AudioModel, Like as LikeModel } from '../';
import { Notify } from '../../shared';

const authenticate = new Authenticate();
const migrations = {
  up: async (/*queryInterface, Sequelize*/) => {
    try {
      const dropSize = await authenticate.admin.firestore()
        .collection('Drops').get().then(snap => snap.size);
      console.log('-- Migration Drops From Firebase To SQL. Total Of', dropSize);
      const dropsSnapshot = await authenticate.admin.firestore()
        .collection('Drops')
        // .orderBy('timeStamp')
        // .startAt(0)
        // .limit(10000000000000000000000000)
        .get();

      // Copy drops
      const drops = [];
      let totalBadData = 0;
      dropsSnapshot.forEach((doc) => {
        const data = doc.data();
        let { userInfo, caption, audioUrl, audioLength, likes, category, timeStamp } = data;

        if (!caption) {
          caption = 'A caption';
        }
        
        if (!category) {
          category = 'Relax';
        }

        if (!userInfo || !userInfo.username || !userInfo.uid || !caption || !audioUrl || !audioLength || !likes || !category || !timeStamp) {
          totalBadData++;
          const missing = {};
          Object.keys({ userInfo: '', caption: '', audioUrl: '', audioLength: '', likes: '', owner: '', category: '', timeStamp: '', allowedToView: '', }).map(key => {
            missing[key] = !!data[key];
          });
          console.log('Invalid Drop', doc.id, missing);
          return;
        }

        drops.push({ id: doc.id, data: { userInfo, caption, audioUrl, audioLength, likes, category, timeStamp } });
      });
      console.log('Size of Drop Data:', 'Total:', dropSize, 'Bad:', totalBadData, 'Picked:', drops.length);

      const alreadyLiked = [];
      const migrateDrop = async (i) => {
        const drop = drops[i].data;
        const { userInfo, caption, category: subCloud, audioUrl, audioLength, timeStamp, likes } = drop;
        try {
          // Create a user
          const oldUser = await UserModel.findOne({ where: {
            [Op.or]: [{ username: userInfo.username }, { uid: userInfo.uid }],
          } });
          let user;
          if (!oldUser) {
            user = await UserModel.create({
              date: new Date(),
              username: userInfo.username,
              uid: userInfo.uid,
            });
          } else {
            user = oldUser;
          }

          if (!user.user_id) {
            Notify.info(i + ' Could not save ' + userInfo.uid);
            Notify.error(user);
            if ((i + 1) < drops.length) {
              await migrateDrop(i + 1);
            }
            return;
          }
          const user_id = user.user_id;
                
          // Create an audio
          const tag = uuidv4();
          const timeParts = audioLength.split(':');
          const duration = ((+timeParts[0] * 60) + (+timeParts[1]) + (+timeParts[2] / 100)) * 1000;
          const date = new Date(timeStamp);
              
          const dropService = new DropService();
          const buffer = await fetch(audioUrl)
            .then(response => response.buffer())
            .catch(e => console.log('Request failed for', tag, e));

          if (!buffer) {
            Notify.info(i + ' Could not create buffer. Go to ' + audioUrl);
            Notify.error(userInfo);
            if ((i + 1) < drops.length) {
              await migrateDrop(i + 1);
            }
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
            Notify.info(i + ' Unable to migrate a drop ' + drops[i].id + ' from firestore to SQL. Failed to create audio.');
            Notify.error(newAudio);
            if ((i + 1) < drops.length) {
              await migrateDrop(i + 1);
            }
            return;
          }

          const audioEngine = new AudioEngine(buffer, 'binary');
          // Store the file and create a drop from it
          await audioEngine.storeFile(tag);
          const newDrop = await dropService.create(user_id, tag, caption.substr(0, 70), subCloud === 'Relax' ? 'Relax' : subCloud === 'convo' ? 'Daily Update' : subCloud === 'asmr' ? 'Relax' : subCloud === 'music' ? 'Songwriters / Music Producers' : 'Open Mic and Comedy', false, null, date);
          if (newDrop.code !== 200){
            Notify.info(i + ' Unable to migrate a drop ' + drops[i].id + ' from firestore to SQL. Failed to create drop.');
            Notify.error(newDrop);
            if ((i + 1) < drops.length) {
              await migrateDrop(i + 1);
            }
            return;
          }

          // Create the likes
          await Promise.all(
            likes.map(async () => {
              if (alreadyLiked.some(like => like.drop_id === newDrop.data.drop.drop_id && like.user_id === user_id)) {
                return;
              }
              const newLike = await LikeModel.create({
                user_id,
                drop_id: newDrop.data.drop.drop_id,
                status: '1',
                date: new Date(),
              });
              if (!newLike || newLike.user_id !== user_id) {
                Notify.info('Failed to add a like from a user (ID: ' + user_id + ') while migrating a drop ' + drops[i].id + ' from firestore to SQL.');
                Notify.error(newLike);
              } else {
                alreadyLiked.push({ drop_id: newDrop.data.drop.drop_id, user_id });
              }
            })
          );

          // Add {moved, drop_id} to the data
          drop.moved = 1;
          drop.drop_id = newDrop.data.drop.drop_id;
          await authenticate.admin.firestore().collection('Drops').doc(drops[i].id).set({ ...drop });


          let commentID;
          let comment = {};
          const commentSnapshot = await authenticate.admin.firestore().collection('Comments').where('dropId', '==', drops[i].id).get();
          commentSnapshot.forEach(doc => {
            commentID = doc.id;
            comment = {
              ...doc.data(),
              drop_id: newDrop.data.drop.drop_id,
              id: doc.id,
            };
          });
          if (commentID) {
            await authenticate.admin.firestore().collection('Comments').doc(commentID).set({ ...comment });
          }

          console.log(
            i,
            'Successfully migrated drop',
            drops[i].id,
            'belonging to',
            drop.userInfo.username,
            'and updated comment:',
            commentID,
            'from firebase to SQL',
            '\n',
          );
          if ((i + 1) < drops.length) {
            await migrateDrop(i + 1);
          }
          return;

        } catch (e) {
          Notify.info('An error occcured while migrating from firestore to SQL. See: firestore drop: ', drops[i].id);
          Notify.error(e);
        }
      };
      await migrateDrop(0);
      console.log('Successfully migrated drops from firestore to SQL. See Sentry for any errors.');



      // Copy users
      const userSize = await authenticate.admin.firestore()
        .collection('Users').get().then(snap => snap.size);
      console.log('-- Migrating Users From Firebase To SQL. Total Of', userSize);
      const usersSnapshot = await authenticate.admin.firestore()
        .collection('Users')
        .get();

      totalBadData = 0;
      const users = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        const { username, uid } = data;
        if (!username || !uid) {
          totalBadData++;
          console.log('Invalid User', username, uid);
          return;
        } else if (users.some(user => user.username === username || user.uid === uid)) {
          totalBadData++;
          console.log('Repeated User', username, uid);
          return;
        }
        users.push({ username, uid });
      });
      console.log('Size of User Data:', 'Total:', userSize, 'Bad:', totalBadData, 'Picked:', users.length);

      const migrateUser = async (i) => {
        const user = users[i];
        const oldUser = await UserModel.findOne({ where: {
          [Op.or]: [{ username: user.username }, { uid: user.uid }],
        } });
        let newUser;
        if (!oldUser) {
          newUser = await UserModel.create({
            date: new Date(),
            username: user.username,
            uid: user.uid,
          });
        } else {
          newUser = oldUser;
        }

        if (!newUser.user_id) {
          Notify.info(i + ' Could not save ' + newUser.uid);
          Notify.error(user);
        }
          
        if ((i + 1) < users.length) {
          await migrateUser(i + 1);
        }
      };
      await migrateUser(0);
    } catch (e) {
      console.log('Overall error in 20210503033314-move-drops-and-usernames-from-firestore-to-sql migration', e);
    }
  },
  down: async (/*queryInterface, Sequelize*/) => {
  }
};

export default migrations;
