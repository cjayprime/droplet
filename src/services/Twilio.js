import { Twilio as TwilioModel } from "../models";
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhonenumber = process.env.TWILIO_NUMBER;

class Twilio {
  sendSms = async (phoneNumber) => {
    try {
      const data = await TwilioModel.findOne({ where: { phoneNumber } });
      if (!data) {
        const client = require("twilio")(accountSid, authToken);
        const twilioUser = await TwilioModel.create({ phoneNumber });
        if (!twilioUser) {
          return {
            message: "Error occured while creating twilio user",
            data: { err },
            code: 400,
          };
        }
        const message = await client.messages.create({
          body: "Join me on Droplet, the new short-form audio app! https://testflight.apple.com/join/Ye3X3sYu Have fun and please send any feedback to founders@joindroplet.com",
          from: twilioPhonenumber,
          to: phoneNumber,
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
          data: {},
          code: 400,
        };
      }
    } catch (err) {
      return {
        message: "Error occured while sending sms",
        data: { err },
        code: 400,
      };
    }
  };
}

export default Twilio;
