
import { body } from 'express-validator';

import Controller from './base';

import { Analytics as AnalyticsService } from '../services';

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
      const anaylticsService = new AnalyticsService();
      const response = await anaylticsService.authenticate(username, uid);
      this.response(res, response.code, response.data, response.message);
      next();
    })
  ];
}

export default AuthenticateController;
