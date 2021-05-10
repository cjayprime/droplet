
import { body } from 'express-validator';

import Controller from './base';

import { Authenticate as AuthenticateService } from '../services';

class AuthenticateController extends Controller {
  /**
   * Authenticate a user via firebase
   */
  firebase = [
    body('username')
      .isAlphanumeric()
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
