import { Twilio as TwilioService } from "../services";

import Controller from "./base";

class TwilioController extends Controller {
  sendSms = [
    body("phoneNumber").notEmpty().withMessage("must be a valid phoneNumber."),
    this.action(async (req, res, next) => {
      const { phoneNumber } = req;
      const twilioService = new TwilioService();
      const response = await twilioService.sendSms(phoneNumber);
      this.response(res, response.code, response.data, response.message);
      next();
    }),
  ];
}

export default TwilioController;
