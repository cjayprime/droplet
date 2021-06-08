import sequelize, { DataTypes } from './base';

const Marketing = sequelize.define(
  'marketing',
  {
    marketing_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    phone_number: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'marketing',
    timestamps: false,
  }
);

export default Marketing;
