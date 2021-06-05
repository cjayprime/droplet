import sequelize, { DataTypes } from "./base";

const Marketing = sequelize.define(
  "marketing",
  {
    phone_number: {
      type: DataTypes.VARCHAR(15),
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
