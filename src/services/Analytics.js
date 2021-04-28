import {createObjectCsvWriter} from 'csv-writer';

import Authenticate from './Authenticate';

import {Audio as AudioModel, Interaction as InteractionModel, Listen as ListenModel, Drop as DropModel, Category as CategoryModel} from '../models';

const authenticate = new Authenticate();
class Analytics {
  analyze = async (data = [], token) => {
    const userData = await authenticate.getAllUsers(
      process.env.NODE_ENV === 'development' ? 10 : 1000,
      token
    );
    const users = userData.users;

    await Promise.all(users.map(async (user) => {
      const user_id = user.uid;

      // Get all interaction per type
      const interactions = {};
      await Promise.all(
        ['app-open', 'app-close'].map(async (type) => {
          interactions[type] = await InteractionModel.count({where: {type, user_id}});
        })
      );

      // Get total listens per category
      const categories = await CategoryModel.findAll({attributes: ['name', 'category_id'], where: {status: '1'}});
      const listen = {};
      await Promise.all(categories.map(async category => {
        const values = category.dataValues;
        const [categoryName] = await DropModel.sequelize.query(
          {
            query: `
              SELECT COUNT(listens.categoryName) AS total FROM (
                SELECT category.name AS categoryName FROM listen
                INNER JOIN \`drop\` ON listen.drop_id = \`drop\`.drop_id
                INNER JOIN category ON category.category_id = \`drop\`.category_id AND listen.drop_id = \`drop\`.drop_id
                WHERE listen.user_id = ? AND category.status = ? AND category.name = ?
              ) AS listens
            `,
            values: [user_id, '1', values.name],
          }
        );
        listen[values.name] = categoryName[0].total;
      }));

      // Get the total audio per source
      const audio = {};
      await Promise.all(
        ['upload', 'recording'].map(async (source) => {
          audio[source] = await AudioModel.count({where: {user_id, source}});
        })
      );

      // Get total drops
      let drops = await DropModel.count({where: {user_id}});
      if (drops === 0) {
        const dropsSnapshot = await authenticate.admin.firestore()
          .collection('Drops')
          .where('userInfo.uid', '==', user_id)
          .get();
        drops = dropsSnapshot.docs.length;
      }

      // Get total likes
      let likes = 0;
      const likeSnapshot = await authenticate.admin.firestore()
        .collection('Drops')
        .where('userInfo.uid', '==', user_id)
        .get();
      likeSnapshot.forEach(doc => likes += doc.data().likes.length);

      // Get total comments
      let comments = 0;
      const commentSnapshot = await authenticate.admin.firestore()
        .collection('Comments')
        .where('posterInfo.uid', '==', user_id)
        .get();
      comments += commentSnapshot.docs.length;

      // console.log('ANALYTICS:', user_id, interactions, listen, audio, drops);

      data.push({
        user_id,
        interactions: {
          ...interactions,
          'app-open': interactions['app-open'] || drops,
          'app-close': interactions['app-close'] || drops
        },
        listen,
        audio,
        drops,
        likes,
        comments,
      });
    }));

    if (userData.pageToken) {
      console.log('Re-executing for:', userData.pageToken);
      // List next batch of users.
      return await this.analyze(data, userData.pageToken);
    }

    return {
      code: 200,
      data: {all: data},
      message: 'Successfully recorded listen.',
    };
  }

  recordInteraction = async (type, user_id) => {
    const newInteraction = await InteractionModel.create({
      type,
      user_id: user_id === 'NO_ACCOUNT' ? 0 : user_id,
      date: new Date(),
    });

    if (newInteraction.type !== type) {
      return {
        code: 400,
        data: {},
        message: 'Unable to record interaction.',
      };
    }

    return {
      code: 200,
      data: {},
      message: 'Successfully recorded interaction.',
    };
  }

  recordListen = async (user_id, drop_id) => {
    const newInteraction = await ListenModel.create({
      user_id: user_id === 'NO_ACCOUNT' ? 0 : user_id,
      drop_id,
      date: new Date(),
    });

    if (newInteraction.drop_id != drop_id) {
      return {
        code: 400,
        data: {},
        message: 'Unable to record listen.',
      };
    }

    return {
      code: 200,
      data: {},
      message: 'Successfully recorded listen.',
    };
  }

  generateCSV = async () => {
    const response = await this.analyze();
    const data = response.data.all;
    if (data.length > 0) {
      const csvWriter = createObjectCsvWriter({
        path: 'analytics.csv',
        header: [
          {id: 'user_id', title: 'User'},
          {id: 'interactions.app-open', title: 'App Open'},
          {id: 'interactions.app-close', title: 'App Close'},
          {id: 'listen.comedy', title: 'Comedy Listen'},
          {id: 'listen.convo', title: 'Convo Lsiten'},
          {id: 'listen.asmr', title: 'Asmr Listen'},
          {id: 'listen.music', title: 'Music Listen'},
          {id: 'audio.recording', title: 'Drop Record'},
          {id: 'audio.upload', title: 'Drop Upload'},
          {id: 'drops', title: 'Drop Post'},
          {id: 'likes', title: 'Drop Likes'},
          {id: 'comments', title: 'Comments'},
        ],
      });

      const newData = [...data];
      newData.map(dataPoint => {
        // const keys = dataPoint; // dataPoint is {user_id, interactions ...}
        Object.keys(dataPoint).map(key => {
          if (typeof dataPoint[key] === 'object') {
            Object.keys(dataPoint[key]) // { interactions: {'app-open', 'app-close'} ... }
              .map(innerPoint => dataPoint[key + '.' + innerPoint] = dataPoint[key][innerPoint]);
          }
        });

        return {...dataPoint, };
      });
      console.log(newData);
      csvWriter
        .writeRecords(data)
        .then(()=> console.log('The CSV file was written successfully'))
        .catch(e => console.log('CSV Error:', e));
    } else {
      console.log('THERE WAS NO DATA');
      return false;
    }
  }
}

export default Analytics;
