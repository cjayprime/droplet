import fs from 'fs';
import path from 'path';
// import firebase from 'firebase/app';
// import 'firebase/auth';
// import 'firebase/database';
import firebaseAdmin from 'firebase-admin';

class Authenticate {
  app;
  admin = firebaseAdmin;

  constructor() {
    this.init();
  }

  init = async () => {
    if (firebaseAdmin.apps.length === 0) {
      const pathToFile = path.join(
        __dirname,
        '../../firebase-services.json',
      );
      if (!fs.existsSync(pathToFile)){
        await fs.promises.writeFile(pathToFile, process.env.FIREBASE_KEYFILE, { flag: 'w' });
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
}

export default Authenticate;
