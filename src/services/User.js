// import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

import { User as UserModel, Audio as AudioModel, Category as CategoryModel, Drop as DropModel } from '../models';
// import { Configuration } from '../shared';

class User {
  static includeForUser = [
    { model: UserModel, required: true },
    { model: AudioModel, required: true },
    { model: CategoryModel, required: true },
  ];

  /**
   * Automatically associate for a User Model, and get all info
   */
  static associateForUser = () => {
    User.includeForUser.map(aInclude => {
      User.generateAssociation(aInclude.model, DropModel);
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
  static generateAssociation = (referenced, ref) => {
    referenced.hasOne(ref, {
      foreignKey: referenced.getTableName() + '_id',
    });
    ref.belongsTo(referenced, {
      foreignKey: referenced.getTableName() + '_id',
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
        { '$user.user_id$': user_id || '' }, { '$user.uid$': user_id || '' }, { '$user.username$': user_id || '' },
      ],
    };
  }
}

export default User;
