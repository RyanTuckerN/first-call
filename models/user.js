const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User = sequelize.define(
  "user",
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    passwordhash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: DataTypes.STRING,
    photo: DataTypes.STRING(2048),
    emails: { type: DataTypes.BOOLEAN, defaultValue: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    location: DataTypes.STRING,
    paymentPreference: DataTypes.JSONB,
    specialties: DataTypes.ARRAY(DataTypes.STRING(20)),
  }
  // {
  //   defaultScope: {
  //     attributes: { exclude: ["passwordhash"] },
  //   },

  // }
);



module.exports = User;
