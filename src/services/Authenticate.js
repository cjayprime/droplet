import fs from 'fs';
import path from 'path';
// import firebase from 'firebase/app';
// import 'firebase/auth';
// import 'firebase/database';
import firebaseAdmin from 'firebase-admin';

import DropService from './Drop';

import { User as UserModel } from '../models';
import { Configuration } from '../shared';

class Authenticate {
  app;
  admin = firebaseAdmin;

  constructor() {
    this.init();
  }

  init = () => {
    if (firebaseAdmin.apps.length === 0) {
      const pathToFile = path.join(
        __dirname,
        '../../firebase-services.json',
      );
      if (!fs.existsSync(pathToFile)){
        fs.writeFileSync(pathToFile, process.env.FIREBASE_KEYFILE, { flag: 'w' });
      }
      const firebaseConfig = {
        databaseURL: 'https://' + process.env.GOOGLE_PROJECT_ID + '.firebaseio.com',
        credential: firebaseAdmin.credential.cert(pathToFile),
      };
      // Initialize Firebase
      this.app = firebaseAdmin.initializeApp(firebaseConfig);
    }
  }

  getAllUsers = async (limit, offset) => {
    return await firebaseAdmin.auth().listUsers(limit, offset);
  }

  getUser = async (username, uid) => {
    if (!this.app) {
      this.init();
    }

    const userSnapshot = await this.admin.firestore()
      .collection('Users')
      .where('uid', '==', uid)
      .where('username', '==', username)
      .limit(1)
      .get();
    let authUser;  
    userSnapshot.forEach(doc => authUser = doc.data());
    return authUser;
  }

  getProfilePicture = async (uid, localFilePath) => {
    try {
      const downloaded = await DropService.bucket('download', localFilePath, `profilepics/${uid}/avatar`, null, 'firebase');
      if (downloaded) {
        return localFilePath;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Sign up/in a user
   * -- How:
   * Check the authentication server (currently firebase) if a user with `username`
   * AND `uid` exist and are the same user. If they are then register the user, OR
   * if they are registered, sign them into this service
   * 
   * @param {String} username   Username of a user
   * @param {String} uid        UID of a user from the AuthService
   */
  authenticate = async (username, uid, type) => {
    let authUser;
    if (type === 'firebase') {
      authUser = await this.getUser(username, uid);
    }

    if (!authUser || (authUser.username !== username || authUser.uid !== uid)) {
      return {
        code: 401,
        message: 'We were unable to authenticate a user that does not exist.',
        data: {},
      };
    }

    const [user, created] = await UserModel.upsert({
      username,
      uid,
      date: new Date(),
    });
    if (user.username !== username || user.uid !== uid) {
      return {
        code: 422,
        message: 'You are not allowed to make this request.',
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
      message:  'Successfully authenticated the user, simply use '+
                'the attached token in the Authentication header of a request.',
      data: { token, created },
    };
  }
}

export default Authenticate;
