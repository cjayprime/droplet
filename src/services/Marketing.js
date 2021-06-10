import Twilio from "twilio";
import { Marketing as MarketingModel } from "../models";

class Marketing {
  smsClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  sendSms = async (phone_number) => {
    console.log("phone_number:", phone_number);
    if (phone_number.length > 15) {
      return {
        message: "The phone number is invalid",
        data: { err: "invalidPhoneNumber" },
        code: 400,
      };
    }

    const mobile = await MarketingModel.findOne({ where: { phone_number } });
    if (mobile) {
      return {
        message: "Sms already sent",
        data: { err: "smsAlreadySent" },
        code: 400,
      };
    }

    this.smsClient.messages
      .create({
        body:
          "Join me on Droplet, the new short-form audio app! " +
          "https://testflight.apple.com/join/Ye3X3sYu Have fun " +
          "and please send any feedback to founders@joindroplet.com",
        from: process.env.TWILIO_NUMBER,
        to: phone_number,
      })
      .then(() => {
        const user = await MarketingModel.create({
          phone_number,
          date: new Date(),
        });
        if (!user) {
          return {
            message: "An error occurred with your phone number",
            data: {},
            code: 400,
          };
        }
        return {
          code: 200,
          message: "Sms sent successfully",
          data: {},
        };
      })
      .catch((error) => {
        return {
          code: 400,
          message: "Couldnt send the sms",
          data: {},
        };
      });
  };
}

export default Marketing;
