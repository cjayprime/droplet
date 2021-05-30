const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

class Twilio {
  sendSms = async (phoneNumber) => {
    try {
      const message = await client.messages.create({
        body: "Join me on Droplet, the new short-form audio app! https://testflight.apple.com/join/Ye3X3sYu Have fun and please send any feedback to founders@joindroplet.com",
        from: "+15017122661",
        to: phoneNumber,
      });
      console.log("message", message);
      return {
        code: 200,
        message: "Sms sent successfully.",
        data: { message },
      };
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
