import { Op } from 'sequelize';

import {
  User as UserModel,
  Audio as AudioModel,
  SubCloud as SubCloudModel,
  Drop as DropModel,
  FilterUsage as FilterUsageModel
} from '../models';

import { Configuration } from '../shared';

class User {
  static includeForUser = [
    { model: UserModel, required: true },
    { model: AudioModel, required: true },
    { model: SubCloudModel, required: true },
    { model: FilterUsageModel, required: false , foreignKey: 'audio_id', targetKey: 'audio_id' },
  ];

  /**
   * Automatically associate for a User Model, and get all info
   */
  static associateForUser = () => {
    User.includeForUser.map(aInclude => {
      User.generateAssociation(aInclude, aInclude.model, DropModel);
    });
  }

  /**
   * Generate an association (for sequelize), right before a join
   * NOTE:
   * DO NOT CALL sequelize.sync() in the same function as this
   * 
   * @param {Model} referenced 
   * @param {Model} ref 
   */
  static generateAssociation = (obj, referenced, ref) => {
    referenced.hasOne(ref, {
      foreignKey: obj.foreignKey || referenced.getTableName() + '_id',
    });
    ref.belongsTo(referenced, {
      foreignKey: obj.foreignKey || referenced.getTableName() + '_id',
      targetKey: obj.targetKey,
    });
  }

  /**
   * Find a user by user_id, important to note that the leftmost 
   * key MUST be the user_id (BIGINT) primary key
   * 
   * @param {BigInt|String} user_id Generate a sequelize selection for
   *                                use with the `where` key 
   * @returns {Object}
   */
  static searchForUser = (user_id) => {
    return /*!user_id ? {} :*/ {
      [Op.or]: [
        !isNaN(user_id) ? { '$user.user_id$': user_id || '' }
          : { '$user.uid$': user_id || '' }, { '$user.username$': user_id || '' },
      ],
    };
  }

  static getUser = async (uid) => await UserModel.findOne({ where: { ...User.searchForUser(uid) }  });

  /**
   * Update a user
   * 
   * @param {String} username   Username of a user
   * @param {String} user_id        user_id of a user from the AuthService
   */
  update = async (username, user_id) => {
    const user = await User.getUser(user_id);
    if (!user) {
      return {
        code: 400,
        message: 'We were unable to find the user.',
        data: {},
      };
    }

    const [savedUser] = await UserModel.update({
      username,
    }, { where: { ...User.searchForUser(user_id) }  });
    if (!savedUser) {
      return {
        code: 422,
        message: 'We were unable to update your username.',
        data: {},
      };
    }

    const token = Configuration.sign({
      user_id: user.user_id,
      username: user.username,
      uid: user.uid,
      date: user.date,
    });
    return {
      code: 200,
      message:  'Successfully updated the user.',
      data: { token },
    };
  }
}

export default User;
