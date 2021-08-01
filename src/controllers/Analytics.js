
import { body } from 'express-validator';

import Controller from './base';

import { Analytics as AnalyticsService } from '../services';

class AnalyticsController extends Controller {
  /**
   * Record interations with the platform
   * For listens see `recordListen`
   *
   * @param {Express.Response}    res     Express[.response] response object
   * @param {Express.Request}     req     Express[.request] request object
   * @param {Express.next}        next    Express callback to move to the next middleware
   * @return {void} void
   */
  recordInteraction = [
    body('type')
      .notEmpty()
      .withMessage('must be a valid interaction type.'),

    this.action(async (req, res, next) => {
      const { account: { user_id, uid }, body: { type } } = req;
      const anaylticsService = new AnalyticsService();
      const response = await anaylticsService.recordInteraction(type, user_id || uid);
      this.response(res, response.code, response.data, response.message);
      next();
    })
  ];

  /**
   * Record a listen (to a drop) within the app
   */
  recordListen = [
    body('drop_id')
      .isInt()
      .withMessage('must be a valid drop.'),

    this.action(async (req, res, next) => {
      const { account: { user_id, uid }, body: { drop_id } } = req;
      const anaylticsService = new AnalyticsService();
      const response = await anaylticsService.recordListen(user_id || uid, drop_id);
      this.response(res, response.code, response.data, response.message);
      next();
    })
  ];

  analyze = [
    this.action(async (_, res, next) => {
      const anaylticsService = new AnalyticsService();
      const response = await anaylticsService.analyze();
      this.response(res, response.code, response.data, response.message);
      next();
    })
  ];
}

export default AnalyticsController;
