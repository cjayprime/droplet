import sequelize, { DataTypes } from "./base";

const Marketing = sequelize.define(
  "marketing",
  {
    phonenumber: {
      type: DataTypes.STRING,
      autoIncrement: true,
      primaryKey: true,
    },
  },
  {
    tableName: "marketing",
    timestamps: false,
  }
);

export default Marketing;
