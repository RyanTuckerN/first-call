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
    location: DataTypes.STRING,
    paymentPreference: DataTypes.JSONB,
    following: {type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: []},
    followers: {type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: []},
  }
);



module.exports = User;
