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

  /**
   * Signin a user
   * 
   * @param {String}      email           User email
   * @param {String}      mobile          User mobile
   * @param {String}      password        User password
   */
  // signin = async (email, mobile, password) => {
  //   const text = email ? 'email' : 'mobile';

  //   const userModel = new UserModel();
  //   const user = await userModel.select('*', [
  //     email ? { key: 'email', value: email } : { key: 'mobile', value: mobile },
  //   ]).execute();
  //   if (user.empty()) {
  //     return this.responder(
  //       400, {},
  //       'The ' + text + ' and password combination do not match.'
  //     );
  //   }
    
  //   const userData = user.toData(true);
  //   const success = await bcrypt.compare(password, userData.password);
  //   if (!success){
  //     return this.responder(
  //       400, {},
  //       'The ' + text + ' and password combination do not match.'
  //     );
  //   }

  //   delete userData.password;
  //   this.responder(
  //     201, 
  //     { token: Configuration.sign({ ...userData }) },
  //     'Successfully signed in.'
  //   );
  // }

  /**
   * Register a user, this is only ever called by the application
   * TODO:
   * DO NOT ALLOW AN APP WITH STATUS OF '0' THROUGH
   * 
   * @param {Portfolio.application_user_id}       application_id          An application's id
   * @param {Portfolio.application_user_id}       application_user_id     An applications' user's user_id
   * @param {Object}                              metadata                Information identifying an application's user
   */
  // register = async (application_id, application_user_id, metadata) => {
  //   const { email, mobile, firstname, lastname, bvn } = metadata;
  //   const baseUrl = process.env.BASE_URL.replace('api.', '');
      
  //   // If a user with mobile/email already exists with a portfolio for the application then return 202;
  //   const portfolio = await this.hasApplicationPortfolio(application_id, application_user_id, mobile, email);
  //   if (!portfolio.empty()) {
  //     const token = Configuration.sign(portfolio.toData(true).user);
  //     return this.responder(
  //       202,
  //       { url: baseUrl + '/onboarding/' + token + '/' + application_id }, 
  //       'Your application has already been added to the user\'s profile.'
  //     );
  //   }

  //   // If a user with mobile/email does not exist then add one
  //   const userModel = new UserModel();
  //   let user = await userModel.select('*', [email ? { key: 'email', value: email } : { key: 'mobile', value: mobile }]);
  //   let user_id;
  //   if (user.empty()){
  //     user = await userModel.create({
  //       email, firstname, lastname, mobile, code: null, password: null,
  //       bvn, card: null, balance: 0, status: '1', date: () => 'NOW()',
  //     }).execute();
  //     user_id = user.lastInsertId;
  //   } else {
  //     user_id = user.toData(true).user_id;
  //   }

  //   // Create a portfolio (there is none at this point)
  //   const portfolioModel = new PortfolioModel();
  //   await portfolioModel.create({
  //     user_id, application_id, application_user_id,
  //     amount: 0, updated: () => 'NOW()', metadata: JSON.stringify(metadata),
  //     date: () => 'NOW()',
  //   }).execute();

  //   const newUser = await userModel.get(user_id);
  //   const token = Configuration.sign({ ...newUser.toData(true) });
  //   return this.responder(
  //     201,
  //     { url: baseUrl + '/onboarding/' + token + '/' + application_id },
  //     'Successfully added your application to the user\'s profile.'
  //   );
  // }

  /**
   * Updates a user's data
   * Used to achieve step by step onboarding
   *  
   * Onboards a user, by updating their data
   * This method will allow users (malicious inclusive) submit several values at once
   * So some base rules are needed:
   * 1. Never update a value (columns) unless it is NULL.
   * 
   * @param {UserModel.editable}      data        The data to update
   * @param {Number}                  user_id     The decoded JWT auth information of the signed in user
   * @return {void}
   */
  // update = async (data, user_id) => {
  //   const userModel = new UserModel();
  //   const user = await userModel.get(user_id);
  //   if (user.empty()) {
  //     return this.responder(401, {}, 'This account does not exist.');
  //   }
  //   const userData = user.toData(true);

  //   const columns = [];
  //   const values = [];
  //   let errorText = '';
  //   await Promise.all(Object.keys(data).map(async col => {
  //     if (!UserModel.editable.some(editCol => col === editCol)) return;

  //     if (userData[col] !== null) {
  //       throw new Error.make(
  //         'Cannot update the `' + col + '` field, it has already been saved.',
  //         'UserUpdateError',
  //         true,
  //       );
  //     }

  //     // If it is null and 
  //     // exists as an editable column
  //     if (userData[col] === null) {
  //       let value = data[col];
  //       let response = '';
  //       switch (col) {
  //       case 'password':
  //         // Hash the password
  //         value = await bcrypt.hash(data[col], 10);
  //         break;
  //       case 'bvn':
  //         // Check that the BVN is valid
  //         response = await Dojah.bvn.verify(value, userData.firstname, userData.lastname);
  //         value = response === true ? value : null;
  //         errorText = response === true ? '' : response;
  //         break;
  //       case 'mobile':
  //         // To update a mobile number send `mobile` and `code`(OTP) keys
  //         response = await Dojah.otp.verify(data['code'], userData['code']);
  //         value = response === true ? value : null;
  //         errorText = response === true ? '' : response;
  //         break;
  //       default:
  //         value = null;
  //         break;
  //       }
  //       columns.push(col);
  //       values.push(value);
  //     }
  //   }));

  //   let recorded = false;
  //   if (columns.length > 0 && values.length > 0){
  //     recorded = await user.update(columns, values, [{ key: 'user_id', value: user_id }]).execute();
  //     if (recorded.changedRows !== columns.length) {
  //       recorded = false;
  //       errorText = errorText ? errorText : 'You tried updating to the same value.';
  //     }
  //   }
      
  //   this.responder(
  //     recorded ? 200 : 401,
  //     {},
  //     recorded ? 'Successfully updated your account.' : 
  //       errorText || 'You cannot be onboarded at this time. Try again.',
  //   );
  // }
}

export default User;
