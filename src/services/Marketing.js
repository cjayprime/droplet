import { Marketing as MarketingModel } from "../models";
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhonenumber = process.env.TWILIO_NUMBER;
const client = require("twilio")(accountSid, authToken);

class Marketing {
  sendSms = async (phone_number) => {
    try {
      const data = await MarketingModel.findOne({ where: { phone_number } });
      if (!data) {
        if(phone_number > 15) return {
            message: "The phone number is invalid",
            data: { err: "invalidPhoneNumber" },
            code: 400,
          }
        const user = await MarketingModel.create({ phone_number });
        if (!user) {
          return {
            message: "Couldnt store the phone number",
            data: { },
            code: 400,
          };
        }
        const message = await client.messages.create({
          body: "Join me on Droplet, the new short-form audio app! https://testflight.apple.com/join/Ye3X3sYu Have fun and please send any feedback to founders@joindroplet.com",
          from: twilioPhonenumber,
          to: phone_number,
        });
        console.log("message", message);
        return {
          code: 200,
          message: "Sms sent successfully",
          data: { message },
        };
      } else {
        return {
          message: "Sms already sent",
          data: { err: "smsAlreadySent" },
          code: 400,
        };
      }
    } catch (err) {
      return {
        message: "Error occured while sending sms",
        data: { },
        code: 400,
      };
    }
  };
}

export default Marketing;
