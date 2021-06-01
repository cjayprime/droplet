import sequelize, { DataTypes } from "./base";

const Twilio = sequelize.define(
  "twilio",
  {
    phoneNumber: {
      type: DataTypes.STRING,
      autoIncrement: true,
      primaryKey: true,
    },
  },
  {
    tableName: "twilio",
    timestamps: false,
  }
);

export default Twilio;
