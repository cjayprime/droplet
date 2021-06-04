import { Marketing as MarketingService } from "../services";

import Controller from "./base";

class MarketingController extends Controller {
  sendSms = [
    body("phonenumber").notEmpty().withMessage("must be a valid phonenumber."),
    this.action(async (req, res, next) => {
      const { phonenumber } = req;
      const marketingService = new MarketingService();
      const response = await marketingService.sendSms(phonenumber);
      this.response(res, response.code, response.data, response.message);
      next();
    }),
  ];
}

export default MarketingController;
