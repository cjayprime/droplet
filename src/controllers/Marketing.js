import { body } from 'express-validator';

import Controller from './base';

import { Marketing as MarketingService } from '../services';

class MarketingController extends Controller {
  sendSms = [
    body('phoneNumber')
      .isMobilePhone()
      .withMessage('must be a valid mobile number.'),

    this.action(async (req, res, next) => {
      const { phoneNumber } = req.body;
      const marketingService = new MarketingService();
      const response = await marketingService.sendSms(phoneNumber);
      this.response(res, response.code, response.data, response.message);
      next();
    }),
  ];
}

export default MarketingController;
