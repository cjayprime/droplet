import { Marketing as MarketingService } from "../services";

import Controller from "./base";

class MarketingController extends Controller {
  sendSms = [
    body("phone_number").isMobilePhone().withMessage("must be a valid phone_number."),
    this.action(async (req, res, next) => {
      const { phone_number } = req;
      const marketingService = new MarketingService();
      const response = await marketingService.sendSms(phone_number);
      this.response(res, response.code, response.data, response.message);
      next();
    }),
  ];
}

export default MarketingController;
