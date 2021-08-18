import { createObjectCsvWriter } from 'csv-writer';
import { Op } from 'sequelize';

import Authenticate from './Authenticate';
import UserService from './User';

import { promiseAll } from '../shared';

import { Like as LikeModel, Audio as AudioModel, Cloud as CloudModel, Interaction as InteractionModel, Listen as ListenModel, Drop as DropModel, SubCloud as SubCloudModel, Filter as FilterModel, FilterUsage as FilterUsageModel, Group as GroupModel, User as UserModel, Seen as SeenModel } from '../models';

const authenticate = new Authenticate();
class Analytics {
  analyze = async () => {
    UserService.generateAssociation({}, SubCloudModel, DropModel);
    UserService.generateAssociation({}, DropModel, LikeModel);
    UserService.generateAssociation({}, DropModel, ListenModel);
    UserService.generateAssociation({}, DropModel, SeenModel);

    const privateClouds = await SubCloudModel.count({ where: { user_id: null } });
    const privateDrops = await DropModel.count({ include: [{ model: SubCloudModel, required: true }], where: { '$sub_cloud.user_id$': { [Op.not]: null } } });
    const privateLikes = await DropModel.count({ include: [{ model: SubCloudModel, required: true }, { model: LikeModel, required: true }], where: { '$sub_cloud.user_id$': { [Op.not]: null } } });
    const privateListens = await DropModel.count({ include: [{ model: SubCloudModel, required: true }, { model: ListenModel, required: true }], where: { '$sub_cloud.user_id$': { [Op.not]: null } } });
    const privateSeen = await DropModel.count({ include: [{ model: SubCloudModel, required: true }, { model: SeenModel, required: true }], where: { '$sub_cloud.user_id$': { [Op.not]: null } } });

    const total = { privateClouds, privateDrops, privateLikes, privateListens, privateSeen };
    const models = [
      AudioModel,
      CloudModel,
      DropModel,
      FilterModel,
      FilterUsageModel,
      GroupModel,
      InteractionModel,
      LikeModel,
      ListenModel,
      SeenModel,
      SubCloudModel,
      UserModel,
    ];
    await promiseAll(async (model) => {
      total[model.getTableName()] = await model.count();
    }, models);

    return {
      code: 200,
      data: { total },
      message: 'Successfully generated analytics data.',
    };
  }

  fullAnalyze = async ( data = [], token) => {
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
          interactions[type] = await InteractionModel.count({ where: { type, user_id } });
        })
      );

      // Get total listens per cloud
      const subClouds = await SubCloudModel.findAll({ attributes: ['name', 'sub_cloud_id'], where: { status: '1' } });
      const listen = {};
      await Promise.all(subClouds.map(async subCloud => {
        const values = subCloud.dataValues;
        const [subCloudName] = await DropModel.sequelize.query(
          {
            query: `
              SELECT COUNT(listens.subCloudName) AS total FROM (
                SELECT sub_cloud.name AS subCloudName FROM listen
                INNER JOIN \`drop\` ON listen.drop_id = \`drop\`.drop_id
                INNER JOIN sub_cloud ON sub_cloud.sub_cloud_id = \`drop\`.sub_cloud_id AND listen.drop_id = \`drop\`.drop_id
                WHERE listen.user_id = ? AND sub_cloud.status = ? AND sub_cloud.name = ?
              ) AS listens
            `,
            values: [user_id, '1', values.name],
          }
        );
        listen[values.name] = subCloudName[0].total;
      }));

      // Get the total audio per source
      const audio = {};
      await Promise.all(
        ['upload', 'recording'].map(async (source) => {
          audio[source] = await AudioModel.count({ where: { user_id, source } });
        })
      );

      // Get total drops
      let drops = await DropModel.count({ where: { user_id } });
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
      data: { all: data },
      message: 'Successfully recorded listen.',
    };
  }

  recordInteraction = async (type, user_id) => {
    const user = await UserService.getUser(user_id);
    if (user === null) {
      return {
        code: 400,
        message: 'The user does not exist.',
        data: {},
      };
    }

    const newInteraction = await InteractionModel.create({
      type,
      user_id: user_id === 'NO-ACCOUNT' ? 0 : user.user_id,
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
    const user = await UserService.getUser(user_id);
    if (user === null) {
      return {
        code: 400,
        message: 'The user does not exist.',
        data: {},
      };
    }

    const newInteraction = await ListenModel.create({
      user_id: user.user_id,
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

    const listens = await LikeModel.count({
      where: { drop_id: newInteraction.drop_id },
    });
    return {
      code: 200,
      data: { listens },
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
          { id: 'user_id', title: 'User' },
          { id: 'interactions.app-open', title: 'App Open' },
          { id: 'interactions.app-close', title: 'App Close' },
          { id: 'listen.comedy', title: 'Comedy Listen' },
          { id: 'listen.convo', title: 'Convo Lsiten' },
          { id: 'listen.asmr', title: 'Asmr Listen' },
          { id: 'listen.music', title: 'Music Listen' },
          { id: 'audio.recording', title: 'Drop Record' },
          { id: 'audio.upload', title: 'Drop Upload' },
          { id: 'drops', title: 'Drop Post' },
          { id: 'likes', title: 'Drop Likes' },
          { id: 'comments', title: 'Comments' },
        ],
      });

      const newData = [...data];
      newData.map(dataPoint => {
        Object.keys(dataPoint).map(key => {
          if (typeof dataPoint[key] === 'object') {
            Object.keys(dataPoint[key]) // { interactions: {'app-open', 'app-close'} ... }
              .map(innerPoint => dataPoint[key + '.' + innerPoint] = dataPoint[key][innerPoint]);
          }
        });

        return { ...dataPoint, };
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
