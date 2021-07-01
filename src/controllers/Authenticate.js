
import { body } from 'express-validator';

import Controller from './base';

import { Authenticate as AuthenticateService } from '../services';

class AuthenticateController extends Controller {
  /**
   * Retrieve all options available for tweaking the functionality
   * of the app
   */
  controls = [
    this.action(async (_, res, next) => {
      const authenticateService = new AuthenticateService();
      const response = await authenticateService.controls();
      this.response(res, response.code, response.data, response.message);
      next();
    })
  ];

  /**
   * Authenticate a user via firebase
   */
  firebase = [
    body('username')
      .custom(username => {
        const displayError = () => {
          throw new Error('must be a combination of alphabetic and numeric characters, it can also contain periods without repetitions.');
        };

        if (!username) {
          return displayError();
        }

        let str = username;
        if (str.length > 15) {
          return displayError();
        }
        if (str.charCodeAt(str.length - 1) == 46 || str.charCodeAt(0) == 46) {
          return displayError();
        }

        let found = false;
        for (var i = 0; i < str.length; i++) {
          let x = str.charCodeAt(i);
          if ((x >= 48 && x <= 57) || (x >= 97 && x <= 122) || x == 46) {
            found = true;
          } else {
            return displayError();
          }
          if (i != 0) {
            if (str.charCodeAt(i) == 46 && str.charCodeAt(i - 1) == 46) {
              return displayError();
            }
          }
        }

        if (!found) {
          return displayError();
        }

        return found;
      })
      .withMessage('must be alphanumeric.'),

    body('uid')
      .isAlphanumeric()
      .withMessage('must be alphanumeric.'),

    this.action(async (req, res, next) => {
      const { body: { username, uid } } = req;
      const authenticateService = new AuthenticateService();
      const response = await authenticateService.authenticate(username, uid, 'firebase');
      this.response(res, response.code, response.data, response.message);
      next();
    })
  ];
}

export default AuthenticateController;
