
import { body } from 'express-validator';

import Controller from './base';

import { Analytics as AnalyticsService } from '../services';

class AnalyticsController extends Controller {
  recordInteraction = [
    body('user_id')
      .notEmpty()
      .withMessage('must be a valid user_id.'),

    body('type')
      .notEmpty()
      .withMessage('must be a valid interaction type.'),

    this.action(async (req, res, next) => {
      const {body: {type, user_id}} = req;
      const anaylticsService = new AnalyticsService();
      const response = await anaylticsService.recordInteraction(type, user_id);
      this.response(res, response.code, response.data, response.message);
      next();
    })
  ];
}

export default AnalyticsController;
